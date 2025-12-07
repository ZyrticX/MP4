/**
 * Download Service
 * 
 * Manages the download workflow:
 * 1. User submits URL
 * 2. Add to JDownloader LinkGrabber
 * 3. Wait for crawling to complete
 * 4. Move to downloads
 * 5. Monitor progress
 * 6. Update database on completion
 */

import { JDownloaderClient, CrawledLink, CrawledPackage, DownloadLink, FilePackage } from '../lib/jdownloader/index.js';
import { supabase, DownloadJob, DownloadJobUpdate } from '../lib/supabase.js';

interface SubmitDownloadOptions {
  userId?: string;
  url: string;
  mediaType?: 'video' | 'audio' | 'both';
  preferredQuality?: string;
  packageName?: string;
  targetCourseId?: string;
  targetChapterId?: string;
}

interface DownloadProgress {
  jobId: string;
  status: DownloadJob['status'];
  progress: number;
  speedBps: number | null;
  etaSeconds: number | null;
  fileName: string | null;
  fileSize: number | null;
}

export class DownloadService {
  private jd: JDownloaderClient;
  private isConnected = false;
  private downloadPath: string;

  constructor() {
    const email = process.env.MYJD_EMAIL;
    const password = process.env.MYJD_PASSWORD;
    
    if (!email || !password) {
      throw new Error('MyJDownloader credentials not configured. Set MYJD_EMAIL and MYJD_PASSWORD environment variables.');
    }
    
    this.jd = new JDownloaderClient(email, password);
    this.downloadPath = process.env.DOWNLOAD_PATH || 'C:/Downloads/AviMP4';
  }

  /**
   * Initialize connection to JDownloader
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      await this.jd.connect();
      await this.jd.selectDevice(process.env.MYJD_DEVICE_NAME);
      this.isConnected = true;
      console.log('✅ Connected to JDownloader:', this.jd.getCurrentDevice()?.name);
    } catch (error) {
      console.error('❌ Failed to connect to JDownloader:', error);
      throw error;
    }
  }

  /**
   * Ensure we're connected before operations
   */
  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
    
