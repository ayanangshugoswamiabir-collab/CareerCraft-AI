
import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import Groq from 'groq-sdk'

console.log('🔥 GEMINI + GROQ MATCHING SERVICE LOADED')

/* =========================================================
   API KEYS
   ========================================================= */

const geminiApiKey = process.env.GEMINI_API_KEY

const groqApiKey1 = process.env.GROQ_API_KEY
const groqApiKey2 = process.env.GROQ_API_KEY_2

if (!geminiApiKey) {
  console.error('⚠️ GEMINI_API_KEY is missing from .env')
}

if (!groqApiKey1) {
  console.error('⚠️ GROQ_API_KEY is missing from .env')
}

if (!groqApiKey2) {
  console.error('⚠️ GROQ_API_KEY_2 is missing from .env')
}

/* =========================================================
   AI CLIENTS
   ========================================================= */

const genAI = new GoogleGenAI({
  apiKey: geminiApiKey || '',
})

const groq1 = groqApiKey1
  ? new Groq({
      apiKey: groqApiKey1,
    })
  : null

const groq2 = groqApiKey2
  ? new Groq({
      apiKey: groqApiKey2,
    })
  : null

/* =========================================================
   MODELS
   ========================================================= */

const GEMINI_MODEL = 'gemini-3.6-flash'

/*
 * IMPORTANT:
 *
 * These are models that your Groq account currently exposed
 * when you tested models.list().
 *
 * We are using:
 *
 * openai/gpt-oss-120b
 *
 * If this model later becomes unavailable, run:
 *
 * npx tsx -e "import 'dotenv/config'; import Groq from 'groq-sdk'; const groq = new Groq({apiKey: process.env.GROQ_API_KEY}); groq.models.list().then(r => console.log(r.data.map(m => m.id).join('\n')))"
 */
const GROQ_MODEL = 'openai/gpt-oss-120b'

/* =========================================================
   RESUME INPUT
   ========================================================= */

export interface ResumeMatchInput {
  name: string
  email: string
  phone: string
  location: string
  headline: string
  summary: string
  skills: string[]
  education: string[]
  experience: string[]
  projects: string[]
  certifications: string[]
}

/* =========================================================
   JOB INPUT
   ========================================================= */

export interface JobMatchInput {
  jobTitle: string
  company: string
  summary: string
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  qualifications: string[]
  education: string[]
  keywords: string[]
}

/* =========================================================
   FRONTEND MATCH RESULT
   ========================================================= */

export interface ResumeJDMatch {
  matchScore: number

  summary: string

  matchedSkills: string[]
  missingSkills: string[]

  matchedKeywords: string[]
  missingKeywords: string[]

  strengths: string[]
  recommendations: string[]
}

/* =========================================================
   INTERNAL AI RESULT
   ========================================================= */

interface AIResumeMatchResult {
  matchScore?: unknown
  matchLevel?: unknown

  matchingSkills?: unknown
  missingRequiredSkills?: unknown
  matchingPreferredSkills?: unknown

  matchingKeywords?: unknown
  missingKeywords?: unknown

  qualificationMatches?: unknown
  qualificationGaps?: unknown

  educationMatches?: unknown
  educationGaps?: unknown

  experienceMatches?: unknown
  experienceGaps?: unknown

  strengths?: unknown
  recommendations?: unknown

  summary?: unknown
}

/* =========================================================
   HELPERS
   ========================================================= */

const clean = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/* =========================================================
   SAFE STRING ARRAY
   ========================================================= */

const uniqueStrings = (
  value: unknown,
): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  const result: string[] = []
  const seen = new Set<string>()

  for (const item of value) {
    const cleaned = clean(item)

    if (!cleaned) {
      continue
    }

    const key = cleaned.toLowerCase()

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(cleaned)
  }

  return result
}

/* =========================================================
   SAFE SCORE
   ========================================================= */

const cleanScore = (
  value: unknown,
): number => {
  let score = 0

  if (typeof value === 'number') {
    score = value
  } else if (typeof value === 'string') {
    score = Number(
      value.replace('%', '').trim(),
    )
  }

  if (!Number.isFinite(score)) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(score),
    ),
  )
}

/* =========================================================
   EMPTY RESULT
   ========================================================= */

const emptyMatch = (): ResumeJDMatch => ({
  matchScore: 0,

  summary: '',

  matchedSkills: [],
  missingSkills: [],

  matchedKeywords: [],
  missingKeywords: [],

  strengths: [],
  recommendations: [],
})

