import React, { useState, useEffect, useRef } from 'react';
import type { Tool, ProfileData, SocialConnection } from '../types';
import { generateImage, generateSocialPosts, generateServiceDescription as aiGenerateServiceDescription, generateServiceTags as aiGenerateServiceTags } from '../services/geminiService';
import {
  getServiceListings,
  createServiceListing,
  updateServiceListing,
  deleteServiceListing,
  saveServiceImage,
  deleteServiceImage,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  SERVICE_CATEGORIES,
  PRICE_TYPES,
} from '../services/jetServicesService';
import type { ServiceListing, ServiceImage, ServiceCalendarEvent } from '../services/jetServicesService';
import { getSocialConnections, createScheduledPost, PLATFORM_INFO } from '../services/socialMediaService';
import { Loader } from '../components/Loader';
import { HowToUse } from '../components/HowToUse';
import { InformationCircleIcon, CheckCircleIcon } from '../components/icons/MiniIcons';
import { SocialConnectionsManager } from '../components/SocialConnectionsManager';
import { SevenDayPlanner } from '../components/SevenDayPlanner';
import { SharePostModal } from '../components/SharePostModal';
import { AnalysisLoadingState } from '../components/AnalysisLoadingState';
import { TOOLS } from '../constants';
import { getTomorrowDate, getMinDate, getMaxDate } from '../utils/dateTimeUtils';
import { getSupabaseClient } from '../integrations/supabase/client';

interface JetServicesProps {
  tool: Tool;
  profileData: ProfileData;
  setActiveTool: (tool: Tool | null) => void;
}

type ViewMode = 'services' | 'create' | 'promote' | 'calendar' | 'connections';
type PromoteStage = 'select' | 'ideas' | 'final';

interface PostIdea {
  platform: string;
  post_text: string;
  hashtags: string;
  visual_suggestion: string;
}

interface GeneratedPost {
  platform: string;
  post_text: string;
  hashtags: string;
  visual_suggestion: string;
  generated_image?: string;
}

const socialPlatforms = ['Facebook', 'Instagram', 'X (Twitter)', 'LinkedIn', 'TikTok', 'Google Business Profile', 'WhatsApp', 'Telegram'];