    // Verify connection with a ping
    try {
      await this.jd.ping();
    } catch {
      this.isConnected = false;
      await this.connect();
    }
  }

  /**
   * Submit a new download request
   */
  async submitDownload(options: SubmitDownloadOptions): Promise<DownloadJob> {
    const {
      userId,
      url,
      mediaType = 'video',
      preferredQuality = '1080p',
      packageName,
      targetCourseId,
      targetChapterId
    } = options;

    // Detect platform from URL
    const platform = this.detectPlatform(url);

    // Create database record
    const { data: job, error } = await supabase
      .from('download_jobs')
      .insert({
        user_id: userId || null,
        source_url: url,
        source_platform: platform,
        media_type: mediaType,
        preferred_quality: preferredQuality,
        status: 'pending',
        progress: 0,
        target_course_id: targetCourseId || null,
        target_chapter_id: targetChapterId || null,
        source_metadata: {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create download job: ${(error as Error).message || String(error)}`);
    }

    // Start the download process asynchronously
    this.processDownload(job, packageName).catch(err => {
      console.error(`Download processing failed for job ${job.id}:`, err);
    });

    return job;
  }

  /**
   * Process a download job
   */
  private async processDownload(job: DownloadJob, packageName?: string): Promise<void> {
    try {
      await this.ensureConnected();

      // Update status to crawling
      await this.updateJob(job.id, { status: 'crawling', started_at: new Date().toISOString() });

      // Add links to JDownloader with required parameters
      const collectingJob = await this.jd.addLinks({
        links: job.source_url,
        assignJobID: true,
        autostart: false,
        autoExtract: false,
        deepDecrypt: false,
        overwritePackagizerRules: false
      });

      console.log('✅ addLinks response:', JSON.stringify(collectingJob));
      await this.updateJob(job.id, { jd_job_id: collectingJob?.id || null });

      // Wait for crawling to complete
      await this.waitForCrawling(collectingJob?.id || 0);

      // Get crawled links and packages
      const packages = await this.jd.queryCrawledPackages({
        bytesTotal: true,
        childCount: true,
        saveTo: true
      });

      const links = await this.jd.queryCrawledLinks({
        bytesTotal: true,
        availability: true,
        variants: true,
        url: true
      });

      if (links.length === 0) {
        throw new Error('No downloadable links found for this URL');
      }

      // Find our package
      const ourPackage = packages.find(p => 
        links.some(l => l.packageUUID === p.uuid)
      );

      // Set download directory AFTER crawling (this is the correct way!)
      if (ourPackage) {
        try {
          await this.jd.setDownloadDirectoryLinkGrabber(this.downloadPath, [ourPackage.uuid]);
          console.log(`✅ Set download directory: ${this.downloadPath} for package ${ourPackage.uuid}`);
        } catch (err) {
          console.warn('⚠️ Failed to set download directory:', err);
        }
      }

      // Select quality variant if available (for YouTube, etc.)
      await this.selectQualityVariant(links, job.preferred_quality, job.media_type);

      // Update job with crawled info
      const linkIds = links.map(l => l.uuid);
      await this.updateJob(job.id, {
        status: 'ready',
        jd_package_id: ourPackage?.uuid || null,
        jd_link_ids: linkIds,
        file_name: links[0].name,
        file_size: links.reduce((sum, l) => sum + (l.bytesTotal || 0), 0),
        title: ourPackage?.name || links[0].name,
        source_metadata: {
          host: links[0].host,
          linksCount: links.length,
          availability: links[0].availability
        }
      });

      // Move to download list and start
      await this.jd.moveToDownloadList(linkIds, ourPackage ? [ourPackage.uuid] : []);
      await this.jd.startDownloads();

      await this.updateJob(job.id, { status: 'downloading' });

      // Monitor download progress
      await this.monitorDownload(job.id, ourPackage?.uuid || 0, linkIds);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateJob(job.id, {
        status: 'failed',
        error_message: errorMessage,
        retry_count: (job.retry_count || 0) + 1
      });
      throw error;
    }
  }

  /**
   * Wait for link crawling to complete
   */
  private async waitForCrawling(jobId: number, maxWaitMs = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      const isCollecting = await this.jd.isCollecting();
      
      if (!isCollecting) {
        return;
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Timeout - abort collection
    await this.jd.abortLinkCollection(jobId);
    throw new Error('Link crawling timed out');
  }

  /**
   * Select appropriate quality variant for video downloads
   */
  private async selectQualityVariant(
    links: CrawledLink[],
    preferredQuality: string,
    mediaType: 'video' | 'audio' | 'both'
  ): Promise<void> {
    for (const link of links) {
      if (!link.variants) continue;
      
      try {
        const variants = await this.jd.getVariants(link.uuid);
        
        if (variants.length === 0) continue;
        
        // Find best matching variant
        const selected = this.findBestVariant(variants, preferredQuality, mediaType);
        
        if (selected) {
          await this.jd.setVariant(link.uuid, selected.id);
        }
      } catch (error) {
        console.warn(`Failed to set variant for link ${link.uuid}:`, error);
      }
    }
  }

  /**
   * Find the best matching variant based on preferences
   */
  private findBestVariant(
    variants: { id: string; name: string }[],
    preferredQuality: string,
    mediaType: 'video' | 'audio' | 'both'
  ): { id: string; name: string } | null {
    // Quality priority order
    const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p'];
    const preferredIndex = qualityOrder.indexOf(preferredQuality);
    
    // Filter by media type
    let filtered = variants;
    if (mediaType === 'audio') {
      filtered = variants.filter(v => 
        v.name.toLowerCase().includes('audio') || 
        v.name.toLowerCase().includes('m4a') ||
        v.name.toLowerCase().includes('mp3')
      );
    } else if (mediaType === 'video') {
      filtered = variants.filter(v => 
        !v.name.toLowerCase().includes('audio only')
      );
    }
    
    if (filtered.length === 0) {
      filtered = variants;
    }
    
    // Find matching quality
    for (let i = preferredIndex >= 0 ? preferredIndex : 2; i < qualityOrder.length; i++) {
      const quality = qualityOrder[i];
      const match = filtered.find(v => v.name.includes(quality));
      if (match) return match;
    }
    
    // Fallback to first available
    return filtered[0] || variants[0];
  }

  /**
   * Monitor download progress until completion
   */
  private async monitorDownload(
    jobId: string,
    packageId: number,
    linkIds: number[]
  ): Promise<void> {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // Query download status
        const packages = await this.jd.queryDownloadPackages({
          packageUUIDs: [packageId],
          bytesLoaded: true,
          bytesTotal: true,
          finished: true,
          speed: true,
          eta: true,
          status: true
        });

        const links = await this.jd.queryDownloadLinks({
          packageUUIDs: [packageId],
          bytesLoaded: true,
          bytesTotal: true,
          finished: true,
          speed: true,
          eta: true,
          status: true
        });

        const pkg = packages[0];
        
        if (!pkg) {
          // Package might have been processed and removed
          // Check if links are in download history
          const allFinished = links.every(l => l.finished);
          if (allFinished || links.length === 0) {
            await this.updateJob(jobId, {
              status: 'completed',
              progress: 100,
              completed_at: new Date().toISOString()
            });
            return;
          }
          
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        // Calculate progress
        const progress = pkg.bytesTotal > 0 
          ? Math.round((pkg.bytesLoaded / pkg.bytesTotal) * 100)
          : 0;

        // Update progress
        await this.updateJob(jobId, {
          progress,
          speed_bps: pkg.speed || null,
          eta_seconds: pkg.eta || null
        });

        // Check if finished
        if (pkg.finished) {
          await this.updateJob(jobId, {
            status: 'completed',
            progress: 100,
            file_path: pkg.saveTo,
            completed_at: new Date().toISOString()
          });
          return;
        }

        retries = 0; // Reset retries on successful query

      } catch (error) {
        console.error('Error monitoring download:', error);
        retries++;
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Get download progress for a job
   */
  async getProgress(jobId: string): Promise<DownloadProgress | null> {
    const { data: job, error } = await supabase
      .from('download_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) return null;

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      speedBps: job.speed_bps,
      etaSeconds: job.eta_seconds,
      fileName: job.file_name,
      fileSize: job.file_size
    };
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string, limit = 20): Promise<DownloadJob[]> {
    const { data, error } = await supabase
      .from('download_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch jobs: ${(error as Error).message || String(error)}`);
    }

    return data || [];
  }

  /**
   * Cancel a download job
   */
  async cancelJob(jobId: string): Promise<void> {
    const { data: job } = await supabase
      .from('download_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    try {
      await this.ensureConnected();

      // Remove from JDownloader
      if (job.jd_link_ids && job.jd_package_id) {
        // Try to remove from downloads
        await this.jd.removeDownloadLinks(job.jd_link_ids, [job.jd_package_id]).catch(() => {});
        // Try to remove from linkgrabber
        await this.jd.removeLinksFromGrabber(job.jd_link_ids, [job.jd_package_id]).catch(() => {});
      }
    } catch (error) {
      console.warn('Failed to remove from JDownloader:', error);
    }

    await this.updateJob(jobId, { status: 'cancelled' });
  }

  /**
   * Retry a failed download
   */
  async retryJob(jobId: string): Promise<DownloadJob> {
    const { data: job } = await supabase
      .from('download_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'failed' && job.status !== 'cancelled') {
      throw new Error('Can only retry failed or cancelled jobs');
    }

    // Reset job and reprocess
    await this.updateJob(jobId, {
      status: 'pending',
      progress: 0,
      error_message: null,
      jd_job_id: null,
      jd_package_id: null,
      jd_link_ids: null
    });

    const updatedJob = await supabase
      .from('download_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (updatedJob.data) {
      this.processDownload(updatedJob.data).catch(err => {
        console.error(`Retry failed for job ${jobId}:`, err);
      });
    }

    return updatedJob.data!;
  }

  /**
   * Update a download job in the database
   */
  private async updateJob(jobId: string, update: DownloadJobUpdate): Promise<void> {
    const { error } = await supabase
      .from('download_jobs')
      .update(update)
      .eq('id', jobId);

    if (error) {
      console.error(`Failed to update job ${jobId}:`, error);
    }
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): string {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return 'youtube';
    }
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) {
      return 'facebook';
    }
    if (lowerUrl.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (lowerUrl.includes('tiktok.com')) {
      return 'tiktok';
    }
    if (lowerUrl.includes('instagram.com')) {
      return 'instagram';
    }
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return 'twitter';
    }
    if (lowerUrl.includes('twitch.tv')) {
      return 'twitch';
    }
    if (lowerUrl.includes('dailymotion.com')) {
      return 'dailymotion';
    }
    
    return 'other';
  }

  /**
   * Disconnect from JDownloader
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.jd.disconnect();
      this.isConnected = false;
    }
  }
}

// Singleton instance
export const downloadService = new DownloadService();




