import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Resume {
  _id: string
  id?: string
  fileName: string
  fileType?: string
  uploadedAt?: string
}

interface MatchResult {
  matchScore: number
  summary?: string
  matchedSkills: string[]
  missingSkills: string[]
  matchedKeywords?: string[]
  missingKeywords?: string[]
  strengths?: string[]
  recommendations: string[]
}

interface BackendMatchResult {
  matchScore?: number | string
  score?: number | string

  summary?: string

  matchedSkills?: string[]
  missingSkills?: string[]

  matchedKeywords?: string[]
  missingKeywords?: string[]

  strengths?: string[]
  recommendations?: string[]
}

interface ResumeResponse {
  success?: boolean
  message?: string
  data?: Resume[]
  resumes?: Resume[]
}

interface MatchResponse {
  success?: boolean
  message?: string
  data?: BackendMatchResult
  analysis?: BackendMatchResult
}

/* =========================================================
   AMBIENT KEYFRAMES + GLOBAL LOOK
   (same dark 3D theme used across CareerCraft AI pages)
   ========================================================= */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .mp-root, .mp-root * { box-sizing: border-box; }
    .mp-root {
      font-family: 'Outfit', sans-serif;
      background: #03040e;
      color: #e8eaf6;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    .mp-mono { font-family: 'JetBrains Mono', monospace; }

    @keyframes mpFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes mpSpin {
      to { transform: rotate(360deg); }
    }
    @keyframes mpScanH {
      from { transform: translateY(-100%); }
      to   { transform: translateY(100vh); }
    }

    .mp-tilt {
      transition: transform .4s cubic-bezier(.23,1,.32,1), box-shadow .4s ease;
      transform-style: preserve-3d;
    }
    .mp-spin { animation: mpSpin 0.9s linear infinite; }

    .mp-select {
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%236b6f99' stroke-width='1.6'><path d='M5 7l5 5 5-5'/></svg>");
      background-repeat: no-repeat;
      background-position: right 14px center;
      background-size: 16px;
    }

    .mp-textarea::placeholder { color: #4d5077; }
    .mp-textarea {
      scrollbar-width: thin;
      scrollbar-color: rgba(108,99,255,.4) transparent;
    }
    .mp-textarea::-webkit-scrollbar { width: 6px; }
    .mp-textarea::-webkit-scrollbar-thumb { background: rgba(108,99,255,.4); border-radius: 4px; }
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
      className={`mp-tilt ${className}`}
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
          animation: 'mpScanH 8s linear infinite',
        }}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SCORE RING — replaces the flat "6xl percent" score block
