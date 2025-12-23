
import type { Tool } from './types';
import { 
  JetBizIcon, 
  JetVizIcon, 
  JetPostIcon, 
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
  ActivityHistoryIcon,
  ProfileIcon,
  BusinessIcon,
  ReportsIcon,
  WeeklyProgressIcon,
  HomeIcon,
  KnowledgeBaseIcon,
  AccountIcon,
  AdminPanelIcon,
} from './components/icons/ToolIcons';

export const ALL_TOOLS: { [key: string]: Tool } = {
  // Special Home Tool
  home: { id: 'home', name: 'Home', description: 'Your command center for weekly growth.', icon: HomeIcon },
  
  // Profile Tools
  businessdetails: { id: 'businessdetails', name: 'Business Details', description: 'Manage your core business information.', icon: BusinessIcon },
  growthscore: { id: 'growthscore', name: 'Growth Score', description: 'Track your online presence score and history.', icon: GrowthScoreIcon },
  account: { id: 'account', name: 'Account', description: 'Manage your plan, businesses, and team.', icon: AccountIcon },

  // Foundation Tools
  jetbiz: { id: 'jetbiz', name: 'JetBiz', description: 'Analyze & optimize your Google Business Profile for higher ranking.', icon: JetBizIcon },
  jetviz: { id: 'jetviz', name: 'JetViz', description: 'Get an AI-powered audit of your website for design & SEO.', icon: JetVizIcon },
  jetcompete: { id: 'jetcompete', name: 'JetCompete', description: 'Analyze your local competitors and find opportunities to stand out.', icon: JetCompeteIcon },
  jetkeywords: { id: 'jetkeywords', name: 'JetKeywords', description: 'Discover the best local keywords to attract more customers online.', icon: JetKeywordsIcon },

  // Create & Publish Tools
  jetpost: { id: 'jetpost', name: 'JetPost', description: 'Generate engaging social media posts for your business.', icon: JetPostIcon },
  jetcontent: { id: 'jetcontent', name: 'JetContent', description: 'Create SEO-friendly blog posts and articles for your website.', icon: JetContentIcon },
  jetimage: { id: 'jetimage', name: 'JetImage', description: 'Generate high-quality images for your marketing materials.', icon: JetImageIcon },
  jetcreate: { id: 'jetcreate', name: 'JetCreate', description: 'Create stunning, on-brand marketing campaigns and assets.', icon: JetCreateIcon },
  
  // Engage & Convert Tools
  jetreply: { id: 'jetreply', name: 'JetReply', description: 'Craft professional AI-assisted responses to customer reviews.', icon: JetReplyIcon },
  jettrust: { id: 'jettrust', name: 'JetTrust', description: 'Create embeddable review widgets for your website and social media.', icon: JetTrustIcon },
  jetleads: { id: 'jetleads', name: 'JetLeads', description: 'Find potential customers who are actively looking for your services.', icon: JetLeadsIcon },
  jetads: { id: 'jetads', name: 'JetAds', description: 'Generate compelling ad copy for Google and Facebook campaigns.', icon: JetAdsIcon },
  jetevents: { id: 'jetevents', name: 'JetEvents', description: 'Brainstorm creative local events and promotions to drive traffic.', icon: JetEventsIcon },
  
  // Growth Tools
  growthplan: { id: 'growthplan', name: 'Growth Plan', description: 'Manage your weekly action plan and track your progress.', icon: GrowthPlanIcon },
  
  // Knowledge Base
  knowledgebase: { id: 'knowledgebase', name: 'Knowledge Base', description: 'Learn growth strategies and how to use JetSuite.', icon: KnowledgeBaseIcon },

  // Admin Panel
  adminpanel: { id: 'adminpanel', name: 'Admin Panel', description: 'Manage all businesses, users, and system settings.', icon: AdminPanelIcon },
};

export const TOOLS: Tool[] = Object.values(ALL_TOOLS);

// --- SIDEBAR NAVIGATION STRUCTURE ---
export const SIDEBAR_STATIC_TOP_TOOLS = ['home', 'businessdetails', 'growthscore'];

