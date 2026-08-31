
import { Request, Response } from 'express'
import Resume from '../models/Resume.js'

import {
  JobMatchInput,
  ResumeMatchInput,
  matchResumeToJob,
} from '../services/matchingService.js'

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

interface MatchRequestBody {
  resumeId?: string
  jobDescription?: string
}

/* =========================================================
   HELPER
   ========================================================= */

const stringValue = (
  value: unknown,
): string => {
  return typeof value === 'string'
    ? value.trim()
    : ''
}

const stringArray = (
  value: unknown,
): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (item): item is string =>
      typeof item === 'string' &&
      item.trim().length > 0,
  )
}

/* =========================================================
   MATCH RESUME WITH JOB DESCRIPTION
   ========================================================= */

export const matchResumeWithJD = async (
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
      req.body as MatchRequestBody

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

    console.log(
      '\n==============================================',
    )

    console.log(
      'RESUME/JD MATCH REQUEST',
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
       PARSED RESUME DATA
       ===================================================== */

    const parsedData =
      (resumeDocument.parsedData ??
        {}) as Record<
        string,
        unknown
      >

    /* =====================================================
       BUILD RESUME INPUT
       ===================================================== */

    const resume: ResumeMatchInput = {
      name:
        stringValue(
          parsedData.name,
        ),

      email:
        stringValue(
          parsedData.email,
        ),

      phone:
        stringValue(
          parsedData.phone,
        ),

      location:
        stringValue(
          parsedData.location,
        ),

      headline:
        stringValue(
          parsedData.headline,
        ),

      summary:
        stringValue(
          parsedData.summary,
        ),

      skills:
        stringArray(
          parsedData.skills,
        ),

      education:
        stringArray(
          parsedData.education,
        ),

      experience:
        stringArray(
          parsedData.experience,
        ),

      projects:
        stringArray(
          parsedData.projects,
        ),

      certifications:
        stringArray(
          parsedData.certifications,
        ),
    }

    /* =====================================================
       BUILD JOB INPUT
       =====================================================

       The frontend sends the complete raw job description.

       We put that raw description into `summary`.

       Gemini will use the complete text to determine:
       - required skills
       - preferred skills
       - qualifications
       - education
       - responsibilities
       - keywords

       We intentionally leave those arrays empty because
       the matching service receives the complete description.
       ===================================================== */

    const job: JobMatchInput = {
      jobTitle:
        'Job Description',

      company:
        '',

      summary:
        jobDescription,

      requiredSkills:
        [],

      preferredSkills:
        [],

      responsibilities:
        [],

      qualifications:
        [],

      education:
        [],

      keywords:
        [],
    }

    /* =====================================================
       DEBUG
       ===================================================== */

    console.log(
      '\n========== MATCH INPUT ==========\n',
    )

    console.log(
      'Resume:',
      resumeDocument.fileName,
    )

    console.log(
      'Resume name:',
      resume.name || 'Not provided',
    )

    console.log(
      'Resume email:',
      resume.email || 'Not provided',
    )

    console.log(
      'Resume phone:',
      resume.phone || 'Not provided',
    )

    console.log(
      'Resume location:',
      resume.location || 'Not provided',
    )

    console.log(
      'Resume skills:',
      resume.skills.length,
    )

    console.log(
      'Resume education:',
      resume.education.length,
    )

    console.log(
      'Resume experience:',
      resume.experience.length,
    )

    console.log(
      'Resume projects:',
      resume.projects.length,
    )

    console.log(
      'Resume certifications:',
      resume.certifications.length,
    )

    console.log(
      'Job description length:',
      job.summary.length,
    )

    console.log(
      '\n=================================\n',
    )

    /* =====================================================
       GEMINI MATCHING
       ===================================================== */

    console.log(
      '🚀 Sending resume + job description to Gemini...',
    )

    const matchResult =
      await matchResumeToJob(
        resume,
        job,
      )

    if (!matchResult) {
      throw new Error(
        'Matching service returned an empty response',
      )
    }

    /* =====================================================
       PARSE GEMINI RESULT
       ===================================================== */

    let data: unknown

    try {
      data =
        JSON.parse(
          matchResult,
        )
    } catch (error) {
      console.error(
        '❌ Invalid JSON returned by Gemini matching service:',
        matchResult,
      )

      throw new Error(
        'Matching service returned invalid JSON',
      )
    }

    /* =====================================================
       RESPONSE
       ===================================================== */

    console.log(
      '\n========== MATCH COMPLETE ==========\n',
    )

    console.log(
      JSON.stringify(
        data,
        null,
        2,
      ),
    )

    console.log(
      '\n====================================\n',
    )

    res.status(200).json({
      success: true,

      message:
        'Resume matched with job description successfully',

      data,
    })
  } catch (error: unknown) {
    console.error(
      '\n==============================================',
    )

    console.error(
      '❌ MATCHING CONTROLLER ERROR',
    )

    console.error(
      '==============================================',
    )

    console.error(
      error,
    )

    if (error instanceof Error) {
      console.error(
        'Message:',
        error.message,
      )

      console.error(
        'Stack:',
        error.stack,
      )

      res.status(500).json({
        success: false,
        message:
          error.message ||
          'Failed to match resume with job description',
      })

      return
    }

    res.status(500).json({
      success: false,
      message:
        'Failed to match resume with job description',
    })
  }
}
