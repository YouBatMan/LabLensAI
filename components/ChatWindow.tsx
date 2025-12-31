
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Brain, Loader2, MessageCircle, X } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatWithContext } from '../geminiService';
import { AnalysisResult, ChatMessage } from '../types';
import { GenerateContentResponse } from "@google/genai";

interface ChatWindowProps {
  context: AnalysisResult;
  externalRequest: string | null;
  onClearRequest: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ context, externalRequest, onClearRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (context && messages.length === 0) {
      const name = context.patientName ? context.patientName.split(' ')[0] : 'there';
      // Construct a proactive, humanized greeting
      const verdict = context.executiveSummary || "I've finished reading your results.";
      const greeting = `Hi ${name}, I've finished reading your results. ${verdict} What would you like to dive into first?`;
      
      setMessages([
        { 
          role: 'assistant', 
          content: greeting 
        }
      ]);
    }
  }, [context]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (externalRequest) {
      setIsOpen(true);
      handleSendMessage(externalRequest);
      onClearRequest();
    }
  }, [externalRequest]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: String(m.content)
      }));

      const stream = await chatWithContext(text, history, context);
      let assistantResponse = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text;
        
        if (typeof textChunk === 'string') {
          assistantResponse += textChunk;
        } else if (textChunk !== undefined) {
          assistantResponse += String(JSON.stringify(textChunk));
        }

        setMessages(prev => {
          const last = prev[prev.length - 1];
          const rest = prev.slice(0, -1);
          return [...rest, { ...last, content: assistantResponse }];
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I am having trouble connecting. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none no-print">
      <div className="pointer-events-auto flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-[100dvh] fixed inset-0 sm:static sm:w-[450px] sm:max-h-[650px] sm:h-[75vh] bg-white sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden sm:border sm:border-indigo-100 sm:mb-8"
            >
              {/* Header */}
              <div className="p-8 bg-[#1A237E] text-white flex justify-between items-center shadow-lg relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-400 rounded-[18px] flex items-center justify-center text-[#1A237E] shadow-inner">
                    <Brain className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Lab Assistant</h3>
                    <p className="text-[10px] opacity-60 font-black uppercase tracking-[0.2em]">Friendly Nurse AI</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-6 rounded-[32px] text-sm shadow-sm prose prose-slate ${
                      m.role === 'user' 
                        ? 'bg-[#1A237E] text-white rounded-tr-none font-bold prose-invert' 
                        : 'bg-white text-[#1A237E] border border-indigo-50 rounded-tl-none font-medium'
                    }`}>
                      {m.role === 'assistant' ? (
                        m.content ? <Markdown remarkPlugins={[remarkGfm]}>{String(m.content)}</Markdown> : <Loader2 className="w-6 h-6 animate-spin opacity-30 mx-auto" />
                      ) : (
                        <span className="leading-relaxed">{String(m.content)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-6 bg-white border-t border-indigo-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
                  className="relative flex items-center gap-4"
                >
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    placeholder="Ask about your results..."
                    className="w-full bg-slate-100 border-none rounded-[22px] py-4 px-6 text-base font-bold text-[#1A237E] placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-4 bg-[#1A237E] text-white rounded-2xl hover:scale-110 active:scale-95 transition-all disabled:opacity-20 shadow-lg shrink-0"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={isOpen ? 'hidden sm:block' : 'block'}>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl flex items-center justify-center transition-all border-4 relative ${
              isOpen ? 'bg-white text-[#1A237E] border-[#1A237E]' : 'bg-[#1A237E] text-white border-white'
            }`}
          >
            {isOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-10 h-10" />}
            {!isOpen && !isLoading && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
