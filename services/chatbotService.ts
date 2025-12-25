// =====================================================
// JETSUITE AI CHATBOT SERVICE
// Powered by Google Gemini API
// =====================================================

import type {
  ChatMessage,
  ChatbotResponse,
  ChatbotContext,
  SuggestedAction,
  KnowledgeBaseArticle,
  CreateTicketRequest,
} from '../types';
import { supportService } from './supportService';

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// =====================================================
// SYSTEM PROMPTS
// =====================================================

const CHATBOT_SYSTEM_PROMPT = `You are JetBot, an AI-powered customer support assistant for JetSuite, a comprehensive business growth platform for local businesses.

**Your Role:**
- Provide friendly, helpful, and accurate support to JetSuite users
- Help users understand features, troubleshoot issues, and navigate the platform
- Determine when issues need human support and escalate appropriately
- Search the knowledge base to provide accurate, helpful answers
- Stay professional, empathetic, and solution-focused

**JetSuite Overview:**
JetSuite is a decision and execution engine (not just a reporting dashboard) that helps local businesses grow their online presence through:

**FOUNDATION TOOLS:**
- JetBiz: Analyzes & optimizes Google Business Profiles for higher local ranking
- JetViz: AI-powered website audits for design, speed, and SEO
- JetKeywords: Discovers best local keywords to attract customers
- JetCompete: Analyzes local competitors and finds opportunities

**CREATE & PUBLISH TOOLS:**
- JetCreate: Creates on-brand marketing campaigns and assets
- JetPost: Generates engaging social media posts
- JetImage: Creates high-quality marketing images
- JetContent: Creates SEO-friendly blog posts and articles

**ENGAGE & CONVERT TOOLS:**
- JetReply: Crafts AI-assisted responses to customer reviews
- JetTrust: Creates embeddable review widgets with AI auto-reply
- JetLeads: Finds potential customers actively looking for services
- JetEvents: Brainstorms local events and promotions
- JetAds: Generates compelling ad copy for Google and Facebook

**GROWTH TRACKING:**
- Growth Plan: Weekly personalized action plan from audit results
- Growth Score: 0-100 score tracking Visibility, Trust, and Activity

**Pricing:**
- Base subscription: $149/month
- Additional businesses: $49/business/month
- Team seats: $15/seat/month
- Founder pricing: Special locked-in rates for early customers

**Core Principles:**
1. Progress is earned through execution, not just usage
2. Accuracy and trust are mandatory
3. Every audit results in clear, executable tasks
4. Social and content tools are always available
5. Strategy progression is earned by completing weekly tasks

**When to Escalate:**
Escalate to human support when:
- User reports a critical bug or system outage
- Billing disputes or refund requests
- Account access issues you cannot resolve
- Repeated failed attempts to solve an issue
- User explicitly requests to speak with a human
- Complex technical issues requiring code-level debugging
- Feature requests requiring product team review

**Response Guidelines:**
- Keep responses concise (2-3 paragraphs max)
- Use bullet points for lists of steps
- Link to relevant knowledge base articles when helpful
- Always confirm understanding before escalating
- Show empathy for user frustrations
- Provide specific, actionable next steps

**Response Format:**
Your response should be in JSON format:
{
  "message": "Your helpful response to the user",
  "confidence": 0.85,
  "suggested_actions": [
    {"type": "view_article", "label": "View Help Article", "data": {"article_id": "123"}},
    {"type": "create_ticket", "label": "Contact Support", "data": {"category": "technical"}}
  ],
  "should_escalate": false,
  "escalation_reason": null,
  "knowledge_base_articles": [
    {"id": "123", "title": "Article Title", "content": "Brief excerpt..."}
  ]
}`;

// =====================================================
// CHATBOT SERVICE
// =====================================================

