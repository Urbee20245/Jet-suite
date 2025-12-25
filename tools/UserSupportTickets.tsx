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
} from 'lucide-react';
import supportService from '../services/supportService';
import type { 
  SupportTicket, 
  SupportMessage,
  CreateTicketRequest,
  TicketCategory,
  TicketStatus 
} from '../supportTypes';

export default function UserSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
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
        setTickets(result.data);
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

  // LIST VIEW
  if (view === 'list') {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-1">View and manage your support requests</p>
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
          <div className="text-center py-12">
            <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-4">No support tickets yet</p>
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
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Tickets
        </button>

        <div className="bg-white p-8 rounded-lg border border-gray-200">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as TicketCategory })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Description *
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Please provide as much detail as possible about your issue..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setView('list')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Ticket
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

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.subject}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="capitalize">{selectedTicket.category.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-md rounded-lg p-4 ${
                  msg.sender_type === 'user'
                    ? 'bg-blue-100 text-gray-900'
                    : msg.sender_type === 'bot'
                    ? 'bg-purple-50 border border-purple-200'
                    : 'bg-gray-100'
                }`}>
                  <div className="text-xs font-semibold mb-1">
                    {msg.sender_type === 'user' ? 'You' :
                     msg.sender_type === 'bot' ? '🤖 JetBot' :
                     'Support Team'}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          {selectedTicket.status !== 'closed' && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={isSendingMessage}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSendingMessage}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={18} />
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Satisfaction Rating */}
          {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                How satisfied are you with the support you received?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRateTicket(rating)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedTicket.satisfaction_rating && rating <= selectedTicket.satisfaction_rating
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star size={24} fill={selectedTicket.satisfaction_rating && rating <= selectedTicket.satisfaction_rating ? 'currentColor' : 'none'} />
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
