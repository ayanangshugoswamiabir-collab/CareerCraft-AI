
import 'dotenv/config'

import { GoogleGenAI } from '@google/genai'
import Groq from 'groq-sdk'

console.log('🔥 GEMINI + GROQ INTERVIEW SERVICE LOADED')

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

const GROQ_MODEL = 'openai/gpt-oss-120b'

/* =========================================================
   INTERVIEW TYPES
   ========================================================= */

export type InterviewType =
  | 'General'
  | 'Technical'
  | 'HR'
  | 'Behavioral'
  | 'Software Engineer'
  | 'Data Science'
  | 'Machine Learning / AI'

/* =========================================================
   START INTERVIEW INPUT
   ========================================================= */

export interface StartInterviewInput {
  interviewType: InterviewType
  jobDescription: string
}

/* =========================================================
   QUESTION RESULT
   ========================================================= */

export interface InterviewQuestionResult {
  question: string
  interviewType: InterviewType
}

/* =========================================================
   ANSWER EVALUATION INPUT
   ========================================================= */

export interface EvaluateInterviewAnswerInput {
  interviewType: InterviewType
  jobDescription: string
  question: string
  answer: string
}

/* =========================================================
   ANSWER EVALUATION RESULT
   ========================================================= */

export interface InterviewAnswerEvaluation {
  score: number
  strengths: string[]
  improvements: string[]
  feedback: string
  nextQuestion: string
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
   NORMALIZE INTERVIEW TYPE
   ========================================================= */

const normalizeInterviewType = (
  value: unknown,
): InterviewType => {
  const type = clean(value)

  const validTypes: InterviewType[] = [
    'General',
    'Technical',
    'HR',
    'Behavioral',
    'Software Engineer',
    'Data Science',
    'Machine Learning / AI',
  ]

  if (validTypes.includes(type as InterviewType)) {
    return type as InterviewType
  }

  return 'General'
}

/* =========================================================
   CLEAN GENERATED QUESTION
   ========================================================= */

const cleanGeneratedQuestion = (
  value: string,
): string => {
  let question = clean(value)

  question = question
    .replace(/^["']|["']$/g, '')
    .replace(/^Question:\s*/i, '')
    .replace(/^\d+[).\s]+/, '')
    .trim()

  if (!question) {
    return ''
  }

  if (
    question.includes('\n')
  ) {
    const lines = question
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length > 0) {
      question = lines[0]
    }
  }

  const explanationMarkers = [
    'Explanation:',
    'Why this question:',
    'This question',
    'The interviewer',
  ]

  for (const marker of explanationMarkers) {
    const index = question
      .toLowerCase()
      .indexOf(marker.toLowerCase())

    if (index > 0) {
      question = question
        .slice(0, index)
        .trim()
    }
  }

  question = question.replace(
    /^(Question\s*\d*\s*[:.)-]\s*)/i,
    '',
  )

  if (
    question &&
    !question.endsWith('?')
  ) {
    question += '?'
  }

  return question
}

/* =========================================================
   CLEAN AI JSON
   ========================================================= */

const extractJson = (
  value: string,
): string => {
  let text = value.trim()

  text = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  if (
    text.startsWith('{') &&
    text.endsWith('}')
  ) {
    return text
  }

  const firstBrace =
    text.indexOf('{')

  const lastBrace =
    text.lastIndexOf('}')

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    return text.slice(
      firstBrace,
      lastBrace + 1,
    )
  }

  throw new Error(
    'AI returned invalid JSON',
  )
}

/* =========================================================
   SAFE ARRAY
   ========================================================= */

const cleanStringArray = (
  value: unknown,
): string[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string',
    )
    .map((item) => clean(item))
    .filter(Boolean)
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
   BUILD QUESTION PROMPT
   ========================================================= */

