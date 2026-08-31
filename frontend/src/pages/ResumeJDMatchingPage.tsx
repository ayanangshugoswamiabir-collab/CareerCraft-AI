import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ResumeItem {
  _id?: string
  id?: string
  fileName: string
  parsedData?: {
    name?: string
    headline?: string
    summary?: string
    skills?: string[]
  }
}

interface MatchResult {
  matchScore: number
  summary: string
  matchedSkills: string[]
  missingSkills: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  strengths: string[]
  recommendations: string[]
}

interface ApiResponse {
  success: boolean
  message?: string
  data?: unknown
  result?: unknown
  analysis?: unknown
}

const API_URL = 'http://localhost:5000/api'

/* =========================================================
   SAFE HELPERS (unchanged)
   ========================================================= */

const safeString = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

const safeNumber = (
  value: unknown,
  fallback = 0,
): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }

  if (typeof value === 'string') {
    const parsed = Number(
      value.replace('%', '').trim(),
    )

    return Number.isFinite(parsed)
      ? parsed
      : fallback
  }

  return fallback
}

const safeStringArray = (
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
    .map(item => item.trim())
    .filter(Boolean)
}

/* =========================================================
   OBJECT HELPERS (unchanged)
   ========================================================= */

const getObject = (
  value: unknown,
): Record<string, unknown> | null => {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>
  }

  return null
}

/* =========================================================
   FIND ACTUAL MATCH RESULT (unchanged)
   ========================================================= */

const findMatchResult = (
  response: ApiResponse,
): Record<string, unknown> => {
  const candidates: unknown[] = [
    response.data,
    response.result,
    response.analysis,
  ]

  for (const candidate of candidates) {
    const object = getObject(candidate)

    if (!object) {
      continue
    }

    /*
     * Supports:
     *
     * data: {
     *   result: {...}
     * }
     */

    const nestedResult = getObject(
      object.result,
    )

    if (nestedResult) {
      return nestedResult
    }

    /*
     * Supports:
     *
     * data: {
     *   analysis: {...}
     * }
     */

    const nestedAnalysis = getObject(
      object.analysis,
    )

    if (nestedAnalysis) {
      return nestedAnalysis
    }

    /*
     * Supports:
     *
     * data: {
     *   data: {...}
     * }
     */

    const nestedData = getObject(
      object.data,
    )

    if (nestedData) {
      return nestedData
    }

    /*
     * Normal response:
     *
     * data: {
     *   matchScore: 82,
     *   ...
     * }
     */

    return object
  }

  throw new Error(
    'The server returned an invalid matching analysis.',
  )
}

/* =========================================================
   NORMALIZE MATCH RESULT (unchanged)
   ========================================================= */

const normalizeMatchResult = (
  response: ApiResponse,
): MatchResult => {
  const raw = findMatchResult(response)

  const scoreValue =
    raw.matchScore ??
    raw.match_score ??
    raw.score ??
    raw.compatibilityScore ??
    raw.compatibility_score ??
    raw.matchPercentage ??
    raw.match_percentage ??
    0

  const normalizedScore = Math.max(
    0,
    Math.min(
      100,
      safeNumber(scoreValue, 0),
    ),
  )

  console.log(
    'MATCH SCORE RAW VALUE:',
    scoreValue,
  )

  console.log(
    'MATCH SCORE NORMALIZED:',
    normalizedScore,
  )

  return {
    matchScore: normalizedScore,

    summary: safeString(
      raw.summary ??
        raw.matchSummary ??
        raw.match_summary,
    ),

    matchedSkills: safeStringArray(
      raw.matchingSkills ??
        raw.matchedSkills ??
        raw.matching_skills ??
        raw.matched_skills,
    ),

    missingSkills: safeStringArray(
      raw.missingRequiredSkills ??
        raw.missingSkills ??
        raw.missing_required_skills ??
        raw.missing_skills,
    ),

    matchedKeywords: safeStringArray(
      raw.matchingKeywords ??
        raw.matchedKeywords ??
        raw.matching_keywords ??
        raw.matched_keywords,
    ),

    missingKeywords: safeStringArray(
      raw.missingKeywords ??
        raw.missing_keywords,
    ),

    strengths: safeStringArray(
      raw.strengths,
    ),

    recommendations: safeStringArray(
      raw.recommendations ??
        raw.suggestions,
    ),
  }
}

