
import { GoogleGenAI } from '@google/genai'

console.log('🔥 GEMINI RESUME SERVICE LOADED')

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is missing from .env')
}

const genAI = new GoogleGenAI({
  apiKey,
})

interface ResumeProject {
  title: string
  description: string
  technologies: string[]
}

interface ResumeEducation {
  degree: string
  institution: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  description: string
}

interface ResumeExperience {
  jobTitle: string
  company: string
  location: string
  startDate: string
  endDate: string
  description: string
}

interface ResumeCertification {
  name: string
  issuer: string
  date: string
  credentialId: string
}

interface ParsedResume {
  name: string
  email: string
  phone: string
  location: string
  headline: string
  summary: string
  skills: string[]
  education: ResumeEducation[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  certifications: ResumeCertification[]
}

const clean = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const normalize = (value: string): string => {
  return clean(value)
    .toLowerCase()
    .replace(/[•·▪◦]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const uniqueStrings = (
  values: unknown[],
): string[] => {
  const result: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const item = clean(value)

    if (!item) {
      continue
    }

    const key = normalize(item)

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(item)
  }

  return result
}

const emptyResume = (): ParsedResume => ({
  name: '',
  email: '',
  phone: '',
  location: '',
  headline: '',
  summary: '',
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
})

/*
|--------------------------------------------------------------------------
| PROJECT VALIDATION
|--------------------------------------------------------------------------
|
| Gemini is allowed to extract projects, but we perform another
| deterministic check against the actual resume text.
|
| This prevents the same project from appearing multiple times.
|
*/

const cleanProjects = (
  projects: unknown,
  resumeText: string,
): ResumeProject[] => {
  if (!Array.isArray(projects)) {
    return []
  }

  const result: ResumeProject[] = []
  const seen = new Set<string>()

  const source = normalize(resumeText)

  for (const raw of projects) {
    if (!raw || typeof raw !== 'object') {
      continue
    }

    const item = raw as Record<string, unknown>

    const title = clean(item.title)

    if (!title) {
      continue
    }

    const key = normalize(title)

    /*
     * HARD DUPLICATE PROTECTION
     */

    if (seen.has(key)) {
      continue
    }

    /*
     * The title must actually occur somewhere
     * in the original PDF text.
     */

    if (!source.includes(key)) {
      continue
    }

    const description = clean(item.description)

    const technologies = Array.isArray(
      item.technologies,
    )
      ? uniqueStrings(item.technologies)
      : []

    seen.add(key)

    result.push({
      title,
      description,
      technologies,
    })
  }

  return result
}

/*
|--------------------------------------------------------------------------
| EDUCATION VALIDATION
|--------------------------------------------------------------------------
*/

const cleanEducation = (
  education: unknown,
): ResumeEducation[] => {
  if (!Array.isArray(education)) {
    return []
  }

  const result: ResumeEducation[] = []
  const seen = new Set<string>()

  for (const raw of education) {
    if (!raw || typeof raw !== 'object') {
      continue
    }

    const item = raw as Record<string, unknown>

    const degree = clean(item.degree)
    const institution = clean(item.institution)

    if (!degree && !institution) {
      continue
    }

    const key = normalize(
      `${degree}|${institution}`,
    )

    if (seen.has(key)) {
      continue
    }

    seen.add(key)

    result.push({
      degree,
      institution,
      fieldOfStudy: clean(item.fieldOfStudy),
      startDate: clean(item.startDate),
      endDate: clean(item.endDate),
      description: clean(item.description),
    })
  }

  return result
}

/*
|--------------------------------------------------------------------------
| EXPERIENCE VALIDATION
|--------------------------------------------------------------------------
*/

const cleanExperience = (
  experience: unknown,
): ResumeExperience[] => {
  if (!Array.isArray(experience)) {
    return []
  }

  const result: ResumeExperience[] = []
  const seen = new Set<string>()

  for (const raw of experience) {
    if (!raw || typeof raw !== 'object') {
      continue
    }

    const item = raw as Record<string, unknown>

    const jobTitle = clean(item.jobTitle)
    const company = clean(item.company)

    if (!jobTitle && !company) {
      continue
    }

    const key = normalize(
      `${jobTitle}|${company}`,
    )

    if (seen.has(key)) {
      continue
    }

    seen.add(key)

    result.push({
      jobTitle,
      company,
      location: clean(item.location),
      startDate: clean(item.startDate),
      endDate: clean(item.endDate),
      description: clean(item.description),
    })
  }

  return result
}

/*
|--------------------------------------------------------------------------
| CERTIFICATION VALIDATION
|--------------------------------------------------------------------------
*/

const cleanCertifications = (
  certifications: unknown,
): ResumeCertification[] => {
  if (!Array.isArray(certifications)) {
    return []
  }

  const result: ResumeCertification[] = []
  const seen = new Set<string>()

  for (const raw of certifications) {
    if (!raw || typeof raw !== 'object') {
      continue
    }

    const item = raw as Record<string, unknown>

    const name = clean(item.name)

    if (!name) {
      continue
    }

    const key = normalize(name)

    if (seen.has(key)) {
      continue
    }

    seen.add(key)

    result.push({
      name,
      issuer: clean(item.issuer),
      date: clean(item.date),
      credentialId: clean(item.credentialId),
    })
  }

  return result
}

/*
|--------------------------------------------------------------------------
| MAIN GEMINI PARSER
|--------------------------------------------------------------------------
*/

export const parseResumeWithAI = async (
  resumeText: string,
): Promise<string> => {
  const text = resumeText.trim()

  if (!text) {
    throw new Error(
      'Resume text is empty',
    )
  }

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in the backend .env file',
    )
  }

