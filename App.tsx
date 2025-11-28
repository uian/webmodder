import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Code, Monitor, Loader2, Info, Search, Wrench } from 'lucide-react';
import { Message, ModificationProject, ModType, AppMode } from './types';
import { generateModificationCode } from './services/geminiService';
import FileViewer from './components/FileViewer';
import ChatBubble from './components/ChatBubble';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm your Web Modder AI.\n\nI can help you:\n1. Create Chrome Extensions or UserScripts to modify websites.\n2. Analyze and explain how specific web features work (Inspector Mode).\n\nSelect a mode and describe what you need!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Configuration State
  const [appMode, setAppMode] = useState<AppMode>(AppMode.GENERATOR);
  const [modType, setModType] = useState<ModType>(ModType.CHROME_EXTENSION);
  
  // Projects store generated code
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
        newMessage.text || "Analyze this image.", 
        tempImage || undefined, 
        modType,
        appMode
      );
      
      const projectId = Date.now().toString();
      const newProject: ModificationProject = {
        id: projectId,
        title: appMode === AppMode.INSPECTOR ? `Analysis: ${newMessage.text.slice(0, 15)}...` : `Mod: ${newMessage.text.slice(0, 15)}...`,
        files: result.files,
        explanation: result.explanation,
        timestamp: Date.now()
      };

      setProjects(prev => ({ ...prev, [projectId]: newProject }));
      setCurrentProjectId(projectId);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: result.explanation,
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
    <div className="flex h-screen bg-gray-950 text-gray-200 overflow-hidden font-sans">
      
      {/* Left Sidebar - Chat */}
      <div className={`flex flex-col w-full ${activeProject ? 'md:w-1/2 lg:w-5/12' : 'max-w-3xl mx-auto'} border-r border-gray-800 transition-all duration-300`}>
        {/* Header */}
        <div className="h-16 border-b border-gray-800 flex items-center px-6 bg-gray-900/50 backdrop-blur-sm justify-between">
          <div className="flex items-center space-x-2">
            <Monitor className="text-brand-500" size={20} />
            <h1 className="font-bold text-lg text-white">Web Modder AI</h1>
          </div>
          
          {/* Mode Toggles */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setAppMode(AppMode.GENERATOR)}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                appMode === AppMode.GENERATOR 
                  ? 'bg-brand-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Wrench size={12} className="mr-1.5" />
              Build Mod
            </button>
            <button
              onClick={() => setAppMode(AppMode.INSPECTOR)}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                appMode === AppMode.INSPECTOR 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Search size={12} className="mr-1.5" />
              Inspector
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {messages.map(msg => (
            <ChatBubble 
              key={msg.id} 
              message={msg} 
              onViewProject={(pid) => setCurrentProjectId(pid)}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Configuration Bar (Only visible in Generator Mode) */}
        {appMode === AppMode.GENERATOR && (
          <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex space-x-2 overflow-x-auto">
             <button 
              onClick={() => setModType(ModType.CHROME_EXTENSION)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${
                modType === ModType.CHROME_EXTENSION 
                  ? 'bg-brand-900/30 border-brand-500/50 text-brand-400' 
                  : 'bg-gray-800 border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Chrome Extension
            </button>
            <button 
              onClick={() => setModType(ModType.USER_SCRIPT)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${
                modType === ModType.USER_SCRIPT 
                  ? 'bg-brand-900/30 border-brand-500/50 text-brand-400' 
                  : 'bg-gray-800 border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              UserScript
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          {selectedImage && (
             <div className="mb-2 inline-flex items-center bg-gray-800 px-3 py-1 rounded-full text-xs text-brand-400 border border-brand-900/50">
                <ImageIcon size={12} className="mr-2" />
                Image attached
                <button onClick={() => setSelectedImage(null)} className="ml-2 hover:text-white text-gray-500">×</button>
             </div>
          )}
          <div className="flex items-end space-x-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-brand-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="Upload Screenshot"
            >
              <ImageIcon size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            
            <div className="flex-1 relative">
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
                  ? "Ask about a feature (e.g., 'How does the Save button work?')..." 
                  : "Describe changes (e.g., 'Hide sidebar on youtube.com')..."}
                className={`w-full bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 resize-none max-h-32 min-h-[48px] ${
                   appMode === AppMode.INSPECTOR ? 'focus:ring-purple-500/50' : 'focus:ring-brand-500/50'
                }`}
                rows={1}
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className={`p-3 rounded-lg flex items-center justify-center transition-all duration-200
                ${(isLoading || (!input.trim() && !selectedImage))
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                  : appMode === AppMode.INSPECTOR 
                    ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-500/20'
                }`}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <div className="mt-2 text-center text-xs text-gray-600 flex items-center justify-center">
            <Info size={10} className="mr-1" />
            {appMode === AppMode.INSPECTOR 
              ? "Upload a screenshot of the UI element you want to analyze."
              : "Upload a screenshot for better accuracy on specific elements."}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Code Viewer (Visible if project active) */}
      {activeProject && (
        <div className="hidden md:flex flex-col w-1/2 lg:w-7/12 h-full bg-gray-950 border-l border-gray-800">
           <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-sm">
             <div>
                <h2 className={`font-medium text-white flex items-center ${appMode === AppMode.INSPECTOR ? 'text-purple-400' : 'text-brand-500'}`}>
                  {appMode === AppMode.INSPECTOR ? <Search size={18} className="mr-2" /> : <Code size={18} className="mr-2" />}
                  {appMode === AppMode.INSPECTOR ? "Technical Analysis" : "Generated Code"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Project ID: {activeProject.id}</p>
             </div>
             <button 
              onClick={() => setCurrentProjectId(null)}
              className="md:hidden text-gray-400"
             >
               Close
             </button>
           </div>
           
           <div className="flex-1 p-6 overflow-hidden bg-gray-950/50">
             <div className="h-full flex flex-col space-y-4">
                <div className={`border p-4 rounded-lg ${appMode === AppMode.INSPECTOR ? 'bg-purple-900/20 border-purple-900/50' : 'bg-blue-900/20 border-blue-900/50'}`}>
                   <h3 className={`text-sm font-semibold mb-1 ${appMode === AppMode.INSPECTOR ? 'text-purple-200' : 'text-blue-200'}`}>
                     AI Explanation
                   </h3>
                   <p className="text-gray-300 text-sm leading-relaxed">{activeProject.explanation}</p>
                </div>
                <div className="flex-1 min-h-0">
                  <FileViewer files={activeProject.files} />
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Empty State for Right Side (Desktop) */}
      {!activeProject && (
        <div className="hidden md:flex flex-col w-1/2 lg:w-7/12 h-full items-center justify-center bg-gray-950 border-l border-gray-800 p-12 text-center opacity-50">
           <div className="bg-gray-900 p-6 rounded-full mb-6">
             {appMode === AppMode.INSPECTOR ? <Search size={48} className="text-purple-500" /> : <Code size={48} className="text-brand-500" />}
           </div>
           <h3 className="text-xl font-bold text-gray-300 mb-2">
             {appMode === AppMode.INSPECTOR ? "Ready to Analyze" : "Ready to Modify"}
           </h3>
           <p className="text-gray-500 max-w-md">
             {appMode === AppMode.INSPECTOR 
                ? "Upload a screenshot of any webpage feature, and I'll explain the technical implementation behind it."
                : "Start a conversation to generate extension code. You can upload screenshots or describe elements to get precise DOM selectors."
             }
           </p>
        </div>
      )}

    </div>
  );
};

export default App;