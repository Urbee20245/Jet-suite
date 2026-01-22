import React from 'react';
import type { Tool, ProfileData, ReadinessState, Plan } from '../types';
import { 
    ChartBarIcon, 
    GlobeAltIcon, 
    MagnifyingGlassIcon, 
    UserGroupIcon,
    SparklesIcon,
    ShareIcon,
    PhotoIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    UserPlusIcon,
    ShieldCheckIcon,
    CalendarIcon,
    MegaphoneIcon
} from '../components/icons/MiniIcons';

interface WelcomeProps {
    setActiveTool: (tool: Tool | null, articleId?: string) => void;
    profileData: ProfileData | null;
    readinessState: ReadinessState;
    plan: Plan;
    growthScore: number;
    pendingTasksCount: number;
    reviewResponseRate: number;
}

interface QuickStat {
    label: string;
    value: string | number;
    color: string;
    icon: React.ReactNode;
}

const QuickStatsCards: React.FC<{ stats: QuickStat[] }> = ({ stats }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
            <div key={index} className="bg-brand-card rounded-xl p-6 border border-brand-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                    <div className={`${stat.color} p-2 rounded-lg`}>
                        {stat.icon}
                    </div>
                </div>
                <p className="text-2xl font-bold text-brand-text">{stat.value}</p>
                <p className="text-sm text-brand-text-muted">{stat.label}</p>
            </div>
        ))}
    </div>
);

