import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import Groq from 'groq-sdk'

console.log('🔥 GEMINI + GROQ JD SERVICE LOADED')

/* =========================================================
   API KEYS
   ========================================================= */

const geminiApiKey =
  process.env.GEMINI_API_KEY

const groqApiKeys = [
  process.env.GROK_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY,
].filter(
  (key): key is string =>
    Boolean(key),
)

if (!geminiApiKey) {
  console.error(
    '⚠️ GEMINI_API_KEY is missing from .env',
  )
}

if (groqApiKeys.length === 0) {
  console.error(
    '⚠️ No Groq API keys are configured',
  )
}

/* =========================================================
   AI CLIENTS
   ========================================================= */

const genAI = new GoogleGenAI({
  apiKey: geminiApiKey || '',
})

const GEMINI_MODEL =
  'gemini-3.6-flash'

const GROQ_MODEL =
  'openai/gpt-oss-120b'

/* =========================================================
   TYPES
   ========================================================= */

export interface JDAnalysis {
  jobTitle: string
  company: string
  location: string
  employmentType: string
  experienceLevel: string
  summary: string
  responsibilities: string[]
  requiredSkills: string[]
  preferredSkills: string[]
  qualifications: string[]
  education: string[]
  keywords: string[]
}

/* =========================================================
   CLEAN HELPERS
   ========================================================= */

const clean = (
  value: unknown,
): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const uniqueStrings = (
  values: unknown,
): string[] => {
  if (!Array.isArray(values)) {
    return []
  }

  const result: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const item = clean(value)

    if (!item) {
      continue
    }

    const key =
      item.toLowerCase()

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(item)
  }

  return result
}

/* =========================================================
   EMPTY ANALYSIS
   ========================================================= */

const emptyAnalysis =
  (): JDAnalysis => ({
    jobTitle: '',
    company: '',
    location: '',
    employmentType: '',
    experienceLevel: '',
    summary: '',
    responsibilities: [],
    requiredSkills: [],
    preferredSkills: [],
    qualifications: [],
    education: [],
    keywords: [],
  })

/* =========================================================
   ERROR HELPERS
   ========================================================= */

const getErrorStatus = (
  error: unknown,
): number | undefined => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error
  ) {
    const status = (
      error as {
        status?: unknown
      }
    ).status

    if (typeof status === 'number') {
      return status
    }

    if (typeof status === 'string') {
      const parsedStatus =
        Number(status)

      if (!Number.isNaN(parsedStatus)) {
        return parsedStatus
      }
    }
  }

  return undefined
}

const getErrorMessage = (
  error: unknown,
): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    const message = (
      error as {
        message?: unknown
      }
    ).message

    if (typeof message === 'string') {
      return message
    }
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unknown AI API error'
}

/* =========================================================
   VALIDATE JD OUTPUT
   ========================================================= */

const validateJDOutput = (
  output: string,
): string => {
  let parsed: Partial<JDAnalysis>

  try {
    parsed =
      JSON.parse(output) as Partial<JDAnalysis>
  } catch {
    throw new Error(
      'AI returned invalid Job Description JSON',
    )
  }

  const finalResult: JDAnalysis = {
    ...emptyAnalysis(),

    jobTitle:
      clean(parsed.jobTitle),

    company:
      clean(parsed.company),

    location:
      clean(parsed.location),

    employmentType:
      clean(parsed.employmentType),

    experienceLevel:
      clean(parsed.experienceLevel),

    summary:
      clean(parsed.summary),

    responsibilities:
      uniqueStrings(
        parsed.responsibilities,
      ),

    requiredSkills:
      uniqueStrings(
        parsed.requiredSkills,
      ),

    preferredSkills:
      uniqueStrings(
        parsed.preferredSkills,
      ),

    qualifications:
      uniqueStrings(
        parsed.qualifications,
      ),

    education:
      uniqueStrings(
        parsed.education,
      ),

    keywords:
      uniqueStrings(
        parsed.keywords,
      ),
  }

  return JSON.stringify(
    finalResult,
  )
}

/* =========================================================
   PROMPT
   ========================================================= */

const createPrompt = (
  jobDescription: string,
): string => {
  return `
You are a STRICT Job Description analysis engine.

Your ONLY task is to extract and organize information
from the supplied Job Description.

This is NOT a job description writing task.

This is NOT a resume writing task.

This is NOT a career advice task.

NEVER invent information.

NEVER guess information.

NEVER infer information that is not reasonably stated
in the supplied Job Description.

NEVER use outside knowledge.

==================================================
EXTRACTION RULES
==================================================

Extract ONLY information present in the Job Description.

If information is missing, return an empty string
or empty array.

Do not create a company name if one is not present.

Do not create a location if one is not present.

Do not create an employment type if one is not present.

Do not create an experience level if one is not present.

==================================================
JOB TITLE
==================================================

Return the explicitly stated job title.

Do not create a more specific title than the
Job Description provides.

==================================================
COMPANY
==================================================

Return the company or organization name only if
explicitly present.

If unavailable:

"company": ""

==================================================
LOCATION
==================================================

Return the stated job location.

Preserve remote, hybrid, onsite, city, state,
country, or other location information when
explicitly stated.

If unavailable:

"location": ""

==================================================
EMPLOYMENT TYPE
==================================================

Extract explicitly stated employment type.

Examples:

Full-time
Part-time
Contract
Internship
Temporary

If unavailable:

"employmentType": ""

==================================================
EXPERIENCE LEVEL
==================================================

Extract explicitly stated experience requirements
or level.

Examples:

Entry Level
Junior
Mid Level
Senior
Lead

If the Job Description only states a number of years,
preserve that information.

Do not invent a seniority level.

==================================================
SUMMARY
==================================================

Create a SHORT factual summary of the Job Description.

The summary must be based ONLY on information contained
in the Job Description.

Do not add recommendations.

Do not add opinions.

Do not invent company information.

==================================================
RESPONSIBILITIES
==================================================

Extract actual responsibilities and duties.

Keep each responsibility as one meaningful item.

Do NOT split one responsibility into many artificial items.

Do NOT add responsibilities that are not present.

==================================================
REQUIRED SKILLS
==================================================

Extract skills, technologies, tools, programming
languages, frameworks, platforms, methodologies,
and other competencies explicitly required by the
Job Description.

Only include skills that are actually required.

Do not infer related technologies.

==================================================
PREFERRED SKILLS
==================================================

Extract skills explicitly described as preferred,
desirable, nice-to-have, bonus, or equivalent.

Do not place required skills here.

==================================================
QUALIFICATIONS
==================================================

Extract explicit qualification requirements.

Do not invent qualifications.

==================================================
EDUCATION
==================================================

Extract explicitly stated educational requirements.

If the Job Description does not specify education:

"education": []

==================================================
KEYWORDS
==================================================

Extract important job-related keywords explicitly
appearing in the Job Description.

Prioritize:

- technologies
- programming languages
- frameworks
- tools
- job-specific terminology
- methodologies
- certifications
- important domain terms

Do not create keywords that are not present.

Avoid unnecessary generic words such as:

"job"
"candidate"
"company"
"work"

==================================================
DUPLICATE RULE
==================================================

Do not duplicate items.

Each skill, responsibility, qualification,
education item, and keyword should appear only once.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

The JSON must contain exactly these fields:

jobTitle
company
location
employmentType
experienceLevel
summary
responsibilities
requiredSkills
preferredSkills
qualifications
education
keywords

==================================================
JOB DESCRIPTION
==================================================

${jobDescription}

==================================================
END JOB DESCRIPTION
==================================================
`
}

/* =========================================================
   GEMINI JD ANALYSIS
   ========================================================= */

