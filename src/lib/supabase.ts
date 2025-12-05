/**
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

// Use service role key if available, otherwise fall back to anon key
const apiKey = supabaseServiceKey || supabaseAnonKey;

if (!apiKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
}

if (!supabaseServiceKey) {
  console.warn('⚠️  Warning: Using ANON_KEY instead of SERVICE_ROLE_KEY.');
  console.warn('   Some database operations may fail due to RLS policies.');
  console.warn('   Get your service role key from: Supabase Dashboard → Settings → API');
}

// Service role client for backend operations
export const supabase = createClient(supabaseUrl, apiKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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




