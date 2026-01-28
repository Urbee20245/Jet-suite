import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-hot-toast';
import { useProfile } from '../contexts/ProfileContext';
import { LoadingSpinner, Button, Input, Label, Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../components/ui';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '../components/icons/MiniIcons';
import { QRCodeDownloader } from '../components/QRCodeDownloader'; // Import the new component

const JetTrust = () => {
  const supabase = useSupabaseClient();
  const { profile, setProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  
  // State for Public Review Page
  const [pageSlug, setPageSlug] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [isPageEnabled, setIsPageEnabled] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const publicReviewPageUrl = `${window.location.origin}/r/${pageSlug}`;

  useEffect(() => {
    if (profile?.business?.id) {
      fetchTrustSettings();
    }
  }, [profile?.business?.id]);

  const fetchTrustSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('review_page_slug, google_review_url, review_page_enabled')
        .eq('id', profile.business.id)
        .single();

      if (error) throw error;

      if (data) {
        setPageSlug(data.review_page_slug || profile.business.slug || '');
        setGoogleReviewUrl(data.google_review_url || '');
        setIsPageEnabled(data.review_page_enabled || false);
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
    setSlugAvailable(null); // Reset availability check
  };

  const checkSlugAvailability = async () => {
    if (!pageSlug || pageSlug === profile.business.review_page_slug) {
      setSlugAvailable(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('review_page_slug', pageSlug)
        .neq('id', profile.business.id)
        .limit(1);

      if (error) throw error;
      setSlugAvailable(data.length === 0);
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugAvailable(false);
    }
  };

  const handleSavePublicPage = async () => {
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
        .from('businesses')
        .update({
          review_page_slug: pageSlug,
          google_review_url: googleReviewUrl,
          review_page_enabled: isPageEnabled,
        })
        .eq('id', profile.business.id)
        .select()
        .single();

      if (error) throw error;

      // Update profile context
      setProfile({
        ...profile,
        business: {
          ...profile.business,
          review_page_slug: data.review_page_slug,
          google_review_url: data.google_review_url,
          review_page_enabled: data.review_page_enabled,
        },
      });

      toast.success('Public review page settings saved!');
    } catch (error: any) {
      toast.error('Failed to save settings. Please try again.');
      console.error('Error saving public page settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold text-white mb-2">JetTrust</h1>
      <p className="text-gray-400 mb-6">Build customer confidence with reviews and trust signals.</p>

      <Tabs>
        <TabList>
          <Tab>Widget</Tab>
          <Tab>Public Review Page</Tab>
          <Tab>Email Requests</Tab>
        </TabList>

        <TabPanel>
          <Card>
            <CardHeader>
              <CardTitle>Review Widget</CardTitle>
              <CardDescription>Embed a review widget on your website to display your latest positive reviews.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Widget settings and installation code will be available here soon.</p>
            </CardContent>
          </Card>
        </TabPanel>
        <TabPanel>
          <Card>
            <CardHeader>
              <CardTitle>Public Review Page</CardTitle>
              <CardDescription>A shareable, branded page to collect new reviews from your customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <Label htmlFor="page-enabled" className="flex flex-col">
                    <span className="font-semibold text-white">Enable Public Page</span>
                    <span className="text-sm text-gray-400">Make your review page accessible to the public.</span>
                  </Label>
                  <input
                    type="checkbox"
                    id="page-enabled"
                    checked={isPageEnabled}
                    onChange={() => setIsPageEnabled(!isPageEnabled)}
                    className="toggle toggle-primary"
                  />
                </div>

                {/* Page URL Slug */}
                <div>
                  <Label htmlFor="page-slug" className="font-semibold text-white">Page URL Slug</Label>
                  <div className="flex items-center mt-2">
                    <span className="px-3 py-2 bg-slate-700 text-gray-400 rounded-l-md border border-r-0 border-slate-600">
                      {window.location.origin}/r/
                    </span>
                    <Input
                      id="page-slug"
                      type="text"
                      value={pageSlug}
                      onChange={handleSlugChange}
                      onBlur={checkSlugAvailability}
                      className="rounded-l-none rounded-r-md flex-1"
                      placeholder="your-business-name"
                    />
                  </div>
                  {slugTouched && slugAvailable === true && (
                    <p className="text-sm text-green-400 mt-2 flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> This URL is available!</p>
                  )}
                  {slugTouched && slugAvailable === false && (
                    <p className="text-sm text-red-400 mt-2 flex items-center gap-1"><ExclamationTriangleIcon className="w-4 h-4" /> This URL is taken.</p>
                  )}
                  {isPageEnabled && pageSlug && (
                    <p className="text-sm text-gray-400 mt-2">
                      Your public page is live at: <a href={publicReviewPageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{publicReviewPageUrl}</a>
                    </p>
                  )}
                </div>

                {/* Google Review URL */}
                <div>
                  <Label htmlFor="google-review-url" className="font-semibold text-white">Google Review URL</Label>
                  <Input
                    id="google-review-url"
                    type="url"
                    value={googleReviewUrl}
                    onChange={(e) => setGoogleReviewUrl(e.target.value)}
                    className="mt-2"
                    placeholder="https://g.page/r/YourGoogleId/review"
                  />
                   <p className="text-xs text-gray-500 mt-2 flex items-start gap-2">
                    <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>This is the direct link for customers to leave a review on your Google Business Profile.</span>
                  </p>
                </div>

                {/* NEW: QR Code Downloader */}
                {isPageEnabled && pageSlug && (
                  <QRCodeDownloader url={publicReviewPageUrl} />
                )}

              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePublicPage} disabled={isSaving || slugAvailable === false}>
                {isSaving ? <><LoadingSpinner className="mr-2" /> Saving...</> : 'Save Settings'}
              </Button>
            </CardFooter>
          </Card>
        </TabPanel>
        <TabPanel>
          <Card>
            <CardHeader>
              <CardTitle>Email Review Requests</CardTitle>
              <CardDescription>Send automated emails to your customers asking for reviews.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Email request functionality will be available here soon.</p>
            </CardContent>
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default JetTrust;