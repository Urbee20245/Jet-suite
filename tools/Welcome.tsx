import React from 'react';
import type { Tool, ProfileData, ReadinessState } from '../types';
import { 
    SparklesIcon,
    GlobeAltIcon,
    PhotoIcon,
    ChatBubbleLeftRightIcon,
    ArrowRightIcon
} from '../components/icons/MiniIcons';

interface WelcomeProps {
    setActiveTool: (tool: Tool | null, articleId?: string) => void;
    profileData: ProfileData;
    readinessState: ReadinessState;
    plan: { name: string; profileLimit: number };
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
            icon: <SparklesIcon className="w-5 h-5 text-white" />
        }
    ];

    // Get all tools for card layout
    const foundationTools = [
        { id: 'jetbiz', name: 'JetBiz', description: 'Analyze & optimize your Google Business Profile', icon: GlobeAltIcon },
        { id: 'jetviz', name: 'JetViz', description: 'Get an AI audit of your website', icon: GlobeAltIcon },
        { id: 'jetkeywords', name: 'JetKeywords', description: 'Discover best local keywords', icon: SparklesIcon },
        { id: 'jetcompete', name: 'JetCompete', description: 'Analyze local competitors', icon: SparklesIcon }
    ];

    const marketingTools = [
        { id: 'jetcreate', name: 'JetCreate', description: 'Create on-brand campaigns', icon: SparklesIcon },
        { id: 'jetsocial', name: 'JetSocial', description: 'Generate social posts', icon: SparklesIcon },
        { id: 'jetimage', name: 'JetImage', description: 'Generate marketing images', icon: PhotoIcon },
        { id: 'jetcontent', name: 'JetContent', description: 'Create SEO blog posts', icon: SparklesIcon }
    ];

    const engagementTools = [
        { id: 'jetreply', name: 'JetReply', description: 'Auto-reply to reviews', icon: ChatBubbleLeftRightIcon },
        { id: 'jetleads', name: 'JetLeads', description: 'Capture and nurture leads', icon: SparklesIcon },
        { id: 'jettrust', name: 'JetTrust', description: 'Manage online reputation', icon: SparklesIcon },
        { id: 'jetevents', name: 'JetEvents', description: 'Promote local events', icon: SparklesIcon },
        { id: 'jetads', name: 'JetAds', description: 'Launch ad campaigns', icon: SparklesIcon }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold text-brand-text mb-2">
                    Welcome back, {profileData?.user.firstName || 'there'}!
                </h1>
                <p className="text-lg text-brand-text-muted">
                    {profileData?.business.business_name || 'Your Business'} • Command Center
                </p>
            </div>

            <QuickStatsCards stats={stats} />

            {readinessState !== 'Foundation Ready' && (
                <div className="bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border-2 border-accent-purple/30 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">ℹ️</div>
                        <div>
                            <h3 className="font-bold text-lg text-brand-text mb-2">Next Best Action</h3>
                            <p className="text-brand-text-muted mb-4">
                                Complete your Business Profile to unlock all platform features.
                            </p>
                            <button
                                onClick={() => setActiveTool({ id: 'businessdetails', name: 'Business Details', category: 'foundation' })}
                                className="bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                            >
                                Go to Business Details <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <SectionHeader 
                    number={1} 
                    title="Business Foundation" 
                    subtitle="Get found and build trust by optimizing your online presence."
                    color="bg-purple-500"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {foundationTools.map(tool => (
                        <ToolCard
                            key={tool.id}
                            icon={<tool.icon className="w-6 h-6 text-white" />}
                            title={tool.name}
                            description={tool.description}
                            onClick={() => setActiveTool({ id: tool.id, name: tool.name, category: 'analyze' })}
                            colorClass="bg-purple-500"
                        />
                    ))}
                </div>
            </div>

            <div>
                <SectionHeader 
                    number={2} 
                    title="Marketing & Brand Strategy" 
                    subtitle="Turn strategy into on-brand content that attracts customers."
                    color="bg-blue-500"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {marketingTools.map(tool => (
                        <ToolCard
                            key={tool.id}
                            icon={<tool.icon className="w-6 h-6 text-white" />}
                            title={tool.name}
                            description={tool.description}
                            onClick={() => setActiveTool({ id: tool.id, name: tool.name, category: 'create' })}
                            colorClass="bg-blue-500"
                        />
                    ))}
                </div>
            </div>

            <div>
                <SectionHeader 
                    number={3} 
                    title="Customer Engagement" 
                    subtitle="Build relationships and grow your customer base."
                    color="bg-pink-500"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {engagementTools.map(tool => (
                        <ToolCard
                            key={tool.id}
                            icon={<tool.icon className="w-6 h-6 text-white" />}
                            title={tool.name}
                            description={tool.description}
                            onClick={() => setActiveTool({ id: tool.id, name: tool.name, category: 'engage' })}
                            colorClass="bg-pink-500"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};