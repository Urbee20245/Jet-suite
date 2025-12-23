
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
    what: 'Your Growth Score (0-95 points) measures your marketing effectiveness across three areas: Foundation (40 pts), Create & Publish (30 pts), and Engage & Convert (25 pts). It\'s designed to never reach 100% because marketing is continuous, not a one-time achievement.',
    why: 'It provides real-time feedback on your marketing momentum. A score of 85+ means you\'re in the "Growth Optimized" zone—the sweet spot for sustainable business growth. The score fluctuates naturally as you engage with customers, which is healthy and expected.',
    when: 'Check your Growth Score weekly in the header or visit the dedicated Growth Score page for detailed breakdowns. Your score will move up and down based on your activity—this is by design.',
    skip: 'Ignoring your score means missing valuable feedback. Think of it like a fitness tracker—it shows you where you are and motivates consistent effort. A declining score signals you need to re-engage with customers or create content.',
    how: 'Your score increases by: completing growth plan tasks, responding to reviews, publishing content, and maintaining weekly consistency. It decreases when: engagement stops, reviews go unanswered, or content creation pauses. Target 85+ for optimal performance.',
    next: { text: 'Learn How Your Score is Calculated', articleId: 'getting-started/score-calculation' }
  },
  'getting-started/score-calculation': {
    title: 'How Your Growth Score is Calculated',
    what: 'Your score is calculated from three weighted categories: Foundation (40 points for one-time setup like Google Business Profile and Brand DNA), Create & Publish (30 points for ongoing content creation), and Engage & Convert (25 points for customer engagement like review responses).',
    why: 'Understanding the calculation helps you prioritize actions. Foundation tasks provide the biggest initial boost. Once established, maintaining a high score requires consistent content creation and customer engagement—which is exactly what drives business growth.',
    when: 'Review the calculation breakdown on your Growth Score page to see which areas need attention. If you\'re below 85, focus on the category with the most unclaimed points.',
    skip: 'If you don\'t understand how your score works, you might focus on the wrong activities or feel frustrated by natural fluctuations. The score is designed to guide you toward high-impact actions.',
    how: 'Foundation (40 pts): Google Business Profile verified (+15), Brand DNA set up (+10), initial audits run (+15). Create & Publish (30 pts): Weekly content (+10), campaigns (+10), consistency (+10). Engage & Convert (25 pts): Review responses (+10), lead follow-ups (+8), engagement (+7). Max possible: 95 points.',
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
    what: 'JetCreate is your AI-powered creative director. It uses your saved Brand DNA to brainstorm campaign ideas with preview images, then generates a full suite of on-brand marketing assets, including social media posts, images, and ad copy. Each asset can be edited, regenerated, downloaded, or deleted.',
    why: 'Consistency is key to building a memorable brand. JetCreate ensures that everything you publish—from a Facebook post to a Google Ad—looks and sounds like it comes from the same company. This builds trust and recognition. It replaces hiring a graphic designer ($1,000-3,000/mo).',
    when: 'Once your Foundation is solid (your GBP and website are optimized), it\'s time to start creating content. Use JetCreate to turn your strategy into visible, on-brand marketing campaigns.',
    skip: 'Without a tool like JetCreate, your marketing can feel disjointed and off-brand. This confuses customers and weakens your brand identity over time.',
    how: 'JetCreate automatically suggests campaign ideas based on your business profile. Simply choose an idea, and JetCreate generates all the copy and images you need, perfectly matching your brand\'s colors, fonts, and tone. You can edit any asset inline or regenerate variations.',
    next: { text: 'Learn about other content tools', articleId: 'create-publish/content-tools' }
  },
  'create-publish/content-tools': {
    title: 'Content Creation Tools Overview',
    what: 'JetSuite includes four content creation tools: JetPost (social media posts), JetContent (blog articles), JetImage (standalone images), and JetCreate (full campaigns). Each tool uses your Brand DNA to ensure consistency.',
    why: 'Different content types serve different purposes. Social posts build engagement, blog articles drive SEO, images support visual branding, and campaigns coordinate everything. Using all four creates a cohesive marketing presence.',
    when: 'Use JetPost for quick daily/weekly social content. Use JetContent for long-form SEO articles monthly. Use JetImage when you need a specific visual. Use JetCreate when launching a campaign or promotion.',
    skip: 'Relying on only one content type limits your reach. Social posts alone won\'t improve SEO. Blog articles alone won\'t build social engagement. A balanced approach maximizes visibility.',
    how: 'Start with JetCreate for your first campaign to get multiple asset types at once. Then use JetPost weekly for consistent social presence. Add JetContent monthly for SEO. Use JetImage as needed for specific visuals.',
    next: { text: 'Learn about engaging customers with JetReply', articleId: 'engage-convert/jetreply' }
  },
  // Engage & Convert
  'engage-convert/jetreply': {
    title: 'JetReply: Smart Review Response',
    what: 'JetReply automatically fetches reviews from your connected Google Business Profile and helps you craft professional, on-brand responses. It detects sentiment (positive/negative) and generates appropriate replies that match your business tone.',
    why: 'Responding to reviews improves your local SEO ranking, builds trust with potential customers, and shows you care about feedback. Unanswered reviews signal neglect. JetReply makes consistent responses effortless, replacing reputation management services ($200-800/mo).',
    when: 'Use JetReply weekly to respond to new reviews. Set aside 15-30 minutes each week to review and send responses. Consistent response rates signal to Google that you\'re an active, engaged business.',
    skip: 'Ignoring reviews damages your reputation and SEO. Potential customers read reviews AND your responses. A single ignored negative review can cost you multiple customers. Your Growth Score decreases when reviews go unanswered.',
    how: 'JetReply automatically loads your latest reviews when you open it. Click on a review to select it, review the AI-generated response, customize if needed, then copy and paste it to your Google Business Profile. Mark reviews as complete to track your progress.',
    next: { text: 'Learn about JetTrust review widgets', articleId: 'engage-convert/jettrust' }
  },
  'engage-convert/jettrust': {
    title: 'JetTrust: Review Widget Generator',
    what: 'JetTrust creates embeddable review widgets that display your Google reviews on your website or social media. Choose from three modern layouts (Grid, Carousel, or List), filter by star rating (3+, 4+, or 5+), and generate code or social media posts. Works even with zero reviews.',
    why: 'Displaying reviews on your website builds trust and increases conversions. Social proof is one of the most powerful marketing tools. JetTrust replaces paid review widget services ($50-200/mo) and gives you a shareable review link for easy customer feedback collection.',
    when: 'Set up JetTrust as soon as your Google Business Profile is connected—even if you have zero reviews. The widget will encourage customers to leave your first review. Update the widget monthly as new reviews come in.',
    skip: 'Without visible reviews on your website, you\'re missing easy conversions. Visitors want to see social proof before buying. The "Leave a Review" button in the widget also increases your review volume over time.',
    how: 'Open JetTrust, choose your layout style, select minimum star rating, and preview the widget. Click "Generate Widget Code" for website embedding, or "Copy for Social Media" to share reviews on social platforms. You can also copy the quick review link to share via email, text, or QR codes.',
    next: { text: 'Learn about lead generation with JetLeads', articleId: 'engage-convert/jetleads' }
  },
  'engage-convert/jetleads': {
    title: 'JetLeads: Local Lead Discovery',
    what: 'JetLeads helps you identify potential customers actively searching for your services in your local area. It provides strategies for reaching these high-intent prospects before your competitors do.',
    why: 'Most businesses wait for customers to find them. JetLeads flips this by helping you proactively identify and reach potential customers. This replaces expensive lead generation services ($500-2,000/mo) with AI-powered research.',
    when: 'Use JetLeads once you\'ve completed your Foundation phase and have consistent content publishing. You need a strong online presence before actively pursuing leads, or they won\'t convert.',
    skip: 'Skipping proactive lead generation means relying entirely on inbound traffic. This works but grows slowly. JetLeads accelerates growth by adding outbound strategy to your inbound foundation.',
    how: 'Open JetLeads, input your service and location details, and review the AI-generated lead strategies. Implement 1-2 strategies per week. Track which approaches work best for your business and double down on those.',
    next: { text: 'Understand your cost savings', articleId: 'getting-started/cost-savings' }
  },
  'getting-started/cost-savings': {
    title: 'Understanding Your Cost Savings with JetSuite',
    what: 'JetSuite replaces 12+ traditional marketing services with a single $149/mo platform. Traditional costs range from $5,000-15,000/mo when hiring agencies, freelancers, and subscribing to multiple tools. You save 90-95% on marketing expenses.',
    why: 'Small businesses often can\'t afford quality marketing, forcing them to choose between expensive agencies (out of budget) or DIY efforts (time-consuming and inconsistent). JetSuite provides agency-level capabilities at a fraction of the cost.',
    when: 'Visit the Savings Calculator on the pricing page to input which services you currently use (or plan to use). The calculator shows your exact monthly and annual savings. Use this to justify the investment to yourself or stakeholders.',
    skip: 'If you don\'t understand the value, you might underutilize the platform. Each tool replaces a specific expensive service. Using all tools maximizes your ROI. Ignoring tools means leaving money on the table.',
    how: 'JetSuite replaces: Local SEO consultants, SEO tool subscriptions, social media managers, content writers, graphic designers, marketing agencies, reputation management, review widgets, lead generation, competitor research, and more. Every tool you use increases your effective savings.',
  }
};
