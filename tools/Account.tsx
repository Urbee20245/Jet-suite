import React, { useState, useEffect } from 'react';
import type { ProfileData, TeamMember } from '../types';
import { CheckCircleIcon, TrashIcon, XMarkIcon, CreditCardIcon, MinusIcon, PlusIcon } from '../components/icons/MiniIcons';
import { createPortalSession, getBillingAccount } from '../services/stripeService';
import { getSubscriptionStatusLabel, getSubscriptionStatusColor } from '../services/subscriptionService';
import { Loader } from '../components/Loader';

interface AccountProps {
    plan: { name: string, profileLimit: number };
    profileData: ProfileData;
    onLogout: () => void;
    onUpdateProfile: (data: ProfileData) => void;
}

const AccountSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-brand-text mb-6">{title}</h2>
        {children}
    </div>
);

const AddTeamMemberModal: React.FC<{ onAdd: (member: Omit<TeamMember, 'id' | 'role'>) => void; onCancel: () => void; }> = ({ onAdd, onCancel }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [title, setTitle] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({ firstName, lastName, title, email, status: 'Pending Invite' });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full relative">
                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold text-brand-text mb-6">Add Team Member</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" required className="w-full bg-brand-light border border-brand-border rounded-lg p-3"/>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" required className="w-full bg-brand-light border border-brand-border rounded-lg p-3"/>
                    </div>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title/Role (Optional)" className="w-full bg-brand-light border border-brand-border rounded-lg p-3"/>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required className="w-full bg-brand-light border border-brand-border rounded-lg p-3"/>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-2 px-6 rounded-lg transition-colors">Send Invite</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TeamMemberCard: React.FC<{ member: TeamMember; onRemove: (id: string) => void }> = ({ member, onRemove }) => (
    <div className="bg-brand-light p-4 rounded-lg border border-brand-border flex items-center justify-between">
        <div>
            <div className="flex items-center gap-2">
                <h4 className="font-bold text-brand-text">{member.firstName} {member.lastName}</h4>
                 <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${member.role === 'Owner' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>{member.role}</span>
                 {member.email === 'theivsightcompany@gmail.com' && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-800">Admin</span>}
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

export const Account: React.FC<AccountProps> = ({ plan, profileData, onLogout, onUpdateProfile }) => {
    const profilesUsed = profileData.isProfileActive ? 1 : 0;
    const isAdmin = profileData.user.email === 'theivsightcompany@gmail.com';
    
    const [formState, setFormState] = useState({
        firstName: profileData.user.firstName,
        lastName: profileData.user.lastName,
        role: profileData.user.role,
    });
    const [isDirty, setIsDirty] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    
    // Billing state
    const [billingAccount, setBillingAccount] = useState<any>(null);
    const [isLoadingBilling, setIsLoadingBilling] = useState(true);
    const [isOpeningPortal, setIsOpeningPortal] = useState(false);

    // Plan management state
    const [showPlanEditor, setShowPlanEditor] = useState(false);
    const [currentBusinesses, setCurrentBusinesses] = useState(1);
    const [currentSeats, setCurrentSeats] = useState(0);
    const [newBusinesses, setNewBusinesses] = useState(1);
    const [newSeats, setNewSeats] = useState(0);
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

    // Pricing constants
    const basePlan = 149;
    const additionalBusinessCost = 49;
    const seatCost = 15;

    // Calculate pricing
    const currentAdditionalBusinessCount = Math.max(0, currentBusinesses - 1);
    const currentTotal = basePlan + (currentAdditionalBusinessCount * additionalBusinessCost) + (currentSeats * seatCost);
    
    const newAdditionalBusinessCount = Math.max(0, newBusinesses - 1);
    const newTotal = basePlan + (newAdditionalBusinessCount * additionalBusinessCost) + (newSeats * seatCost);

    const hasActiveSubscription = billingAccount && billingAccount.subscription_status === 'active';

    useEffect(() => {
        // Initialize or update team members list, ensuring owner is always first.
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
        
        // Sync form state with profile data from props
        setFormState({
            firstName: profileData.user.firstName,
            lastName: profileData.user.lastName,
            role: profileData.user.role,
        });
    }, [profileData.user]);

    // Fetch billing information and subscription details
    useEffect(() => {
        const loadBillingInfo = async () => {
            try {
                setIsLoadingBilling(true);
                const account = await getBillingAccount(profileData.user.email);
                setBillingAccount(account);
                
                // Load current subscription details
                if (account?.metadata) {
                    setCurrentBusinesses(parseInt(account.metadata.businessCount || '1'));
                    setCurrentSeats(parseInt(account.metadata.seatCount || '0'));
                    setNewBusinesses(parseInt(account.metadata.businessCount || '1'));
                    setNewSeats(parseInt(account.metadata.seatCount || '0'));
                }
            } catch (error) {
                console.error('Failed to load billing info:', error);
            } finally {
                setIsLoadingBilling(false);
            }
        };
        loadBillingInfo();
    }, [profileData.user.email]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        setIsDirty(true);
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            // Save to backend API
            const response = await fetch('/api/user/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: profileData.user.email,
                    firstName: formState.firstName,
                    lastName: formState.lastName,
                    role: formState.role,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save profile');
            }

            const updatedData = await response.json();
            
            // Update local state
            onUpdateProfile({
                ...profileData,
                user: {
                    ...profileData.user,
                    firstName: formState.firstName,
                    lastName: formState.lastName,
                    role: formState.role,
                },
            });
            
            setIsDirty(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    };

    const handleAddMember = (newMember: Omit<TeamMember, 'id' | 'role'>) => {
        const member: TeamMember = {
            ...newMember,
            id: `member_${Date.now()}`,
            role: 'Team Member',
        };
        setTeamMembers(prev => [...prev, member]);
        setShowAddMemberModal(false);
    };

    const handleRemoveMember = (id: string) => {
        setTeamMembers(prev => prev.filter(m => m.id !== id));
    };

    const handleManageSubscription = async () => {
        try {
            setIsOpeningPortal(true);
            const response = await createPortalSession(profileData.user.email);
            window.location.href = response.url;
        } catch (error) {
            console.error('Error opening portal:', error);
            alert('Failed to open billing portal. Please try again.');
        } finally {
            setIsOpeningPortal(false);
        }
    };

    const handleBusinessChange = (delta: number) => {
        setNewBusinesses(prev => Math.max(1, prev + delta));
    };

    const handleSeatsChange = (delta: number) => {
        setNewSeats(prev => Math.max(0, prev + delta));
    };

    const handleOpenPlanEditor = () => {
        setNewBusinesses(currentBusinesses);
        setNewSeats(currentSeats);
        setShowPlanEditor(true);
    };

    const handleCancelPlanEdit = () => {
        setNewBusinesses(currentBusinesses);
        setNewSeats(currentSeats);
        setShowPlanEditor(false);
    };

    const handleUpdatePlan = async () => {
        setIsUpdatingPlan(true);
        
        try {
            if (hasActiveSubscription) {
                // Existing subscription - update it
                const response = await fetch('/api/stripe/update-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: profileData.user.email,
                        businessCount: newBusinesses,
                        seatCount: newSeats,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update subscription');
                }

                const data = await response.json();
                
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    setCurrentBusinesses(newBusinesses);
                    setCurrentSeats(newSeats);
                    setShowPlanEditor(false);
                    const account = await getBillingAccount(profileData.user.email);
                    setBillingAccount(account);
                    alert('Plan updated successfully!');
                }
            } else {
                // No subscription - create new checkout session
                const response = await fetch('/api/stripe/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: profileData.user.email,
                        businessCount: newBusinesses,
                        seatCount: newSeats,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create checkout session');
                }

                const data = await response.json();
                if (data.url) {
                    window.location.href = data.url;
                }
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to process request. Please try again.');
        } finally {
            setIsUpdatingPlan(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {showAddMemberModal && <AddTeamMemberModal onAdd={handleAddMember} onCancel={() => setShowAddMemberModal(false)} />}
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-brand-text flex items-center gap-2">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Account
                </h1>
                <p className="text-brand-text-muted mt-2">Manage your plan, businesses, and team.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1 */}
                <div className="space-y-8">
                    <AccountSection title="Plan & Billing">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-brand-text-muted">Current Plan:</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold text-brand-text">Tier 1</p>
                                        {isAdmin && <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-800">Admin</span>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    <span className="text-brand-text">{currentBusinesses} business {currentBusinesses > 1 ? 'profiles' : 'profile'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    <span className="text-brand-text">Full tool access</span>
                                </div>
                            </div>

                            {isLoadingBilling ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader />
                                </div>
                            ) : !showPlanEditor ? (
                                <div>
                                    {hasActiveSubscription ? (
                                        <div>
                                            {/* Active Subscription */}
                                            <div className="bg-brand-light p-4 rounded-lg border border-brand-border mb-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-brand-text-muted">Status:</span>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getSubscriptionStatusColor(billingAccount.subscription_status)}`}>
                                                        {getSubscriptionStatusLabel(billingAccount.subscription_status)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-brand-text-muted">Monthly Total:</span>
                                                    <span className="text-2xl font-bold text-brand-text">${currentTotal}/mo</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleOpenPlanEditor}
                                                className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-opacity mb-2"
                                            >
                                                Manage Plan
                                            </button>

                                            <div className="bg-brand-light p-4 rounded-lg border border-brand-border space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-brand-text-muted">Next billing date:</span>
                                                    <span className="font-semibold text-brand-text">
                                                        {billingAccount.current_period_end 
                                                            ? new Date(billingAccount.current_period_end).toLocaleDateString()
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                                {billingAccount.cancel_at_period_end && (
                                                    <div className="text-xs text-yellow-600 font-semibold">
                                                        ⚠️ Subscription will cancel at period end
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleManageSubscription}
                                                disabled={isOpeningPortal}
                                                className="w-full flex items-center justify-center gap-2 bg-brand-light hover:bg-brand-border disabled:opacity-50 text-brand-text font-bold py-3 px-4 rounded-lg transition-colors mt-2"
                                            >
                                                {isOpeningPortal ? (
                                                    <>
                                                        <Loader />
                                                        <span>Opening Portal...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCardIcon className="w-5 h-5" />
                                                        <span>Billing Portal</span>
                                                    </>
                                                )}
                                            </button>

                                            <p className="text-xs text-center text-brand-text-muted mt-2">
                                                Cancel anytime. No refunds.
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            {/* No Active Subscription */}
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                                                <p className="text-sm text-yellow-800 mb-3">No active subscription found</p>
                                            </div>
                                            
                                            <button
                                                onClick={handleOpenPlanEditor}
                                                className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-opacity mb-2"
                                            >
                                                Get Started - Configure Plan
                                            </button>

                                            <a 
                                                href="/pricing"
                                                className="block text-center text-accent-blue hover:underline text-sm"
                                            >
                                                View Pricing Plans
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Plan Editor with +/- Buttons */}
                                    <div className="bg-brand-light rounded-lg p-4 border border-brand-border">
                                        <h3 className="font-semibold text-brand-text mb-4">
                                            {hasActiveSubscription ? 'Adjust Your Plan' : 'Configure Your Plan'}
                                        </h3>
                                        
                                        {/* Businesses Selector */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-brand-text">Number of Businesses</label>
                                                <span className="text-xs text-brand-text-muted">
                                                    ${basePlan} base + ${additionalBusinessCost}/mo additional
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleBusinessChange(-1)}
                                                    disabled={newBusinesses <= 1}
                                                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                                                >
                                                    <MinusIcon className="w-5 h-5" />
                                                </button>
                                                <div className="flex-1 text-center">
                                                    <div className="text-4xl font-bold text-brand-text">{newBusinesses}</div>
                                                    <div className="text-xs text-brand-text-muted">
                                                        {newBusinesses === 1 ? 'Business' : 'Businesses'}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleBusinessChange(1)}
                                                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                                                >
                                                    <PlusIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Seats Selector */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-brand-text">Team Seats</label>
                                                <span className="text-xs text-brand-text-muted">
                                                    1 included + ${seatCost}/mo additional
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSeatsChange(-1)}
                                                    disabled={newSeats <= 0}
                                                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                                                >
                                                    <MinusIcon className="w-5 h-5" />
                                                </button>
                                                <div className="flex-1 text-center">
                                                    <div className="text-4xl font-bold text-brand-text">{newSeats}</div>
                                                    <div className="text-xs text-brand-text-muted">
                                                        Additional {newSeats === 1 ? 'Seat' : 'Seats'}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSeatsChange(1)}
                                                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                                                >
                                                    <PlusIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Pricing Breakdown */}
                                        <div className="bg-white rounded-lg p-4 space-y-2 text-sm border border-slate-200">
                                            <div className="flex justify-between text-gray-700">
                                                <span>Base Plan (includes 1 business, 1 seat)</span>
                                                <span className="font-semibold">${basePlan}/mo</span>
                                            </div>
                                            
                                            {newAdditionalBusinessCount > 0 && (
                                                <div className="flex justify-between text-gray-700">
                                                    <span>
                                                        {newAdditionalBusinessCount === 1 
                                                            ? '1 Additional Business' 
                                                            : `${newAdditionalBusinessCount} Additional Businesses`}
                                                    </span>
                                                    <span className="font-semibold">${newAdditionalBusinessCount * additionalBusinessCost}/mo</span>
                                                </div>
                                            )}
                                            
                                            {newSeats > 0 && (
                                                <div className="flex justify-between text-gray-700">
                                                    <span>
                                                        {newSeats === 1 
                                                            ? '1 Additional Seat' 
                                                            : `${newSeats} Additional Seats`}
                                                    </span>
                                                    <span className="font-semibold">${newSeats * seatCost}/mo</span>
                                                </div>
                                            )}
                                            
                                            <div className="border-t border-gray-200 pt-2 mt-2">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-bold text-gray-900">Monthly Total</span>
                                                    <span className="text-2xl font-extrabold text-gray-900">
                                                        ${newTotal}<span className="text-sm font-normal text-gray-500">/mo</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {hasActiveSubscription && newTotal !== currentTotal && (
                                                <div className="pt-2 border-t border-gray-200">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Change</span>
                                                        <span className={newTotal > currentTotal ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                                            {newTotal > currentTotal ? '+' : ''}{newTotal - currentTotal}/mo
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCancelPlanEdit}
                                            disabled={isUpdatingPlan}
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdatePlan}
                                            disabled={isUpdatingPlan || (hasActiveSubscription && newBusinesses === currentBusinesses && newSeats === currentSeats)}
                                            className="flex-1 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {isUpdatingPlan ? (
                                                <>
                                                    <Loader />
                                                    Processing...
                                                </>
                                            ) : hasActiveSubscription ? (
                                                <>
                                                    {newTotal > currentTotal ? 'Upgrade Plan' : newTotal < currentTotal ? 'Downgrade Plan' : 'Update Plan'}
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </>
                                            ) : (
                                                <>
                                                    Continue to Payment
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AccountSection>

                     <AccountSection title="Team Members">
                        <div>
                            <p className="text-3xl font-bold text-brand-text">
                                {teamMembers.length} <span className="text-lg font-normal text-brand-text-muted">of {currentSeats + 1} included</span>
                            </p>
                            <p className="text-sm text-brand-text-muted">Your plan includes one owner user.</p>
                        </div>
                        <div className="space-y-3 mt-4">
                           {teamMembers.map(member => (
                               <TeamMemberCard key={member.id} member={member} onRemove={handleRemoveMember} />
                           ))}
                        </div>
                        <button 
                            onClick={handleOpenPlanEditor}
                            className="w-full mt-6 bg-brand-light hover:bg-brand-border text-brand-text font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                        >
                            Add team member
                        </button>
                        <div className="text-center pt-2 mt-2">
                            <p className="text-xs text-brand-text-muted">Additional team members are $15/month per user.</p>
                            <p className="text-xs text-brand-text-muted/70 mt-1">Perfect for assistants, marketers, or managers.</p>
                        </div>
                    </AccountSection>
                </div>

                {/* Column 2 */}
                <div className="space-y-8">
                     <AccountSection title="Business Profiles">
                        <div className="space-y-4">
                            <h3 className="font-bold text-brand-text">Business Profiles</h3>
                            <p className="text-3xl font-bold text-brand-text">
                                {profilesUsed} <span className="text-lg font-normal text-brand-text-muted">of {isAdmin ? 'Unlimited' : currentBusinesses}</span>
                            </p>
                            <p className="text-sm text-brand-text-muted">Your plan includes {currentBusinesses} business {currentBusinesses > 1 ? 'profiles' : 'profile'}.</p>
                            <button 
                                onClick={handleOpenPlanEditor}
                                className="w-full bg-brand-light hover:bg-brand-border text-brand-text font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                            >
                                Add another business
                            </button>
                            <p className="text-xs text-brand-text-muted text-center">Additional business profiles are $49/month.</p>
                        </div>
                    </AccountSection>
                    
                     <AccountSection title="Account Details">
                        <form onSubmit={handleProfileSave} className="space-y-4 text-sm">
                            <h3 className="font-semibold text-brand-text-muted mb-3">Profile</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-brand-text-muted mb-1">First Name</label>
                                    <input type="text" name="firstName" value={formState.firstName} onChange={handleFormChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-brand-text-muted mb-1">Last Name</label>
                                    <input type="text" name="lastName" value={formState.lastName} onChange={handleFormChange} className="w-full bg-brand-light border border-brand-border rounded-lg p-2" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-brand-text-muted mb-1">Title/Role (Optional)</label>
                                <select 
                                    name="role" 
                                    value={formState.role} 
                                    onChange={handleFormChange} 
                                    className="w-full bg-brand-light border border-brand-border rounded-lg p-2"
                                >
                                    <option value="">Select a role...</option>
                                    <optgroup label="Leadership">
                                        <option value="Owner">Owner</option>
                                        <option value="Founder">Founder</option>
                                        <option value="Co-Founder">Co-Founder</option>
                                        <option value="CEO">CEO</option>
                                        <option value="President">President</option>
                                        <option value="Vice President">Vice President</option>
                                        <option value="Director">Director</option>
                                        <option value="Partner">Partner</option>
                                    </optgroup>
                                    <optgroup label="Management">
                                        <option value="General Manager">General Manager</option>
                                        <option value="Operations Manager">Operations Manager</option>
                                        <option value="Office Manager">Office Manager</option>
                                        <option value="Store Manager">Store Manager</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Assistant Manager">Assistant Manager</option>
                                        <option value="Team Lead">Team Lead</option>
                                        <option value="Supervisor">Supervisor</option>
                                    </optgroup>
                                    <optgroup label="Marketing & Sales">
                                        <option value="Marketing Director">Marketing Director</option>
                                        <option value="Marketing Manager">Marketing Manager</option>
                                        <option value="Marketing Coordinator">Marketing Coordinator</option>
                                        <option value="Social Media Manager">Social Media Manager</option>
                                        <option value="Sales Director">Sales Director</option>
                                        <option value="Sales Manager">Sales Manager</option>
                                        <option value="Sales Representative">Sales Representative</option>
                                        <option value="Account Manager">Account Manager</option>
                                    </optgroup>
                                    <optgroup label="Operations">
                                        <option value="Administrator">Administrator</option>
                                        <option value="Office Administrator">Office Administrator</option>
                                        <option value="Executive Assistant">Executive Assistant</option>
                                        <option value="Administrative Assistant">Administrative Assistant</option>
                                        <option value="Receptionist">Receptionist</option>
                                        <option value="Coordinator">Coordinator</option>
                                    </optgroup>
                                    <optgroup label="Staff">
                                        <option value="Employee">Employee</option>
                                        <option value="Team Member">Team Member</option>
                                        <option value="Associate">Associate</option>
                                        <option value="Specialist">Specialist</option>
                                        <option value="Consultant">Consultant</option>
                                        <option value="Contractor">Contractor</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <p className="font-semibold text-brand-text-muted">Account Email</p>
                                <p className="text-brand-text">{profileData.user.email}</p>
                            </div>
                            {isDirty && <button type="submit" className="w-full bg-accent-blue hover:bg-accent-blue/80 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">Save Changes</button>}
                             <div className="pt-4 border-t border-brand-border flex flex-col items-start space-y-2">
                                <button type="button" onClick={onLogout} className="text-accent-blue hover:underline">Log Out</button>
                                <button type="button" className="text-red-500 hover:underline">Delete Account</button>
                            </div>
                        </form>
                     </AccountSection>
                </div>
            </div>
        </div>
    );
};
