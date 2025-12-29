import React, { useState, useEffect } from 'react';
import {
  getScheduledPosts,
  createScheduledPost,
  deleteScheduledPost,
  PLATFORM_INFO
} from '../services/socialMediaService';
import type { ScheduledPost, SocialConnection, CalendarDay } from '../types';
import { Loader } from './Loader';
import { generateNextNDays, formatDateForDisplay } from '../utils/dateTimeUtils';

interface SevenDayPlannerProps {
  userId: string;
  connections: SocialConnection[];
  onNeedConnections: () => void;
}

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

  const getDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getMonthDay = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-brand-card p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-brand-text">7-Day Content Calendar</h3>
          <button
            onClick={() => loadSchedule()}
            className="text-accent-purple hover:text-accent-purple/80 font-semibold text-sm"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => (
            <div
              key={day.dateString}
              onClick={() => handleDayClick(day)}
              className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${day.isToday 
                  ? 'bg-accent-purple/10 border-2 border-accent-purple' 
                  : 'bg-brand-light border border-brand-border hover:border-accent-purple/50'}
              `}
            >
              <div className="text-center">
                <div className={`text-xs font-semibold mb-1 ${day.isToday ? 'text-accent-purple' : 'text-brand-text-muted'}`}>
                  {getDayName(day.date)}
                </div>
                <div className={`text-sm font-bold mb-2 ${day.isToday ? 'text-accent-purple' : 'text-brand-text'}`}>
                  {getMonthDay(day.date).split(' ')[1]}
                </div>
                
                {day.posts.length > 0 ? (
                  <div className="space-y-1">
                    {day.posts.slice(0, 3).map((post, i) => (
                      <div
                        key={i}
                        className="h-1.5 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple"
                        title={`${post.platforms.length} platform(s)`}
                      />
                    ))}
                    {day.posts.length > 3 && (
                      <div className="text-xs text-accent-purple font-semibold">
                        +{day.posts.length - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-brand-text-muted">
                    Click to add
                  </div>
                )}
              </div>
            </div>
          ))}
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-brand-card p-6 rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-brand-text">
            Schedule for {formatDateForDisplay(day.date)}
          </h3>
          <button
            onClick={onClose}
            className="text-brand-text-muted hover:text-brand-text text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Existing Posts */}
        {day.posts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-brand-text mb-3">Scheduled Posts</h4>
            <div className="space-y-2">
              {day.posts.map(post => (
                <div
                  key={post.id}
                  className="p-4 bg-brand-light border border-brand-border rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-brand-text text-sm mb-2">{post.post_text}</p>
                      <div className="flex items-center space-x-2">
                        {post.platforms.map((pt, i) => (
                          <span
                            key={i}
                            className="text-xs"
                            title={PLATFORM_INFO[pt.platform].name}
                          >
                            {PLATFORM_INFO[pt.platform].icon}
                          </span>
                        ))}
                        <span className="text-xs text-brand-text-muted">
                          • {post.scheduled_time || 'No time set'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          post.status === 'posted' ? 'bg-green-100 text-green-800' :
                          post.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onPostDeleted(post.id)}
                      className="ml-4 text-red-600 hover:text-red-800 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule New Post */}
        <div className="border-t border-brand-border pt-6">
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
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple h-24 resize-none"
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
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text placeholder-brand-text-muted focus:ring-2 focus:ring-accent-purple"
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
                className="w-full bg-brand-light border border-brand-border rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-accent-purple"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Platforms
              </label>
              <div className="grid grid-cols-2 gap-3">
                {connections.map(conn => {
                  const platformInfo = PLATFORM_INFO[conn.platform];
                  return (
                    <label
                      key={conn.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition ${
                        selectedConnections.includes(conn.id)
                          ? 'bg-accent-purple/10 border-accent-purple'
                          : 'bg-brand-light border-brand-border'
                      } border`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedConnections.includes(conn.id)}
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

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-brand-light text-brand-text px-4 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSchedulePost}
              disabled={submitting || !postText.trim() || selectedConnections.length === 0}
              className="flex-1 bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Scheduling...' : 'Schedule Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
