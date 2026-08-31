
import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'

/* =========================================================
   GOOGLE CLIENT
   ========================================================= */

const googleClientId =
  process.env.GOOGLE_CLIENT_ID

const googleClient = new OAuth2Client(
  googleClientId,
)

/* =========================================================
   JWT HELPER
   ========================================================= */

const createJwtToken = (
  userId: string,
  email: string,
) => {
  const jwtSecret =
    process.env.JWT_SECRET

  if (!jwtSecret) {
    throw new Error(
      'JWT secret is not configured',
    )
  }

  return jwt.sign(
    {
      userId,
      email,
    },
    jwtSecret,
    {
      expiresIn: '7d',
    },
  )
}

/* =========================================================
   REGISTER
   ========================================================= */

export const register = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email and password are required',
      })
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'User already exists',
      })
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10,
      )

    const user =
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      })

    return res.status(201).json({
      success: true,
      message:
        'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error(
      'Registration error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

/* =========================================================
   LOGIN
   ========================================================= */

export const login = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      email,
      password,
    } = req.body

    if (
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Email and password are required',
      })
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    const user =
      await User.findOne({
        email: normalizedEmail,
      })

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password',
      })
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          'This account uses Google login. Please continue with Google.',
      })
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password,
      )

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password',
      })
    }

    const token =
      createJwtToken(
        user._id.toString(),
        user.email,
      )

    return res.status(200).json({
      success: true,
      message:
        'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture:
          user.profilePicture || '',
      },
    })
  } catch (error) {
    console.error(
      'Login error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message: 'Server error',
    })
  }
}

/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

export const googleLogin = async (
  req: Request,
  res: Response,
) => {
  try {
    const { credential } =
      req.body

    if (!credential) {
      return res.status(400).json({
        success: false,
        message:
          'Google credential is required',
      })
    }

    if (!googleClientId) {
      console.error(
        'GOOGLE_CLIENT_ID is missing from .env',
      )

      return res.status(500).json({
        success: false,
        message:
          'Google authentication is not configured',
      })
    }

    /* =====================================================
       VERIFY GOOGLE ID TOKEN
       ===================================================== */

    const ticket =
      await googleClient.verifyIdToken({
        idToken: credential,
        audience:
          googleClientId,
      })

    const payload =
      ticket.getPayload()

    if (!payload) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid Google credential',
      })
    }

    const {
      sub,
      email,
      name,
      picture,
      email_verified,
    } = payload

    if (
      !sub ||
      !email
    ) {
      return res.status(401).json({
        success: false,
        message:
          'Google account information is incomplete',
      })
    }

    if (email_verified !== true) {
      return res.status(401).json({
        success: false,
        message:
          'Google email is not verified',
      })
    }

    const normalizedEmail =
      email.trim().toLowerCase()

    /* =====================================================
       FIND USER
       ===================================================== */

    let user =
      await User.findOne({
        $or: [
          {
            googleId: sub,
          },
          {
            email:
              normalizedEmail,
          },
        ],
      })

    /* =====================================================
       CREATE USER
       ===================================================== */

    if (!user) {
      user =
        await User.create({
          name:
            name?.trim() ||
            normalizedEmail.split('@')[0],

          email:
            normalizedEmail,

          googleId: sub,

          profilePicture:
            picture || '',

          profile: {
            headline: '',
            bio: '',
            phone: '',
            location: '',
            skills: [],
            education: [],
            experience: [],
          },
        })

      console.log(
        '✅ New Google user created:',
        normalizedEmail,
      )
    } else {
      /* ===================================================
         UPDATE EXISTING USER WITH GOOGLE INFORMATION
         =================================================== */

      let changed = false

      if (
        !user.googleId
      ) {
        user.googleId = sub
        changed = true
      }

      if (
        picture &&
        user.profilePicture !==
          picture
      ) {
        user.profilePicture =
          picture
        changed = true
      }

      if (
        name &&
        user.name !== name
      ) {
        user.name = name
        changed = true
      }

      if (changed) {
        await user.save()
      }

      console.log(
        '✅ Existing user logged in with Google:',
        normalizedEmail,
      )
    }

    /* =====================================================
       CREATE CAREERCRAFT JWT
       ===================================================== */

    const token =
      createJwtToken(
        user._id.toString(),
        user.email,
      )

    /* =====================================================
       RESPONSE
       ===================================================== */

    return res.status(200).json({
      success: true,
      message:
        'Google login successful',

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture:
          user.profilePicture || '',
      },
    })
  } catch (error) {
    console.error(
      'Google login error:',
      error,
    )

    return res.status(401).json({
      success: false,
      message:
        'Google authentication failed',
    })
  }
}

