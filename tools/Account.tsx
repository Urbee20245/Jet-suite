import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { ProfileData, TeamMember, Tool } from '../types';
import { CheckCircleIcon, TrashIcon, XMarkIcon, CreditCardIcon, MinusIcon, PlusIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { createPortalSession, getBillingAccount } from '../services/stripeService';
import { getSubscriptionStatusLabel, getSubscriptionStatusColor } from '../services/subscriptionService';
import { Loader } from '../components/Loader';
import { ALL_TOOLS } from '../constants';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AccountProps {
    plan: { name: string, profileLimit: number };
    profileData: ProfileData;
    onLogout: () => void;
    onUpdateProfile: (data: ProfileData) => void;
    userId: string;
    setActiveTool: (tool: Tool | null) => void;
}

const AccountSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-brand-text mb-6">{title}</h2>
        {children}
    </div>
);

const TeamMemberCard: React.FC<{ member: TeamMember; onRemove: (id: string) => void }> = ({ member, onRemove }) => (
    <div className="bg-brand-light p-4 rounded-lg border border-brand-border flex items-center justify-between">
        <div>
            <div className="flex items-center gap-2">
                <h4 className="font-bold text-brand-text">{member.firstName} {member.lastName}</h4>
                 <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${member.role === 'Owner' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>{member.role}</span>
            </div>
            <p className="text-sm text-brand-text-muted">{member.title || 'No title specified'}</p>
            <p className="text-xs text-brand-text-muted">{member.email}</p>
        </div>
        <div className="flex items-center gap-4">
           {member.status === 'Pending Invite' && <span className="text-xs font-bold text-yellow-600">Pending Invite</span>}
           {member.role !== 'Owner' && (
                <button onClick={() => onRemove(member.id)} title="Remove team member">
                    <TrashIcon className="w-5 h-5 text-red-400 hover:text-red-600" />
                </button>
            )}
        </div>
    </div>
);

export const Account: React.FC<AccountProps> = ({ plan, profileData, onLogout, onUpdateProfile, userId, setActiveTool }) => {
    const [formState, setFormState] = useState({
        firstName: profileData.user.firstName,
        lastName: profileData.user.lastName,
        role: profileData.user.role,
    });
    const [isDirty, setIsDirty] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    
    // Billing and Limits state
    const [billingAccount, setBillingAccount] = useState<any>(null);
    const [isLoadingBilling, setIsLoadingBilling] = useState(true);
    const [isOpeningPortal, setIsOpeningPortal] = useState(false);
    
    // Actual usage counts from DB
    const [actualBusinessCount, setActualBusinessCount] = useState(0);
    const [actualSeatCount, setActualSeatCount] = useState(0);

    const isAdmin = billingAccount?.is_admin === true;

    // Initial load
    useEffect(() => {
        const owner = {
            id: 'owner_id_static',
            firstName: profileData.user.firstName,
            lastName: profileData.user.lastName,
            email: profileData.user.email,
            title: profileData.user.role,
            role: 'Owner' as 'Owner',
            status: 'Active' as 'Active',
        };
        setTeamMembers(prev => [owner, ...prev.filter(m => m.role !== 'Owner')]);
    }, [profileData.user]);

    // Fetch usage and limits
    useEffect(() => {
        const loadAccountStats = async () => {
            try {
                setIsLoadingBilling(true);
                
                // 1. Get Billing Limits
                const account = await getBillingAccount(userId);
                setBillingAccount(account);
                
                // 2. Count actual businesses
                const { count: bizCount } = await supabase
                    .from('business_profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);
                
                setActualBusinessCount(bizCount || 0);

                // 3. Count unique team members across all businesses
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
    }, [userId]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/user/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, firstName: formState.firstName, lastName: formState.lastName, role: formState.role }),
            });
            if (!response.ok) throw new Error('Failed to save profile');
            onUpdateProfile({ ...profileData, user: { ...profileData.user, firstName: formState.firstName, lastName: formState.lastName, role: formState.role } });
            setIsDirty(false);
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Failed to save profile.');
        }
    };

    const handleManageSubscription = async () => {
        if (!billingAccount?.stripe_customer_id) {
            alert('No active subscription found. Redirecting to pricing...');
            setActiveTool(ALL_TOOLS['pricing'] || null);
            return;
        }
        try {
            setIsOpeningPortal(true);
            const response = await createPortalSession(billingAccount.stripe_customer_id);
            window.location.href = response.url;
        } catch (error) {
            alert('Failed to open billing portal.');
        } finally {
            setIsOpeningPortal(false);
        }
    };

    const handleAddBusinessRequest = () => {
        const limit = billingAccount?.business_count || 1;
        if (actualBusinessCount >= limit && !isAdmin) {
            alert(`Limit Reached: Your current plan allows for ${limit} business profile(s). Please upgrade your plan to add more.`);
            setActiveTool(ALL_TOOLS['pricing'] || null);
        } else {
            alert('Opening business creation flow...');
        }
    };

    const handleInviteMemberRequest = () => {
        const limit = billingAccount?.seat_count || 0;
        if (actualSeatCount >= limit && !isAdmin) {
            alert(`No Seats Available: You have used all ${limit} of your additional team seats. Buy more in the billing portal or upgrade your plan.`);
        } else {
            alert('Opening invitation form...');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-text flex items-center gap-2">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Account
                </h1>
                <p className="text-brand-text-muted mt-2">Manage your plan, businesses, and team.</p>
            </div>

            {isAdmin && (
                <div className="mb-8 bg-red-50 border-2 border-red-200 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full text-red-600">🛡️</div>
                    <div>
                        <p className="text-red-800 font-bold">Admin Override Active</p>
                        <p className="text-red-700 text-sm">Plan limits are ignored. You can create unlimited businesses and seats.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Billing & Team */}
                <div className="space-y-8">
                    <AccountSection title="Plan & Billing">
                        {isLoadingBilling ? (
                            <div className="flex items-center justify-center py-4"><Loader /></div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-brand-light p-4 rounded-lg border border-brand-border">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-brand-text-muted font-bold uppercase tracking-wider">Subscription</span>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getSubscriptionStatusColor(billingAccount?.subscription_status)}`}>
                                            {getSubscriptionStatusLabel(billingAccount?.subscription_status)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-brand-text-muted mb-1">Businesses</p>
                                            <p className="text-lg font-bold text-brand-text">
                                                {actualBusinessCount} / {isAdmin ? '∞' : (billingAccount?.business_count || 1)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-brand-text-muted mb-1">Additional Seats</p>
                                            <p className="text-lg font-bold text-brand-text">
                                                {actualSeatCount} / {isAdmin ? '∞' : (billingAccount?.seat_count || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleManageSubscription}
                                    disabled={isOpeningPortal}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-opacity"
                                >
                                    {isOpeningPortal ? <Loader /> : <><CreditCardIcon className="w-5 h-5" /> <span>Manage Subscription</span></>}
                                </button>
                                <p className="text-xs text-center text-brand-text-muted">Cancel anytime. No refunds.</p>
                            </div>
                        )}
                    </AccountSection>

                    <AccountSection title="Team Members">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-brand-text-muted">Invite team members to collaborate.</p>
                                <span className="text-xs font-bold text-brand-text-muted">
                                    {actualSeatCount} of {isAdmin ? '∞' : (billingAccount?.seat_count || 0)} seats used
                                </span>
                            </div>
                            <div className="space-y-3">
                                {teamMembers.map(member => (
                                    <TeamMemberCard key={member.id} member={member} onRemove={() => {}} />
                                ))}
                            </div>
                            <button 
                                onClick={handleInviteMemberRequest}
                                className="w-full bg-brand-light hover:bg-brand-border text-brand-text font-bold py-3 px-4 rounded-lg text-sm transition-colors border border-brand-border"
                            >
                                + Invite Team Member
                            </button>
                        </div>
                    </AccountSection>
                </div>

                {/* Column 2: Profiles & Settings */}
                <div className="space-y-8">
                    <AccountSection title="Business Profiles">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-brand-text-muted">Active businesses under your account.</p>
                                <span className="text-xs font-bold text-brand-text-muted">
                                    {actualBusinessCount} of {isAdmin ? '∞' : (billingAccount?.business_count || 1)} used
                                </span>
                            </div>
                            <div className="bg-brand-light p-4 rounded-lg border border-brand-border flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-brand-text">{profileData.business.name || 'Primary Business'}</p>
                                    <p className="text-xs text-brand-text-muted">Primary Location</p>
                                </div>
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-800 rounded-full uppercase">Primary</span>
                            </div>
                            <button 
                                onClick={handleAddBusinessRequest}
                                className="w-full bg-brand-light hover:bg-brand-border text-brand-text font-bold py-3 px-4 rounded-lg text-sm transition-colors border border-brand-border"
                            >
                                + Add Another Business
                            </button>
                        </div>
                    </AccountSection>
                    
                    <AccountSection title="Account Settings">
                        <form onSubmit={handleProfileSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">First Name</label>
                                    <input type="text" name="firstName" value={formState.firstName} onChange={handleFormChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Last Name</label>
                                    <input type="text" name="lastName" value={formState.lastName} onChange={handleFormChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Role</label>
                                <input type="text" name="role" value={formState.role} onChange={handleFormChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2 text-sm" />
                            </div>
                            <div className="pt-2">
                                <p className="text-xs font-bold text-brand-text-muted uppercase mb-1">Email</p>
                                <p className="text-sm text-brand-text font-semibold">{profileData.user.email}</p>
                            </div>
                            {isDirty && (
                                <button type="submit" className="w-full bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-2 rounded-lg text-sm transition-colors">
                                    Save Changes
                                </button>
                            )}
                        </form>
                    </AccountSection>

                    <div className="pt-4 flex justify-between items-center px-2">
                        <button onClick={onLogout} className="text-sm font-bold text-red-500 hover:underline">Log Out</button>
                        <p className="text-[10px] text-brand-text-muted font-mono uppercase tracking-widest">User ID: {userId.substring(0, 8)}...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};