import { showUI } from '@create-figma-plugin/utilities'
import { kebabCase } from './utils/caseChange';
import { colorConstructor, ColorSpace } from './utils/colorConstructor';

// Types
type MessageType = 'variables' | 'copy-to-clipboard' | 'colors' | 'complete' | 'error' | 'copy';

interface Mode {
  modeId: string;
  name: string;
}

interface ColorVariable {
  name: string;
  value: RGB | RGBA;
  mode?: string;
  prefix?: string;
}

interface PluginMessage {
  type: MessageType;
  prefix?: string;
  text?: string;
  colors?: string[];
  message?: string;
  colorSpace?: ColorSpace;
}

interface ColorOutput {
  [key: string]: string;
}

// Constants
const UI_CONFIG = {
  height: 500,
  width: 300
} as const;

// Initialize plugin
export default function () {
  showUI(UI_CONFIG)
}

// Type guards
const isRGBColor = (value: unknown): value is RGB | RGBA => {
  return typeof value === 'object' && value !== null && 'r' in value;
}

const isVariableAlias = (value: unknown): value is VariableAlias => {
  return typeof value === 'object' && 
    value !== null && 
    'type' in value && 
    value.type === 'VARIABLE_ALIAS';
}

// Utility functions
const sendUIMessage = (message: PluginMessage): void => {
  figma.ui.postMessage(message);
}

const formatVariableOutput = ({ name, value, mode, prefix }: ColorVariable, colorSpace: ColorSpace): string => {
  const formattedName = prefix ? `${prefix}-${kebabCase(name)}` : kebabCase(name);
  return mode 
    ? `${formattedName}-${kebabCase(mode)}: ${colorConstructor(value, colorSpace)}`
    : `${formattedName}: ${colorConstructor(value, colorSpace)}`;
}

// Core processing functions
async function processColorVariable(
  variable: Variable, 
  modes: Mode[], 
  collectionId: string, 
  prefix?: string,
  colorSpace: string = 'rgba'
): Promise<string[]> {
  try {
    const colors: string[] = [];
    const valuesByMode = variable.valuesByMode;
    const numberOfModes = Object.keys(valuesByMode).length;

    await Promise.all(
      Object.entries(valuesByMode).map(async ([modeId, value]) => {
        const modeName = modes.find(mode => mode.modeId === modeId)?.name;

        if (isRGBColor(value)) {
          colors.push(formatVariableOutput({ name: variable.name, value, mode: modeName, prefix }, colorSpace as ColorSpace));
          return;
        }

        if (isVariableAlias(value)) {
          const aliasColors = await processAliasVariable(
            value.id, 
            variable.name, 
            modes, 
            numberOfModes, 
            collectionId, 
            prefix,
            colorSpace
          );
          colors.push(...aliasColors);
        }
      })
    );

    return colors;
  } catch (error) {
    console.error('Error processing color variable:', error);
    return [];
  }
}

async function processAliasVariable(
  aliasId: string, 
  originalName: string, 
  modes: Mode[], 
  numberOfModes: number, 
  collectionId: string, 
  prefix?: string,
  colorSpace: string = 'rgba'
): Promise<string[]> {
  try {
    const alias = await figma.variables.getVariableByIdAsync(aliasId);
    if (!alias) return [];
    
    const colors: string[] = [];
    const aliasValuesByMode = alias.valuesByMode;

    // Handle single mode case
    if (numberOfModes === 1) {
      const [firstValue] = Object.values(aliasValuesByMode);
      if (isRGBColor(firstValue)) {
        colors.push(formatVariableOutput({ name: originalName, value: firstValue, prefix }, colorSpace as ColorSpace));
      }
      return colors;
    }

    // Handle multiple modes
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    
    await Promise.all(
      Object.entries(aliasValuesByMode).map(async ([modeId, value]) => {
        const modeInfo = collection?.modes.find(mode => mode.modeId === modeId);
        
        if (isRGBColor(value)) {
          colors.push(formatVariableOutput({ 
            name: originalName, 
            value, 
            mode: modeInfo?.name, 
            prefix 
          }, colorSpace as ColorSpace));
        }
      })
    );

    return colors;
  } catch (error) {
    console.error('Error processing alias variable:', error);
    return [];
  }
}

async function handleVariablesRequest(prefix?: string, colorSpace: ColorSpace = 'rgba'): Promise<void> {
  console.log('handleVariablesRequest called with:', { prefix, colorSpace });
  try {
    const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const allColors: ColorOutput = {};

    await Promise.all(
      localCollections.flatMap(collection => 
        collection.variableIds.map(async (variableId) => {
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          
          if (variable?.resolvedType === "COLOR") {
            const colors = await processColorVariable(
              variable, 
              collection.modes, 
              collection.id, 
              prefix,
              colorSpace
            );
            
            colors.forEach(color => {
              const [key, value] = color.split(': ');
              allColors[key] = value;
            });
          }
        })
      )
    );

    sendUIMessage({ type: 'colors', colors: Object.entries(allColors).map(([k, v]) => `${k}: ${v}`) });
    sendUIMessage({ type: 'complete' });
  } catch (error) {
    console.error('Error processing variables:', error);
    sendUIMessage({ type: 'error', message: 'Failed to process variables' });
  }
}

// Message handling
figma.ui.onmessage = async (msg: PluginMessage) => {
  console.log('Received message:', msg);
  try {
    switch (msg.type) {
      case 'variables':
        await handleVariablesRequest(msg.prefix, msg.colorSpace);
        break;
      case 'copy-to-clipboard':
        if (msg.text) {
          sendUIMessage({ type: 'copy', text: msg.text });
        }
        break;
      default:
        console.warn(`Unhandled message type: ${msg.type}`);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendUIMessage({ type: 'error', message: 'An unexpected error occurred' });
  }
}