export const SIDEBAR_COLLAPSIBLE_CATEGORIES = [
  { name: 'Foundation', tools: ['jetbiz', 'jetviz', 'jetkeywords', 'jetcompete'] },
  { name: 'Create & Publish', tools: ['jetcreate', 'jetpost', 'jetimage', 'jetcontent'] },
  { name: 'Engage & Convert', tools: ['jetreply', 'jettrust', 'jetleads', 'jetevents', 'jetads'] }
];

export const SIDEBAR_STATIC_BOTTOM_TOOLS = ['account', 'growthplan', 'knowledgebase'];

export const ADMIN_SIDEBAR_TOOLS = ['adminpanel'];


// --- KNOWLEDGE BASE STRUCTURE & CONTENT ---
export interface KbArticle {
  title: string;
  what: string;
  why: string;
  when: string;
  skip: string;
  how: string;
  next?: { text: string; articleId: string; };
}

export const KNOWLEDGE_BASE_ARTICLES: { [key: string]: KbArticle } = {
  // Getting Started
  'getting-started/how-jetsuite-works': {
    title: 'How JetSuite Works: Your Growth Operating System',
    what: 'JetSuite is not just a collection of tools; it\'s a guided system designed to grow your business in a specific, proven order. It helps you build a solid online foundation, create content that attracts customers, and then engage those customers to convert them into revenue.',
    why: 'Most marketing efforts fail due to a lack of order. Businesses often spend money on ads or social media before their website is trustworthy or before they can even be found on Google Maps. JetSuite prevents this by guiding you through the right steps at the right time.',
    when: 'You are here now! Understanding the JetSuite philosophy is the first step to getting the most out of the platform.',
    skip: 'If you treat JetSuite like a random toolbox, you\'ll likely get random results. Understanding the system helps you build sustainable growth momentum.',
    how: 'By following the recommended "Next Best Action" on your Home screen and moving through the growth phases (Foundation → Create → Engage), JetSuite ensures your efforts build on each other, creating a powerful compounding effect.',
    next: { text: 'Learn Why Order Matters in Business Growth', articleId: 'getting-started/why-order-matters' }
  },
  'getting-started/why-order-matters': {
    title: 'Why Order Matters in Business Growth',
    what: 'Effective marketing is like building a house. You must build a solid foundation (visibility and trust) before putting up the walls (content) and decorating the rooms (ads and engagement). Doing things out of order is inefficient and expensive.',
    why: 'Imagine spending $1,000 on ads that send customers to a confusing website—that\'s a waste of money. Imagine writing amazing blog posts that no one can find on Google—that\'s a waste of time. Order ensures your resources are never wasted.',
    when: 'This is a core concept to understand before you start using any tool. Internalizing this will shape every marketing decision you make.',
    skip: 'Ignoring the proper order is the single biggest reason why small businesses feel like their marketing "isn\'t working." It leads to frustration and wasted budget.',
    how: 'JetSuite\'s entire structure is built around this principle. The "Foundation" tools ensure you can be found and trusted. The "Create & Publish" tools give your audience something of value. The "Engage & Convert" tools turn that audience into customers.',
    next: { text: 'Learn about Setting Up Your Business Profile', articleId: 'getting-started/setup-profile' }
  },
  'getting-started/setup-profile': {
    title: 'Setting Up Your Business Profile',
    what: 'Your Business Profile inside JetSuite is the "single source of truth" for the entire platform. It stores your business name, location, website, and Brand DNA (colors, fonts, style).',
    why: 'This is a massive time-saver. Instead of telling every tool about your business over and over, you enter the information once. Every AI-powered tool—from content creation to ad copy—will then use this profile to generate perfectly on-brand and locally-relevant results.',
    when: 'This is the very first thing you should do. Before using any tool, complete your Business Details. The more complete it is, the smarter JetSuite becomes.',
    skip: 'If you skip this, every tool will operate in a generic "guidance mode." The results will be less effective, and you\'ll be prompted to complete your profile at every turn.',
    how: 'JetSuite makes it easy. Go to "Business Details" and fill out the form. Use the "Analyze" button to automatically extract your website\'s visual DNA, saving you even more time.',
    next: { text: 'Learn about Your Growth Score', articleId: 'getting-started/growth-score' }
  },
   'getting-started/growth-score': {
    title: 'Understanding Your Growth Score',
    what: 'Your Growth Score is a simple metric that measures your progress through the JetSuite system. It\'s not a vanity metric; it\'s an indicator of how well you\'re building a sustainable growth engine.',
    why: 'It provides a clear, at-a-glance measure of your momentum. Watching your score increase is a powerful motivator and confirms you\'re taking the right actions to improve your online presence.',
    when: 'Keep an eye on your Growth Score every week. It\'s located in the header of the app.',
    skip: 'You can\'t skip it! But ignoring it means you miss out on a simple way to track your progress and stay motivated.',
    how: 'Your score increases automatically as you complete key foundational steps (like verifying your Google Business Profile) and complete tasks in your weekly Growth Plan.',
    next: { text: 'Start with JetBiz: Google Business Profile', articleId: 'foundation/jetbiz' }
  },
  // Foundation
  'foundation/jetbiz': {
    title: 'JetBiz: Google Business Profile Optimization',
    what: 'JetBiz analyzes your Google Business Profile (GBP), compares it to local competitors, and identifies opportunities to improve your ranking in Google Maps and local search results.',
    why: 'For most local businesses, GBP is the single most important factor for getting found online. It\'s what appears in "near me" searches and is often the first interaction a customer has with your business.',
    when: 'After setting up your Business Profile, JetBiz is your first step. Before you try to get more website traffic, you need to make sure people can find you on Google in the first place.',
    skip: 'Skipping this step is like having a store with no sign on the door. You might be great, but if no one can find you, it doesn\'t matter. You\'ll be invisible to a huge portion of your potential local customers.',
    how: 'JetBiz automatically uses your profile information to find your GBP. With one click, it runs an analysis and gives you a prioritized list of actions to take, which are added directly to your Growth Plan.',
    next: { text: 'Next, analyze your website with JetViz', articleId: 'foundation/jetviz' }
  },
  'foundation/jetviz': {
    title: 'JetViz: Website Visibility & Trust Signals',
    what: 'JetViz is an AI-powered website auditor. It analyzes your homepage for clarity, trust signals, and local SEO, telling you exactly what to fix to turn more visitors into customers.',
    why: 'Once a customer finds you on Google (thanks to JetBiz), their next step is to visit your website. If your site is confusing, slow, or untrustworthy, they will leave. A strong website is crucial for converting interest into action.',
    when: 'Use JetViz immediately after you\'ve optimized your GBP with JetBiz. This ensures that the new traffic you\'re getting from Google lands on a website that is ready to convert them.',
    skip: 'If you skip this, you may be wasting your newfound visibility. Driving traffic to a "leaky bucket" website means you lose potential customers every single day.',
    how: 'JetViz uses your saved website URL to perform a one-click audit. It identifies issues and provides clear, actionable fixes, adding the most important ones to your Growth Plan.',
    next: { text: 'Learn about creating content with JetCreate', articleId: 'create-publish/jetcreate' }
  },
  // Create & Publish
  'create-publish/jetcreate': {
    title: 'JetCreate: On-Brand Campaign Creation',
    what: 'JetCreate is your AI-powered creative director. It uses your saved Brand DNA to brainstorm campaign ideas and then generates a full suite of on-brand marketing assets, including social media posts and ad copy.',
    why: 'Consistency is key to building a memorable brand. JetCreate ensures that everything you publish—from a Facebook post to a Google Ad—looks and sounds like it comes from the same company. This builds trust and recognition.',
    when: 'Once your Foundation is solid (your GBP and website are optimized), it\'s time to start creating content. Use JetCreate to turn your strategy into visible, on-brand marketing campaigns.',
    skip: 'Without a tool like JetCreate, your marketing can feel disjointed and off-brand. This confuses customers and weakens your brand identity over time.',
    how: 'JetCreate automatically suggests campaign ideas based on your business profile. Simply choose an idea, and JetCreate generates all the copy you need, perfectly matching your brand\'s tone and style.',
  }
};