const buildQuestionPrompt = (
  interviewType: InterviewType,
  jobDescription: string,
): string => {
  return `
You are conducting a realistic job interview.

Generate EXACTLY ONE interview question based on the
job description provided below.

INTERVIEW TYPE:
${interviewType}

JOB DESCRIPTION:
${jobDescription}

QUESTION RULES:

1. Ask ONLY ONE question.
2. Keep the question SHORT and natural.
3. Normally use 10-25 words.
4. Do NOT combine multiple questions.
5. Focus on ONE skill, responsibility, technology,
   concept, or competency from the JD.
6. The question must be directly relevant to the JD.
7. Do NOT invent technologies or responsibilities.
8. Do NOT include explanations.
9. Do NOT include an answer.
10. Do NOT include feedback.
11. Return ONLY the question.

INTERVIEW TYPE RULES:

GENERAL:
Ask one broad but role-relevant question.

TECHNICAL:
Ask one technical question about ONE technology,
concept, implementation problem, architecture decision,
or debugging situation mentioned in the JD.

HR:
Ask one concise question about motivation,
communication, career goals, or role fit.

BEHAVIORAL:
Ask one situation-based question about a responsibility
or competency relevant to the JD.

SOFTWARE ENGINEER:
Ask one software engineering question about programming,
architecture, APIs, databases, debugging, testing,
scalability, or another technology explicitly mentioned.

DATA SCIENCE:
Ask one question about data analysis, statistics,
experimentation, modeling, data pipelines, or tools
explicitly mentioned.

MACHINE LEARNING / AI:
Ask one question about machine learning, AI, model
development, evaluation, deployment, deep learning,
LLMs, or AI technologies explicitly mentioned.

Return ONLY the question.
`
}

/* =========================================================
   RUN GEMINI — QUESTION
   ========================================================= */

const runGeminiQuestion = async (
  prompt: string,
): Promise<string> => {
  if (!geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured',
    )
  }

  console.log(
    '🤖 INTERVIEW: Trying Gemini for question...',
  )

  const response =
    await genAI.models.generateContent({
      model: GEMINI_MODEL,

      contents: prompt,

      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      },
    })

  const output =
    response.text?.trim()

  if (!output) {
    throw new Error(
      'Gemini returned an empty interview question',
    )
  }

  const question =
    cleanGeneratedQuestion(output)

  if (!question) {
    throw new Error(
      'Gemini returned an invalid interview question',
    )
  }

  console.log(
    '✅ QUESTION GENERATED USING GEMINI',
  )

  console.log(
    '🤖 QUESTION:',
    question,
  )

  return question
}

/* =========================================================
   RUN GROQ — QUESTION
   ========================================================= */

const runGroqQuestion = async (
  client: Groq,
  apiNumber: number,
  prompt: string,
): Promise<string> => {
  console.log(
    `🤖 INTERVIEW: Trying Groq API #${apiNumber} for question...`,
  )

  const completion =
    await client.chat.completions.create({
      model: GROQ_MODEL,

      messages: [
        {
          role: 'system',

          content: `
You are a professional job interviewer.

Generate exactly ONE short and natural interview question.

The question must:

- be based only on the supplied JD
- match the selected interview type
- focus on ONE topic
- normally contain 10-25 words
- contain no explanation
- contain no answer
- contain no feedback
- contain no multiple questions

Return ONLY the question.
`.trim(),
        },

        {
          role: 'user',
          content: prompt,
        },
      ],

      temperature: 0.7,

      max_tokens: 100,
    })

  const output =
    completion
      .choices?.[0]
      ?.message
      ?.content

  if (
    typeof output !== 'string' ||
    !output.trim()
  ) {
    throw new Error(
      `Groq API #${apiNumber} returned an empty interview question`,
    )
  }

  const question =
    cleanGeneratedQuestion(output)

  if (!question) {
    throw new Error(
      `Groq API #${apiNumber} returned an invalid interview question`,
    )
  }

  console.log(
    `✅ QUESTION GENERATED USING GROQ API #${apiNumber}`,
  )

  console.log(
    '🤖 QUESTION:',
    question,
  )

  return question
}

/* =========================================================
   LOCAL FALLBACK QUESTION GENERATOR
   =========================================================
   
   IMPORTANT:
   This does NOT require Gemini or Groq.

   It guarantees that the interview can start even when
   all external AI providers are unavailable.
   ========================================================= */

