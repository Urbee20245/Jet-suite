import React, { useState, useEffect } from 'react';
import {
  getScheduledPosts,
  deleteScheduledPost,
  PLATFORM_INFO
} from '../services/socialMediaService';
import type { ScheduledPost, SocialConnection, CalendarDay, PostStatus } from '../types';
import { Loader } from './Loader';
import { generateNextNDays, formatDateForDisplay } from '../utils/dateTimeUtils';
import { SharePostModal } from './SharePostModal';

interface SevenDayPlannerProps {
  userId: string;
  connections: SocialConnection[];
  connectionsLoading?: boolean;
  onNeedConnections: () => void;
}

const STATUS_CONFIG: Record<PostStatus, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  scheduled: { label: 'Pending', dotColor: 'bg-amber-400', bgColor: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700' },
  posting: { label: 'Posting...', dotColor: 'bg-blue-400 animate-pulse', bgColor: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
  posted: { label: 'Posted', dotColor: 'bg-green-500', bgColor: 'bg-green-50 border-green-200', textColor: 'text-green-700' },
  failed: { label: 'Failed', dotColor: 'bg-red-500', bgColor: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
  draft: { label: 'Draft', dotColor: 'bg-gray-400', bgColor: 'bg-gray-50 border-gray-200', textColor: 'text-gray-600' },
  cancelled: { label: 'Cancelled', dotColor: 'bg-gray-300', bgColor: 'bg-gray-50 border-gray-200', textColor: 'text-gray-500' },
};

const isPendingStatus = (status: PostStatus): boolean => {
  return status === 'scheduled' || status === 'posting' || status === 'draft';
};

export const SevenDayPlanner: React.FC<SevenDayPlannerProps> = ({
  userId,
  connections,
  connectionsLoading = false,
  onNeedConnections,
}) => {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    if (userId) {
      loadSchedule();
    }
  }, [userId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const days = generateNextNDays(7);
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this scheduled post?')) return;
    try {
      await deleteScheduledPost(postId);
      await loadSchedule();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getMonthLabel = (): string => {
    if (calendarDays.length === 0) return '';
    const first = calendarDays[0].date;
    const last = calendarDays[calendarDays.length - 1].date;
    const firstMonth = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const lastMonth = last.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return firstMonth === lastMonth ? firstMonth : `${first.toLocaleDateString('en-US', { month: 'short' })} - ${last.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  if (connectionsLoading) {
    return (
      <div className="bg-brand-card p-8 rounded-xl shadow-lg text-center">
        <Loader />
        <p className="text-brand-text-muted mt-4">Loading your connected accounts...</p>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="bg-brand-card p-8 rounded-xl shadow-lg text-center">
        <div className="text-6xl mb-4">📱</div>
        <h3 className="text-2xl font-bold text-brand-text mb-2">Connect Your Social Accounts</h3>
        <p className="text-brand-text-muted mb-6 max-w-md mx-auto">To use the 7-day planner, you need to connect at least one social media account.</p>
        <button onClick={onNeedConnections} className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">Connect Accounts</button>
      </div>
    );
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">{error}</div>}
      <div className="bg-brand-card rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-brand-text">{getMonthLabel()}</h3>
            <p className="text-sm text-brand-text-muted mt-0.5">7-Day Content Calendar</p>
          </div>
          <button onClick={() => loadSchedule()} className="text-accent-purple hover:text-accent-purple/80 font-semibold text-sm transition">Refresh</button>
        </div>
        <div className="grid grid-cols-7 border-b border-brand-border">
          {calendarDays.map((day) => (
            <div key={`header-${day.dateString}`} className={`px-2 py-2 text-center border-r last:border-r-0 border-brand-border ${day.isToday ? 'bg-accent-purple/5' : ''}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider ${day.isToday ? 'text-accent-purple' : 'text-brand-text-muted'}`}>{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => (
            <div key={day.dateString} onClick={() => { setSelectedDay(day); setShowScheduleModal(true); }} className={`min-h-[140px] p-2 border-r last:border-r-0 border-b border-brand-border cursor-pointer transition-all hover:bg-brand-light/50 group relative ${day.isToday ? 'bg-accent-purple/[0.03]' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${day.isToday ? 'bg-accent-purple text-white' : 'text-brand-text group-hover:bg-brand-light'}`}>{day.date.getDate()}</span>
              </div>
              <div className="space-y-1">
                {day.posts.map((post) => {
                  const statusCfg = STATUS_CONFIG[post.status];
                  return (
                    <div key={post.id} className={`px-2 py-1 rounded border text-[10px] truncate ${statusCfg.bgColor}`}>
                      <div className="flex items-center gap-1">
                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${statusCfg.dotColor}`} />
                        <span className={`font-medium truncate ${statusCfg.textColor}`}>{post.scheduled_time || ''} {post.post_text.substring(0, 20)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedDay && showScheduleModal && (
        <DayDetailModal day={selectedDay} connections={connections} userId={userId} onClose={() => { setShowScheduleModal(false); setSelectedDay(null); }} onPostScheduled={loadSchedule} onPostDeleted={handleDeletePost} />
      )}
    </div>
  );
};

interface DayDetailModalProps {
  day: CalendarDay;
  connections: SocialConnection[];
  userId: string;
  onClose: () => void;
  onPostScheduled: () => void;
  onPostDeleted: (postId: string) => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({ day, connections, userId, onClose, onPostScheduled, onPostDeleted }) => {
  const [sharePost, setSharePost] = useState<ScheduledPost | null>(null);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-card rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border bg-gradient-to-r from-accent-blue/5 to-accent-purple/5 flex justify-between items-center">
          <h3 className="text-xl font-bold text-brand-text">{formatDateForDisplay(day.date)}</h3>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-text transition">✕</button>
        </div>
        <div className="p-6">
          {day.posts.length > 0 ? (
            <div className="space-y-3">
              {day.posts.map(post => (
                <div key={post.id} className="p-4 rounded-xl border bg-brand-light border-brand-border flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[post.status].bgColor} ${STATUS_CONFIG[post.status].textColor}`}>
                        {STATUS_CONFIG[post.status].label}
                      </span>
                      <span className="text-xs text-brand-text-muted">{post.scheduled_time}</span>
                    </div>
                    <p className="text-sm text-brand-text mb-2 line-clamp-2">{post.post_text}</p>
                    <div className="flex items-center gap-1.5">
                      {post.platforms.map((pt, i) => <span key={i} className="text-sm">{PLATFORM_INFO[pt.platform]?.icon}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => setSharePost(post)} className="text-accent-blue text-sm font-bold">Share</button>
                    <button onClick={() => onPostDeleted(post.id)} className="text-red-500 text-sm font-bold">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-brand-text-muted py-8">No posts scheduled for this day.</p>}
        </div>
      </div>
      {sharePost && <SharePostModal isOpen={!!sharePost} onClose={() => setSharePost(null)} postText={sharePost.post_text} hashtags={sharePost.hashtags} imageUrl={sharePost.image_url} />}
    </div>
  );
};