const generateWithGemini =
  async (
    prompt: string,
  ): Promise<string> => {
    if (!geminiApiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured',
      )
    }

    console.log(
      '🤖 Trying Gemini for JD analysis...',
    )

    const response =
      await genAI.models.generateContent({
        model: GEMINI_MODEL,

        contents: prompt,

        config: {
          responseMimeType:
            'application/json',

          responseSchema: {
            type: 'object',

            properties: {
              jobTitle: {
                type: 'string',
              },

              company: {
                type: 'string',
              },

              location: {
                type: 'string',
              },

              employmentType: {
                type: 'string',
              },

              experienceLevel: {
                type: 'string',
              },

              summary: {
                type: 'string',
              },

              responsibilities: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },

              requiredSkills: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },

              preferredSkills: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },

              qualifications: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },

              education: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },

              keywords: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },

            required: [
              'jobTitle',
              'company',
              'location',
              'employmentType',
              'experienceLevel',
              'summary',
              'responsibilities',
              'requiredSkills',
              'preferredSkills',
              'qualifications',
              'education',
              'keywords',
            ],
          },
        },
      })

    const output =
      response.text?.trim()

    if (!output) {
      throw new Error(
        'Gemini returned an empty JD response',
      )
    }

    return validateJDOutput(
      output,
    )
  }

/* =========================================================
   GROQ JD ANALYSIS
   ========================================================= */

const generateWithGroq =
  async (
    prompt: string,
    apiKey: string,
    keyNumber: number,
  ): Promise<string> => {
    console.log(
      `🤖 Trying Groq API key ${keyNumber} for JD analysis...`,
    )

    const groq =
      new Groq({
        apiKey,
      })

    const response =
      await groq.chat.completions.create({
        model: GROQ_MODEL,

        temperature: 0.2,

        messages: [
          {
            role: 'system',

            content:
              'You are a strict Job Description analysis engine. Extract only information present in the supplied Job Description. Never invent information. Return only valid JSON matching the requested structure.',
          },

          {
            role: 'user',

            content: prompt,
          },
        ],

        response_format: {
          type: 'json_object',
        },
      })

    const output =
      response
        .choices?.[0]
        ?.message
        ?.content
        ?.trim()

    if (!output) {
      throw new Error(
        'Groq returned an empty JD response',
      )
    }

    return validateJDOutput(
      output,
    )
  }

/* =========================================================
   MAIN JD ANALYZER
   ========================================================= */

export const analyzeJobDescription =
  async (
    jobDescription: string,
  ): Promise<string> => {
    const text =
      jobDescription.trim()

    if (!text) {
      throw new Error(
        'Job description is empty',
      )
    }

    if (
      !geminiApiKey &&
      groqApiKeys.length === 0
    ) {
      throw new Error(
        'No AI API keys are configured',
      )
    }

    console.log(
      '\n==============================================',
    )

    console.log(
      '🚀 AI JOB DESCRIPTION ANALYSIS',
    )

    console.log(
      '==============================================',
    )

    console.log(
      `Job description length: ${text.length} characters`,
    )

    const prompt =
      createPrompt(text)

    /* =====================================================
       1. GEMINI
       ===================================================== */

    if (geminiApiKey) {
      try {
        const result =
          await generateWithGemini(
            prompt,
          )

        console.log(
          '✅ JD analysis successful with Gemini',
        )

        return result
      } catch (error: unknown) {
        console.error(
          '\n⚠️ GEMINI JD ANALYSIS FAILED',
        )

        console.error(
          getErrorMessage(error),
        )

        console.log(
          '➡️ Falling back to Groq API #1...',
        )
      }
    }

    /* =====================================================
       2. GROQ FALLBACK KEYS
       ===================================================== */

    if (groqApiKeys.length > 0) {
      let lastError: unknown =
        null

      for (
        let index = 0;
        index < groqApiKeys.length;
        index++
      ) {
        const apiKey =
          groqApiKeys[index]

        try {
          const result =
            await generateWithGroq(
              prompt,
              apiKey,
              index + 1,
            )

          console.log(
            `✅ JD analysis successful with Groq API key ${index + 1}`,
          )

          return result
        } catch (error: unknown) {
          lastError = error

          console.error(
            `⚠️ Groq API key ${index + 1} failed:`,
            getErrorMessage(error),
          )

          if (
            index <
            groqApiKeys.length - 1
          ) {
            console.log(
              `➡️ Trying Groq API key ${index + 2}...`,
            )
          }
        }
      }

      console.error(
        '❌ All Groq JD analysis attempts failed:',
        lastError,
      )
    }

    /* =====================================================
       3. EVERYTHING FAILED
       ===================================================== */

    throw new Error(
      'All AI providers are currently unavailable. Gemini quota may be exceeded and Groq fallback requests also failed.',
    )
  }