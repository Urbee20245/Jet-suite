
import React, { useState } from 'react';
import type { ProfileData, BusinessDna } from '../types';
import { TrashIcon, PencilIcon, EyeIcon, ArrowPathIcon } from '../components/icons/MiniIcons';

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

export const AdminPanel: React.FC<AdminPanelProps> = ({ allProfiles, setAllProfiles, currentUserProfile, setCurrentUserProfile, onImpersonate }) => {
    
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
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-brand-text">Admin Panel</h1>
                <p className="text-lg text-brand-text-muted mt-1">Manage all businesses, users, and system settings.</p>
            </div>

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
                </div>
            </AdminSection>

            {/* Business Management */}
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

             {/* User Management */}
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
        </div>
    );
};
