import { Router } from 'express'

import {
  uploadResume,
  getResumes,
  getResumeById,
  deleteResume,
  analyzeResume,
} from '../controllers/resumeController.js'

import { authMiddleware } from '../middleware/authMiddleware.js'
import upload from '../middleware/uploadMiddleware.js'

const router = Router()

router.post(
  '/',
  authMiddleware,
  upload.single('resume'),
  uploadResume,
)

router.get(
  '/',
  authMiddleware,
  getResumes,
)

router.get(
  '/:id/analyze',
  authMiddleware,
  analyzeResume,
)

router.get(
  '/:id',
  authMiddleware,
  getResumeById,
)

router.delete(
  '/:id',
  authMiddleware,
  deleteResume,
)

export default router