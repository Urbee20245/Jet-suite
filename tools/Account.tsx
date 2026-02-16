// DYAD_NATIVE_GIT_TEST
import React, { useState, useEffect } from 'react';
import type { ProfileData, TeamMember, Tool } from '../types';
import { CheckCircleIcon, TrashIcon, XMarkIcon, CreditCardIcon, MinusIcon, PlusIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { createPortalSession, getBillingAccount } from '../services/stripeService';
import { getSubscriptionStatusLabel, getSubscriptionStatusColor } from '../services/subscriptionService';
import { Loader } from '../components/Loader';
import { ALL_TOOLS } from '../constants';
import { getSupabaseClient } from '../integrations/supabase/client';

type TabType = 'profile' | 'billing' | 'business' | 'team' | 'security' | 'partner';

interface AccountProps {
    plan: { name: string, profileLimit: number };
    profileData: ProfileData;
    onLogout: () => void;
    onUpdateProfile: (data: ProfileData) => void;
    userId: string;
    setActiveTool: (tool: Tool | null) => void;
}

const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    children: React.ReactNode
}> = ({ active, onClick, icon, children }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium rounded-md transition-all ${
            active
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-sm'
                : 'text-brand-text hover:bg-gray-50'
        }`}
    >
        {icon && <span className={active ? 'text-white' : 'text-brand-text-muted'}>{icon}</span>}
        {children}
    </button>
);

const ContentSection: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="space-y-4 md:space-y-6">
        <div className="px-1">
            <h2 className="text-xl md:text-2xl font-semibold text-brand-text">{title}</h2>
            {description && <p className="text-sm text-brand-text-muted mt-1 md:mt-2">{description}</p>}
        </div>
        <div className="bg-white rounded-lg border border-brand-border p-4 md:p-6">
            {children}
        </div>
    </div>
);

const TeamMemberCard: React.FC<{ member: TeamMember; onRemove: (id: string) => void }> = ({ member, onRemove }) => (
    <div className="flex items-start sm:items-center justify-between py-3 md:py-4 border-b border-brand-border last:border-b-0 gap-3">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {member.firstName[0]}{member.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-medium text-brand-text text-sm md:text-base truncate">{member.firstName} {member.lastName}</h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap ${member.role === 'Owner' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{member.role}</span>
                    {member.status === 'Pending Invite' && <span className="text-xs font-medium text-yellow-600 whitespace-nowrap">Pending</span>}
                </div>
                <p className="text-xs md:text-sm text-brand-text-muted mt-1 truncate">{member.email}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            {member.role !== 'Owner' && (
                <button
                    onClick={() => onRemove(member.id)}
                    title="Remove team member"
                    className="p-2 hover:bg-red-50 rounded transition-colors touch-manipulation"
                >
                    <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-600" />
                </button>
            )}
        </div>
    </div>
);

export const Account: React.FC<AccountProps> = ({ plan, profileData, onLogout, onUpdateProfile, userId, setActiveTool }) => {
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [formState, setFormState] = useState({
        firstName: profileData.user.firstName,
        lastName: profileData.user.lastName,
        phone: profileData.user.phone || '',
        role: profileData.user.role,
    });
    const [isDirty, setIsDirty] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    
    const [billingAccount, setBillingAccount] = useState<any>(null);
    const [isLoadingBilling, setIsLoadingBilling] = useState(true);
    const [isOpeningPortal, setIsOpeningPortal] = useState(false);
    
    const [actualBusinessCount, setActualBusinessCount] = useState(0);
    const [actualSeatCount, setActualSeatCount] = useState(0);

    const supabase = getSupabaseClient();

    const isAdmin = billingAccount?.is_admin === true;

    useEffect(() => {
        const owner = {
            id: 'owner_id_static',
            firstName: profileData.user.firstName,
            lastName: profileData.user.lastName,
            email: profileData.user.email,
            phone: profileData.user.phone,
            title: profileData.user.role,
            role: 'Owner' as 'Owner',
            status: 'Active' as 'Active',
        };
        setTeamMembers(prev => [owner, ...prev.filter(m => m.role !== 'Owner')]);
    }, [profileData.user]);

    useEffect(() => {
        const loadAccountStats = async () => {
            if (!supabase) {
                setIsLoadingBilling(false);
                return;
            }
            
            try {
                setIsLoadingBilling(true);
                const account = await getBillingAccount(userId);
                setBillingAccount(account);
                
                const { count: bizCount } = await supabase
                    .from('business_profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);
                setActualBusinessCount(bizCount || 0);

                const { count: seatCount } = await supabase
                    .from('business_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('invited_by', userId);
                setActualSeatCount(seatCount || 0);

            } catch (error) {
                console.error('Failed to load account stats:', error);
            } finally {
                setIsLoadingBilling(false);
            }
        };
        loadAccountStats();
    }, [userId, supabase]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate phone number format (optional but recommended)
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (formState.phone && !phoneRegex.test(formState.phone)) {
            alert('Please enter a valid phone number (digits, spaces, dashes, parentheses, and + allowed)');
            return;
        }
        
        try {
            const response = await fetch('/api/user/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    firstName: formState.firstName, 
                    lastName: formState.lastName,
                    phone: formState.phone,
                    role: formState.role,
                    email: profileData.user.email,
                }),
            });
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    const text = await response.text();
                    throw new Error(`Server returned non-JSON error (Status: ${response.status}). Raw response: ${text.substring(0, 100)}...`);
                }
                throw new Error(errorData.message || errorData.error || 'Failed to save profile');
            }
            
            onUpdateProfile({ 
                ...profileData, 
                user: { 
                    ...profileData.user, 
                    firstName: formState.firstName, 
                    lastName: formState.lastName,
                    phone: formState.phone,
                    role: formState.role 
                } 
            });
            setIsDirty(false);
            alert('Profile updated successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to save profile.');
        }
    };

    const handleManageSubscription = async () => {
        try {
            setIsOpeningPortal(true);
            const portalResponse = await createPortalSession(userId);
            window.location.href = portalResponse.url;
        } catch (error) {
            alert('Failed to open billing portal');
        } finally {
            setIsOpeningPortal(false);
        }
    };

    const handleAddBusinessRequest = () => {
        alert('Add Business Profile: Contact support or unlock with higher plan tier.');
    };

    const handleInviteMemberRequest = () => {
        alert('Invite Team Member: Contact support or unlock with higher plan tier.');
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-full min-h-[600px]">
            {/* Mobile - Horizontal Tabs (scrollable) */}
            <div className="md:hidden bg-white rounded-lg border border-brand-border p-2 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                            activeTab === 'profile'
                                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                                : 'text-brand-text bg-gray-50'
                        }`}
                    >
                        My Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                            activeTab === 'billing'
                                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                                : 'text-brand-text bg-gray-50'
                        }`}
                    >
                        Billing
                    </button>
                    <button
                        onClick={() => setActiveTab('business')}
                        className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                            activeTab === 'business'
                                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                                : 'text-brand-text bg-gray-50'
                        }`}
                    >
                        Business
                    </button>
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                            activeTab === 'team'
                                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                                : 'text-brand-text bg-gray-50'
                        }`}
                    >
                        Team
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                            activeTab === 'security'
                                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                                : 'text-brand-text bg-gray-50'
                        }`}
                    >
                        Security
                    </button>
                    <button
                        onClick={() => setActiveTab('partner')}
                        className={`px-4 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                            activeTab === 'partner'
                                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                                : 'text-brand-text bg-gray-50'
                        }`}
                    >
                        Partner Program
                    </button>
                </div>
            </div>

            {/* Desktop - Left Sidebar Vertical Tabs */}
            <div className="hidden md:block w-64 flex-shrink-0">
                <div className="bg-white rounded-lg border border-brand-border p-4 space-y-2 sticky top-4">
                    <TabButton
                        active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                    >
                        My Profile
                    </TabButton>
                    <TabButton
                        active={activeTab === 'billing'}
                        onClick={() => setActiveTab('billing')}
                    >
                        Subscription & Billing
                    </TabButton>
                    <TabButton
                        active={activeTab === 'business'}
                        onClick={() => setActiveTab('business')}
                    >
                        Business Profiles
                    </TabButton>
                    <TabButton
                        active={activeTab === 'team'}
                        onClick={() => setActiveTab('team')}
                    >
                        Team Members
                    </TabButton>
                    <TabButton
                        active={activeTab === 'security'}
                        onClick={() => setActiveTab('security')}
                    >
                        Account Security
                    </TabButton>
                    <div className="pt-2 mt-2 border-t border-brand-border">
                        <TabButton
                            active={activeTab === 'partner'}
                            onClick={() => setActiveTab('partner')}
                        >
                            Partner Program
                        </TabButton>
                    </div>
                </div>
            </div>

            {/* Content Area - Responsive */}
            <div className="flex-1 min-w-0 w-full">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <ContentSection
                        title="My Profile"
                        description="Manage your personal information and preferences"
                    >
                        <form onSubmit={handleProfileSave} className="space-y-4 md:space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-2">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formState.firstName}
                                        onChange={handleFormChange}
                                        className="w-full bg-white border border-brand-border rounded-md px-3 py-3 text-sm text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition touch-manipulation"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formState.lastName}
                                        onChange={handleFormChange}
                                        className="w-full bg-white border border-brand-border rounded-md px-3 py-3 text-sm text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition touch-manipulation"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={profileData.user.email}
                                    disabled
                                    className="w-full bg-gray-50 border border-brand-border rounded-md px-3 py-3 text-sm text-brand-text-muted cursor-not-allowed"
                                />
                                <p className="text-xs text-brand-text-muted mt-2">Your email address cannot be changed. Contact support if needed.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-2">
                                    Phone Number
                                    <span className="text-xs font-normal text-brand-text-muted ml-2">(Optional)</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formState.phone}
                                    onChange={handleFormChange}
                                    placeholder="+1 (555) 123-4567"
                                    className="w-full bg-white border border-brand-border rounded-md px-3 py-3 text-sm text-brand-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition touch-manipulation"
                                />
                                <p className="text-xs text-brand-text-muted mt-2">
                                    For SMS notifications and account recovery
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-2">Role</label>
                                <select
                                    name="role"
                                    value={formState.role}
                                    onChange={handleFormChange}
                                    className="w-full bg-white border border-brand-border rounded-md px-3 py-3 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition touch-manipulation"
                                >
                                    <option value="Owner">Owner</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Marketing Director">Marketing Director</option>
                                </select>
                            </div>

                            {isDirty && (
                                <div className="flex justify-end pt-4 border-t border-brand-border">
                                    <button
                                        type="submit"
                                        className="w-full sm:w-auto bg-gradient-to-r from-accent-blue to-accent-purple text-white font-medium text-sm py-3 px-6 rounded-md hover:opacity-90 transition-opacity touch-manipulation"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </form>
                    </ContentSection>
                )}

                {/* Billing Tab */}
                {activeTab === 'billing' && (
                    <ContentSection
                        title="Subscription & Billing"
                        description="Manage your subscription plan and billing details"
                    >
                        {isLoadingBilling ? (
                            <div className="flex justify-center py-12">
                                <Loader />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {billingAccount ? (
                                    <>
                                        <div className="space-y-4 md:space-y-5">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-brand-border">
                                                <div>
                                                    <p className="text-xs md:text-sm font-medium text-brand-text-muted">Current Plan</p>
                                                    <p className="text-lg md:text-xl font-semibold text-brand-text mt-1">JetSuite Complete</p>
                                                </div>
                                                <span className={`px-3 py-1.5 text-xs font-medium rounded-full w-fit ${getSubscriptionStatusColor(billingAccount?.subscription_status)}`}>
                                                    {getSubscriptionStatusLabel(billingAccount?.subscription_status)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                                                <div className="space-y-1.5 p-3 bg-gray-50 rounded-md sm:bg-transparent sm:p-0">
                                                    <p className="text-xs font-medium text-brand-text-muted uppercase tracking-wide">Renewal Date</p>
                                                    <p className="text-sm md:text-base font-semibold text-brand-text">
                                                        {billingAccount.current_period_end ? new Date(billingAccount.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="space-y-1.5 p-3 bg-gray-50 rounded-md sm:bg-transparent sm:p-0">
                                                    <p className="text-xs font-medium text-brand-text-muted uppercase tracking-wide">Business Profiles</p>
                                                    <p className="text-sm md:text-base font-semibold text-brand-text">
                                                        {actualBusinessCount} of {billingAccount.business_count || 1} used
                                                    </p>
                                                </div>
                                                <div className="space-y-1.5 p-3 bg-gray-50 rounded-md sm:bg-transparent sm:p-0">
                                                    <p className="text-xs font-medium text-brand-text-muted uppercase tracking-wide">Team Seats</p>
                                                    <p className="text-sm md:text-base font-semibold text-brand-text">
                                                        {actualSeatCount} of {billingAccount.seat_count || 1} used
                                                    </p>
                                                </div>
                                            </div>

                                            {billingAccount.cancel_at_period_end && (
                                                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                                    <InformationCircleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-yellow-800">
                                                        Your subscription will be canceled at the end of the current billing period.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-brand-border space-y-3">
                                            <button
                                                onClick={handleManageSubscription}
                                                disabled={isOpeningPortal || !billingAccount?.stripe_customer_id}
                                                className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-medium text-sm py-3.5 px-4 rounded-md transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
                                            >
                                                {isOpeningPortal ? (
                                                    <>
                                                        <Loader />
                                                        <span>Opening Portal...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCardIcon className="w-5 h-5" />
                                                        <span>Manage Subscription</span>
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-xs text-center text-brand-text-muted px-2">
                                                Update payment method, view invoices, or cancel subscription
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-brand-text-muted mb-4">No active subscription found</p>
                                        <button
                                            onClick={() => setActiveTool(ALL_TOOLS['pricing'])}
                                            className="text-accent-purple hover:underline font-medium text-sm"
                                        >
                                            View Pricing Plans
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </ContentSection>
                )}

                {/* Business Profiles Tab */}
                {activeTab === 'business' && (
                    <ContentSection
                        title="Business Profiles"
                        description="Manage your business locations and profiles"
                    >
                        <div className="space-y-4">
                            {profileData.business.business_name && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 px-4 md:px-5 bg-gray-50 rounded-lg border border-brand-border">
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-brand-text text-sm md:text-base">{profileData.business.business_name}</h4>
                                        <p className="text-xs md:text-sm text-brand-text-muted mt-1">{profileData.business.location}</p>
                                    </div>
                                    <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1.5 rounded-md w-fit">Primary</span>
                                </div>
                            )}
                            <button
                                onClick={handleAddBusinessRequest}
                                className="w-full border-2 border-dashed border-brand-border hover:border-accent-purple hover:bg-purple-50 p-4 md:p-5 rounded-lg text-brand-text font-medium flex items-center justify-center gap-2 transition-colors touch-manipulation"
                            >
                                <PlusIcon className="w-5 h-5 text-accent-purple" />
                                <span className="text-sm md:text-base">Add Business Profile</span>
                            </button>
                        </div>
                    </ContentSection>
                )}

                {/* Team Members Tab */}
                {activeTab === 'team' && (
                    <ContentSection
                        title="Team Members"
                        description="Manage team access and permissions"
                    >
                        <div className="space-y-4 md:space-y-6">
                            <div className="divide-y divide-brand-border">
                                {teamMembers.map(member => (
                                    <TeamMemberCard key={member.id} member={member} onRemove={() => alert('Remove functionality coming soon')} />
                                ))}
                            </div>
                            <button
                                onClick={handleInviteMemberRequest}
                                className="w-full border-2 border-dashed border-brand-border hover:border-accent-purple hover:bg-purple-50 p-4 rounded-lg text-brand-text font-medium flex items-center justify-center gap-2 transition-colors touch-manipulation"
                            >
                                <PlusIcon className="w-5 h-5 text-accent-purple" />
                                <span className="text-sm md:text-base">Invite Team Member</span>
                            </button>
                        </div>
                    </ContentSection>
                )}

                {/* Account Security Tab */}
                {activeTab === 'security' && (
                    <ContentSection
                        title="Account Security"
                        description="Manage your security preferences and sign out"
                    >
                        <div className="space-y-4">
                            <button
                                onClick={onLogout}
                                className="w-full bg-white hover:bg-red-50 text-red-600 font-medium text-sm py-3.5 px-4 rounded-md border-2 border-red-200 hover:border-red-300 transition-all touch-manipulation"
                            >
                                Sign Out
                            </button>
                            <p className="text-xs text-center text-brand-text-muted px-2">
                                You'll be redirected to the login page
                            </p>
                        </div>
                    </ContentSection>
                )}

                {/* Partner Program Tab */}
                {activeTab === 'partner' && (
                    <ContentSection
                        title="JetSuite Partner Program"
                        description="Earn rewards by referring businesses to JetSuite"
                    >
                        <div className="space-y-4 md:space-y-6">
                            {/* Hero Section */}
                            <div className="text-center py-5 md:py-6 px-3 bg-gradient-to-br from-accent-blue/10 via-accent-purple/10 to-accent-pink/10 rounded-lg border border-accent-purple/20">
                                <h3 className="text-xl md:text-2xl font-semibold text-brand-text mb-2 md:mb-3">
                                    Become a JetSuite Partner
                                </h3>
                                <p className="text-sm md:text-base text-brand-text-muted max-w-2xl mx-auto leading-relaxed">
                                    Earn <span className="font-bold text-brand-text">20% recurring commission</span> for every customer you refer.
                                    Help local businesses grow while building your own passive income stream.
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                    <div className="text-2xl md:text-3xl font-bold text-brand-text mb-1">20%</div>
                                    <div className="text-xs text-brand-text-muted">Recurring Commission</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                    <div className="text-2xl md:text-3xl font-bold text-brand-text mb-1">90 Days</div>
                                    <div className="text-xs text-brand-text-muted">Cookie Duration</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                    <div className="text-2xl md:text-3xl font-bold text-brand-text mb-1">$232.80</div>
                                    <div className="text-xs text-brand-text-muted">Per Customer (12 mo.)</div>
                                </div>
                            </div>

                            {/* Earnings Potential */}
                            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 p-4 md:p-5 rounded-lg border border-accent-purple/20">
                                <h4 className="font-semibold text-brand-text mb-3 text-sm md:text-base">Your Earning Potential</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="text-center p-3 bg-white rounded-md">
                                        <div className="text-lg md:text-xl font-bold text-accent-purple">$19.40</div>
                                        <div className="text-xs text-brand-text-muted mt-1">per month/customer</div>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-md">
                                        <div className="text-lg md:text-xl font-bold text-accent-purple">$2,328</div>
                                        <div className="text-xs text-brand-text-muted mt-1">10 referrals/year</div>
                                    </div>
                                </div>
                                <p className="text-xs text-brand-text-muted mt-3 text-center">
                                    Based on founder's pricing at $97/month
                                </p>
                            </div>

                            {/* Program Details */}
                            <div className="bg-white p-4 md:p-5 rounded-lg border border-brand-border">
                                <h4 className="font-semibold text-brand-text mb-3 text-sm md:text-base">Program Details</h4>
                                <div className="space-y-3 text-xs md:text-sm">
                                    <div className="flex justify-between py-2 border-b border-brand-border">
                                        <span className="text-brand-text-muted">Commission Rate:</span>
                                        <span className="font-medium text-brand-text">20% recurring</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-brand-border">
                                        <span className="text-brand-text-muted">Commission Duration:</span>
                                        <span className="font-medium text-brand-text">12 monthly payments</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-brand-border">
                                        <span className="text-brand-text-muted">Cookie Duration:</span>
                                        <span className="font-medium text-brand-text">90 days</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-brand-border">
                                        <span className="text-brand-text-muted">Attribution Model:</span>
                                        <span className="font-medium text-brand-text">Last click</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-brand-border">
                                        <span className="text-brand-text-muted">Payout Timing:</span>
                                        <span className="font-medium text-brand-text">30 days after payment</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-brand-text-muted">Minimum Payout:</span>
                                        <span className="font-medium text-brand-text">$100 via PayPal</span>
                                    </div>
                                </div>
                            </div>

                            {/* Important Note */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">ℹ️</span>
                                    <div>
                                        <h5 className="font-semibold text-brand-text text-xs md:text-sm mb-1">Important Note</h5>
                                        <p className="text-xs text-brand-text-muted leading-relaxed">
                                            You cannot become an affiliate for your own subscription. Affiliates must refer new customers to JetSuite. All payouts are processed through PayPal.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg border border-brand-border">
                                    <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center mb-3">
                                        <span className="text-white font-bold text-lg">💰</span>
                                    </div>
                                    <h4 className="font-semibold text-brand-text mb-2 text-sm">High Conversion</h4>
                                    <p className="text-xs text-brand-text-muted">
                                        JetSuite saves businesses thousands monthly with a compelling value proposition
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border border-brand-border">
                                    <div className="w-10 h-10 bg-gradient-to-br from-accent-purple to-accent-pink rounded-lg flex items-center justify-center mb-3">
                                        <span className="text-white font-bold text-lg">📊</span>
                                    </div>
                                    <h4 className="font-semibold text-brand-text mb-2 text-sm">Real-Time Tracking</h4>
                                    <p className="text-xs text-brand-text-muted">
                                        Track clicks, signups, commissions, and payments in your Rewardful dashboard
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border border-brand-border">
                                    <div className="w-10 h-10 bg-gradient-to-br from-accent-pink to-accent-cyan rounded-lg flex items-center justify-center mb-3">
                                        <span className="text-white font-bold text-lg">🎁</span>
                                    </div>
                                    <h4 className="font-semibold text-brand-text mb-2 text-sm">Marketing Support</h4>
                                    <p className="text-xs text-brand-text-muted">
                                        Access banners, social graphics, email templates, and promotional materials
                                    </p>
                                </div>
                            </div>

                            {/* How It Works */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-brand-text">How It Works</h4>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            1
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-brand-text">Sign Up for the Program</p>
                                            <p className="text-xs text-brand-text-muted mt-0.5">Join our partner program and get your unique referral link</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-br from-accent-purple to-accent-pink rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            2
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-brand-text">Share Your Link</p>
                                            <p className="text-xs text-brand-text-muted mt-0.5">Promote JetSuite to your network using your referral link</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-br from-accent-pink to-accent-cyan rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            3
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-brand-text">Earn Rewards</p>
                                            <p className="text-xs text-brand-text-muted mt-0.5">Get paid when your referrals become paying customers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Perfect For */}
                            <div className="bg-white p-4 md:p-5 rounded-lg border border-brand-border">
                                <h4 className="font-semibold text-brand-text mb-3 text-sm md:text-base">Perfect For</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-xs">
                                    <div className="p-2 bg-gray-50 rounded text-center">
                                        <div className="font-medium text-brand-text">Marketing Agencies</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded text-center">
                                        <div className="font-medium text-brand-text">Business Consultants</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded text-center">
                                        <div className="font-medium text-brand-text">Content Creators</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded text-center">
                                        <div className="font-medium text-brand-text">Web Developers</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded text-center">
                                        <div className="font-medium text-brand-text">SEO Experts</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded text-center">
                                        <div className="font-medium text-brand-text">Business Coaches</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded text-center">
                                        <div className="font-medium text-brand-text">Influencers</div>
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded text-center">
                                        <div className="font-medium text-brand-text">Entrepreneurs</div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Section */}
                            <div className="pt-4 md:pt-6 border-t border-brand-border">
                                <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-5 md:p-6 rounded-lg text-center">
                                    <h4 className="text-base md:text-lg font-semibold text-white mb-2">
                                        Ready to Start Earning?
                                    </h4>
                                    <p className="text-white/90 text-sm mb-4">
                                        Join hundreds of partners earning recurring income by helping local businesses grow
                                    </p>
                                    <a
                                        href="https://jetsuiteaffiliates.getrewardful.com/signup"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block w-full sm:w-auto bg-white text-accent-purple font-semibold text-sm py-3.5 px-8 rounded-md hover:shadow-lg transition-shadow touch-manipulation"
                                    >
                                        Join the Affiliate Program
                                    </a>
                                    <p className="mt-3 text-xs text-white/80">
                                        Free to join • No approval required • Start earning immediately
                                    </p>
                                </div>
                                <p className="text-xs text-center text-brand-text-muted mt-4 px-2">
                                    Have questions? Contact us at <a href="mailto:partners@jetsuite.com" className="text-accent-purple hover:underline">partners@jetsuite.com</a>
                                </p>
                            </div>
                        </div>
                    </ContentSection>
                )}
            </div>
        </div>
    );
};