const generateLocalFallbackQuestion = (
  interviewType: InterviewType,
  jobDescription: string,
): string => {
  const jd = jobDescription.toLowerCase()

  console.log(
    '🛟 USING LOCAL INTERVIEW QUESTION FALLBACK',
  )

  /* =======================================================
     MACHINE LEARNING / AI
     ======================================================= */

  if (
    interviewType === 'Machine Learning / AI'
  ) {
    if (
      jd.includes('model evaluation') ||
      jd.includes('evaluation')
    ) {
      return 'How would you evaluate the performance of a machine learning model?'
    }

    if (
      jd.includes('data preprocessing') ||
      jd.includes('preprocessing')
    ) {
      return 'How would you approach data preprocessing before training a machine learning model?'
    }

    if (
      jd.includes('tensorflow')
    ) {
      return 'How would you use TensorFlow to train a machine learning model?'
    }

    if (
      jd.includes('pytorch')
    ) {
      return 'How would you use PyTorch to train a deep learning model?'
    }

    if (
      jd.includes('deep learning')
    ) {
      return 'How would you choose an appropriate architecture for a deep learning problem?'
    }

    if (
      jd.includes('deployment') ||
      jd.includes('production')
    ) {
      return 'How would you deploy a machine learning model to production?'
    }

    if (
      jd.includes('python')
    ) {
      return 'How would you structure a Python project for a machine learning application?'
    }

    return 'How would you approach building a machine learning solution for a new problem?'
  }

  /* =======================================================
     DATA SCIENCE
     ======================================================= */

  if (
    interviewType === 'Data Science'
  ) {
    if (
      jd.includes('statistics')
    ) {
      return 'How would you use statistics to validate a data-driven conclusion?'
    }

    if (
      jd.includes('data analysis') ||
      jd.includes('analysis')
    ) {
      return 'How would you approach analyzing a new dataset?'
    }

    if (
      jd.includes('model')
    ) {
      return 'How would you select an appropriate model for a data science problem?'
    }

    return 'How would you approach solving a new data science problem?'
  }

  /* =======================================================
     SOFTWARE ENGINEER
     ======================================================= */

  if (
    interviewType === 'Software Engineer' ||
    interviewType === 'Technical'
  ) {
    if (
      jd.includes('node.js') ||
      jd.includes('node')
    ) {
      return 'How would you design a REST API using Node.js?'
    }

    if (
      jd.includes('react')
    ) {
      return 'How would you structure a React application for maintainability?'
    }

    if (
      jd.includes('typescript')
    ) {
      return 'How does TypeScript improve reliability in a software project?'
    }

    if (
      jd.includes('mongodb')
    ) {
      return 'How would you design a MongoDB data model for an application?'
    }

    if (
      jd.includes('sql')
    ) {
      return 'How would you optimize a slow SQL query?'
    }

    if (
      jd.includes('api')
    ) {
      return 'How would you design a reliable REST API?'
    }

    if (
      jd.includes('git')
    ) {
      return 'How do you use Git effectively when working with a development team?'
    }

    if (
      jd.includes('testing')
    ) {
      return 'How would you approach testing a production software application?'
    }

    return 'How would you approach designing a maintainable software application?'
  }

  /* =======================================================
     BEHAVIORAL
     ======================================================= */

  if (
    interviewType === 'Behavioral'
  ) {
    return 'Tell me about a challenging project and how you handled it.'
  }

  /* =======================================================
     HR
     ======================================================= */

  if (
    interviewType === 'HR'
  ) {
    return 'Why are you interested in this role?'
  }

  /* =======================================================
     GENERAL
     ======================================================= */

  return 'Can you tell me about your experience relevant to this role?'
}

/* =========================================================
   GENERATE INTERVIEW QUESTION
   ========================================================= */

