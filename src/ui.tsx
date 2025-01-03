import { render, Container, Text, VerticalSpace } from '@create-figma-plugin/ui'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import '!./fonts.css'
import '!./output.css'
import bg from './assets/images/bg.png'

interface PluginMessage {
  type: 'complete' | 'colors' | 'copy';
  colors?: string[];
  text?: string;
}

const TOAST_DURATION = 3000;
const GITHUB_URL = 'https://github.com/amazingrando/figma-variables-to-tailwind';

function Plugin() {
  const [isLoading, setIsLoading] = useState(false)
  const [colors, setColors] = useState<string[] | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [hasCustomPrefix, setHasCustomPrefix] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [colorSpace, setColorSpace] = useState('rgba')

  useEffect(() => {
    if (colors !== null) {
      handleGetVariables()
    }
  }, [hasCustomPrefix, prefix, colorSpace])

  const handleGetVariables = () => {
    setIsLoading(true)
    setColors(null)
    parent.postMessage({ 
      pluginMessage: { 
        type: 'variables',
        prefix: hasCustomPrefix ? prefix : undefined,
        colorSpace: colorSpace
      } 
    }, '*')
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

  const handlePluginMessage = (message: PluginMessage) => {
    switch (message.type) {
      case 'complete':
        setIsLoading(false);
        break;
      case 'colors':
        if (message.colors) {
          setColors(message.colors);
        }
        break;
      case 'copy':
        if (message.text) handleCopy(message.text);
        break;
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      handlePluginMessage(event.data.pluginMessage as PluginMessage);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, TOAST_DURATION)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const handleCopyClick = () => {
    parent.postMessage({ 
      pluginMessage: { 
        type: 'copy-to-clipboard', 
        text: getTailwindTemplate(colors!)
      } 
    }, '*');
    setShowToast(true);
  };

  const checkboxPaths = {
    unchecked: "M0 96C0 60.7 28.7 32 64 32H384c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96z",
    checked: "M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
  };

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
    <Container space='medium' className='h-screen p-6 root bg-dark text-white bg-left-bottom bg-no-repeat	bg-50% overflow-y-auto' style={{ backgroundImage: `url(${bg})` }}>
        <Text className='text-4xl text-balance m-0 font-sans tracking-[0.5px]'>Export <span className='whitespace-nowrap'>Color Variables</span> for Tailwind</Text>
        <VerticalSpace space='medium' />

        <div className={`flex flex-row items-center gap-2 ${hasCustomPrefix ? 'mb-2' : ''}`}>
          <div className="w-4 h-4 relative">
            <input
              type="checkbox"
              id="customPrefix"
              className="absolute opacity-0 w-full h-full cursor-pointer"
              onChange={(e) => setHasCustomPrefix((e.target as HTMLInputElement).checked)}
            />
            <svg
              className={`absolute top-0 left-0 w-full h-full ${hasCustomPrefix ? 'text-magenta' : 'text-magenta-light'}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              fill="currentColor"
            >
              {hasCustomPrefix && (
                <path
                  d="M0 96C0 60.7 28.7 32 64 32H384c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96z"
                  fill="white"
                />
              )}
              <path d={hasCustomPrefix ? checkboxPaths.checked : checkboxPaths.unchecked} />
            </svg>
          </div>
          <label htmlFor="customPrefix" className="font-sans uppercase text-xl">
            Custom prefix
          </label>
        </div>
        
        {hasCustomPrefix && (
          <div className="mb-4">
            <input
              type="text"
              className="w-full px-2 py-1 text-xl font-sans uppercase bg-dark border border-white/70 border-solid rounded focus:outline-none focus:ring-2 focus:ring-magenta"
              placeholder="Enter prefix..."
              value={prefix}
              onChange={(e) => setPrefix((e.target as HTMLInputElement).value)}
            />
          </div>
        )}

        <div className="mb-4 mt-4">
          <select
            className="w-full px-2 py-1 bg-dark border border-white/70 border-solid rounded font-sans uppercase text-xl focus:outline-none focus:ring-2 focus:ring-magenta"
            value={colorSpace}
            onChange={(e) => setColorSpace((e.target as HTMLSelectElement).value)}
          >
            <option value="rgba">RGBA</option>
            <option value="hex">HEX</option>
            <option value="hsl">HSLA</option>
          </select>
        </div>

        <VerticalSpace space='medium' />

        {isLoading ? (
          <button className='btn z-10 relative bg-dark font-sans text-xl uppercase px-4 py-2 rounded-lg w-full border border-white/70 border-solid tracking-wide' onClick={handleGetVariables}>
            <div className="flex items-center justify-center gap-2">
              Loading...
            </div>
          </button>
        ) : (
          <div>
            <button className='btn z-10 relative bg-dark font-sans text-xl uppercase px-4 py-2 rounded-lg w-full border border-white/70 border-solid tracking-wide' onClick={handleGetVariables}>{colors === null ? 'Get color variables' : 'Refresh'}</button>
            
            {colors && (
              <div>
                <VerticalSpace space='medium' />
                <div className="relative">
                  <button 
                    className="absolute right-2 top-2 px-2 py-1 flex flex-row items-center gap-2 border border-gray-300 text-dark border-solid bg-pre hover:bg-pre-dark rounded transition-colors duration-200"
                    onClick={handleCopyClick}
                    title="Copy to clipboard"
                  >
                    
                      Copy
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                  </button>
                  <pre className="overflow-auto max-h-[160px] p-2 pt-6 bg-pre text-dark rounded">
                    {getTailwindTemplate(colors)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
        <VerticalSpace space='large' />
        <Text className='text-xs text-balance flex flex-row justify-end items-center gap-1 absolute bottom-4 right-4 w-[200px]'>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
          </svg>
          <a href={GITHUB_URL} target="_blank" className="underline inline-flex items-center gap-1">Github</a> 
        </Text>
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-magenta border border-white/70 border-solid text-white px-4 py-2 rounded shadow-lg animate-fade-in-out">
            Copied!
          </div>
        )}
    </Container>
  )
}

export default render(Plugin)
