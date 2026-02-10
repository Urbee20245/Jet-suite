// components/BorisChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIconSolid as PaperAirplaneIcon, SparklesIcon, CheckCircleIcon } from './icons/MiniIcons';
import { generateBorisResponse, generateDailyRecommendation, getQuickActions, type BorisMessage, type BorisContext } from '../services/borisAIService';
import confetti from 'canvas-confetti';

interface BorisChatProps {
  context: BorisContext;
  onNavigateToTool?: (toolId: string) => void;
  showHeader?: boolean;
  urgentTasks?: any[];
  onTaskComplete?: (taskId: string) => void;
}

export const BorisChat: React.FC<BorisChatProps> = ({ 
  context, 
  onNavigateToTool, 
  showHeader = true,
  urgentTasks = [],
  onTaskComplete
}) => {
  const [messages, setMessages] = useState<BorisMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyGreeting, setDailyGreeting] = useState('');
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number>(5);

  // Load daily greeting on mount
  useEffect(() => {
    const loadDailyGreeting = async () => {
      // Get userId from Supabase
      const supabase = (await import('../integrations/supabase/client')).getSupabaseClient();
      if (!supabase) {
        setDailyGreeting(`Good to see you, ${context.userName}! You have ${context.pendingTasks} tasks in your Growth Plan.`);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setDailyGreeting(`Good to see you, ${context.userName}! You have ${context.pendingTasks} tasks in your Growth Plan.`);
        return;
      }
  
      const greeting = await generateDailyRecommendation(context, user.id);
      setDailyGreeting(greeting);
      
      // Add as first Boris message
      setMessages([{
        id: '1',
        role: 'boris',
        content: greeting,
        timestamp: new Date().toISOString()
      }]);
    };
    loadDailyGreeting();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        colors: ['#A855F7', '#EC4899', '#8B5CF6', '#F472B6']
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleTaskComplete = (taskId: string) => {
    setCompletedTaskIds(prev => new Set([...prev, taskId]));
    triggerConfetti();
    if (onTaskComplete) {
      onTaskComplete(taskId);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
  
    const userMessage: BorisMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
  
    setMessages(prev => [...prev, userMessage]);
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
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900">
      
      {/* Header with Stats */}
      {showHeader && (
        <div className="flex-shrink-0 p-4 border-b border-purple-700/30">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Boris Avatar & Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-900">
                  <div className="absolute inset-0 animate-ping bg-green-400 rounded-full"></div>
                </div>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Chat with Boris</h2>
                <p className="text-purple-200 text-xs">Your AI Growth Coach</p>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{context.growthScore}</div>
                <div className="text-xs text-purple-300">Growth Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{context.pendingTasks}</div>
                <div className="text-xs text-purple-300">Tasks</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Daily Greeting Message */}
          {messages.length > 0 && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                </svg>
              </div>
              <div className="max-w-[85%] bg-gradient-to-r from-purple-900/80 to-purple-800/80 border border-purple-700/30 rounded-2xl rounded-tl-none px-6 py-4 shadow-lg">
                <p className="text-white text-sm mb-4">{messages[0].content}</p>
                
                {/* TODAY'S TASKS SECTION */}
                {urgentTasks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-600/30">
                    <p className="text-purple-200 font-semibold text-sm mb-3">
                      Here's what you need to focus on TODAY:
                    </p>
                    <div className="space-y-2">
                      {urgentTasks.slice(0, 3).map((task, idx) => (
                        <div
                          key={task.id || idx}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                            completedTaskIds.has(task.id)
                              ? 'bg-green-900/20 border border-green-600/30'
                              : 'bg-purple-900/30 border border-purple-600/20 hover:bg-purple-900/50'
                          }`}
                        >
                          <button
                            onClick={() => handleTaskComplete(task.id)}
                            disabled={completedTaskIds.has(task.id)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              completedTaskIds.has(task.id)
                                ? 'bg-green-500 border-green-500'
                                : 'border-purple-400 hover:border-purple-300'
                            }`}
                          >
                            {completedTaskIds.has(task.id) && (
                              <CheckCircleIcon className="w-4 h-4 text-white" />
                            )}
                          </button>
                          <div className="flex-1">
                            <p className={`text-sm ${
                              completedTaskIds.has(task.id)
                                ? 'text-green-300 line-through'
                                : 'text-white'
                            }`}>
                              {idx + 1}. {task.title || task.name}
                            </p>
                            {task.description && !completedTaskIds.has(task.id) && (
                              <p className="text-xs text-purple-300 mt-1">{task.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.slice(1).map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'boris' && (
                <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">U</span>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
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
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-purple-700/30 bg-purple-900/50">
        <div className="max-w-4xl mx-auto">
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