export const generateInterviewQuestion =
  async (
    input: StartInterviewInput,
  ): Promise<InterviewQuestionResult> => {
    const interviewType =
      normalizeInterviewType(
        input.interviewType,
      )

    const jobDescription =
      clean(input.jobDescription)

    if (!jobDescription) {
      throw new Error(
        'Job description is required to generate an interview question',
      )
    }

    console.log(
      '\n==============================================',
    )

    console.log(
      '🎤 AI INTERVIEW QUESTION GENERATION',
    )

    console.log(
      '==============================================',
    )

    console.log(
      'Interview Type:',
      interviewType,
    )

    console.log(
      'JD Length:',
      jobDescription.length,
    )

    const prompt =
      buildQuestionPrompt(
        interviewType,
        jobDescription,
      )

    /* =======================================================
       PROVIDER 1 — GEMINI
       ======================================================= */

    try {
      const question =
        await runGeminiQuestion(
          prompt,
        )

      return {
        question,
        interviewType,
      }
    } catch (geminiError: unknown) {
      console.error(
        '\n⚠️ INTERVIEW GEMINI FAILED',
      )

      console.error(
        geminiError,
      )

      console.log(
        '🔄 Falling back to Groq API #1...',
      )
    }

    /* =======================================================
       PROVIDER 2 — GROQ API #1
       ======================================================= */

    if (groq1) {
      try {
        const question =
          await runGroqQuestion(
            groq1,
            1,
            prompt,
          )

        return {
          question,
          interviewType,
        }
      } catch (groqError1: unknown) {
        console.error(
          '\n⚠️ INTERVIEW GROQ API #1 FAILED',
        )

        console.error(
          groqError1,
        )

        console.log(
          '🔄 Falling back to Groq API #2...',
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
        const question =
          await runGroqQuestion(
            groq2,
            2,
            prompt,
          )

        return {
          question,
          interviewType,
        }
      } catch (groqError2: unknown) {
        console.error(
          '\n❌ INTERVIEW GROQ API #2 FAILED',
        )

        console.error(
          groqError2,
        )
      }
    } else {
      console.error(
        '⚠️ GROQ_API_KEY_2 is not configured',
      )
    }

    /* =======================================================
       FINAL FALLBACK — LOCAL QUESTION
       ======================================================= */

    console.log(
      '\n🛟 ALL AI PROVIDERS FAILED',
    )

    console.log(
      '🛟 Switching to local interview question fallback...',
    )

    const fallbackQuestion =
      generateLocalFallbackQuestion(
        interviewType,
        jobDescription,
      )

    console.log(
      '🛟 FALLBACK QUESTION:',
      fallbackQuestion,
    )

    return {
      question: fallbackQuestion,
      interviewType,
    }
  }

/* =========================================================
   BUILD ANSWER EVALUATION PROMPT
   ========================================================= */

const buildAnswerEvaluationPrompt = (
  input: EvaluateInterviewAnswerInput,
): string => {
  return `
You are an expert job interviewer evaluating a candidate's answer.

Evaluate the candidate's answer based ONLY on:

1. The job description
2. The interview type
3. The interview question
4. The candidate's answer

Do NOT invent information about the candidate.

INTERVIEW TYPE:
${input.interviewType}

JOB DESCRIPTION:
${input.jobDescription}

QUESTION ASKED:
${input.question}

CANDIDATE ANSWER:
${input.answer}

EVALUATION:

Consider:

- Relevance to the question
- Technical correctness when applicable
- Understanding
- Clarity
- Completeness
- Practical reasoning
- Communication quality
- Whether the answer actually addresses the question

Do NOT penalize the candidate simply because the answer is
short if it correctly answers the question.

Do NOT reward information that was not actually present.

SCORE:

0-39 = Poor
40-59 = Needs Improvement
60-74 = Average
75-89 = Good
90-100 = Excellent

STRENGTHS:

List the strongest parts of the answer.

Use only evidence from the actual answer.

IMPROVEMENTS:

List specific things the candidate should improve.

FEEDBACK:

Give concise interviewer-style feedback.

NEXT QUESTION:

Generate ONE SHORT next interview question.

The next question must:

- be relevant to the JD
- match the interview type
- logically continue the interview
- focus on ONE topic
- normally contain 10-25 words
- not repeat the exact previous question
- not contain multiple questions

Return ONLY valid JSON.

Use exactly this structure:

{
  "score": 0,
  "strengths": [],
  "improvements": [],
  "feedback": "",
  "nextQuestion": ""
}
`
}

/* =========================================================
   PARSE ANSWER EVALUATION
   ========================================================= */

const parseAnswerEvaluation = (
  output: string,
): InterviewAnswerEvaluation => {
  const json =
    extractJson(output)

  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error(
      'AI returned invalid interview evaluation JSON',
    )
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null
  ) {
    throw new Error(
      'AI returned invalid interview evaluation',
    )
  }

  const data =
    parsed as Record<string, unknown>

  const nextQuestion =
    cleanGeneratedQuestion(
      typeof data.nextQuestion === 'string'
        ? data.nextQuestion
        : '',
    )

  if (!nextQuestion) {
    throw new Error(
      'AI did not return a valid next interview question',
    )
  }

  return {
    score: cleanScore(
      data.score,
    ),

    strengths:
      cleanStringArray(
        data.strengths,
      ),

    improvements:
      cleanStringArray(
        data.improvements,
      ),

    feedback:
      clean(
        data.feedback,
      ),

    nextQuestion,
  }
}

