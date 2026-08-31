import { useState, useRef } from 'react'

/* ══════════════════════════════════════════════════════════
   TYPES (unchanged)
══════════════════════════════════════════════════════════ */
interface JDAnalysis {
  jobTitle: string
  company: string
  location: string
  employmentType: string
  experienceLevel: string
  summary: string
  requiredSkills: string[]
  preferredSkills: string[]
  responsibilities: string[]
  qualifications: string[]
  education: string[]
  keywords: string[]
}

interface JDAnalysisResponse {
  success: boolean
  message?: string
  data?: JDAnalysis
}

/* ══════════════════════════════════════════════════════════
   AMBIENT KEYFRAMES + GLOBAL LOOK
   (mirrors the reference: Outfit + JetBrains Mono, deep-space
   background, violet/cyan glow accents)
══════════════════════════════════════════════════════════ */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .jd-root, .jd-root * { box-sizing: border-box; }
    .jd-root {
      font-family: 'Outfit', sans-serif;
      background: #03040e;
      color: #e8eaf6;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    .jd-mono { font-family: 'JetBrains Mono', monospace; }

    @keyframes jdFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes jdPulseGlow {
      0%, 100% { opacity: .55; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.18); }
    }
    @keyframes jdShimmerX {
      0%   { background-position: -300% 0; }
      100% { background-position: 300% 0; }
    }
    @keyframes jdSpin {
      to { transform: rotate(360deg); }
    }
    @keyframes jdScanH {
      from { transform: translateY(-100%); }
      to   { transform: translateY(100vh); }
    }

    .jd-tilt {
      transition: transform .4s cubic-bezier(.23,1,.32,1), box-shadow .4s ease;
      transform-style: preserve-3d;
    }
    .jd-spin {
      animation: jdSpin 0.9s linear infinite;
    }
    .jd-textarea::placeholder { color: #4d5077; }
    .jd-textarea {
      scrollbar-width: thin;
      scrollbar-color: rgba(108,99,255,.4) transparent;
    }
    .jd-textarea::-webkit-scrollbar { width: 6px; }
    .jd-textarea::-webkit-scrollbar-thumb { background: rgba(108,99,255,.4); border-radius: 4px; }
  `}</style>
)

/* ══════════════════════════════════════════════════════════
   TILT CARD — the signature interaction from the reference
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
  const ref = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg) translateZ(6px)`
      el.style.boxShadow = `${-x * 24}px ${-y * 18}px 60px rgba(${accent},.16), 0 0 0 1px rgba(${accent},.28), inset 0 1px 0 rgba(255,255,255,.05)`
    })
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateZ(0)'
    el.style.boxShadow = `0 12px 40px rgba(${accent},.12), 0 0 0 1px rgba(${accent},.14), inset 0 1px 0 rgba(255,255,255,.04)`
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`jd-tilt ${className}`}
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
   BACKDROP — soft glow + perspective floor grid + scanline
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
          animation: 'jdScanH 8s linear infinite',
        }}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PRESENTATIONAL PIECES (restyled, same props/semantics)
══════════════════════════════════════════════════════════ */
const SectionTitle = ({
  icon,
  title,
  count,
  accent = '108,99,255',
}: {
  icon: string
  title: string
  count?: number
  accent?: string
}) => (
  <div className="mb-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
        style={{
          background: `rgba(${accent},.15)`,
          border: `1px solid rgba(${accent},.32)`,
          boxShadow: `0 6px 18px rgba(${accent},.18)`,
        }}
      >
        {icon}
      </div>
      <h4 className="text-[15px] font-bold" style={{ color: '#e8eaf6' }}>
        {title}
      </h4>
    </div>

    {typeof count === 'number' && (
      <span
        className="jd-mono rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ background: 'rgba(255,255,255,.05)', color: '#9da0c4', border: '1px solid rgba(255,255,255,.06)' }}
      >
        {count}
      </span>
    )}
  </div>
)

const SkillBadge = ({
  children,
  variant = 'blue',
}: {
  children: string
  variant?: 'blue' | 'purple' | 'gray'
}) => {
  const styles: Record<string, { bg: string; border: string; color: string; dot: string }> = {
    blue: { bg: 'rgba(108,99,255,.10)', border: 'rgba(108,99,255,.35)', color: '#a5a0ff', dot: '#6c63ff' },
    purple: { bg: 'rgba(167,139,250,.10)', border: 'rgba(167,139,250,.35)', color: '#c8b8ff', dot: '#a78bfa' },
    gray: { bg: 'rgba(255,255,255,.04)', border: 'rgba(255,255,255,.12)', color: '#9da0c4', dot: '#6b6f99' },
  }
  const s = styles[variant]

  return (
    <span
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition"
      style={{ background: s.bg, borderColor: s.border, color: s.color }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }}
      />
      {children}
    </span>
  )
}

