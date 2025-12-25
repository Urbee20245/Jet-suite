// =====================================================
// JETSUITE SUPPORT SERVICE
// Handles all support-related API calls to Supabase
// =====================================================

import { createClient } from '@supabase/supabase-js';
import type {
  SupportTicket,
  SupportMessage,
  CreateTicketRequest,
  UpdateTicketRequest,
  CreateMessageRequest,
  ChatbotConversation,
  KnowledgeBaseArticle,
  SearchKnowledgeBaseRequest,
  CannedResponse,
  TicketFilters,
  ApiResponse,
  PaginatedResponse,
} from '../Types/supportTypes';

// Initialize Supabase client
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabase: any;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('Missing Supabase environment variables. Support service will be disabled.');
    // Mock client to prevent top-level crash
    supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ limit: () => ({}) }) }), insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }), update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }) }),
        rpc: async () => ({ error: null })
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: 'Supabase not configured' })
      },
      channel: () => ({
        on: () => ({
          subscribe: () => ({ unsubscribe: () => {} })
        })
      })
    };
  }
} catch (error) {
  console.error('Failed to initialize Supabase client in supportService:', error);
  // Fallback mock
   supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: () => ({ limit: () => ({}) }) }), insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }), update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }) }),
        rpc: async () => ({ error: null })
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: 'Supabase not configured' })
      },
      channel: () => ({
        on: () => ({
          subscribe: () => ({ unsubscribe: () => {} })
        })
      })
    };
}

// =====================================================
// TICKET MANAGEMENT
// =====================================================