/* =========================================================
   LOCAL ANSWER EVALUATION
   =========================================================
   
   Used when Gemini and Groq are unavailable.

   This provides basic deterministic feedback so the frontend
   can continue to the next question.
   ========================================================= */

const evaluateAnswerLocally = (
  input: EvaluateInterviewAnswerInput,
): InterviewAnswerEvaluation => {
  const answer = clean(input.answer)
  const question = clean(input.question)

  const words = answer
    ? answer.split(/\s+/).filter(Boolean)
    : []

  const wordCount = words.length

  let score = 45

  if (wordCount >= 10) {
    score += 10
  }

  if (wordCount >= 30) {
    score += 10
  }

  if (wordCount >= 60) {
    score += 10
  }

  if (wordCount >= 100) {
    score += 5
  }

  const lowerAnswer =
    answer.toLowerCase()

  const technicalKeywords = [
    'because',
    'approach',
    'example',
    'implement',
    'implementation',
    'performance',
    'testing',
    'validation',
    'error',
    'model',
    'data',
    'api',
    'production',
    'deployment',
  ]

  const matchedKeywords =
    technicalKeywords.filter(
      (keyword) =>
        lowerAnswer.includes(keyword),
    )

  if (
    matchedKeywords.length >= 2
  ) {
    score += 10
  }

  if (
    matchedKeywords.length >= 4
  ) {
    score += 5
  }

  score = Math.min(
    85,
    Math.max(
      0,
      score,
    ),
  )

  const strengths: string[] = []

  if (wordCount >= 30) {
    strengths.push(
      'Provides a reasonably detailed response',
    )
  } else if (wordCount >= 10) {
    strengths.push(
      'Provides a relevant response with some supporting detail',
    )
  } else {
    strengths.push(
      'Provides a direct response to the interview question',
    )
  }

  if (
    matchedKeywords.length > 0
  ) {
    strengths.push(
      'Includes practical or technical terminology relevant to the response',
    )
  }

  const improvements: string[] = []

  if (wordCount < 30) {
    improvements.push(
      'Provide more detail and explain your reasoning',
    )
  }

  improvements.push(
    'Include a concrete example or implementation approach where appropriate',
  )

  improvements.push(
    'Connect the answer more directly to the requirements of the job description',
  )

  const feedback =
    score >= 75
      ? 'Your answer provides useful detail and addresses the question reasonably well. Add a concrete example to make the response stronger.'
      : 'Your answer provides a starting point, but it would be stronger with more detail, reasoning, and a concrete example related to the role.'

  const nextQuestion =
    generateLocalNextQuestion(
      input.interviewType,
      input.jobDescription,
      question,
    )

  return {
    score,
    strengths,
    improvements,
    feedback,
    nextQuestion,
  }
}

/* =========================================================
   LOCAL NEXT QUESTION
   ========================================================= */

