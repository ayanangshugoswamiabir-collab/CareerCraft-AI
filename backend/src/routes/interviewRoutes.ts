
import { Router } from 'express'

import {
  generateInterviewQuestion,
  evaluateInterviewAnswer,
} from '../services/interviewService.js'

const router = Router()

/* =========================================================
   TEST ROUTE
   ========================================================= */

/*
 * GET /api/interview/test
 */

router.get('/test', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Interview route is working',
  })
})

/* =========================================================
   START INTERVIEW
   ========================================================= */

/*
 * POST /api/interview/start
 *
 * Body:
 *
 * {
 *   "interviewType": "Technical",
 *   "jobDescription": "..."
 * }
 */

router.post('/start', async (req, res) => {
  try {
    const {
      interviewType,
      jobDescription,
    } = req.body

    /* =====================================================
       VALIDATE JD
       ===================================================== */

    if (
      typeof jobDescription !== 'string' ||
      !jobDescription.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required',
      })
    }

    /* =====================================================
       LOG REQUEST
       ===================================================== */

    console.log(
      '\n==============================================',
    )

    console.log(
      '🎤 INTERVIEW START REQUEST',
    )

    console.log(
      'Interview Type:',
      interviewType || 'General',
    )

    console.log(
      'JD Length:',
      jobDescription.length,
    )

    console.log(
      '==============================================',
    )

    /* =====================================================
       GENERATE FIRST QUESTION
       ===================================================== */

    const result =
      await generateInterviewQuestion({
        interviewType:
          interviewType || 'General',

        jobDescription:
          jobDescription.trim(),
      })

    /* =====================================================
       RESPONSE
       ===================================================== */

    console.log(
      '\n✅ INTERVIEW STARTED SUCCESSFULLY',
    )

    console.log(
      '🤖 AI QUESTION:',
      result.question,
    )

    return res.status(200).json({
      success: true,

      message:
        'Interview started successfully',

      interviewType:
        result.interviewType,

      question:
        result.question,
    })
  } catch (error: unknown) {
    console.error(
      '\n❌ INTERVIEW START FAILED',
    )

    if (error instanceof Error) {
      console.error(
        error.message,
      )
    } else {
      console.error(error)
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to start interview'

    return res.status(500).json({
      success: false,
      message,
    })
  }
})

/* =========================================================
   EVALUATE INTERVIEW ANSWER
   ========================================================= */

/*
 * POST /api/interview/evaluate
 *
 * Body:
 *
 * {
 *   "interviewType": "Technical",
 *   "jobDescription": "...",
 *   "question": "How would you design a REST API using Node.js?",
 *   "answer": "I would first define the routes..."
 * }
 */

router.post('/evaluate', async (req, res) => {
  try {
    const {
      interviewType,
      jobDescription,
      question,
      answer,
    } = req.body

    /* =====================================================
       VALIDATE JOB DESCRIPTION
       ===================================================== */

    if (
      typeof jobDescription !== 'string' ||
      !jobDescription.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Job description is required',
      })
    }

    /* =====================================================
       VALIDATE QUESTION
       ===================================================== */

    if (
      typeof question !== 'string' ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Interview question is required',
      })
    }

    /* =====================================================
       VALIDATE ANSWER
       ===================================================== */

    if (
      typeof answer !== 'string' ||
      !answer.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Candidate answer is required',
      })
    }

    /* =====================================================
       LOG REQUEST
       ===================================================== */

    console.log(
      '\n==============================================',
    )

    console.log(
      '🧠 INTERVIEW ANSWER EVALUATION REQUEST',
    )

    console.log(
      '==============================================',
    )

    console.log(
      'Interview Type:',
      interviewType || 'General',
    )

    console.log(
      'Question:',
      question,
    )

    console.log(
      'Answer:',
      answer,
    )

    console.log(
      '==============================================',
    )

    /* =====================================================
       EVALUATE ANSWER
       ===================================================== */

    const result =
      await evaluateInterviewAnswer({
        interviewType:
          interviewType || 'General',

        jobDescription:
          jobDescription.trim(),

        question:
          question.trim(),

        answer:
          answer.trim(),
      })

    /* =====================================================
       LOG RESULT
       ===================================================== */

    console.log(
      '\n✅ ANSWER EVALUATED SUCCESSFULLY',
    )

    console.log(
      '📊 SCORE:',
      result.score,
    )

    console.log(
      '💬 FEEDBACK:',
      result.feedback,
    )

    console.log(
      '➡️ NEXT QUESTION:',
      result.nextQuestion,
    )

    /* =====================================================
       RESPONSE
       ===================================================== */

    return res.status(200).json({
      success: true,

      message:
        'Interview answer evaluated successfully',

      score:
        result.score,

      strengths:
        result.strengths,

      improvements:
        result.improvements,

      feedback:
        result.feedback,

      nextQuestion:
        result.nextQuestion,
    })
  } catch (error: unknown) {
    console.error(
      '\n❌ INTERVIEW ANSWER EVALUATION FAILED',
    )

    if (error instanceof Error) {
      console.error(
        error.message,
      )
    } else {
      console.error(error)
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to evaluate interview answer'

    return res.status(500).json({
      success: false,
      message,
    })
  }
})

/* =========================================================
   EXPORT ROUTER
   ========================================================= */

export default router

