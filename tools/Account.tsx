// DYAD_NATIVE_GIT_TEST
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
    
    const [billingAccount, setBillingAccount] = useState<any>(null);
    const [isLoadingBilling, setIsLoadingBilling] = useState(true);
    const [isOpeningPortal, setIsOpeningPortal] = useState(false);
    
    const [actualBusinessCount, setActualBusinessCount] = useState(0);
    const [actualSeatCount, setActualSeatCount] = useState(0);

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
            {/* … UI unchanged … */}
        </div>
    );
};
