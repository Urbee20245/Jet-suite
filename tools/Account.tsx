
import React, { useState, useEffect } from 'react';
import type { ProfileData, TeamMember } from '../types';
import { CheckCircleIcon, TrashIcon, XMarkIcon, CreditCardIcon } from '../components/icons/MiniIcons';
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

    // Fetch billing information
    useEffect(() => {
        const loadBillingInfo = async () => {
            try {
                setIsLoadingBilling(true);
                const account = await getBillingAccount(profileData.user.email);
                setBillingAccount(account);
            } catch (error) {
                console.error('Failed to load billing info:', error);
                setBillingAccount(null);
            } finally {
                setIsLoadingBilling(false);
            }
        };
        
        loadBillingInfo();
    }, [profileData.user.email]);

    useEffect(() => {
        setIsDirty(
            formState.firstName !== profileData.user.firstName ||
            formState.lastName !== profileData.user.lastName ||
            formState.role !== profileData.user.role
        );
    }, [formState, profileData.user]);
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile({
            ...profileData,
            user: { ...profileData.user, ...formState },
        });
        setIsDirty(false);
    };

    const handleAddMember = (newMember: Omit<TeamMember, 'id' | 'role'>) => {
        setTeamMembers(prev => [...prev, { ...newMember, id: `member_${Date.now()}`, role: 'Team Member' }]);
        setShowAddMemberModal(false);
    };
    
    const handleRemoveMember = (id: string) => {
        if(window.confirm('Are you sure you want to remove this team member?')) {
            setTeamMembers(prev => prev.filter(m => m.id !== id));
        }
    };

    const handleManageSubscription = async () => {
        if (!billingAccount?.stripe_customer_id) {
            alert('No subscription found. Please subscribe first.');
            return;
        }

        try {
            setIsOpeningPortal(true);
            const { url } = await createPortalSession(billingAccount.stripe_customer_id);
            
            // Redirect to Stripe Customer Portal
            window.location.href = url;
        } catch (error) {
            console.error('Failed to open portal:', error);
            alert('Failed to open billing portal. Please try again.');
        } finally {
            setIsOpeningPortal(false);
        }
    };

    return (
        <div className="space-y-8">
            {showAddMemberModal && <AddTeamMemberModal onAdd={handleAddMember} onCancel={() => setShowAddMemberModal(false)} />}

            <div>
                <h1 className="text-3xl font-extrabold text-brand-text">Account</h1>
                <p className="text-lg text-brand-text-muted mt-1">Manage your plan, businesses, and team.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Column 1 */}
                <div className="space-y-8">
                    <AccountSection title="Plan & Billing">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-brand-text">
                                    Current Plan: {plan.name} 
                                    {isAdmin && <span className="ml-2 text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Admin</span>}
                                </h3>
                                {!isLoadingBilling && billingAccount && (
                                    <span className={`text-xs font-semibold ${getSubscriptionStatusColor(billingAccount.subscription_status)}`}>
                                        {getSubscriptionStatusLabel(billingAccount.subscription_status)}
                                    </span>
                                )}
                            </div>
                            
                            <ul className="space-y-2 text-sm text-brand-text-muted">
                                <li className="flex items-center">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2"/>
                                    {billingAccount?.business_count || 1} business profile{billingAccount?.business_count !== 1 ? 's' : ''}
                                </li>
                                <li className="flex items-center">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2"/>
                                    Full tool access
                                </li>
                                {billingAccount?.seat_count > 0 && (
                                    <li className="flex items-center">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2"/>
                                        {billingAccount.seat_count} additional team seat{billingAccount.seat_count !== 1 ? 's' : ''}
                                    </li>
                                )}
                            </ul>

                            {isLoadingBilling ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader />
                                </div>
                            ) : billingAccount ? (
                                <div className="space-y-3">
                                    {/* Subscription Details */}
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

                                    {/* Manage Subscription Button */}
                                    <button
                                        onClick={handleManageSubscription}
                                        disabled={isOpeningPortal}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-opacity"
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

                                    {/* Cancel Policy */}
                                    <p className="text-xs text-center text-brand-text-muted">
                                        Cancel anytime. No refunds.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-brand-text-muted mb-3">
                                        No active subscription found
                                    </p>
                                    <a 
                                        href="/pricing"
                                        className="inline-block bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-opacity"
                                    >
                                        View Pricing Plans
                                    </a>
                                </div>
                            )}
                        </div>
                    </AccountSection>

                     <AccountSection title="Team Members">
                        <div>
                            <p className="text-3xl font-bold text-brand-text">{teamMembers.length} <span className="text-lg font-normal text-brand-text-muted">of 1 included</span></p>
                            <p className="text-sm text-brand-text-muted">Your plan includes one owner user.</p>
                        </div>
                        <div className="space-y-3 mt-4">
                           {teamMembers.map(member => (
                               <TeamMemberCard key={member.id} member={member} onRemove={handleRemoveMember} />
                           ))}
                        </div>
                        <button onClick={() => setShowAddMemberModal(true)} className="w-full mt-6 bg-brand-light hover:bg-brand-border text-brand-text font-bold py-2 px-4 rounded-lg text-sm transition-colors">
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
                            <p className="text-3xl font-bold text-brand-text">{profilesUsed} <span className="text-lg font-normal text-brand-text-muted">of {isAdmin ? 'Unlimited' : plan.profileLimit}</span></p>
                            <p className="text-sm text-brand-text-muted">Your plan includes one business profile.</p>
                            <button className="w-full bg-brand-light hover:bg-brand-border text-brand-text font-bold py-2 px-4 rounded-lg text-sm transition-colors">
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
                                <input type="text" name="role" value={formState.role} onChange={handleFormChange} placeholder="e.g., Owner, Manager, Marketing Director" className="w-full bg-brand-light border border-brand-border rounded-lg p-2" />
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
