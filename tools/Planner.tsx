import React, { useState, useEffect } from 'react';
import type { GrowthPlanTask, ScheduledPost, CalendarDay } from '../types';
import { getScheduledPosts, PLATFORM_INFO } from '../services/socialMediaService';
import { generateNextNDays } from '../utils/dateTimeUtils';
import { Loader } from '../components/Loader';
import { CheckCircleIcon } from '../components/icons/MiniIcons';
import { GrowthPlanIcon } from '../components/icons/ToolIcons';

interface PlannerProps {
  userId: string;
  growthPlanTasks: GrowthPlanTask[];
}

interface PlannerCalendarDay extends CalendarDay {
  tasks: GrowthPlanTask[];
}

export const Planner: React.FC<PlannerProps> = ({ userId, growthPlanTasks }) => {
  const [calendarDays, setCalendarDays] = useState<PlannerCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlannerData();
  }, [userId, growthPlanTasks]);

  const loadPlannerData = async () => {
    try {
      setLoading(true);
      
      const days = generateNextNDays(7).map(d => ({ ...d, tasks: [] })) as PlannerCalendarDay[];
      const startDate = days[0].dateString;
      const endDate = days[days.length - 1].dateString;

      const posts = await getScheduledPosts(userId, startDate, endDate);

      posts.forEach(post => {
        const day = days.find(d => d.dateString === post.scheduled_date);
        if (day) {
          day.posts.push(post);
        }
      });

      setCalendarDays(days);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pendingTasks = growthPlanTasks.filter(t => t.status !== 'completed');

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 p-4 bg-red-100 rounded-lg">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="bg-brand-card p-6 sm:p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-brand-text">Your Growth Planner</h1>
        <p className="text-lg text-brand-text-muted mt-1">A unified view of your scheduled posts and growth tasks for the next 7 days.</p>
      </div>

      <div className="bg-brand-card p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-brand-text mb-4">This Week's Growth Tasks ({pendingTasks.length})</h2>
        {pendingTasks.length > 0 ? (
          <div className="space-y-3">
            {pendingTasks.map(task => (
              <div key={task.id} className="bg-brand-light p-3 rounded-lg border border-brand-border flex items-center gap-3">
                <GrowthPlanIcon className="w-5 h-5 text-accent-purple flex-shrink-0" />
                <p className="text-sm font-medium text-brand-text flex-1">{task.title}</p>
                <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">{task.effort} Effort</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brand-text-muted">All growth tasks are complete! 🎉</p>
        )}
      </div>

      <div className="bg-brand-card p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-brand-text mb-4">7-Day Post Schedule</h2>
        <div className="space-y-4">
          {calendarDays.map(day => (
            <div key={day.dateString} className={`p-4 rounded-lg ${day.isToday ? 'bg-accent-purple/5 border border-accent-purple' : 'bg-brand-light border border-brand-border'}`}>
              <div className="flex items-baseline gap-3 mb-3">
                <h3 className="font-bold text-brand-text">{day.date.toLocaleDateString('en-US', { weekday: 'long' })}</h3>
                <p className="text-sm text-brand-text-muted">{day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
              {day.posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {day.posts.map(post => (
                    <div key={post.id} className="bg-white p-3 rounded-md border border-brand-border">
                      <p className="text-xs text-brand-text line-clamp-2">{post.post_text}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-brand-text-muted">
                        {post.platforms.map(p => <span key={p.platform}>{PLATFORM_INFO[p.platform]?.icon}</span>)}
                        <span>•</span>
                        <span>{post.scheduled_time || 'All day'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-brand-text-muted italic">No posts scheduled.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};