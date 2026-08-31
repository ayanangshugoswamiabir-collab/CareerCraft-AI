import { Router } from 'express'
import { matchResumeWithJD } from '../controllers/matchingController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.post(
  '/analyze',
  authMiddleware,
  matchResumeWithJD,
)

export default router