/* =========================================================
   EXTRACT JSON
   ========================================================= */

const extractJson = (
  text: string,
): string => {
  const cleaned = text.trim()

  /*
   * Direct JSON
   */

  if (
    cleaned.startsWith('{') &&
    cleaned.endsWith('}')
  ) {
    return cleaned
  }

  /*
   * Remove markdown fences
   */

  const withoutFence =
    cleaned
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

  if (
    withoutFence.startsWith('{') &&
    withoutFence.endsWith('}')
  ) {
    return withoutFence
  }

  /*
   * Find first JSON object
   */

  const firstBrace =
    withoutFence.indexOf('{')

  const lastBrace =
    withoutFence.lastIndexOf('}')

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    return withoutFence.slice(
      firstBrace,
      lastBrace + 1,
    )
  }

  throw new Error(
    'AI returned an invalid JSON response',
  )
}

/* =========================================================
   PARSE AI RESULT
   ========================================================= */

const parseAIResult = (
  output: string,
): ResumeJDMatch => {
  if (!output) {
    throw new Error(
      'AI returned an empty matching response',
    )
  }

  const json = extractJson(output)

  let parsed: AIResumeMatchResult

  try {
    parsed =
      JSON.parse(json) as AIResumeMatchResult
  } catch (error) {
    console.error(
      '❌ Failed to parse AI JSON:',
      json,
    )

    throw new Error(
      'AI returned invalid resume matching JSON',
    )
  }

  const finalResult: ResumeJDMatch = {
    ...emptyMatch(),

    matchScore:
      cleanScore(
        parsed.matchScore,
      ),

    summary:
      clean(
        parsed.summary,
      ),

    matchedSkills:
      uniqueStrings(
        parsed.matchingSkills,
      ),

    missingSkills:
      uniqueStrings(
        parsed.missingRequiredSkills,
      ),

    matchedKeywords:
      uniqueStrings(
        parsed.matchingKeywords,
      ),

    missingKeywords:
      uniqueStrings(
        parsed.missingKeywords,
      ),

    strengths:
      uniqueStrings(
        parsed.strengths,
      ),

    recommendations:
      uniqueStrings(
        parsed.recommendations,
      ),
  }

  return finalResult
}

/* =========================================================
   PROMPT
   ========================================================= */

const buildPrompt = (
  resume: ResumeMatchInput,
  job: JobMatchInput,
): string => {
  return `
You are a strict resume-to-job-description matching engine.

Compare ONLY the supplied resume and job description.

Do not invent experience.

Do not invent skills.

Do not assume qualifications.

Do not use outside knowledge.

Return ONLY valid JSON.

==================================================
MATCH SCORE
==================================================

Calculate a score from 0 to 100.

Consider:

- Required skills
- Preferred skills
- Keywords
- Qualifications
- Education
- Relevant experience
- Projects

Required skills and qualifications should have greater
importance than preferred skills.

Use:

90-100 = Excellent Match
75-89 = Strong Match
50-74 = Moderate Match
0-49 = Low Match

IMPORTANT:

Return matchScore as a NUMBER.

Do NOT return:

"85%"

Do NOT return:

"85 percent"

Return:

85

==================================================
MATCHING SKILLS
==================================================

matchingSkills:

Required skills explicitly demonstrated by the resume.

missingRequiredSkills:

Required skills not explicitly demonstrated by the resume.

matchingPreferredSkills:

Preferred skills explicitly demonstrated by the resume.

==================================================
KEYWORDS
==================================================

matchingKeywords:

Important job keywords explicitly present in the resume.

missingKeywords:

Important job keywords present in the job description but
not explicitly present in the resume.

==================================================
QUALIFICATIONS
==================================================

qualificationMatches:

Qualifications clearly supported by the resume.

qualificationGaps:

Qualifications not supported by the resume.

==================================================
EDUCATION
==================================================

educationMatches:

Educational requirements clearly satisfied.

educationGaps:

Educational requirements not demonstrated.

==================================================
EXPERIENCE
==================================================

experienceMatches:

Resume experience that directly supports the job.

experienceGaps:

Important job experience requirements not demonstrated.

==================================================
STRENGTHS
==================================================

List the strongest areas of alignment.

Use only evidence from the supplied information.

==================================================
RECOMMENDATIONS
==================================================

Give practical recommendations based only on actual gaps.

Never tell the candidate to falsely claim experience.

==================================================
SUMMARY
==================================================

Write a concise factual summary of the match.

==================================================
REQUIRED JSON
==================================================

Return exactly this structure:

{
  "matchScore": 0,
  "matchLevel": "Moderate Match",
  "matchingSkills": [],
  "missingRequiredSkills": [],
  "matchingPreferredSkills": [],
  "matchingKeywords": [],
  "missingKeywords": [],
  "qualificationMatches": [],
  "qualificationGaps": [],
  "educationMatches": [],
  "educationGaps": [],
  "experienceMatches": [],
  "experienceGaps": [],
  "strengths": [],
  "recommendations": [],
  "summary": ""
}

==================================================
RESUME
==================================================

Name:
${clean(resume.name)}

Email:
${clean(resume.email)}

Phone:
${clean(resume.phone)}

Location:
${clean(resume.location)}

Headline:
${clean(resume.headline)}

Summary:
${clean(resume.summary)}

Skills:
${uniqueStrings(resume.skills).join(', ')}

Education:
${uniqueStrings(resume.education).join(' | ')}

Experience:
${uniqueStrings(resume.experience).join(' | ')}

Projects:
${uniqueStrings(resume.projects).join(' | ')}

Certifications:
${uniqueStrings(resume.certifications).join(' | ')}

==================================================
JOB DESCRIPTION
==================================================

Job Title:
${clean(job.jobTitle)}

Company:
${clean(job.company)}

Summary:
${clean(job.summary)}

Required Skills:
${uniqueStrings(job.requiredSkills).join(', ')}

Preferred Skills:
${uniqueStrings(job.preferredSkills).join(', ')}

Responsibilities:
${uniqueStrings(job.responsibilities).join(' | ')}

Qualifications:
${uniqueStrings(job.qualifications).join(' | ')}

Education:
${uniqueStrings(job.education).join(' | ')}

Keywords:
${uniqueStrings(job.keywords).join(', ')}

==================================================
END INPUT
==================================================
`
}

