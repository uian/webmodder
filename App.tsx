import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Code, Monitor, Loader2, Info, Search, Wrench, Globe, X, LayoutTemplate } from 'lucide-react';
import { Message, ModificationProject, ModType, AppMode, MockSite } from './types';
import { generateModificationCode } from './services/geminiService';
import FileViewer from './components/FileViewer';
import ChatBubble from './components/ChatBubble';
import BrowserFrame from './components/BrowserFrame';

// --- MOCK SITES DEFINITION ---
const MOCK_SITES: Record<string, MockSite> = {
  'https://analytics.demo.com/dashboard': {
    url: 'https://analytics.demo.com/dashboard',
    title: 'Analytics Pro Dashboard',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Pro</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
        <nav class="bg-indigo-600 text-white p-4 shadow-lg">
          <div class="container mx-auto flex justify-between items-center">
            <div class="font-bold text-xl flex items-center"><span class="mr-2">📊</span> Analytics Pro</div>
            <div class="space-x-6 text-sm font-medium">
              <a href="#" class="opacity-100 hover:text-white">Dashboard</a>
              <a href="#" class="opacity-75 hover:opacity-100 transition">Reports</a>
              <a href="#" class="opacity-75 hover:opacity-100 transition">Settings</a>
            </div>
            <div class="bg-indigo-700 px-3 py-1 rounded-md text-xs">Trial: 12 days left</div>
          </div>
        </nav>
        
        <div class="container mx-auto p-8">
          <div class="flex justify-between items-end mb-8">
            <div>
              <h1 class="text-3xl font-bold text-gray-800">Overview</h1>
              <p class="text-gray-500 mt-1">Welcome back, Developer.</p>
            </div>
            <button class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 text-sm font-medium transition">
              📅 Last 30 Days
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition card-stat">
              <div class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Revenue</div>
              <div class="text-3xl font-extrabold text-gray-900">$48,294</div>
              <div class="text-green-500 text-xs font-medium mt-2 flex items-center">
                <span>▲ 12%</span> <span class="text-gray-400 ml-1">vs last month</span>
              </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition card-stat">
              <div class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Users</div>
              <div class="text-3xl font-extrabold text-gray-900">12,403</div>
              <div class="text-green-500 text-xs font-medium mt-2 flex items-center">
                <span>▲ 5.4%</span> <span class="text-gray-400 ml-1">vs last month</span>
              </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition card-stat">
              <div class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Bounce Rate</div>
              <div class="text-3xl font-extrabold text-gray-900">42.3%</div>
              <div class="text-red-500 text-xs font-medium mt-2 flex items-center">
                <span>▼ 1.2%</span> <span class="text-gray-400 ml-1">vs last month</span>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <div class="flex justify-between items-center mb-6">
                 <h3 class="font-bold text-gray-800">Traffic Source</h3>
                 <button class="text-indigo-600 text-xs font-bold hover:underline" id="export-btn">Export Data</button>
               </div>
               <div class="space-y-4">
                 <div class="relative pt-1">
                   <div class="flex mb-2 items-center justify-between">
                     <div class="text-xs font-semibold py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">Direct</div>
                     <div class="text-right text-xs font-semibold inline-block text-indigo-600">60%</div>
                   </div>
                   <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100">
                     <div style="width:60%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
                   </div>
                 </div>
                 <div class="relative pt-1">
                   <div class="flex mb-2 items-center justify-between">
                     <div class="text-xs font-semibold py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">Social</div>
                     <div class="text-right text-xs font-semibold inline-block text-green-600">30%</div>
                   </div>
                   <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                     <div style="width:30%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                   </div>
                 </div>
               </div>
             </div>
             
             <div class="bg-indigo-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
               <div class="relative z-10">
                 <h3 class="font-bold text-lg mb-2">Upgrade to Pro</h3>
                 <p class="text-indigo-200 text-sm mb-4">Get access to advanced analytics and custom reports.</p>
                 <button class="w-full bg-white text-indigo-900 font-bold py-2 rounded hover:bg-indigo-50 transition">Upgrade Now</button>
               </div>
               <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-800 rounded-full opacity-50"></div>
             </div>
          </div>
        </div>
      </body>
      </html>
    `
  },
  'https://shop.demo.com/products': {
    url: 'https://shop.demo.com/products',
    title: 'Modern Shop Demo',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Modern Shop</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-white">
        <header class="border-b sticky top-0 bg-white z-50">
          <div class="container mx-auto px-6 py-3 flex justify-between items-center">
            <div class="text-2xl font-bold text-gray-800">SHOP.</div>
            <nav class="space-x-4 text-gray-600">
              <a href="#" class="text-black font-semibold">New Arrivals</a>
              <a href="#">Men</a>
              <a href="#">Women</a>
              <a href="#">Accessories</a>
            </nav>
            <div class="flex items-center space-x-4">
              <button class="text-gray-600">Search</button>
              <button class="text-gray-600">Cart (0)</button>
            </div>
          </div>
        </header>

        <div class="container mx-auto px-6 py-12">
           <h2 class="text-3xl font-bold mb-8 text-center">Trending Now</h2>
           <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
              <!-- Product 1 -->
              <div class="group cursor-pointer product-card">
                 <div class="bg-gray-100 h-80 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    <span class="text-gray-400 text-4xl font-light">Image</span>
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition duration-300"></div>
                    <button class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition duration-300 transform translate-y-4 group-hover:translate-y-0">Quick Add</button>
                 </div>
                 <h3 class="font-bold text-lg">Essential Tee</h3>
                 <p class="text-gray-500">$24.00</p>
              </div>
              
              <!-- Product 2 -->
              <div class="group cursor-pointer product-card">
                 <div class="bg-gray-100 h-80 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    <span class="text-gray-400 text-4xl font-light">Image</span>
                     <div class="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SALE</div>
                 </div>
                 <h3 class="font-bold text-lg">Cargo Pants</h3>
                 <p class="text-gray-500"><span class="line-through mr-2 text-gray-400">$85.00</span>$64.00</p>
              </div>

              <!-- Product 3 -->
              <div class="group cursor-pointer product-card">
                 <div class="bg-gray-100 h-80 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    <span class="text-gray-400 text-4xl font-light">Image</span>
                 </div>
                 <h3 class="font-bold text-lg">Oversized Hoodie</h3>
                 <p class="text-gray-500">$55.00</p>
              </div>
           </div>
        </div>
      </body>
      </html>
    `
  }
};

