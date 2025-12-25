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
// =====================================================
// COMPLETE SUPPORT TYPES - ADD TO YOUR types.ts
// Copy and paste ALL of this at the bottom of types.ts
// =====================================================

// ====================
// BASIC ENUMS & TYPES
// ====================

export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'bug_report' | 'account' | 'general';
export type MessageSenderType = 'user' | 'agent' | 'bot';
export type MessageType = 'text' | 'system' | 'note';

// ====================
// CORE DATA MODELS
// ====================

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  business_name?: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  first_response_at?: string;
  satisfaction_rating?: number;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: MessageSenderType;
  sender_id?: string;
  sender_name?: string;
  message: string;
  message_type: MessageType;
  metadata?: Record<string, any>;
  is_internal?: boolean;
  read_at?: string;
  created_at: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords?: string[];
  is_public: boolean;
  view_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface CannedResponse {
  id: string;
  category: string;
  shortcut: string;
  title: string;
  content: string;
  created_at: string;
}

export interface ChatbotConversation {
  id: string;
  user_id: string;
  session_id: string;
  messages: any[];
  context?: Record<string, any>;
  created_at: string;
  last_activity_at: string;
  escalated_to_ticket?: string;
}

// ====================
// CHATBOT TYPES
// ====================

export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatbotContext {
  user_email?: string;
  business_name?: string;
  current_page?: string;
  subscription_status?: string;
}

export interface ChatbotResponse {
  message: string;
  suggestedActions?: SuggestedAction[];
  suggestedArticles?: KnowledgeBaseArticle[];
  requiresEscalation?: boolean;
  ticketCreated?: SupportTicket;
}

export interface SuggestedAction {
  id: string;
  label: string;
  action: 'search_kb' | 'create_ticket' | 'open_article' | 'contact_support';
  metadata?: Record<string, any>;
}

// ====================
// REQUEST TYPES
// ====================

export interface CreateTicketData {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  business_name?: string;
  metadata?: Record<string, any>;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  business_name?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTicketRequest {
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_to?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  satisfaction_rating?: number;
}

export interface CreateMessageData {
  ticket_id: string;
  message: string;
  sender_type: MessageSenderType;
  message_type?: MessageType;
  is_internal?: boolean;
}

export interface CreateMessageRequest {
  ticket_id: string;
  message: string;
  sender_type: MessageSenderType;
  message_type?: MessageType;
  is_internal?: boolean;
}

export interface SearchKnowledgeBaseRequest {
  query: string;
  category?: string;
  limit?: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  user_id?: string;
  search?: string;
}

// ====================
// RESPONSE TYPES
// ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
