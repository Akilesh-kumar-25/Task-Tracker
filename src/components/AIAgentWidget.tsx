'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, BrainCircuit } from 'lucide-react';
import { Habit, Todo, Event } from '@/types';

interface AIAgentWidgetProps {
  habits: Habit[];
}

export default function AIAgentWidget({ habits }: AIAgentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'agent', content: string}[]>([
    { role: 'agent', content: "Hi i am currently in development" }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    // Static Response for development
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'agent', content: "Hi i am currently in development" }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 z-[100] w-14 h-14 bg-[#5c544d] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 shadow-[0_0_20px_rgba(92,84,77,0.3)]'}`}
      >
        <BrainCircuit size={28} />
      </button>

      {/* Chat Interface */}
      <div className={`fixed bottom-8 right-8 z-[110] w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-gray-100 dark:border-slate-800 transition-all duration-500 overflow-hidden flex flex-col ${isOpen ? 'opacity-100 translate-y-0 h-[500px]' : 'opacity-0 translate-y-20 h-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-[#5c544d] p-4 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 rotate-12 -translate-y-4 translate-x-4"><BrainCircuit size={100} /></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-heading italic text-lg leading-tight">Mastery AI</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/60">Strategic Assistant</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="relative z-10 p-2 hover:bg-white/20 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/50 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-[#8b7f74] text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-[#5c544d] dark:text-slate-200 shadow-sm rounded-tl-sm'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about schedule, brainstorm..."
              className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#8b7f74]/20 transition-all pr-12"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#5c544d] text-white rounded-lg flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105"
            >
              <Send size={14} className="-translate-x-0.5 translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
