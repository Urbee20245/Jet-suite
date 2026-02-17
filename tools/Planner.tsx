import React, { useState, useEffect } from 'react';
import type { GrowthPlanTask, ScheduledPost, CalendarDay, PostStatus } from '../types';
import { getScheduledPosts, PLATFORM_INFO } from '../services/socialMediaService';
import { Loader } from '../components/Loader';
import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon, BoltIcon, ChartBarIcon, ArrowRightIcon, PlusIcon } from '../components/icons/MiniIcons';
import { GrowthPlanIcon } from '../components/icons/ToolIcons';

interface PlannerProps {
  userId: string;
  growthPlanTasks: GrowthPlanTask[];
  onTaskScheduleDate: (taskId: string, scheduledDate: string | null) => void;
  onTaskStatusChange: (taskId: string, newStatus: GrowthPlanTask['status']) => void;
}

interface PlannerCalendarDay extends CalendarDay {
  tasks: GrowthPlanTask[];
}

const POST_STATUS_STYLES: Record<PostStatus, { dot: string; bg: string; text: string }> = {
  scheduled: { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  posting: { dot: 'bg-blue-400 animate-pulse', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  posted: { dot: 'bg-green-500', bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  failed: { dot: 'bg-red-500', bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  draft: { dot: 'bg-gray-400', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
  cancelled: { dot: 'bg-gray-300', bg: 'bg-gray-50 border-gray-200', text: 'text-gray-500' },
};

const EFFORT_COLORS: Record<string, string> = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-red-100 text-red-800',
};

// Generate monthly calendar days
const generateMonthlyCalendar = (year: number, month: number): CalendarDay[] => {
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get first day of month and number of days in month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get day of week for first day (0 = Sunday)
  const startingDayOfWeek = firstDay.getDay();

  // Add days from previous month to fill the first week
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      dateString: date.toISOString().split('T')[0],
      isToday: date.getTime() === today.getTime(),
      posts: [],
    });
  }

  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      dateString: date.toISOString().split('T')[0],
      isToday: date.getTime() === today.getTime(),
      posts: [],
    });
  }

  // Add days from next month to fill the last week
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dateString: date.toISOString().split('T')[0],
        isToday: date.getTime() === today.getTime(),
        posts: [],
      });
    }
  }

  return days;
};

