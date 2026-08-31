import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'You accessed a protected route',
    user: (req as any).user,
  })
})

export default router