/* =========================================================
   GEMINI MATCHING
   ========================================================= */

const runGemini = async (
  prompt: string,
): Promise<string> => {
  if (!geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured',
    )
  }

  console.log(
    '🤖 Trying Gemini...',
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
            matchScore: {
              type: 'number',
            },

            matchLevel: {
              type: 'string',
            },

            matchingSkills: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            missingRequiredSkills: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            matchingPreferredSkills: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            matchingKeywords: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            missingKeywords: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            qualificationMatches: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            qualificationGaps: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            educationMatches: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            educationGaps: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            experienceMatches: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            experienceGaps: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            strengths: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            recommendations: {
              type: 'array',
              items: {
                type: 'string',
              },
            },

            summary: {
              type: 'string',
            },
          },

          required: [
            'matchScore',
            'matchLevel',
            'matchingSkills',
            'missingRequiredSkills',
            'matchingPreferredSkills',
            'matchingKeywords',
            'missingKeywords',
            'qualificationMatches',
            'qualificationGaps',
            'educationMatches',
            'educationGaps',
            'experienceMatches',
            'experienceGaps',
            'strengths',
            'recommendations',
            'summary',
          ],
        },
      },
    })

  const output =
    response.text?.trim()

  console.log(
    '\n========== RAW GEMINI RESPONSE ==========\n',
  )

  console.log(
    output || '[EMPTY RESPONSE]',
  )

  if (!output) {
    throw new Error(
      'Gemini returned an empty response',
    )
  }

  return output
}

/* =========================================================
   GROQ MATCHING
   ========================================================= */

const runGroq = async (
  client: Groq,
  apiNumber: number,
  prompt: string,
): Promise<string> => {
  console.log(
    `🤖 Trying Groq API #${apiNumber}...`,
  )

  const completion =
    await client.chat.completions.create({
      model: GROQ_MODEL,

      messages: [
        {
          role: 'system',

          content:
            'You are a strict resume-to-job-description matching engine. Return ONLY valid JSON. Never invent information.',
        },

        {
          role: 'user',

          content: prompt,
        },
      ],

      /*
       * Ask Groq for JSON.
       */

      response_format: {
        type: 'json_object',
      },

      temperature: 0,

      /*
       * Enough room for the matching result.
       */

      max_tokens: 4000,
    })

  const output =
    completion.choices?.[0]?.message?.content

  if (
    typeof output !== 'string' ||
    !output.trim()
  ) {
    throw new Error(
      `Groq API #${apiNumber} returned an empty response`,
    )
  }

  console.log(
    `\n========== RAW GROQ #${apiNumber} RESPONSE ==========\n`,
  )

  console.log(
    output,
  )

  return output.trim()
}

