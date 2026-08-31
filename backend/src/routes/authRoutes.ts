
import { Router } from 'express'

import {
  login,
  register,
  googleLogin,
} from '../controllers/authController.js'

const router = Router()

router.post(
  '/register',
  register,
)

router.post(
  '/login',
  login,
)

router.post(
  '/google',
  googleLogin,
)

export default router
