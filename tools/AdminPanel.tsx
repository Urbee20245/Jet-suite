// =====================================================
// ENHANCED ADMIN PANEL WITH SUPPORT TICKET MANAGEMENT
// Integrates support into existing admin back office
// =====================================================

import React, { useState, useEffect } from 'react';
import type { ProfileData, BusinessDna } from '../types';
import type { SupportTicket, SupportMessage, TicketStatus, TicketPriority } from '../Types/supportTypes';
import { TrashIcon, PencilIcon, EyeIcon, ArrowPathIcon, CreditCardIcon } from '../components/icons/MiniIcons';
import { MessageSquare, Send, X, Clock, CheckCircle2, AlertCircle, Filter, Search } from '../components/SupportIcons';
import supportService from '../services/supportService';

interface AdminPanelProps {
    allProfiles: ProfileData[];
    setAllProfiles: React.Dispatch<React.SetStateAction<ProfileData[]>>;
    currentUserProfile: ProfileData;
    setCurrentUserProfile: (data: ProfileData) => void;
    onImpersonate: (userId: string) => void;
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
    const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'users' | 'support' | 'revenue' | 'announcements'>('overview');
    
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

    // ===== REVENUE STATE (NEW) =====
    const [revenueData, setRevenueData] = useState<{
        totalActiveSubscriptions: number;
        monthlyRecurringRevenue: number;
        founderRevenue: number;
        standardRevenue: number;
        subscriptions: any[];
    } | null>(null);
    const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
    
    // ===== ANNOUNCEMENT STATE (NEW) =====
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [announcementForm, setAnnouncementForm] = useState({
      title: '',
      message: '',
      type: 'info' as 'info' | 'warning' | 'success' | 'update',
      target_audience: 'all' as 'all' | 'founder' | 'standard',
      priority: 1,
      end_date: ''
    });

    // ===== LOAD SUPPORT TICKETS =====
    useEffect(() => {
        if (activeTab === 'support') {
            loadTickets();
        }
    }, [activeTab]);
    
    // ===== LOAD REVENUE DATA (NEW) =====
    useEffect(() => {
        if (activeTab === 'revenue') {
            loadRevenueData();
        }
    }, [activeTab]);
    
