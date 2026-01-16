// =====================================================
// ENHANCED ADMIN PANEL WITH SUPPORT TICKET MANAGEMENT
// Integrates support into existing admin back office
// =====================================================

import React, { useState, useEffect } from 'react';
import type { ProfileData, BusinessDna } from '../types';
import type { SupportTicket, SupportMessage, TicketStatus, TicketPriority } from '../Types/supportTypes';
import { TrashIcon, PencilIcon, EyeIcon, ArrowPathIcon, CreditCardIcon, PlusIcon } from '../components/icons/MiniIcons';
import { MessageSquare, Send, X, Clock, CheckCircle2, AlertCircle, Filter, Search, Loader2 } from '../components/SupportIcons';
import supportService from '../services/supportService';

interface AdminPanelProps {
    allProfiles: ProfileData[]; // This is now the list of ALL users
    setAllProfiles: React.Dispatch<React.SetStateAction<ProfileData[]>>;
    currentUserProfile: ProfileData;
    setCurrentUserProfile: (data: ProfileData) => void;
    onImpersonate: (profile: ProfileData | null) => void; 
    onDataChange: () => void;
}

// --- HELPER FUNCTIONS ---

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

const dnaStatus = (dna: BusinessDna) => {
    if (!dna || (!dna.logo && dna.colors?.length === 0 && !dna.fonts)) return { text: 'Not Started', color: 'bg-gray-200 text-gray-800' };
    if (dna.logo && dna.colors?.length > 0 && dna.fonts) return { text: 'Complete', color: 'bg-green-100 text-green-800' };
    return { text: 'Incomplete', color: 'bg-yellow-100 text-yellow-800' };
};

const AdminSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-brand-text mb-6">{title}</h2>
        {children}
    </div>
);

