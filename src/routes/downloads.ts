/**
 * Download API Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { downloadService } from '../services/download-service.js';

const router = Router();

// Validation schemas
const submitDownloadSchema = z.object({
  url: z.string().url('Invalid URL format'),
  mediaType: z.enum(['video', 'audio', 'both']).optional().default('video'),
  preferredQuality: z.string().optional().default('1080p'),
  packageName: z.string().optional(),
  targetCourseId: z.string().uuid().optional(),
  targetChapterId: z.string().uuid().optional()
});

const cancelJobSchema = z.object({
  jobId: z.string().uuid()
});

/**
 * POST /api/downloads
 * Submit a new download request
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = submitDownloadSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      });
    }

    const { url, mediaType, preferredQuality, packageName, targetCourseId, targetChapterId } = validation.data;
    
    // Get user ID from auth header if present (integrate with your auth system)
    const userId = req.headers['x-user-id'] as string | undefined;

    const job = await downloadService.submitDownload({
      userId,
      url,
      mediaType,
      preferredQuality,
      packageName,
      targetCourseId,
      targetChapterId
    });

    res.status(201).json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        sourceUrl: job.source_url,
        sourcePlatform: job.source_platform,
        createdAt: job.created_at
      }
    });

  } catch (error) {
    console.error('Submit download error:', error);
    res.status(500).json({
      error: 'Failed to submit download',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/downloads/:jobId
 * Get download job status and progress
 */
router.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!z.string().uuid().safeParse(jobId).success) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }

    const progress = await downloadService.getProgress(jobId);

    if (!progress) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      success: true,
      ...progress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      error: 'Failed to get download progress',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/downloads/user/:userId
 * Get all download jobs for a user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!z.string().uuid().safeParse(userId).success) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const jobs = await downloadService.getUserJobs(userId, limit);

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        sourceUrl: job.source_url,
        sourcePlatform: job.source_platform,
        title: job.title,
        fileName: job.file_name,
        fileSize: job.file_size,
        thumbnailUrl: job.thumbnail_url,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        errorMessage: job.error_message
      }))
    });

  } catch (error) {
    console.error('Get user jobs error:', error);
    res.status(500).json({
      error: 'Failed to get user downloads',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/downloads/:jobId/cancel
 * Cancel a download job
 */
router.post('/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!z.string().uuid().safeParse(jobId).success) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }

    await downloadService.cancelJob(jobId);

    res.json({
      success: true,
      message: 'Download cancelled'
    });

  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({
      error: 'Failed to cancel download',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/downloads/:jobId/retry
 * Retry a failed download job
 */
router.post('/:jobId/retry', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!z.string().uuid().safeParse(jobId).success) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }

    const job = await downloadService.retryJob(jobId);

    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        retryCount: job.retry_count
      }
    });

  } catch (error) {
    console.error('Retry job error:', error);
    res.status(500).json({
      error: 'Failed to retry download',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as downloadRoutes };




