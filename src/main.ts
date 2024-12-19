import { showUI } from '@create-figma-plugin/utilities'

export default function () {
  showUI({
    height: 500,
    width: 300
  })
}

import { kebabCase } from './utils/caseChange';
import { colorConstructor } from './utils/colorConstructor';

interface Mode {
  modeId: string;
  name: string;
}

interface ColorVariable {
  name: string;
  value: RGB | RGBA;
  mode?: string;
}

function formatVariableOutput({ name, value, mode }: ColorVariable): string {
  return mode 
    ? `${kebabCase(name)}-${kebabCase(mode)}: ${colorConstructor(value)}`
    : `${kebabCase(name)}: ${colorConstructor(value)}`;
}

async function processColorVariable(variable: Variable, modes: Mode[], collectionId: string) {
  const colors: string[] = [];
  const valuesByMode = variable.valuesByMode;
  const numberOfModes = Object.keys(valuesByMode).length;

  for (const modeId in valuesByMode) {
    const modeName = modes.find(mode => mode.modeId === modeId)?.name;
    const value = valuesByMode[modeId];

    if (isRGBColor(value)) {
      colors.push(formatVariableOutput({ name: variable.name, value, mode: modeName }));
      continue;
    }

    if (isVariableAlias(value)) {
      const aliasColors = await processAliasVariable(value.id, variable.name, modes, numberOfModes, collectionId);
      colors.push(...aliasColors);
    }
  }

  return colors;
}

async function processAliasVariable(aliasId: string, originalName: string, modes: Mode[], numberOfModes: number, collectionId: string): Promise<string[]> {
  const alias = await figma.variables.getVariableByIdAsync(aliasId);
  if (!alias) return [];
  
  const colors: string[] = [];
  const aliasValuesByMode = alias.valuesByMode;

  if (numberOfModes === 1) {
    const firstValue = aliasValuesByMode[Object.keys(aliasValuesByMode)[0]];
    if (isRGBColor(firstValue)) {
      colors.push(formatVariableOutput({ name: originalName, value: firstValue }));
    }
  } else {
    for (const modeId in aliasValuesByMode) {
      const value = aliasValuesByMode[modeId];
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
      const modeInfo = collection?.modes.find(mode => mode.modeId === modeId);
      const modeName = modeInfo?.name;
      
      if (isRGBColor(value)) {
        colors.push(formatVariableOutput({ name: originalName, value, mode: modeName }));
      }
    }
  }

  return colors;
}

function isRGBColor(value: unknown): value is RGB | RGBA {
  return typeof value === 'object' && value !== null && 'r' in value;
}

function isVariableAlias(value: unknown): value is VariableAlias {
  return typeof value === 'object' && 
    value !== null && 
    'type' in value && 
    value.type === 'VARIABLE_ALIAS';
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'variables') {
    const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const allColors: Record<string, string> = {};

    for (const collection of localCollections) {
      for (const variableId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        
        if (variable?.resolvedType === "COLOR") {
          const colors = await processColorVariable(variable, collection.modes, collection.id);
          colors.forEach(color => {
            const [key, value] = color.split(': ');
            allColors[key] = value;
          });
        }
      }
    }

    console.log('Final colors:', allColors);
    figma.ui.postMessage({ type: 'colors', colors: allColors })
    figma.ui.postMessage({ type: 'complete' })
  }

  if (msg.type === 'copy-to-clipboard') {
    figma.ui.postMessage({ type: 'copy', text: msg.text });
  }
}