  console.log(
    '\n========== GEMINI RESUME PARSING ==========\n',
  )

  console.log(
    `Resume text length: ${text.length} characters`,
  )

  /*
  |--------------------------------------------------------------------------
  | STRICT PROMPT
  |--------------------------------------------------------------------------
  */

  const prompt = `
You are a STRICT resume extraction engine.

Your ONLY task is to extract information from the supplied resume.

This is NOT a resume writing task.

This is NOT a resume improvement task.

This is NOT a resume generation task.

NEVER invent information.

NEVER guess information.

NEVER infer information.

NEVER use outside knowledge.

NEVER create information that does not exist in the resume.

==================================================
PROJECT RULES — EXTREMELY IMPORTANT
==================================================

The projects array must contain ONLY actual project entries.

A project is an independently named project.

If the resume has:

PROJECTS

Project A
- bullet 1
- bullet 2
- bullet 3

Project B
- bullet 1
- bullet 2

Then return EXACTLY TWO projects.

Do NOT return five projects.

The bullets belong to their parent project.

DO NOT treat:

- bullet points as projects
- technologies as projects
- skills as projects
- job responsibilities as projects
- experience as projects
- education as projects
- coursework as projects
- achievements as projects
- tools as projects

If the resume has no Projects section, return:

"projects": []

If the Projects section contains one project, return ONE project.

If it contains two projects, return TWO projects.

If it contains three projects, return THREE projects.

NEVER multiply project entries.

==================================================
EXPERIENCE RULES
==================================================

One actual job/position/company combination is ONE experience entry.

All bullet points belonging to that job must remain inside that same experience entry.

NEVER turn each bullet point into another job.

==================================================
EDUCATION RULES
==================================================

One degree/program is ONE education entry.

Subjects, grades, achievements and bullet points are NOT separate education entries.

==================================================
CERTIFICATION RULES
==================================================

Only explicitly listed certifications, certificates or licenses belong in certifications.

Courses are NOT certifications unless the resume explicitly calls them a certification or certificate.

Skills are NOT certifications.

Projects are NOT certifications.

==================================================
SKILLS RULES
==================================================

Only return skills explicitly written in the resume.

Do not add related technologies.

Do not infer skills from experience.

Do not infer skills from projects.

==================================================
CONTACT RULES
==================================================

Return name, email, phone and location only when they are explicitly present.

If missing, return an empty string.

==================================================
SUMMARY RULES
==================================================

Only return summary if an actual summary/profile/objective exists in the resume.

Do NOT write a new summary.

==================================================
HEADLINE RULES
==================================================

Only return a headline if the resume explicitly contains one.

Do NOT create one.

==================================================
COUNTING RULE
==================================================

Preserve the actual number of entries.

Do not split entries.

Do not duplicate entries.

Do not invent entries.

==================================================
OUTPUT
==================================================

Return ONLY JSON.

The JSON must contain exactly these fields:

name
email
phone
location
headline
summary
skills
education
experience
projects
certifications

==================================================
RESUME
==================================================

${text}

==================================================
END RESUME
==================================================
`