interface ToolCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    colorClass: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, onClick, colorClass }) => (
    <button
        onClick={onClick}
        className="bg-brand-card rounded-xl p-6 border border-brand-border shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200 text-left group"
    >
        <div className={`${colorClass} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <h3 className="font-bold text-brand-text mb-2">{title}</h3>
        <p className="text-sm text-brand-text-muted line-clamp-2">{description}</p>
    </button>
);

const SectionHeader: React.FC<{ number: number; title: string; subtitle: string; color: string }> = ({ number, title, subtitle, color }) => (
    <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
            <div className={`${color} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm`}>
                {number}
            </div>
            <h2 className="text-2xl font-bold text-brand-text">{title}</h2>
        </div>
        <p className="text-brand-text-muted ml-11">{subtitle}</p>
    </div>
);

export const Welcome: React.FC<WelcomeProps> = ({ 
    setActiveTool, 
    profileData, 
    readinessState, 
    plan, 
    growthScore, 
    pendingTasksCount,
    reviewResponseRate 
}) => {
    const stats: QuickStat[] = [
        {
            label: 'Growth Score',
            value: growthScore,
            color: 'bg-gradient-to-br from-yellow-400 to-orange-500',
            icon: <SparklesIcon className="w-5 h-5 text-white" />
        },
        {
            label: 'GBP Rating',
            value: profileData?.googleBusiness?.rating ? `${profileData.googleBusiness.rating} ★` : 'N/A',
            color: 'bg-gradient-to-br from-blue-400 to-blue-600',
            icon: <GlobeAltIcon className="w-5 h-5 text-white" />
        },
        {
            label: 'Review Health',
            value: `${reviewResponseRate}%`,
            color: 'bg-gradient-to-br from-green-400 to-emerald-600',
            icon: <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
        },
        {
            label: 'Pending Items',
            value: pendingTasksCount,
            color: 'bg-gradient-to-br from-purple-400 to-pink-500',
            icon: <ChartBarIcon className="w-5 h-5 text-white" />
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold text-brand-text mb-2">
                    Welcome back, {profileData?.user.firstName || 'there'}!
                </h1>
                <p className="text-lg text-brand-text-muted">
                    {profileData?.business.business_name || 'Your Business'} • Command Center
                </p>
            </div>

            {/* Quick Stats */}
            <QuickStatsCards stats={stats} />

            {/* Next Best Action */}
            {readinessState !== 'Foundation Ready' && (
                <div className="bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border-2 border-accent-purple/30 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">ℹ️</div>
                        <div>
                            <h3 className="font-bold text-lg text-brand-text mb-2">Next Best Action</h3>
                            <p className="text-brand-text-muted mb-4">
                                Your first step is to complete your Business Profile. This is the foundation that powers every tool on the platform.
                            </p>
                            <button
                                onClick={() => setActiveTool({ id: 'businessdetails', name: 'Business Details', category: 'foundation' })}
                                className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                Go to Business Details →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Section 1: Business Foundation */}
            <div>
                <SectionHeader 
                    number={1} 
                    title="Business Foundation" 
                    subtitle="Get found and build trust by optimizing your online presence."
                    color="bg-purple-500"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ToolCard
                        icon={<ChartBarIcon className="w-6 h-6 text-white" />}
                        title="JetBiz"
                        description="Analyze & optimize your Google Business Profile for higher ranking."
                        onClick={() => setActiveTool({ id: 'jetbiz', name: 'JetBiz', category: 'analyze' })}
                        colorClass="bg-purple-500"
                    />
                    <ToolCard
                        icon={<GlobeAltIcon className="w-6 h-6 text-white" />}
                        title="JetViz"
                        description="Get an AI-powered audit of your website for design & SEO."
                        onClick={() => setActiveTool({ id: 'jetviz', name: 'JetViz', category: 'analyze' })}
                        colorClass="bg-purple-500"
                    />
                    <ToolCard
                        icon={<MagnifyingGlassIcon className="w-6 h-6 text-white" />}
                        title="JetKeywords"
                        description="Discover the best local keywords to attract more customers online."
                        onClick={() => setActiveTool({ id: 'jetkeywords', name: 'JetKeywords', category: 'analyze' })}
                        colorClass="bg-purple-500"
                    />
                    <ToolCard
                        icon={<UserGroupIcon className="w-6 h-6 text-white" />}
                        title="JetCompete"
                        description="Analyze your local competitors and find opportunities to stand out."
                        onClick={() => setActiveTool({ id: 'jetcompete', name: 'JetCompete', category: 'analyze' })}
                        colorClass="bg-purple-500"
                    />
                </div>
            </div>

            {/* Section 2: Marketing & Brand */}
            <div>
                <SectionHeader 
                    number={2} 
                    title="Marketing and Brand Strategy" 
                    subtitle="Turn strategy into on-brand content that attracts customers."
                    color="bg-blue-500"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ToolCard
                        icon={<SparklesIcon className="w-6 h-6 text-white" />}
                        title="JetCreate"
                        description="Create stunning, on-brand marketing campaigns and assets."
                        onClick={() => setActiveTool({ id: 'jetcreate', name: 'JetCreate', category: 'create' })}
                        colorClass="bg-blue-500"
                    />
                    <ToolCard
                        icon={<ShareIcon className="w-6 h-6 text-white" />}
                        title="JetSocial"
                        description="Generate engaging social media posts for your business."
                        onClick={() => setActiveTool({ id: 'jetsocial', name: 'JetSocial', category: 'create' })}
                        colorClass="bg-blue-500"
                    />
                    <ToolCard
                        icon={<PhotoIcon className="w-6 h-6 text-white" />}
                        title="JetImage"
                        description="Generate high-quality images for your marketing materials."
                        onClick={() => setActiveTool({ id: 'jetimage', name: 'JetImage', category: 'create' })}
                        colorClass="bg-blue-500"
                    />
                    <ToolCard
                        icon={<DocumentTextIcon className="w-6 h-6 text-white" />}
                        title="JetContent"
                        description="Create SEO-friendly blog posts and articles for your website."
                        onClick={() => setActiveTool({ id: 'jetcontent', name: 'JetContent', category: 'create' })}
                        colorClass="bg-blue-500"
                    />
                </div>
            </div>

            {/* Section 3: Customer Engagement */}
            <div>
                <SectionHeader 
                    number={3} 
                    title="Customer Engagement" 
                    subtitle="Build relationships and grow your customer base."
                    color="bg-pink-500"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ToolCard
                        icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />}
                        title="JetReply"
                        description="Auto-generate professional responses to customer reviews."
                        onClick={() => setActiveTool({ id: 'jetreply', name: 'JetReply', category: 'engage' })}
                        colorClass="bg-pink-500"
                    />
                    <ToolCard
                        icon={<UserPlusIcon className="w-6 h-6 text-white" />}
                        title="JetLeads"
                        description="Capture and nurture leads with automated follow-ups."
                        onClick={() => setActiveTool({ id: 'jetleads', name: 'JetLeads', category: 'engage' })}
                        colorClass="bg-pink-500"
                    />
                    <ToolCard
                        icon={<ShieldCheckIcon className="w-6 h-6 text-white" />}
                        title="JetTrust"
                        description="Manage your online reputation and collect more reviews."
                        onClick={() => setActiveTool({ id: 'jettrust', name: 'JetTrust', category: 'engage' })}
                        colorClass="bg-pink-500"
                    />
                    <ToolCard
                        icon={<CalendarIcon className="w-6 h-6 text-white" />}
                        title="JetEvents"
                        description="Create and promote local events to attract customers."
                        onClick={() => setActiveTool({ id: 'jetevents', name: 'JetEvents', category: 'engage' })}
                        colorClass="bg-pink-500"
                    />
                    <ToolCard
                        icon={<MegaphoneIcon className="w-6 h-6 text-white" />}
                        title="JetAds"
                        description="Launch targeted ad campaigns to reach your ideal customers."
                        onClick={() => setActiveTool({ id: 'jetads', name: 'JetAds', category: 'engage' })}
                        colorClass="bg-pink-500"
                    />
                </div>
            </div>
        </div>
    );
};