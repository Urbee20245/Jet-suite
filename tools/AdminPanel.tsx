// =====================================================
// ENHANCED ADMIN PANEL WITH SUPPORT TICKET MANAGEMENT
// Integrates support into existing admin back office
// =====================================================

import React, { useState, useEffect } from 'react';
import type { ProfileData, BusinessDna } from '../types';
import type { SupportTicket, SupportMessage, TicketStatus, TicketPriority } from '../Types/supportTypes';
import { TrashIcon, PencilIcon, EyeIcon, ArrowPathIcon } from '../components/icons/MiniIcons';
import { MessageSquare, Send, X, Clock, CheckCircle2, AlertCircle, Filter, Search } from '../components/SupportIcons';
import supportService from '../services/supportService';

interface AdminPanelProps {
    allProfiles: ProfileData[];
    setAllProfiles: React.Dispatch<React.SetStateAction<ProfileData[]>>;
    currentUserProfile: ProfileData;
    setCurrentUserProfile: (data: ProfileData) => void;
    onImpersonate: (email: string) => void;
}

const AdminSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-brand-text mb-6">{title}</h2>
        {children}
    </div>
);

const dnaStatus = (dna: BusinessDna) => {
    if (!dna.logo && dna.colors.length === 0 && !dna.fonts) return { text: 'Not Started', color: 'bg-gray-200 text-gray-800' };
    if (dna.logo && dna.colors.length > 0 && dna.fonts) return { text: 'Complete', color: 'bg-green-100 text-green-800' };
    return { text: 'Incomplete', color: 'bg-yellow-100 text-yellow-800' };
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    allProfiles, 
    setAllProfiles, 
    currentUserProfile, 
    setCurrentUserProfile, 
    onImpersonate 
}) => {
    // ===== EXISTING ADMIN PANEL STATE =====
    const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'users' | 'support'>('overview');
    
    // ===== SUPPORT TICKET STATE =====
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

    // ===== LOAD SUPPORT TICKETS =====
    useEffect(() => {
        if (activeTab === 'support') {
            loadTickets();
        }
    }, [activeTab]);

    // ===== FILTER TICKETS =====
    useEffect(() => {
        let filtered = [...tickets];

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.subject.toLowerCase().includes(term) ||
                t.user_email.toLowerCase().includes(term) ||
                t.description.toLowerCase().includes(term)
            );
        }

        setFilteredTickets(filtered);
    }, [tickets, statusFilter, searchTerm]);

    // ===== LOAD MESSAGES WHEN TICKET SELECTED =====
    useEffect(() => {
        if (selectedTicket) {
            loadMessages(selectedTicket.id);
        }
    }, [selectedTicket]);

    const loadTickets = async () => {
        setIsLoadingTickets(true);
        try {
            const result = await supportService.getAllTickets();
            if (result.success) {
                setTickets(result.data);
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setIsLoadingTickets(false);
        }
    };

    const loadMessages = async (ticketId: string) => {
        try {
            const result = await supportService.getTicketMessages(ticketId);
            if (result.success && result.data) {
                setMessages(result.data);
                await supportService.markMessagesAsRead(ticketId, true);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
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
                setTickets(prev =>
                    prev.map(t => t.id === ticketId ? { ...t, status } : t)
                );
                if (selectedTicket?.id === ticketId) {
                    setSelectedTicket(prev => prev ? { ...prev, status } : null);
                }
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
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

    // ===== EXISTING ADMIN FUNCTIONS =====
    const handleResetDna = (email: string) => {
        if (window.confirm(`Are you sure you want to reset DNA for ${email}? This will clear all extracted data and any extraction cooldowns.`)) {
            console.log(`[ADMIN] Forcing DNA reset for user: ${email}. Cooldowns and lockouts cleared.`);
            setAllProfiles(profiles => profiles.map(p => {
                if (p.user.email === email) {
                    return { ...p, business: { ...p.business, dna: { logo: '', colors: [], fonts: '', style: '' } }, brandDnaProfile: undefined };
                }
                return p;
            }));
            alert(`DNA reset complete for ${email}. They can now extract again.`);
        }
    };

    const handleResetCurrentUserDna = () => {
        handleResetDna(currentUserProfile.user.email);
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

    const getStatusIcon = (status: TicketStatus) => {
        switch (status) {
            case 'open':
                return <Clock className="text-blue-500" size={16} />;
            case 'in_progress':
                return <AlertCircle className="text-yellow-500" size={16} />;
            case 'resolved':
            case 'closed':
                return <CheckCircle2 className="text-green-500" size={16} />;
            default:
                return <MessageSquare className="text-gray-500" size={16} />;
        }
    };

    const ticketStats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-brand-text">Admin Panel</h1>
                <p className="text-lg text-brand-text-muted mt-1">Manage all businesses, users, support, and system settings.</p>
            </div>

            {/* TABS */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                            activeTab === 'overview'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('businesses')}
                        className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                            activeTab === 'businesses'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Businesses
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                            activeTab === 'users'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors relative ${
                            activeTab === 'support'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Support Tickets
                        {ticketStats.open > 0 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {ticketStats.open}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <>
                    {/* Quick Actions */}
                    <AdminSection title="Quick Actions">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button onClick={handleResetCurrentUserDna} className="bg-red-50 hover:bg-red-100 text-red-700 p-4 rounded-lg border border-red-200 text-left">
                                <h3 className="font-bold">Reset My Business DNA</h3>
                                <p className="text-xs mt-1">Clears all extracted DNA for your current profile to allow re-testing.</p>
                            </button>
                            <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg border border-blue-200 text-left">
                                <h3 className="font-bold">Add Test Business</h3>
                                <p className="text-xs mt-1">Quick-add a new business profile with dummy data for testing.</p>
                            </button>
                            <button 
                                onClick={() => setActiveTab('support')}
                                className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg border border-green-200 text-left"
                            >
                                <h3 className="font-bold">Support Tickets</h3>
                                <p className="text-xs mt-1">{ticketStats.open} open tickets waiting for response.</p>
                            </button>
                        </div>
                    </AdminSection>

                    {/* Stats Overview */}
                    <AdminSection title="System Overview">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="text-3xl font-bold text-blue-700">{allProfiles.length}</div>
                                <div className="text-sm text-blue-600">Total Businesses</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="text-3xl font-bold text-green-700">{allProfiles.length}</div>
                                <div className="text-sm text-green-600">Active Users</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <div className="text-3xl font-bold text-purple-700">{ticketStats.total}</div>
                                <div className="text-sm text-purple-600">Support Tickets</div>
                            </div>
                        </div>
                    </AdminSection>
                </>
            )}

            {/* BUSINESSES TAB */}
            {activeTab === 'businesses' && (
                <AdminSection title="Business Management">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-brand-text-muted">
                            <thead className="text-xs text-brand-text uppercase bg-brand-light">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Business Name</th>
                                    <th scope="col" className="px-6 py-3">Owner Email</th>
                                    <th scope="col" className="px-6 py-3">DNA Status</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allProfiles.map(profile => {
                                    const status = dnaStatus(profile.business.dna);
                                    return (
                                    <tr key={profile.user.email} className="bg-white border-b hover:bg-brand-light">
                                        <th scope="row" className="px-6 py-4 font-medium text-brand-text whitespace-nowrap">{profile.business.name || '(No Name)'}</th>
                                        <td className="px-6 py-4">{profile.user.email}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>{status.text}</span></td>
                                        <td className="px-6 py-4 flex items-center space-x-2">
                                            <button onClick={() => handleResetDna(profile.user.email)} className="p-1.5 hover:bg-gray-200 rounded-md" title="Reset DNA"><ArrowPathIcon className="w-4 h-4 text-yellow-600"/></button>
                                            <button className="p-1.5 hover:bg-gray-200 rounded-md" title="Edit"><PencilIcon className="w-4 h-4 text-blue-600"/></button>
                                            <button className="p-1.5 hover:bg-gray-200 rounded-md" title="Delete"><TrashIcon className="w-4 h-4 text-red-600"/></button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </AdminSection>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <AdminSection title="User Management">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-brand-text-muted">
                            <thead className="text-xs text-brand-text uppercase bg-brand-light">
                                <tr>
                                    <th scope="col" className="px-6 py-3">User Email</th>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Role</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allProfiles.map(profile => (
                                    <tr key={profile.user.email} className="bg-white border-b hover:bg-brand-light">
                                        <td className="px-6 py-4 font-medium text-brand-text">{profile.user.email}</td>
                                        <td className="px-6 py-4">{profile.user.firstName} {profile.user.lastName}</td>
                                        <td className="px-6 py-4">{profile.user.email === 'theivsightcompany@gmail.com' ? 'Admin' : 'Owner'}</td>
                                        <td className="px-6 py-4 flex items-center space-x-2">
                                            {profile.user.email !== 'theivsightcompany@gmail.com' &&
                                                <button onClick={() => onImpersonate(profile.user.email)} className="p-1.5 hover:bg-gray-200 rounded-md" title="Impersonate User"><EyeIcon className="w-4 h-4 text-green-600"/></button>
                                            }
                                            <button className="p-1.5 hover:bg-gray-200 rounded-md" title="Edit"><PencilIcon className="w-4 h-4 text-blue-600"/></button>
                                            <button className="p-1.5 hover:bg-gray-200 rounded-md" title="Delete"><TrashIcon className="w-4 h-4 text-red-600"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AdminSection>
            )}

            {/* SUPPORT TICKETS TAB */}
            {activeTab === 'support' && (
                <div className="space-y-6">
                    {/* Ticket Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-gray-900">{ticketStats.total}</div>
                            <div className="text-sm text-gray-600">Total Tickets</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="text-2xl font-bold text-blue-700">{ticketStats.open}</div>
                            <div className="text-sm text-blue-600">Open</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-700">{ticketStats.in_progress}</div>
                            <div className="text-sm text-yellow-600">In Progress</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-700">{ticketStats.resolved}</div>
                            <div className="text-sm text-green-600">Resolved</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="waiting_customer">Waiting on Customer</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    {/* Tickets Table */}
                    <AdminSection title="Support Tickets">
                        {isLoadingTickets ? (
                            <div className="text-center py-8 text-gray-500">Loading tickets...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No tickets found</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-brand-text-muted">
                                    <thead className="text-xs text-brand-text uppercase bg-brand-light">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">ID</th>
                                            <th scope="col" className="px-6 py-3">Subject</th>
                                            <th scope="col" className="px-6 py-3">User</th>
                                            <th scope="col" className="px-6 py-3">Status</th>
                                            <th scope="col" className="px-6 py-3">Priority</th>
                                            <th scope="col" className="px-6 py-3">Created</th>
                                            <th scope="col" className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTickets.map(ticket => (
                                            <tr key={ticket.id} className="bg-white border-b hover:bg-brand-light">
                                                <td className="px-6 py-4 font-mono text-xs">{ticket.id.substring(0, 8)}...</td>
                                                <td className="px-6 py-4 font-medium text-brand-text max-w-xs truncate">{ticket.subject}</td>
                                                <td className="px-6 py-4">{ticket.user_email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-semibold ${getPriorityColor(ticket.priority)}`}>
                                                        {ticket.priority.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{new Date(ticket.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => setSelectedTicket(ticket)}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </AdminSection>
                </div>
            )}

            {/* TICKET DETAIL MODAL */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.subject}</h2>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>👤 {selectedTicket.user_email}</span>
                                        <span>📅 {new Date(selectedTicket.created_at).toLocaleString()}</span>
                                        {selectedTicket.business_name && <span>🏢 {selectedTicket.business_name}</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex gap-4">
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

                            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-2xl rounded-lg p-4 ${
                                        msg.sender_type === 'agent'
                                            ? 'bg-blue-100 text-gray-900'
                                            : msg.sender_type === 'bot'
                                            ? 'bg-purple-50 border border-purple-200'
                                            : 'bg-white border border-gray-200'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold">
                                                {msg.sender_type === 'agent' ? '🛠️ Support Team' :
                                                 msg.sender_type === 'bot' ? '🤖 JetBot' :
                                                 '👤 ' + (msg.sender_name || 'Customer')}
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
                        <div className="p-6 border-t border-gray-200 bg-white">
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
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Send size={18} />
                                    {isSendingMessage ? 'Sending...' : 'Send Reply'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
