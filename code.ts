// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage =  async (msg: {type: string, count: number}) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'create-shapes') {
    // This plugin creates rectangles on the screen.
    const numberOfRectangles = msg.count;

    const nodes: SceneNode[] = [];
    for (let i = 0; i < numberOfRectangles; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (msg.type === 'variables') {
    const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
    console.log('localCollections', localCollections);
    
    // Use a for...of loop instead of forEach for proper async handling
    for (const collection of localCollections) {
      console.log(`Collection:`, {
        id: collection.id,
        name: collection.name,
        modes: collection.modes,
        variableIds: collection.variableIds
      });

      // Loop through each variableId in the collection
      for (const variableId of collection.variableIds) {
        console.log('variableId', variableId);
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        console.log('variable', variable);
        
        // Add null check before accessing valuesByMode
        if (variable) {
            const modes = variable.valuesByMode as Record<string, VariableValue>;
            for (const modeId in modes) {
                const value = modes[modeId];
                console.log('Mode:', modeId, 'Value:', value, 'Name:', variable.name);
            }
        }
      }
    }

    // Move the figma.closePlugin() here if you want to wait for all operations to complete
    figma.closePlugin();
  }
};
