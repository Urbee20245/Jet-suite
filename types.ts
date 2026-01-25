import type React from 'react';

export interface Tool {
  id: string;
  name:string;
  description?: string; // Optional to support lite tool objects
  icon?: React.FC<React.SVGProps<SVGSVGElement>>; // Optional to support lite tool objects
  category?: string; // Added to support routing logic
  isComingSoon?: boolean;
}

export interface ToolCategory {
  name: string;
  description: string;
  emoji: string;
  tools: Tool[];
}

export interface GrowthPlanTask {
  id: string;
  title: string;
  description: string; // "How to do it"
  whyItMatters: string; // "Why this matters"
  effort: 'Low' | 'Medium' | 'High';
  priority: 'High' | 'Medium' | 'Low';
  sourceModule: string;
  status: 'to_do' | 'in_progress' | 'completed';
  createdAt: string;
  completionDate?: string;
}

export interface AuditIssue {
  id: string;
  issue: string;
  whyItMatters: string;
  fix: string;
  priority: 'High' | 'Medium' | 'Low';
  task: {
    title: string;
    description: string;
    effort: 'Low' | 'Medium' | 'High';
    priority: 'High' | 'Medium' | 'Low';
    sourceModule: string;
  };
}

export interface AuditReport {
  businessName: string;
  businessAddress: string;
  timestamp: string;
  issues: AuditIssue[];
  weeklyActions: Omit<GrowthPlanTask, 'id' | 'status' | 'createdAt' | 'completionDate'>[];
}

// New type for JetViz live data
export interface PageSpeedMetrics {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
}
export interface LiveWebsiteAnalysis extends AuditReport {
    mobile: PageSpeedMetrics;
    desktop: PageSpeedMetrics;
}


export interface BusinessSearchResult {
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  category: string;
  mapsUrl?: string;
}

export type ConfirmedBusiness = BusinessSearchResult;

// Shared Structures
export interface BusinessDna {
  logo: string; // base64
  colors: string[]; // hex codes
  fonts: string;
  style: string;
  faviconUrl?: string; // NEW: Favicon URL
}

// Profile Data Structures
export interface UserProfile {
  id: string; // Supabase UUID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Manager' | 'Marketing' | 'Marketing Director' | '';
}

// UPDATED BusinessProfile to match database schema
export interface BusinessProfile {
  id: string; // Business UUID
  user_id: string;
  business_name: string;
  business_website: string;
  business_description: string;
  industry: string;
  city: string;
  state: string;
  location: string; // Combined field for display
  service_area: string;
  phone: string;
  email: string;
  dna: BusinessDna; // Simple DNA structure (from DB JSONB)
  isDnaApproved: boolean;
  dnaLastUpdatedAt?: string;
  is_primary: boolean;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  
  // Database snake_case fields (for direct mapping from DB query result)
  is_dna_approved: boolean;
  dna_last_updated_at?: string;

  // ADDED JSONB fields from DB (for direct mapping)
  google_business_profile: GoogleBusinessProfile | null;
  brand_dna_profile: BrandDnaProfile | null;
  
  // Audits storage for analysis results
  audits?: {
    [key: string]: {
      report: AuditReport | LiveWebsiteAnalysis;
      timestamp: string;
    };
  };
}

export interface GoogleBusinessProfile {
  profileName: string;
  mapsUrl: string;
  status: GbpStatus;
  placeId?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
}

export type GbpStatus = 'Not Created' | 'Not Verified' | 'Verified';

export interface BusinessReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  isPositive: boolean;
}

// Brand DNA Profile
export interface BrandTone {
  primary_tone: string;
  secondary_modifiers: string[];
  writing_style: string;
  emotional_positioning: string[];
}

export interface VisualIdentity {
  primary_colors: string[];
  secondary_colors: string[];
  color_mood: string;
  typography_style: string;
  layout_style: string;
}

export interface LogoProfile {
  has_logo: boolean;
  logo_style: string;
  dominant_colors: string[];
  is_reusable: boolean;
}

export interface BrandPositioning {
  value_proposition: string;
  primary_customer_intent: string;
  local_vs_national: string;
  differentiation_signals: string[];
}

export interface AudienceProfile {
    target_audience: string;
}

export interface IndustryContext {
  category_confirmation: string;
  service_focus_areas: string[];
  local_relevance_signals: string[];
  professionalism_cues: string[];
}

