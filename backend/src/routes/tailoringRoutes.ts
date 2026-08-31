import { Router } from 'express'

import {
  tailorResumeForJob,
} from '../controllers/tailoringController.js'

import {
  authMiddleware,
} from '../middleware/authMiddleware.js'

const router = Router()

router.post(
  '/generate',
  authMiddleware,
  tailorResumeForJob,
)

export default router