// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

import { kebabCase } from './utils/caseChange';
import { colorConstructor } from './utils/colorConstructor';

function formatVariableOutput(name: string, value: RGB | RGBA, mode?: string): string {
  return mode 
    ? `${kebabCase(name)}-${kebabCase(mode)}: ${colorConstructor(value)}`
    : `${kebabCase(name)}: ${colorConstructor(value)}`;
}

figma.ui.onmessage =  async (msg: {type: string, count: number}) => {
  
  if (msg.type === 'variables') {
    const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const colors: string[] = [];
    
    for (const collection of localCollections) {
      console.log('====== COLLECTION ========================')
      
      console.log(`Collection:`, {
        id: collection.id,
        name: collection.name,
        modes: collection.modes,
        variableIds: collection.variableIds
      });

      const modes = collection.modes;
      console.log(modes)
      
      const variableList = collection.variableIds;
      console.log(variableList)

      for (const variableId of variableList) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        
        if (variable && variable.resolvedType === "COLOR") {
          const valuesByMode = variable.valuesByMode;
          
          for (const modeId in valuesByMode) {
            const modeName = modes.find(mode => mode.modeId === modeId)?.name ?? 'default';

            if (typeof valuesByMode[modeId] === 'object' && 'r' in valuesByMode[modeId]) {
              colors.push(formatVariableOutput(variable.name, valuesByMode[modeId], modeName));
            } else if (typeof valuesByMode[modeId] === 'object' && 
                'type' in valuesByMode[modeId] && 
                valuesByMode[modeId].type === 'VARIABLE_ALIAS') {
              const alias = await figma.variables.getVariableByIdAsync(valuesByMode[modeId].id);
              if (alias) {
                console.log('Alias details:', {
                  id: alias.id,
                  name: alias.name,
                  resolvedType: alias.resolvedType,
                  valuesByMode: alias.valuesByMode,
                  variableCollectionId: alias.variableCollectionId,
                  remote: alias.remote,
                  description: alias.description,
                  hiddenFromPublishing: alias.hiddenFromPublishing,
                  scopes: alias.scopes
                });
              }
            }
          }
        }
      }
    }

    console.log('Final colors:', colors);
    figma.closePlugin();
  }
};
