import type { Tool } from '../types';
import { ALL_TOOLS } from '../constants';

export interface KbArticle {
  title: string;
  what: string;
  why: string;
  when: string;
  skip: string;
  how: string;
  next?: {
    text: string;
    articleId: string;
  };
}

export const KNOWLEDGE_BASE_ARTICLES: Record<string, KbArticle> = {
  // --- GETTING STARTED ---
  'getting-started/how-jetsuite-works': {
    title: 'How JetSuite Works: The 4-Phase System',
    what: 'JetSuite is a guided growth platform that replaces multiple tools and agencies. It operates on a 4-phase system: Diagnose, Strategize, Execute, and Track.',
    why: 'Following a systematic approach ensures you build a solid foundation before moving to content creation, maximizing your ROI and preventing wasted effort.',
    when: 'Start here! This is the first article every new user should read.',
    skip: 'If you skip this, you risk jumping straight to content creation without fixing your foundation, leading to poor results.',
    how: 'The system automatically guides you through the phases, prioritizing tasks from JetBiz and JetViz into your Growth Plan.',
    next: {
      text: 'Next: Set Up Your Business Profile',
      articleId: 'getting-started/setup-profile',
    },
  },
  'getting-started/why-order-matters': {
    title: 'Why Order Matters: Foundation First',
    what: 'The JetSuite methodology emphasizes building a strong foundation (SEO, GBP, Website) before creating content or running ads.',
    why: 'If your foundation is weak (e.g., slow website, unverified GBP), all your content and ad spend will be wasted because customers won\'t trust you or find you.',
    when: 'Review this if you are tempted to skip the JetBiz or JetViz steps.',
    skip: 'Skipping the foundation means your Growth Score will remain low, and your marketing efforts will be ineffective.',
    how: 'The Growth Plan automatically sequences tasks, ensuring you complete high-impact foundation tasks first.',
  },
  'getting-started/setup-profile': {
    title: 'Setting Up Your Business Profile',
    what: 'Your Business Profile is the single source of truth for all AI tools. It includes your name, location, website, and industry.',
    why: 'Accurate and complete profile data ensures the AI generates hyper-local, relevant, and on-brand content and analysis for your business.',
    when: 'This is the first step after logging in. Complete it immediately.',
    skip: 'Tools like JetBiz and JetKeywords cannot function without a complete profile.',
    how: 'Go to the Business Details tool and fill in all required fields (Name, Website, Location, Industry).',
    next: {
      text: 'Next: Understand Your Growth Score',
      articleId: 'getting-started/growth-score',
    },
  },
  'getting-started/growth-score': {
    title: 'Your Growth Score (0-99)',
    what: 'The Growth Score is a single metric (0-99) that measures your overall online presence health and marketing execution effectiveness.',
    why: 'It provides clear accountability. You can\'t fake a high score; it only increases when you complete high-impact tasks from your Growth Plan.',
    when: 'Check your score daily to monitor your progress and momentum.',
    skip: 'Ignoring your score means ignoring your progress. It\'s your primary indicator of success.',
    how: 'The score is calculated based on profile completion, GBP verification, and task completion rate. Complete tasks in your Growth Plan to increase it.',
    next: {
      text: 'Next: Start Your JetBiz Audit',
      articleId: 'foundation/jetbiz',
    },
  },

  // --- FOUNDATION ---
  'foundation/jetbiz': {
    title: 'JetBiz: Google Business Profile Optimization',
    what: 'JetBiz audits your Google Business Profile (GBP) against local competitors, identifying gaps in categories, photos, and consistency.',
    why: 'GBP is the #1 factor for local search ranking. Optimizing it is the fastest way to get found by local customers.',
    when: 'Run this immediately after setting up your profile and connecting your GBP.',
    skip: 'Skipping this means you are leaving money on the table and letting competitors dominate local map results.',
    how: 'Connect your GBP in Business Details, then run the JetBiz analysis. Tasks will be added to your Growth Plan.',
    next: {
      text: 'Next: Analyze Your Website with JetViz',
      articleId: 'foundation/jetviz',
    },
  },
  'foundation/jetviz': {
    title: 'JetViz: AI Website Audit',
    what: 'JetViz analyzes your website for speed, SEO structure, mobile responsiveness, and conversion-killing trust signals.',
    why: 'A slow or confusing website will lose the customers JetBiz sends you. JetViz ensures your website converts visitors into leads.',
    when: 'Run this after JetBiz to ensure your digital storefront is ready for traffic.',
    skip: 'Ignoring website issues means your conversion rate will be low, wasting all your other marketing efforts.',
    how: 'Enter your website URL into JetViz. The AI will generate specific fixes and add them to your Growth Plan.',
    next: {
      text: 'Next: Find Keywords with JetKeywords',
      articleId: 'foundation/jetkeywords',
    },
  },
  'foundation/jetkeywords': {
    title: 'JetKeywords: Local Keyword Research',
    what: 'JetKeywords finds high-intent, low-competition keywords specific to your local area and industry.',
    why: 'Targeting the right keywords is essential for attracting customers who are ready to buy. It guides your content strategy.',
    when: 'Use this before creating any new content (blogs, social posts, ads).',
    skip: 'Without proper keyword research, your content will be invisible to search engines.',
    how: 'Enter descriptive keywords into JetKeywords. The tool returns categorized lists of profitable search terms.',
    next: {
      text: 'Next: Analyze Competitors with JetCompete',
      articleId: 'foundation/jetcompete',
    },
  },
  'foundation/jetcompete': {
    title: 'JetCompete: Competitor Analysis',
    what: 'JetCompete analyzes your top local competitors to identify their strengths, weaknesses, and market gaps you can exploit.',
    why: 'Knowing your competition allows you to position your business uniquely and target underserved customer needs.',
    when: 'Run this quarterly or before launching a major new campaign.',
    skip: 'You risk copying competitors or missing obvious opportunities if you don\'t know what they are doing.',
    how: 'Enter a competitor\'s website URL. JetCompete generates counter-strategies and adds tasks to your Growth Plan.',
    next: {
      text: 'Next: Create Your First Campaign with JetCreate',
      articleId: 'create-publish/jetcreate',
    },
  },

  // --- CREATE & PUBLISH ---
  'create-publish/jetcreate': {
    title: 'JetCreate: AI Creative Director',
    what: 'JetCreate generates full marketing campaigns—including social posts, ad copy, and images—all tailored to your Brand DNA.',
    why: 'It replaces the need for expensive graphic designers and copywriters, ensuring all your content is professional and consistent.',
    when: 'Use this whenever you have a new product, service, or promotion to launch.',
    skip: 'Skipping this means manually creating content, which is slow, expensive, and often inconsistent.',
    how: 'Select a campaign idea or enter a custom prompt. JetCreate generates all assets instantly.',
    next: {
      text: 'Next: Generate Social Posts with JetPost',
      articleId: 'create-publish/jetpost',
    },
  },
  'create-publish/jetpost': {
    title: 'JetPost: Social Media Content Generator',
    what: 'JetPost creates engaging, platform-specific social media posts (Facebook, Instagram, X, LinkedIn) based on your topic and tone.',
    why: 'Consistent social media presence builds brand awareness and drives traffic. JetPost makes daily posting easy.',
    when: 'Use this weekly to fill your content calendar and maintain engagement.',
    skip: 'Inconsistent social media activity leads to low engagement and missed opportunities.',
    how: 'Enter a topic, select platforms, and choose a tone. JetPost generates optimized copy and visual suggestions.',
    next: {
      text: 'Next: Create Blog Content with JetContent',
      articleId: 'create-publish/jetcontent',
    },
  },
  'create-publish/jetcontent': {
    title: 'JetContent: Blog Post Creator',
    what: 'JetContent writes SEO-optimized, long-form blog posts and articles based on your target keywords and local context.',
    why: 'Blog content drives organic traffic, establishes authority, and helps you rank for long-tail keywords.',
    when: 'Use this monthly to maintain a consistent content marketing strategy.',
    skip: 'Without fresh, optimized content, your website will stagnate in search rankings.',
    how: 'Enter your article topic or launch directly from a keyword found in JetKeywords. JetContent drafts the full article.',
    next: {
      text: 'Next: Generate Custom Images with JetImage',
      articleId: 'create-publish/jetimage',
    },
  },
  'create-publish/jetimage': {
    title: 'JetImage: AI Image Generator',
    what: 'JetImage generates custom, high-quality marketing images and visuals that match your Brand DNA colors and style.',
    why: 'Custom visuals look more professional than generic stock photos and increase engagement on social media and ads.',
    when: 'Use this whenever you need a unique visual for a blog post, social post, or ad campaign.',
    skip: 'Using generic stock photos makes your brand look cheap and unoriginal.',
    how: 'Enter a prompt describing the image, select the aspect ratio, and generate the visual.',
    next: {
      text: 'Next: Manage Reviews with JetReply',
      articleId: 'engage-convert/jetreply',
    },
  },

  // --- ENGAGE & CONVERT ---
  'engage-convert/jetreply': {
    title: 'JetReply: Review Response Assistant',
    what: 'JetReply automatically fetches your Google reviews, detects sentiment, and drafts professional, on-brand responses.',
    why: 'Responding to reviews builds trust with potential customers and improves your local SEO ranking signals.',
    when: 'Use this weekly to ensure all new reviews are addressed promptly.',
    skip: 'Ignoring reviews damages your reputation and signals to Google that your business is inactive.',
    how: 'Connect your GBP. Select a review, and JetReply generates a tailored response for you to copy and paste.',
    next: {
      text: 'Next: Display Reviews with JetTrust',
      articleId: 'engage-convert/jettrust',
    },
  },
  'engage-convert/jettrust': {
    title: 'JetTrust: Review Widget Generator',
    what: 'JetTrust creates embeddable review widgets (carousel, grid, list) to display your best Google reviews on your website.',
    why: 'Social proof is the #1 conversion factor. Displaying reviews on your site increases visitor trust and conversion rates.',
    when: 'Use this immediately after connecting your GBP and collecting a few positive reviews.',
    skip: 'Hiding your social proof means losing potential customers who need that final push of confidence.',
    how: 'Select your layout and star filter. JetTrust generates the copy-paste code for your website.',
    next: {
      text: 'Next: Find Leads with JetLeads',
      articleId: 'engage-convert/jetleads',
    },
  },
  'engage-convert/jetleads': {
    title: 'JetLeads: Lead Discovery',
    what: 'JetLeads identifies potential customers in your local area who are actively searching for your services on public forums and social media.',
    why: 'Proactive lead generation accelerates growth by finding high-intent customers before your competitors do.',
    when: 'Use this weekly to maintain a consistent flow of high-quality, warm leads.',
    skip: 'Relying only on inbound traffic means missing out on immediate, high-value opportunities.',
    how: 'JetLeads scans public platforms based on your service and location, providing actionable outreach strategies.',
    next: {
      text: 'Next: Plan Promotions with JetEvents',
      articleId: 'engage-convert/jetevents',
    },
  },
  'engage-convert/jetevents': {
    title: 'JetEvents: Event & Promotion Ideas',
    what: 'JetEvents brainstorms creative local events, seasonal promotions, and community engagement strategies tailored to your business.',
    why: 'Local events drive foot traffic, build community ties, and generate valuable local media coverage.',
    when: 'Use this quarterly for seasonal planning or before slow business periods.',
    skip: 'Without proactive promotions, your business relies solely on organic search, missing out on immediate revenue boosts.',
    how: 'Enter your business type and goal. JetEvents provides a list of actionable event concepts and marketing plans.',
    next: {
      text: 'Next: Generate Ad Copy with JetAds',
      articleId: 'engage-convert/jetads',
    },
  },
  'engage-convert/jetads': {
    title: 'JetAds: Ad Copy Generator',
    what: 'JetAds generates compelling ad copy (headlines, descriptions, CTAs) optimized for Google and Facebook campaigns.',
    why: 'High-converting ad copy increases your click-through rate (CTR) and lowers your cost per acquisition (CPA).',
    when: 'Use this before launching any paid advertising campaign.',
    skip: 'Poor ad copy wastes your ad budget and leads to low conversion rates.',
    how: 'Enter your product or offer. JetAds generates multiple ad variations for you to test.',
    next: {
      text: 'Next: Manage Your Weekly Growth Plan',
      articleId: 'growth-control/growthplan',
    },
  },

  // --- GROWTH CONTROL ---
  'growth-control/growthplan': {
    title: 'Growth Plan: Your Weekly Action List',
    what: 'The Growth Plan is your prioritized, sequenced checklist of 3-5 high-impact tasks generated from all JetSuite tools.',
    why: 'It eliminates decision fatigue and ensures you focus only on the actions that will move your Growth Score and business forward.',
    when: 'Check this daily and complete tasks weekly.',
    skip: 'Ignoring the Growth Plan means you are guessing what to do next, leading to inconsistent results.',
    how: 'Tasks are automatically added when you run audits (JetBiz, JetViz, etc.). Mark them complete to track progress.',
    next: {
      text: 'Next: View Your Growth Score History',
      articleId: 'getting-started/growth-score',
    },
  },
};