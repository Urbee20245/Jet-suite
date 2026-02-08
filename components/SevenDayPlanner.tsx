import React, { useState, useEffect } from 'react';
import {
  getScheduledPosts,
  createScheduledPost,
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
  onNeedConnections: () => void;
}

// Status config for visual display
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
  onNeedConnections,
}) => {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [userId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);

      // Generate next 7 days using utility
      const days = generateNextNDays(7);

      // Load scheduled posts for this period
      const startDate = days[0].dateString;
      const endDate = days[days.length - 1].dateString;
      const posts = await getScheduledPosts(userId, startDate, endDate);

      // Group posts by date
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

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day);
    setShowScheduleModal(true);
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

  const getTotalPending = (): number => {
    return calendarDays.reduce((total, day) => {
      return total + day.posts.filter(p => isPendingStatus(p.status)).length;
    }, 0);
  };

  const getTotalPosted = (): number => {
    return calendarDays.reduce((total, day) => {
      return total + day.posts.filter(p => p.status === 'posted').length;
    }, 0);
  };

  if (connections.length === 0) {
    return (
      <div className="bg-brand-card p-8 rounded-xl shadow-lg text-center">
        <div className="text-6xl mb-4">📱</div>
        <h3 className="text-2xl font-bold text-brand-text mb-2">
          Connect Your Social Accounts
        </h3>
        <p className="text-brand-text-muted mb-6 max-w-md mx-auto">
          To use the 7-day planner, you need to connect at least one social media account.
        </p>
        <button
          onClick={onNeedConnections}
          className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
        >
          Connect Accounts
        </button>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Calendar Header */}
      <div className="bg-brand-card rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-brand-text">{getMonthLabel()}</h3>
              <p className="text-sm text-brand-text-muted mt-0.5">7-Day Content Calendar</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Stats badges */}
              <div className="flex items-center gap-3">
                {getTotalPending() > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-semibold text-amber-700">{getTotalPending()} Pending</span>
                  </div>
                )}
                {getTotalPosted() > 0 && (
                  <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-green-700">{getTotalPosted()} Posted</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => loadSchedule()}
                className="flex items-center gap-1.5 text-accent-purple hover:text-accent-purple/80 font-semibold text-sm transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Day Headers Row */}
        <div className="grid grid-cols-7 border-b border-brand-border">
          {calendarDays.map((day) => (
            <div
              key={`header-${day.dateString}`}
              className={`px-2 py-2 text-center border-r last:border-r-0 border-brand-border ${
                day.isToday ? 'bg-accent-purple/5' : ''
              }`}
            >
              <div className={`text-xs font-semibold uppercase tracking-wider ${
                day.isToday ? 'text-accent-purple' : 'text-brand-text-muted'
              }`}>
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const pendingPosts = day.posts.filter(p => isPendingStatus(p.status));
            const completedPosts = day.posts.filter(p => !isPendingStatus(p.status));
            const totalPosts = day.posts.length;

            return (
              <div
                key={day.dateString}
                onClick={() => handleDayClick(day)}
                className={`
                  min-h-[140px] p-2 border-r last:border-r-0 border-b border-brand-border
                  cursor-pointer transition-all hover:bg-brand-light/50 group relative
                  ${day.isToday ? 'bg-accent-purple/[0.03]' : ''}
                `}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold
                    ${day.isToday
                      ? 'bg-accent-purple text-white'
                      : 'text-brand-text group-hover:bg-brand-light'
                    }
                  `}>
                    {day.date.getDate()}
                  </span>
                  {totalPosts > 0 && (
                    <span className="text-xs font-medium text-brand-text-muted">
                      {totalPosts} post{totalPosts !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Post Cards */}
                <div className="space-y-1">
                  {/* Pending posts - shown prominently */}
                  {pendingPosts.slice(0, 2).map((post) => {
                    const statusCfg = STATUS_CONFIG[post.status];
                    return (
                      <div
                        key={post.id}
                        className={`px-2 py-1 rounded border text-xs truncate ${statusCfg.bgColor}`}
                        title={post.post_text}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dotColor}`} />
                          <span className={`font-medium truncate ${statusCfg.textColor}`}>
                            {post.scheduled_time || ''} {post.post_text.substring(0, 25)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Completed posts - more subtle */}
                  {completedPosts.slice(0, Math.max(0, 2 - pendingPosts.length)).map((post) => {
                    const statusCfg = STATUS_CONFIG[post.status];
                    return (
                      <div
                        key={post.id}
                        className={`px-2 py-1 rounded border text-xs truncate ${statusCfg.bgColor}`}
                        title={post.post_text}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dotColor}`} />
                          <span className={`font-medium truncate ${statusCfg.textColor}`}>
                            {post.post_text.substring(0, 25)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Overflow indicator */}
                  {totalPosts > 2 && (
                    <div className="text-xs font-semibold text-accent-purple text-center py-0.5">
                      +{totalPosts - 2} more
                    </div>
                  )}
                </div>

                {/* Empty state */}
                {totalPosts === 0 && (
                  <div className="flex flex-col items-center justify-center h-16 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-brand-text-muted mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-xs text-brand-text-muted">Add post</span>
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
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-brand-text-muted">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs text-brand-text-muted">Posting</span>
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

      {/* Day Detail Modal */}
      {selectedDay && showScheduleModal && (
        <DayDetailModal
          day={selectedDay}
          connections={connections}
          userId={userId}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedDay(null);
          }}
          onPostScheduled={() => {
            loadSchedule();
          }}
          onPostDeleted={handleDeletePost}
        />
      )}
    </div>
  );
};

// Day Detail Modal Component
interface DayDetailModalProps {
  day: CalendarDay;
  connections: SocialConnection[];
  userId: string;
  onClose: () => void;
  onPostScheduled: () => void;
  onPostDeleted: (postId: string) => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({
  day,
  connections,
  userId,
  onClose,
  onPostScheduled,
  onPostDeleted,
}) => {
  const [postText, setPostText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Share modal state for planner posts
  const [sharePost, setSharePost] = useState<ScheduledPost | null>(null);

  const handleConnectionToggle = (connectionId: string) => {
    setSelectedConnections(prev =>
      prev.includes(connectionId)
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const handleSchedulePost = async () => {
    if (!postText.trim()) {
      setError('Please enter post text');
      return;
    }

    if (selectedConnections.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const platforms = selectedConnections.map(connId => {
        const conn = connections.find(c => c.id === connId)!;
        return {
          platform: conn.platform,
          connection_id: connId,
        };
      });

      await createScheduledPost(userId, {
        post_text: postText,
        hashtags,
        scheduled_date: day.dateString,
        scheduled_time: scheduledTime,
        timezone: 'America/New_York',
        platforms,
        status: 'scheduled',
      });

      onPostScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Sort posts: pending first, then by time
  const sortedPosts = [...day.posts].sort((a, b) => {
    const aPending = isPendingStatus(a.status) ? 0 : 1;
    const bPending = isPendingStatus(b.status) ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    return (a.scheduled_time || '').localeCompare(b.scheduled_time || '');
  });

  const pendingCount = day.posts.filter(p => isPendingStatus(p.status)).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-card rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-brand-border bg-gradient-to-r from-accent-blue/5 to-accent-purple/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-brand-text">
                {formatDateForDisplay(day.date)}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                {day.isToday && (
                  <span className="text-xs font-semibold text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {pendingCount} pending
                  </span>
                )}
                {day.posts.length > 0 && (
                  <span className="text-xs text-brand-text-muted">
                    {day.posts.length} total post{day.posts.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-light text-brand-text-muted hover:text-brand-text transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Existing Posts */}
          {sortedPosts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-brand-text mb-3">Scheduled Posts</h4>
              <div className="space-y-2">
                {sortedPosts.map(post => {
                  const statusCfg = STATUS_CONFIG[post.status];
                  const pending = isPendingStatus(post.status);

                  return (
                    <div
                      key={post.id}
                      className={`p-4 rounded-xl border transition-all ${
                        pending
                          ? 'bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-amber-200 shadow-sm'
                          : 'bg-brand-light border-brand-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Status and time header */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCfg.bgColor} ${statusCfg.textColor}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotColor}`} />
                              {statusCfg.label}
                            </span>
                            {post.scheduled_time && (
                              <span className="text-xs text-brand-text-muted font-medium">
                                {post.scheduled_time}
                              </span>
                            )}
                          </div>
                          {/* Post text */}
                          <p className="text-brand-text text-sm mb-2 line-clamp-2">{post.post_text}</p>
                          {/* Platform icons */}
                          <div className="flex items-center gap-1.5">
                            {post.platforms.map((pt, i) => (
                              <span
                                key={i}
                                className="text-sm"
                                title={PLATFORM_INFO[pt.platform].name}
                              >
                                {PLATFORM_INFO[pt.platform].icon}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setSharePost(post)}
                            className="text-teal-600 hover:text-teal-800 text-sm font-semibold transition"
                          >
                            Share
                          </button>
                          <button
                            onClick={() => onPostDeleted(post.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schedule New Post */}
          <div className={`${sortedPosts.length > 0 ? 'border-t border-brand-border pt-6' : ''}`}>
            <h4 className="text-sm font-semibold text-brand-text mb-4">Schedule New Post</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Post Text
                </label>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What do you want to post?"
                  className="w-full bg-brand-light border border-brand-border rounded-xl p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent h-24 resize-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Hashtags (optional)
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#business #success #marketing"
                  className="w-full bg-brand-light border border-brand-border rounded-xl p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-brand-light border border-brand-border rounded-xl p-3 text-brand-text focus:ring-2 focus:ring-accent-purple focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Platforms
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {connections.map(conn => {
                    const platformInfo = PLATFORM_INFO[conn.platform];
                    const isSelected = selectedConnections.includes(conn.id);
                    return (
                      <label
                        key={conn.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-accent-purple/10 border-accent-purple shadow-sm'
                            : 'bg-brand-light border-brand-border hover:border-accent-purple/30'
                        } border`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleConnectionToggle(conn.id)}
                          className="form-checkbox h-4 w-4 text-accent-purple rounded"
                        />
                        <span className="text-lg">{platformInfo.icon}</span>
                        <span className="text-brand-text text-sm font-medium">
                          {platformInfo.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-brand-light text-brand-text px-4 py-3 rounded-xl font-semibold hover:bg-opacity-80 transition"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSchedulePost}
                disabled={submitting || !postText.trim() || selectedConnections.length === 0}
                className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Scheduling...' : 'Schedule Post'}
              </button>
            </div>
          </div>

          {/* Share modal for planner posts */}
          {sharePost && (
            <SharePostModal
              isOpen={!!sharePost}
              onClose={() => setSharePost(null)}
              postText={sharePost.post_text}
              hashtags={sharePost.hashtags}
              imageUrl={sharePost.image_url}
            />
          )}
        </div>
      </div>
    </div>
  );
};
