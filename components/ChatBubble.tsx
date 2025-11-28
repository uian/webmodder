import React from 'react';
import { Message } from '../types';
import { Bot, User, FileCode2 } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  onViewProject?: (projectId: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onViewProject }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 
          ${isUser ? 'bg-brand-600 ml-3' : 'bg-emerald-600 mr-3'}`}>
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap
            ${isUser 
              ? 'bg-brand-600 text-white rounded-tr-none' 
              : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
            }`}>
            {message.text}
          </div>

          {/* Attached Images (User only usually) */}
          {message.images && message.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 justify-end">
              {message.images.map((img, idx) => (
                <img 
                  key={idx} 
                  src={`data:image/png;base64,${img}`} 
                  alt="Context" 
                  className="h-20 w-auto rounded border border-gray-600 object-cover" 
                />
              ))}
            </div>
          )}

          {/* Project Link (Assistant only) */}
          {message.projectId && onViewProject && (
            <button
              onClick={() => onViewProject(message.projectId!)}
              className="mt-2 flex items-center space-x-2 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors bg-gray-900 px-3 py-1.5 rounded-full border border-gray-700"
            >
              <FileCode2 size={14} />
              <span>View Generated Code</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;