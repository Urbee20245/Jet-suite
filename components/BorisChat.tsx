import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, SparklesIcon, ArrowRightIcon } from './icons/MiniIcons';
import { generateBorisResponse, generateDailyRecommendation, getQuickActions, type BorisMessage, type BorisContext } from '../services/borisAIService';

interface BorisChatProps {
  context: BorisContext;
  onNavigateToTool?: (toolId: string) => void;
  showHeader?: boolean;
}

export const BorisChat: React.FC<BorisChatProps> = ({ context, onNavigateToTool, showHeader = true }) => {
  const [messages, setMessages] = useState<BorisMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyGreeting, setDailyGreeting] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick actions
  const quickActions = getQuickActions(context);

  // Load daily greeting on mount
  useEffect(() => {
    const loadDailyGreeting = async () => {
      const greeting = await generateDailyRecommendation(context);
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
      const response = await generateBorisResponse(message, context, messages);
      
      const borisMessage: BorisMessage = {
        id: (Date.now() + 1).toString(),
        role: 'boris',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, borisMessage]);
    } catch (error) {
      console.error('Error getting Boris response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-xl shadow-2xl">
      
      {/* Header with Stats */}
      {showHeader && (
        <div className="flex-shrink-0 p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Boris Avatar & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Boris</h2>
                <p className="text-slate-400 text-xs">Your Growth Coach</p>
              </div>
            </div>

            {/* Mini Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{context.growthScore}</div>
                <div className="text-xs text-slate-400">Growth Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{context.pendingTasks}</div>
                <div className="text-xs text-slate-400">Tasks</div>
              </div>
              {context.newReviews > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{context.newReviews}</div>
                  <div className="text-xs text-slate-400">Reviews</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {messages.length === 0 && !dailyGreeting && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Hi, {context.userName}! 👋
              </h3>
              <p className="text-slate-400">
                I'm Boris, your AI Growth Coach. How can I help you grow your business today?
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                }`}
              >
                {message.role === 'boris' && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <SparklesIcon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-purple-400">Boris</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 rounded-tl-none">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 p-4 border-t border-slate-700/50">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs text-slate-400 mb-3">Popular topics</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-full border border-slate-600 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Ask Boris anything..."
              className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-full px-6 py-3 pr-12 border border-slate-600 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all"
            >
              <PaperAirplaneIcon className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">
            Boris can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};