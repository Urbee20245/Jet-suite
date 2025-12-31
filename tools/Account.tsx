import React, { useState, useEffect } from 'react';
import type { ProfileData, TeamMember, Tool } from '../types';
import { CheckCircleIcon, TrashIcon, XMarkIcon, CreditCardIcon, MinusIcon, PlusIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { createPortalSession, getBillingAccount } from '../services/stripeService';
import { getSubscriptionStatusLabel, getSubscriptionStatusColor } from '../services/subscriptionService';
import { Loader } from '../components/Loader';
import { ALL_TOOLS } from '../constants';
import { getSupabaseClient } from '../integrations/supabase/client';

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
        try {
            const response = await fetch('/api/user/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    firstName: formState.firstName, 
                    lastName: formState.lastName, 
                    role: formState.role,
                    email: profileData.user.email, // CRITICAL FIX: Include email for database upsert
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save profile');
            }
            onUpdateProfile({ ...profileData, user: { ...profileData.user, firstName: formState.firstName, lastName: formState.lastName, role: formState.role } });
            setIsDirty(false);
            alert('Profile updated successfully!');
        } catch (error: any) {
            alert(error.message || 'Failed to save profile.');
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

    // ✅ FIXED: Wire to existing business creation tool
    const handleAddBusinessRequest = () => {
        const limit = billingAccount?.business_count || 1;
        if (actualBusinessCount >= limit && !isAdmin) {
            alert(`Limit Reached: Your current plan allows for ${limit} business profile(s). Please upgrade your plan to add more.`);
            setActiveTool(ALL_TOOLS['pricing'] || null);
        } else {
            setActiveTool(ALL_TOOLS['business_creation'] || null);
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
            {/* Account Details */}
            <AccountSection title="Personal Details">
                <form onSubmit={handleProfileSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-text mb-1">First Name</label>
                            <input type="text" name="firstName" value={formState.firstName} onChange={handleFormChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text mb-1">Last Name</label>
                            <input type="text" name="lastName" value={formState.lastName} onChange={handleFormChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1">Email</label>
                        <input type="email" value={profileData.user.email} disabled className="w-full bg-brand-light border border-brand-border rounded-lg p-2 opacity-70" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text mb-1">Role</label>
                        <select name="role" value={formState.role} onChange={handleFormChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2">
                            <option value="Owner">Owner</option>
                            <option value="Manager">Manager</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Marketing Director">Marketing Director</option>
                        </select>
                    </div>
                    {isDirty && (
                        <div className="flex justify-end pt-2">
                            <button type="submit" className="bg-accent-blue text-white font-bold py-2 px-4 rounded-lg">Save Changes</button>
                        </div>
                    )}
                </form>
            </AccountSection>

            {/* Plan & Billing */}
            <AccountSection title="Plan & Billing">
                {isLoadingBilling ? (
                    <Loader />
                ) : (
                    <div className="space-y-4">
                        <div className="bg-brand-light p-4 rounded-lg border border-brand-border">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-brand-text">Current Plan</h3>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getSubscriptionStatusColor(billingAccount?.subscription_status)}`}>
                                    {getSubscriptionStatusLabel(billingAccount?.subscription_status)}
                                </span>
                            </div>
                            
                            {billingAccount ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-brand-text-muted">Subscription:</span>
                                        <span className="font-semibold text-brand-text">JetSuite Complete</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-brand-text-muted">Renews:</span>
                                        <span className="font-semibold text-brand-text">
                                            {billingAccount.current_period_end ? new Date(billingAccount.current_period_end).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-brand-text-muted">Business Profiles:</span>
                                        <span className="font-semibold text-brand-text">{billingAccount.business_count || 1} (Used: {actualBusinessCount})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-brand-text-muted">Team Seats:</span>
                                        <span className="font-semibold text-brand-text">{billingAccount.seat_count || 1} (Used: {actualSeatCount})</span>
                                    </div>
                                    {billingAccount.cancel_at_period_end && (
                                        <div className="text-xs text-yellow-600 font-semibold pt-2 border-t border-brand-border">
                                            ⚠️ Subscription is set to cancel at the end of the current period.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-brand-text-muted">No active subscription found. <button onClick={() => setActiveTool(ALL_TOOLS['pricing'])} className="text-accent-purple hover:underline font-semibold">View Pricing Plans</button></p>
                            )}
                        </div>

                        <button
                            onClick={handleManageSubscription}
                            disabled={isOpeningPortal || !billingAccount?.stripe_customer_id}
                            className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-opacity shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
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
                        <p className="text-xs text-center text-brand-text-muted">
                            Cancel anytime. No refunds.
                        </p>
                    </div>
                )}
            </AccountSection>

            {/* Business & Team Management */}
            <AccountSection title="Business & Team Management">
                <div className="space-y-4">
                    <h3 className="font-bold text-brand-text">Business Profiles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profileData.business.name && (
                            <div className="bg-brand-light p-4 rounded-lg border border-brand-border flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-brand-text">{profileData.business.name}</h4>
                                    <p className="text-sm text-brand-text-muted">{profileData.business.location}</p>
                                </div>
                                <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Primary</span>
                            </div>
                        )}
                        <button
                            onClick={handleAddBusinessRequest}
                            className="bg-brand-light hover:bg-brand-border border border-brand-border p-4 rounded-lg text-brand-text font-semibold flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Business Profile
                        </button>
                    </div>
                </div>

                <div className="space-y-4 mt-6">
                    <h3 className="font-bold text-brand-text">Team Members</h3>
                    <div className="space-y-2">
                        {teamMembers.map(member => (
                            <TeamMemberCard key={member.id} member={member} onRemove={() => alert('Remove functionality coming soon')} />
                        ))}
                    </div>
                    <button
                        onClick={handleInviteMemberRequest}
                        className="w-full bg-brand-light hover:bg-brand-border border border-brand-border p-3 rounded-lg text-brand-text font-semibold flex items-center justify-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Invite Team Member
                    </button>
                </div>
            </AccountSection>

            {/* Logout */}
            <AccountSection title="Account Actions">
                <button
                    onClick={onLogout}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md"
                >
                    Log Out
                </button>
            </AccountSection>
        </div>
    );
};