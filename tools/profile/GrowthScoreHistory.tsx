import React from 'react';
import { GrowthScoreIcon } from '../../components/icons/ToolIcons';
import { BoltIcon, CheckCircleIcon, InformationCircleIcon } from '../../components/icons/MiniIcons';
import type { ProfileData } from '../../types';

interface GrowthScoreHistoryProps {
    growthScore: number;
    profileData: ProfileData;
}

const getScoreLevel = (score: number) => {
  if (score >= 80) return { level: 'Growth Optimized', color: 'text-green-500', bgColor: 'bg-green-500' };
  if (score >= 60) return { level: 'Strong Foundation', color: 'text-blue-500', bgColor: 'bg-blue-500' };
  if (score >= 40) return { level: 'Building Momentum', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
  if (score >= 20) return { level: 'Getting Started', color: 'text-orange-500', bgColor: 'bg-orange-500' };
  return { level: 'Just Beginning', color: 'text-red-500', bgColor: 'bg-red-500' };
};

export const GrowthScoreHistory: React.FC<GrowthScoreHistoryProps> = ({ growthScore, profileData }) => {
  const scoreLevel = getScoreLevel(growthScore);
  const targetScore = 80; // "Growth Optimized" target
  const maxScore = 100; // Benchmark (never actually achievable - real max is 99)
  const progressToTarget = Math.min((growthScore / targetScore) * 100, 100);
  
  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <GrowthScoreIcon className="w-8 h-8 text-accent-purple" />
                    <div className="ml-4">
                        <h2 className="text-2xl font-bold text-brand-text">Growth Score</h2>
                        <p className="text-brand-text-muted">Your real-time measure of marketing effectiveness</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Current Score & Progress to Target */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Score Card */}
            <div className="bg-brand-card p-8 rounded-xl shadow-lg text-center">
                <h3 className="text-sm font-semibold text-brand-text-muted uppercase tracking-wide mb-2">Current Score</h3>
                <div className="flex items-center justify-center my-4">
                    <BoltIcon className="w-12 h-12 text-yellow-500" />
                    <span className="text-7xl font-extrabold text-brand-text ml-2">{growthScore}</span>
                    <span className="text-2xl text-brand-text-muted ml-1">/{maxScore}</span>
                </div>
                <div className={`inline-block px-4 py-2 rounded-full ${scoreLevel.bgColor} bg-opacity-10 mb-4`}>
                    <span className={`font-bold ${scoreLevel.color}`}>{scoreLevel.level}</span>
                </div>
                
                {/* Progress Bar to Target */}
                <div className="mt-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-brand-text-muted">Progress to Goal</span>
                        <span className="font-bold text-brand-text">{Math.round(progressToTarget)}%</span>
                    </div>
                    <div className="w-full bg-brand-light rounded-full h-4 overflow-hidden">
                        <div 
                            className={`h-full ${scoreLevel.bgColor} transition-all duration-500`}
                            style={{ width: `${progressToTarget}%` }}
                        />
                    </div>
                <p className="text-xs text-brand-text-muted mt-2">
                    {growthScore >= targetScore ? (
                        <>🎉 Goal achieved! Keep completing tasks to maintain momentum</>
                    ) : (
                        <>{targetScore - growthScore} points to "Growth Optimized" (complete more tasks)</>
                    )}
                </p>
                </div>
            </div>

            {/* Target Goal Explanation */}
            <div className="bg-gradient-to-br from-accent-purple/5 to-accent-blue/5 p-8 rounded-xl shadow-lg border-2 border-accent-purple/20">
                <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                    <InformationCircleIcon className="w-6 h-6 text-accent-purple" />
                    Your Target: 85 Points
                </h3>
                <p className="text-sm text-brand-text-muted mb-4">
                    A score of <strong className="text-brand-text">80 or above</strong> means your foundation is strong and you're actively completing tasks and engaging customers. This is the optimal operating range for sustainable growth.
                </p>
                
                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore < 20 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">0-19: Just Beginning</p>
                            <p className="text-xs text-brand-text-muted">Complete your profile and start completing tasks</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore >= 20 && growthScore < 40 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">20-39: Getting Started</p>
                            <p className="text-xs text-brand-text-muted">Foundation set up, now complete growth plan tasks</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore >= 40 && growthScore < 60 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">40-59: Building Momentum</p>
                            <p className="text-xs text-brand-text-muted">Regularly complete tasks and create content</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore >= 60 && growthScore < 80 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">60-79: Strong Foundation</p>
                            <p className="text-xs text-brand-text-muted">Consistent task completion and engagement</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore >= 80 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">80-99: Growth Optimized ⭐</p>
                            <p className="text-xs text-brand-text-muted">Excellent! Keep completing tasks to maintain momentum</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/50 p-4 rounded-lg border border-accent-purple/20">
                    <p className="text-xs text-brand-text-muted">
                        <strong className="text-accent-purple">Note:</strong> Your score will fluctuate naturally as you engage with customers, respond to reviews, and complete weekly tasks. This is healthy—growth is continuous, not static.
                    </p>
                </div>
            </div>
        </div>

        {/* How Your Score is Calculated */}
        <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-brand-text mb-4">How Your Score is Calculated</h3>
            <p className="text-sm text-brand-text-muted mb-6">
                Your Growth Score is a weighted measure of three key areas. Each area contributes to your overall score based on completion and consistency.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Foundation Setup (35 points max) */}
                <div className="bg-brand-light p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-brand-text">Foundation Setup</h4>
                        <span className="text-sm font-semibold text-accent-purple">35 points</span>
                    </div>
                    <p className="text-xs text-brand-text-muted mb-4">
                        One-time setup that unlocks the platform
                    </p>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className={`w-4 h-4 ${profileData.business.business_name && profileData.business.location && profileData.business.business_website ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className="text-brand-text-muted">Business Profile Complete (+10)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className={`w-4 h-4 ${profileData.business.isDnaApproved ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className="text-brand-text-muted">Brand DNA Approved (+10)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className={`w-4 h-4 ${profileData.googleBusiness.status === 'Verified' ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className="text-brand-text-muted">Google Business Verified (+15)</span>
                        </div>
                    </div>
                </div>

                {/* Task Completion (65 points max) - THE MAIN DRIVER */}
                <div className="bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 p-6 rounded-lg border-2 border-accent-purple/30">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-brand-text">Task Completion</h4>
                        <span className="text-sm font-semibold text-accent-pink">65 points</span>
                    </div>
                    <p className="text-xs text-brand-text-muted mb-4">
                        🎯 <strong>This is the main driver of your score!</strong>
                    </p>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-brand-text-muted">✓ Each completed task: <strong>+5 points</strong> (max 50)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-brand-text-muted">⚡ In-progress tasks: <strong>+2 points</strong> (max 10)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-brand-text-muted">🔥 Consistency bonus: <strong>+5 points</strong></span>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-white/60 rounded">
                        <p className="text-xs text-brand-text-muted">
                            Tasks are added to your Growth Plan when you use tools like JetBiz, JetViz, etc. Complete them to increase your score!
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-accent-purple/5 to-accent-pink/5 rounded-lg border-l-4 border-accent-purple">
                <p className="text-sm text-brand-text mb-2">
                    <strong className="text-accent-purple">Scoring System:</strong>
                </p>
                <ul className="text-xs text-brand-text-muted space-y-1 list-disc list-inside">
                    <li><strong>0-19 points:</strong> Just beginning - Focus on foundation setup</li>
                    <li><strong>20-39 points:</strong> Foundation ready - Start completing growth plan tasks</li>
                    <li><strong>40-59 points:</strong> Building momentum - Keep up the task completion</li>
                    <li><strong>60-79 points:</strong> Strong foundation - Consistent task completion</li>
                    <li><strong>80-99 points:</strong> Growth optimized - You're in the zone! 🎉</li>
                </ul>
                <p className="text-xs text-brand-text-muted mt-3">
                    <strong>Why max 99 and not 100?</strong> Marketing requires continuous effort. Reaching 100 would imply "completion," but business growth is ongoing. The benchmark of 100 reminds you there's always more to do, keeping you engaged and your score responsive to your actual activity level.
                </p>
            </div>
        </div>

        {/* Why Your Score Changes */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 p-6 rounded-xl shadow-lg border-2 border-yellow-400/30">
            <h3 className="text-lg font-bold text-brand-text mb-3 flex items-center gap-2">
                💡 Why Your Score Fluctuates
            </h3>
            <p className="text-sm text-brand-text-muted mb-4">
                Your Growth Score is <strong>designed to move</strong>. It's not a one-time achievement—it reflects your current momentum.
            </p>
            <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                        <p className="font-semibold text-brand-text">Score Goes Up When You:</p>
                        <ul className="list-disc list-inside text-brand-text-muted text-xs mt-1 space-y-1">
                            <li>Complete growth plan tasks</li>
                            <li>Respond to new reviews</li>
                            <li>Publish content or campaigns</li>
                            <li>Maintain weekly consistency</li>
                        </ul>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <span className="text-2xl">📉</span>
                    <div>
                        <p className="font-semibold text-brand-text">Score Decreases When:</p>
                        <ul className="list-disc list-inside text-brand-text-muted text-xs mt-1 space-y-1">
                            <li>Engagement activities become inconsistent</li>
                            <li>Reviews go unanswered</li>
                            <li>Content creation stops for extended periods</li>
                            <li>Weekly tasks are incomplete</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="mt-4 p-3 bg-white/60 rounded-lg">
                <p className="text-xs text-brand-text-muted">
                    <strong className="text-brand-text">The Goal:</strong> Maintain a score of 85+ by staying consistent with customer engagement and content creation. Think of it like fitness—you can't "complete" being healthy, but you can sustain it through regular activity.
                </p>
            </div>
        </div>
    </div>
  );
};