const platformDetails: { [key: string]: { aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9", postUrl: string } } = {
  'Facebook': { aspectRatio: '1:1', postUrl: 'https://www.facebook.com/sharer/sharer.php?u=' },
  'Instagram': { aspectRatio: '1:1', postUrl: 'https://www.instagram.com' },
  'X (Twitter)': { aspectRatio: '16:9', postUrl: 'https://twitter.com/intent/tweet?text=' },
  'LinkedIn': { aspectRatio: '16:9', postUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=' },
  'TikTok': { aspectRatio: '9:16', postUrl: 'https://www.tiktok.com/upload' },
  'Google Business Profile': { aspectRatio: '4:3', postUrl: 'https://business.google.com/posts' },
  'WhatsApp': { aspectRatio: '1:1', postUrl: 'https://wa.me/?text=' },
  'Telegram': { aspectRatio: '1:1', postUrl: 'https://t.me/share/url?url=&text=' },
};

const platformNameToPlatformId: { [key: string]: string } = {
  'Facebook': 'facebook',
  'Instagram': 'instagram',
  'X (Twitter)': 'twitter',
  'LinkedIn': 'linkedin',
  'TikTok': 'tiktok',
  'Google Business Profile': 'google_business',
  'WhatsApp': 'whatsapp',
  'Telegram': 'telegram',
};

const SERVICE_IMAGE_STYLES = [
  { name: 'Professional Banner', prompt: 'Professional service banner. Clean, modern business aesthetic with brand colors. Premium quality. Studio lighting. Space for text overlay. Commercial advertising quality.' },
  { name: 'Before & After', prompt: 'Before and after split-screen comparison showing the transformation. Left side shows the problem/before state, right side shows the professional result. Clean dividing line in the center. Professional photography.' },
  { name: 'Team at Work', prompt: 'Professional team providing the service. Natural setting, authentic interaction with client. Warm lighting, friendly atmosphere. Shows expertise and professionalism. Documentary style.' },
  { name: 'Tools & Equipment', prompt: 'Professional service tools and equipment arranged aesthetically. Flat lay or organized workspace. Clean background. Shows professionalism and preparedness. Commercial product photography.' },
  { name: 'Happy Customer', prompt: 'Satisfied customer enjoying the results of the service. Natural, authentic smile. Professional environment. Warm, inviting atmosphere. Lifestyle photography.' },
  { name: 'Social Media Ready', prompt: 'Eye-catching social media promotional image. Bold, modern design with vibrant brand colors. Clear visual hierarchy. Mobile-optimized. Instagram-ready. High engagement design.' },
];

export const JetServices: React.FC<JetServicesProps> = ({ tool, profileData, setActiveTool }) => {
  const { industry: businessType, id: businessId } = profileData.business;
  const businessName = profileData.business.business_name;
  const brandColors = profileData.brandDnaProfile?.visual_identity?.primary_colors || [];
  const brandTone = profileData.brandDnaProfile?.brand_tone?.primary_tone || 'Professional';
  const userId = profileData.user.id;

  const [viewMode, setViewMode] = useState<ViewMode>('services');
  const [showHowTo, setShowHowTo] = useState(true);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingService, setEditingService] = useState<ServiceListing | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Other');
  const [formPrice, setFormPrice] = useState('');
  const [formPriceType, setFormPriceType] = useState<ServiceListing['price_type']>('fixed');
  const [formDuration, setFormDuration] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/png');
  const [selectedStyle, setSelectedStyle] = useState<typeof SERVICE_IMAGE_STYLES[0] | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">('1:1');
  const [savingImage, setSavingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const CREDIT_LIMIT = 60;
  const [promoteStage, setPromoteStage] = useState<PromoteStage>('select');
  const [serviceToPromote, setServiceToPromote] = useState<ServiceListing | null>(null);
  const [promoteTopic, setPromoteTopic] = useState('');
  const [promoteTone, setPromoteTone] = useState('Professional');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Facebook']);
  const [postIdeas, setPostIdeas] = useState<PostIdea[]>([]);
  const [finalPost, setFinalPost] = useState<GeneratedPost | null>(null);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteImageLoading, setPromoteImageLoading] = useState(false);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [scheduling, setScheduling] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<ServiceCalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventServiceId, setEventServiceId] = useState('');
  const [eventRecurring, setEventRecurring] = useState(false);
  const [eventRecurrencePattern, setEventRecurrencePattern] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [eventSaving, setEventSaving] = useState(false);

  useEffect(() => {
    if (userId && businessId) {
      loadServices();
      loadConnections();
      loadCredits();
    }
  }, [userId, businessId]);

  useEffect(() => {
    if (viewMode === 'calendar' && userId && businessId) {
      loadCalendarEvents();
    }
  }, [viewMode, userId, businessId]);

  const loadServices = async () => {
    try {
      setServicesLoading(true);
      const data = await getServiceListings(userId, businessId);
      setServices(data);
    } catch (err) {
      console.error('[JetServices] Error loading services:', err);
    } finally {
      setServicesLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      setConnectionsLoading(true);
      const data = await getSocialConnections(userId);
      setConnections(data);
    } catch (err) {
      console.error('[JetServices] Error loading connections:', err);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const loadCredits = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !userId) return;
      const monthYear = new Date().toISOString().slice(0, 7);
      const { data } = await supabase.from('user_credits').select('credits_used').eq('user_id', userId).eq('month_year', monthYear).single();
      if (data) setCreditsUsed(data.credits_used);
    } catch (err) {
      console.error('[JetServices] Error loading credits:', err);
    }
  };

  const incrementCredits = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !userId) return;
      const monthYear = new Date().toISOString().slice(0, 7);
      const { data: existing } = await supabase.from('user_credits').select('*').eq('user_id', userId).eq('month_year', monthYear).single();
      if (existing) {
        await supabase.from('user_credits').update({ credits_used: existing.credits_used + 1 }).eq('id', existing.id);
        setCreditsUsed(existing.credits_used + 1);
      } else {
        await supabase.from('user_credits').insert({ user_id: userId, month_year: monthYear, credits_used: 1, credits_limit: CREDIT_LIMIT });
        setCreditsUsed(1);
      }
    } catch (err) {
      console.error('[JetServices] Error incrementing credits:', err);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      setCalendarLoading(true);
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);
      const startStr = today.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      const events = await getCalendarEvents(userId, businessId, startStr, endStr);
      setCalendarEvents(events);
    } catch (err) {
      console.error('[JetServices] Error loading calendar events:', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError('Service title is required');
      return;
    }
    setError('');
    setFormSaving(true);
    try {
      const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
      if (editingService) {
        await updateServiceListing(editingService.id, { title: formTitle, description: formDescription, category: formCategory, price: formPrice, price_type: formPriceType, duration: formDuration, tags });
        showSuccess('Service updated successfully!');
      } else {
        await createServiceListing(userId, businessId, { title: formTitle, description: formDescription, category: formCategory, price: formPrice, price_type: formPriceType, duration: formDuration, is_active: true, tags });
        showSuccess('Service created successfully!');
      }
      resetForm();
      await loadServices();
      setViewMode('services');
    } catch (err: any) {
      setError(err.message || 'Failed to save service');
    } finally {
      setFormSaving(false);
    }
  };

  const handleEditService = (service: ServiceListing) => {
    setEditingService(service);
    setFormTitle(service.title);
    setFormDescription(service.description);
    setFormCategory(service.category);
    setFormPrice(service.price || '');
    setFormPriceType(service.price_type);
    setFormDuration(service.duration || '');
    setFormTags((service.tags || []).join(', '));
    setViewMode('create');
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteServiceListing(serviceId);
      showSuccess('Service deleted.');
      await loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to delete service');
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Other');
    setFormPrice('');
    setFormPriceType('fixed');
    setFormDuration('');
    setFormTags('');
  };

  const handleGenerateDescription = async () => {
    if (!formTitle.trim()) {
      setError('Please enter a service title first so AI knows what to write about.');
      return;
    }
    setGeneratingDescription(true);
    setError('');
    try {
      const description = await aiGenerateServiceDescription(formTitle, businessName, businessType, formCategory, formPrice, formPriceType, formDuration, brandTone);
      setFormDescription(description);
    } catch (err: any) {
      setError(err.message || 'Failed to generate description. Please try again.');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!formTitle.trim()) {
      setError('Please enter a service title first so AI can suggest relevant tags.');
      return;
    }
    setGeneratingTags(true);
    setError('');
    try {
      const tags = await aiGenerateServiceTags(formTitle, formDescription, businessName, businessType, formCategory);
      setFormTags(tags.join(', '));
    } catch (err: any) {
      setError(err.message || 'Failed to generate tags. Please try again.');
    } finally {
      setGeneratingTags(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setUploadedImage(result);
      setUploadedMimeType(file.type || 'image/png');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateServiceImage = async () => {
    if (!selectedService) {
      setError('Please select a service first');
      return;
    }
    if (creditsUsed >= CREDIT_LIMIT) {
      setError('Monthly image generation limit reached (60/60). Resets on the 1st.');
      return;
    }
    const stylePrompt = selectedStyle?.prompt || '';
    const userPrompt = customPrompt.trim();
    const serviceContext = `Service: "${selectedService.title}" - ${selectedService.description}. Business: "${businessName}" (${businessType}).`;
    const brandContext = brandColors.length > 0 ? `Brand colors: ${brandColors.join(', ')}. Brand tone: ${brandTone}.` : '';
    const fullPrompt = `${serviceContext} ${brandContext} ${stylePrompt} ${userPrompt}`.trim();
    setGeneratingImage(true);
    setError('');
    setGeneratedImage(null);
    try {
      let inputImage: { base64: string; mimeType: string } | undefined;
      if (uploadedImage) {
        const base64Data = uploadedImage.split(',')[1];
        inputImage = { base64: base64Data, mimeType: uploadedMimeType };
      }
      const base64Result = await generateImage(fullPrompt, imageSize, aspectRatio, inputImage);
      const imageUrl = `data:image/png;base64,${base64Result}`;
      setGeneratedImage(imageUrl);
      await incrementCredits();
    } catch (err: any) {
      setError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleEnhanceUploadedImage = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }
    if (creditsUsed >= CREDIT_LIMIT) {
      setError('Monthly image generation limit reached (60/60).');
      return;
    }
    const serviceName = selectedService?.title || 'professional service';
    const enhancePrompt = `Enhance this image for a professional service business. Make it look polished, high-quality, and commercially viable. Service: "${serviceName}". Business: "${businessName}". Improve lighting, color balance, sharpness, and overall professional quality. Keep the core subject matter intact but elevate it to commercial-grade photography. ${brandColors.length > 0 ? `Brand colors: ${brandColors.join(', ')}.` : ''}`;
    setGeneratingImage(true);
    setError('');
    setGeneratedImage(null);
    try {
      const base64Data = uploadedImage.split(',')[1];
      const inputImage = { base64: base64Data, mimeType: uploadedMimeType };
      const base64Result = await generateImage(enhancePrompt, imageSize, aspectRatio, inputImage);
      const imageUrl = `data:image/png;base64,${base64Result}`;
      setGeneratedImage(imageUrl);
      await incrementCredits();
    } catch (err: any) {
      setError(err.message || 'Image enhancement failed. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSaveGeneratedImage = async () => {
    if (!generatedImage || !selectedService) return;
    setSavingImage(true);
    try {
      const position = (selectedService.images?.length || 0) + 1;
      await saveServiceImage(selectedService.id, { image_url: generatedImage, is_ai_generated: true, ai_prompt: selectedStyle?.name || customPrompt || 'AI Enhanced', position });
      showSuccess('Image saved to service!');
      await loadServices();
    } catch (err: any) {
      setError(err.message || 'Failed to save image');
    } finally {
      setSavingImage(false);
    }
  };

  const handleDownloadImage = (imageUrl: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || `service_image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartPromote = (service: ServiceListing) => {
    setServiceToPromote(service);
    setPromoteTopic(`${service.title} - ${service.description?.slice(0, 100) || ''}`);
    setPromoteStage('select');
    setViewMode('promote');
  };

  const handleGeneratePromoteIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteTopic.trim()) {
      setError('Please describe what to promote');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }
    setError('');
    setPromoteLoading(true);
    setPostIdeas([]);
    try {
      const serviceContext = `Service-based business "${businessName}" (${businessType}). Promoting service: "${serviceToPromote?.title}". ${serviceToPromote?.price ? `Price: ${serviceToPromote.price_type === 'hourly' ? '$' + serviceToPromote.price + '/hr' : serviceToPromote.price_type === 'starting_at' ? 'Starting at $' + serviceToPromote.price : serviceToPromote.price_type === 'free' ? 'Free' : '$' + serviceToPromote.price}` : ''}`;
      const topic = `${serviceContext}\n\nPromotion angle: ${promoteTopic}`;
      const result = await generateSocialPosts(businessType, topic, promoteTone, selectedPlatforms, 3);
      const allPosts: PostIdea[] = (result.posts || []).map((post: any) => ({ platform: post.platform, post_text: post.post_text, hashtags: post.hashtags, visual_suggestion: post.visual_suggestion }));
      const seen = new Set<string>();
      const uniqueIdeas: PostIdea[] = [];
      for (const idea of allPosts) {
        const key = idea.post_text.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueIdeas.push(idea);
        }
        if (uniqueIdeas.length >= 3) break;
      }
      setPostIdeas(uniqueIdeas);
      setPromoteStage('ideas');
    } catch (err) {
      setError('Failed to generate ideas. Please try again.');
    } finally {
      setPromoteLoading(false);
    }
  };

  const handleSelectPromoteIdea = async (idea: PostIdea) => {
    setPromoteImageLoading(true);
    setError('');
    try {
      const ar = platformDetails[idea.platform]?.aspectRatio || '1:1';
      let imageUrl = '';
      if (serviceToPromote?.images?.length && serviceToPromote.images.length > 0) {
        const serviceImg = serviceToPromote.images[0];
        const base64Data = serviceImg.image_url.includes(',') ? serviceImg.image_url.split(',')[1] : serviceImg.image_url;
        const platformPrompt = `Transform this service image into an eye-catching ${idea.platform} post for "${serviceToPromote.title}" by "${businessName}". ${idea.visual_suggestion}. Optimized for ${idea.platform}. ${brandColors.length > 0 ? `Brand colors: ${brandColors.join(', ')}.` : ''}`;
        const base64Result = await generateImage(platformPrompt, '1K', ar as any, { base64: base64Data, mimeType: 'image/png' });
        imageUrl = `data:image/png;base64,${base64Result}`;
      } else {
        const base64Result = await generateImage(idea.visual_suggestion, '1K', ar as any);
        imageUrl = `data:image/png;base64,${base64Result}`;
      }
      setFinalPost({ ...idea, generated_image: imageUrl });
      setPromoteStage('final');
    } catch (err: any) {
      setError('Failed to generate image. Please try again.');
    } finally {
      setPromoteImageLoading(false);
    }
  };

  const handleCopyAndPost = (platform: string, text: string, hashtags: string) => {
    const fullText = `${text}\n\n${hashtags}`;
    navigator.clipboard.writeText(fullText.trim());
    showSuccess('Content copied to clipboard!');
    if (platform === 'WhatsApp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText.trim())}`, '_blank', 'noopener,noreferrer');
      return;
    }
    if (platform === 'Telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(fullText.trim())}`, '_blank', 'noopener,noreferrer');
      return;
    }
    const postUrl = platformDetails[platform]?.postUrl;
    if (postUrl && (platform === 'X (Twitter)' || platform === 'Facebook' || platform === 'LinkedIn')) {
      window.open(postUrl + encodeURIComponent(fullText.trim()), '_blank');
    } else if (postUrl) {
      window.open(postUrl, '_blank');
    }
  };

  const handleSchedulePost = () => {
    setScheduledDate(getTomorrowDate());
    setShowScheduleModal(true);
  };

  const confirmSchedulePost = async () => {
    if (!finalPost || !scheduledDate || !userId) {
      setError('Please select a date to schedule the post');
      return;
    }
    const platformId = platformNameToPlatformId[finalPost.platform];
    const platformConnections = connections.filter(c => c.platform === platformId);
    if (platformConnections.length === 0) {
      setError(`Please connect your ${finalPost.platform} account first`);
      setShowScheduleModal(false);
      setViewMode('connections');
      return;
    }
    try {
      setScheduling(true);
      setError('');
      const platformTargets = platformConnections.map(conn => ({ platform: conn.platform, connection_id: conn.id }));
      await createScheduledPost(userId, { post_text: finalPost.post_text, hashtags: finalPost.hashtags, visual_suggestion: finalPost.visual_suggestion, image_url: finalPost.generated_image, scheduled_date: scheduledDate, scheduled_time: scheduledTime, timezone: 'America/New_York', platforms: platformTargets, status: 'scheduled' });
      showSuccess('Post scheduled successfully!');
      setShowScheduleModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScheduling(false);
    }
  };

  const handleDownloadPromoteText = () => {
    if (!finalPost) return;
    const content = `${finalPost.platform} Post - Service Promotion\n\n${finalPost.post_text}\n\n${finalPost.hashtags}\n\n---\nService: ${serviceToPromote?.title}\nGenerated by JetSuite - ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${finalPost.platform}_Service_Post_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Post text downloaded!');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) {
      setError('Event title and date are required');
      return;
    }
    setError('');
    setEventSaving(true);
    try {
      await createCalendarEvent(userId, businessId, { service_id: eventServiceId || undefined, title: eventTitle, description: eventDescription, event_date: eventDate, start_time: eventStartTime, end_time: eventEndTime, is_recurring: eventRecurring, recurrence_pattern: eventRecurring ? eventRecurrencePattern : undefined, status: 'active' });
      showSuccess('Event created!');
      resetEventForm();
      await loadCalendarEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setEventSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await deleteCalendarEvent(eventId);
      showSuccess('Event deleted.');
      await loadCalendarEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetEventForm = () => {
    setShowEventForm(false);
    setEventTitle('');
    setEventDescription('');
    setEventDate('');
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setEventServiceId('');
    setEventRecurring(false);
  };

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div>
      {successMsg && <div className="bg-green-100 text-green-800 text-sm font-semibold p-3 rounded-lg text-center shadow mb-4">{successMsg}</div>}
      {error && <div className="bg-red-100 text-red-800 text-sm font-semibold p-3 rounded-lg text-center shadow mb-4">{error}<button onClick={() => setError('')} className="ml-4 text-red-600 font-bold hover:underline">Dismiss</button></div>}

      <div className="bg-brand-card p-2 rounded-xl shadow-lg mb-6">
        <div className="flex flex-wrap gap-2">
          {(['services', 'create', 'promote', 'calendar', 'connections'] as ViewMode[]).map((mode) => {
            const labels: Record<ViewMode, string> = {
              services: 'My Services',
              create: editingService ? 'Edit Service' : 'Add Service',
              promote: 'Promote',
              calendar: 'Calendar',
              connections: `Connections ${connections.length > 0 ? `(${connections.length})` : ''}`,
            };
            return (
              <button
                key={mode}
                onClick={() => {
                  if (mode === 'create' && viewMode !== 'create') resetForm();
                  if (mode === 'promote' && viewMode !== 'promote') {
                    setPromoteStage('select');
                    setServiceToPromote(null);
                    setFinalPost(null);
                    setPostIdeas([]);
                  }
                  setViewMode(mode);
                  setError('');
                }}
                className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-semibold transition text-sm ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white'
                    : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-light'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === 'services' && (
        <>
          {showHowTo && (
            <HowToUse toolName="JetServices" onDismiss={() => setShowHowTo(false)}>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Add your services with pricing, duration, and categories.</li>
                <li>Upload images or generate professional visuals with AI.</li>
                <li>Promote services on social media with AI-generated posts.</li>
                <li>Schedule service appointments and events on the calendar.</li>
                <li>Connect social accounts to post and schedule directly.</li>
              </ul>
            </HowToUse>
          )}

          {servicesLoading ? (
            <Loader />
          ) : services.length === 0 ? (
            <div className="bg-brand-card p-8 rounded-xl shadow-lg text-center">
              <div className="text-6xl mb-4">🛠️</div>
              <h3 className="text-2xl font-bold text-brand-text mb-2">No Services Yet</h3>
              <p className="text-brand-text-muted mb-6 max-w-md mx-auto">Add your first service to start generating professional images and promoting it on social media.</p>
              <button onClick={() => { resetForm(); setViewMode('create'); }} className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">+ Add Your First Service</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-text">{services.length} Service{services.length !== 1 ? 's' : ''}</h2>
                <button onClick={() => { resetForm(); setViewMode('create'); }} className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition">+ Add Service</button>
              </div>
              {services.map((service) => (
                <div key={service.id} className="bg-brand-card p-6 rounded-xl shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-brand-text">{service.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{service.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                      {service.description && <p className="text-brand-text-muted text-sm mb-2">{service.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-brand-text-muted">
                        <span className="bg-brand-light px-2 py-1 rounded">{service.category}</span>
                        {service.price && <span className="font-semibold text-accent-purple">{service.price_type === 'free' ? 'Free' : service.price_type === 'custom' ? 'Custom Quote' : `$${service.price}${service.price_type === 'hourly' ? '/hr' : service.price_type === 'starting_at' ? '+' : ''}`}</span>}
                        {service.duration && <span>{service.duration}</span>}
                      </div>
                    </div>
                    {service.images?.length > 0 && (
                      <div className="flex gap-2 ml-4">
                        {service.images.slice(0, 3).map((img, i) => <img key={i} src={img.image_url} alt={`${service.title} image ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-brand-border" />)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-brand-border">
                    <button onClick={() => { setSelectedService(service); setGeneratedImage(null); setUploadedImage(null); setSelectedStyle(null); setCustomPrompt(''); setViewMode('create'); setEditingService(null); setTimeout(() => { document.getElementById('image-gen-section')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }} className="text-sm font-semibold text-accent-blue hover:text-accent-blue/80 transition">Generate Images</button>
                    <button onClick={() => handleStartPromote(service)} className="text-sm font-semibold text-accent-purple hover:text-accent-purple/80 transition">Promote on Social</button>
                    <button onClick={() => handleEditService(service)} className="text-sm font-semibold text-brand-text-muted hover:text-brand-text transition">Edit</button>
                    <button onClick={() => handleDeleteService(service.id)} className="text-sm font-semibold text-red-500 hover:text-red-700 transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === 'create' && (
        <div className="space-y-6">
          <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-brand-text mb-6">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Service Title *</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g., Deep Tissue Massage" className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Category</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent transition">
                    {SERVICE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-brand-text">Description</label>
                  <button type="button" onClick={handleGenerateDescription} disabled={generatingDescription || !formTitle.trim()} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-blue to-accent-purple text-white hover:shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {generatingDescription ? 'Generating...' : 'AI Write'}
                  </button>
                </div>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe what this service includes..." rows={3} className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Price Type</label>
                  <select value={formPriceType} onChange={(e) => setFormPriceType(e.target.value as ServiceListing['price_type'])} className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent transition">
                    {PRICE_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                  </select>
                </div>
                {formPriceType !== 'free' && formPriceType !== 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-brand-text mb-1">Price ($)</label>
                    <input type="text" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="99.00" className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1">Duration</label>
                  <input type="text" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="e.g., 60 minutes" className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formSaving} className="bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg">{formSaving ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}</button>
                <button type="button" onClick={() => { resetForm(); setViewMode('services'); }} className="bg-brand-light text-brand-text font-semibold py-3 px-6 rounded-lg hover:bg-brand-light/80 transition">Cancel</button>
              </div>
            </form>
          </div>

          <div id="image-gen-section" className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-brand-text mb-6">Service Image Studio</h2>
            {selectedService && <p className="mb-4 text-sm text-brand-text">Generating for: <span className="font-bold text-accent-purple">{selectedService.title}</span></p>}
            <div className="mb-6">
              <label className="block text-sm font-medium text-brand-text mb-2">Upload an Image (optional)</label>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-brand-border rounded-lg p-8 text-center cursor-pointer hover:border-accent-purple transition-all">
                {uploadedImage ? <img src={uploadedImage} alt="Uploaded" className="max-h-48 mx-auto rounded-lg shadow" /> : <p className="text-brand-text font-semibold">Click to upload an image</p>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <button onClick={handleGenerateServiceImage} disabled={generatingImage || !selectedService || creditsUsed >= CREDIT_LIMIT} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg">{generatingImage ? 'Generating...' : 'Generate Service Image'}</button>
            {generatedImage && (
              <div className="mt-6 space-y-4">
                <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-lg shadow-lg" />
                <button onClick={handleSaveGeneratedImage} disabled={savingImage} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">Save to Service</button>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'promote' && (
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-brand-text mb-6">Promote Service</h2>
          {promoteStage === 'select' && (
            <form onSubmit={handleGeneratePromoteIdeas} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Service to Promote</label>
                <select value={serviceToPromote?.id || ''} onChange={(e) => setServiceToPromote(services.find(s => s.id === e.target.value) || null)} className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text">
                  <option value="">-- Choose a service --</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Platforms</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {socialPlatforms.map(platform => {
                    const platformId = platformNameToPlatformId[platform];
                    const isConnected = connections.some(c => c.platform === platformId && c.is_active);
                    return (
                      <label key={platform} className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition ${selectedPlatforms.includes(platform) ? 'bg-accent-purple/10 border-accent-purple' : 'bg-brand-light border-brand-border'} border`}>
                        <input type="checkbox" checked={selectedPlatforms.includes(platform)} onChange={() => handlePlatformChange(platform)} className="form-checkbox h-4 w-4 text-accent-purple rounded" />
                        <div className="flex flex-col">
                          <span className="text-brand-text text-sm font-medium">{platform}</span>
                          {isConnected && <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5"><CheckCircleIcon className="w-3 h-3" /> Connected</span>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <button type="submit" disabled={promoteLoading || !serviceToPromote} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">{promoteLoading ? 'Generating...' : 'Generate Post Ideas'}</button>
            </form>
          )}
          {promoteStage === 'ideas' && postIdeas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {postIdeas.map((idea, index) => (
                <div key={index} className="bg-brand-card p-6 rounded-xl shadow-lg border-2 border-transparent hover:border-accent-purple transition-all">
                  <h3 className="text-xl font-bold text-accent-purple mb-4">{idea.platform} Idea</h3>
                  <p className="text-brand-text-muted text-sm mb-4">{idea.post_text}</p>
                  <button onClick={() => handleSelectPromoteIdea(idea)} disabled={promoteImageLoading} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">Select This One</button>
                </div>
              ))}
            </div>
          )}
          {promoteStage === 'final' && finalPost && (
            <div className="space-y-6">
              <img src={finalPost.generated_image} alt="Final" className="w-full h-auto rounded-lg shadow-lg" />
              <div className="flex gap-3">
                <button onClick={handleSchedulePost} className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-bold py-3 px-4 rounded-lg transition">Schedule Post</button>
                <button onClick={() => handleCopyAndPost(finalPost.platform, finalPost.post_text, finalPost.hashtags)} className="flex-1 bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition">Copy & Post Now</button>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-brand-card p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-brand-text mb-6">Service Calendar</h2>
            {calendarLoading ? <Loader /> : <div className="space-y-3">{calendarEvents.map(event => <div key={event.id} className="p-4 bg-brand-light border border-brand-border rounded-lg flex justify-between items-center"><div><h4 className="font-bold text-brand-text">{event.title}</h4><p className="text-xs text-brand-text-muted">{event.event_date} at {event.start_time}</p></div><button onClick={() => handleDeleteEvent(event.id)} className="text-red-500 text-sm font-semibold">Delete</button></div>)}</div>}
          </div>
          {userId && <SevenDayPlanner userId={userId} connections={connections} connectionsLoading={connectionsLoading} onNeedConnections={() => setViewMode('connections')} />}
        </div>
      )}

      {viewMode === 'connections' && userId && <SocialConnectionsManager userId={userId} onConnectionsChange={loadConnections} />}

      {showScheduleModal && finalPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-brand-text mb-4">Schedule {finalPost.platform} Post</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">Date</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={getMinDate()} max={getMaxDate(7)} className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">Time</label>
              <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text" />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 bg-brand-light text-brand-text px-4 py-2 rounded-lg font-semibold" disabled={scheduling}>Cancel</button>
              <button onClick={confirmSchedulePost} disabled={scheduling || !scheduledDate} className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2 rounded-lg font-semibold">{scheduling ? 'Scheduling...' : 'Confirm Schedule'}</button>
            </div>
          </div>
        </div>
      )}

      {finalPost && <SharePostModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} postText={finalPost.post_text} hashtags={finalPost.hashtags} platform={finalPost.platform} imageUrl={finalPost.generated_image} />}
    </div>
  );
};