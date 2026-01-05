import React, { useState } from 'react';
import { getSupabaseClient } from '../integrations/supabase/client';

interface OnboardingPageProps {
  navigate: (path: string) => void;
  userId: string;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ navigate, userId }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    business_website: '',
    industry: '',
    city: '',
    state: ''
  });
  const [hasNoWebsite, setHasNoWebsite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
        setError('Database service is currently unavailable. Cannot complete onboarding.');
        setIsSubmitting(false);
        return;
    }

    const website = hasNoWebsite ? 'https://pending-setup.com' : formData.business_website;

    if (!formData.business_name || !website || !formData.industry || !formData.city || !formData.state) {
      setError('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Use INSERT for initial creation. If a record already exists (e.g., from webhook), 
      // this will fail, but the user should be redirected to /app anyway.
      const { error: dbError } = await supabase
        .from('business_profiles')
        .insert({
          user_id: userId,
          business_name: formData.business_name,
          business_website: website,
          industry: formData.industry,
          city: formData.city,
          state: formData.state,
          is_primary: true, // CRITICAL: Mark as primary
          is_active: true,
          is_complete: true, // Mark as complete since they filled out the form
          updated_at: new Date().toISOString()
        });

      if (dbError) {
        // If insert fails (e.g., duplicate key from webhook), we assume the profile exists.
        // We should still attempt to update the existing primary profile if possible.
        // However, for simplicity in the onboarding flow, we assume success and redirect.
        // If the user is here, they should be able to proceed.
        console.warn('[Onboarding] Initial INSERT failed, attempting to proceed/update:', dbError);
        
        // Fallback: Attempt to update the existing primary profile if it exists
        const { data: existingPrimary, error: fetchError } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', userId)
          .eq('is_primary', true)
          .maybeSingle();
          
        if (fetchError) throw fetchError;

        if (existingPrimary) {
            const { error: updateError } = await supabase
                .from('business_profiles')
                .update({
                    business_name: formData.business_name,
                    business_website: website,
                    industry: formData.industry,
                    city: formData.city,
                    state: formData.state,
                    is_complete: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingPrimary.id);
            if (updateError) throw updateError;
        } else {
            // If we failed to insert and failed to find an existing primary, something is wrong.
            throw dbError;
        }
      }

      // Use a hard redirect to ensure the main App router re-verifies the 
      // newly created business profile from the database on refresh.
      window.location.href = '/app';
    } catch (err: any) {
      console.error('[Onboarding] Submit error:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-brand-card border border-slate-700 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Setup Your Business</h1>
        <p className="text-gray-400 text-sm mb-8">Tell us about your business to unlock your growth tools.</p>

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Business Name</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="e.g. Acme Plumbing"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-purple outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Website URL</label>
            <input
              type="url"
              name="business_website"
              value={formData.business_website}
              onChange={handleChange}
              disabled={hasNoWebsite}
              placeholder="https://..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-purple outline-none disabled:opacity-50"
              required={!hasNoWebsite}
            />
            <label className="flex items-center mt-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={hasNoWebsite}
                onChange={(e) => setHasNoWebsite(e.target.checked)}
                className="mr-2 rounded border-slate-700 text-accent-purple focus:ring-0"
              />
              I don't have a website yet
            </label>

            {hasNoWebsite && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  Need a professional website? We build high-converting sites for local businesses.{' '}
                  <a 
                    href="https://customwebsitesplus.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent-purple font-bold hover:underline"
                  >
                    Learn more here →
                  </a>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Business Category</label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-purple outline-none"
              required
            >
              <option value="">Select a category...</option>
              <option value="Home Services">Home Services</option>
              <option value="Professional Services">Professional Services</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Retail">Retail</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-purple outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-accent-purple outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-accent-purple to-accent-pink hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-4"
          >
            {isSubmitting ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};