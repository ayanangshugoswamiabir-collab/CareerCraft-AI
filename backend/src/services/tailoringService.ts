import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import Groq from 'groq-sdk'

console.log('🔥 RESUME TAILORING SERVICE LOADED')

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

/* =========================================================
   AI CLIENTS
   ========================================================= */

const genAI = new GoogleGenAI({
  apiKey: geminiApiKey || '',
})

const GEMINI_MODEL = 'gemini-3.6-flash'

const GROQ_MODEL =
  'openai/gpt-oss-120b'

/* =========================================================
   INPUT
   ========================================================= */

export interface TailoringInput {
  resume: string
  jobDescription: string
  matchAnalysis: string
}

/* =========================================================
   OUTPUT
   ========================================================= */

export interface TailoredResume {
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
   CLEAN
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

/* =========================================================
   JSON VALIDATION
   ========================================================= */

const validateTailoredResume = (
  output: string,
): string => {
  try {
    const parsed =
      JSON.parse(output)

    if (
      !parsed ||
      typeof parsed !== 'object'
    ) {
      throw new Error(
        'AI returned invalid resume data',
      )
    }

    return JSON.stringify({
      name: clean(parsed.name),
      email: clean(parsed.email),
      phone: clean(parsed.phone),
      location: clean(parsed.location),
      headline: clean(parsed.headline),
      summary: clean(parsed.summary),

      skills: Array.isArray(
        parsed.skills,
      )
        ? parsed.skills.map(clean).filter(Boolean)
        : [],

      education: Array.isArray(
        parsed.education,
      )
        ? parsed.education
            .map(clean)
            .filter(Boolean)
        : [],

      experience: Array.isArray(
        parsed.experience,
      )
        ? parsed.experience
            .map(clean)
            .filter(Boolean)
        : [],

      projects: Array.isArray(
        parsed.projects,
      )
        ? parsed.projects
            .map(clean)
            .filter(Boolean)
        : [],

      certifications: Array.isArray(
        parsed.certifications,
      )
        ? parsed.certifications
            .map(clean)
            .filter(Boolean)
        : [],
    })
  } catch {
    throw new Error(
      'AI returned invalid tailored resume JSON',
    )
  }
}

/* =========================================================
   PROMPT
   ========================================================= */

const createPrompt = (
  input: TailoringInput,
): string => {
  return `
You are a professional resume tailoring engine.

Your task is to tailor the supplied resume specifically
for the supplied job description.

You MUST use the supplied Resume ↔ JD Match Analysis
to understand:

- matching skills
- missing skills
- matching keywords
- missing keywords
- strengths
- recommendations
- experience gaps
- qualification gaps

==================================================
CRITICAL RULES
==================================================

NEVER invent information.

NEVER create fake experience.

NEVER create fake skills.

NEVER create fake projects.

NEVER create fake certifications.

NEVER create fake education.

NEVER claim the candidate has a missing skill if the
original resume does not demonstrate it.

NEVER add technologies merely because they appear
in the job description.

NEVER change factual employment history.

NEVER change company names.

NEVER change degree information.

NEVER fabricate achievements.

You may improve:

- wording
- clarity
- structure
- relevance
- keyword alignment
- professional phrasing
- bullet point wording

But every factual claim must be supported by the
original resume.

==================================================
TAILORING GOAL
==================================================

Create a stronger version of the existing resume that
is specifically relevant to the supplied job description.

Prioritize information that is genuinely relevant to
the job.

Use important job-description terminology when the
candidate's existing experience legitimately supports it.

Do NOT keyword stuff.

Do NOT force missing skills into the resume.

==================================================
SUMMARY
==================================================

Rewrite the summary only if the original resume has
enough factual information to support a stronger
job-relevant summary.

Do not invent a professional background.

==================================================
HEADLINE
==================================================

Create or improve the headline only when it can be
supported by the candidate's existing resume.

==================================================
SKILLS
==================================================

Keep only skills that are explicitly supported by the
original resume.

You may reorganize the skills so the most relevant
skills appear first.

Do NOT add missing job requirements.

==================================================
EXPERIENCE
==================================================

Preserve every real job.

Do not create new jobs.

Do not remove factual jobs.

Improve bullet points so relevant responsibilities and
achievements are clearer.

Use job-description terminology only when supported
by the original experience.

==================================================
PROJECTS
==================================================

Preserve actual projects from the original resume.

Do not invent projects.

Highlight relevant technologies and accomplishments
when they are already present.

==================================================
EDUCATION
==================================================

Preserve the original education information.

Do not invent degrees or qualifications.

==================================================
CERTIFICATIONS
==================================================

Preserve only actual certifications from the original
resume.

Do not add certifications from the job description.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Return exactly this structure:

{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "headline": "",
  "summary": "",
  "skills": [],
  "education": [],
  "experience": [],
  "projects": [],
  "certifications": []
}

==================================================
ORIGINAL RESUME
==================================================

${input.resume}

==================================================
JOB DESCRIPTION
==================================================

${input.jobDescription}

==================================================
RESUME ↔ JD MATCH ANALYSIS
==================================================

${input.matchAnalysis}

==================================================
END INPUT
==================================================
`
}

/* =========================================================
   GEMINI
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
      '🤖 Trying Gemini for resume tailoring...',
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
              name: {
                type: 'string',
              },

              email: {
                type: 'string',
              },

              phone: {
                type: 'string',
              },

              location: {
                type: 'string',
              },

              headline: {
                type: 'string',
              },

              summary: {
                type: 'string',
              },

              skills: {
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

              experience: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },

              projects: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },

              certifications: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },

            required: [
              'name',
              'email',
              'phone',
              'location',
              'headline',
              'summary',
              'skills',
              'education',
              'experience',
              'projects',
              'certifications',
            ],
          },
        },
      })

    const output =
      response.text?.trim()

    if (!output) {
      throw new Error(
        'Gemini returned an empty response',
      )
    }

    return validateTailoredResume(
      output,
    )
  }

/* =========================================================
   GROQ
   ========================================================= */

const generateWithGroq =
  async (
    prompt: string,
    apiKey: string,
    keyNumber: number,
  ): Promise<string> => {
    console.log(
      `🤖 Trying Groq API key ${keyNumber}...`,
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
              'You are a professional resume tailoring engine. Return only valid JSON matching the requested structure.',
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
      response.choices?.[0]?.message?.content?.trim()

    if (!output) {
      throw new Error(
        'Groq returned an empty response',
      )
    }

    return validateTailoredResume(
      output,
    )
  }

/* =========================================================
   MAIN TAILORING FUNCTION
   ========================================================= */

export const tailorResume =
  async (
    input: TailoringInput,
  ): Promise<string> => {
    if (
      !geminiApiKey &&
      groqApiKeys.length === 0
    ) {
      throw new Error(
        'No AI API keys are configured',
      )
    }

    if (!input.resume.trim()) {
      throw new Error(
        'Resume data is empty',
      )
    }

    if (
      !input.jobDescription.trim()
    ) {
      throw new Error(
        'Job description is empty',
      )
    }

    if (
      !input.matchAnalysis.trim()
    ) {
      throw new Error(
        'Match analysis is empty',
      )
    }

    console.log(
      '\n==============================================',
    )

    console.log(
      '🚀 AI RESUME TAILORING',
    )

    console.log(
      '==============================================',
    )

    console.log(
      'Resume length:',
      input.resume.length,
    )

    console.log(
      'JD length:',
      input.jobDescription.length,
    )

    console.log(
      'Analysis length:',
      input.matchAnalysis.length,
    )

    const prompt =
      createPrompt(input)

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
          '✅ Resume tailored successfully with Gemini',
        )

        return result
      } catch (error: any) {
        console.error(
          '⚠️ Gemini tailoring failed:',
          error?.message || error,
        )

        console.log(
          '➡️ Falling back to Groq...',
        )
      }
    }

    /* =====================================================
       2. GROQ FALLBACK KEYS
       ===================================================== */

    if (groqApiKeys.length > 0) {
      let lastError: unknown = null

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
            `✅ Resume tailored successfully with Groq API key ${index + 1}`,
          )

          return result
        } catch (error: any) {
          lastError = error

          console.error(
            `⚠️ Groq API key ${index + 1} failed:`,
            error?.message || error,
          )

          if (
            index <
            groqApiKeys.length - 1
          ) {
            console.log(
              '➡️ Trying next Groq API key...',
            )
          }
        }
      }

      console.error(
        '❌ All Groq API keys failed:',
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