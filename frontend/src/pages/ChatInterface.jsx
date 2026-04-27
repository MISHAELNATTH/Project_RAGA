import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, FileText, X, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatWithAi } from '../lib/api';

export default function ChatInterface({ activeDocuments, initialQuestion }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Hello! I'm your RAG assistant. I'm currently connected to ${activeDocuments.join(' and ')}. How can I help you extract insights today?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const newMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithAi(text);
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content: response.answer,
          sources: response.sources
        }
      ]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          role: 'assistant', 
          content: "Sorry, I encountered an error communicating with the backend." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Header Info */}
      <div className="pt-6 pb-2 px-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">RAG Engine</h2>
        <div className="flex gap-2">
          {activeDocuments.map((doc, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
              <FileText size={12} className="text-primary-500" />
              {doc}
              <button className="text-slate-400 hover:text-slate-600 ml-1"><X size={12} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-slate-800 text-white" : "bg-primary-100 text-primary-600"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className={cn(
                "p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary-600 text-white rounded-tr-sm" 
                  : "bg-white border border-slate-100 text-slate-700 rounded-tl-sm"
              )}>
                {msg.content}
              </div>
              
              {/* Sources mapping if present */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {[...new Set(msg.sources)].map((src, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                      <FileText size={10} />
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 rounded-tl-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-slate-50 border-t border-slate-200">
        <div className="relative max-w-4xl mx-auto shadow-sm rounded-xl border border-slate-300 bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all flex items-center px-2 py-2">
          <button className="p-2 text-slate-400 hover:text-slate-600">
            <Plus size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about your documents..."
            className="flex-1 py-2 px-2 outline-none text-slate-700 placeholder-slate-400 bg-transparent"
          />
          <button 
            onClick={() => handleSend()}
            className={cn(
              "p-2.5 rounded-lg flex items-center justify-center transition-colors",
              input.trim() 
                ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-3">
          AI can make mistakes. Verify important information with the cited sources.
        </p>
      </div>
    </div>
  );
}