export const Planner: React.FC<PlannerProps> = ({ userId, growthPlanTasks, onTaskScheduleDate, onTaskStatusChange }) => {
  const [calendarDays, setCalendarDays] = useState<PlannerCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTasksDropdown, setShowTasksDropdown] = useState(true);

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    loadPlannerData();
  }, [userId, growthPlanTasks, currentYear, currentMonth]);

  const loadPlannerData = async () => {
    try {
      setLoading(true);

      // Generate monthly calendar
      const days = generateMonthlyCalendar(currentYear, currentMonth).map(d => ({ ...d, tasks: [] })) as PlannerCalendarDay[];

      // Fetch ALL scheduled posts for the month (not just 7 days)
      const startDate = days[0].dateString;
      const endDate = days[days.length - 1].dateString;
      const posts = await getScheduledPosts(userId, startDate, endDate);

      posts.forEach(post => {
        const day = days.find(d => d.dateString === post.scheduled_date);
        if (day) {
          day.posts.push(post);
        }
      });

      // Place tasks with scheduledDate into their respective days
      growthPlanTasks.forEach(task => {
        if (task.scheduledDate && task.status !== 'completed') {
          const day = days.find(d => d.dateString === task.scheduledDate);
          if (day) {
            day.tasks.push(task);
          }
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
  const totalPosts = calendarDays.reduce((sum, d) => sum + d.posts.length, 0);
  const totalScheduled = calendarDays.reduce((sum, d) => sum + d.posts.filter(p => p.status === 'scheduled' || p.status === 'draft').length, 0);
  const totalPosted = calendarDays.reduce((sum, d) => sum + d.posts.filter(p => p.status === 'posted').length, 0);
  const totalCalendarTasks = calendarDays.reduce((sum, d) => sum + d.tasks.length, 0);

  const getMonthName = (): string => {
    return new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleAssignDay = (taskId: string, dateString: string | null) => {
    onTaskScheduleDate(taskId, dateString);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 p-4 bg-red-100 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
              <ChartBarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-brand-text">Your Growth Planner</h1>
              <p className="text-lg text-brand-text-muted mt-0.5">A unified view of your scheduled posts and growth tasks for the month.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Growth Tasks Section */}
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
        <button
          onClick={() => setShowTasksDropdown(!showTasksDropdown)}
          className="w-full flex items-center justify-between bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4 hover:from-accent-blue/10 hover:to-accent-purple/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center flex-shrink-0">
              <BoltIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-brand-text">This Week's Growth Tasks ({pendingTasks.length})</h2>
              {totalCalendarTasks > 0 && (
                <span className="text-xs font-semibold text-accent-purple bg-accent-purple/10 px-3 py-1 rounded-full">
                  {totalCalendarTasks} assigned
                </span>
              )}
            </div>
          </div>
          {showTasksDropdown ? (
            <ChevronUpIcon className="w-6 h-6 text-brand-text-muted" />
          ) : (
            <ChevronDownIcon className="w-6 h-6 text-brand-text-muted" />
          )}
        </button>

        {showTasksDropdown && (
          <div className="px-6 pb-6 pt-4">
            {pendingTasks.length > 0 ? (
              <div className="space-y-2">
                {pendingTasks.map(task => (
                  <div key={task.id} className="bg-brand-light p-3 rounded-2xl border border-brand-border flex items-center gap-3 group">
                    <button
                      onClick={() => onTaskStatusChange(task.id, 'completed')}
                      className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-brand-border hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center"
                      title="Mark complete"
                    >
                      <svg className="w-3 h-3 text-transparent group-hover:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <GrowthPlanIcon className="w-4 h-4 text-accent-purple flex-shrink-0" />
                    <p className="text-sm font-medium text-brand-text flex-1 truncate">{task.title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${EFFORT_COLORS[task.effort] || 'bg-gray-100 text-gray-700'}`}>
                      {task.effort}
                    </span>
                    {/* Day assignment dropdown */}
                    <select
                      value={task.scheduledDate || ''}
                      onChange={(e) => handleAssignDay(task.id, e.target.value || null)}
                      className="text-xs font-medium bg-white border border-brand-border rounded-xl px-2 py-1.5 text-brand-text cursor-pointer hover:border-accent-purple focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition flex-shrink-0 min-w-[140px]"
                    >
                      <option value="">Assign to calendar...</option>
                      {calendarDays.filter(d => d.date.getMonth() === currentMonth).map(day => (
                        <option key={day.dateString} value={day.dateString}>
                          {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {day.isToday ? ' (Today)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-text-muted text-center py-4">All growth tasks are complete! 🎉</p>
            )}
          </div>
        )}
      </div>

      {/* Monthly Calendar - THE FOCAL POINT */}
      <div className="bg-brand-card rounded-2xl shadow-md border border-brand-border overflow-hidden">
        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 border-b border-brand-border px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              {/* Month Navigation - segmented control style */}
              <div className="flex bg-brand-light p-1.5 rounded-2xl gap-1 shadow-inner">
                <button
                  onClick={goToPreviousMonth}
                  className="flex items-center justify-center py-2 px-3 rounded-xl font-semibold text-sm transition-all duration-200 text-brand-text-muted hover:text-brand-text hover:bg-white hover:shadow-md"
                  title="Previous month"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToToday}
                  className="flex items-center justify-center py-2 px-4 rounded-xl font-semibold text-sm transition-all duration-200 bg-white shadow-md text-brand-text min-w-[180px]"
                >
                  {getMonthName()}
                </button>
                <button
                  onClick={goToNextMonth}
                  className="flex items-center justify-center py-2 px-3 rounded-xl font-semibold text-sm transition-all duration-200 text-brand-text-muted hover:text-brand-text hover:bg-white hover:shadow-md"
                  title="Next month"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {totalScheduled > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-semibold text-amber-700">{totalScheduled} Pending</span>
                </div>
              )}
              {totalPosted > 0 && (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold text-green-700">{totalPosted} Posted</span>
                </div>
              )}
              <button
                onClick={() => loadPlannerData()}
                className="flex items-center gap-1.5 bg-gradient-to-r from-accent-blue to-accent-purple text-white hover:shadow-lg hover:shadow-accent-purple/20 active:scale-[0.99] font-semibold text-sm rounded-xl px-4 py-2 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-brand-border bg-brand-light/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-3 py-3 text-center border-r last:border-r-0 border-brand-border">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                {day}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map(day => {
            const itemCount = day.posts.length + day.tasks.length;
            const isCurrentMonth = day.date.getMonth() === currentMonth;

            return (
              <div
                key={day.dateString}
                className={`min-h-[120px] p-2 border-r last:border-r-0 border-b border-brand-border transition-colors ${
                  day.isToday
                    ? 'bg-accent-purple/[0.05] ring-2 ring-inset ring-accent-purple/30'
                    : isCurrentMonth
                    ? 'hover:bg-brand-light/30'
                    : 'bg-gray-50/50 opacity-60'
                }`}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    day.isToday
                      ? 'bg-gradient-to-br from-accent-blue to-accent-purple text-white'
                      : isCurrentMonth
                      ? 'text-brand-text'
                      : 'text-brand-text-muted'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  {itemCount > 0 && (
                    <span className="text-[10px] font-semibold text-brand-text-muted bg-brand-light px-1.5 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </div>

                {/* Tasks and Posts */}
                <div className="space-y-1">
                  {/* Tasks assigned to this day */}
                  {day.tasks.slice(0, 1).map(task => (
                    <div
                      key={`task-${task.id}`}
                      className="px-1.5 py-1 rounded-xl border text-[10px] leading-tight bg-purple-50 border-purple-200"
                      title={task.title}
                    >
                      <div className="flex items-center gap-0.5">
                        <GrowthPlanIcon className="w-2.5 h-2.5 text-purple-600 flex-shrink-0" />
                        <span className="truncate text-purple-700 font-medium">{task.title}</span>
                      </div>
                    </div>
                  ))}

                  {/* Posts */}
                  {day.posts.slice(0, Math.max(1, 2 - day.tasks.length)).map(post => {
                    const style = POST_STATUS_STYLES[post.status];
                    return (
                      <div
                        key={post.id}
                        className={`px-1.5 py-1 rounded-xl border text-[10px] leading-tight ${style.bg}`}
                        title={post.post_text}
                      >
                        <div className="flex items-center gap-0.5 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                          <span className={`font-semibold truncate ${style.text}`}>
                            {post.scheduled_time || 'Post'}
                          </span>
                        </div>
                        <p className={`truncate ${style.text} opacity-80`}>{post.post_text.substring(0, 30)}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {post.platforms.slice(0, 3).map(p => (
                            <span key={p.platform} className="text-[9px]">{PLATFORM_INFO[p.platform]?.icon}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {itemCount > 2 && (
                    <div className="text-[10px] font-semibold text-accent-purple text-center py-0.5">
                      +{itemCount - 2}
                    </div>
                  )}
                </div>

                {/* Empty state */}
                {itemCount === 0 && isCurrentMonth && (
                  <div className="flex flex-col items-center justify-center h-16 text-brand-text-muted opacity-40">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-brand-border bg-brand-light/30">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-xs text-brand-text-muted">Growth Task</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-brand-text-muted">Pending Post</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-brand-text-muted">Posted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-brand-text-muted">Failed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-xs text-brand-text-muted">Draft</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
