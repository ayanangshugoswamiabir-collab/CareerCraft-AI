import { Request, Response } from 'express'
import Resume from '../models/Resume.js'

import {
  tailorResume,
  TailoringInput,
} from '../services/tailoringService.js'

/* =========================================================
   AUTHENTICATED REQUEST
   ========================================================= */

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

/* =========================================================
   REQUEST BODY
   ========================================================= */

interface TailoringRequestBody {
  resumeId?: string
  jobDescription?: string
  matchResult?: unknown
}

/* =========================================================
   HELPERS
   ========================================================= */

const stringValue = (
  value: unknown,
): string => {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

/* =========================================================
   TAILOR RESUME
   ========================================================= */

export const tailorResumeForJob = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    /* =====================================================
       AUTHENTICATION
       ===================================================== */

    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })

      return
    }

    /* =====================================================
       REQUEST DATA
       ===================================================== */

    const body =
      req.body as TailoringRequestBody

    const resumeId =
      stringValue(body.resumeId)

    const jobDescription =
      stringValue(body.jobDescription)

    if (!resumeId) {
      res.status(400).json({
        success: false,
        message: 'Resume ID is required',
      })

      return
    }

    if (!jobDescription) {
      res.status(400).json({
        success: false,
        message: 'Job description is required',
      })

      return
    }

    if (!body.matchResult) {
      res.status(400).json({
        success: false,
        message: 'Match analysis is required',
      })

      return
    }

    console.log(
      '\n==============================================',
    )

    console.log(
      'AI RESUME TAILORING REQUEST',
    )

    console.log(
      '==============================================',
    )

    console.log(
      'User ID:',
      userId,
    )

    console.log(
      'Resume ID:',
      resumeId,
    )

    console.log(
      'Job description length:',
      jobDescription.length,
    )

    /* =====================================================
       FIND USER RESUME
       ===================================================== */

    const resumeDocument =
      await Resume.findOne({
        _id: resumeId,
        userId,
      }).select(
        '-fileData',
      )

    if (!resumeDocument) {
      res.status(404).json({
        success: false,
        message: 'Resume not found',
      })

      return
    }

    /* =====================================================
       ORIGINAL PARSED RESUME
       ===================================================== */

    const parsedData =
      (resumeDocument.parsedData ??
        {}) as Record<
        string,
        unknown
      >

    /*
     * Convert the parsed resume into readable text.
     *
     * We do this instead of sending raw MongoDB data
     * because Gemini should receive a clean representation
     * of the candidate's actual resume.
     */

    const resumeText = JSON.stringify(
      parsedData,
      null,
      2,
    )

    /* =====================================================
       MATCH ANALYSIS
       ===================================================== */

    const matchAnalysis =
      JSON.stringify(
        body.matchResult,
        null,
        2,
      )

    /* =====================================================
       TAILORING INPUT
       ===================================================== */

    const input: TailoringInput = {
      resume: resumeText,

      jobDescription,

      matchAnalysis,
    }

    /* =====================================================
       DEBUG
       ===================================================== */

    console.log(
      '\n========== TAILORING INPUT ==========\n',
    )

    console.log(
      'Resume:',
      resumeDocument.fileName,
    )

    console.log(
      'Resume data length:',
      resumeText.length,
    )

    console.log(
      'JD length:',
      jobDescription.length,
    )

    console.log(
      'Match analysis length:',
      matchAnalysis.length,
    )

    console.log(
      '\n======================================\n',
    )

    /* =====================================================
       GEMINI TAILORING
       ===================================================== */

    console.log(
      '🚀 Sending resume + JD + analysis to Gemini...',
    )

    const tailoredResume =
      await tailorResume(
        input,
      )

    if (!tailoredResume) {
      throw new Error(
        'Tailoring service returned an empty response',
      )
    }

    /* =====================================================
       PARSE RESULT
       ===================================================== */

    let data: unknown

    try {
      data =
        JSON.parse(
          tailoredResume,
        )
    } catch {
      console.error(
        '❌ Invalid tailored resume JSON:',
        tailoredResume,
      )

      throw new Error(
        'Tailoring service returned invalid JSON',
      )
    }

    /* =====================================================
       RESPONSE
       ===================================================== */

    console.log(
      '\n========== TAILORING COMPLETE ==========\n',
    )

    console.log(
      JSON.stringify(
        data,
        null,
        2,
      ),
    )

    console.log(
      '\n=========================================\n',
    )

    res.status(200).json({
      success: true,

      message:
        'Resume tailored successfully',

      data,
    })
  } catch (error: unknown) {
    console.error(
      '\n==============================================',
    )

    console.error(
      '❌ RESUME TAILORING CONTROLLER ERROR',
    )

    console.error(
      '==============================================',
    )

    console.error(error)

    if (error instanceof Error) {
      console.error(
        'Message:',
        error.message,
      )

      res.status(500).json({
        success: false,
        message:
          error.message ||
          'Failed to tailor resume',
      })

      return
    }

    res.status(500).json({
      success: false,
      message:
        'Failed to tailor resume',
    })
  }
}