import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon as SparklesIconSolid, PaperAirplaneIconSolid, StopIconSolid, TrashIcon } from '../components/icons/MiniIcons';
import { Boris } from '../components/Boris';
import { askBoris } from '../services/borisService';

interface AskBorisPageProps {
  userFirstName: string;
  profileData: any;
  growthPlanTasks: any[];
  hasNewReviews: boolean;
  newReviewsCount: number;
  onNavigate: (toolId: string) => void;
  onReplyToReviews: () => void;
  onTaskStatusChange: (taskId: string, newStatus: 'completed') => void;
}

interface ChatMessage {
  role: 'user' | 'boris';
  text: string;
}

const MAX_QUESTIONS = 5;

export const AskBorisPage: React.FC<AskBorisPageProps> = (props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedData = localStorage.getItem('borisQuestionCount');
    if (storedData) {
        const { date, count } = JSON.parse(storedData);
        if (date === today) {
            setQuestionCount(count);
        } else {
            localStorage.setItem('borisQuestionCount', JSON.stringify({ date: today, count: 0 }));
            setQuestionCount(0);
        }
    } else {
        localStorage.setItem('borisQuestionCount', JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || questionCount >= MAX_QUESTIONS) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    
    const newCount = questionCount + 1;
    setQuestionCount(newCount);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('borisQuestionCount', JSON.stringify({ date: today, count: newCount }));

    try {
      const responseText = await askBoris(currentInput, props.userFirstName, props.profileData.business.business_name);
      const borisMessage: ChatMessage = { role: 'boris', text: responseText };
      
      setMessages(prev => [...prev, borisMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = { role: 'boris', text: error.message || "I seem to be having trouble thinking right now. Let's focus on action. What's your next move?" };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear this conversation and start over?")) {
        setMessages([]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <Boris {...props} />
      <div className="mt-4 bg-brand-card rounded-xl shadow-lg border border-brand-border flex-1 flex flex-col">
        <div className="p-4 border-b border-brand-border flex justify-between items-center">
          <div>
            <h3 className="font-bold text-brand-text">Ask a Clarifying Question</h3>
            <p className="text-xs text-brand-text-muted">You have {MAX_QUESTIONS - questionCount} questions remaining today.</p>
          </div>
          <button 
            onClick={handleReset} 
            className="p-2 rounded-full text-brand-text-muted hover:bg-brand-light transition-colors"
            title="Start New Conversation"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'boris' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0"><SparklesIconSolid className="w-5 h-5 text-white" /></div>}
              <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-brand-light text-brand-text'}`}>
                <p className="text-sm whitespace-pre-line" style={{ overflowWrap: 'break-word' }}>{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0"><SparklesIconSolid className="w-5 h-5 text-white" /></div>
              <div className="max-w-md p-3 rounded-2xl bg-brand-light text-brand-text">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-brand-border">
          {questionCount >= MAX_QUESTIONS ? (
            <div className="text-center p-4 bg-red-100 border border-red-200 rounded-lg">
              <p className="font-bold text-red-800">Question limit reached for today.</p>
              <p className="text-sm text-red-700 mt-1">Time to take action instead of asking questions. Let's get to work on your Growth Plan!</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a short, clarifying question..."
                className="flex-1 bg-brand-light border border-brand-border rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={isLoading || !input.trim()} className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:bg-purple-700 disabled:bg-gray-400 transition-colors">
                {isLoading ? <StopIconSolid className="w-6 h-6" /> : <PaperAirplaneIconSolid className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};