import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';
import type { ProfileData, Tool } from '../types';
import { Loader } from '../components/Loader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { QRCodeDownloader } from '../components/QRCodeDownloader';

interface JetTrustProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

export const JetTrust: React.FC<JetTrustProps> = ({ tool, profileData, setActiveTool }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('public_page');
  
  // State for Public Review Page
  const [pageSlug, setPageSlug] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [isPageEnabled, setIsPageEnabled] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const publicReviewPageUrl = typeof window !== 'undefined' ? `${window.location.origin}/r/${pageSlug}` : '';
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (profileData?.business?.id) {
      fetchTrustSettings();
    } else {
      setLoading(false);
    }
  }, [profileData?.business?.id]);

  const fetchTrustSettings = async () => {
    if (!supabase || !profileData.business.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('review_pages')
        .select('*')
        .eq('user_id', profileData.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPageSlug(data.slug || '');
        setGoogleReviewUrl(data.google_review_url || '');
        setIsPageEnabled(data.is_active || false);
      } else {
        setPageSlug(profileData.business.business_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        setGoogleReviewUrl(profileData.business.google_business_profile?.mapsUrl || '');
      }
    } catch (error: any) {
      toast.error('Failed to load JetTrust settings.');
      console.error('Error fetching trust settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setPageSlug(newSlug);
    setSlugTouched(true);
    setSlugAvailable(null);
  };

  const checkSlugAvailability = async () => {
    if (!supabase || !pageSlug) return;
    
    const { data: existingPage, error: existingError } = await supabase.from('review_pages').select('slug').eq('user_id', profileData.user.id).single();
    if (existingPage && existingPage.slug === pageSlug) {
        setSlugAvailable(true);
        return;
    }

    try {
      const { data, error } = await supabase
        .from('review_pages')
        .select('id')
        .eq('slug', pageSlug)
        .limit(1);

      if (error) throw error;
      setSlugAvailable(data.length === 0);
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugAvailable(false);
    }
  };

  const handleSavePublicPage = async () => {
    if (!supabase) return;
    if (slugAvailable === false) {
      toast.error("This URL slug is already taken. Please choose another.");
      return;
    }
    if (!googleReviewUrl.startsWith('http')) {
      toast.error("Please enter a valid Google Review URL.");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('review_pages')
        .upsert({
          user_id: profileData.user.id,
          slug: pageSlug,
          google_review_url: googleReviewUrl,
          is_active: isPageEnabled,
          business_name: profileData.business.business_name,
          logo_url: profileData.business.dna?.logo,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      toast.success('Public review page settings saved!');
    } catch (error: any) {
      toast.error('Failed to save settings. Please try again.');
      console.error('Error saving public page settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold text-brand-text mb-2">JetTrust</h1>
      <p className="text-brand-text-muted mb-6">Build customer confidence with reviews and trust signals.</p>

      <div className="flex border-b border-brand-border mb-6">
        <button onClick={() => setActiveTab('widget')} className={`px-4 py-2 font-semibold ${activeTab === 'widget' ? 'text-accent-purple border-b-2 border-accent-purple' : 'text-brand-text-muted'}`}>Widget</button>
        <button onClick={() => setActiveTab('public_page')} className={`px-4 py-2 font-semibold ${activeTab === 'public_page' ? 'text-accent-purple border-b-2 border-accent-purple' : 'text-brand-text-muted'}`}>Public Review Page</button>
        <button onClick={() => setActiveTab('email')} className={`px-4 py-2 font-semibold ${activeTab === 'email' ? 'text-accent-purple border-b-2 border-accent-purple' : 'text-brand-text-muted'}`}>Email Requests</button>
      </div>

      {activeTab === 'widget' && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-brand-text">Review Widget</h2>
            <p className="text-brand-text-muted mt-1">Embed a review widget on your website to display your latest positive reviews.</p>
          </div>
          <div className="p-6 border-t border-brand-border">
            <p className="text-brand-text-muted">Widget settings and installation code will be available here soon.</p>
          </div>
        </Card>
      )}

      {activeTab === 'public_page' && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-brand-text">Public Review Page</h2>
            <p className="text-brand-text-muted mt-1">A shareable, branded page to collect new reviews from your customers.</p>
          </div>
          <div className="p-6 border-t border-brand-border">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-brand-light rounded-lg">
                <label htmlFor="page-enabled" className="flex flex-col">
                  <span className="font-semibold text-brand-text">Enable Public Page</span>
                  <span className="text-sm text-brand-text-muted">Make your review page accessible to the public.</span>
                </label>
                <input
                  type="checkbox"
                  id="page-enabled"
                  checked={isPageEnabled}
                  onChange={() => setIsPageEnabled(!isPageEnabled)}
                  className="h-6 w-10 rounded-full bg-gray-300 relative cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-purple"
                  style={{ appearance: 'none' }}
                />
              </div>

              <div>
                <label htmlFor="page-slug" className="font-semibold text-brand-text">Page URL Slug</label>
                <div className="flex items-center mt-2">
                  <span className="px-3 py-2 bg-brand-light text-brand-text-muted rounded-l-md border border-r-0 border-brand-border">
                    {typeof window !== 'undefined' ? `${window.location.origin}/r/` : ''}
                  </span>
                  <input
                    id="page-slug"
                    type="text"
                    value={pageSlug}
                    onChange={handleSlugChange}
                    onBlur={checkSlugAvailability}
                    className="rounded-l-none rounded-r-md flex-1 w-full p-2 bg-white border border-brand-border"
                    placeholder="your-business-name"
                  />
                </div>
                {slugTouched && slugAvailable === true && (
                  <p className="text-sm text-green-500 mt-2 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> This URL is available!</p>
                )}
                {slugTouched && slugAvailable === false && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-1"><ExclamationTriangleIcon className="w-4 h-4" /> This URL is taken.</p>
                )}
                {isPageEnabled && pageSlug && (
                  <p className="text-sm text-brand-text-muted mt-2">
                    Your public page is live at: <a href={publicReviewPageUrl} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">{publicReviewPageUrl}</a>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="google-review-url" className="font-semibold text-brand-text">Google Review URL</label>
                <input
                  id="google-review-url"
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="mt-2 w-full p-2 bg-white border border-brand-border rounded-md"
                  placeholder="https://g.page/r/YourGoogleId/review"
                />
                 <p className="text-xs text-brand-text-muted mt-2 flex items-start gap-2">
                  <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>This is the direct link for customers to leave a review on your Google Business Profile.</span>
                </p>
              </div>

              {isPageEnabled && pageSlug && (
                <QRCodeDownloader url={publicReviewPageUrl} />
              )}

            </div>
          </div>
          <div className="p-6 border-t border-brand-border">
            <Button onClick={handleSavePublicPage} disabled={isSaving || slugAvailable === false}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'email' && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-brand-text">Email Review Requests</h2>
            <p className="text-brand-text-muted mt-1">Send automated emails to your customers asking for reviews.</p>
          </div>
          <div className="p-6 border-t border-brand-border">
            <p className="text-brand-text-muted">Email request functionality will be available here soon.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default JetTrust;