export interface BrandDnaProfile {
  brand_tone: BrandTone;
  visual_identity: VisualIdentity;
  logo_profile: LogoProfile;
  brand_positioning: BrandPositioning;
  audience_profile: AudienceProfile;
  industry_context: IndustryContext;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  role: 'Owner' | 'Team Member';
  status: 'Active' | 'Pending Invite';
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface ProfileData {
  user: UserProfile;
  business: BusinessProfile;
  googleBusiness: GoogleBusinessProfile; // Mapped from business.google_business_profile
  isProfileActive: boolean;
  brandDnaProfile?: BrandDnaProfile; // Mapped from business.brand_dna_profile
  jetbizAnalysis?: AuditReport | null;
  jetvizAnalysis?: LiveWebsiteAnalysis | null;
}

// JetCreate Types
export interface CampaignIdea {
  id: string;
  name: string;
  description: string;
  channels: string[];
  imageUrl?: string; // Base64 or URL for campaign preview image
}

export interface SocialPostAsset {
  id?: string;
  platform: string;
  copy: string;
  visual_suggestion: string;
  imageUrl?: string; // Generated image for this post
}

export interface AdCopyAsset {
  id?: string;
  headline: string;
  description: string;
  cta: string;
  imageUrl?: string; // Generated image for this ad
}

export interface CreativeAssets {
  social_posts: SocialPostAsset[];
  ad_copy: AdCopyAsset[];
}

// JetKeywords Types
export interface KeywordData {
    keyword: string;
    trendScore: number; // 0-100
    trendDirection: 'Rising' | 'Stable' | 'Falling';
    interestLevel: 'High' | 'Medium' | 'Low';
    topRegion: string;
    relatedSearches: string[];
}

export interface KeywordSearchResult {
  keyword: string;
  monthly_volume: string;
  difficulty: string;
}

export interface KeywordAnalysisResult {
    primary_keywords?: KeywordSearchResult[];
    long_tail_keywords?: KeywordSearchResult[];
    question_keywords?: KeywordSearchResult[];
    local_modifier_keywords?: KeywordSearchResult[];
}


export interface SavedKeyword extends KeywordData {
    id: string;
    savedAt: string;
}


export type ReadinessState = 'Setup Incomplete' | 'Foundation Weak' | 'Foundation Ready';

// Analyzer Service Types
export interface AnalysisRequest {
  websiteUrl: string;
  businessName?: string;
  industry?: string;
}

export interface AnalysisRecommendation {
  category: string;
  priority: string;
  issue: string;
  fix: string;
}

export interface AnalysisResult {
  websiteUrl: string;
  overallScore: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    score: number;
  };
  mobileScore: {
    touchTargets: boolean;
    viewportScaling: boolean;
    textReadability: boolean;
    score: number;
  };
  seoStructure: {
    hasH1: boolean;
    metaDescription: boolean;
    titleTag: boolean;
    schemaMarkup: boolean;
    altTags: number;
    score: number;
  };
  localRelevance: {
    napConsistency: boolean;
    googleMyBusiness: boolean;
    localKeywords: number;
    score: number;
  };
  keywordGap: {
    competitorKeywords: string[];
    missingKeywords: string[];
    score: number;
  };
  recommendations: Array<{
    category: string;
    priority: string;
    issue: string;
    fix: string;
  }>;
}

// Social Planner Types for JetSocial
export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'google_business';

export type PostStatus = 'scheduled' | 'posting' | 'posted' | 'failed' | 'draft' | 'cancelled';

export interface SocialConnection {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  platform_user_id?: string;
  platform_username?: string;
  platform_page_id?: string;
  is_active: boolean;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformTarget {
  platform: SocialPlatform;
  connection_id: string;
}

export interface PostResult {
  post_id?: string;
  url?: string;
  posted_at?: string;
  error?: string;
}

export interface ScheduledPost {
  id: string;
  user_id: string;
  post_text: string;
  hashtags?: string;
  visual_suggestion?: string;
  image_url?: string;
  scheduled_date: string; // ISO date string
  scheduled_time?: string; // HH:MM format
  timezone: string;
  platforms: PlatformTarget[];
  status: PostStatus;
  post_results?: Record<SocialPlatform, PostResult>;
  error_message?: string;
  created_at: string;
  updated_at: string;
  posted_at?: string;
}

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  isToday: boolean;
  posts: ScheduledPost[];
}

// New type for YouTube Thumbnail generation
export interface YoutubeThumbnailRequest {
  videoTitle: string;
  videoTopic: string;
  businessName: string;
  brandTone: string;
  brandColors: string[];
  targetEmotion: string;
}