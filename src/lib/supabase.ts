/**
 * Supabase Edge Function Client
 * Uses Edge Function instead of direct database access
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const downloadApiSecret = process.env.DOWNLOAD_API_SECRET || 'change-this-secret';

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/download-manager`;

/**
 * Call the download-manager Edge Function
 */
async function callEdgeFunction(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<any> {
  const url = `${EDGE_FUNCTION_URL}${path}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'x-api-secret': downloadApiSecret,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json() as { error?: string; [key: string]: unknown };
  
  if (!response.ok) {
    throw new Error(data.error || `Edge function error: ${response.status}`);
  }
  
  return data;
}

/**
 * Supabase-like interface using Edge Functions
 */
export const supabase = {
  from: (table: string) => {
    if (table !== 'download_jobs') {
      throw new Error(`Table "${table}" is not supported. Only "download_jobs" is available.`);
    }
    
    return {
      insert: (data: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            const result = await callEdgeFunction('/create', 'POST', {
              userId: data.user_id,
              sourceUrl: data.source_url,
              sourcePlatform: data.source_platform,
              mediaType: data.media_type,
              preferredQuality: data.preferred_quality,
              targetCourseId: data.target_course_id,
              targetChapterId: data.target_chapter_id,
            });
            return { data: result.job, error: null };
          }
        })
      }),
      
      update: (updates: Record<string, unknown>) => ({
        eq: (column: string, value: string) => ({
          select: () => ({
            single: async () => {
              // Convert snake_case to camelCase for Edge Function
              const camelCaseUpdates: Record<string, unknown> = {};
              for (const [key, val] of Object.entries(updates)) {
                const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
                camelCaseUpdates[camelKey] = val;
              }
              
              const result = await callEdgeFunction('/update', 'PUT', {
                jobId: value,
                ...camelCaseUpdates,
              });
              return { data: result.job, error: null };
            }
          }),
          // For update without select
          then: async (resolve: (value: { error: null }) => void) => {
            await callEdgeFunction('/update', 'PUT', {
              jobId: value,
              ...updates,
            });
            resolve({ error: null });
          }
        })
      }),
      
      select: (columns = '*') => ({
        eq: (column: string, value: string) => ({
          single: async () => {
            if (column === 'id') {
              const result = await callEdgeFunction(`/status/${value}`, 'GET');
              return { data: result.job, error: null };
            }
            if (column === 'user_id') {
              const result = await callEdgeFunction(`/user/${value}`, 'GET');
              return { data: result.jobs, error: null };
            }
            throw new Error(`Unsupported query: select where ${column} = ${value}`);
          },
          order: (orderColumn: string, options: { ascending: boolean }) => ({
            limit: (limit: number) => ({
              then: async (resolve: (value: { data: any[]; error: null }) => void) => {
                if (column === 'user_id') {
                  const result = await callEdgeFunction(`/user/${value}?limit=${limit}`, 'GET');
                  resolve({ data: result.jobs || [], error: null });
                }
              }
            })
          })
        }),
        order: (column: string, options: { ascending: boolean }) => ({
          limit: (limit: number) => ({
            then: async (resolve: (value: { data: any[]; error: null }) => void) => {
              // This would need a new endpoint - for now return empty
              resolve({ data: [], error: null });
            }
          })
        })
      })
    };
  }
};

// Types for our tables
export interface DownloadJob {
  id: string;
  user_id: string | null;
  source_url: string;
  source_platform: string | null;
  media_type: 'video' | 'audio' | 'both';
  preferred_quality: string;
  status: 'pending' | 'crawling' | 'ready' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  speed_bps: number | null;
  eta_seconds: number | null;
  jd_job_id: number | null;
  jd_package_id: number | null;
  jd_link_ids: number[] | null;
  file_name: string | null;
  file_size: number | null;
  file_path: string | null;
  storage_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  title: string | null;
  description: string | null;
  source_metadata: Record<string, unknown>;
  target_video_id: string | null;
  target_course_id: string | null;
  target_chapter_id: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export type DownloadJobInsert = Omit<DownloadJob, 'id' | 'created_at' | 'updated_at'>;
export type DownloadJobUpdate = Partial<Omit<DownloadJob, 'id' | 'created_at'>>;
