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
              <div className="relative">
                <button 
                  className="absolute right-2 top-2 px-2 py-1 flex flex-row items-center gap-2 border border-gray-300 border-solid bg-gray-200 hover:bg-gray-300 rounded transition-colors duration-200"
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
                  
                    Copy
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
                <pre className="overflow-auto max-h-[300px] p-2 pt-6 bg-gray-100 rounded">
                  {getTailwindTemplate(colors)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
      <VerticalSpace space='medium' />
      <Text className='text-xs text-balance flex flex-row items-center gap-1'>
      <a href="https://github.com/amazingrando/figma-variables-to-tailwind" target="_blank" className="text-blue-500 hover:underline inline-flex items-center gap-1">Submit issues</a> on 
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
          </svg>
          Github
      </Text>
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded shadow-lg animate-fade-in-out">
          Copied!
        </div>
      )}
    </Container>
  )
}

export default render(Plugin)
