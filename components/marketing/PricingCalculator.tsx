
import React, { useState, useMemo } from 'react';

export const PricingCalculator: React.FC = () => {
    const [businesses, setBusinesses] = useState(1);
    const [teamMembers, setTeamMembers] = useState(0);

    const basePrice = 149;
    const additionalBusinessPrice = 49;
    const additionalTeamMemberPrice = 15;
    
    const totalCost = useMemo(() => {
        const businessCost = businesses > 1 ? (businesses - 1) * additionalBusinessPrice : 0;
        const teamMemberCost = teamMembers * additionalTeamMemberPrice;
        return basePrice + businessCost + teamMemberCost;
    }, [businesses, teamMembers]);
    
    const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(1, parseInt(e.target.value) || 1);
        setBusinesses(val);
    };

    const handleTeamMemberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(0, parseInt(e.target.value) || 0);
        setTeamMembers(val);
    };

    return (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 glow-card glow-card-rounded-2xl">
            <h3 className="font-bold text-white text-center">Calculate your monthly total</h3>
            <div className="mt-6 space-y-4">
                <div>
                    <label htmlFor="businesses" className="text-sm font-medium text-gray-300">Number of businesses</label>
                    <input 
                        id="businesses"
                        type="number" 
                        min="1"
                        value={businesses}
                        onChange={handleBusinessChange}
                        className="mt-1 w-full bg-slate-900/50 border border-slate-600 rounded-lg p-2 text-white"
                    />
                </div>
                 <div>
                    <label htmlFor="team" className="text-sm font-medium text-gray-300">Extra team members</label>
                    <input 
                        id="team"
                        type="number" 
                        min="0"
                        value={teamMembers}
                        onChange={handleTeamMemberChange}
                        className="mt-1 w-full bg-slate-900/50 border border-slate-600 rounded-lg p-2 text-white"
                    />
                </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                <p className="text-sm text-gray-400">Your Total:</p>
                <p className="text-4xl font-extrabold text-white">${totalCost}<span className="text-lg font-medium text-gray-400">/mo</span></p>
            </div>
        </div>
    );
};