    // ===== LOAD ANNOUNCEMENTS (NEW) =====
    useEffect(() => {
      if (activeTab === 'announcements') {
        loadAnnouncements();
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
    
    const loadRevenueData = async () => {
        setIsLoadingRevenue(true);
        try {
            // Pass current admin email for authorization check on the server
            const response = await fetch(`/api/admin/revenue?userEmail=${currentUserProfile.user.email}`);
            if (response.ok) {
                const data = await response.json();
                setRevenueData(data);
            } else {
                console.error('Failed to load revenue data:', response.status);
            }
        } catch (error) {
            console.error('Error loading revenue:', error);
        } finally {
            setIsLoadingRevenue(false);
        }
    };
    
    const loadAnnouncements = async () => {
      setIsLoadingAnnouncements(true);
      try {
        const response = await fetch('/api/admin/announcements', {
          headers: {
            'x-user-email': currentUserProfile.user.email
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('Error loading announcements:', error);
      } finally {
        setIsLoadingAnnouncements(false);
      }
    };

    const handleCreateAnnouncement = async () => {
      try {
        const response = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUserProfile.user.email
          },
          body: JSON.stringify(announcementForm)
        });

        if (response.ok) {
          setShowAnnouncementForm(false);
          setAnnouncementForm({
            title: '',
            message: '',
            type: 'info',
            target_audience: 'all',
            priority: 1,
            end_date: ''
          });
          loadAnnouncements();
        }
      } catch (error) {
        console.error('Error creating announcement:', error);
      }
    };

    const handleDeleteAnnouncement = async (id: string) => {
      if (!confirm('Delete this announcement?')) return;
      
      try {
        const response = await fetch('/api/admin/announcements', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUserProfile.user.email
          },
          body: JSON.stringify({ id })
        });

        if (response.ok) {
          loadAnnouncements();
        }
      } catch (error) {
        console.error('Error deleting announcement:', error);
      }
    };

    const handleToggleActive = async (announcement: any) => {
      try {
        const response = await fetch('/api/admin/announcements', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': currentUserProfile.user.email
          },
          body: JSON.stringify({
            id: announcement.id,
            ...announcement,
            is_active: !announcement.is_active
          })
        });

        if (response.ok) {
          loadAnnouncements();
        }
      } catch (error) {
        console.error('Error toggling announcement:', error);
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

    // ===== UPDATED ADMIN FUNCTIONS (USING UUID) =====
    const handleResetDna = (userId: string) => {
        const profile = allProfiles.find(p => p.user.id === userId);
        const email = profile?.user.email || userId;
        
        if (window.confirm(`Are you sure you want to reset DNA for ${email}? This will clear all extracted data.`)) {
            console.log(`[ADMIN] Forcing DNA reset for user UUID: ${userId}.`);
            setAllProfiles(profiles => profiles.map(p => {
                if (p.user.id === userId) {
                    return { 
                        ...p, 
                        business: { ...p.business, dna: { logo: '', colors: [], fonts: '', style: '' } }, 
                        brandDnaProfile: undefined 
                    };
                }
                return p;
            }));
            alert(`DNA reset complete for ${email}.`);
        }
    };

    const handleResetCurrentUserDna = () => {
        handleResetDna(currentUserProfile.user.id);
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
                    <button
                        onClick={() => setActiveTab('revenue')}
                        className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                            activeTab === 'revenue'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        💰 Revenue
                    </button>
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                            activeTab === 'announcements'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        📢 Announcements
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
                                    <tr key={profile.user.id} className="bg-white border-b hover:bg-brand-light">
                                        <th scope="row" className="px-6 py-4 font-medium text-brand-text whitespace-nowrap">{profile.business.business_name || '(No Name)'}</th>
                                        <td className="px-6 py-4">{profile.user.email}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>{status.text}</span></td>
                                        <td className="px-6 py-4 flex items-center space-x-2">
                                            <button onClick={() => handleResetDna(profile.user.id)} className="p-1.5 hover:bg-gray-200 rounded-md" title="Reset DNA"><ArrowPathIcon className="w-4 h-4 text-yellow-600"/></button>
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
                                    <tr key={profile.user.id} className="bg-white border-b hover:bg-brand-light">
                                        <td className="px-6 py-4 font-medium text-brand-text">{profile.user.email}</td>
                                        <td className="px-6 py-4">{profile.user.firstName} {profile.user.lastName}</td>
                                        <td className="px-6 py-4">{profile.user.email === 'theivsightcompany@gmail.com' ? 'Admin' : 'Owner'}</td>
                                        <td className="px-6 py-4 flex items-center space-x-2">
                                            {profile.user.email !== 'theivsightcompany@gmail.com' &&
                                                <button onClick={() => onImpersonate(profile.user.id)} className="p-1.5 hover:bg-gray-200 rounded-md" title="Impersonate User"><EyeIcon className="w-4 h-4 text-green-600"/></button>
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
            
            {/* REVENUE TAB (NEW) */}
            {activeTab === 'revenue' && (
                <div className="space-y-6">
                    <AdminSection title="Revenue Overview">
                        {isLoadingRevenue ? (
                            <div className="text-center py-8 text-gray-400">Loading revenue data...</div>
                        ) : revenueData ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* MRR Card */}
                                <div className="bg-brand-darker p-6 rounded-lg border border-slate-700">
                                    <div className="text-sm text-gray-400 mb-2">Monthly Recurring Revenue</div>
                                    <div className="text-3xl font-bold text-green-400">
                                        ${revenueData.monthlyRecurringRevenue.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Total MRR</div>
                                </div>

                                {/* Active Subscriptions */}
                                <div className="bg-brand-darker p-6 rounded-lg border border-slate-700">
                                    <div className="text-sm text-gray-400 mb-2">Active Subscriptions</div>
                                    <div className="text-3xl font-bold text-blue-400">
                                        {revenueData.totalActiveSubscriptions}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Paying customers</div>
                                </div>

                                {/* Average Revenue */}
                                <div className="bg-brand-darker p-6 rounded-lg border border-slate-700">
                                    <div className="text-sm text-gray-400 mb-2">Average Per Customer</div>
                                    <div className="text-3xl font-bold text-purple-400">
                                        ${revenueData.totalActiveSubscriptions > 0 
                                        ? Math.round(revenueData.monthlyRecurringRevenue / revenueData.totalActiveSubscriptions)
                                        : 0}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Per month</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">No revenue data available</div>
                        )}
                    </AdminSection>

                    {revenueData && (
                        <AdminSection title="Revenue Breakdown">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-brand-darker p-4 rounded-lg border border-slate-700">
                                    <div className="text-sm text-gray-400 mb-1">Founder Tier Revenue</div>
                                    <div className="text-2xl font-bold text-green-400">
                                        ${revenueData.founderRevenue.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-brand-darker p-4 rounded-lg border border-slate-700">
                                    <div className="text-sm text-gray-400 mb-1">Standard Tier Revenue</div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        ${revenueData.standardRevenue.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Subscriptions Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-brand-darker">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Plan</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Businesses</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Seats</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Monthly Value</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {revenueData.subscriptions.map((sub, idx) => (
                                            <tr key={idx} className="hover:bg-brand-darker/50">
                                                <td className="px-4 py-3 text-sm text-gray-300">{sub.user_email}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        sub.subscription_plan === 'founder' 
                                                        ? 'bg-purple-900/50 text-purple-300' 
                                                        : 'bg-blue-900/50 text-blue-300'
                                                    }`}>
                                                        {sub.subscription_plan}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-300">{sub.business_count}</td>
                                                <td className="px-4 py-3 text-sm text-gray-300">{sub.seat_count}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-green-400">
                                                    ${sub.monthly_value}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/50 text-green-300">
                                                        {sub.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </AdminSection>
                    )}
                </div>
            )}
            
            {/* ANNOUNCEMENTS TAB (NEW) */}
            {activeTab === 'announcements' && (
              <div className="space-y-6">
                <AdminSection title="Manage Announcements">
                  <button
                    onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                    className="mb-6 px-6 py-3 bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold rounded-lg transition-colors"
                  >
                    {showAnnouncementForm ? 'Cancel' : '+ Create New Announcement'}
                  </button>

                  {/* Announcement Form */}
                  {showAnnouncementForm && (
                    <div className="bg-brand-darker p-6 rounded-lg border border-slate-700 mb-6">
                      <h3 className="text-lg font-semibold text-white mb-4">New Announcement</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                          <input
                            type="text"
                            value={announcementForm.title}
                            onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                            className="w-full bg-brand-dark border border-slate-600 rounded-lg px-4 py-2 text-white"
                            placeholder="Announcement title..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                          <textarea
                            value={announcementForm.message}
                            onChange={(e) => setAnnouncementForm({...announcementForm, message: e.target.value})}
                            className="w-full bg-brand-dark border border-slate-600 rounded-lg px-4 py-2 text-white h-32"
                            placeholder="Announcement message..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                            <select
                              value={announcementForm.type}
                              onChange={(e) => setAnnouncementForm({...announcementForm, type: e.target.value as any})}
                              className="w-full bg-brand-dark border border-slate-600 rounded-lg px-4 py-2 text-white"
                            >
                              <option value="info">Info</option>
                              <option value="success">Success</option>
                              <option value="warning">Warning</option>
                              <option value="update">Update</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                            <select
                              value={announcementForm.target_audience}
                              onChange={(e) => setAnnouncementForm({...announcementForm, target_audience: e.target.value as any})}
                              className="w-full bg-brand-dark border border-slate-600 rounded-lg px-4 py-2 text-white"
                            >
                              <option value="all">All Users</option>
                              <option value="founder">Founder Tier</option>
                              <option value="standard">Standard Tier</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={announcementForm.priority}
                              onChange={(e) => setAnnouncementForm({...announcementForm, priority: parseInt(e.target.value)})}
                              className="w-full bg-brand-dark border border-slate-600 rounded-lg px-4 py-2 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">End Date (Optional)</label>
                          <input
                            type="datetime-local"
                            value={announcementForm.end_date}
                            onChange={(e) => setAnnouncementForm({...announcementForm, end_date: e.target.value})}
                            className="w-full bg-brand-dark border border-slate-600 rounded-lg px-4 py-2 text-white"
                          />
                        </div>

                        <button
                          onClick={handleCreateAnnouncement}
                          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                        >
                          Create Announcement
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Announcements List */}
                  {isLoadingAnnouncements ? (
                    <div className="text-center py-8 text-gray-400">Loading announcements...</div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No announcements yet</div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className="bg-brand-darker p-6 rounded-lg border border-slate-700"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  announcement.type === 'info' ? 'bg-blue-900/50 text-blue-300' :
                                  announcement.type === 'success' ? 'bg-green-900/50 text-green-300' :
                                  announcement.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300' :
                                  'bg-purple-900/50 text-purple-300'
                                }`}>
                                  {announcement.type}
                                </span>
                                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-900/50 text-gray-300">
                                  {announcement.target_audience}
                                </span>
                                {announcement.is_active ? (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/50 text-green-300">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-900/50 text-red-300">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-300 mb-3">{announcement.message}</p>
                              <div className="text-xs text-gray-500">
                                Created: {new Date(announcement.created_at).toLocaleDateString()} | 
                                Priority: {announcement.priority}
                                {announcement.end_date && ` | Ends: ${new Date(announcement.end_date).toLocaleDateString()}`}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleActive(announcement)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                              >
                                {announcement.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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