import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIconSolid as PaperAirplaneIcon, XMarkIcon } from './icons/MiniIcons';
import { generateBorisResponse, type BorisMessage, type BorisContext } from '../services/borisAIService';
import { JetbotAvatar } from './JetbotAvatar';

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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col border-2 border-purple-600 shadow-2xl">
        
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-purple-700/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-0.5 rounded-full bg-gradient-to-br from-purple-400 via-indigo-400 to-blue-400 shadow-md shadow-purple-500/40">
              <div className="rounded-full overflow-hidden">
                <JetbotAvatar size={40} />
              </div>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Chat with Boris</h2>
              <p className="text-purple-300 text-xs">Your AI Growth Coach</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-purple-800/50 hover:bg-purple-700/50 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Jetbot avatar on the left for Boris messages */}
              {message.role === 'boris' && (
                <div className="flex-shrink-0 mb-1 p-0.5 rounded-full bg-gradient-to-br from-purple-400 via-indigo-400 to-blue-400">
                  <div className="rounded-full overflow-hidden">
                    <JetbotAvatar size={28} />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                    : 'bg-purple-800/40 text-white border border-purple-600/30 rounded-bl-sm'
                }`}
              >
                {message.role === 'boris' && (
                  <span className="text-xs font-semibold text-purple-300 block mb-1">Boris</span>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Blue user avatar on the right for user messages */}
              {message.role === 'user' && (
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mb-1 shadow-sm border border-blue-400/30">
                  <span className="text-white text-xs font-bold">
                    {context.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="flex-shrink-0 mb-1 p-0.5 rounded-full bg-gradient-to-br from-purple-400 via-indigo-400 to-blue-400">
                <div className="rounded-full overflow-hidden">
                  <JetbotAvatar size={28} />
                </div>
              </div>
              <div className="bg-purple-800/40 border border-purple-600/30 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-purple-700/30 bg-purple-900/50">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Ask Boris anything..."
              className="w-full bg-purple-950/50 text-white placeholder-purple-400 rounded-full px-6 py-3 pr-12 border border-purple-600/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all"
            >
              <PaperAirplaneIcon className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-purple-400">
              Boris can make mistakes. Check important info.
            </p>
            {remainingQuestions !== null && (
              <p className="text-xs text-purple-300 font-semibold">
                Questions today: {dailyLimit - remainingQuestions} / {dailyLimit}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};