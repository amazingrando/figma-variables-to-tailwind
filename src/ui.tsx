import { render, Container, Text, VerticalSpace, Button, LoadingIndicator } from '@create-figma-plugin/ui'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import '!./output.css'

interface PluginMessage {
  type: 'complete' | 'colors' | 'copy';
  colors?: string[];
  text?: string;
}

function Plugin() {
  const [isLoading, setIsLoading] = useState(false)
  const [colors, setColors] = useState<string[] | null>(null)
  const [showToast, setShowToast] = useState(false)

  const handleGetVariables = () => {
    setIsLoading(true)
    setColors(null)
    parent.postMessage({ pluginMessage: { type: 'variables' } }, '*')
  }

  const handleCopy = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for environments where clipboard API isn't available
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage as PluginMessage;
      
      switch (message.type) {
        case 'complete':
          setIsLoading(false);
          break;
        case 'colors':
          if (message.colors) setColors(message.colors);
          break;
        case 'copy':
          if (message.text) handleCopy(message.text);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // Extract the template string to a separate constant for better maintainability
  const getTailwindTemplate = (colors: string[]) => `const colors = ${JSON.stringify(colors, null, 2)};

// TAILWIND EXTEND EXAMPLE
// tailwind.config.js
//
// const colors = { ... }
//
// theme: {
//   extend: {
//     colors: {
//       ...colors,
//     },
//   }
// }`;

  return (
    <Container space='medium'>
      <VerticalSpace space='medium' />
      <Text className='text-xl text-balance'>Export Color Variables for Tailwind</Text>
      <VerticalSpace space='medium' />
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <div>
          <Button fullWidth onClick={handleGetVariables}>
            {colors === null ? 'Gather color variables' : 'Refresh'}
          </Button>
          {colors && (
            <div>
              <VerticalSpace space='medium' />
              <Text>Colors:</Text>
              <VerticalSpace space='small' />
              <div className="relative">
                <button 
                  className="absolute right-2 top-2 p-1 hover:bg-gray-200 rounded transition-colors duration-200"
                  onClick={() => {
                    parent.postMessage({ 
                      pluginMessage: { 
                        type: 'copy-to-clipboard', 
                        text: getTailwindTemplate(colors)
                      } 
                    }, '*')
                    setShowToast(true)
                  }}
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <pre className="overflow-auto max-h-[300px] p-2 bg-gray-100 rounded">
                  {getTailwindTemplate(colors)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
      <VerticalSpace space='medium' />
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow-lg animate-fade-in-out">
          Copied!
        </div>
      )}
    </Container>
  )
}

export default render(Plugin)
