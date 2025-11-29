import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, Lock, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { MockSite } from '../types';

interface BrowserFrameProps {
  site: MockSite;
  injectedCss: string;
  injectedJs: string;
  onNavigate: (url: string) => void;
  isLoading?: boolean;
}

const BrowserFrame: React.FC<BrowserFrameProps> = ({ 
  site, 
  injectedCss, 
  injectedJs, 
  onNavigate,
  isLoading = false
}) => {
  const [urlInput, setUrlInput] = useState(site.url);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync internal input state when the site prop changes
  useEffect(() => {
    setUrlInput(site.url);
  }, [site.url]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onNavigate(urlInput);
      (e.target as HTMLInputElement).blur();
    }
  };

  // Construct the full HTML document with injected mods
  // Note: <base> tag is expected to be already inside site.html from the proxy fetcher
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        ${site.html.match(/<head>([\s\S]*?)<\/head>/)?.[1] || ''}
        <style>
          /* User Injected CSS */
          ${injectedCss}
        </style>
      </head>
      <body>
        ${site.html.match(/<body>([\s\S]*?)<\/body>/)?.[1] || ''}
        
        <!-- User Injected JS -->
        <script>
          try {
            ${injectedJs}
          } catch(e) {
            console.error("Injected Script Error:", e);
          }
        </script>
      </body>
    </html>
  `;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden shadow-2xl border border-gray-700">
      {/* Browser Toolbar */}
      <div className="h-12 bg-gray-100 border-b border-gray-300 flex items-center px-4 space-x-3">
        <div className="flex space-x-2 text-gray-500">
          <ArrowLeft size={18} className="cursor-not-allowed opacity-50" />
          <ArrowRight size={18} className="cursor-not-allowed opacity-50" />
          <RefreshCw 
            size={16} 
            className={`cursor-pointer hover:text-gray-700 ${isLoading ? 'animate-spin' : ''}`} 
            onClick={() => onNavigate(site.url)} 
          />
        </div>
        
        {/* URL Bar */}
        <div className="flex-1 bg-white border border-gray-300 rounded-full h-8 flex items-center px-3 text-sm text-gray-700 focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-brand-400 transition-all shadow-sm">
          <Lock size={12} className="text-green-600 mr-2" />
          <input 
            type="text" 
            value={urlInput} 
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none text-gray-600 bg-transparent placeholder-gray-400"
            placeholder="Enter URL (e.g. wikipedia.org)..."
          />
          <Star size={14} className="text-gray-400 hover:text-yellow-400 cursor-pointer" />
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 relative bg-white">
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          title="Simulated Browser View"
          className="w-full h-full border-none block"
          sandbox="allow-scripts allow-modals allow-popups allow-forms allow-same-origin"
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-500 text-sm font-medium">Loading content...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowserFrame;