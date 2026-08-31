
import { Request, Response } from 'express'
import Resume from '../models/Resume.js'
import { extractTextFromPDF } from '../utils/resumeParser.js'
import { parseResumeWithAI } from '../services/openaiService.js'

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

interface ParsedResumeData {
  name?: string
  email?: string
  phone?: string
  location?: string
  headline?: string
  summary?: string
  skills?: string[]
  education?: unknown[]
  experience?: unknown[]
  projects?: unknown[]
  certifications?: unknown[]
}

const safeString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const safeArray = (value: unknown): unknown[] => {
  return Array.isArray(value) ? value : []
}

/**
 * ============================================
 * ATS SCORE HELPERS
 * ============================================
 */

const calculateContactScore = (
  parsedData: ParsedResumeData,
): number => {
  let score = 0

  if (safeString(parsedData.name)) {
    score += 3
  }

  if (safeString(parsedData.email)) {
    score += 3
  }

  if (safeString(parsedData.phone)) {
    score += 2
  }

  if (safeString(parsedData.location)) {
    score += 2
  }

  return score
}

const calculateStructureScore = (
  parsedData: ParsedResumeData,
  experience: unknown[],
  education: unknown[],
  projects: unknown[],
): number => {
  let score = 0

  if (safeString(parsedData.headline)) {
    score += 4
  }

  if (safeString(parsedData.summary)) {
    score += 5
  }

  if (safeArray(parsedData.skills).length > 0) {
    score += 3
  }

  if (experience.length > 0) {
    score += 3
  }

  if (education.length > 0) {
    score += 3
  }

  if (projects.length > 0) {
    score += 2
  }

  return score
}

const calculateSkillsScore = (
  skills: unknown[],
): number => {
  const count = skills.length

  if (count === 0) {
    return 0
  }

  if (count <= 4) {
    return 5
  }

  if (count <= 9) {
    return 8
  }

  if (count <= 14) {
    return 12
  }

  return 15
}

const calculateExperienceScore = (
  experience: unknown[],
): number => {
  if (experience.length === 0) {
    return 0
  }

  let score = 8

  let hasJobInformation = false
  let hasDates = false
  let hasDescription = false

  for (const item of experience) {
    if (
      typeof item !== 'object' ||
      item === null
    ) {
      continue
    }

    const record =
      item as Record<string, unknown>

    const jobTitle =
      safeString(record.jobTitle)

    const company =
      safeString(record.company)

    const startDate =
      safeString(record.startDate)

    const endDate =
      safeString(record.endDate)

    const description =
      safeString(record.description)

    if (jobTitle || company) {
      hasJobInformation = true
    }

    if (startDate || endDate) {
      hasDates = true
    }

    if (description) {
      hasDescription = true
    }
  }

  if (hasJobInformation) {
    score += 4
  }

  if (hasDates) {
    score += 3
  }

  if (hasDescription) {
    score += 5
  }

  return Math.min(score, 20)
}

const calculateProjectsScore = (
  projects: unknown[],
): number => {
  if (projects.length === 0) {
    return 0
  }

  let score = 5

  if (projects.length >= 2) {
    score += 2
  }

  let hasDescription = false
  let hasTechnologies = false

  for (const item of projects) {
    if (
      typeof item !== 'object' ||
      item === null
    ) {
      continue
    }

    const record =
      item as Record<string, unknown>

    if (safeString(record.description)) {
      hasDescription = true
    }

    if (
      safeArray(
        record.technologies,
      ).length > 0
    ) {
      hasTechnologies = true
    }
  }

  if (hasDescription) {
    score += 2
  }

  if (hasTechnologies) {
    score += 1
  }

  return Math.min(score, 10)
}

const calculateEducationScore = (
  education: unknown[],
): number => {
  if (education.length === 0) {
    return 0
  }

  let score = 5

  let hasBasicInformation = false
  let hasField = false
  let hasDates = false
  let hasDescription = false

  for (const item of education) {
    if (
      typeof item !== 'object' ||
      item === null
    ) {
      continue
    }

    const record =
      item as Record<string, unknown>

    const degree =
      safeString(record.degree)

    const institution =
      safeString(record.institution)

    const fieldOfStudy =
      safeString(record.fieldOfStudy)

    const startDate =
      safeString(record.startDate)

    const endDate =
      safeString(record.endDate)

    const description =
      safeString(record.description)

    if (degree || institution) {
      hasBasicInformation = true
    }

    if (fieldOfStudy) {
      hasField = true
    }

    if (startDate || endDate) {
      hasDates = true
    }

    if (description) {
      hasDescription = true
    }
  }

  if (hasBasicInformation) {
    score += 2
  }

  if (hasField) {
    score += 1
  }

  if (hasDates) {
    score += 1
  }

  if (hasDescription) {
    score += 1
  }

  return Math.min(score, 10)
}

const calculateKeywordsScore = (
  parsedData: ParsedResumeData,
  resumeText: string,
): number => {
  let score = 0

  const skills = safeArray(
    parsedData.skills,
  )
    .filter(
      (skill): skill is string =>
        typeof skill === 'string',
    )
    .map((skill) => skill.trim())
    .filter(Boolean)

  if (skills.length >= 15) {
    score += 5
  } else if (skills.length >= 10) {
    score += 4
  } else if (skills.length >= 5) {
    score += 3
  } else if (skills.length >= 2) {
    score += 2
  } else if (skills.length === 1) {
    score += 1
  }

  const text = resumeText.toLowerCase()

  const technicalKeywords = [
    'api',
    'database',
    'javascript',
    'typescript',
    'python',
    'java',
    'react',
    'node',
    'sql',
    'mongodb',
    'git',
    'github',
    'cloud',
    'aws',
    'azure',
    'docker',
    'rest',
    'frontend',
    'backend',
    'full stack',
  ]

  let technicalMatches = 0

  for (const keyword of technicalKeywords) {
    if (text.includes(keyword)) {
      technicalMatches++
    }
  }

  if (technicalMatches >= 8) {
    score += 3
  } else if (technicalMatches >= 5) {
    score += 2
  } else if (technicalMatches >= 2) {
    score += 1
  }

  const actionKeywords = [
    'developed',
    'built',
    'implemented',
    'designed',
    'engineered',
    'created',
    'managed',
    'led',
    'optimized',
    'deployed',
  ]

  let actionMatches = 0

  for (const keyword of actionKeywords) {
    if (text.includes(keyword)) {
      actionMatches++
    }
  }

  if (actionMatches >= 5) {
    score += 2
  } else if (actionMatches >= 2) {
    score += 1
  }

  return Math.min(score, 10)
}

const calculateFormattingScore = (
  resumeText: string,
): number => {
  const text = resumeText.trim()

  if (!text) {
    return 0
  }

  let score = 0

  const lowerText = text.toLowerCase()

  const sectionKeywords = [
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'summary',
    'profile',
  ]

  let sectionCount = 0

  for (const section of sectionKeywords) {
    if (lowerText.includes(section)) {
      sectionCount++
    }
  }

  if (sectionCount >= 4) {
    score += 2
  } else if (sectionCount >= 2) {
    score += 1
  }

  const bulletMatches =
    text.match(
      /(^|\n)\s*[-•▪◦*]\s+/g,
    )

  if (
    bulletMatches &&
    bulletMatches.length >= 2
  ) {
    score += 1
  }

  if (
    text.length >= 500 &&
    text.length <= 15000
  ) {
    score += 1
  }

  const corruptionPatterns = [
    /\x00/,
    /�{2,}/,
  ]

  const hasCorruption =
    corruptionPatterns.some(
      (pattern) => pattern.test(text),
    )

  if (!hasCorruption) {
    score += 1
  }

  return Math.min(score, 5)
}

/**
 * ============================================
 * UPLOAD RESUME
 * ============================================
 */

export const uploadResume = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    console.log(
      '\n======================================',
    )

    console.log(
      'RESUME UPLOAD STARTED',
    )

    console.log(
      '======================================',
    )

    const userId = req.user?.userId

    console.log(
      'Authenticated user:',
      req.user,
    )

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          'Resume file is required',
      })
    }

    console.log(
      'File:',
      req.file.originalname,
    )

    console.log(
      'Mimetype:',
      req.file.mimetype,
    )

    console.log(
      'Size:',
      req.file.size,
    )

    if (
      req.file.mimetype !==
      'application/pdf'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Only PDF files are currently supported',
      })
    }

    console.log(
      '\n[1/3] Extracting PDF text...',
    )

    const resumeText =
      await extractTextFromPDF(
        req.file.buffer,
      )

    if (
      !resumeText ||
      !resumeText.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Could not extract text from resume. The PDF may be image-based or scanned.',
      })
    }

    console.log(
      'Extracted characters:',
      resumeText.length,
    )

    console.log(
      '[2/3] Parsing resume with AI...',
    )

    const parsedResume =
      await parseResumeWithAI(
        resumeText,
      )

    if (!parsedResume) {
      throw new Error(
        'Resume parser returned an empty response',
      )
    }

    let parsedData: ParsedResumeData

    try {
      let cleanResponse =
        parsedResume.trim()

      cleanResponse =
        cleanResponse.replace(
          /^```json\s*/i,
          '',
        )

      cleanResponse =
        cleanResponse.replace(
          /^```\s*/i,
          '',
        )

      cleanResponse =
        cleanResponse.replace(
          /\s*```$/i,
          '',
        )

      parsedData =
        JSON.parse(
          cleanResponse,
        ) as ParsedResumeData
    } catch (error) {
      console.error(
        'JSON parsing failed:',
        error,
      )

      console.error(
        'Parser output:',
        parsedResume,
      )

      return res.status(502).json({
        success: false,
        message:
          'Parser returned an invalid resume format',
      })
    }

    parsedData.skills =
      Array.isArray(
        parsedData.skills,
      )
        ? parsedData.skills
        : []

    parsedData.education =
      Array.isArray(
        parsedData.education,
      )
        ? parsedData.education
        : []

    parsedData.experience =
      Array.isArray(
        parsedData.experience,
      )
        ? parsedData.experience
        : []

    parsedData.projects =
      Array.isArray(
        parsedData.projects,
      )
        ? parsedData.projects
        : []

    parsedData.certifications =
      Array.isArray(
        parsedData.certifications,
      )
        ? parsedData.certifications
        : []

    console.log(
      '[3/3] Saving resume to MongoDB...',
    )

    const resume =
      await Resume.create({
        userId,
        fileName:
          req.file.originalname,
        fileType:
          req.file.mimetype,
        fileSize:
          req.file.size,
        fileData:
          req.file.buffer,
        extractedText:
          resumeText,
        parsedData,
      })

    console.log(
      'Resume saved successfully:',
      resume._id.toString(),
    )

    const resumeData = {
      _id: resume._id,
      id: resume._id,
      userId: resume.userId,
      fileName: resume.fileName,
      fileType: resume.fileType,
      fileSize: resume.fileSize,
      uploadedAt:
        resume.uploadedAt,
      parsedData:
        resume.parsedData,
    }

    return res.status(201).json({
      success: true,

      message:
        'Resume uploaded and parsed successfully',

      data: resumeData,

      resume: resumeData,
    })
  } catch (error: any) {
    console.error(
      '\n======================================',
    )

    console.error(
      'RESUME UPLOAD ERROR',
    )

    console.error(
      '======================================',
    )

    console.error(
      'Error:',
      error,
    )

    console.error(
      'Message:',
      error?.message,
    )

    console.error(
      'Stack:',
      error?.stack,
    )

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Failed to upload and parse resume',
    })
  }
}

/**
 * ============================================
 * GET ALL RESUMES
 * ============================================
 */

export const getResumes = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId =
      req.user?.userId

    console.log(
      'GET RESUMES user:',
      req.user,
    )

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      })
    }

    const resumes =
      await Resume.find({
        userId,
      })
        .select(
          '-fileData -extractedText',
        )
        .sort({
          uploadedAt: -1,
        })

    console.log(
      `Found ${resumes.length} resumes for user ${userId}`,
    )

    /**
     * Return the resumes using BOTH
     * response properties.
     *
     * This keeps the API compatible with
     * the current frontend and also provides
     * the standard data property.
     */
    return res.status(200).json({
      success: true,
      resumes,
      data: resumes,
    })
  } catch (error: any) {
    console.error(
      'Get resumes error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Failed to retrieve resumes',
    })
  }
}

/**
 * ============================================
 * GET ONE RESUME
 * ============================================
 */

export const getResumeById = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId =
      req.user?.userId

    const resumeId =
      req.params.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      })
    }

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message:
          'Resume ID is required',
      })
    }

    const resume =
      await Resume.findOne({
        _id: resumeId,
        userId,
      }).select(
        '-fileData',
      )

    if (!resume) {
      return res.status(404).json({
        success: false,
        message:
          'Resume not found',
      })
    }

    return res.status(200).json({
      success: true,
      data: resume,
      resume,
    })
  } catch (error: any) {
    console.error(
      'Get resume error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Failed to retrieve resume',
    })
  }
}

/**
 * ============================================
 * DELETE RESUME
 * ============================================
 */

export const deleteResume = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId =
      req.user?.userId

    const resumeId =
      req.params.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      })
    }

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message:
          'Resume ID is required',
      })
    }

    const resume =
      await Resume.findOneAndDelete({
        _id: resumeId,
        userId,
      })

    if (!resume) {
      return res.status(404).json({
        success: false,
        message:
          'Resume not found',
      })
    }

    return res.status(200).json({
      success: true,
      message:
        'Resume deleted successfully',
    })
  } catch (error: any) {
    console.error(
      'Delete resume error:',
      error,
    )

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Failed to delete resume',
    })
  }
}

/**
 * ============================================
 * ANALYZE RESUME
 * ============================================
 */

export const analyzeResume = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId =
      req.user?.userId

    const resumeId =
      req.params.id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      })
    }

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message:
          'Resume ID is required',
      })
    }

    const resume =
      await Resume.findOne({
        _id: resumeId,
        userId,
      }).select(
        '-fileData',
      )

    if (!resume) {
      return res.status(404).json({
        success: false,
        message:
          'Resume not found',
      })
    }

    const parsedData =
      (resume.parsedData ??
        {}) as ParsedResumeData

    const skills =
      safeArray(
        parsedData.skills,
      )

    const education =
      safeArray(
        parsedData.education,
      )

    const experience =
      safeArray(
        parsedData.experience,
      )

    const projects =
      safeArray(
        parsedData.projects,
      )

    const certifications =
      safeArray(
        parsedData.certifications,
      )

    const resumeText =
      typeof resume.extractedText ===
      'string'
        ? resume.extractedText
        : ''

    const contactScore =
      calculateContactScore(
        parsedData,
      )

    const structureScore =
      calculateStructureScore(
        parsedData,
        experience,
        education,
        projects,
      )

    const skillsScore =
      calculateSkillsScore(
        skills,
      )

    const experienceScore =
      calculateExperienceScore(
        experience,
      )

    const projectsScore =
      calculateProjectsScore(
        projects,
      )

    const educationScore =
      calculateEducationScore(
        education,
      )

    const keywordsScore =
      calculateKeywordsScore(
        parsedData,
        resumeText,
      )

    const formattingScore =
      calculateFormattingScore(
        resumeText,
      )

    const overallScore =
      contactScore +
      structureScore +
      skillsScore +
      experienceScore +
      projectsScore +
      educationScore +
      keywordsScore +
      formattingScore

    const strengths: string[] = []

    if (
      parsedData.name &&
      parsedData.email
    ) {
      strengths.push(
        'Basic contact information is present.',
      )
    }

    if (skills.length > 0) {
      strengths.push(
        `${skills.length} skill(s) detected.`,
      )
    }

    if (education.length > 0) {
      strengths.push(
        `${education.length} education record(s) detected.`,
      )
    }

    if (experience.length > 0) {
      strengths.push(
        `${experience.length} experience record(s) detected.`,
      )
    }

    if (projects.length > 0) {
      strengths.push(
        `${projects.length} project(s) detected.`,
      )
    }

    if (certifications.length > 0) {
      strengths.push(
        `${certifications.length} certification(s) detected.`,
      )
    }

    if (parsedData.summary) {
      strengths.push(
        'A professional summary is present.',
      )
    }

    if (structureScore >= 16) {
      strengths.push(
        'Resume structure is well organized.',
      )
    }

    if (keywordsScore >= 7) {
      strengths.push(
        'Good use of ATS-relevant keywords.',
      )
    }

    const weaknesses: string[] = []

    if (!parsedData.name) {
      weaknesses.push(
        'Name was not detected.',
      )
    }

    if (!parsedData.email) {
      weaknesses.push(
        'Email address was not detected.',
      )
    }

    if (!parsedData.phone) {
      weaknesses.push(
        'Phone number was not detected.',
      )
    }

    if (!parsedData.summary) {
      weaknesses.push(
        'Professional summary was not detected.',
      )
    }

    if (skills.length === 0) {
      weaknesses.push(
        'Skills were not detected.',
      )
    }

    if (education.length === 0) {
      weaknesses.push(
        'Education was not detected.',
      )
    }

    if (experience.length === 0) {
      weaknesses.push(
        'Work experience was not detected.',
      )
    }

    if (projects.length === 0) {
      weaknesses.push(
        'Projects were not detected.',
      )
    }

    if (certifications.length === 0) {
      weaknesses.push(
        'Certifications were not detected.',
      )
    }

    if (keywordsScore < 5) {
      weaknesses.push(
        'Resume contains limited ATS-relevant keywords.',
      )
    }

    if (formattingScore < 3) {
      weaknesses.push(
        'Resume text structure may not be fully ATS-friendly.',
      )
    }

    const suggestions: string[] = []

    if (!parsedData.summary) {
      suggestions.push(
        'Add a concise professional summary describing your experience, skills, and career goals.',
      )
    }

    if (skills.length === 0) {
      suggestions.push(
        'Add a dedicated technical skills section.',
      )
    } else if (skills.length < 10) {
      suggestions.push(
        'Consider adding more relevant technical and job-specific skills.',
      )
    }

    if (education.length === 0) {
      suggestions.push(
        'Add your degree, institution, field of study, and graduation year.',
      )
    }

    if (experience.length === 0) {
      suggestions.push(
        'Add relevant work experience with responsibilities and measurable achievements.',
      )
    }

    if (projects.length === 0) {
      suggestions.push(
        'Add relevant projects with technologies and measurable results.',
      )
    }

    if (keywordsScore < 7) {
      suggestions.push(
        'Increase the use of relevant technical and action-oriented keywords.',
      )
    }

    if (formattingScore < 4) {
      suggestions.push(
        'Use clear section headings, consistent bullet points, and ATS-friendly text formatting.',
      )
    }

    console.log(
      '\n========== ATS RESUME ANALYSIS ==========',
    )

    console.log(
      'Resume:',
      resume.fileName,
    )

    console.log(
      'Resume ID:',
      resume._id.toString(),
    )

    console.log(
      'ATS SCORE:',
      overallScore,
      '/100',
    )

    console.log(
      '=========================================\n',
    )

    return res.status(200).json({
      success: true,

      data: {
        resumeId:
          resume._id,

        fileName:
          resume.fileName,

        score:
          overallScore,

        atsScore: {
          overall:
            overallScore,

          contact: {
            score:
              contactScore,
            maxScore: 10,
          },

          structure: {
            score:
              structureScore,
            maxScore: 20,
          },

          skills: {
            score:
              skillsScore,
            maxScore: 15,
          },

          experience: {
            score:
              experienceScore,
            maxScore: 20,
          },

          projects: {
            score:
              projectsScore,
            maxScore: 10,
          },

          education: {
            score:
              educationScore,
            maxScore: 10,
          },

          keywords: {
            score:
              keywordsScore,
            maxScore: 10,
          },

          formatting: {
            score:
              formattingScore,
            maxScore: 5,
          },
        },

        scoreBreakdown: {
          contact:
            contactScore,

          structure:
            structureScore,

          skills:
            skillsScore,

          experience:
            experienceScore,

          projects:
            projectsScore,

          education:
            educationScore,

          keywords:
            keywordsScore,

          formatting:
            formattingScore,
        },

        strengths,

        weaknesses,

        suggestions,

        statistics: {
          skills:
            skills.length,

          education:
            education.length,

          experience:
            experience.length,

          projects:
            projects.length,

          certifications:
            certifications.length,
        },

        parsedData,
      },
    })
  } catch (error: any) {
    console.error(
      '\n========== RESUME ANALYSIS ERROR ==========',
    )

    console.error(error)

    console.error(
      'Message:',
      error?.message,
    )

    console.error(
      'Stack:',
      error?.stack,
    )

    console.error(
      '===========================================\n',
    )

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        'Failed to analyze resume',
    })
  }
}