/* =========================================================
   AMBIENT KEYFRAMES + GLOBAL LOOK
   (same dark 3D theme used across CareerCraft AI pages)
   ========================================================= */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .rjm-root, .rjm-root * { box-sizing: border-box; }
    .rjm-root {
      font-family: 'Outfit', sans-serif;
      background: #03040e;
      color: #e8eaf6;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    .rjm-mono { font-family: 'JetBrains Mono', monospace; }

    @keyframes rjmFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes rjmShimmerX {
      0%   { background-position: -300% 0; }
      100% { background-position: 300% 0; }
    }
    @keyframes rjmSpin {
      to { transform: rotate(360deg); }
    }
    @keyframes rjmScanH {
      from { transform: translateY(-100%); }
      to   { transform: translateY(100vh); }
    }
    @keyframes rjmDash {
      from { stroke-dashoffset: 251; }
    }

    .rjm-tilt {
      transition: transform .4s cubic-bezier(.23,1,.32,1), box-shadow .4s ease;
      transform-style: preserve-3d;
    }
    .rjm-spin { animation: rjmSpin 0.9s linear infinite; }

    .rjm-select {
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%236b6f99' stroke-width='1.6'><path d='M5 7l5 5 5-5'/></svg>");
      background-repeat: no-repeat;
      background-position: right 14px center;
      background-size: 16px;
    }

    .rjm-textarea::placeholder { color: #4d5077; }
    .rjm-textarea {
      scrollbar-width: thin;
      scrollbar-color: rgba(108,99,255,.4) transparent;
    }
    .rjm-textarea::-webkit-scrollbar { width: 6px; }
    .rjm-textarea::-webkit-scrollbar-thumb { background: rgba(108,99,255,.4); border-radius: 4px; }
  `}</style>
)

/* ══════════════════════════════════════════════════════════
   TILT CARD — same interaction used across CareerCraft AI
══════════════════════════════════════════════════════════ */
function TiltCard({
  children,
  accent = '108,99,255',
  style = {},
  className = '',
}: {
  children: React.ReactNode
  accent?: string
  style?: React.CSSProperties
  className?: string
}) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg) translateZ(6px)`
    el.style.boxShadow = `${-x * 24}px ${-y * 18}px 60px rgba(${accent},.16), 0 0 0 1px rgba(${accent},.28), inset 0 1px 0 rgba(255,255,255,.05)`
  }
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateZ(0)'
    el.style.boxShadow = `0 12px 40px rgba(${accent},.12), 0 0 0 1px rgba(${accent},.14), inset 0 1px 0 rgba(255,255,255,.04)`
  }

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`rjm-tilt ${className}`}
      style={{
        boxShadow: `0 12px 40px rgba(${accent},.12), 0 0 0 1px rgba(${accent},.14), inset 0 1px 0 rgba(255,255,255,.04)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   BACKDROP — soft glow + scanline
══════════════════════════════════════════════════════════ */
function Backdrop() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 100% 60% at 50% -5%, rgba(108,99,255,.16) 0%, transparent 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 80% 15%, rgba(0,212,255,.08) 0%, transparent 55%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 2,
          top: 0,
          background: 'linear-gradient(90deg,transparent,rgba(108,99,255,.5) 50%,transparent)',
          animation: 'rjmScanH 8s linear infinite',
        }}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SCORE RING — replaces the flat circular score badge
══════════════════════════════════════════════════════════ */
function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score))
  const r = 44
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct >= 75 ? '#34d399' : pct >= 50 ? '#00d4ff' : pct >= 25 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ position: 'relative', width: 112, height: 112, flexShrink: 0 }}>
      <svg width={112} height={112} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={56} cy={56} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={9} />
        <circle
          cx={56}
          cy={56}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
            transition: 'stroke-dashoffset 1s cubic-bezier(.23,1,.32,1)',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="text-3xl font-extrabold" style={{ color, letterSpacing: '-0.02em' }}>
          {Number.isFinite(score) ? Math.round(score) : 0}%
        </span>
        <span className="rjm-mono text-[10px]" style={{ color: '#6b6f99', letterSpacing: '.08em' }}>
          MATCH
        </span>
      </div>
    </div>
  )
}

/* =========================================================
   COMPONENT
   ========================================================= */

function ResumeJDMatchingPage() {
  const navigate = useNavigate()

  const [resumes, setResumes] =
    useState<ResumeItem[]>([])

  const [selectedResume, setSelectedResume] =
    useState('')

  const [jobDescription, setJobDescription] =
    useState('')

  const [result, setResult] =
    useState<MatchResult | null>(null)

  const [loadingResumes, setLoadingResumes] =
    useState(true)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  /* =======================================================
     TOKEN
     ======================================================= */

  const getToken = (): string | null => {
    return localStorage.getItem('token')
  }

  /* =======================================================
     LOAD RESUMES
     ======================================================= */

  useEffect(() => {
    let cancelled = false

    const loadResumes = async () => {
      const authToken = getToken()

      if (!authToken) {
        if (!cancelled) {
          setError(
            'Please log in to view your resumes.',
          )

          setLoadingResumes(false)
        }

        return
      }

      try {
        setLoadingResumes(true)
        setError('')

        const response = await fetch(
          `${API_URL}/resumes`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${authToken}`,
              Accept:
                'application/json',
            },
          },
        )

        const data =
          (await response.json()) as {
            success: boolean
            data?: unknown
            resumes?: unknown
            message?: string
          }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Failed to load resumes.',
          )
        }

        const resumeData =
          Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.resumes)
              ? data.resumes
              : []

        const normalizedResumes =
          resumeData.filter(
            (
              item,
            ): item is ResumeItem => {
              return (
                item !== null &&
                typeof item === 'object' &&
                typeof (
                  item as Record<
                    string,
                    unknown
                  >
                ).fileName ===
                  'string'
              )
            },
          )

        if (!cancelled) {
          setResumes(
            normalizedResumes,
          )
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load resumes.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoadingResumes(false)
        }
      }
    }

    void loadResumes()

    return () => {
      cancelled = true
    }
  }, [])

  /* =======================================================
     ANALYZE MATCH
     ======================================================= */

  const analyzeMatch = async () => {
    if (!selectedResume) {
      setError(
        'Please select a resume.',
      )

      return
    }

    if (!jobDescription.trim()) {
      setError(
        'Please paste a job description.',
      )

      return
    }

    const authToken = getToken()

    if (!authToken) {
      setError(
        'Please log in before analyzing.',
      )

      return
    }

    try {
      setError('')
      setResult(null)
      setLoading(true)

      console.log(
        'Starting Resume ↔ JD analysis...',
      )

      console.log(
        'Resume ID:',
        selectedResume,
      )

      console.log(
        'Job description length:',
        jobDescription.length,
      )

      const response = await fetch(
        `${API_URL}/matching/resume-jd`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${authToken}`,

            Accept:
              'application/json',
          },

          body: JSON.stringify({
            resumeId:
              selectedResume,

            jobDescription:
              jobDescription.trim(),
          }),
        },
      )

      const contentType =
        response.headers.get(
          'content-type',
        ) || ''

      let data: ApiResponse

      if (
        contentType.includes(
          'application/json',
        )
      ) {
        data =
          (await response.json()) as ApiResponse
      } else {
        const text =
          await response.text()

        console.error(
          'Non-JSON backend response:',
          text,
        )

        throw new Error(
          `Server returned an invalid response (${response.status}).`,
        )
      }

      console.log(
        'RAW MATCHING RESPONSE:',
        data,
      )

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Failed to analyze Resume and Job Description.',
        )
      }

      const normalized =
        normalizeMatchResult(data)

      console.log(
        'NORMALIZED MATCH RESULT:',
        normalized,
      )

      console.log(
        'FINAL SCORE TO DISPLAY:',
        normalized.matchScore,
      )

      /*
       * IMPORTANT:
       *
       * Once result is successfully set,
       * the Tailor Resume button becomes visible.
       */

      setResult(normalized)
    } catch (err: unknown) {
      console.error(
        'Resume ↔ JD analysis error:',
        err,
      )

      setResult(null)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to analyze Resume and Job Description.',
      )
    } finally {
      setLoading(false)
    }
  }

  /* =======================================================
     TAILOR RESUME
     ======================================================= */

  const handleTailorResume = () => {
    /*
     * This button can only appear after
     * a successful analysis, but we still
     * validate everything before navigating.
     */

    if (!selectedResume) {
      setError(
        'Please select a resume first.',
      )

      return
    }

    if (!jobDescription.trim()) {
      setError(
        'Job description is missing.',
      )

      return
    }

    if (!result) {
      setError(
        'Please analyze the resume against the job description first.',
      )

      return
    }

    console.log(
      'Opening Resume Tailoring...',
    )

    console.log(
      'Resume ID:',
      selectedResume,
    )

    console.log(
      'Match Score:',
      result.matchScore,
    )

    /*
     * Pass everything required by the
     * future AI Resume Tailoring page.
     */

    navigate(
      `/resume-tailoring?resumeId=${encodeURIComponent(
        selectedResume,
      )}`,
      {
        state: {
          resumeId: selectedResume,

          jobDescription:
            jobDescription.trim(),

          matchResult: result,
        },
      },
    )
  }

  /* =======================================================
     SELECTED RESUME
     ======================================================= */

  const selectedResumeData =
    resumes.find(
      resume =>
        (resume._id ||
          resume.id) ===
        selectedResume,
    )

  /* =======================================================
     LIST RENDERER
     ======================================================= */

  const renderList = (
    items: string[],
    emptyMessage: string,
    accent: string = '108,99,255',
  ) => {
    if (
      !items ||
      items.length === 0
    ) {
      return (
        <p className="text-sm" style={{ color: '#6b6f99' }}>
          {emptyMessage}
        </p>
      )
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map(
          (item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                background: `rgba(${accent},.12)`,
                border: `1px solid rgba(${accent},.32)`,
                color: '#e8eaf6',
              }}
            >
              {item}
            </span>
          ),
        )}
      </div>
    )
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="rjm-root">
      <GlobalStyle />
      <Backdrop />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ===================================================
            HEADER
        =================================================== */}

        <header
          className="sticky top-0 z-20 backdrop-blur"
          style={{ borderBottom: '1px solid rgba(108,99,255,.14)', background: 'rgba(3,4,14,.85)' }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition"
                style={{
                  background: 'transparent',
                  color: '#9da0c4',
                  border: '1px solid rgba(108,99,255,.28)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(108,99,255,.1)'
                  e.currentTarget.style.color = '#c8b8ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9da0c4'
                }}
              >
                <span aria-hidden="true">←</span>
                Dashboard
              </button>

              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold"
                  style={{
                    background: 'linear-gradient(135deg,#6c63ff,#00d4ff)',
                    color: '#03040e',
                    boxShadow: '0 8px 24px rgba(108,99,255,.4)',
                  }}
                >
                  C
                </div>

                <div>
                  <h1 className="text-lg font-bold tracking-tight" style={{ color: '#e8eaf6' }}>
                    CareerCraft AI
                  </h1>
                  <p className="rjm-mono text-xs" style={{ color: '#6b6f99' }}>
                    Resume ↔ Job Description Matching
                  </p>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="mx-auto max-w-7xl px-6 py-10">

          {/* =================================================
              PAGE TITLE
          ================================================= */}

          <div className="mb-8" style={{ animation: 'rjmFadeUp .6s both' }}>

            <div
              className="rjm-mono mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wider"
              style={{
                background: 'rgba(108,99,255,.1)',
                border: '1px solid rgba(108,99,255,.3)',
                color: '#a5a0ff',
              }}
            >
              <span>✦</span>
              AI Career Tools
            </div>

            <h2
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{
                letterSpacing: '-0.02em',
                background: 'linear-gradient(110deg,#e8eaf6,#a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Resume ↔ Job Description Matching
            </h2>

            <p className="mt-3 max-w-3xl text-base leading-7" style={{ color: '#6b6f99' }}>
              Compare your resume against a job description to identify your match
              score, matched skills, missing skills, keywords, strengths, and
              improvement areas.
            </p>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl px-5 py-4 text-sm font-medium"
              style={{
                background: 'rgba(239,68,68,.08)',
                border: '1px solid rgba(239,68,68,.3)',
                color: '#fca5a5',
              }}
            >
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* =================================================
              TWO COLUMN LAYOUT
          ================================================= */}

          <div className="grid gap-6 lg:grid-cols-2">

            {/* =================================================
                LEFT SIDE
            ================================================= */}

            <TiltCard
              className="p-6"
              style={{
                borderRadius: 20,
                background: 'linear-gradient(150deg,rgba(13,15,31,.97),rgba(108,99,255,.05))',
                animation: 'rjmFadeUp .6s .05s both',
              }}
            >

              {/* SELECT RESUME */}

              <div className="mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#e8eaf6' }}>
                  1. Select Resume
                </h3>
                <p className="mt-1 text-sm" style={{ color: '#6b6f99' }}>
                  Choose one of your uploaded resumes.
                </p>
              </div>

              {loadingResumes ? (

                <div
                  className="rounded-xl p-5 text-sm"
                  style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', color: '#9da0c4' }}
                >
                  Loading your resumes...
                </div>

              ) : resumes.length === 0 ? (

                <div
                  className="rounded-xl p-5"
                  style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)' }}
                >
                  <p className="text-sm font-medium" style={{ color: '#fcd34d' }}>
                    No resumes found.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/resumes')}
                    className="mt-3 font-semibold transition"
                    style={{ color: '#00d4ff' }}
                  >
                    Upload a resume →
                  </button>
                </div>

              ) : (

                <select
                  value={selectedResume}
                  onChange={event => {

                    setSelectedResume(
                      event.target.value,
                    )

                    /*
                     * Changing the resume means
                     * the previous analysis is no
                     * longer valid.
                     */

                    setResult(null)
                    setError('')

                  }}
                  className="rjm-select w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,.03)',
                    border: '1px solid rgba(108,99,255,.22)',
                    color: '#e8eaf6',
                  }}
                >

                  <option value="" style={{ background: '#0d0f1f' }}>
                    Select a resume
                  </option>

                  {resumes.map(
                    resume => {

                      const id =
                        resume._id ||
                        resume.id ||
                        ''

                      return (
                        <option key={id} value={id} style={{ background: '#0d0f1f' }}>
                          {resume.fileName}
                        </option>
                      )
                    },
                  )}

                </select>
              )}

              {/* SELECTED RESUME */}

              {selectedResumeData && (

                <div
                  className="mt-4 rounded-xl p-4"
                  style={{ background: 'rgba(108,99,255,.08)', border: '1px solid rgba(108,99,255,.25)' }}
                >

                  <p className="font-semibold" style={{ color: '#e8eaf6' }}>
                    {selectedResumeData
                      .parsedData
                      ?.name ||
                      selectedResumeData.fileName}
                  </p>

                  {selectedResumeData
                    .parsedData
                    ?.headline && (

                    <p className="mt-1 text-sm" style={{ color: '#9da0c4' }}>
                      {
                        selectedResumeData
                          .parsedData
                          .headline
                      }
                    </p>

                  )}

                  {Array.isArray(
                    selectedResumeData
                      .parsedData
                      ?.skills,
                  ) &&
                    selectedResumeData
                      .parsedData
                      ?.skills
                      .length >
                      0 && (

                      <div className="mt-3 flex flex-wrap gap-2">

                        {selectedResumeData
                          .parsedData
                          .skills
                          .slice(0, 10)
                          .map(
                            (
                              skill,
                              index,
                            ) => (

                              <span
                                key={`${skill}-${index}`}
                                className="rounded-full px-3 py-1 text-xs font-medium"
                                style={{ background: 'rgba(0,212,255,.12)', color: '#7fe3ff' }}
                              >
                                {skill}
                              </span>

                            ),
                          )}

                      </div>

                    )}

                </div>

              )}

              {/* JOB DESCRIPTION */}

              <div className="mb-6 mt-8">
                <h3 className="text-xl font-bold" style={{ color: '#e8eaf6' }}>
                  2. Paste Job Description
                </h3>
                <p className="mt-1 text-sm" style={{ color: '#6b6f99' }}>
                  Paste the complete job posting you want to compare against your
                  resume.
                </p>
              </div>

              <textarea
                value={jobDescription}
                onChange={event => {

                  setJobDescription(
                    event.target.value,
                  )

                  /*
                   * If the JD changes, the old
                   * analysis is no longer valid.
                   */

                  if (result) {
                    setResult(null)
                  }

                }}
                placeholder="Paste the job description here..."
                className="rjm-textarea min-h-[360px] w-full resize-y rounded-xl p-4 text-sm leading-6 outline-none transition"
                style={{
                  background: 'rgba(255,255,255,.03)',
                  border: '1px solid rgba(108,99,255,.18)',
                  color: '#e8eaf6',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(108,99,255,.55)'
                  e.currentTarget.style.background = 'rgba(255,255,255,.045)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(108,99,255,.18)'
                  e.currentTarget.style.background = 'rgba(255,255,255,.03)'
                }}
              />

              {/* ANALYZE BUTTON */}

              <button
                type="button"
                onClick={() =>
                  void analyzeMatch()
                }
                disabled={
                  loading ||
                  loadingResumes ||
                  resumes.length === 0
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition"
                style={{
                  background:
                    loading || loadingResumes || resumes.length === 0
                      ? 'rgba(108,99,255,.35)'
                      : 'linear-gradient(135deg,#6c63ff,#a78bfa)',
                  color: '#fff',
                  border: 'none',
                  cursor: loading || loadingResumes || resumes.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow:
                    loading || loadingResumes || resumes.length === 0
                      ? 'none'
                      : '0 12px 36px rgba(108,99,255,.4)',
                }}
              >
                {loading && (
                  <span
                    className="rjm-spin h-4 w-4 rounded-full"
                    style={{ border: '2px solid rgba(255,255,255,.25)', borderTopColor: '#fff' }}
                  />
                )}
                {loading
                  ? 'Analyzing Match...'
                  : 'Analyze Resume ↔ JD Match'}
              </button>

            </TiltCard>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <TiltCard
              accent="0,212,255"
              className="overflow-hidden p-6"
              style={{
                borderRadius: 20,
                background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(0,212,255,.04))',
                animation: 'rjmFadeUp .6s .1s both',
              }}
            >

              {/* EMPTY STATE */}

              {!result &&
                !loading && (

                  <div className="flex min-h-[650px] items-center justify-center text-center">

                    <div className="max-w-md">

                      <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                        style={{
                          background: 'rgba(0,212,255,.1)',
                          border: '1px solid rgba(0,212,255,.28)',
                          boxShadow: '0 0 30px rgba(0,212,255,.15)',
                        }}
                      >
                        🎯
                      </div>

                      <h3 className="mt-5 text-xl font-bold" style={{ color: '#e8eaf6' }}>
                        Your Match Analysis
                      </h3>

                      <p className="mt-2 text-sm leading-6" style={{ color: '#6b6f99' }}>
                        Select a resume, paste a job description, and start the
                        analysis to see how closely your profile matches the role.
                      </p>

                    </div>

                  </div>

                )}

              {/* LOADING */}

              {loading && (

                <div className="flex min-h-[650px] items-center justify-center text-center">

                  <div>

                    <div
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: 'rgba(0,212,255,.1)', border: '1px solid rgba(0,212,255,.28)' }}
                    >
                      <div
                        className="rjm-spin h-9 w-9 rounded-full"
                        style={{ border: '4px solid rgba(0,212,255,.18)', borderTopColor: '#00d4ff' }}
                      />
                    </div>

                    <h3 className="mt-6 text-xl font-bold" style={{ color: '#e8eaf6' }}>
                      Comparing your resume...
                    </h3>

                    <p className="mt-2 text-sm" style={{ color: '#6b6f99' }}>
                      CareerCraft AI is analyzing skills, keywords, and requirements.
                    </p>

                  </div>

                </div>

              )}

              {/* =================================================
                  RESULT
              ================================================= */}

              {result &&
                !loading && (

                  <div>

                    {/* MATCH HEADER */}

                    <div className="pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>

                      <p
                        className="rjm-mono text-[11px] font-semibold tracking-wider"
                        style={{ color: '#00d4ff' }}
                      >
                        MATCH RESULT
                      </p>

                      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <h3 className="text-2xl font-bold" style={{ color: '#e8eaf6' }}>
                            Resume Compatibility
                          </h3>
                          <p className="mt-1 text-sm" style={{ color: '#6b6f99' }}>
                            Based on the selected resume and job description.
                          </p>
                        </div>

                        {/* SCORE */}

                        <ScoreRing score={result.matchScore} />

                      </div>

                    </div>

                    {/* =================================================
                        AI RESUME TAILORING CTA
                        ONLY VISIBLE AFTER ANALYSIS
                    ================================================= */}

                    <div
                      className="mt-6 overflow-hidden rounded-2xl"
                      style={{
                        border: '1px solid rgba(108,99,255,.3)',
                        background: 'linear-gradient(135deg,rgba(108,99,255,.12),rgba(0,212,255,.06))',
                      }}
                    >

                      <div className="p-5">

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                          {/* CTA INFORMATION */}

                          <div className="flex items-start gap-4">

                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                              style={{
                                background: 'linear-gradient(135deg,#6c63ff,#00d4ff)',
                                boxShadow: '0 8px 24px rgba(108,99,255,.35)',
                              }}
                            >
                              ✨
                            </div>

                            <div>
                              <h4 className="text-lg font-bold" style={{ color: '#e8eaf6' }}>
                                Improve your resume for this job
                              </h4>
                              <p className="mt-1 max-w-xl text-sm leading-6" style={{ color: '#9da0c4' }}>
                                Your resume has been analyzed. Let AI tailor it
                                specifically to this job description using the
                                missing skills, keywords, and recommendations above.
                              </p>
                            </div>

                          </div>

                          {/* TAILOR BUTTON */}

                          <button
                            type="button"
                            onClick={handleTailorResume}
                            className="shrink-0 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition active:scale-[0.98]"
                            style={{
                              background: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
                              boxShadow: '0 12px 32px rgba(108,99,255,.4)',
                              border: 'none',
                            }}
                          >
                            ✨ Tailor My Resume
                          </button>

                        </div>

                      </div>

                    </div>

                    {/* SUMMARY */}

                    {result.summary && (

                      <div
                        className="mt-6 rounded-xl p-5"
                        style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)' }}
                      >
                        <h4 className="font-bold" style={{ color: '#e8eaf6' }}>
                          Summary
                        </h4>
                        <p className="mt-2 text-sm leading-6" style={{ color: '#c5c9e8' }}>
                          {result.summary}
                        </p>
                      </div>

                    )}

                    {/* SKILLS */}

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">

                      <div
                        className="rounded-xl p-5"
                        style={{ background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.28)' }}
                      >
                        <h4 className="font-bold" style={{ color: '#34d399' }}>
                          Matched Skills
                        </h4>
                        <div className="mt-3">
                          {renderList(
                            result.matchedSkills,
                            'No matched skills found.',
                            '52,211,153',
                          )}
                        </div>
                      </div>

                      <div
                        className="rounded-xl p-5"
                        style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.28)' }}
                      >
                        <h4 className="font-bold" style={{ color: '#f87171' }}>
                          Missing Skills
                        </h4>
                        <div className="mt-3">
                          {renderList(
                            result.missingSkills,
                            'No missing skills identified.',
                            '239,68,68',
                          )}
                        </div>
                      </div>

                    </div>

                    {/* KEYWORDS */}

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">

                      <div
                        className="rounded-xl p-5"
                        style={{ background: 'rgba(108,99,255,.07)', border: '1px solid rgba(108,99,255,.28)' }}
                      >
                        <h4 className="font-bold" style={{ color: '#a5a0ff' }}>
                          Matched Keywords
                        </h4>
                        <div className="mt-3">
                          {renderList(
                            result.matchedKeywords,
                            'No matched keywords found.',
                            '108,99,255',
                          )}
                        </div>
                      </div>

                      <div
                        className="rounded-xl p-5"
                        style={{ background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.28)' }}
                      >
                        <h4 className="font-bold" style={{ color: '#f59e0b' }}>
                          Missing Keywords
                        </h4>
                        <div className="mt-3">
                          {renderList(
                            result.missingKeywords,
                            'No missing keywords identified.',
                            '245,158,11',
                          )}
                        </div>
                      </div>

                    </div>

                    {/* STRENGTHS */}

                    {result.strengths.length > 0 && (

                      <div className="mt-6">
                        <h4 className="text-lg font-bold" style={{ color: '#e8eaf6' }}>
                          Your Strengths
                        </h4>

                        <div className="mt-3 flex flex-col gap-2">
                          {result.strengths.map(
                            (item, index) => (
                              <div
                                key={`strength-${index}`}
                                className="rounded-lg px-3.5 py-3 text-sm leading-6"
                                style={{
                                  background: 'rgba(255,255,255,.025)',
                                  border: '1px solid rgba(52,211,153,.16)',
                                  borderLeft: '2px solid rgba(52,211,153,.7)',
                                  color: '#c5c9e8',
                                }}
                              >
                                {item}
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                    )}

                    {/* RECOMMENDATIONS */}

                    {result.recommendations.length > 0 && (

                      <div className="mt-6">
                        <h4 className="text-lg font-bold" style={{ color: '#e8eaf6' }}>
                          Recommendations
                        </h4>

                        <div className="mt-3 flex flex-col gap-2">
                          {result.recommendations.map(
                            (item, index) => (
                              <div
                                key={`recommendation-${index}`}
                                className="rounded-lg px-3.5 py-3 text-sm leading-6"
                                style={{
                                  background: 'rgba(255,255,255,.025)',
                                  border: '1px solid rgba(108,99,255,.16)',
                                  borderLeft: '2px solid rgba(108,99,255,.7)',
                                  color: '#c5c9e8',
                                }}
                              >
                                {item}
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                    )}

                  </div>

                )}

            </TiltCard>

          </div>

        </main>

      </div>

    </div>
  )
}

export default ResumeJDMatchingPage