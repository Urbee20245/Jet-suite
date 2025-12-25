// =====================================================
// USER SUPPORT TICKETS PAGE
// View and manage personal support tickets
// =====================================================

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Star
} from '../components/SupportIcons';
import supportService from '../services/supportService';
import type { 
  SupportTicket, 
  SupportMessage,
  CreateTicketRequest,
  TicketCategory,
  TicketStatus 
} from '../Types/supportTypes';

export default function UserSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'landing' | 'list' | 'detail' | 'create'>('landing');
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Create ticket form
  const [newTicket, setNewTicket] = useState<CreateTicketRequest>({
    subject: '',
    category: 'general',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket && view === 'detail') {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket, view]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const result = await supportService.getUserTickets();
      if (result.success) {
        setTickets(result.data || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const result = await supportService.getTicketMessages(ticketId);
      if (result.success && result.data) {
        setMessages(result.data);
        await supportService.markMessagesAsRead(ticketId, false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const result = await supportService.createTicket(newTicket);
      if (result.success && result.data) {
        setTickets(prev => [result.data!, ...prev]);
        setSelectedTicket(result.data!);
        setView('detail');
        
        // Reset form
        setNewTicket({
          subject: '',
          category: 'general',
          description: '',
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const result = await supportService.sendMessage({
        ticket_id: selectedTicket.id,
        message: newMessage,
        sender_type: 'user',
        message_type: 'text'
      });

      if (result.success && result.data) {
        setMessages(prev => [...prev, result.data!]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRateTicket = async (rating: number) => {
    if (!selectedTicket) return;

    try {
      await supportService.updateTicket(selectedTicket.id, {
        satisfaction_rating: rating
      });
      
      setSelectedTicket(prev => prev ? { ...prev, satisfaction_rating: rating } : null);
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id ? { ...t, satisfaction_rating: rating } : t
      ));
    } catch (error) {
      console.error('Error rating ticket:', error);
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <Clock className="text-blue-500" size={20} />;
      case 'in_progress':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="text-green-500" size={20} />;
      default:
        return <MessageSquare className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_customer: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.open;
  };

  // LANDING VIEW (Redesigned for "JetBot First")
  if (view === 'landing') {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help you today?</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get instant answers from our AI assistant or manage your support requests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Card 1: Ask JetBot (Primary) */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MessageSquare size={120} />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <MessageSquare size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Ask JetBot</h2>
              <p className="text-blue-100 mb-8 leading-relaxed">
                Our AI assistant can instantly resolve 90% of inquiries about features, billing, and troubleshooting. No waiting required.
              </p>
              
              {/* This button is purely visual as the actual chatbot is a floating widget */}
              <div className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold py-3 px-6 rounded-lg shadow-lg">
                <span>Start Chat below</span>
                <ArrowLeft className="rotate-[270deg]" size={20} />
              </div>
              <p className="text-xs text-blue-200 mt-4 opacity-80">
                (Click the chat bubble in the bottom right corner)
              </p>
            </div>
          </div>

          {/* Card 2: Human Support (Secondary) */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col relative overflow-hidden group hover:border-blue-300 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Plus size={120} className="text-gray-900" />
            </div>
            <div className="relative z-10 flex-1">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                <Plus size={28} className="text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Human Support</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Complex issue? Submit a detailed ticket to our engineering team. We typically respond within 24 hours.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setView('create')}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Create New Ticket
                </button>
                <button
                  onClick={() => setView('list')}
                  className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Clock size={18} />
                  View My Tickets ({tickets.filter(t => t.status !== 'closed').length} active)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tickets Preview (if any) */}
        {tickets.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Recent Activity</h3>
              <button onClick={() => setView('list')} className="text-sm text-blue-600 hover:underline">View All</button>
            </div>
            <div>
              {tickets.slice(0, 3).map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => { setSelectedTicket(ticket); setView('detail'); }}
                  className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(ticket.status)}
                    <div>
                      <p className="font-medium text-gray-900">{ticket.subject}</p>
                      <p className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Support Center
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
            <p className="text-gray-600 mt-1">Track the status of your support requests</p>
          </div>
          <button
            onClick={() => setView('create')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            New Ticket
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-4">No support tickets found.</p>
            <button
              onClick={() => setView('create')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setView('detail');
                }}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(ticket.status)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="capitalize">{ticket.category.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.updated_at !== ticket.created_at && (
                    <>
                      <span>•</span>
                      <span>Updated {new Date(ticket.updated_at).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // CREATE VIEW
  if (view === 'create') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Support Center
        </button>

        <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-8 bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600 shrink-0">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-lg">Wait! Have you asked JetBot?</h3>
              <p className="text-blue-800 mt-2">
                Our AI assistant can instantly answer most questions. It's much faster than creating a ticket!
                Look for the chat icon in the bottom right corner.
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Support Ticket</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as TicketCategory })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                >
                  <option value="general">General Question</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Payment</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="account">Account Issue</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                >
                  <option value="low">Low - General Question</option>
                  <option value="medium">Medium - Standard Issue</option>
                  <option value="high">High - Important Feature Broken</option>
                  <option value="urgent">Urgent - System Down</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Please provide as much detail as possible about your issue..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setView('landing')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTicket}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold shadow-md hover:shadow-lg"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  if (view === 'detail' && selectedTicket) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Tickets
        </button>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.subject}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="capitalize px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium">
                    {selectedTicket.category.replace('_', ' ')}
                  </span>
                  <span>•</span>
                  <span>Created {new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto bg-white">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl p-5 ${
                  msg.sender_type === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : msg.sender_type === 'bot'
                    ? 'bg-purple-50 border border-purple-100 text-gray-800 rounded-tl-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${
                    msg.sender_type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {msg.sender_type === 'user' ? 'You' :
                     msg.sender_type === 'bot' ? '🤖 JetBot' :
                     'Support Team'}
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  <div className={`text-xs mt-2 text-right ${
                    msg.sender_type === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          {selectedTicket.status !== 'closed' && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={isSendingMessage}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSendingMessage}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-bold shadow-sm"
                >
                  <Send size={18} />
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Satisfaction Rating */}
          {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
            <div className="p-8 bg-blue-50 border-t border-blue-100 text-center">
              <p className="font-bold text-gray-800 mb-4">
                How satisfied are you with the support you received?
              </p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRateTicket(rating)}
                    className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${
                      selectedTicket.satisfaction_rating && rating <= selectedTicket.satisfaction_rating
                        ? 'text-yellow-400 bg-white shadow-md'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star size={32} fill={selectedTicket.satisfaction_rating && rating <= selectedTicket.satisfaction_rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
