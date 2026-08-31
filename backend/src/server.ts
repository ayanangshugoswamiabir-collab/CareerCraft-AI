import 'dotenv/config'

import cors from 'cors'
import express from 'express'

import connectDB from './config/db.js'

import authRoutes from './routes/authRoutes.js'
import testRoutes from './routes/testRoutes.js'
import profileRoutes from './routes/profileRoutes.js'
import resumeRoutes from './routes/resumeRoutes.js'
import jdRoutes from './routes/jdRoutes.js'
import matchingRoutes from './routes/matchingRoutes.js'
import tailoringRoutes from './routes/tailoringRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import interviewRoutes from './routes/interviewRoutes.js'

const app = express()

const PORT =
  Number(process.env.PORT) || 5000

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  'http://localhost:5173'

/* =========================================================
   CORS
   ========================================================= */

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
)

/* =========================================================
   BODY PARSING
   ========================================================= */

app.use(
  express.json({
    limit: '10mb',
  }),
)

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  }),
)

/* =========================================================
   API ROUTES
   ========================================================= */

/*
 * AUTH
 *
 * /api/auth/*
 */

app.use(
  '/api/auth',
  authRoutes,
)

/*
 * TEST
 *
 * /api/test/*
 */

app.use(
  '/api/test',
  testRoutes,
)

/*
 * PROFILE
 *
 * /api/profile/*
 */

app.use(
  '/api/profile',
  profileRoutes,
)

/*
 * RESUMES
 *
 * /api/resumes/*
 */

app.use(
  '/api/resumes',
  resumeRoutes,
)

/*
 * JOB DESCRIPTIONS
 *
 * /api/job-descriptions/*
 */

app.use(
  '/api/job-descriptions',
  jdRoutes,
)

/*
 * RESUME ↔ JOB DESCRIPTION MATCHING
 *
 * POST
 * /api/matching/analyze
 */

app.use(
  '/api/matching',
  matchingRoutes,
)

/*
 * AI RESUME TAILORING
 *
 * POST
 * /api/tailoring/generate
 */

app.use(
  '/api/tailoring',
  tailoringRoutes,
)

/*
 * JOB APPLICATIONS
 *
 * POST
 * /api/applications
 *
 * GET
 * /api/applications
 *
 * GET
 * /api/applications/:id
 *
 * PATCH
 * /api/applications/:id
 *
 * DELETE
 * /api/applications/:id
 */

app.use(
  '/api/applications',
  applicationRoutes,
)

app.use(
  '/api/interview',
  interviewRoutes,
)

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  '/api/health',
  (_req, res) => {
    res.status(200).json({
      success: true,

      message:
        'CareerCraft AI backend is running',

      timestamp:
        new Date().toISOString(),
    })
  },
)

/* =========================================================
   404 HANDLER
   ========================================================= */

app.use(
  (_req, res) => {
    res.status(404).json({
      success: false,

      message:
        'Route not found',
    })
  },
)

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(
      '❌ SERVER ERROR:',
      error,
    )

    const message =
      error instanceof Error
        ? error.message
        : 'Internal server error'

    res.status(500).json({
      success: false,
      message,
    })
  },
)

/* =========================================================
   DATABASE + SERVER
   ========================================================= */

const startServer =
  async (): Promise<void> => {
    try {
      /*
       * Connect MongoDB first.
       */

      await connectDB()

      /*
       * Start Express server.
       */

      app.listen(
        PORT,
        () => {
          console.log(
            '\n==============================================',
          )

          console.log(
            '🚀 CAREERCRAFT AI BACKEND STARTED',
          )

          console.log(
            '==============================================',
          )

          console.log(
            `Server: http://localhost:${PORT}`,
          )

          console.log(
            `Health: http://localhost:${PORT}/api/health`,
          )

          console.log(
            `Matching: POST http://localhost:${PORT}/api/matching/analyze`,
          )

          console.log(
            `Tailoring: POST http://localhost:${PORT}/api/tailoring/generate`,
          )

          console.log(
            `Applications: http://localhost:${PORT}/api/applications`,
          )

          console.log(
            '==============================================\n',
          )
        },
      )
    } catch (error: unknown) {
      console.error(
        '❌ Failed to start CareerCraft AI backend:',
        error,
      )

      process.exit(1)
    }
  }

void startServer()