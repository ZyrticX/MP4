/**
 * Supabase Client
 * Direct database access using Supabase JS client
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  console.warn('Missing SUPABASE_URL - database features will be disabled');
}

if (!supabaseKey) {
  console.warn('Missing SUPABASE_ANON_KEY - database features will be disabled');
}

// Create Supabase client (or a mock if credentials are missing)
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : createMockClient();

/**
 * Create a mock client when Supabase is not configured
 * This allows the API to work without database storage
 */
function createMockClient() {
  const mockJobs = new Map<string, DownloadJob>();
  
  return {
    from: (table: string) => ({
      insert: (data: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            const job: DownloadJob = {
              id: crypto.randomUUID(),
              user_id: data.user_id as string || null,
              source_url: data.source_url as string,
              source_platform: data.source_platform as string || null,
              media_type: data.media_type as 'video' | 'audio' | 'both',
              preferred_quality: data.preferred_quality as string || '1080p',
              status: 'pending',
              progress: 0,
              speed_bps: null,
              eta_seconds: null,
              jd_job_id: null,
              jd_package_id: null,
              jd_link_ids: null,
              file_name: null,
              file_size: null,
              file_path: null,
              storage_url: null,
              thumbnail_url: null,
              duration: null,
              title: null,
              description: null,
              source_metadata: {},
              target_video_id: null,
              target_course_id: data.target_course_id as string || null,
              target_chapter_id: data.target_chapter_id as string || null,
              error_message: null,
              retry_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              started_at: null,
              completed_at: null,
            };
            mockJobs.set(job.id, job);
            console.log('📝 Mock: Created job', job.id);
            return { data: job, error: null };
          }
        })
      }),
      
      update: (updates: Record<string, unknown>) => ({
        eq: (column: string, value: string) => {
          const updateFn = async () => {
            const job = mockJobs.get(value);
            if (job) {
              Object.assign(job, updates, { updated_at: new Date().toISOString() });
              mockJobs.set(value, job);
              console.log('📝 Mock: Updated job', value);
            }
            return { data: job, error: null };
          };
          
          return {
            select: () => ({
              single: updateFn
            }),
            then: async (resolve: (value: { error: null }) => void) => {
              await updateFn();
              resolve({ error: null });
            }
          };
        }
      }),
      
      select: (columns = '*') => ({
        eq: (column: string, value: string) => ({
          single: async () => {
            if (column === 'id') {
              const job = mockJobs.get(value);
              return { data: job || null, error: job ? null : { message: 'Not found' } };
            }
            return { data: null, error: { message: 'Not found' } };
          },
          order: (orderColumn: string, options: { ascending: boolean }) => ({
            limit: (limit: number) => ({
              then: async (resolve: (value: { data: any[]; error: null }) => void) => {
                if (column === 'user_id') {
                  const jobs = Array.from(mockJobs.values())
                    .filter(j => j.user_id === value)
                    .slice(0, limit);
                  resolve({ data: jobs, error: null });
                } else {
                  resolve({ data: [], error: null });
                }
              }
            })
          })
        }),
        order: (column: string, options: { ascending: boolean }) => ({
          limit: (limit: number) => ({
            then: async (resolve: (value: { data: any[]; error: null }) => void) => {
              resolve({ data: [], error: null });
            }
          })
        })
      })
    })
  };
}

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
