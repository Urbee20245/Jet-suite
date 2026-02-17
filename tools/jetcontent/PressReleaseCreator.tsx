import React, { useState, useEffect } from 'react';
import type { ProfileData } from '../../types';
import { MegaphoneIcon, InformationCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { suggestPressReleaseHeadlines, suggestPressReleaseQuote } from '../../services/geminiService';
import { BoltIcon, ArrowRightIcon } from '../../components/icons/MiniIcons';

interface PressReleaseFormData {
  newsType: string;
  headline: string;
  keyDetails: {
    what: string;
    when: string;
    where: string;
    why: string;
    who: string;
  };
  quote: string;
  quoteName: string;
  quoteTitle: string;
  supportingDetails: string[];
  boilerplate: string;
  mediaContact: {
    name: string;
    email: string;
    phone: string;
  };
}

interface PressReleaseCreatorProps {
  profileData: ProfileData;
  onGenerate: (formData: PressReleaseFormData) => Promise<void>;
  onSaveDraft: (formData: PressReleaseFormData) => Promise<void>;
}

export const PressReleaseCreator: React.FC<PressReleaseCreatorProps> = ({ profileData, onGenerate, onSaveDraft }) => {
  const [formData, setFormData] = useState<PressReleaseFormData>({
    newsType: '',
    headline: '',
    keyDetails: {
      what: '',
      when: '',
      where: '',
      why: '',
      who: '',
    },
    quote: '',
    quoteName: `${profileData.user.firstName} ${profileData.user.lastName}`,
    quoteTitle: profileData.user.role || 'Owner',
    supportingDetails: [''],
    boilerplate: profileData.business.business_description || '',
    mediaContact: {
      name: `${profileData.user.firstName} ${profileData.user.lastName}`,
      email: profileData.business.email || profileData.user.email || '',
      phone: profileData.business.phone || profileData.user.phone || '',
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedHeadlines, setSuggestedHeadlines] = useState<string[]>([]);
  const [loadingHeadlines, setLoadingHeadlines] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [showAIHelp, setShowAIHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.newsType) {
      setError('Please select a type of announcement');
      return;
    }

    if (!formData.headline.trim()) {
      setError('Please enter a headline');
      return;
    }

    if (!formData.quote.trim()) {
      setError('Please provide a notable quote');
      return;
    }

    // Check if at least one key detail is filled
    const hasKeyDetails = Object.values(formData.keyDetails).some(v => v.trim());
    if (!hasKeyDetails) {
      setError('Please fill in at least one key detail (What, When, Where, Why, or Who)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onGenerate(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to generate press release');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestHeadlines = async () => {
    if (!formData.newsType) {
      setError('Please select an announcement type first');
      return;
    }

    // Create a brief description from available details
    const briefDesc = Object.values(formData.keyDetails).filter(v => v.trim()).join('. ');
    if (!briefDesc) {
      setError('Please fill in at least one key detail to get headline suggestions');
      return;
    }

    try {
      setLoadingHeadlines(true);
      setError('');
      const headlines = await suggestPressReleaseHeadlines(profileData, formData.newsType, briefDesc);
      setSuggestedHeadlines(headlines);
      setShowAIHelp(true);
    } catch (err: any) {
      setError('Failed to generate headline suggestions. Please try again.');
    } finally {
      setLoadingHeadlines(false);
    }
  };

  const handleSuggestQuote = async () => {
    if (!formData.newsType || !formData.headline) {
      setError('Please select announcement type and enter a headline first');
      return;
    }

    // Check if we have some key details
    const hasDetails = Object.values(formData.keyDetails).some(v => v.trim());
    if (!hasDetails) {
      setError('Please fill in at least one key detail to get quote suggestions');
      return;
    }

    try {
      setLoadingQuote(true);
      setError('');
      const quote = await suggestPressReleaseQuote(
        profileData,
        formData.newsType,
        formData.headline,
        formData.keyDetails
      );
      setFormData({ ...formData, quote });
    } catch (err: any) {
      setError('Failed to generate quote suggestion. Please try again.');
    } finally {
      setLoadingQuote(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* Header with AP Style warning */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-text mb-2">
              Create Press Release
            </h1>
            <p className="text-brand-text-muted">
              Professional announcement in AP Style format, ready for media distribution
            </p>
          </div>
          <button
            onClick={() => onSaveDraft(formData)}
            className="px-4 py-2 border-2 border-brand-border text-brand-text-muted font-medium rounded-xl hover:border-accent-blue/30 hover:bg-brand-light transition-all duration-200"
          >
            Save Draft
          </button>
        </div>

        {/* AP Style notice */}
        <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
          <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
              <InformationCircleIcon className="w-4 h-4 text-accent-blue" />
            </div>
            <h3 className="text-sm font-bold text-brand-text">AP Style Format Required</h3>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-brand-text-muted">
              Press releases follow strict AP Style journalism standards. Our AI will format everything correctly, but provide accurate, factual information only.
            </p>
          </div>
        </div>

        {/* AI Assistant Toggle */}
        <div className="mt-4 bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border border-accent-purple/20 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-6 h-6 text-accent-purple" />
              <div>
                <h3 className="text-sm font-semibold text-brand-text">AI Writing Assistant</h3>
                <p className="text-xs text-brand-text-muted mt-0.5">Get AI-powered suggestions for headlines, quotes, and details</p>
              </div>
            </div>
            <button
              onClick={() => setShowAIHelp(!showAIHelp)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                showAIHelp
                  ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white shadow-md'
                  : 'bg-brand-card text-brand-text border border-brand-border hover:border-accent-purple/30'
              }`}
            >
              {showAIHelp ? '✓ Active' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">

          {/* News Type */}
          <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                <MegaphoneIcon className="w-4 h-4 text-accent-blue" />
              </div>
              <span className="text-sm font-bold text-brand-text">Type of Announcement *</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'expansion', label: 'Business Expansion / New Location' },
                  { value: 'launch', label: 'New Product / Service Launch' },
                  { value: 'award', label: 'Award / Recognition' },
                  { value: 'partnership', label: 'Partnership Announcement' },
                  { value: 'leadership', label: 'Leadership Change' },
                  { value: 'community', label: 'Community Involvement' },
                  { value: 'milestone', label: 'Milestone / Anniversary' },
                  { value: 'event', label: 'Event Announcement' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, newsType: value })}
                    className={`px-4 py-3 text-left rounded-xl border-2 transition-all duration-200 ${
                      formData.newsType === value
                        ? 'border-accent-purple bg-accent-purple/5 text-accent-purple font-medium shadow-sm shadow-accent-purple/10'
                        : 'border-brand-border text-brand-text-muted hover:border-accent-blue/30 hover:bg-brand-light'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Headline with AI Suggestions */}
          <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                <BoltIcon className="w-4 h-4 text-accent-purple" />
              </div>
              <span className="text-sm font-bold text-brand-text flex-1">Headline *</span>
              {showAIHelp && (
                <button
                  type="button"
                  onClick={handleSuggestHeadlines}
                  disabled={loadingHeadlines}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-accent-purple to-accent-blue text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {loadingHeadlines ? 'Generating...' : 'AI Suggest'}
                </button>
              )}
            </div>
            <div className="p-6">
              {/* Suggested Headlines */}
              {suggestedHeadlines.length > 0 && showAIHelp && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs text-brand-text-muted font-medium">AI-Generated Headlines (click to use):</p>
                  {suggestedHeadlines.map((headline, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, headline });
                        setSuggestedHeadlines([]);
                      }}
                      className="w-full text-left px-4 py-2.5 bg-gradient-to-r from-accent-purple/5 to-accent-blue/5 border border-accent-purple/20 rounded-xl text-sm text-brand-text hover:border-accent-purple hover:shadow-sm transition-all duration-200"
                    >
                      {headline}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="e.g., Custom Websites Plus Opens Second Office in Atlanta"
                className="w-full px-4 py-3 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text font-medium outline-none"
              />
              <p className="text-xs text-brand-text-muted mt-2">
                AI will refine into proper AP Style format (active voice, present tense, no articles)
              </p>
            </div>
          </div>

          {/* Key Details - 5 W's */}
          <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                <ArrowRightIcon className="w-4 h-4 text-accent-blue" />
              </div>
              <span className="text-sm font-bold text-brand-text">Key Details (5 W's) *</span>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { key: 'what', label: 'What', placeholder: 'What is happening? (e.g., Opening new office in Buckhead)' },
                  { key: 'when', label: 'When', placeholder: 'When is it happening? (e.g., March 15, 2026)' },
                  { key: 'where', label: 'Where', placeholder: 'Where is it happening? (e.g., 3400 Peachtree Rd, Atlanta, GA)' },
                  { key: 'why', label: 'Why', placeholder: 'Why is this significant? (e.g., Expanding to serve more metro Atlanta clients)' },
                  { key: 'who', label: 'Who', placeholder: 'Who is involved? (e.g., Founded by Mr. Holmes in 2020)' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={formData.keyDetails[key as keyof typeof formData.keyDetails]}
                      onChange={(e) => setFormData({
                        ...formData,
                        keyDetails: { ...formData.keyDetails, [key]: e.target.value }
                      })}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quote with AI Assistance */}
          <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                <SparklesIcon className="w-4 h-4 text-accent-purple" />
              </div>
              <span className="text-sm font-bold text-brand-text flex-1">Notable Quote *</span>
              {showAIHelp && (
                <button
                  type="button"
                  onClick={handleSuggestQuote}
                  disabled={loadingQuote}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-accent-purple to-accent-blue text-white rounded-lg text-xs font-semibold hover:shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {loadingQuote ? 'Generating...' : 'AI Generate'}
                </button>
              )}
            </div>
            <div className="p-6">
              <p className="text-xs text-brand-text-muted mb-3">
                Provide a quote from the business owner or executive. Should be newsworthy, not promotional.
              </p>
              <textarea
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                placeholder={`"This expansion allows us to better serve our growing client base in metro Atlanta and continue our mission of helping local businesses thrive in the digital age."`}
                rows={3}
                className="w-full px-4 py-3 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text resize-none outline-none"
              />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.quoteName}
                    onChange={(e) => setFormData({ ...formData, quoteName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.quoteTitle}
                    onChange={(e) => setFormData({ ...formData, quoteTitle: e.target.value })}
                    placeholder="e.g., CEO, Founder"
                    className="w-full px-3 py-2.5 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Details */}
          <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                <BoltIcon className="w-4 h-4 text-accent-blue" />
              </div>
              <span className="text-sm font-bold text-brand-text">Supporting Details</span>
            </div>
            <div className="p-6">
              <p className="text-xs text-brand-text-muted mb-4">
                Additional facts, statistics, or details that support your announcement
              </p>
              <div className="space-y-2">
                {formData.supportingDetails.map((detail, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={detail}
                      onChange={(e) => {
                        const newDetails = [...formData.supportingDetails];
                        newDetails[index] = e.target.value;
                        setFormData({ ...formData, supportingDetails: newDetails });
                      }}
                      placeholder="e.g., Will create 15 new jobs"
                      className="flex-1 px-4 py-2.5 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text outline-none"
                    />
                    {formData.supportingDetails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newDetails = formData.supportingDetails.filter((_, i) => i !== index);
                          setFormData({ ...formData, supportingDetails: newDetails });
                        }}
                        className="px-3 py-2 text-brand-text-muted hover:text-red-600 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, supportingDetails: [...formData.supportingDetails, ''] })}
                  className="text-sm text-accent-blue font-medium hover:underline"
                >
                  + Add Detail
                </button>
              </div>
            </div>
          </div>

          {/* Boilerplate */}
          <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                <ArrowRightIcon className="w-4 h-4 text-accent-blue" />
              </div>
              <span className="text-sm font-bold text-brand-text">Company Boilerplate</span>
            </div>
            <div className="p-6">
              <p className="text-xs text-brand-text-muted mb-3">
                Standard "About" description of your company (auto-populated from business profile)
              </p>
              <textarea
                value={formData.boilerplate}
                onChange={(e) => setFormData({ ...formData, boilerplate: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text resize-none outline-none"
              />
            </div>
          </div>

          {/* Media Contact */}
          <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
            <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center shrink-0">
                <InformationCircleIcon className="w-4 h-4 text-accent-blue" />
              </div>
              <span className="text-sm font-bold text-brand-text">Media Contact Information *</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.mediaContact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      mediaContact: { ...formData.mediaContact, name: e.target.value }
                    })}
                    className="w-full px-3 py-2.5 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.mediaContact.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      mediaContact: { ...formData.mediaContact, email: e.target.value }
                    })}
                    className="w-full px-3 py-2.5 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.mediaContact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      mediaContact: { ...formData.mediaContact, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2.5 bg-brand-light border border-brand-border rounded-xl focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all duration-200 text-brand-text outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-200/60 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex items-center justify-between pt-6 border-t border-brand-border">
            <div className="flex items-center gap-2 text-sm text-brand-text-muted">
              <MegaphoneIcon className="w-5 h-5 text-brand-text-muted/60" />
              <span>Press release will be formatted in <span className="font-semibold text-brand-text">AP Style</span></span>
            </div>
            <button
              type="submit"
              disabled={loading || !formData.newsType || !formData.headline || !formData.quote}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <MegaphoneIcon className="w-4 h-4" />
              {loading ? 'Generating Press Release...' : 'Generate Press Release'}
            </button>
          </div>

        </div>
      </form>

    </div>
  );
};
