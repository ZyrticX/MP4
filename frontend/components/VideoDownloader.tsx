/**
 * VideoDownloader Component
 * קומפוננטה להורדת סרטונים - לשילוב בפרויקט React קיים
 */

import React, { useState, useEffect, useCallback } from 'react';

// API URL - שנה בהתאם לסביבה
const API_URL = import.meta.env.VITE_DOWNLOAD_API_URL || 'http://localhost:3001/api';

// Types
interface DownloadJob {
  id: string;
  status: 'pending' | 'crawling' | 'ready' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  sourceUrl: string;
  sourcePlatform: string | null;
  title: string | null;
  fileName: string | null;
  fileSize: number | null;
  speedBps: number | null;
  etaSeconds: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface VideoDownloaderProps {
  userId?: string;
  onDownloadComplete?: (job: DownloadJob) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Utility functions
const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'לא ידוע';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
};

const formatSpeed = (bps: number | null): string => {
  if (!bps) return '';
  return `${formatFileSize(bps)}/s`;
};

const formatEta = (seconds: number | null): string => {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds} שניות`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} דקות`;
  return `${Math.floor(seconds / 3600)} שעות`;
};

const detectPlatform = (url: string): { name: string; icon: string } => {
  const platforms: Record<string, { name: string; icon: string }> = {
    youtube: { name: 'YouTube', icon: '🎬' },
    facebook: { name: 'Facebook', icon: '📘' },
    vimeo: { name: 'Vimeo', icon: '🎥' },
    tiktok: { name: 'TikTok', icon: '🎵' },
    instagram: { name: 'Instagram', icon: '📷' },
    twitter: { name: 'Twitter/X', icon: '🐦' },
    twitch: { name: 'Twitch', icon: '🎮' },
  };

  const lower = url.toLowerCase();
  for (const [key, value] of Object.entries(platforms)) {
    if (lower.includes(key)) return value;
  }
  return { name: 'אחר', icon: '🌐' };
};

export const VideoDownloader: React.FC<VideoDownloaderProps> = ({
  userId,
  onDownloadComplete,
  onError,
  className = '',
}) => {
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'audio' | 'both'>('video');
  const [quality, setQuality] = useState('1080p');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloads, setDownloads] = useState<DownloadJob[]>([]);
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

  // Poll for download status
  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${API_URL}/downloads/${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'שגיאה בקבלת סטטוס');
      }

      setDownloads(prev => 
        prev.map(d => d.id === jobId ? { ...d, ...data } : d)
      );

      // Stop polling if completed or failed
      if (['completed', 'failed', 'cancelled'].includes(data.status)) {
        setPollingIds(prev => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });

        if (data.status === 'completed' && onDownloadComplete) {
          onDownloadComplete(data);
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [onDownloadComplete]);

  // Polling effect
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    pollingIds.forEach(jobId => {
      const interval = setInterval(() => pollStatus(jobId), 2000);
      intervals.push(interval);
      pollStatus(jobId); // Initial poll
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [pollingIds, pollStatus]);

  // Submit download
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/downloads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'X-User-ID': userId }),
        },
        body: JSON.stringify({
          url: url.trim(),
          mediaType,
          preferredQuality: quality,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'שגיאה בשליחת ההורדה');
      }

      // Add to downloads list
      const newJob: DownloadJob = {
        id: data.job.id,
        status: data.job.status,
        progress: 0,
        sourceUrl: data.job.sourceUrl,
        sourcePlatform: data.job.sourcePlatform,
        title: null,
        fileName: null,
        fileSize: null,
        speedBps: null,
        etaSeconds: null,
        errorMessage: null,
        createdAt: data.job.createdAt,
        completedAt: null,
      };

      setDownloads(prev => [newJob, ...prev]);
      setPollingIds(prev => new Set(prev).add(newJob.id));
      setUrl('');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel download
  const handleCancel = async (jobId: string) => {
    try {
      await fetch(`${API_URL}/downloads/${jobId}/cancel`, { method: 'POST' });
      setDownloads(prev => 
        prev.map(d => d.id === jobId ? { ...d, status: 'cancelled' } : d)
      );
      setPollingIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  // Retry download
  const handleRetry = async (jobId: string) => {
    try {
      const response = await fetch(`${API_URL}/downloads/${jobId}/retry`, { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setPollingIds(prev => new Set(prev).add(jobId));
      }
    } catch (error) {
      console.error('Retry error:', error);
    }
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'ממתין',
      crawling: 'מנתח קישור...',
      ready: 'מוכן להורדה',
      downloading: 'מוריד...',
      completed: 'הושלם ✓',
      failed: 'נכשל ❌',
      cancelled: 'בוטל',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      crawling: 'bg-blue-500/20 text-blue-400',
      ready: 'bg-cyan-500/20 text-cyan-400',
      downloading: 'bg-indigo-500/20 text-indigo-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
    };
    return colorMap[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* טופס הורדה */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            קישור לסרטון
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  הורדה
                </>
              )}
            </button>
          </div>
        </div>

        {/* אפשרויות */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-400 mb-1">סוג מדיה</label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as 'video' | 'audio' | 'both')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="video">וידאו</option>
              <option value="audio">אודיו בלבד</option>
              <option value="both">וידאו + אודיו</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm text-gray-400 mb-1">איכות</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="2160p">4K (2160p)</option>
              <option value="1080p">Full HD (1080p)</option>
              <option value="720p">HD (720p)</option>
              <option value="480p">SD (480p)</option>
              <option value="360p">נמוך (360p)</option>
            </select>
          </div>
        </div>

        {/* פלטפורמות נתמכות */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
          {['YouTube', 'Facebook', 'Vimeo', 'TikTok', 'Instagram', 'Twitter'].map(platform => (
            <span
              key={platform}
              className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400"
            >
              {platform}
            </span>
          ))}
          <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
            + עוד 1000 אתרים
          </span>
        </div>
      </form>

      {/* רשימת הורדות */}
      {downloads.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            הורדות אחרונות
          </h3>
          
          <div className="space-y-2">
            {downloads.map(job => {
              const platform = detectPlatform(job.sourceUrl);
              
              return (
                <div
                  key={job.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* אייקון פלטפורמה */}
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      {platform.icon}
                    </div>
                    
                    {/* פרטי הורדה */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {job.title || job.fileName || 'מעבד...'}
                      </div>
                      <div className="text-sm text-gray-400 flex items-center gap-2 flex-wrap">
                        <span>{platform.name}</span>
                        <span>•</span>
                        <span>{formatFileSize(job.fileSize)}</span>
                        {job.status === 'downloading' && job.speedBps && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400">{formatSpeed(job.speedBps)}</span>
                          </>
                        )}
                        {job.status === 'downloading' && job.etaSeconds && (
                          <>
                            <span>•</span>
                            <span>נותרו {formatEta(job.etaSeconds)}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Progress bar */}
                      {job.status === 'downloading' && (
                        <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* סטטוס ופעולות */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                        {job.status === 'downloading' ? `${job.progress}%` : getStatusText(job.status)}
                      </span>
                      
                      {['pending', 'crawling', 'downloading'].includes(job.status) && (
                        <button
                          onClick={() => handleCancel(job.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          title="ביטול"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      
                      {job.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(job.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-green-400"
                          title="נסה שוב"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* הודעת שגיאה */}
                  {job.status === 'failed' && job.errorMessage && (
                    <div className="mt-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                      {job.errorMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDownloader;