const BulletList = ({ items, accent = '108,99,255' }: { items: string[]; accent?: string }) => (
  <div className="flex flex-col gap-2">
    {items.map((item, index) => (
      <div
        key={`${item}-${index}`}
        className="rounded-lg px-3.5 py-3 text-sm leading-6"
        style={{
          background: 'rgba(255,255,255,.025)',
          border: `1px solid rgba(${accent},.14)`,
          borderLeft: `2px solid rgba(${accent},.7)`,
          color: '#c5c9e8',
        }}
      >
        {item}
      </div>
    ))}
  </div>
)

/* ══════════════════════════════════════════════════════════
   MAIN PAGE — same state, same fetch logic, same handlers
══════════════════════════════════════════════════════════ */
interface JDPageProps {
  /** Called when the user clicks "Back to Dashboard". Defaults to
   *  navigating the browser to /dashboard if not provided. */
  onBack?: () => void
}

function JDPage({ onBack }: JDPageProps = {}) {
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyzeJD = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description first.')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch('http://localhost:5000/api/job-descriptions/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
        }),
      })

      let result: JDAnalysisResponse

      try {
        result = (await response.json()) as JDAnalysisResponse
      } catch {
        throw new Error('The server returned an invalid response.')
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to analyze job description.')
      }

      if (!result.data) {
        throw new Error('The server returned no analysis data.')
      }

      setAnalysis(result.data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Unable to analyze the job description.')
      } else {
        setError('Unable to analyze the job description.')
      }
    } finally {
      setLoading(false)
    }
  }

  const analyzeAnother = () => {
    setJobDescription('')
    setAnalysis(null)
    setError('')
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const characterCount = jobDescription.length

  const goToDashboard = () => {
    if (onBack) {
      onBack()
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="jd-root">
      <GlobalStyle />
      <Backdrop />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header
          className="sticky top-0 z-20 backdrop-blur"
          style={{ borderBottom: '1px solid rgba(108,99,255,.14)', background: 'rgba(3,4,14,.85)' }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={goToDashboard}
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
                <p className="jd-mono text-xs" style={{ color: '#6b6f99' }}>
                  Job Description Analyzer
                </p>
              </div>
              </div>
            </div>

            {analysis && (
              <button
                type="button"
                onClick={analyzeAnother}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition"
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
                Analyze Another JD
              </button>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* Page heading */}
          <div className="mb-8" style={{ animation: 'jdFadeUp .6s both' }}>
            <div
              className="jd-mono mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wider"
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
              Job Description Analyzer
            </h2>

            <p className="mt-3 max-w-3xl text-base leading-7" style={{ color: '#6b6f99' }}>
              Paste a job description and let CareerCraft AI identify the key requirements,
              skills, responsibilities, qualifications, education, and keywords.
            </p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            {/* Input panel */}
            <TiltCard
              className="p-5 sm:p-6"
              style={{
                borderRadius: 20,
                background: 'linear-gradient(150deg,rgba(13,15,31,.97),rgba(108,99,255,.05))',
                animation: 'jdFadeUp .6s .05s both',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{
                      background: 'rgba(108,99,255,.15)',
                      border: '1px solid rgba(108,99,255,.32)',
                      color: '#a5a0ff',
                    }}
                  >
                    ✎
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#e8eaf6' }}>
                      Paste Job Description
                    </h3>
                    <p className="mt-0.5 text-sm" style={{ color: '#6b6f99' }}>
                      Add the complete job posting below.
                    </p>
                  </div>
                </div>

                <span
                  className="jd-mono hidden rounded-full px-3 py-1 text-[11px] font-semibold sm:inline-flex"
                  style={{ background: 'rgba(0,212,255,.1)', color: '#00d4ff' }}
                >
                  AI Analysis
                </span>
              </div>

              <div className="relative mt-6">
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder={`Paste the job description here...\n\nExample:\nSoftware Engineer — Full Stack\nLocation: Bengaluru, India\nEmployment Type: Full-time\n\nResponsibilities:\n• Build scalable web applications...\n• Develop REST APIs...\n• Collaborate with engineering teams...`}
                  className="jd-textarea min-h-[430px] w-full resize-y rounded-xl p-4 pb-12 text-sm leading-6 outline-none transition"
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
                <div
                  className="jd-mono pointer-events-none absolute bottom-3 right-3 rounded-md px-2 py-1 text-xs"
                  style={{ background: 'rgba(3,4,14,.8)', color: '#6b6f99', border: '1px solid rgba(108,99,255,.14)' }}
                >
                  {characterCount.toLocaleString()} characters
                </div>
              </div>

              {error && (
                <div
                  className="mt-4 flex items-start gap-3 rounded-xl p-4 text-sm"
                  style={{
                    background: 'rgba(239,68,68,.08)',
                    border: '1px solid rgba(239,68,68,.3)',
                    color: '#fca5a5',
                  }}
                >
                  <span className="mt-0.5">⚠️</span>
                  <div>
                    <p className="font-semibold">Analysis failed</p>
                    <p className="mt-1 leading-5">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={analyzeJD}
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition"
                style={{
                  background: loading ? 'rgba(108,99,255,.35)' : 'linear-gradient(135deg,#6c63ff,#a78bfa)',
                  color: '#fff',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 12px 36px rgba(108,99,255,.4)',
                }}
              >
                {loading ? (
                  <>
                    <span
                      className="jd-spin h-4 w-4 rounded-full"
                      style={{ border: '2px solid rgba(255,255,255,.25)', borderTopColor: '#fff' }}
                    />
                    Analyzing Job Description...
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    Analyze Job Description
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs" style={{ color: '#4d5077' }}>
                CareerCraft AI analyzes only the information contained in the supplied job description.
              </p>
            </TiltCard>

            {/* Results panel */}
            <TiltCard
              accent="0,212,255"
              className="overflow-hidden"
              style={{
                borderRadius: 20,
                background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(0,212,255,.04))',
                animation: 'jdFadeUp .6s .1s both',
              }}
            >
              {/* Empty state */}
              {!analysis && !loading && (
                <div className="flex min-h-[610px] items-center justify-center p-8 text-center">
                  <div className="max-w-sm">
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

                    <h3 className="mt-6 text-xl font-bold" style={{ color: '#e8eaf6' }}>
                      Your Analysis Will Appear Here
                    </h3>

                    <p className="mt-3 text-sm leading-6" style={{ color: '#6b6f99' }}>
                      Paste a job description and click{' '}
                      <span className="font-semibold" style={{ color: '#c5c9e8' }}>
                        Analyze Job Description
                      </span>{' '}
                      to extract structured career insights.
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                      {[
                        ['🧩', 'Skills'],
                        ['📋', 'Responsibilities'],
                        ['🎓', 'Qualifications'],
                        ['🔎', 'Keywords'],
                      ].map(([icon, label]) => (
                        <div
                          key={label}
                          className="rounded-xl p-3"
                          style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}
                        >
                          <span className="text-lg">{icon}</span>
                          <p className="jd-mono mt-1 text-xs font-semibold" style={{ color: '#9da0c4' }}>
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex min-h-[610px] items-center justify-center p-8 text-center">
                  <div className="max-w-sm">
                    <div
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl"
                      style={{ background: 'rgba(0,212,255,.1)', border: '1px solid rgba(0,212,255,.28)' }}
                    >
                      <div
                        className="jd-spin h-10 w-10 rounded-full"
                        style={{ border: '4px solid rgba(0,212,255,.18)', borderTopColor: '#00d4ff' }}
                      />
                    </div>

                    <h3 className="mt-6 text-xl font-bold" style={{ color: '#e8eaf6' }}>
                      Analyzing Job Description
                    </h3>

                    <p className="mt-3 text-sm leading-6" style={{ color: '#6b6f99' }}>
                      Gemini is extracting the important requirements and organizing them into
                      structured sections.
                    </p>

                    <div className="mx-auto mt-6 max-w-xs space-y-2">
                      {[100, 80, 60].map((w, i) => (
                        <div
                          key={i}
                          className="h-2 rounded-full"
                          style={{
                            width: `${w}%`,
                            background:
                              'linear-gradient(90deg,rgba(0,212,255,.06),rgba(0,212,255,.28),rgba(0,212,255,.06))',
                            backgroundSize: '300% 100%',
                            animation: 'jdShimmerX 2.2s infinite',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis */}
              {analysis && !loading && (
                <div>
                  {/* Result header */}
                  <div
                    className="p-6 sm:p-7"
                    style={{
                      borderBottom: '1px solid rgba(0,212,255,.14)',
                      background: 'linear-gradient(160deg,rgba(0,212,255,.07),transparent 70%)',
                    }}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div
                          className="jd-mono mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                          style={{ background: 'rgba(52,211,153,.12)', color: '#34d399', border: '1px solid rgba(52,211,153,.3)' }}
                        >
                          <span>✓</span>
                          Analysis Complete
                        </div>

                        <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: '#e8eaf6' }}>
                          {analysis.jobTitle || 'Job Analysis'}
                        </h3>

                        {analysis.company && (
                          <p className="mt-1.5 text-sm font-semibold" style={{ color: '#00d4ff' }}>
                            {analysis.company}
                          </p>
                        )}
                      </div>

                      <div
                        className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl sm:flex"
                        style={{
                          background: 'linear-gradient(135deg,#6c63ff,#00d4ff)',
                          color: '#03040e',
                          boxShadow: '0 8px 24px rgba(0,212,255,.35)',
                        }}
                      >
                        ✦
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {analysis.location && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                          style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#c5c9e8' }}
                        >
                          📍
                          {analysis.location}
                        </span>
                      )}

                      {analysis.employmentType && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                          style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#c5c9e8' }}
                        >
                          💼
                          {analysis.employmentType}
                        </span>
                      )}

                      {analysis.experienceLevel && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
                          style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', color: '#c5c9e8' }}
                        >
                          🎓
                          {analysis.experienceLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Result body */}
                  <div className="space-y-8 p-6 sm:p-7">
                    {/* Summary */}
                    {analysis.summary && (
                      <div
                        className="rounded-xl p-5"
                        style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.08)' }}
                      >
                        <SectionTitle icon="📌" title="Summary" accent="0,212,255" />
                        <p className="text-sm leading-7" style={{ color: '#c5c9e8' }}>
                          {analysis.summary}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {analysis.requiredSkills.length > 0 && (
                      <div>
                        <SectionTitle icon="🧩" title="Required Skills" count={analysis.requiredSkills.length} />
                        <div className="flex flex-wrap gap-2">
                          {analysis.requiredSkills.map((skill, index) => (
                            <SkillBadge key={`${skill}-${index}`}>{skill}</SkillBadge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preferred skills */}
                    {analysis.preferredSkills.length > 0 && (
                      <div>
                        <SectionTitle icon="⭐" title="Preferred Skills" count={analysis.preferredSkills.length} accent="167,139,250" />
                        <div className="flex flex-wrap gap-2">
                          {analysis.preferredSkills.map((skill, index) => (
                            <SkillBadge key={`${skill}-${index}`} variant="purple">
                              {skill}
                            </SkillBadge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Responsibilities */}
                    {analysis.responsibilities.length > 0 && (
                      <div>
                        <SectionTitle icon="📋" title="Responsibilities" count={analysis.responsibilities.length} accent="0,212,255" />
                        <BulletList items={analysis.responsibilities} accent="0,212,255" />
                      </div>
                    )}

                    {/* Qualifications */}
                    {analysis.qualifications.length > 0 && (
                      <div>
                        <SectionTitle icon="🎓" title="Qualifications" count={analysis.qualifications.length} accent="167,139,250" />
                        <BulletList items={analysis.qualifications} accent="167,139,250" />
                      </div>
                    )}

                    {/* Education */}
                    {analysis.education.length > 0 && (
                      <div>
                        <SectionTitle icon="🏫" title="Education" count={analysis.education.length} accent="52,211,153" />
                        <BulletList items={analysis.education} accent="52,211,153" />
                      </div>
                    )}

                    {/* Keywords */}
                    {analysis.keywords.length > 0 && (
                      <div>
                        <SectionTitle icon="🔎" title="Important Keywords" count={analysis.keywords.length} accent="108,99,255" />
                        <div className="flex flex-wrap gap-2">
                          {analysis.keywords.map((keyword, index) => (
                            <SkillBadge key={`${keyword}-${index}`} variant="gray">
                              {keyword}
                            </SkillBadge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty analysis fallback */}
                    {!analysis.summary &&
                      analysis.requiredSkills.length === 0 &&
                      analysis.preferredSkills.length === 0 &&
                      analysis.responsibilities.length === 0 &&
                      analysis.qualifications.length === 0 &&
                      analysis.education.length === 0 &&
                      analysis.keywords.length === 0 && (
                        <div
                          className="rounded-xl p-5 text-sm"
                          style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)', color: '#fcd34d' }}
                        >
                          The analysis completed, but no structured information was returned for this
                          job description.
                        </div>
                      )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 sm:px-7" style={{ borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.015)' }}>
                    <p className="jd-mono text-center text-xs" style={{ color: '#4d5077' }}>
                      CareerCraft AI • Job Description Analysis
                    </p>
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

export default JDPage