  try {
    console.log(
      '🚀 Sending resume to Gemini...',
    )

    const response =
      await genAI.models.generateContent({
        model: 'gemini-3.6-flash',

        contents: prompt,

        config: {
          responseMimeType: 'application/json',

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
                  type: 'object',

                  properties: {
                    degree: {
                      type: 'string',
                    },

                    institution: {
                      type: 'string',
                    },

                    fieldOfStudy: {
                      type: 'string',
                    },

                    startDate: {
                      type: 'string',
                    },

                    endDate: {
                      type: 'string',
                    },

                    description: {
                      type: 'string',
                    },
                  },

                  required: [
                    'degree',
                    'institution',
                    'fieldOfStudy',
                    'startDate',
                    'endDate',
                    'description',
                  ],
                },
              },

              experience: {
                type: 'array',
                items: {
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

                    startDate: {
                      type: 'string',
                    },

                    endDate: {
                      type: 'string',
                    },

                    description: {
                      type: 'string',
                    },
                  },

                  required: [
                    'jobTitle',
                    'company',
                    'location',
                    'startDate',
                    'endDate',
                    'description',
                  ],
                },
              },

              projects: {
                type: 'array',
                items: {
                  type: 'object',

                  properties: {
                    title: {
                      type: 'string',
                    },

                    description: {
                      type: 'string',
                    },

                    technologies: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                  },

                  required: [
                    'title',
                    'description',
                    'technologies',
                  ],
                },
              },

              certifications: {
                type: 'array',
                items: {
                  type: 'object',

                  properties: {
                    name: {
                      type: 'string',
                    },

                    issuer: {
                      type: 'string',
                    },

                    date: {
                      type: 'string',
                    },

                    credentialId: {
                      type: 'string',
                    },
                  },

                  required: [
                    'name',
                    'issuer',
                    'date',
                    'credentialId',
                  ],
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

    const output = response.text?.trim()

    if (!output) {
      throw new Error(
        'Gemini returned an empty response',
      )
    }

    console.log(
      '\n========== RAW GEMINI OUTPUT ==========\n',
    )

    console.log(output)

    console.log(
      '\n========== END RAW GEMINI OUTPUT ==========\n',
    )

    let parsed: Partial<ParsedResume>

    try {
      parsed = JSON.parse(output)
    } catch (error) {
      console.error(
        '❌ Gemini returned invalid JSON:',
        output,
      )

      throw new Error(
        'Gemini returned invalid resume JSON',
      )
    }

    /*
    |--------------------------------------------------------------------------
    | FINAL DETERMINISTIC CLEANING
    |--------------------------------------------------------------------------
    */

    const projects = cleanProjects(
      parsed.projects,
      text,
    )

    const education = cleanEducation(
      parsed.education,
    )

    const experience = cleanExperience(
      parsed.experience,
    )

    const certifications =
      cleanCertifications(
        parsed.certifications,
      )

    const finalResult: ParsedResume = {
      ...emptyResume(),

      name: clean(parsed.name),

      email: clean(parsed.email),

      phone: clean(parsed.phone),

      location: clean(parsed.location),

      headline: clean(parsed.headline),

      summary: clean(parsed.summary),

      skills: Array.isArray(parsed.skills)
        ? uniqueStrings(parsed.skills)
        : [],

      education,

      experience,

      projects,

      certifications,
    }

    /*
    |--------------------------------------------------------------------------
    | FINAL LOG
    |--------------------------------------------------------------------------
    */

    console.log(
      '\n========== FINAL RESUME DATA ==========\n',
    )

    console.log(
      JSON.stringify(
        finalResult,
        null,
        2,
      ),
    )

    console.log(
      '\n========== FINAL COUNTS ==========\n',
    )

    console.log({
      skills:
        finalResult.skills.length,

      education:
        finalResult.education.length,

      experience:
        finalResult.experience.length,

      projects:
        finalResult.projects.length,

      certifications:
        finalResult.certifications.length,
    })

    console.log(
      '\n========================================\n',
    )

    return JSON.stringify(
      finalResult,
    )
  } catch (error: any) {
    console.error(
      '\n❌ GEMINI RESUME PARSING ERROR:',
      error,
    )

    if (
      error?.status === 429 ||
      error?.message?.includes('429')
    ) {
      throw new Error(
        'Gemini API rate limit or quota exceeded',
      )
    }

    if (
      error?.status === 404 ||
      error?.message?.includes('404')
    ) {
      throw new Error(
        'Gemini model was not found. Check the configured Gemini model name.',
      )
    }

    throw new Error(
      error?.message ||
        'Failed to parse resume with Gemini',
    )
  }
}

