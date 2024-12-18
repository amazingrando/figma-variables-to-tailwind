// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

function colorConstructor(value: { r?: number; g?: number; b?: number; a?: number }): string {
  if (!value || typeof value !== 'object') {
    return 'rgba(0, 0, 0, 0)';
  }
  const { r = 0, g = 0, b = 0, a = 1 } = value;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

// async function retrieveVariable(variableId: any): any {
//   const variable = await figma.variables.getVariableByIdAsync(variableId);

//   if (variable) { 
//     console.log(' === VARIABLE ===')
//     console.log('     variable.id', variable.id)
//     console.log('     variable.codeSyntax', variable.codeSyntax)
//     console.log('     variable.description', variable.description)
//     console.log('     variable.hiddenFromPublishing', variable.hiddenFromPublishing)
//     console.log('     variable.key', variable.key)
//     console.log('     variable.name', variable.name)
//     console.log('     variable.remote', variable.remote)
//     console.log('     variable.resolvedType', variable.resolvedType)
//     console.log('     variable.scopes', variable.scopes)
//     console.log('     variable.valuesByMode', variable.valuesByMode)
//     console.log('     variable.variableCollectionId', variable.variableCollectionId)
//   }

//   return variableId;
// }


// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage =  async (msg: {type: string, count: number}) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  // if (msg.type === 'create-shapes') {
  //   // This plugin creates rectangles on the screen.
  //   const numberOfRectangles = msg.count;

  //   const nodes: SceneNode[] = [];
  //   for (let i = 0; i < numberOfRectangles; i++) {
  //     const rect = figma.createRectangle();
  //     rect.x = i * 150;
  //     rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
  //     figma.currentPage.appendChild(rect);
  //     nodes.push(rect);
  //   }
  //   figma.currentPage.selection = nodes;
  //   figma.viewport.scrollAndZoomIntoView(nodes);
  // }

  if (msg.type === 'variables') {
    const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
    // console.log('localCollections', localCollections);
    
    // Use a for...of loop instead of forEach for proper async handling
    for (const collection of localCollections) {
      console.log('====== COLLECTION ========================')
      
      console.log(`Collection:`, {
        id: collection.id,
        name: collection.name,
        modes: collection.modes,
        variableIds: collection.variableIds
      });

      console.log('Modes: ', collection.modes.length)
      console.log('Variables: ', collection.variableIds.length)

      // Loop through each variableId in the collection
      for (const variableId of collection.variableIds) {
        // console.log('variableId', variableId);

        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (variable && variable.resolvedType === "COLOR") {
            const modes = variable.valuesByMode as Record<string, VariableValue>;
            for (const modeId in modes) {
                const value = modes[modeId];
                console.log('   Mode:', modeId, 'Value:', value);
                if (typeof value === 'object' && 'r' in value) {  // Type guard for RGB/RGBA
                    console.log(`${variable.name}: ${colorConstructor(value)}`)
                }
            }
        }
        // console.log('====== VARIABLE ======')
        // const variable = await figma.variables.getVariableByIdAsync(variableId);
        // console.log('variable', variable);
        
        // Add null check before accessing valuesByMode
        // if (variable) {
          
        //     // console.log('     variable.id', variable.id)
        //     // console.log('     variable.codeSyntax', variable.codeSyntax)
        //     // console.log('     variable.description', variable.description)
        //     // console.log('     variable.hiddenFromPublishing', variable.hiddenFromPublishing)
        //     // console.log('     variable.key', variable.key)
        //     // console.log('     variable.name', variable.name)
        //     // console.log('     variable.remote', variable.remote)
        //     // console.log('     variable.resolvedType', variable.resolvedType)
        //     // console.log('     variable.scopes', variable.scopes)
        //     // console.log('     variable.valuesByMode', variable.valuesByMode)
        //     // console.log('     variable.variableCollectionId', variable.variableCollectionId)

            
        //     const modes = variable.valuesByMode as Record<string, VariableValue>;
        //     for (const modeId in modes) {
        //       const value = modes[modeId];
        //       // console.log('Mode:', modeId, 'Value:', value, 'Name:', variable.name);

        //       if (variable.resolvedType === "COLOR") {
                  
        //           if (typeof value === 'object' && value !== null && 'type' in value) {
        //               // console.log(`Found ALIAS with type: ${value.type}`);
        //               // console.log(`Found ALIAS ID is: ${value.id}`);
        //               retrieveVariable(value.id)
        //           } else {
        //             // console.log('Found COLOR')
        //             if (typeof value === 'object' && 'r' in value) {  // Type guard for RGB/RGBA
        //                 const colorValue = colorConstructor(value as RGB)
        //                 // console.log(`'${variable.name}': ${colorValue}`);
        //             }
        //           }
        //       }
        //     }
        // }
      }
    }

    // Move the figma.closePlugin() here if you want to wait for all operations to complete
    figma.closePlugin();
  }
};
