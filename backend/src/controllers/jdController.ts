
import { Request, Response } from 'express'
import { analyzeJobDescription } from '../services/jdService.js'

interface ErrorWithMessage {
  message?: string
  status?: number
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    const value = (error as ErrorWithMessage).message

    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return 'Failed to analyze job description'
}

const getErrorStatus = (error: unknown): number => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error
  ) {
    const status = (error as ErrorWithMessage).status

    if (
      typeof status === 'number' &&
      status >= 400 &&
      status < 600
    ) {
      return status
    }
  }

  return 500
}

export const analyzeJD = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { jobDescription } = req.body

    if (
      typeof jobDescription !== 'string' ||
      !jobDescription.trim()
    ) {
      res.status(400).json({
        success: false,
        message: 'Job description is required',
      })

      return
    }

    const analysis = await analyzeJobDescription(
      jobDescription,
    )

    let parsedAnalysis: unknown

    try {
      parsedAnalysis = JSON.parse(analysis)
    } catch {
      res.status(500).json({
        success: false,
        message:
          'The AI returned an invalid job description analysis.',
      })

      return
    }

    res.status(200).json({
      success: true,
      message: 'Job description analyzed successfully',
      data: parsedAnalysis,
    })
  } catch (error: unknown) {
    console.error(
      '❌ JD CONTROLLER ERROR:',
      error,
    )

    const message = getErrorMessage(error)
    const errorStatus = getErrorStatus(error)

    res.status(errorStatus).json({
      success: false,
      message,
    })
  }
}
