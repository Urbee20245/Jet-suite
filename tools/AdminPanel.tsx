import React, { useState, useEffect } from 'react';
import type { ProfileData, BusinessDna } from '../types';
import type { SupportTicket, SupportMessage, TicketStatus, TicketPriority } from '../Types/supportTypes';
import { TrashIcon, PencilIcon, EyeIcon, ArrowPathIcon, CreditCardIcon, PlusIcon } from '../components/icons/MiniIcons';
import { MessageSquare, Send, X, Clock, CheckCircle2, AlertCircle, Filter, Search, Loader2, Plus, Download, ChevronLeft, ChevronRight } from '../components/SupportIcons';
import { Loader } from '../components/Loader';
import supportService from '../services/supportService';

const ADMIN_EMAIL = 'theivsightcompany@gmail.com';
const ITEMS_PER_PAGE = 20;

interface AdminPanelProps {
    allProfiles: ProfileData[];
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

// Pagination Component
const Pagination: React.FC<{
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;
    
    return (
        <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Toast Notification Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${
            type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
            {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message}</span>
            <button onClick={onClose} className="ml-4">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// Confirmation Modal Component
const ConfirmModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}> = ({ isOpen, title, message, confirmText, onConfirm, onCancel, isDestructive = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold mb-2 text-brand-text">{title}</h3>
                <p className="text-sm text-brand-text-muted mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                        className={`px-4 py-2 rounded-lg text-white ${
                            isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

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
    
    // Support Ticket State
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [ticketSearchTerm, setTicketSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');

    // Revenue State
    const [revenueData, setRevenueData] = useState<{
        totalActiveSubscriptions: number;
        monthlyRecurringRevenue: number;
        founderRevenue: number;
        standardRevenue: number;
        subscriptions: any[];
    } | null>(null);
    const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
    
    // Announcements State
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
    
    // User Management State
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isWipingData, setIsWipingData] = useState<string | null>(null); 
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [creationResult, setCreationResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isGrantingAccess, setIsGrantingAccess] = useState<string | null>(null);
    
    // Edit Modals State
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<ProfileData | null>(null);
    const [showEditBusinessModal, setShowEditBusinessModal] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState<ProfileData | null>(null);
    
    // Pagination State
    const [usersPage, setUsersPage] = useState(1);
    const [businessesPage, setBusinessesPage] = useState(1);
    const [ticketsPage, setTicketsPage] = useState(1);
    const [revenuePage, setRevenuePage] = useState(1);
    
    // Bulk Selection State
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    
    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
        isDestructive?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        onConfirm: () => {},
        isDestructive: false
    });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const showConfirm = (title: string, message: string, confirmText: string, onConfirm: () => void, isDestructive = false) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            confirmText,
            onConfirm,
            isDestructive
        });
    };

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
        onDataChange();
    }, []);

    useEffect(() => {
        let filtered = [...tickets];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        if (ticketSearchTerm) {
            const term = ticketSearchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.subject.toLowerCase().includes(term) ||
                t.user_email.toLowerCase().includes(term) ||
                t.description.toLowerCase().includes(term)
            );
        }

        setFilteredTickets(filtered);
    }, [tickets, statusFilter, ticketSearchTerm]);

    const filteredProfiles = allProfiles.filter(profile => {
        if (!userSearchTerm) return true;
        const term = userSearchTerm.toLowerCase();
        const fullName = `${profile.user.firstName} ${profile.user.lastName}`.toLowerCase();
        const businessName = profile.business.business_name?.toLowerCase() || '';
        
        return profile.user.email.toLowerCase().includes(term) ||
               fullName.includes(term) ||
               businessName.includes(term);
    });

    // Paginated data
    const paginatedUsers = filteredProfiles.slice(
        (usersPage - 1) * ITEMS_PER_PAGE,
        usersPage * ITEMS_PER_PAGE
    );

    const paginatedBusinesses = filteredProfiles.slice(
        (businessesPage - 1) * ITEMS_PER_PAGE,
        businessesPage * ITEMS_PER_PAGE
    );

    const paginatedTickets = filteredTickets.slice(
        (ticketsPage - 1) * ITEMS_PER_PAGE,
        ticketsPage * ITEMS_PER_PAGE
    );

    const paginatedRevenue = revenueData?.subscriptions.slice(
        (revenuePage - 1) * ITEMS_PER_PAGE,
        revenuePage * ITEMS_PER_PAGE
    ) || [];

    const loadTickets = async () => {
        setIsLoadingTickets(true);
        try {
            const result = await supportService.getAllTickets();
            if (result.success) {
                setTickets(result.data || []);
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
            showToast('Failed to load support tickets', 'error');
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
                showToast('Failed to load revenue data', 'error');
            }
        } catch (error) {
            console.error('Error loading revenue:', error);
            showToast('Error loading revenue data', 'error');
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
        } else {
          showToast('Failed to load announcements', 'error');
        }
      } catch (error) {
        console.error('Error loading announcements:', error);
        showToast('Error loading announcements', 'error');
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
          showToast('Announcement created successfully', 'success');
        } else {
          showToast('Failed to create announcement', 'error');
        }
      } catch (error) {
        console.error('Error creating announcement:', error);
        showToast('Error creating announcement', 'error');
      }
    };

    const handleDeleteAnnouncement = async (id: string) => {
      showConfirm(
        'Delete Announcement',
        'Are you sure you want to delete this announcement? This action cannot be undone.',
        'Delete',
        async () => {
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
              showToast('Announcement deleted', 'success');
            } else {
              showToast('Failed to delete announcement', 'error');
            }
          } catch (error) {
            console.error('Error deleting announcement:', error);
            showToast('Error deleting announcement', 'error');
          }
        },
        true
      );
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
          showToast(`Announcement ${!announcement.is_active ? 'activated' : 'deactivated'}`, 'success');
        } else {
          showToast('Failed to update announcement', 'error');
        }
      } catch (error) {
        console.error('Error toggling announcement:', error);
        showToast('Error updating announcement', 'error');
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
            showToast('Failed to load ticket messages', 'error');
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
                showToast('Message sent', 'success');
            } else {
                showToast('Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Error sending message', 'error');
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
                showToast('Ticket status updated', 'success');
            } else {
                showToast('Failed to update ticket status', 'error');
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            showToast('Error updating ticket status', 'error');
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
                showToast('Ticket priority updated', 'success');
            } else {
                showToast('Failed to update priority', 'error');
            }
        } catch (error) {
            console.error('Error updating priority:', error);
            showToast('Error updating priority', 'error');
        }
    };

    const handleWipeUserData = async (targetUserId: string, targetUserEmail: string) => {
        showConfirm(
            'Delete User Account',
            `CRITICAL ACTION: This will permanently wipe ALL data and DELETE the account for ${targetUserEmail}. This action is irreversible.`,
            'Delete Account',
            async () => {
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
                    showToast(`Successfully deleted user: ${targetUserEmail}`, 'success');

                } catch (error: any) {
                    console.error('Wipe data error:', error);
                    showToast(`Wipe failed: ${error.message}`, 'error');
                } finally {
                    setIsWipingData(null);
                }
            },
            true
        );
    };

    const handleBulkWipeFreeUsers = async () => {
        showConfirm(
            'Bulk Delete Free Users',
            'CRITICAL BULK ACTION: This will delete ALL users on Free/Admin-Granted plans including their business profiles, tasks, and accounts. This cannot be undone.',
            'Delete All Free Users',
            async () => {
                setIsBulkLoading(true);
                try {
                    const response = await fetch('/api/admin/bulk-wipe-free-users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-email': currentUserProfile.user.email
                        }
                    });

                    const data = await response.json();
                    if (!response.ok) throw new Error(data.message || 'Failed to perform bulk wipe.');

                    showToast(data.message, 'success');
                    onDataChange();
                } catch (error: any) {
                    console.error('Bulk wipe error:', error);
                    showToast(`Bulk wipe failed: ${error.message}`, 'error');
                } finally {
                    setIsBulkLoading(false);
                }
            },
            true
        );
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
            
            setCreationResult({ 
                success: true, 
                message: `✅ User created successfully!\n\n📧 Email: ${newUser.email}\n🔑 Temporary Password: ${newUser.password}\n\n⚠️ Copy this password now - it won't be shown again!` 
            });
            
            await onDataChange();
            setNewUser({ email: '', password: '', firstName: '', lastName: '' });
            showToast('User created successfully', 'success');

        } catch (error: any) {
            setCreationResult({ 
                success: false, 
                message: `❌ Failed to create user: ${error.message}` 
            });
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleGrantFreeAccess = async (targetUserId: string, targetUserEmail: string) => {
        showConfirm(
            'Grant Free Access',
            `Are you sure you want to grant lifetime free access to ${targetUserEmail}? This will give them an active subscription.`,
            'Grant Access',
            async () => {
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

                    showToast(`Successfully granted free access to ${targetUserEmail}`, 'success');
                    onDataChange();
                } catch (error: any) {
                    console.error('Grant access error:', error);
                    showToast(`Failed to grant access: ${error.message}`, 'error');
                } finally {
                    setIsGrantingAccess(null);
                }
            }
        );
    };

    const handleResetDna = async (userId: string) => {
        const profile = allProfiles.find(p => p.user.id === userId);
        const email = profile?.user.email || userId;
        
        showConfirm(
            'Reset Business DNA',
            `Are you sure you want to reset DNA for ${email}? This will clear all extracted data and allow re-extraction.`,
            'Reset DNA',
            async () => {
                try {
                    const response = await fetch('/api/admin/reset-dna', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-email': currentUserProfile.user.email
                        },
                        body: JSON.stringify({ targetUserId: userId })
                    });

                    if (response.ok) {
                        showToast(`DNA reset complete for ${email}`, 'success');
                        onDataChange();
                    } else {
                        showToast('Failed to reset DNA', 'error');
                    }
                } catch (error) {
                    console.error('Reset DNA error:', error);
                    showToast('Error resetting DNA', 'error');
                }
            }
        );
    };

    const handleResetCurrentUserDna = () => {
        handleResetDna(currentUserProfile.user.id);
    };

    const handleEditUser = (profile: ProfileData) => {
        setEditingUser(profile);
        setShowEditUserModal(true);
    };

    const handleSaveUserEdit = async () => {
        if (!editingUser) return;

        try {
            const response = await fetch('/api/admin/update-user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': currentUserProfile.user.email
                },
                body: JSON.stringify({
                    userId: editingUser.user.id,
                    firstName: editingUser.user.firstName,
                    lastName: editingUser.user.lastName,
                    email: editingUser.user.email
                })
            });

            if (response.ok) {
                showToast('User updated successfully', 'success');
                setShowEditUserModal(false);
                setEditingUser(null);
                onDataChange();
            } else {
                showToast('Failed to update user', 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('Error updating user', 'error');
        }
    };

    const handleEditBusiness = (profile: ProfileData) => {
        setEditingBusiness(profile);
        setShowEditBusinessModal(true);
    };

    const handleSaveBusinessEdit = async () => {
        if (!editingBusiness) return;

        try {
            const response = await fetch('/api/admin/update-business', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-email': currentUserProfile.user.email
                },
                body: JSON.stringify({
                    businessId: editingBusiness.business.id,
                    business_name: editingBusiness.business.business_name,
                    industry: editingBusiness.business.industry,
                    city: editingBusiness.business.city,
                    state: editingBusiness.business.state
                })
            });

            if (response.ok) {
                showToast('Business updated successfully', 'success');
                setShowEditBusinessModal(false);
                setEditingBusiness(null);
                onDataChange();
            } else {
                showToast('Failed to update business', 'error');
            }
        } catch (error) {
            console.error('Error updating business:', error);
            showToast('Error updating business', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.size === 0) {
            showToast('No users selected', 'error');
            return;
        }

        showConfirm(
            'Bulk Delete Users',
            `Are you sure you want to delete ${selectedUsers.size} selected user(s)? This will permanently delete all their data.`,
            'Delete Selected',
            async () => {
                for (const userId of selectedUsers) {
                    const profile = allProfiles.find(p => p.user.id === userId);
                    if (profile) {
                        await handleWipeUserData(userId, profile.user.email);
                    }
                }
                setSelectedUsers(new Set());
            },
            true
        );
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Export successful', 'success');
    };

    const handleExportUsers = () => {
        const exportData = filteredProfiles.map(p => ({
            email: p.user.email,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            business: p.business.business_name || 'No Business',
            city: p.business.city || '',
            state: p.business.state || ''
        }));
        exportToCSV(exportData, 'jetsuite-users.csv');
    };

    const handleExportRevenue = () => {
        if (!revenueData) return;
        const exportData = revenueData.subscriptions.map((sub: any) => ({
            email: sub.user_email,
            plan: sub.subscription_plan,
            businesses: sub.business_count,
            seats: sub.seat_count,
            monthlyValue: sub.monthly_value
        }));
        exportToCSV(exportData, 'jetsuite-revenue.csv');
    };

    const handleToggleUserSelection = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedUsers.size === paginatedUsers.filter(p => p.user.email !== ADMIN_EMAIL).length) {
            setSelectedUsers(new Set());
        } else {
            const allIds = new Set(paginatedUsers.filter(p => p.user.email !== ADMIN_EMAIL).map(p => p.user.id));
            setSelectedUsers(allIds);
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
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                isDestructive={confirmModal.isDestructive}
            />

            <div>
                <h1 className="text-3xl font-extrabold text-brand-text">Admin Panel</h1>
                <p className="text-lg text-brand-text-muted mt-1">Manage all businesses, users, support, and system settings.</p>
            </div>

            {/* TABS WITH COUNTERS */}
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
                        Businesses ({allProfiles.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
                            activeTab === 'users'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Users ({allProfiles.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors relative ${
                            activeTab === 'support'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Support ({ticketStats.open} open)
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
                        📢 Announcements ({announcements.length})
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
                                onClick={handleBulkWipeFreeUsers}
                                disabled={isBulkLoading}
                                className="bg-orange-50 hover:bg-orange-100 text-orange-700 p-4 rounded-lg border border-orange-200 text-left disabled:opacity-50"
                            >
                                <h3 className="font-bold">{isBulkLoading ? 'Wiping...' : 'Wipe All Free Users'}</h3>
                                <p className="text-xs mt-1">Bulk delete all test/free accounts to start fresh.</p>
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
                                    <th scope="col" className="px-6 py-3">Location</th>
                                    <th scope="col" className="px-6 py-3">DNA Status</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBusinesses.map(profile => {
                                    const status = dnaStatus(profile.business?.dna);
                                    const isAdminAccount = profile.user.email === ADMIN_EMAIL;
                                    
                                    return (
                                    <tr key={profile.user.id} className={`border-b hover:bg-brand-light ${isAdminAccount ? 'bg-yellow-50' : 'bg-white'}`}>
                                        <th scope="row" className="px-6 py-4 font-medium text-brand-text whitespace-nowrap">
                                            {profile.business?.business_name || '(No Name)'}
                                            {isAdminAccount && (
                                                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">ADMIN</span>
                                            )}
                                        </th>
                                        <td className="px-6 py-4">{profile.user.email}</td>
                                        <td className="px-6 py-4">{profile.business.location || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex items-center space-x-2">
                                            {!isAdminAccount && (
                                                <>
                                                    <button 
                                                        onClick={() => handleResetDna(profile.user.id)} 
                                                        className="p-1.5 hover:bg-gray-200 rounded-md" 
                                                        title="Reset DNA"
                                                    >
                                                        <ArrowPathIcon className="w-4 h-4 text-yellow-600"/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditBusiness(profile)}
                                                        className="p-1.5 hover:bg-gray-200 rounded-md" 
                                                        title="Edit Business"
                                                    >
                                                        <PencilIcon className="w-4 h-4 text-blue-600"/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleWipeUserData(profile.user.id, profile.user.email)} 
                                                        disabled={isWipingData === profile.user.id}
                                                        className="p-1.5 hover:bg-red-100 rounded-md" 
                                                        title="Wipe All Data & Delete Account"
                                                    >
                                                        {isWipingData === profile.user.id ? (
                                                            <Loader2 size={16} className="animate-spin text-red-600" />
                                                        ) : (
                                                            <TrashIcon className="w-4 h-4 text-red-600"/>
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                            {isAdminAccount && (
                                                <span className="text-xs text-gray-500 italic px-2">Protected Account</span>
                                            )}
                                        </td>
                                    </tr>
                                )}))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={businessesPage}
                        totalItems={filteredProfiles.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setBusinessesPage}
                    />
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
                        <div className="ml-4 flex gap-2">
                            {selectedUsers.size > 0 && (
                                <button 
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <TrashIcon className="w-5 h-5" /> Delete Selected ({selectedUsers.size})
                                </button>
                            )}
                            <button 
                                onClick={handleExportUsers}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Download className="w-5 h-5" /> Export CSV
                            </button>
                            <button 
                                onClick={() => setShowAddUserModal(true)} 
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" /> Create Free User
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-brand-text-muted">
                            <thead className="text-xs text-brand-text uppercase bg-brand-light">
                                <tr>
                                    <th scope="col" className="px-6 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.size === paginatedUsers.filter(p => p.user.email !== ADMIN_EMAIL).length && paginatedUsers.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded"
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-3">User Email</th>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Business</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map(profile => {
                                    const isAdminAccount = profile.user.email === ADMIN_EMAIL;
                                    
                                    return (
                                    <tr key={profile.user.id} className={`border-b hover:bg-brand-light ${isAdminAccount ? 'bg-yellow-50' : 'bg-white'}`}>
                                        <td className="px-6 py-4">
                                            {!isAdminAccount && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(profile.user.id)}
                                                    onChange={() => handleToggleUserSelection(profile.user.id)}
                                                    className="rounded"
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-brand-text">
                                            {profile.user.email}
                                            {isAdminAccount && (
                                                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">ADMIN</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{profile.user.firstName} {profile.user.lastName}</td>
                                        <td className="px-6 py-4">{profile.business?.business_name || '(No Business)'}</td>
                                        <td className="px-6 py-4 flex items-center space-x-2">
                                            {!isAdminAccount && (
                                                <>
                                                    <button 
                                                        onClick={() => onImpersonate(profile)} 
                                                        className="p-1.5 hover:bg-gray-200 rounded-md" 
                                                        title="Impersonate User"
                                                    >
                                                        <EyeIcon className="w-4 h-4 text-green-600"/>
                                                    </button>
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
                                                    <button 
                                                        onClick={() => handleEditUser(profile)}
                                                        className="p-1.5 hover:bg-gray-200 rounded-md" 
                                                        title="Edit User"
                                                    >
                                                        <PencilIcon className="w-4 h-4 text-blue-600"/>
                                                    </button>
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
                                                </>
                                            )}
                                            {isAdminAccount && (
                                                <span className="text-xs text-gray-500 italic px-2">Protected Account</span>
                                            )}
                                        </td>
                                    </tr>
                                )}))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={usersPage}
                        totalItems={filteredProfiles.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setUsersPage}
                    />
                </AdminSection>
            )}

            {/* SUPPORT TAB */}
            {activeTab === 'support' && (
                <div className="space-y-6">
                    <AdminSection title="Support Tickets">
                        {/* Filter Bar */}
                        <div className="flex gap-4 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search tickets by subject, user, or description..."
                                    value={ticketSearchTerm}
                                    onChange={(e) => setTicketSearchTerm(e.target.value)}
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
                                <option value="waiting_customer">Waiting Customer</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        {isLoadingTickets ? (
                            <div className="text-center py-8 text-gray-500">Loading tickets...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No tickets found</div>
                        ) : (
                            <>
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
                                            {paginatedTickets.map(ticket => (
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
                                                            onClick={() => {
                                                                setSelectedTicket(ticket);
                                                                loadMessages(ticket.id);
                                                            }}
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
                                <Pagination
                                    currentPage={ticketsPage}
                                    totalItems={filteredTickets.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setTicketsPage}
                                />
                            </>
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
                            
                            <div className="flex justify-end mb-4">
                                <button 
                                    onClick={handleExportRevenue}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Download className="w-5 h-5" /> Export Revenue CSV
                                </button>
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
                                        {paginatedRevenue.map((sub: any, i: number) => (
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
                            <Pagination
                                currentPage={revenuePage}
                                totalItems={revenueData.subscriptions.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setRevenuePage}
                            />
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
                            <div className="grid grid-cols-3 gap-4">
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
                                <input
                                    type="date"
                                    value={announcementForm.end_date}
                                    onChange={e => setAnnouncementForm({...announcementForm, end_date: e.target.value})}
                                    className="p-2 border rounded"
                                    placeholder="End Date (Optional)"
                                />
                            </div>
                            <button 
                                onClick={handleCreateAnnouncement}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700"
                            >
                                Publish Announcement
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {isLoadingAnnouncements ? <Loader /> : announcements.map(ann => (
                            <div key={ann.id} className={`p-4 rounded-lg border flex justify-between items-center ${ann.is_active ? 'bg-white border-slate-200' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-brand-text">{ann.title}</h3>
                                        <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded-full ${
                                            ann.type === 'warning' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                        }`}>{ann.type}</span>
                                        <span className="text-xs text-gray-500">
                                            {ann.target_audience !== 'all' && ('(' + ann.target_audience + ')')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-brand-text-muted line-clamp-2 mb-2">{ann.message}</p>
                                    <div className="flex gap-4 text-xs text-gray-500">
                                        <span>Created: {new Date(ann.created_at).toLocaleDateString()}</span>
                                        {ann.end_date && <span>Ends: {new Date(ann.end_date).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button onClick={() => handleToggleActive(ann)} className="p-2 hover:bg-slate-100 rounded-md" title={ann.is_active ? 'Deactivate' : 'Activate'}>
                                        {ann.is_active ? <EyeIcon className="w-5 h-5 text-blue-600"/> : <EyeIcon className="w-5 h-5 text-gray-400 opacity-50"/>}
                                    </button>
                                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 hover:bg-red-50 rounded-md" title="Delete">
                                        <TrashIcon className="w-5 h-5 text-red-500"/>
                                    </button>
                                </div>
                            </div>
                        )))}
                    </div>
                </AdminSection>
            )}

            {/* TICKET DETAIL MODAL */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold text-brand-text">{selectedTicket.subject}</h2>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                                        {selectedTicket.status.replace('_', ' ')}
                                    </span>
                                    <span className={`font-semibold text-sm ${getPriorityColor(selectedTicket.priority)}`}>
                                        {selectedTicket.priority.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-600">
                                    <span>From: {selectedTicket.user_email}</span>
                                    <span>Created: {new Date(selectedTicket.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 rounded-md">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Actions Bar */}
                        <div className="p-4 bg-gray-50 border-b flex gap-2">
                            <select
                                value={selectedTicket.status}
                                onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                                className="px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="waiting_customer">Waiting Customer</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                            <select
                                value={selectedTicket.priority}
                                onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as TicketPriority)}
                                className="px-3 py-2 border rounded-lg text-sm"
                            >
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Initial Description */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-blue-900">Original Message</span>
                                </div>
                                <p className="text-sm text-gray-800">{selectedTicket.description}</p>
                            </div>

                            {/* Messages Thread */}
                            {messages.map((msg) => (
                                <div key={msg.id} className={`p-4 rounded-lg ${
                                    msg.sender_type === 'agent' 
                                        ? 'bg-green-50 border border-green-200 ml-8' 
                                        : 'bg-gray-50 border border-gray-200 mr-8'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-semibold">
                                            {msg.sender_type === 'agent' ? 'Admin' : selectedTicket.user_email}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(msg.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-800">{msg.message}</p>
                                </div>
                            ))}
                        </div>

                        {/* Reply Box */}
                        <div className="p-4 border-t bg-white">
                            <div className="flex gap-2">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your response..."
                                    className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isSendingMessage || !newMessage.trim()}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSendingMessage ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {showEditUserModal && editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-brand-text">Edit User</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="First Name"
                                value={editingUser.user.firstName}
                                onChange={e => setEditingUser({
                                    ...editingUser,
                                    user: { ...editingUser.user, firstName: e.target.value }
                                })}
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={editingUser.user.lastName}
                                onChange={e => setEditingUser({
                                    ...editingUser,
                                    user: { ...editingUser.user, lastName: e.target.value }
                                })}
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={editingUser.user.email}
                                onChange={e => setEditingUser({
                                    ...editingUser,
                                    user: { ...editingUser.user, email: e.target.value }
                                })}
                                className="w-full p-2 border rounded"
                            />
                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        setShowEditUserModal(false);
                                        setEditingUser(null);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveUserEdit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT BUSINESS MODAL */}
            {showEditBusinessModal && editingBusiness && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-brand-text">Edit Business</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Business Name"
                                value={editingBusiness.business.business_name}
                                onChange={e => setEditingBusiness({
                                    ...editingBusiness,
                                    business: { ...editingBusiness.business, business_name: e.target.value }
                                })}
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Industry"
                                value={editingBusiness.business.industry}
                                onChange={e => setEditingBusiness({
                                    ...editingBusiness,
                                    business: { ...editingBusiness.business, industry: e.target.value }
                                })}
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="City"
                                value={editingBusiness.business.city}
                                onChange={e => setEditingBusiness({
                                    ...editingBusiness,
                                    business: { ...editingBusiness.business, city: e.target.value }
                                })}
                                className="w-full p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="State"
                                value={editingBusiness.business.state}
                                onChange={e => setEditingBusiness({
                                    ...editingBusiness,
                                    business: { ...editingBusiness.business, state: e.target.value }
                                })}
                                className="w-full p-2 border rounded"
                            />
                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        setShowEditBusinessModal(false);
                                        setEditingBusiness(null);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBusinessEdit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD FREE USER MODAL */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-brand-text">Create Free User</h3>
                        <p className="text-sm text-brand-text-muted mb-4">This will create a new user account with 1 business and 1 seat, and immediate active access.</p>
                        
                        <form onSubmit={handleCreateFreeUser} className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="First Name" 
                                value={newUser.firstName} 
                                onChange={e => setNewUser({...newUser, firstName: e.target.value})} 
                                className="w-full p-2 border rounded" 
                                required 
                                disabled={isCreatingUser}
                            />
                            <input 
                                type="text" 
                                placeholder="Last Name" 
                                value={newUser.lastName} 
                                onChange={e => setNewUser({...newUser, lastName: e.target.value})} 
                                className="w-full p-2 border rounded" 
                                required 
                                disabled={isCreatingUser}
                            />
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={newUser.email} 
                                onChange={e => setNewUser({...newUser, email: e.target.value})} 
                                className="w-full p-2 border rounded" 
                                required 
                                disabled={isCreatingUser}
                            />
                            <input 
                                type="text" 
                                placeholder="Temporary Password" 
                                value={newUser.password} 
                                onChange={e => setNewUser({...newUser, password: e.target.value})} 
                                className="w-full p-2 border rounded" 
                                required 
                                disabled={isCreatingUser}
                            />
                            
                            {creationResult && (
                                <div className={`text-sm p-4 rounded font-semibold whitespace-pre-line ${
                                    creationResult.success 
                                        ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                                }`}>
                                    {creationResult.message}
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => { 
                                        setShowAddUserModal(false); 
                                        setCreationResult(null); 
                                        setNewUser({ email: '', password: '', firstName: '', lastName: '' });
                                    }} 
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                    disabled={isCreatingUser}
                                >
                                    {creationResult?.success ? 'Close' : 'Cancel'}
                                </button>
                                {!creationResult?.success && (
                                    <button 
                                        type="submit" 
                                        disabled={isCreatingUser} 
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreatingUser ? 'Creating...' : 'Create User'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};