export const chatbotService = {
  /**
   * Process a user message and generate AI response
   */
  async chat(
    userMessage: string,
    conversationHistory: ChatMessage[],
    context?: ChatbotContext
  ): Promise<ChatbotResponse> {
    try {
      // Search knowledge base for relevant articles
      const kbArticles = await this.searchRelevantArticles(userMessage);
      
      // Build context for Gemini
      const contextInfo = this.buildContextPrompt(context, kbArticles);
      
      // Build conversation messages
      const messages = this.buildConversationMessages(
        conversationHistory,
        userMessage,
        contextInfo
      );

      // Call Gemini API
      const response = await this.callGeminiAPI(messages);
      
      // Parse and validate response
      const chatbotResponse = this.parseGeminiResponse(response, kbArticles);
      
      return chatbotResponse;
    } catch (error) {
      console.error('Error in chatbot.chat:', error);
      
      // Return fallback response
      return {
        message: "I apologize, but I'm having trouble processing your request right now. Would you like me to create a support ticket so our team can help you?",
        confidence: 0.1,
        should_escalate: true,
        escalation_reason: 'AI service error',
        suggested_actions: [
          {
            type: 'create_ticket',
            label: 'Create Support Ticket',
            data: { category: 'technical' }
          }
        ]
      };
    }
  },

  /**
   * Search knowledge base for relevant articles
   */
  async searchRelevantArticles(query: string): Promise<KnowledgeBaseArticle[]> {
    try {
      const result = await supportService.searchKnowledgeBase({
        query,
        limit: 3
      });
      
      return result.data || [];
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  },

  /**
   * Build context prompt from user data and KB articles
   */
  buildContextPrompt(
    context?: ChatbotContext,
    articles: KnowledgeBaseArticle[] = []
  ): string {
    let prompt = '\n\n**Current Context:**\n';
    
    if (context) {
      if (context.user_email) {
        prompt += `- User: ${context.user_email}\n`;
      }
      if (context.business_name) {
        prompt += `- Business: ${context.business_name}\n`;
      }
      if (context.subscription_status) {
        prompt += `- Subscription: ${context.subscription_status}\n`;
      }
      if (context.current_page) {
        prompt += `- Current Page: ${context.current_page}\n`;
      }
    }
    
    if (articles.length > 0) {
      prompt += '\n**Relevant Knowledge Base Articles:**\n';
      articles.forEach((article, index) => {
        prompt += `${index + 1}. "${article.title}"\n`;
        prompt += `   ${article.content.substring(0, 200)}...\n\n`;
      });
    }
    
    return prompt;
  },

  /**
   * Build conversation messages for Gemini
   */
  buildConversationMessages(
    history: ChatMessage[],
    newMessage: string,
    contextInfo: string
  ): string {
    let conversation = CHATBOT_SYSTEM_PROMPT;
    
    // Add context
    conversation += contextInfo;
    
    // Add conversation history (last 10 messages)
    conversation += '\n\n**Conversation History:**\n';
    const recentHistory = history.slice(-10);
    
    recentHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'User' : 'JetBot';
      conversation += `${role}: ${msg.content}\n`;
    });
    
    // Add new user message
    conversation += `\nUser: ${newMessage}\n\nJetBot:`;
    
    return conversation;
  },

  /**
   * Call Gemini API
   */
  async callGeminiAPI(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  },

  /**
   * Parse Gemini response and extract structured data
   */
  parseGeminiResponse(
    response: string,
    kbArticles: KnowledgeBaseArticle[]
  ): ChatbotResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          message: parsed.message || response,
          confidence: parsed.confidence || 0.7,
          suggested_actions: parsed.suggested_actions || [],
          should_escalate: parsed.should_escalate || false,
          escalation_reason: parsed.escalation_reason,
          knowledge_base_articles: kbArticles.slice(0, 2) // Top 2 articles
        };
      }
      
      // Fallback: treat entire response as message
      return {
        message: response,
        confidence: 0.7,
        suggested_actions: this.generateDefaultActions(response),
        should_escalate: this.shouldEscalateBasedOnContent(response),
        knowledge_base_articles: kbArticles.slice(0, 2)
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      
      // Return raw response as fallback
      return {
        message: response,
        confidence: 0.5,
        suggested_actions: [],
        should_escalate: false,
        knowledge_base_articles: kbArticles
      };
    }
  },

  /**
   * Generate default actions based on response content
   */
  generateDefaultActions(response: string): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    
    // Check if response mentions creating a ticket
    if (response.toLowerCase().includes('ticket') || 
        response.toLowerCase().includes('contact support')) {
      actions.push({
        type: 'create_ticket',
        label: 'Create Support Ticket',
        data: { category: 'general' }
      });
    }
    
    return actions;
  },

  /**
   * Determine if content indicates escalation needed
   */
  shouldEscalateBasedOnContent(response: string): boolean {
    const escalationKeywords = [
      'contact support',
      'create a ticket',
      'speak with a human',
      'escalate',
      'technical team',
      'cannot help',
      "can't help"
    ];
    
    const lowerResponse = response.toLowerCase();
    return escalationKeywords.some(keyword => lowerResponse.includes(keyword));
  },

  /**
   * Create a support ticket from chatbot conversation
   */
  async escalateToTicket(
    conversationHistory: ChatMessage[],
    category: string = 'general',
    context?: ChatbotContext
  ): Promise<string | null> {
    try {
      // Generate ticket subject from conversation
      const subject = this.generateTicketSubject(conversationHistory);
      
      // Generate ticket description
      const description = this.generateTicketDescription(conversationHistory);
      
      // Create ticket request
      const ticketRequest: CreateTicketRequest = {
        subject,
        category: category as any,
        priority: 'medium',
        description,
        business_name: context?.business_name,
        source: 'chatbot'
      };
      
      const result = await supportService.createTicket(ticketRequest);
      
      if (result.success && result.data) {
        return result.data.id;
      }
      
      return null;
    } catch (error) {
      console.error('Error escalating to ticket:', error);
      return null;
    }
  },

  /**
   * Generate a subject line from conversation
   */
  generateTicketSubject(history: ChatMessage[]): string {
    // Use first user message or a default
    const firstUserMessage = history.find(msg => msg.role === 'user');
    
    if (firstUserMessage) {
      // Truncate to reasonable length
      const subject = firstUserMessage.content.substring(0, 100);
      return subject.length < firstUserMessage.content.length 
        ? subject + '...' 
        : subject;
    }
    
    return 'Support Request from Chatbot';
  },

  /**
   * Generate ticket description from conversation
   */
  generateTicketDescription(history: ChatMessage[]): string {
    let description = '**Conversation History from AI Chatbot:**\n\n';
    
    history.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'User' : 'JetBot';
      description += `**${role}:** ${msg.content}\n\n`;
    });
    
    description += '---\n*This ticket was automatically created when the chatbot determined human support was needed.*';
    
    return description;
  },

  /**
   * Get quick reply suggestions based on context
   */
  getQuickReplies(context?: ChatbotContext): string[] {
    const defaultReplies = [
      'How do I set up my business profile?',
      'What is JetBiz?',
      'How does billing work?',
      'I need help with my account'
    ];
    
    // Customize based on context
    if (context?.current_page) {
      if (context.current_page.includes('jetbiz')) {
        return [
          'How do I improve my Google ranking?',
          'What is a GBP audit?',
          ...defaultReplies.slice(2)
        ];
      }
      if (context.current_page.includes('jetviz')) {
        return [
          'How do I improve my website speed?',
          'What are the PageSpeed scores?',
          ...defaultReplies.slice(2)
        ];
      }
    }
    
    return defaultReplies;
  }
};

export default chatbotService;
