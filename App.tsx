import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Image as ImageIcon, Monitor, Loader2, X, LayoutTemplate, Globe, AlertTriangle } from 'lucide-react';
import { Message, ModificationProject, ModType, AppMode, MockSite } from './types';
import { generateModificationCode } from './services/geminiService';
import FileViewer from './components/FileViewer';
import ChatBubble from './components/ChatBubble';
import BrowserFrame from './components/BrowserFrame';

const DEFAULT_URL = 'https://www.wikipedia.org/';

const App: React.FC = () => {
  // Navigation & Content State
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // App State
  const [injectedCss, setInjectedCss] = useState('');
  const [injectedJs, setInjectedJs] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "I'm ready to analyze real websites.\n\nEnter a URL in the browser bar above, or paste HTML directly if you are analyzing a local or authenticated page.\n\nTry asking:\n- 'Make the background dark mode'\n- 'Explain how the search bar works'"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [appMode, setAppMode] = useState<AppMode>(AppMode.GENERATOR);
  const [modType, setModType] = useState<ModType>(ModType.CSS_ONLY);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [projects, setProjects] = useState<Record<string, ModificationProject>>({});
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Real Website Fetching Logic ---
  const fetchWithProxy = async (targetUrl: string, proxyService: 'allorigins' | 'corsproxy') => {
    if (proxyService === 'allorigins') {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      return data.contents;
    } else {
      // Fallback proxy
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.text();
    }
  };

  const loadUrl = async (url: string) => {
    if (!url) return;
    
    // Basic URL formatting
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }

    setIsUrlLoading(true);
    setFetchError(null);
    setCurrentUrl(targetUrl);

    try {
      // Try primary proxy
      let processedHtml = '';
      try {
        processedHtml = await fetchWithProxy(targetUrl, 'allorigins');
      } catch (e) {
        console.warn("Primary proxy failed, trying fallback...", e);
        processedHtml = await fetchWithProxy(targetUrl, 'corsproxy');
      }
      
      if (processedHtml) {
        // We must inject a <base> tag so relative links (images, css) work
        const baseTag = `<base href="${targetUrl}" target="_self" />`;
        
        // Simple injection of base tag into head
        if (processedHtml.includes('<head>')) {
            processedHtml = processedHtml.replace('<head>', `<head>${baseTag}`);
        } else {
            processedHtml = `${baseTag}${processedHtml}`;
        }
        
        setHtmlContent(processedHtml);
        // Reset injections on new page load
        setInjectedCss('');
        setInjectedJs('');
      } else {
        throw new Error("Empty content received");
      }
    } catch (err) {
      console.error(err);
      setFetchError("Failed to load website. It might block proxies. Try pasting source code directly.");
      setHtmlContent(`
        <html>
          <body style="font-family: sans-serif; padding: 2rem; text-align: center; color: #cbd5e1; background: #0f172a;">
            <h1>⚠️ Could not load website</h1>
            <p>The site "${targetUrl}" could not be accessed.</p>
            <p style="color: #94a3b8; margin-top: 1rem; font-size: 0.9em;">Error: Failed to fetch via CORS proxy.</p>
          </body>
        </html>
      `);
    } finally {
      setIsUrlLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadUrl(DEFAULT_URL);
  }, []);

  const activeSite: MockSite = useMemo(() => {
    return {
      url: currentUrl,
      title: 'Active Page',
      html: htmlContent
    };
  }, [currentUrl, htmlContent]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        setSelectedImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsgId = Date.now().toString();
    const newMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: input,
      images: selectedImage ? [selectedImage] : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    const tempImage = selectedImage;
    setSelectedImage(null); 
    setIsLoading(true);

    try {
      const result = await generateModificationCode(
        newMessage.text || "Analyze page.", 
        tempImage || undefined, 
        activeSite.html, 
        modType,
        appMode
      );
      
      const projectId = Date.now().toString();
      const newProject: ModificationProject = {
        id: projectId,
        title: appMode === AppMode.INSPECTOR ? `Analysis` : `Mod`,
        files: result.files,
        explanation: result.explanation,
        timestamp: Date.now()
      };

      setProjects(prev => ({ ...prev, [projectId]: newProject }));
      setCurrentProjectId(projectId);

      if (appMode === AppMode.GENERATOR) {
        let css = '';
        let js = '';
        result.files.forEach(f => {
          if (f.language === 'css' || f.name.endsWith('.css')) css += f.content + '\n';
          if (f.language === 'javascript' || f.name.endsWith('.js')) js += f.content + '\n';
        });
        
        if (css) setInjectedCss(prev => prev + '\n' + css);
        if (js) setInjectedJs(prev => prev + '\n' + js);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.explanation + (appMode === AppMode.GENERATOR ? "\n\n✅ I have injected the changes into the preview." : ""),
        projectId: projectId
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Error: ${error.message || "Something went wrong."}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeProject = currentProjectId ? projects[currentProjectId] : null;

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden font-sans">
      
      {/* LEFT: Real Browser Preview */}
      <div className="flex-1 flex flex-col h-full relative z-0 transition-all duration-300 p-4">
        <div className="mb-4 flex justify-between items-center">
           <div className="flex items-center space-x-2 text-gray-400 text-xs">
             <Globe size={14} className="text-brand-400" />
             <span className="font-mono">Proxy Mode Active</span>
           </div>
           
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="md:hidden p-2 text-gray-400 hover:text-white"
           >
             {sidebarOpen ? <X size={20} /> : <LayoutTemplate size={20} />}
           </button>
        </div>

        <div className="flex-1 h-full min-h-0 relative">
          <BrowserFrame 
            site={activeSite} 
            injectedCss={injectedCss} 
            injectedJs={injectedJs}
            onNavigate={loadUrl}
            isLoading={isUrlLoading}
          />
          
          {fetchError && (
             <div className="absolute top-16 left-4 right-4 bg-red-900/90 text-red-100 p-3 rounded-lg text-sm flex items-center shadow-lg backdrop-blur border border-red-700">
                <AlertTriangle size={16} className="mr-2 shrink-0" />
                {fetchError}
             </div>
          )}
        </div>
      </div>

      {/* RIGHT: Modder Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-20 w-full md:w-[450px] lg:w-[500px] bg-gray-950 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0
      `}>
        
        {/* Header */}
        <div className="h-14 border-b border-gray-800 flex items-center px-4 bg-gray-900 justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Monitor className="text-brand-500" size={18} />
            <h1 className="font-bold text-base text-gray-200">Web Modder</h1>
          </div>
          
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setAppMode(AppMode.GENERATOR)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                appMode === AppMode.GENERATOR 
                  ? 'bg-brand-600 text-white' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Modder
            </button>
            <button
              onClick={() => setAppMode(AppMode.INSPECTOR)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                appMode === AppMode.INSPECTOR 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Inspector
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Chat List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {messages.map(msg => (
              <ChatBubble 
                key={msg.id} 
                message={msg} 
                onViewProject={(pid) => setCurrentProjectId(pid)}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4 animate-pulse">
                 <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 border border-gray-700">
                    <div className="flex items-center space-x-2">
                       <Loader2 size={16} className="animate-spin text-brand-500" />
                       <span className="text-sm text-gray-400">Analyzing page source...</span>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Active Project Viewer */}
          {activeProject && (
             <div className="h-64 border-t border-gray-800 bg-gray-900 flex flex-col shrink-0">
                <div className="px-4 py-2 bg-gray-800 flex justify-between items-center text-xs">
                   <span className="text-gray-400 font-mono">GENERATED FILES</span>
                   <button onClick={() => setCurrentProjectId(null)} className="text-gray-500 hover:text-white">Hide</button>
                </div>
                <div className="flex-1 overflow-hidden">
                   <FileViewer files={activeProject.files} />
                </div>
             </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-gray-900 border-t border-gray-800 shrink-0">
             {selectedImage && (
               <div className="mb-2 inline-flex items-center bg-gray-800 px-3 py-1 rounded-full text-xs text-brand-400 border border-brand-900/50">
                  <ImageIcon size={12} className="mr-2" />
                  Screenshot attached
                  <button onClick={() => setSelectedImage(null)} className="ml-2 hover:text-white text-gray-500">×</button>
               </div>
             )}
             <div className="flex items-end space-x-2">
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="p-2.5 text-gray-400 hover:text-brand-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                 title="Upload Screenshot"
               >
                 <ImageIcon size={18} />
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*" 
                 onChange={handleImageUpload} 
               />
               
               <textarea
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSendMessage();
                   }
                 }}
                 placeholder={appMode === AppMode.INSPECTOR 
                   ? "Explain how this works..." 
                   : "Modify this page..."}
                 className="flex-1 bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none h-10 min-h-[40px] max-h-32 text-sm"
               />
   
               <button
                 onClick={handleSendMessage}
                 disabled={isLoading || (!input.trim() && !selectedImage)}
                 className={`p-2.5 rounded-lg flex items-center justify-center transition-all duration-200
                   ${(isLoading || (!input.trim() && !selectedImage))
                     ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                     : 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-500/20'
                   }`}
               >
                 <Send size={18} />
               </button>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;