const generateLocalNextQuestion = (
  interviewType: InterviewType,
  jobDescription: string,
  previousQuestion: string,
): string => {
  const jd =
    jobDescription.toLowerCase()

  const previous =
    previousQuestion.toLowerCase()

  if (
    interviewType === 'Machine Learning / AI'
  ) {
    if (
      !previous.includes('evaluation') &&
      (
        jd.includes('model evaluation') ||
        jd.includes('evaluation')
      )
    ) {
      return 'How would you choose appropriate metrics for evaluating a machine learning model?'
    }

    if (
      !previous.includes('preprocessing') &&
      (
        jd.includes('data preprocessing') ||
        jd.includes('preprocessing')
      )
    ) {
      return 'How would you handle missing values during machine learning data preprocessing?'
    }

    if (
      !previous.includes('deployment') &&
      (
        jd.includes('deployment') ||
        jd.includes('production')
      )
    ) {
      return 'What factors would you consider when deploying a machine learning model to production?'
    }

    if (
      !previous.includes('tensorflow') &&
      jd.includes('tensorflow')
    ) {
      return 'How would you monitor a TensorFlow model after deployment?'
    }

    if (
      !previous.includes('pytorch') &&
      jd.includes('pytorch')
    ) {
      return 'How would you debug a PyTorch model that is not learning effectively?'
    }

    if (
      !previous.includes('deep learning') &&
      jd.includes('deep learning')
    ) {
      return 'How would you reduce overfitting in a deep learning model?'
    }

    return 'How would you improve the performance of a machine learning model?'
  }

  if (
    interviewType === 'Data Science'
  ) {
    if (
      jd.includes('statistics')
    ) {
      return 'How would you determine whether a statistical result is significant?'
    }

    if (
      jd.includes('data analysis')
    ) {
      return 'How would you identify useful patterns in a new dataset?'
    }

    return 'How would you validate a data science model before using its results?'
  }

  if (
    interviewType === 'Software Engineer' ||
    interviewType === 'Technical'
  ) {
    if (
      jd.includes('node') &&
      !previous.includes('node')
    ) {
      return 'How would you handle errors in a Node.js REST API?'
    }

    if (
      jd.includes('mongodb') &&
      !previous.includes('mongodb')
    ) {
      return 'How would you optimize a MongoDB query with poor performance?'
    }

    if (
      jd.includes('react') &&
      !previous.includes('react')
    ) {
      return 'How would you optimize a React component that renders too frequently?'
    }

    if (
      jd.includes('typescript') &&
      !previous.includes('typescript')
    ) {
      return 'How does TypeScript help prevent errors in a large application?'
    }

    if (
      jd.includes('testing') &&
      !previous.includes('testing')
    ) {
      return 'How would you test an important feature before deploying it?'
    }

    return 'How would you debug a production issue in a software application?'
  }

  if (
    interviewType === 'Behavioral'
  ) {
    return 'Tell me about a time you had to solve a difficult problem.'
  }

  if (
    interviewType === 'HR'
  ) {
    return 'What motivates you to perform well in this role?'
  }

  return 'What would you consider your strongest skill for this role?'
}

/* =========================================================
   RUN GEMINI — ANSWER EVALUATION
   ========================================================= */

const runGeminiAnswerEvaluation =
  async (
    prompt: string,
  ): Promise<string> => {
    if (!geminiApiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured',
      )
    }

    console.log(
      '🤖 INTERVIEW: Trying Gemini for answer evaluation...',
    )

    const response =
      await genAI.models.generateContent({
        model: GEMINI_MODEL,

        contents: prompt,

        config: {
          temperature: 0.3,

          maxOutputTokens: 800,

          responseMimeType:
            'application/json',
        },
      })

    const output =
      response.text?.trim()

    if (!output) {
      throw new Error(
        'Gemini returned an empty answer evaluation',
      )
    }

    return output
  }

/* =========================================================
   RUN GROQ — ANSWER EVALUATION
   ========================================================= */

const runGroqAnswerEvaluation =
  async (
    client: Groq,
    apiNumber: number,
    prompt: string,
  ): Promise<string> => {
    console.log(
      `🤖 INTERVIEW: Trying Groq API #${apiNumber} for answer evaluation...`,
    )

    const completion =
      await client.chat.completions.create({
        model: GROQ_MODEL,

        messages: [
          {
            role: 'system',

            content:
              'You are an expert job interviewer. Evaluate the candidate answer and return ONLY valid JSON using the requested structure.',
          },

          {
            role: 'user',
            content: prompt,
          },
        ],

        temperature: 0.3,

        max_tokens: 800,

        response_format: {
          type: 'json_object',
        },
      })

    const output =
      completion
        .choices?.[0]
        ?.message
        ?.content

    if (
      typeof output !== 'string' ||
      !output.trim()
    ) {
      throw new Error(
        `Groq API #${apiNumber} returned an empty answer evaluation`,
      )
    }

    return output.trim()
  }

