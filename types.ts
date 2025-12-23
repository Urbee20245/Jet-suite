import type React from 'react';

export interface Tool {
  id: string;
  name:string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
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
}

export type ConfirmedBusiness = BusinessSearchResult;

// Shared Structures
export interface BusinessDna {
  logo: string; // base64
  colors: string[]; // hex codes
  fonts: string;
  style: string;
}

// Profile Data Structures
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Manager' | 'Marketing' | 'Marketing Director' | '';
}

export interface BusinessProfile {
  name: string;
  category: string;
  description: string;
  websiteUrl: string;
  location: string;
  serviceArea: string;
  phone: string;
  email: string;
  dna: BusinessDna;
  isDnaApproved: boolean;
  dnaLastUpdatedAt?: string;
}

export type GbpStatus = 'Not Created' | 'Not Verified' | 'Verified';

export interface GoogleBusinessProfile {
  profileName: string;
  mapsUrl: string;
  status: GbpStatus;
  placeId?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
}

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

export interface ProfileData {
  user: UserProfile;
  business: BusinessProfile;
  googleBusiness: GoogleBusinessProfile;
  isProfileActive: boolean;
  brandDnaProfile?: BrandDnaProfile;
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