══════════════════════════════════════════════════════════ */
function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score))
  const r = 58
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct >= 75 ? '#34d399' : pct >= 50 ? '#00d4ff' : pct >= 25 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ position: 'relative', width: 148, height: 148, margin: '0 auto' }}>
      <svg width={148} height={148} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={74} cy={74} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={11} />
        <circle
          cx={74}
          cy={74}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 10px ${color})`,
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
        <span className="text-4xl font-extrabold" style={{ color, letterSpacing: '-0.02em' }}>
          {score}%
        </span>
        <span className="mp-mono text-[10px]" style={{ color: '#6b6f99', letterSpacing: '.08em' }}>
          MATCH
        </span>
      </div>
    </div>
  )
}

function MatchingPage() {
  const navigate = useNavigate()

  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<MatchResult | null>(null)

  const [loadingResumes, setLoadingResumes] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Get authentication token from localStorage.
   */
  const getAuthHeaders = (): Record<string, string> => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('jwt')

    if (!token) {
      return {}
    }

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  /**
   * Safely convert score to a number.
   *
   * Supports:
   * 75
   * "75"
   * "75%"
   */
  const normalizeScore = (
    value: number | string | undefined,
  ): number => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return 0
      }

      return Math.min(100, Math.max(0, Math.round(value)))
    }

    if (typeof value === 'string') {
      const parsed = Number(
        value.replace('%', '').trim(),
      )

      if (!Number.isFinite(parsed)) {
        return 0
      }

      return Math.min(100, Math.max(0, Math.round(parsed)))
    }

    return 0
  }

  /**
   * Convert backend result into the exact frontend format.
   */
  const normalizeMatchResult = (
    backendResult: BackendMatchResult,
  ): MatchResult => {
    const scoreValue =
      backendResult.matchScore ??
      backendResult.score ??
      0

    return {
      matchScore: normalizeScore(scoreValue),

      summary:
        typeof backendResult.summary === 'string'
          ? backendResult.summary
          : '',

      matchedSkills:
        Array.isArray(backendResult.matchedSkills)
          ? backendResult.matchedSkills
          : [],

      missingSkills:
        Array.isArray(backendResult.missingSkills)
          ? backendResult.missingSkills
          : [],

      matchedKeywords:
        Array.isArray(backendResult.matchedKeywords)
          ? backendResult.matchedKeywords
          : [],

      missingKeywords:
        Array.isArray(backendResult.missingKeywords)
          ? backendResult.missingKeywords
          : [],

      strengths:
        Array.isArray(backendResult.strengths)
          ? backendResult.strengths
          : [],

      recommendations:
        Array.isArray(backendResult.recommendations)
          ? backendResult.recommendations
          : [],
    }
  }

  /**
   * Load resumes belonging to the logged-in user.
   */
  useEffect(() => {
    const loadResumes = async () => {
      try {
        setLoadingResumes(true)
        setError('')

        const response = await fetch(
          'http://localhost:5000/api/resumes',
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              ...getAuthHeaders(),
            },
          },
        )

        const data =
          (await response.json()) as ResumeResponse

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              'Failed to load your resumes.',
          )
        }

        const resumeList = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.resumes)
            ? data.resumes
            : []

        setResumes(resumeList)

        if (resumeList.length > 0) {
          const firstResume = resumeList[0]

          setSelectedResumeId(
            firstResume._id ||
              firstResume.id ||
              '',
          )
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(
            err.message ||
              'Unable to load your resumes.',
          )
        } else {
          setError(
            'Unable to load your resumes.',
          )
        }
      } finally {
        setLoadingResumes(false)
      }
    }

    void loadResumes()
  }, [])

  /**
   * Analyze selected resume against job description.
   */
  const analyzeMatch = async () => {
    if (!selectedResumeId) {
      setError(
        'Please select a resume first.',
      )
      return
    }

    if (!jobDescription.trim()) {
      setError(
        'Please paste a job description.',
      )
      return
    }

    setLoading(true)
    setError('')

    /*
     * IMPORTANT:
     *
     * Remove the previous result while a new
     * analysis is running.
     *
     * This also guarantees that the Tailor button
     * disappears while the new analysis is running.
     */
    setResult(null)

    try {
      const response = await fetch(
        'http://localhost:5000/api/matching/analyze',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            resumeId: selectedResumeId,
            jobDescription:
              jobDescription.trim(),
          }),
        },
      )

      const data =
        (await response.json()) as MatchResponse

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Failed to analyze resume against job description.',
        )
      }

      /**
       * Backend can return:
       *
       * {
       *   success: true,
       *   data: {...}
       * }
       *
       * OR
       *
       * {
       *   success: true,
       *   analysis: {...}
       * }
       */
      const backendResult =
        data.data || data.analysis

      if (!backendResult) {
        throw new Error(
          'No matching result was returned.',
        )
      }

      const normalizedResult =
        normalizeMatchResult(
          backendResult,
        )

      console.log(
        '========== MATCH RESULT ==========',
      )

      console.log(
        'Backend result:',
        backendResult,
      )

      console.log(
        'Normalized result:',
        normalizedResult,
      )

      console.log(
        'Match score:',
        normalizedResult.matchScore,
      )

      console.log(
        '==================================',
      )

      setResult(normalizedResult)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(
          err.message ||
            'Unable to analyze the resume and job description.',
        )
      } else {
        setError(
          'Unable to analyze the resume and job description.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * =========================================================
   * TAILOR RESUME
   * =========================================================
   *
   * IMPORTANT:
   *
   * This button ONLY exists after a successful analysis.
   *
   * The analysis result, resume ID, and job description
   * are passed to the Resume Tailoring page.
   *
   * The actual AI tailoring API can be connected there
   * without changing the matching functionality.
   */
  const handleTailorResume = () => {
    /*
     * Safety check.
     *
     * Even though the button is only rendered when
     * result exists, keep these checks so the function
     * cannot accidentally run without the required data.
     */
    if (!result) {
      setError(
        'Please analyze the resume and job description first.',
      )

      return
    }

    if (!selectedResumeId) {
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

    /*
     * Navigate to the tailoring page.
     *
     * The result is passed through React Router state
     * so the tailoring page can use:
     *
     * - matchScore
     * - matchedSkills
     * - missingSkills
     * - matchedKeywords
     * - missingKeywords
     * - strengths
     * - recommendations
     * - complete job description
     * - selected resume ID
     */
    navigate(
      `/resume-tailoring?resumeId=${encodeURIComponent(
        selectedResumeId,
      )}`,
      {
        state: {
          resumeId: selectedResumeId,

          jobDescription:
            jobDescription.trim(),

          matchResult: result,
        },
      },
    )
  }

  const selectedResume = resumes.find(
    (resume) =>
      (resume._id || resume.id) ===
      selectedResumeId,
  )

  return (
    <div className="mp-root">
      <GlobalStyle />
      <Backdrop />

      <div style={{ position: 'relative', zIndex: 1 }}>

        <header
          className="sticky top-0 z-20 backdrop-blur"
          style={{ borderBottom: '1px solid rgba(108,99,255,.14)', background: 'rgba(3,4,14,.85)' }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

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

              <div>
                <h1 className="text-lg font-bold tracking-tight" style={{ color: '#e8eaf6' }}>
                  CareerCraft AI
                </h1>
                <p className="mp-mono text-xs" style={{ color: '#6b6f99' }}>
                  Resume ↔ JD Matching
                </p>
              </div>
            </div>

            <div
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: 'rgba(108,99,255,.1)', border: '1px solid rgba(108,99,255,.3)', color: '#a5a0ff' }}
            >
              AI Career Tool
            </div>

          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-8" style={{ animation: 'mpFadeUp .6s both' }}>
            <div
              className="mp-mono mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wider"
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
              Select one of your uploaded resumes and compare it against a job
              description to discover your strengths, skill gaps, and improvement
              opportunities.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* =====================================================
                INPUT
            ====================================================== */}

            <TiltCard
              className="p-6"
              style={{
                borderRadius: 20,
                background: 'linear-gradient(150deg,rgba(13,15,31,.97),rgba(108,99,255,.05))',
                animation: 'mpFadeUp .6s .05s both',
              }}
            >
              <div>
                <h3 className="text-xl font-semibold" style={{ color: '#e8eaf6' }}>
                  Matching Input
                </h3>
                <p className="mt-1 text-sm" style={{ color: '#6b6f99' }}>
                  Choose your resume and paste the job description.
                </p>
              </div>

              {/* RESUME SELECTOR */}

              <div className="mt-6">
                <label
                  htmlFor="resume"
                  className="block text-sm font-semibold"
                  style={{ color: '#c5c9e8' }}
                >
                  Select Resume
                </label>

                {loadingResumes ? (
                  <div
                    className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}
                  >
                    <div
                      className="mp-spin h-5 w-5 rounded-full"
                      style={{ border: '2px solid rgba(108,99,255,.2)', borderTopColor: '#6c63ff' }}
                    />
                    <span className="text-sm" style={{ color: '#9da0c4' }}>
                      Loading your resumes...
                    </span>
                  </div>
                ) : resumes.length === 0 ? (
                  <div
                    className="mt-2 rounded-xl px-4 py-4"
                    style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)' }}
                  >
                    <p className="text-sm font-semibold" style={{ color: '#fcd34d' }}>
                      No resumes found
                    </p>
                    <p className="mt-1 text-sm" style={{ color: '#e6c88a' }}>
                      Please upload a resume from the My Resumes page before
                      running a match.
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      id="resume"
                      value={selectedResumeId}
                      onChange={(event) => {
                        setSelectedResumeId(
                          event.target.value,
                        )

                        /*
                         * Changing the resume invalidates
                         * the previous analysis.
                         *
                         * Therefore the Tailor button
                         * disappears as well.
                         */
                        setResult(null)
                        setError('')
                      }}
                      className="mp-select mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none transition"
                      style={{
                        background: 'rgba(255,255,255,.03)',
                        border: '1px solid rgba(108,99,255,.22)',
                        color: '#e8eaf6',
                      }}
                    >
                      {resumes.map((resume) => (
                        <option
                          key={
                            resume._id ||
                            resume.id
                          }
                          value={
                            resume._id ||
                            resume.id
                          }
                          style={{ background: '#0d0f1f' }}
                        >
                          {resume.fileName}
                        </option>
                      ))}
                    </select>

                    {selectedResume && (
                      <div
                        className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{ background: 'rgba(108,99,255,.08)', border: '1px solid rgba(108,99,255,.25)' }}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                          style={{ background: 'rgba(108,99,255,.15)' }}
                        >
                          📄
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: '#e8eaf6' }}>
                            {selectedResume.fileName}
                          </p>
                          <p className="text-xs" style={{ color: '#a5a0ff' }}>
                            Selected resume
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* JOB DESCRIPTION */}

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="jobDescription"
                    className="block text-sm font-semibold"
                    style={{ color: '#c5c9e8' }}
                  >
                    Job Description
                  </label>

                  <span className="mp-mono text-xs" style={{ color: '#4d5077' }}>
                    {jobDescription.length} characters
                  </span>
                </div>

                <textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(event) => {
                    setJobDescription(
                      event.target.value,
                    )

                    /*
                     * If the JD changes, the previous
                     * analysis is no longer valid.
                     *
                     * This automatically hides the
                     * Tailor Resume button.
                     */
                    setResult(null)
                    setError('')
                  }}
                  placeholder="Paste the complete job description here..."
                  className="mp-textarea mt-2 min-h-[350px] w-full resize-y rounded-xl p-4 text-sm leading-6 outline-none transition"
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
              </div>

              {/* ERROR */}

              {error && (
                <div
                  className="mt-4 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: '#fca5a5' }}>
                    Analysis Error
                  </p>
                  <p className="mt-1 text-sm" style={{ color: '#f8b4b4' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* ANALYZE BUTTON */}

              <button
                type="button"
                onClick={() =>
                  void analyzeMatch()
                }
                disabled={
                  loading ||
                  loadingResumes ||
                  resumes.length === 0 ||
                  !selectedResumeId
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition"
                style={{
                  background:
                    loading || loadingResumes || resumes.length === 0 || !selectedResumeId
                      ? 'rgba(108,99,255,.35)'
                      : 'linear-gradient(135deg,#6c63ff,#a78bfa)',
                  color: '#fff',
                  border: 'none',
                  cursor:
                    loading || loadingResumes || resumes.length === 0 || !selectedResumeId
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow:
                    loading || loadingResumes || resumes.length === 0 || !selectedResumeId
                      ? 'none'
                      : '0 12px 36px rgba(108,99,255,.4)',
                }}
              >
                {loading && (
                  <span
                    className="mp-spin h-4 w-4 rounded-full"
                    style={{ border: '2px solid rgba(255,255,255,.25)', borderTopColor: '#fff' }}
                  />
                )}
                {loading
                  ? 'Analyzing Match...'
                  : 'Analyze Resume ↔ JD Match'}
              </button>
            </TiltCard>

            {/* =====================================================
                RESULTS
            ====================================================== */}

            <TiltCard
              accent="0,212,255"
              className="overflow-hidden p-6"
              style={{
                borderRadius: 20,
                background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(0,212,255,.04))',
                animation: 'mpFadeUp .6s .1s both',
              }}
            >

              {/* EMPTY STATE */}

              {!result && !loading && (
                <div className="flex min-h-[600px] items-center justify-center text-center">
                  <div className="max-w-md">
                    <div
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
                      style={{
                        background: 'rgba(0,212,255,.1)',
                        border: '1px solid rgba(0,212,255,.28)',
                        boxShadow: '0 0 30px rgba(0,212,255,.15)',
                      }}
                    >
                      🎯
                    </div>

                    <h3 className="mt-5 text-xl font-semibold" style={{ color: '#e8eaf6' }}>
                      Your Match Results
                    </h3>

                    <p className="mt-2 text-sm leading-6" style={{ color: '#6b6f99' }}>
                      Select a resume, paste a job description, and run the
                      analysis to see your compatibility score, matched skills,
                      missing skills, and recommendations.
                    </p>
                  </div>
                </div>
              )}

              {/* LOADING */}

              {loading && (
                <div className="flex min-h-[600px] items-center justify-center text-center">
                  <div>
                    <div
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: 'rgba(0,212,255,.1)', border: '1px solid rgba(0,212,255,.28)' }}
                    >
                      <div
                        className="mp-spin h-9 w-9 rounded-full"
                        style={{ border: '4px solid rgba(0,212,255,.18)', borderTopColor: '#00d4ff' }}
                      />
                    </div>

                    <h3 className="mt-5 text-xl font-semibold" style={{ color: '#e8eaf6' }}>
                      Comparing Resume
                    </h3>

                    <p className="mt-2 text-sm leading-6" style={{ color: '#6b6f99' }}>
                      CareerCraft AI is comparing your resume with the job
                      requirements.
                    </p>
                  </div>
                </div>
              )}

              {/* =====================================================
                  RESULTS
              ====================================================== */}

              {result && !loading && (
                <div>

                  {/* SCORE */}

                  <div
                    className="rounded-2xl p-7 text-center"
                    style={{
                      background: 'linear-gradient(160deg,rgba(108,99,255,.1),rgba(0,212,255,.05))',
                      border: '1px solid rgba(108,99,255,.2)',
                    }}
                  >
                    <p
                      className="mp-mono text-[11px] font-semibold tracking-wider"
                      style={{ color: '#a5a0ff' }}
                    >
                      OVERALL MATCH
                    </p>

                    <div className="mt-4">
                      <ScoreRing score={result.matchScore} />
                    </div>

                    <p className="mt-3 text-sm" style={{ color: '#6b6f99' }}>
                      Resume compatibility score
                    </p>

                    {result.summary && (
                      <p className="mx-auto mt-4 max-w-xl text-sm leading-6" style={{ color: '#c5c9e8' }}>
                        {result.summary}
                      </p>
                    )}
                  </div>

                  {/* =================================================
                      TAILOR RESUME BUTTON
                      =================================================

                      IMPORTANT:

                      This entire block is INSIDE:

                      {result && !loading && (...)}

                      Therefore:

                      BEFORE ANALYSIS:
                      result === null
                      → button does NOT exist.

                      DURING ANALYSIS:
                      loading === true
                      → button does NOT exist.

                      AFTER SUCCESSFUL ANALYSIS:
                      result !== null
                      loading === false
                      → button appears.

                      If user changes the resume or JD:
                      setResult(null)
                      → button disappears.
                  */}

                  <div
                    className="mt-6 rounded-2xl p-5"
                    style={{
                      border: '1px solid rgba(108,99,255,.3)',
                      background: 'linear-gradient(135deg,rgba(108,99,255,.12),rgba(0,212,255,.06))',
                    }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                          style={{
                            background: 'linear-gradient(135deg,#6c63ff,#00d4ff)',
                            boxShadow: '0 8px 24px rgba(108,99,255,.35)',
                          }}
                        >
                          ✨
                        </div>

                        <div>
                          <h3 className="text-lg font-bold" style={{ color: '#e8eaf6' }}>
                            Tailor your resume for this job
                          </h3>
                          <p className="mt-1 text-sm leading-6" style={{ color: '#9da0c4' }}>
                            Use this analysis to create a resume specifically
                            optimized for the selected job description.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleTailorResume}
                        className="shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-white transition active:scale-[0.98]"
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

                  {/* MATCHED SKILLS */}

                  <div className="mt-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold" style={{ color: '#e8eaf6' }}>
                        Matched Skills
                      </h3>

                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: 'rgba(52,211,153,.12)', color: '#34d399' }}
                      >
                        {result.matchedSkills.length} matched
                      </span>
                    </div>

                    {result.matchedSkills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.matchedSkills.map(
                          (skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="rounded-lg px-3 py-2 text-sm font-medium"
                              style={{ background: 'rgba(52,211,153,.1)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,.28)' }}
                            >
                              ✓ {skill}
                            </span>
                          ),
                        )}
                      </div>
                    ) : (
                      <p
                        className="mt-3 rounded-xl px-4 py-3 text-sm"
                        style={{ background: 'rgba(255,255,255,.03)', color: '#6b6f99' }}
                      >
                        No matched skills were identified.
                      </p>
                    )}
                  </div>

                  {/* MISSING SKILLS */}

                  <div className="mt-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold" style={{ color: '#e8eaf6' }}>
                        Missing Skills
                      </h3>

                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: 'rgba(239,68,68,.12)', color: '#f87171' }}
                      >
                        {result.missingSkills.length} missing
                      </span>
                    </div>

                    {result.missingSkills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.missingSkills.map(
                          (skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="rounded-lg px-3 py-2 text-sm font-medium"
                              style={{ background: 'rgba(239,68,68,.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.28)' }}
                            >
                              {skill}
                            </span>
                          ),
                        )}
                      </div>
                    ) : (
                      <p
                        className="mt-3 rounded-xl px-4 py-3 text-sm"
                        style={{ background: 'rgba(52,211,153,.08)', color: '#6ee7b7' }}
                      >
                        Great! No major missing skills were identified.
                      </p>
                    )}
                  </div>

                  {/* MATCHED KEYWORDS */}

                  {result.matchedKeywords &&
                    result.matchedKeywords.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold" style={{ color: '#e8eaf6' }}>
                          Matched Keywords
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {result.matchedKeywords.map(
                            (keyword, index) => (
                              <span
                                key={`${keyword}-${index}`}
                                className="rounded-lg px-3 py-2 text-sm font-medium"
                                style={{ background: 'rgba(108,99,255,.1)', color: '#a5a0ff', border: '1px solid rgba(108,99,255,.28)' }}
                              >
                                ✓ {keyword}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* MISSING KEYWORDS */}

                  {result.missingKeywords &&
                    result.missingKeywords.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold" style={{ color: '#e8eaf6' }}>
                          Missing Keywords
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {result.missingKeywords.map(
                            (keyword, index) => (
                              <span
                                key={`${keyword}-${index}`}
                                className="rounded-lg px-3 py-2 text-sm font-medium"
                                style={{ background: 'rgba(245,158,11,.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,.28)' }}
                              >
                                {keyword}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* STRENGTHS */}

                  {result.strengths &&
                    result.strengths.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold" style={{ color: '#e8eaf6' }}>
                          Strengths
                        </h3>

                        <div className="mt-3 flex flex-col gap-3">
                          {result.strengths.map(
                            (item, index) => (
                              <div
                                key={index}
                                className="rounded-xl p-4 text-sm leading-6"
                                style={{ background: 'rgba(52,211,153,.08)', color: '#c5c9e8', border: '1px solid rgba(52,211,153,.2)' }}
                              >
                                ✓ {item}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* RECOMMENDATIONS */}

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold" style={{ color: '#e8eaf6' }}>
                      Recommendations
                    </h3>

                    {result.recommendations.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-3">
                        {result.recommendations.map(
                          (item, index) => (
                            <div
                              key={index}
                              className="flex gap-3 rounded-xl p-4 text-sm leading-6"
                              style={{ background: 'rgba(255,255,255,.025)', color: '#c5c9e8', border: '1px solid rgba(255,255,255,.08)' }}
                            >
                              <span
                                className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                style={{ background: 'rgba(108,99,255,.2)', color: '#a5a0ff' }}
                              >
                                {index + 1}
                              </span>

                              <span>{item}</span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p
                        className="mt-3 rounded-xl px-4 py-3 text-sm"
                        style={{ background: 'rgba(255,255,255,.03)', color: '#6b6f99' }}
                      >
                        No additional recommendations were returned.
                      </p>
                    )}
                  </div>

                </div>
              )}
            </TiltCard>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MatchingPage