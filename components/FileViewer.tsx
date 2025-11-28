import React, { useState } from 'react';
import { GeneratedFile } from '../types';
import { Copy, Download, FileJson, FileCode, FileType, Github } from 'lucide-react';

interface FileViewerProps {
  files: GeneratedFile[];
}

const FileViewer: React.FC<FileViewerProps> = ({ files }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!files || files.length === 0) return null;

  const activeFile = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    // Could add toast here
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGithubSave = () => {
    alert("This feature would utilize the GitHub Gist API.\n\nWorkflow:\n1. OAuth with GitHub.\n2. POST /gists with file content.\n3. Return Gist URL.");
  };

  const getIcon = (name: string) => {
    if (name.endsWith('.json')) return <FileJson size={14} className="mr-1" />;
    if (name.endsWith('.js')) return <FileCode size={14} className="mr-1" />;
    if (name.endsWith('.css')) return <FileType size={14} className="mr-1" />;
    if (name.endsWith('.md')) return <FileCode size={14} className="mr-1" />;
    return <FileCode size={14} className="mr-1" />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
      {/* File Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto no-scrollbar">
        {files.map((file, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex items-center px-4 py-3 text-sm font-medium transition-colors border-r border-gray-700 whitespace-nowrap
              ${activeTab === index 
                ? 'bg-gray-900 text-brand-400 border-t-2 border-t-brand-400' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'}`}
          >
            {getIcon(file.name)}
            {file.name}
          </button>
        ))}
      </div>

      {/* Code Editor Area */}
      <div className="relative flex-1 bg-gray-950 overflow-hidden">
        {/* Actions Toolbar */}
        <div className="absolute top-2 right-2 flex space-x-2 z-10">
          <button 
            onClick={handleGithubSave}
            className="p-1.5 bg-gray-800 text-gray-400 rounded hover:bg-[#2dba4e] hover:text-white transition-colors"
            title="Save to GitHub Gist"
          >
            <Github size={16} />
          </button>
          <button 
            onClick={handleCopy}
            className="p-1.5 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors"
            title="Copy to Clipboard"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={handleDownload}
            className="p-1.5 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors"
            title="Download File"
          >
            <Download size={16} />
          </button>
        </div>

        {/* Content */}
        <pre className="h-full p-4 overflow-auto text-sm font-mono leading-relaxed text-gray-300">
          <code>{activeFile.content}</code>
        </pre>
      </div>
    </div>
  );
};

export default FileViewer;