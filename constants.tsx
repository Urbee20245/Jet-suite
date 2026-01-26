import type { Tool } from './types';
import { 
  JetBizIcon, 
  JetVizIcon, 
  JetSocialIcon, 
  JetReplyIcon,
  JetLeadsIcon,
  JetContentIcon,
  JetAdsIcon,
  JetCompeteIcon,
  JetEventsIcon,
  JetKeywordsIcon,
  JetImageIcon,
  JetCreateIcon,
  JetTrustIcon,
  GrowthPlanIcon,
  GrowthScoreIcon,
  HomeIcon,
  KnowledgeBaseIcon,
  AccountIcon,
  AdminPanelIcon,
  PlannerIcon,
  JetProductIcon,
  BusinessIcon,
} from './components/icons/ToolIcons';
import { TicketIcon } from './components/SupportIcons';
import { SparklesIcon as SparklesIconSolid } from './components/icons/MiniIcons';

export const ALL_TOOLS: { [key: string]: Tool } = {
  // Special Home Tool
  home: { id: 'home', name: 'Home', description: 'Your command center for weekly growth.', icon: HomeIcon },
  'ask-boris': { id: 'ask-boris', name: 'Ask Boris', description: 'Chat with your AI growth coach.', icon: SparklesIconSolid },
  
  // Profile Tools
  businessdetails: { id: 'businessdetails', name: 'Business Details', description: 'Manage your core business information.', icon: BusinessIcon },
  planner: { id: 'planner', name: 'Planner', description: 'View all your scheduled posts and tasks in a calendar.', icon: PlannerIcon },
  growthscore: { id: 'growthscore', name: 'Growth Score', description: 'Track your online presence score and history.', icon: GrowthScoreIcon },
  account: { id: 'account', name: 'Account', description: 'Manage your plan, businesses, and team.', icon: AccountIcon },

  // Foundation Tools
  jetbiz: { id: 'jetbiz', name: 'JetBiz', description: 'Analyze & optimize your Google Business Profile for higher ranking.', icon: JetBizIcon },
  jetviz: { id: 'jetviz', name: 'JetViz', description: 'Get an AI-powered audit of your website for design & SEO.', icon: JetVizIcon },
  jetcompete: { id: 'jetcompete', name: 'JetCompete', description: 'Analyze your local competitors and find opportunities to stand out.', icon: JetCompeteIcon },
  jetkeywords: { id: 'jetkeywords', name: 'JetKeywords', description: 'Discover the best local keywords to attract more customers online.', icon: JetKeywordsIcon },

  // Create & Publish Tools
  jetcreate: { id: 'jetcreate', name: 'JetCreate', description: 'Create stunning, on-brand marketing campaigns and assets.', icon: JetCreateIcon },
  jetsocial: { id: 'jetsocial', name: 'JetSocial', description: 'Generate engaging social media posts for your business.', icon: JetSocialIcon },
  jetcontent: { id: 'jetcontent', name: 'JetContent', description: 'Create SEO-friendly blog posts and articles for your website.', icon: JetContentIcon },
  jetimage: { id: 'jetimage', name: 'JetImage', description: 'Generate high-quality images for your marketing materials.', icon: JetImageIcon },
  jetproduct: { id: 'jetproduct', name: 'JetProduct', description: 'Generate professional product mockups and lifestyle shots.', icon: JetProductIcon },
  
  // Engage & Convert Tools
  jetreply: { id: 'jetreply', name: 'JetReply', description: 'Craft professional AI-assisted responses to customer reviews.', icon: JetReplyIcon },
  jettrust: { id: 'jettrust', name: 'JetTrust', description: 'Create embeddable review widgets for your website and social media.', icon: JetTrustIcon },
  jetleads: { id: 'jetleads', name: 'JetLeads', description: 'Find potential customers who are actively looking for your services.', icon: JetLeadsIcon },
  jetevents: { id: 'jetevents', name: 'JetEvents', description: 'Brainstorm creative local events and promotions to drive traffic.', icon: JetEventsIcon },
  jetads: { id: 'jetads', name: 'JetAds', description: 'Generate compelling ad copy for Google and Facebook campaigns.', icon: JetAdsIcon },
  
  // Growth Tools
  growthplan: { id: 'growthplan', name: 'Growth Plan', description: 'Manage your weekly action plan and track your progress.', icon: GrowthPlanIcon },
  
  // Knowledge Base
  knowledgebase: { id: 'knowledgebase', name: 'Knowledge Base', description: 'Learn growth strategies and how to use JetSuite.', icon: KnowledgeBaseIcon },

  // Support
  support: { id: 'support', name: 'Support', description: 'Get help and manage your support tickets.', icon: TicketIcon },

  // Admin Panel
  adminpanel: { id: 'adminpanel', name: 'Admin Panel', description: 'Manage all businesses, users, and system settings.', icon: AdminPanelIcon },
};

export const TOOLS: Tool[] = Object.values(ALL_TOOLS);

// --- SIDEBAR NAVIGATION STRUCTURE ---
export const SIDEBAR_STATIC_TOP_TOOLS = ['home', 'ask-boris', 'businessdetails', 'planner', 'growthplan', 'growthscore'];

export const SIDEBAR_COLLAPSIBLE_CATEGORIES = [
  { name: 'Business Foundation', tools: ['jetbiz', 'jetviz', 'jetkeywords', 'jetcompete'] },
  { name: 'Marketing and Brand Strategy', tools: ['jetcreate', 'jetsocial', 'jetimage', 'jetcontent', 'jetproduct'] },
  { name: 'Customer Engagement', tools: ['jetreply', 'jettrust', 'jetleads', 'jetevents', 'jetads'] }
];

export const SIDEBAR_STATIC_BOTTOM_TOOLS = ['account', 'knowledgebase', 'support'];

export const ADMIN_SIDEBAR_TOOLS = ['adminpanel'];

/**
 * Validates that all tools referenced in the sidebar configuration
 * exist in the ALL_TOOLS object. Only runs in development mode.
 */
const validateSidebarTools = () => {
  const allSidebarTools = [
    ...SIDEBAR_STATIC_TOP_TOOLS,
    ...SIDEBAR_COLLAPSIBLE_CATEGORIES.flatMap(cat => cat.tools),
    ...SIDEBAR_STATIC_BOTTOM_TOOLS,
    ...ADMIN_SIDEBAR_TOOLS
  ];
  
  const missing = allSidebarTools.filter(id => !ALL_TOOLS[id]);
  if (missing.length > 0) {
    console.error('⚠️ Missing tools in constants:', missing);
  } else {
    console.log('✅ Sidebar tool configuration validated.');
  }
};

// Call it in development
if (import.meta.env.DEV) {
  validateSidebarTools();
}