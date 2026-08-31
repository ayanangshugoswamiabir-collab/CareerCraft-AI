
import { Router } from 'express'

import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} from '../controllers/applicationController.js'

import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

/*
 * =========================================================
 * JOB APPLICATION ROUTES
 * =========================================================
 */

/*
 * Create application
 * POST /api/applications
 */
router.post(
  '/',
  authMiddleware,
  createApplication,
)

/*
 * Get all applications
 * GET /api/applications
 */
router.get(
  '/',
  authMiddleware,
  getApplications,
)

/*
 * Get application by ID
 * GET /api/applications/:id
 */
router.get(
  '/:id',
  authMiddleware,
  getApplicationById,
)

/*
 * Update application
 * PATCH /api/applications/:id
 */
router.patch(
  '/:id',
  authMiddleware,
  updateApplication,
)

/*
 * Delete application
 * DELETE /api/applications/:id
 */
router.delete(
  '/:id',
  authMiddleware,
  deleteApplication,
)

export default router

