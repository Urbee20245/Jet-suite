import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIconSolid as PaperAirplaneIcon, SparklesIcon, XMarkIcon, CheckCircleIcon } from './icons/MiniIcons';
import { generateBorisResponse, type BorisMessage, type BorisContext } from '../services/borisAIService';
import confetti from 'canvas-confetti';

interface BorisChatModalProps {
  context: BorisContext;
  onClose: () => void;
  onNavigateToTool?: (toolId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  urgentTasks?: any[];
}

export const BorisChatModal: React.FC<BorisChatModalProps> = ({ 
  context, 
  onClose,
  onNavigateToTool,
  onTaskComplete,
  urgentTasks = []
}) => {
  const [messages, setMessages] = useState<BorisMessage[]>([
    {
      id: '1',
      role: 'boris',
      content: `Hi ${context.userName}! I'm here to help. Ask me anything about your growth strategy, JetSuite tools, or what you should focus on next!`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const triggerConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };
    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        colors: ['#A855F7', '#EC4899', '#8B5CF6', '#F472B6']
      });
    }
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
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

  const handleQuickAction = (action: string) => {
    if (action.startsWith('navigate:')) {
      const toolId = action.split(':')[1];
      if (onNavigateToTool) {
        onNavigateToTool(toolId);
        onClose();
      }
    } else {
      handleSendMessage(action);
    }
  };

  const getTaskNavigationTarget = (task: any) => {
    const source = task.sourceModule.toLowerCase();
    if (source.includes('jetbiz')) return 'jetbiz';
    if (source.includes('jetviz')) return 'jetviz';
    return 'growthplan';
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col border-2 border-purple-600 shadow-2xl">
        
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-purple-700/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
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
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-purple-800/40 text-white border border-purple-600/30 rounded-tl-none'
                }`}
              >
                {message.role === 'boris' && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <SparklesIcon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-purple-300">Boris</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-purple-800/40 border border-purple-600/30 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions / Tasks */}
          {!isLoading && messages.length > 0 && (
            <div className="mt-6 pt-4 border-t border-purple-700/30">
              <p className="text-xs font-semibold text-purple-300 mb-3">Quick Actions:</p>
              <div className="space-y-2">
                {urgentTasks && urgentTasks.length > 0 && (
                  <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-600/30">
                    <p className="text-sm font-bold text-white mb-2">Urgent Tasks:</p>
                    {urgentTasks.slice(0, 3).map((task, idx) => (
                      <div key={task.id} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-300">{idx + 1}. {task.title}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickAction(`navigate:${getTaskNavigationTarget(task)}`)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                          >
                            Go to Tool
                          </button>
                          <button 
                            onClick={() => handleTaskComplete(task.id)}
                            disabled={completedTaskIds.has(task.id)}
                            className={`p-1 rounded-full transition-all ${
                              completedTaskIds.has(task.id)
                                ? 'bg-green-500 text-white'
                                : 'bg-purple-500/20 hover:bg-purple-500/40 text-purple-300'
                            }`}
                            title="Mark as complete"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {getQuickActions(context).map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action)}
                    className="w-full text-left p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white hover:bg-slate-700/50 transition-colors"
                  >
                    {action}
                  </button>
                ))}
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
        </div>
      </div>
    </div>
  );
};