// --- MAIN COMPONENT ---

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    allProfiles, 
    setAllProfiles, 
    currentUserProfile, 
    setCurrentUserProfile, 
    onImpersonate,
    onDataChange
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'users' | 'support' | 'revenue' | 'announcements'>('overview');
    
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

    const [revenueData, setRevenueData] = useState<{
        totalActiveSubscriptions: number;
        monthlyRecurringRevenue: number;
        founderRevenue: number;
        standardRevenue: number;
        subscriptions: any[];
    } | null>(null);
    const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
    
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
    
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isWipingData, setIsWipingData] = useState<string | null>(null); 
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [creationResult, setCreationResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isGrantingAccess, setIsGrantingAccess] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'support') {
            loadTickets();
        }
    }, [activeTab]);
    
    useEffect(() => {
        if (activeTab === 'revenue') {
            loadRevenueData();
        }
    }, [activeTab]);
    
    useEffect(() => {
      if (activeTab === 'announcements') {
        loadAnnouncements();
      }
    }, [activeTab]);

    useEffect(() => {
        let filtered = [...tickets];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

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

    const filteredProfiles = allProfiles.filter(profile => {
        if (!userSearchTerm) return true;
        const term = userSearchTerm.toLowerCase();
        const fullName = `${profile.user.firstName} ${profile.user.lastName}`.toLowerCase();
        const businessName = profile.business.business_name?.toLowerCase() || '';
        
        return profile.user.email.toLowerCase().includes(term) ||
               fullName.includes(term) ||
               businessName.includes(term);
    });

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

    const handleWipeUserData = async (targetUserId: string, targetUserEmail: string) => {
        if (!window.confirm(`CRITICAL ACTION: Are you absolutely sure you want to wipe ALL data and DELETE the user account for ${targetUserEmail}? This action is irreversible.`)) {
            return;
        }

        setIsWipingData(targetUserId);
        try {
            const response = await fetch('/api/admin/wipe-user-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': currentUserProfile.user.email 
                },
                body: JSON.stringify({ targetUserId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to wipe data on server.');
            }

            onDataChange();
            alert(`Successfully wiped all data and deleted user: ${targetUserEmail}`);

        } catch (error: any) {
            console.error('Wipe data error:', error);
            alert(`Wipe failed: ${error.message}`);
        } finally {
            setIsWipingData(null);
        }
    };

    const handleCreateFreeUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingUser(true);
        setCreationResult(null);
        try {
            const response = await fetch('/api/admin/create-free-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': currentUserProfile.user.email
                },
                body: JSON.stringify(newUser)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to create user.');
            
            setCreationResult({ success: true, message: `User created successfully! Temp password: ${newUser.password}` });
            
            // Refresh the list
            onDataChange();
            
            // Keep success message visible for a bit longer so admin can copy the password
            setTimeout(() => {
                setShowAddUserModal(false);
                setNewUser({ email: '', password: '', firstName: '', lastName: '' });
                setCreationResult(null);
            }, 8000);

        } catch (error: any) {
            setCreationResult({ success: false, message: error.message });
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleGrantFreeAccess = async (targetUserId: string, targetUserEmail: string) => {
        if (!window.confirm(`Are you sure you want to grant lifetime free access to ${targetUserEmail}? This will give them an active subscription.`)) {
            return;
        }

        setIsGrantingAccess(targetUserId);
        try {
            const response = await fetch('/api/admin/grant-free-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': currentUserProfile.user.email
                },
                body: JSON.stringify({ targetUserId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to grant access.');
            }

            alert(`Successfully granted free access to ${targetUserEmail}.`);
            onDataChange();
        } catch (error: any) {
            console.error('Grant access error:', error);
            alert(`Failed to grant access: ${error.message}`);
        } finally {
            setIsGrantingAccess(null);
        }
    };

    const handleResetDna = (userId: string) => {
        const profile = allProfiles.find(p => p.user.id === userId);
        const email = profile?.user.email || userId;
        
        if (window.confirm(`Are you sure you want to reset DNA for ${email}? This will clear all extracted data.`)) {
            console.log(`[ADMIN] Forcing DNA reset for user UUID: ${userId}.`);
            onDataChange(); // Refresh list to reflect reset status if implemented backend
            alert(`DNA reset complete for ${email}.`);
        }
    };

    const handleResetCurrentUserDna = () => {
        handleResetDna(currentUserProfile.user.id);
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
                            <button onClick={() => setShowAddUserModal(true)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg border border-blue-200 text-left">
                                <h3 className="font-bold">Create Free User</h3>
                                <p className="text-xs mt-1">Quick-add a new user with a business profile for testing.</p>
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
                                <div className="text-sm text-green-600">Total Users</div>
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
                    <div className="mb-4 relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Business Name, Owner Email, or User Name..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
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
                                {filteredProfiles.map(profile => {
                                    const status = dnaStatus(profile.business?.dna);
                                    return (
                                    <tr key={profile.user.id} className="bg-white border-b hover:bg-brand-light">
                                        <th scope="row" className="px-6 py-4 font-medium text-brand-text whitespace-nowrap">{profile.business?.business_name || '(No Name)'}</th>
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
                    <div className="flex justify-between items-center mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by User Email, User Name, or Business Name..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button onClick={() => setShowAddUserModal(true)} className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <PlusIcon className="w-5 h-5" /> Create Free User
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-brand-text-muted">
                            <thead className="text-xs text-brand-text uppercase bg-brand-light">
                                <tr>
                                    <th scope="col" className="px-6 py-3">User Email</th>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Business</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProfiles.map(profile => (
                                    <tr key={profile.user.id} className="bg-white border-b hover:bg-brand-light">
                                        <td className="px-6 py-4 font-medium text-brand-text">{profile.user.email}</td>
                                        <td className="px-6 py-4">{profile.user.firstName} {profile.user.lastName}</td>
                                        <td className="px-6 py-4">{profile.business?.business_name || '(No Business)'}</td>
                                        <td className="px-6 py-4 flex items-center space-x-2">
                                            {profile.user.email !== currentUserProfile.user.email &&
                                                <button onClick={() => onImpersonate(profile)} className="p-1.5 hover:bg-gray-200 rounded-md" title="Impersonate User"><EyeIcon className="w-4 h-4 text-green-600"/></button>
                                            }
                                            <button 
                                                onClick={() => handleGrantFreeAccess(profile.user.id, profile.user.email)}
                                                disabled={isGrantingAccess === profile.user.id}
                                                className="p-1.5 hover:bg-gray-200 rounded-md" 
                                                title="Grant Lifetime Free Access"
                                            >
                                                {isGrantingAccess === profile.user.id ? (
                                                    <Loader2 size={16} className="animate-spin text-green-600" />
                                                ) : (
                                                    <CreditCardIcon className="w-4 h-4 text-green-600"/>
                                                )}
                                            </button>
                                            <button className="p-1.5 hover:bg-gray-200 rounded-md" title="Edit"><PencilIcon className="w-4 h-4 text-blue-600"/></button>
                                            
                                            {profile.user.email !== currentUserProfile.user.email && (
                                                <button 
                                                    onClick={() => handleWipeUserData(profile.user.id, profile.user.email)} 
                                                    disabled={isWipingData === profile.user.id}
                                                    className="p-1.5 hover:bg-red-100 rounded-md" 
                                                    title="Wipe All Data & Delete User"
                                                >
                                                    {isWipingData === profile.user.id ? (
                                                        <Loader2 size={16} className="animate-spin text-red-600" />
                                                    ) : (
                                                        <TrashIcon className="w-4 h-4 text-red-600"/>
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AdminSection>
            )}

            {/* SUPPORT TAB */}
            {activeTab === 'support' && (
                <div className="space-y-6">
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
            
            {/* REVENUE TAB */}
            {activeTab === 'revenue' && (
                <AdminSection title="Revenue Insights">
                    {isLoadingRevenue ? (
                        <Loader />
                    ) : revenueData ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                    <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Total Active Subs</p>
                                    <div className="text-3xl font-extrabold text-blue-700">{revenueData.totalActiveSubscriptions}</div>
                                </div>
                                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                    <p className="text-sm font-bold text-green-600 uppercase tracking-wider mb-2">Total MRR</p>
                                    <div className="text-3xl font-extrabold text-green-700">${revenueData.monthlyRecurringRevenue}</div>
                                </div>
                                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                                    <p className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-2">Founder MRR</p>
                                    <div className="text-3xl font-extrabold text-purple-700">${revenueData.founderRevenue}</div>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                    <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Standard MRR</p>
                                    <div className="text-3xl font-extrabold text-slate-700">${revenueData.standardRevenue}</div>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-brand-text-muted">
                                    <thead className="text-xs text-brand-text uppercase bg-brand-light">
                                        <tr>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Tier</th>
                                            <th className="px-6 py-3">Biz/Seats</th>
                                            <th className="px-6 py-3">Monthly Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {revenueData.subscriptions.map((sub: any, i: number) => (
                                            <tr key={i} className="bg-white border-b hover:bg-brand-light">
                                                <td className="px-6 py-4 font-medium text-brand-text">{sub.user_email}</td>
                                                <td className="px-6 py-4 capitalize">{sub.subscription_plan}</td>
                                                <td className="px-6 py-4 text-xs">{sub.business_count} biz / {sub.seat_count} seats</td>
                                                <td className="px-6 py-4 font-bold text-green-600">${sub.monthly_value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Failed to load revenue metrics.</p>
                    )}
                </AdminSection>
            )}

            {/* ANNOUNCEMENTS TAB */}
            {activeTab === 'announcements' && (
                <AdminSection title="System Announcements">
                    <div className="mb-6 flex justify-end">
                        <button 
                            onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                        >
                            {showAnnouncementForm ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                            {showAnnouncementForm ? 'Cancel' : 'Create Announcement'}
                        </button>
                    </div>

                    {showAnnouncementForm && (
                        <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                            <input 
                                type="text" 
                                placeholder="Title" 
                                value={announcementForm.title}
                                onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                                className="w-full p-2 border rounded"
                            />
                            <textarea 
                                placeholder="Message" 
                                value={announcementForm.message}
                                onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})}
                                className="w-full p-2 border rounded h-24"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select 
                                    value={announcementForm.type}
                                    onChange={e => setAnnouncementForm({...announcementForm, type: e.target.value as any})}
                                    className="p-2 border rounded"
                                >
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="success">Success</option>
                                    <option value="update">Update</option>
                                </select>
                                <select 
                                    value={announcementForm.target_audience}
                                    onChange={e => setAnnouncementForm({...announcementForm, target_audience: e.target.value as any})}
                                    className="p-2 border rounded"
                                >
                                    <option value="all">All Users</option>
                                    <option value="founder">Founders Only</option>
                                    <option value="standard">Standard Only</option>
                                </select>
                            </div>
                            <button 
                                onClick={handleCreateAnnouncement}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg"
                            >
                                Publish Announcement
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {isLoadingAnnouncements ? <Loader /> : announcements.map(ann => (
                            <div key={ann.id} className={`p-4 rounded-lg border flex justify-between items-center ${ann.is_active ? 'bg-white border-slate-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-brand-text">{ann.title}</h3>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                            ann.type === 'warning' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                        }`}>{ann.type}</span>
                                    </div>
                                    <p className="text-sm text-brand-text-muted line-clamp-1">{ann.message}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleToggleActive(ann)} className="p-2 hover:bg-slate-100 rounded-md">
                                        {ann.is_active ? <EyeIcon className="w-5 h-5 text-blue-600"/> : <EyeIcon className="w-5 h-5 text-gray-400 opacity-50"/>}
                                    </button>
                                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 hover:bg-red-50 rounded-md">
                                        <TrashIcon className="w-5 h-5 text-red-500"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </AdminSection>
            )}

            {/* Add Free User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-brand-text">Create Free User</h3>
                        <p className="text-sm text-brand-text-muted mb-4">This will create a new user account with 1 business and 1 seat, and immediate active access.</p>
                        <form onSubmit={handleCreateFreeUser} className="space-y-4">
                            <input type="text" placeholder="First Name" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="w-full p-2 border rounded" required />
                            <input type="text" placeholder="Last Name" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="w-full p-2 border rounded" required />
                            <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-2 border rounded" required />
                            <input type="text" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-2 border rounded" required />
                            
                            {creationResult && (
                                <div className={`text-sm p-3 rounded font-semibold ${creationResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {creationResult.message}
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                                <button type="submit" disabled={isCreatingUser} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {isCreatingUser ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};