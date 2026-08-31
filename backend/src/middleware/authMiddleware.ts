
import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

interface JwtPayload {
  userId: string
  email: string
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured',
      })
    }

    /**
     * ==========================================
     * GET TOKEN
     * ==========================================
     *
     * First try:
     * Authorization: Bearer <token>
     *
     * If that does not exist, try common
     * cookie names.
     */

    const authHeader =
      req.headers.authorization

    let token: string | undefined

    if (
      authHeader &&
      authHeader.startsWith('Bearer ')
    ) {
      token = authHeader
        .substring(7)
        .trim()
    }

    /**
     * Support cookie authentication.
     *
     * This requires cookie-parser to be
     * registered in your Express app.
     */

    if (!token && req.cookies) {
      token =
        req.cookies.token ||
        req.cookies.accessToken ||
        req.cookies.authToken
    }

    /**
     * No token found.
     */

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
      })
    }

    /**
     * ==========================================
     * VERIFY TOKEN
     * ==========================================
     */

    const decoded =
      jwt.verify(
        token,
        jwtSecret,
      )

    if (
      typeof decoded === 'string'
    ) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid authentication token',
      })
    }

    const payload =
      decoded as JwtPayload

    /**
     * Make sure the JWT actually contains
     * the fields our application needs.
     */

    if (!payload.userId) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid authentication token',
      })
    }

    /**
     * Attach authenticated user to request.
     */

    req.user = {
      userId: payload.userId,
      email: payload.email || '',
    }

    next()
  } catch (error) {
    console.error(
      'Authentication middleware error:',
      error,
    )

    return res.status(401).json({
      success: false,
      message:
        'Invalid or expired authentication token',
    })
  }
}
