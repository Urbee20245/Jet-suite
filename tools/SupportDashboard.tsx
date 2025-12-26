// =====================================================
// SUPPORT DASHBOARD - Admin Ticket Management
// =====================================================

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  User,
  TicketIcon,
  ChevronDown
} from '../components/SupportIcons';
import { EyeIcon } from '../components/icons/MiniIcons';
import supportService from '../services/supportService';
import type { 
  SupportTicket, 
  SupportMessage,
  TicketFilters,
  TicketStatus,
  TicketCategory,
  TicketPriority 
} from '../Types/supportTypes';

export default function SupportDashboard() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TicketFilters>({});
  const [activeTab, setActiveTab] = useState<'all' | TicketStatus>('all');

  // Load tickets on mount
  useEffect(() => {
    loadTickets();
  }, []);

  // Apply filters when tickets or filters change
  useEffect(() => {
    applyFilters();
  }, [tickets, filters, activeTab, searchTerm]);

  // Load messages when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
      
      // Set up real-time subscription
      const subscription = supportService.subscribeToTicket(
        selectedTicket.id,
        (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const result = await supportService.getAllTickets();
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
        
        // Mark as read by agent
        await supportService.markMessagesAsRead(ticketId, true);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    // Apply tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(t => t.status === activeTab);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.user_email.toLowerCase().includes(term)
      );
    }

    // Apply advanced filters
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(t => filters.category!.includes(t.category));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(t => filters.priority!.includes(t.priority));
    }

    setFilteredTickets(filtered);
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const result = await supportService.sendMessage({
        ticket_id: selectedTicket.id,
        message: newMessage,
        sender_type: 'agent',
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

  const handleUpdateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const result = await supportService.updateTicket(ticketId, { status });
      if (result.success) {
        // Update local state
        setTickets(prev =>
          prev.map(t => t.id === ticketId ? { ...t, status } : t)
        );
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket status');
    }
  };

  const handleUpdatePriority = async (ticketId: string, priority: TicketPriority) => {
    try {
      const result = await supportService.updateTicket(ticketId, { priority });
      if (result.success) {
        setTickets(prev =>
          prev.map(t => t.id === ticketId ? { ...t, priority } : t)
        );
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, priority } : null);
        }
      }
    } catch (error) {
      console.error('Error updating priority:', error);
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

  const getPriorityColor = (priority: TicketPriority) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || colors.medium;
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    waiting: tickets.filter(t => t.status === 'waiting_customer').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Ticket List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Support Tickets</h2>
            <button
              onClick={loadTickets}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <Loader2 size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`p-2 rounded-lg text-center ${
                activeTab === 'all' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-xs">All</div>
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`p-2 rounded-lg text-center ${
                activeTab === 'open' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="text-lg font-bold">{stats.open}</div>
              <div className="text-xs">Open</div>
            </button>
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`p-2 rounded-lg text-center ${
                activeTab === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="text-lg font-bold">{stats.in_progress}</div>
              <div className="text-xs">Active</div>
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`p-2 rounded-lg text-center ${
                activeTab === 'resolved' ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="text-lg font-bold">{stats.resolved}</div>
              <div className="text-xs">Resolved</div>
            </button>
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <TicketIcon size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No tickets found</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm line-clamp-1">{ticket.subject}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <User size={12} />
                    <span>{ticket.user_email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {ticket.priority && (
                  <div className={`text-xs font-semibold mt-2 ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.toUpperCase()} PRIORITY
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content - Ticket Details */}
      <div className="flex-1 flex flex-col">
        {selectedTicket ? (
          <>
            {/* Ticket Header */}
            <div className="p-6 bg-white border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.subject}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User size={16} />
                      <span>{selectedTicket.user_email}</span>
                    </div>
                    {selectedTicket.business_name && (
                      <div className="flex items-center gap-1">
                        <TicketIcon size={16} />
                        <span>{selectedTicket.business_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {/* Status Dropdown */}
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_customer">Waiting on Customer</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  {/* Priority Dropdown */}
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as TicketPriority)}
                    className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(selectedTicket.priority)}`}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-2xl rounded-lg p-4 ${
                    msg.sender_type === 'agent'
                      ? 'bg-blue-100 text-gray-900'
                      : msg.sender_type === 'bot'
                      ? 'bg-purple-50 border border-purple-200'
                      : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold">
                        {msg.sender_type === 'agent' ? 'Support Team' :
                         msg.sender_type === 'bot' ? '🤖 JetBot' :
                         msg.sender_name || 'Customer'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="p-6 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows={3}
                  disabled={isSendingMessage}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSendingMessage}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSendingMessage ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Select a ticket to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
