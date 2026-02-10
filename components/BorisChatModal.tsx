import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIconSolid as PaperAirplaneIcon, SparklesIcon, XMarkIcon } from './icons/MiniIcons';
import { generateBorisResponse, type BorisMessage, type BorisContext } from '../services/borisAIService';

interface BorisChatModalProps {
  context: BorisContext;
  onClose: () => void;
  onNavigateToTool?: (toolId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  urgentTasks?: any[];
  initialMessage?: string; // NEW PROP
}

export const BorisChatModal: React.FC<BorisChatModalProps> = ({ 
  context, 
  onClose,
  onNavigateToTool,
  onTaskComplete,
  urgentTasks = [],
  initialMessage // Use new prop
}) => {
  const [messages, setMessages] = useState<BorisMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number>(5);
  const [isInitialized, setIsInitialized] = useState(false); // Track if initial message is sent

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Initialize chat with welcome message or initial message
  useEffect(() => {
    if (isInitialized) return;
    
    let initialContent = `Hi ${context.userName}! I'm here to help. Ask me anything about your growth strategy, JetSuite tools, or what you should focus on next!`;
    
    if (initialMessage) {
        // If an initial message is provided, send it immediately as a user message
        handleSendMessage(initialMessage, true);
    } else {
        // Otherwise, start with the standard welcome message
        setMessages([
            {
                id: '1',
                role: 'boris',
                content: initialContent,
                timestamp: new Date().toISOString()
            }
        ]);
    }
    setIsInitialized(true);
  }, [initialMessage, isInitialized]); // Only run on mount/initialMessage change

  const handleSendMessage = async (message: string, isInitial = false) => {
    if (!message.trim()) return;

    const userMessage: BorisMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    // Only add user message to display if it's not the initial hidden message
    if (!isInitial) {
        setMessages(prev => [...prev, userMessage]);
    }
    
    setInputValue('');
    setIsLoading(true);

    try {
      // Get userId from Supabase
      const supabase = (await import('../integrations/supabase/client')).getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { response, remainingQuestions, dailyLimit: limit } = await generateBorisResponse(
        message, 
        context, 
        messages, 
        user.id
      );
      
      setRemainingQuestions(remainingQuestions);
      if (limit) setDailyLimit(limit);

      const borisMessage: BorisMessage = {
        id: (Date.now() + 1).toString(),
        role: 'boris',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, borisMessage]);

      // Show remaining questions if low
      if (remainingQuestions <= 2 && remainingQuestions > 0) {
        const warningMessage: BorisMessage = {
          id: (Date.now() + 2).toString(),
          role: 'boris',
          content: `⚠️ You have ${remainingQuestions} question${remainingQuestions === 1 ? '' : 's'} remaining today.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, warningMessage]);
      } else if (remainingQuestions === 0 && !response.includes('Daily limit reached')) {
        const limitMessage: BorisMessage = {
          id: (Date.now() + 2).toString(),
          role: 'boris',
          content: `🚫 Daily question limit reached! You can ask me 5 questions per day. Come back tomorrow for more help!`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, limitMessage]);
      }
    } catch (error) {
      console.error('Error getting Boris response:', error);
      const errorMessage: BorisMessage = {
        id: (Date.now() + 1).toString(),
        role: 'boris',
        content: "I'm having trouble connecting right now. Try asking me again in a moment!",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        // Close when clicking the backdrop (outside the modal)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-slate-700 shadow-2xl overflow-hidden relative">
        {/* Animated Background Glow */}
        <div className="absolute -right-20 -top-20 bg-purple-500/20 w-64 h-64 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 bg-indigo-500/20 w-64 h-64 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-20 flex flex-col h-full">

        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-purple-700/30 flex items-center justify-between bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V9h7V2.99c3.87.87 6.99 4.17 7 7.99h-7v2.01z"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-purple-900">
                <div className="absolute inset-0 animate-ping bg-green-400 rounded-full"></div>
              </div>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Chat with Boris</h2>
              <p className="text-purple-200 text-xs">Your AI Growth Coach</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 border border-white/20"
            title="Close chat"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-900/50 to-slate-950/50">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'boris' && (
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none'
                    : 'bg-gradient-to-r from-purple-900/80 to-purple-800/80 text-white border border-purple-700/30 rounded-tl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">U</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                </svg>
              </div>
              <div className="bg-gradient-to-r from-purple-900/80 to-purple-800/80 border border-purple-700/30 rounded-2xl rounded-tl-none px-4 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-xs text-purple-300 ml-2">Boris is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-900/80">
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Ask Boris anything..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm outline-none"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="w-10 h-10 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-gray-500">Boris can make mistakes. Check important info.</span>
            {remainingQuestions !== null && (
              <span className="text-purple-400 font-medium">
                Questions today: {dailyLimit - remainingQuestions} / {dailyLimit}
              </span>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};