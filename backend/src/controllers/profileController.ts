import { Request, Response } from 'express'
import User from '../models/User.js'

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Get profile error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    const {
      name,
      profile,
    } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(name !== undefined && { name }),
        ...(profile !== undefined && { profile }),
      },
      {
        new: true,
        runValidators: true,
      },
    ).select('-password')

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update profile error:', error)

    return res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}