export const supportService = {
  // Create a new support ticket
  async createTicket(request: CreateTicketRequest): Promise<ApiResponse<SupportTicket>> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const ticketData = {
        user_id: userData.user.id,
        user_email: userData.user.email!,
        subject: request.subject,
        category: request.category,
        priority: request.priority || 'medium',
        description: request.description,
        business_name: request.business_name,
        source: request.source || 'manual',
        status: 'open' as const,
        tags: request.tags || [],
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as SupportTicket,
        message: 'Support ticket created successfully'
      };
    } catch (error) {
      console.error('Error in createTicket:', error);
      return {
        success: false,
        error: 'Failed to create support ticket'
      };
    }
  },

  // Get all tickets for current user
  async getUserTickets(filters?: TicketFilters): Promise<PaginatedResponse<SupportTicket>> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        return {
          success: false,
          data: [],
          total: 0,
          page: 1,
          limit: 50,
          has_more: false
        };
      }

      let query = supabase
        .from('support_tickets')
        .select('*', { count: 'exact' })
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status as any[]);
        }
        if (filters.category && filters.category.length > 0) {
          query = query.in('category', filters.category as any[]);
        }
        if (filters.priority && filters.priority.length > 0) {
          query = query.in('priority', filters.priority as any[]);
        }
        if (filters.search) {
          query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching tickets:', error);
        return {
          success: false,
          data: [],
          total: 0,
          page: 1,
          limit: 50,
          has_more: false
        };
      }

      return {
        success: true,
        data: (data as SupportTicket[]) || [],
        total: count || 0,
        page: 1,
        limit: 50,
        has_more: false
      };
    } catch (error) {
      console.error('Error in getUserTickets:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        has_more: false
      };
    }
  },

  // Get all tickets for admin
  async getAllTickets(filters?: TicketFilters): Promise<PaginatedResponse<SupportTicket>> {
    try {
      let query = supabase
        .from('support_tickets')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status as any[]);
        }
        if (filters.category && filters.category.length > 0) {
          query = query.in('category', filters.category as any[]);
        }
        if (filters.priority && filters.priority.length > 0) {
          query = query.in('priority', filters.priority as any[]);
        }
        if (filters.search) {
          query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        if (filters.assigned_to) {
          query = query.eq('assigned_to', filters.assigned_to);
        }
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching all tickets:', error);
        return {
          success: false,
          data: [],
          total: 0,
          page: 1,
          limit: 50,
          has_more: false
        };
      }

      return {
        success: true,
        data: (data as SupportTicket[]) || [],
        total: count || 0,
        page: 1,
        limit: 50,
        has_more: false
      };
    } catch (error) {
      console.error('Error in getAllTickets:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        has_more: false
      };
    }
  },

  // Get a specific ticket by ID
  async getTicketById(ticketId: string): Promise<ApiResponse<SupportTicket>> {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('Error fetching ticket:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as SupportTicket
      };
    } catch (error) {
      console.error('Error in getTicketById:', error);
      return {
        success: false,
        error: 'Failed to fetch ticket'
      };
    }
  },

  // Update a ticket
  async updateTicket(ticketId: string, updates: UpdateTicketRequest): Promise<ApiResponse<SupportTicket>> {
    try {
      const updateData: any = { ...updates };
      
      // Set resolved_at when status changes to resolved
      if (updates.status === 'resolved' && !updateData.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      
      // Set closed_at when status changes to closed
      if (updates.status === 'closed' && !updateData.closed_at) {
        updateData.closed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('Error updating ticket:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as SupportTicket,
        message: 'Ticket updated successfully'
      };
    } catch (error) {
      console.error('Error in updateTicket:', error);
      return {
        success: false,
        error: 'Failed to update ticket'
      };
    }
  },

  // =====================================================
  // MESSAGE MANAGEMENT
  // =====================================================

  // Get messages for a ticket
  async getTicketMessages(ticketId: string): Promise<ApiResponse<SupportMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: (data as SupportMessage[]) || []
      };
    } catch (error) {
      console.error('Error in getTicketMessages:', error);
      return {
        success: false,
        error: 'Failed to fetch messages'
      };
    }
  },

  // Send a message
  async sendMessage(request: CreateMessageRequest): Promise<ApiResponse<SupportMessage>> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const messageData = {
        ticket_id: request.ticket_id,
        sender_type: request.sender_type,
        sender_id: userData.user?.id,
        sender_name: userData.user?.email,
        message: request.message,
        message_type: request.message_type || 'text',
        attachments: request.attachments,
        is_ai_generated: request.is_ai_generated || false,
        ai_confidence: request.ai_confidence,
        read_by_user: request.sender_type === 'user',
        read_by_agent: request.sender_type === 'agent',
      };

      const { data, error } = await supabase
        .from('support_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as SupportMessage,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return {
        success: false,
        error: 'Failed to send message'
      };
    }
  },

  // Mark messages as read
  async markMessagesAsRead(ticketId: string, isAgent: boolean = false): Promise<ApiResponse<void>> {
    try {
      const updateField = isAgent ? 'read_by_agent' : 'read_by_user';
      
      const { error } = await supabase
        .from('support_messages')
        .update({ 
          [updateField]: true,
          read_at: new Date().toISOString()
        })
        .eq('ticket_id', ticketId)
        .eq(updateField, false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Messages marked as read'
      };
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      return {
        success: false,
        error: 'Failed to mark messages as read'
      };
    }
  },

  // =====================================================
  // KNOWLEDGE BASE
  // =====================================================

  // Search knowledge base
  async searchKnowledgeBase(request: SearchKnowledgeBaseRequest): Promise<ApiResponse<KnowledgeBaseArticle[]>> {
    try {
      let query = supabase
        .from('support_knowledge_base')
        .select('*')
        .eq('is_public', true);

      if (request.category) {
        query = query.eq('category', request.category);
      }

      // Simple text search in title and content
      if (request.query) {
        query = query.or(`title.ilike.%${request.query}%,content.ilike.%${request.query}%`);
      }

      if (request.limit) {
        query = query.limit(request.limit);
      } else {
        query = query.limit(10);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error searching knowledge base:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: (data as KnowledgeBaseArticle[]) || []
      };
    } catch (error) {
      console.error('Error in searchKnowledgeBase:', error);
      return {
        success: false,
        error: 'Failed to search knowledge base'
      };
    }
  },

  // Get all public knowledge base articles
  async getPublicArticles(): Promise<ApiResponse<KnowledgeBaseArticle[]>> {
    try {
      const { data, error } = await supabase
        .from('support_knowledge_base')
        .select('*')
        .eq('is_public', true)
        .order('helpful_count', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: (data as KnowledgeBaseArticle[]) || []
      };
    } catch (error) {
      console.error('Error in getPublicArticles:', error);
      return {
        success: false,
        error: 'Failed to fetch articles'
      };
    }
  },

  // Mark article as helpful
  async markArticleHelpful(articleId: string, isHelpful: boolean): Promise<ApiResponse<void>> {
    try {
      const field = isHelpful ? 'helpful_count' : 'not_helpful_count';
      
      const { error } = await supabase.rpc('increment_article_feedback', {
        article_id: articleId,
        field_name: field
      });

      if (error) {
        // Fallback if RPC doesn't exist
        const { data: article } = await supabase
          .from('support_knowledge_base')
          .select(field)
          .eq('id', articleId)
          .single();

        if (article) {
          await supabase
            .from('support_knowledge_base')
            .update({ [field]: (article[field] || 0) + 1 })
            .eq('id', articleId);
        }
      }

      return {
        success: true,
        message: 'Feedback recorded'
      };
    } catch (error) {
      console.error('Error in markArticleHelpful:', error);
      return {
        success: false,
        error: 'Failed to record feedback'
      };
    }
  },

  // =====================================================
  // CANNED RESPONSES (Admin Only)
  // =====================================================

  // Get all canned responses
  async getCannedResponses(): Promise<ApiResponse<CannedResponse[]>> {
    try {
      const { data, error } = await supabase
        .from('support_canned_responses')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) {
        console.error('Error fetching canned responses:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: (data as CannedResponse[]) || []
      };
    } catch (error) {
      console.error('Error in getCannedResponses:', error);
      return {
        success: false,
        error: 'Failed to fetch canned responses'
      };
    }
  },

  // =====================================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================================

  // Subscribe to ticket updates
  subscribeToTicket(ticketId: string, callback: (message: SupportMessage) => void) {
    return supabase
      .channel(`ticket:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          callback(payload.new as SupportMessage);
        }
      )
      .subscribe();
  },

  // Subscribe to all user tickets
  subscribeToUserTickets(userId: string, callback: (ticket: SupportTicket) => void) {
    return supabase
      .channel(`user-tickets:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            callback(payload.new as SupportTicket);
          }
        }
      )
      .subscribe();
  }
};

export default supportService;
