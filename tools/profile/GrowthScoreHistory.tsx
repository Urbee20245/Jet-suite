
import React from 'react';
import { GrowthScoreIcon } from '../../components/icons/ToolIcons';
import { BoltIcon, CheckCircleIcon, InformationCircleIcon } from '../../components/icons/MiniIcons';
import type { ProfileData } from '../../types';

interface GrowthScoreHistoryProps {
    growthScore: number;
    profileData: ProfileData;
}

const getScoreLevel = (score: number) => {
  if (score >= 85) return { level: 'Growth Optimized', color: 'text-green-500', bgColor: 'bg-green-500' };
  if (score >= 70) return { level: 'Strong Foundation', color: 'text-blue-500', bgColor: 'bg-blue-500' };
  if (score >= 50) return { level: 'Building Momentum', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
  if (score >= 30) return { level: 'Getting Started', color: 'text-orange-500', bgColor: 'bg-orange-500' };
  return { level: 'Just Beginning', color: 'text-red-500', bgColor: 'bg-red-500' };
};

export const GrowthScoreHistory: React.FC<GrowthScoreHistoryProps> = ({ growthScore, profileData }) => {
  const scoreLevel = getScoreLevel(growthScore);
  const targetScore = 85; // "Growth Optimized" target
  const maxScore = 95; // Theoretical max (never 100%)
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
                            <>🎉 Goal achieved! Keep engaging to maintain momentum</>
                        ) : (
                            <>{targetScore - growthScore} points to "Growth Optimized"</>
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
                    A score of <strong className="text-brand-text">85 or above</strong> means your marketing foundation is strong and you're actively engaging customers. This is the optimal operating range for sustainable growth.
                </p>
                
                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore < 30 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">0-29: Just Beginning</p>
                            <p className="text-xs text-brand-text-muted">Complete your profile and connect Google Business</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore >= 30 && growthScore < 50 ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">30-49: Getting Started</p>
                            <p className="text-xs text-brand-text-muted">Run foundation audits (JetBiz, JetViz)</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore >= 50 && growthScore < 70 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">50-69: Building Momentum</p>
                            <p className="text-xs text-brand-text-muted">Start creating content regularly</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore >= 70 && growthScore < 85 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">70-84: Strong Foundation</p>
                            <p className="text-xs text-brand-text-muted">Engage with reviews and leads consistently</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className={`w-3 h-3 rounded-full mt-1 ${growthScore >= 85 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-brand-text">85+: Growth Optimized ⭐</p>
                            <p className="text-xs text-brand-text-muted">Maintain momentum with ongoing engagement</p>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Foundation (40 points max) */}
                <div className="bg-brand-light p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-brand-text">Foundation</h4>
                        <span className="text-sm font-semibold text-accent-purple">40 points</span>
                    </div>
                    <p className="text-xs text-brand-text-muted mb-4">
                        One-time setup tasks that establish your online presence
                    </p>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className={`w-4 h-4 ${profileData.googleBusiness.status === 'Verified' ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className="text-brand-text-muted">Google Business Profile (+15)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className={`w-4 h-4 ${profileData.business.isDnaApproved ? 'text-green-500' : 'text-gray-300'}`} />
                            <span className="text-brand-text-muted">Business DNA Setup (+10)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-gray-300" />
                            <span className="text-brand-text-muted">Initial Audits Complete (+15)</span>
                        </div>
                    </div>
                </div>

                {/* Create & Publish (30 points max) */}
                <div className="bg-brand-light p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-brand-text">Create & Publish</h4>
                        <span className="text-sm font-semibold text-accent-pink">30 points</span>
                    </div>
                    <p className="text-xs text-brand-text-muted mb-4">
                        Recurring content creation and publishing activities
                    </p>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-gray-300" />
                            <span className="text-brand-text-muted">Weekly content creation (+10)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-gray-300" />
                            <span className="text-brand-text-muted">Campaign launches (+10)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-gray-300" />
                            <span className="text-brand-text-muted">Consistency bonus (+10)</span>
                        </div>
                    </div>
                </div>

                {/* Engage & Convert (25 points max) */}
                <div className="bg-brand-light p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-brand-text">Engage & Convert</h4>
                        <span className="text-sm font-semibold text-accent-blue">25 points</span>
                    </div>
                    <p className="text-xs text-brand-text-muted mb-4">
                        Ongoing customer engagement and conversion activities
                    </p>
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-gray-300" />
                            <span className="text-brand-text-muted">Review responses (+10)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-gray-300" />
                            <span className="text-brand-text-muted">Lead follow-ups (+8)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-gray-300" />
                            <span className="text-brand-text-muted">Engagement activity (+7)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-accent-purple/5 to-accent-pink/5 rounded-lg border-l-4 border-accent-purple">
                <p className="text-sm text-brand-text">
                    <strong className="text-accent-purple">Total Possible:</strong> 95 points
                </p>
                <p className="text-xs text-brand-text-muted mt-2">
                    <strong>Why not 100?</strong> Marketing is never "complete." Customer engagement, review responses, and content creation are ongoing activities. Your score reflects active, sustained effort—not a finish line. A score of 85+ means you're in the optimal zone for growth.
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