const App: React.FC = () => {
  // State
  const [activeSiteKey, setActiveSiteKey] = useState<string>(Object.keys(MOCK_SITES)[0]);
  const [injectedCss, setInjectedCss] = useState('');
  const [injectedJs, setInjectedJs] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "I'm connected to the browser. I can read the code of the page you are viewing.\n\nTry asking:\n- 'Change the nav bar color to black'\n- 'How does the export button work?'\n- 'Hide the upgrade banner'"
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

  const activeSite = MOCK_SITES[activeSiteKey];

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
      // PASS THE LIVE HTML CONTEXT
      const result = await generateModificationCode(
        newMessage.text || "Analyze page.", 
        tempImage || undefined, 
        activeSite.html, // <--- MAGIC: AI reads the code directly
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

      // Auto-inject CSS/JS if in Generator mode
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
        text: result.explanation + (appMode === AppMode.GENERATOR ? "\n\n✅ I have injected the changes into the page preview." : ""),
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
      
      {/* LEFT: Browser Simulation (The "Webpage") */}
      <div className="flex-1 flex flex-col h-full relative z-0 transition-all duration-300 p-4">
        {/* Site Switcher / Address Bar Simulator */}
        <div className="mb-4 flex justify-between items-center">
           <div className="flex space-x-2">
             {Object.keys(MOCK_SITES).map(key => (
               <button
                key={key}
                onClick={() => { setActiveSiteKey(key); setInjectedCss(''); setInjectedJs(''); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center ${
                  activeSiteKey === key
                  ? 'bg-gray-700 text-white shadow-sm ring-1 ring-gray-600'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
               >
                 <Globe size={12} className="mr-2" />
                 {MOCK_SITES[key].title}
               </button>
             ))}
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
            onUrlChange={() => {}} 
          />
          
          {/* Floating 'Connected' Badge */}
          <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center z-50 pointer-events-none">
             <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
             AI Connected
          </div>
        </div>
      </div>

      {/* RIGHT: Modder Sidebar (The "Tool") */}
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
                       <span className="text-sm text-gray-400">Reading page code & analyzing...</span>
                    </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Active Project Viewer (Accordion style overlay) */}
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
                   ? "How does this work?" 
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