/* =========================================================
   MATCH RESUME TO JOB
   ========================================================= */

export const matchResumeToJob = async (
  resume: ResumeMatchInput,
  job: JobMatchInput,
): Promise<string> => {
  if (
    !job.summary &&
    job.requiredSkills.length === 0 &&
    job.responsibilities.length === 0 &&
    job.qualifications.length === 0
  ) {
    throw new Error(
      'Job description analysis data is empty',
    )
  }

  /* =======================================================
     LOGGING
     ======================================================= */

  console.log(
    '\n==============================================',
  )

  console.log(
    '🚀 AI RESUME ↔ JD MATCHING',
  )

  console.log(
    '==============================================',
  )

  console.log(
    'Candidate:',
    clean(resume.name) ||
      'Unnamed candidate',
  )

  console.log(
    'Resume skills:',
    resume.skills.length,
  )

  console.log(
    'Job description length:',
    job.summary.length,
  )

  console.log(
    '==============================================',
  )

  const prompt =
    buildPrompt(
      resume,
      job,
    )

  /* =======================================================
     PROVIDER 1 — GEMINI
     ======================================================= */

  try {
    const output =
      await runGemini(prompt)

    const finalResult =
      parseAIResult(output)

    console.log(
      '\n✅ MATCH SUCCESSFUL USING GEMINI',
    )

    console.log(
      '\n========== FINAL MATCH RESULT ==========\n',
    )

    console.log(
      JSON.stringify(
        finalResult,
        null,
        2,
      ),
    )

    return JSON.stringify(
      finalResult,
    )
  } catch (geminiError: unknown) {
    console.error(
      '\n⚠️ GEMINI FAILED',
    )

    if (
      geminiError instanceof Error
    ) {
      console.error(
        'Gemini error:',
        geminiError.message,
      )
    } else {
      console.error(
        geminiError,
      )
    }

    console.log(
      '\n🔄 FALLING BACK TO GROQ API #1...',
    )
  }

  /* =======================================================
     PROVIDER 2 — GROQ API #1
     ======================================================= */

  if (groq1) {
    try {
      const output =
        await runGroq(
          groq1,
          1,
          prompt,
        )

      const finalResult =
        parseAIResult(output)

      console.log(
        '\n✅ MATCH SUCCESSFUL USING GROQ API #1',
      )

      console.log(
        '\n========== FINAL MATCH RESULT ==========\n',
      )

      console.log(
        JSON.stringify(
          finalResult,
          null,
          2,
        ),
      )

      return JSON.stringify(
        finalResult,
      )
    } catch (groqError1: unknown) {
      console.error(
        '\n⚠️ GROQ API #1 FAILED',
      )

      if (
        groqError1 instanceof Error
      ) {
        console.error(
          'Groq #1 error:',
          groqError1.message,
        )
      } else {
        console.error(
          groqError1,
        )
      }

      console.log(
        '\n🔄 FALLING BACK TO GROQ API #2...',
      )
    }
  } else {
    console.error(
      '⚠️ GROQ_API_KEY is not configured',
    )
  }

  /* =======================================================
     PROVIDER 3 — GROQ API #2
     ======================================================= */

  if (groq2) {
    try {
      const output =
        await runGroq(
          groq2,
          2,
          prompt,
        )

      const finalResult =
        parseAIResult(output)

      console.log(
        '\n✅ MATCH SUCCESSFUL USING GROQ API #2',
      )

      console.log(
        '\n========== FINAL MATCH RESULT ==========\n',
      )

      console.log(
        JSON.stringify(
          finalResult,
          null,
          2,
        ),
      )

      return JSON.stringify(
        finalResult,
      )
    } catch (groqError2: unknown) {
      console.error(
        '\n❌ GROQ API #2 FAILED',
      )

      if (
        groqError2 instanceof Error
      ) {
        console.error(
          'Groq #2 error:',
          groqError2.message,
        )
      } else {
        console.error(
          groqError2,
        )
      }
    }
  } else {
    console.error(
      '⚠️ GROQ_API_KEY_2 is not configured',
    )
  }

  /* =======================================================
     ALL PROVIDERS FAILED
     ======================================================= */

  console.error(
    '\n==============================================',
  )

  console.error(
    '❌ ALL AI PROVIDERS FAILED',
  )

  console.error(
    '==============================================',
  )

  throw new Error(
    'Resume matching failed. Gemini and both Groq API keys were unavailable.',
  )
}
