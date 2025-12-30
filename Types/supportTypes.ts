// =====================================================
// JETSUITE SUPPORT SYSTEM TYPES
// =====================================================

export type TicketCategory = 
  | 'billing'
  | 'technical'
  | 'feature_request'
  | 'bug_report'
  | 'account'
  | 'general';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'resolved'
  | 'closed';

export type TicketSource = 'chatbot' | 'manual' | 'email' | 'auto';

export type MessageSenderType = 'user' | 'agent' | 'bot' | 'system';

export type MessageType = 'text' | 'image' | 'file' | 'system_note';

// =====================================================
// SUPPORT TICKET INTERFACES
// =====================================================

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  business_name?: string;
  
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  
  assigned_to?: string;
  assigned_at?: string;
  
  source: TicketSource;
  satisfaction_rating?: number; // 1-5
  satisfaction_comment?: string;
  
  tags?: string[];
  
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  
  first_response_at?: string;
  last_response_at?: string;
}

export interface CreateTicketRequest {
  subject: string;
  category: TicketCategory;
  priority?: TicketPriority;
  description: string;
  business_name?: string;
  source?: TicketSource;
  tags?: string[];
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string;
  tags?: string[];
  satisfaction_rating?: number;
  satisfaction_comment?: string;
}

// =====================================================
// SUPPORT MESSAGE INTERFACES
// =====================================================

export interface SupportMessage {
  id: string;
  ticket_id: string;
  
  sender_type: MessageSenderType;
  sender_id?: string;
  sender_name?: string;
  
  message: string;
  message_type: MessageType;
  
  attachments?: MessageAttachment[];
  
  is_ai_generated: boolean;
  ai_confidence?: number;
  
  read_by_user: boolean;
  read_by_agent: boolean;
  read_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface CreateMessageRequest {
  ticket_id: string;
  message: string;
  sender_type: MessageSenderType;
  message_type?: MessageType;
  attachments?: MessageAttachment[];
  is_ai_generated?: boolean;
  ai_confidence?: number;
}

// =====================================================
// CHATBOT INTERFACES
// =====================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatbotConversation {
  id: string;
  user_id?: string;
  session_id: string;
  
  messages: ChatMessage[];
  context?: Record<string, any>;
  
  is_resolved: boolean;
  escalated_to_ticket_id?: string;
  
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export interface ChatbotResponse {
  message: string;
  confidence: number; // 0-1
  suggested_actions?: SuggestedAction[];
  should_escalate?: boolean;
  escalation_reason?: string;
  knowledge_base_articles?: KnowledgeBaseArticle[];
}

export interface SuggestedAction {
  type: 'create_ticket' | 'view_article' | 'contact_support' | 'try_again';
  label: string;
  data?: any;
}

// =====================================================
// KNOWLEDGE BASE INTERFACES
// =====================================================

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string[];
  is_public: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchKnowledgeBaseRequest {
  query: string;
  category?: string;
  limit?: number;
}

// =====================================================
// CANNED RESPONSE INTERFACES
// =====================================================

export interface CannedResponse {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  use_count: number;
  last_used_at?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// SUPPORT ANALYTICS INTERFACES
// =====================================================

export interface SupportAnalytics {
  date: string;
  total_tickets: number;
  tickets_opened: number;
  tickets_resolved: number;
  tickets_closed: number;
  avg_first_response_minutes?: number;
  avg_resolution_minutes?: number;
  chatbot_conversations: number;
  chatbot_resolved: number;
  chatbot_escalated: number;
  satisfaction_avg?: number;
}

export interface SupportDashboardStats {
  open_tickets: number;
  in_progress_tickets: number;
  waiting_customer_tickets: number;
  resolved_today: number;
  avg_first_response_time: string;
  avg_resolution_time: string;
  satisfaction_score: number;
  chatbot_deflection_rate: number; // % of conversations resolved without escalation
}

// =====================================================
// UI STATE INTERFACES
// =====================================================

export interface SupportWidgetState {
  isOpen: boolean;
  currentView: 'chat' | 'tickets' | 'create_ticket';
  activeTicketId?: string;
  unreadCount: number;
}

export interface TicketFilters {
  status?: TicketStatus[];
  category?: TicketCategory[];
  priority?: TicketPriority[];
  assigned_to?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// =====================================================
// API RESPONSE INTERFACES
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// =====================================================
// CHATBOT CONTEXT INTERFACES
// =====================================================

export interface ChatbotContext {
  user_id?: string;
  user_email?: string;
  business_name?: string;
  current_page?: string;
  subscription_status?: string;
  recent_tickets?: number;
  conversation_turns?: number;
  mentioned_topics?: string[];
  timezone?: string;
  current_time?: string;
}

// =====================================================
// SUPPORT ADMIN INTERFACES
// =====================================================

export interface SupportAgent {
  id: string;
  name: string;
  email: string;
  is_available: boolean;
  current_ticket_count: number;
  avg_response_time: number;
  satisfaction_rating: number;
}

export interface TicketAssignmentRequest {
  ticket_id: string;
  agent_id: string;
}

// =====================================================
// EXPORT ALL TYPES
// =====================================================

export type {
  // Re-export for convenience
  SupportTicket as Ticket,
  SupportMessage as Message,
  ChatbotConversation as Conversation,
  KnowledgeBaseArticle as Article,
};