/* =========================================================
   EVALUATE INTERVIEW ANSWER
   ========================================================= */

export const evaluateInterviewAnswer =
  async (
    input: EvaluateInterviewAnswerInput,
  ): Promise<InterviewAnswerEvaluation> => {
    const interviewType =
      normalizeInterviewType(
        input.interviewType,
      )

    const jobDescription =
      clean(input.jobDescription)

    const question =
      clean(input.question)

    const answer =
      clean(input.answer)

    if (!jobDescription) {
      throw new Error(
        'Job description is required for answer evaluation',
      )
    }

    if (!question) {
      throw new Error(
        'Interview question is required for answer evaluation',
      )
    }

    if (!answer) {
      throw new Error(
        'Candidate answer is required for evaluation',
      )
    }

    console.log(
      '\n==============================================',
    )

    console.log(
      '🧠 AI INTERVIEW ANSWER EVALUATION',
    )

    console.log(
      '==============================================',
    )

    console.log(
      'Interview Type:',
      interviewType,
    )

    console.log(
      'Question:',
      question,
    )

    console.log(
      'Answer:',
      answer,
    )

    const prompt =
      buildAnswerEvaluationPrompt({
        interviewType,
        jobDescription,
        question,
        answer,
      })

    /* =======================================================
       PROVIDER 1 — GEMINI
       ======================================================= */

    try {
      const output =
        await runGeminiAnswerEvaluation(
          prompt,
        )

      const result =
        parseAnswerEvaluation(
          output,
        )

      console.log(
        '✅ ANSWER EVALUATED USING GEMINI',
      )

      console.log(
        JSON.stringify(
          result,
          null,
          2,
        ),
      )

      return result
    } catch (geminiError: unknown) {
      console.error(
        '\n⚠️ ANSWER EVALUATION GEMINI FAILED',
      )

      console.error(
        geminiError,
      )

      console.log(
        '🔄 Falling back to Groq API #1...',
      )
    }

    /* =======================================================
       PROVIDER 2 — GROQ API #1
       ======================================================= */

    if (groq1) {
      try {
        const output =
          await runGroqAnswerEvaluation(
            groq1,
            1,
            prompt,
          )

        const result =
          parseAnswerEvaluation(
            output,
          )

        console.log(
          '✅ ANSWER EVALUATED USING GROQ API #1',
        )

        console.log(
          JSON.stringify(
            result,
            null,
            2,
          ),
        )

        return result
      } catch (groqError1: unknown) {
        console.error(
          '\n⚠️ ANSWER EVALUATION GROQ API #1 FAILED',
        )

        console.error(
          groqError1,
        )

        console.log(
          '🔄 Falling back to Groq API #2...',
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
          await runGroqAnswerEvaluation(
            groq2,
            2,
            prompt,
          )

        const result =
          parseAnswerEvaluation(
            output,
          )

        console.log(
          '✅ ANSWER EVALUATED USING GROQ API #2',
        )

        console.log(
          JSON.stringify(
            result,
            null,
            2,
          ),
        )

        return result
      } catch (groqError2: unknown) {
        console.error(
          '\n❌ ANSWER EVALUATION GROQ API #2 FAILED',
        )

        console.error(
          groqError2,
        )
      }
    } else {
      console.error(
        '⚠️ GROQ_API_KEY_2 is not configured',
      )
    }

    /* =======================================================
       FINAL FALLBACK — LOCAL EVALUATION
       ======================================================= */

    console.log(
      '\n🛟 ALL AI EVALUATION PROVIDERS FAILED',
    )

    console.log(
      '🛟 USING LOCAL ANSWER EVALUATION FALLBACK',
    )

    const fallbackResult =
      evaluateAnswerLocally({
        interviewType,
        jobDescription,
        question,
        answer,
      })

    console.log(
      '🛟 LOCAL EVALUATION:',
    )

    console.log(
      JSON.stringify(
        fallbackResult,
        null,
        2,
      ),
    )

    return fallbackResult
  }
