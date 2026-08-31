import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS (matches AXIOM spatial-OS reference)
══════════════════════════════════════════════════════════ */
const INK = '#03040e'
const TEXT = '#e8eaf6'
const MUTE = '#6b6f99'
const MUTE_2 = '#9da0c4'
const VIOLET = '#6c63ff'
const CYAN = '#00d4ff'
const PURPLE = '#a78bfa'
const GREEN = '#34d399'
const ORANGE = '#f59e0b'
const MONO = "'JetBrains Mono', monospace"
const SANS = "'Outfit', sans-serif"

/* ══════════════════════════════════════════════════════════
   TILT CARD — pointer-reactive 3D panel
══════════════════════════════════════════════════════════ */
function TiltCard({
  children,
  style = {},
  accent = '108,99,255',
  onClick,
  as = 'div',
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  accent?: string
  onClick?: () => void
  as?: 'div' | 'button'
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
      el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateZ(14px) scale(1.015)`
      el.style.boxShadow = `${-x * 30}px ${-y * 22}px 60px rgba(${accent},.22), 0 0 0 1px rgba(${accent},.35), inset 0 1px 0 rgba(255,255,255,.06)`
    })
  }

  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateZ(0) scale(1)'
    el.style.boxShadow = `0 14px 40px rgba(${accent},.12), 0 0 0 1px rgba(${accent},.1), inset 0 1px 0 rgba(255,255,255,.04)`
  }

  const Comp: any = as
  return (
    <Comp
      ref={ref}
      type={as === 'button' ? 'button' : undefined}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transition: 'transform .4s cubic-bezier(.23,1,.32,1), box-shadow .4s ease',
        transformStyle: 'preserve-3d',
        boxShadow: `0 14px 40px rgba(${accent},.12), 0 0 0 1px rgba(${accent},.1), inset 0 1px 0 rgba(255,255,255,.04)`,
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        font: 'inherit',
        color: 'inherit',
        background: 'none',
        border: 'none',
        width: '100%',
        ...style,
      }}
    >
      {children}
    </Comp>
  )
}

/* ══════════════════════════════════════════════════════════
   GRID FLOOR BACKGROUND
══════════════════════════════════════════════════════════ */
function GridBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 100% 60% at 50% -5%, rgba(108,99,255,.16) 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 80% 85%, rgba(0,212,255,.07) 0%, transparent 55%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          perspective: '380px',
          perspectiveOrigin: '50% 0%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-60% -30% 0',
            transform: 'rotateX(70deg)',
            transformOrigin: '50% 100%',
            backgroundImage:
              'linear-gradient(rgba(108,99,255,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,.16) 1px,transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 2,
          top: 0,
          background: 'linear-gradient(90deg,transparent,rgba(108,99,255,.5) 50%,transparent)',
          animation: 'scanH 7s linear infinite',
        }}
      />
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            width: 3,
            height: 3,
            borderRadius: '50%',
            left: `${(i * 41) % 100}%`,
            top: `${(i * 67) % 100}%`,
            background: i % 4 === 0 ? CYAN : VIOLET,
            boxShadow: `0 0 8px ${i % 4 === 0 ? CYAN : VIOLET}`,
            animation: `pulseGlow ${2.4 + (i % 5) * 0.3}s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   NAV CONFIG
══════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: '⌂', path: null, acc: '108,99,255' },
  { key: 'resumes', label: 'My Resumes', icon: '▤', path: '/resumes', acc: '0,212,255' },
  { key: 'jd', label: 'Job Analyzer', icon: '◎', path: '/job-description', acc: '167,139,250' },
  { key: 'match', label: 'Resume Matching', icon: '⇄', path: '/resume-jd-matching', acc: '0,212,255' },
  { key: 'apps', label: 'Applications', icon: '✓', path: '/applications', acc: '52,211,153' },
  { key: 'interview', label: 'Interview Prep', icon: '◉', path: '/interview-prep', acc: '245,158,11' },
]

const TOOLS = [
  {
    key: 'resumes',
    path: '/resumes',
    icon: '▤',
    acc: '0,212,255',
    color: CYAN,
    title: 'My Resumes',
    desc: 'Upload, view, analyze, and manage your resumes.',
    cta: 'Open Resumes',
  },
  {
    key: 'jd',
    path: '/job-description',
    icon: '◎',
    acc: '167,139,250',
    color: PURPLE,
    title: 'Job Description Analyzer',
    desc: 'Identify skills, qualifications, and keywords employers are looking for.',
    cta: 'Analyze Job Description',
  },
  {
    key: 'match',
    path: '/resume-jd-matching',
    icon: '⇄',
    acc: '0,212,255',
    color: CYAN,
    title: 'Resume ↔ JD Matching',
    desc: 'Compare your resume with a job description and discover your match score and skill gaps.',
    cta: 'Match Resume',
  },
  {
    key: 'apps',
    path: '/applications',
    icon: '✓',
    acc: '52,211,153',
    color: GREEN,
    title: 'Applications',
    desc: 'Keep track of your job applications and their current status.',
    cta: 'Open Applications',
  },
  {
    key: 'interview',
    path: '/interview-prep',
    icon: '◉',
    acc: '245,158,11',
    color: ORANGE,
    title: 'AI Interview Prep',
    desc: 'Practice realistic interviews with an AI interviewer using voice-based questions.',
    cta: 'Start Interview Prep',
  },
]

function DashboardPage() {
  const navigate = useNavigate()

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .dc-scope, .dc-scope * { box-sizing: border-box; }
    .dc-scope { font-family: ${SANS}; }
    .dc-scope ::-webkit-scrollbar { width: 4px; }
    .dc-scope ::-webkit-scrollbar-track { background: transparent; }
    .dc-scope ::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.3); border-radius: 4px; }

    @keyframes pulseGlow { 0%,100% { opacity:.55; transform:scale(1);} 50% { opacity:1; transform:scale(1.18);} }
    @keyframes shimmerX { 0% { background-position:-300% 0;} 100% { background-position:300% 0;} }
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
    @keyframes scanH { from { transform:translateY(-100%);} to { transform:translateY(100vh);} }
    @keyframes orbitY { from { transform: rotateY(0deg) rotateX(12deg);} to { transform: rotateY(360deg) rotateX(12deg);} }

    .dc-nav-item:hover { background: rgba(108,99,255,.12) !important; color:#c5c9e8 !important; }
    .dc-primary-btn:hover { transform: translateY(-2px); box-shadow: 0 18px 48px rgba(108,99,255,.55) !important; }
    .dc-ghost-btn:hover { border-color: rgba(108,99,255,.5) !important; background: rgba(108,99,255,.08) !important; color:#e8eaf6 !important; }

    @media (max-width: 1080px) {
      .dc-sidebar { display: none !important; }
    }
    @media (max-width: 900px) {
      .dc-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
      .dc-tool-grid { grid-template-columns: 1fr !important; }
    }
    @media (max-width: 620px) {
      .dc-stat-grid { grid-template-columns: 1fr !important; }
      .dc-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .dc-hero-title { font-size: clamp(1.8rem, 8vw, 2.4rem) !important; }
    }
  `

  return (
    <div
      className="dc-scope"
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: INK,
        color: TEXT,
        overflowX: 'hidden',
      }}
    >
      <style>{css}</style>
      <GridBg />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', minHeight: '100vh' }}>
        {/* ═══════════ SIDEBAR ═══════════ */}
        <aside
          className="dc-sidebar"
          style={{
            width: 264,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(108,99,255,.14)',
            background: 'rgba(3,4,14,.6)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div style={{ padding: '26px 22px', borderBottom: '1px solid rgba(108,99,255,.14)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 20px rgba(108,99,255,.5)`,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <polygon points="10,2 18,7 18,13 10,18 2,13 2,7" stroke="white" strokeWidth="1.6" fill="none" />
                  <circle cx="10" cy="10" r="2.6" fill="white" opacity=".85" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '.02em' }}>
                  CareerCraft <span style={{ color: CYAN }}>AI</span>
                </div>
                <div style={{ fontSize: 10, fontFamily: MONO, color: MUTE, marginTop: 2 }}>
                  AI CAREER ASSISTANT
                </div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '22px 16px', overflowY: 'auto' }}>
            <p style={{ padding: '0 10px', fontSize: 10, fontFamily: MONO, letterSpacing: '.16em', color: '#4c5080', textTransform: 'uppercase' }}>
              Workspace
            </p>

            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {NAV_ITEMS.map(item => {
                const active = item.key === 'dashboard'
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => item.path && navigate(item.path)}
                    className="dc-nav-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      borderRadius: 12,
                      padding: '11px 12px',
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all .2s',
                      background: active ? `linear-gradient(135deg, rgba(108,99,255,.25), rgba(0,212,255,.12))` : 'transparent',
                      border: active ? '1px solid rgba(108,99,255,.4)' : '1px solid transparent',
                      color: active ? '#c9cdf0' : MUTE_2,
                      boxShadow: active ? '0 0 24px rgba(108,99,255,.15)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 16, color: active ? CYAN : undefined }}>{item.icon}</span>
                    {item.label}
                  </button>
                )
              })}
            </div>

            <p
              style={{
                marginTop: 30,
                padding: '0 10px',
                fontSize: 10,
                fontFamily: MONO,
                letterSpacing: '.16em',
                color: '#4c5080',
                textTransform: 'uppercase',
              }}
            >
              Coming Soon
            </p>

            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { icon: '↗', label: 'Career Growth' },
                { icon: '○', label: 'Profile' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 12,
                    padding: '11px 12px',
                    fontSize: 13,
                    color: '#4c5080',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </nav>

          <div style={{ padding: 16, borderTop: '1px solid rgba(108,99,255,.14)' }}>
            <div
              style={{
                borderRadius: 14,
                border: '1px solid rgba(108,99,255,.16)',
                background: 'rgba(108,99,255,.06)',
                padding: 16,
              }}
            >
              <p style={{ fontSize: 11, fontFamily: MONO, color: PURPLE, letterSpacing: '.06em' }}>CAREERCRAFT AI</p>
              <p style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: MUTE }}>
                Your career, organized in one place.
              </p>
            </div>
          </div>
        </aside>

        {/* ═══════════ MAIN ═══════════ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Top header */}
          <header
            className="dc-pad"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              borderBottom: '1px solid rgba(108,99,255,.14)',
              background: 'rgba(3,4,14,.85)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 32px',
              }}
            >
              <p style={{ fontSize: 12, fontFamily: MONO, letterSpacing: '.12em', color: MUTE }}>
                CAREER DASHBOARD
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: GREEN,
                      boxShadow: `0 0 10px ${GREEN}`,
                      animation: 'pulseGlow 2s infinite',
                    }}
                  />
                  <span style={{ fontSize: 11, fontFamily: MONO, color: MUTE }}>LIVE</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/resumes')}
                  className="dc-primary-btn"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 11,
                    fontSize: 13,
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: `0 10px 30px rgba(108,99,255,.4)`,
                    transition: 'all .2s',
                  }}
                >
                  My Resumes
                </button>
              </div>
            </div>
          </header>

          <main className="dc-pad" style={{ flex: 1, padding: '32px' }}>
            <div style={{ maxWidth: 1180, margin: '0 auto' }}>
              {/* ═══════════ HERO ═══════════ */}
              <section
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 24,
                  border: '1px solid rgba(108,99,255,.18)',
                  background: `linear-gradient(150deg, rgba(108,99,255,.12), rgba(13,15,31,1) 60%, rgba(0,212,255,.04))`,
                  padding: '40px 36px',
                  animation: 'fadeUp .6s both',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: -80,
                    top: -80,
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    border: '1px solid rgba(108,99,255,.18)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: -30,
                    bottom: -140,
                    width: 320,
                    height: 320,
                    borderRadius: '50%',
                    border: '1px solid rgba(0,212,255,.1)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 40,
                    top: 40,
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(108,99,255,.14), transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                />

                <div style={{ position: 'relative', maxWidth: 620 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      borderRadius: 100,
                      border: '1px solid rgba(108,99,255,.3)',
                      background: 'rgba(108,99,255,.1)',
                      fontSize: 11,
                      fontFamily: MONO,
                      color: PURPLE,
                      marginBottom: 18,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: VIOLET }} />
                    AI CAREER WORKSPACE
                  </div>

                  <h2
                    className="dc-hero-title"
                    style={{ fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08 }}
                  >
                    Welcome to{' '}
                    <span
                      style={{
                        background: `linear-gradient(110deg, ${VIOLET}, ${CYAN})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      CareerCraft AI
                    </span>
                  </h2>

                  <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.75, color: MUTE, maxWidth: 520 }}>
                    Manage your resumes, analyze job descriptions, track applications,
                    and prepare for interviews from one intelligent workspace.
                  </p>

                  <div style={{ marginTop: 26, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => navigate('/resumes')}
                      className="dc-primary-btn"
                      style={{
                        padding: '13px 24px',
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: `0 12px 34px rgba(108,99,255,.4)`,
                        transition: 'all .2s',
                      }}
                    >
                      Manage Resumes →
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/job-description')}
                      className="dc-ghost-btn"
                      style={{
                        padding: '13px 24px',
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        background: 'rgba(255,255,255,.02)',
                        color: MUTE_2,
                        border: '1px solid rgba(108,99,255,.22)',
                        cursor: 'pointer',
                        transition: 'all .2s',
                      }}
                    >
                      Analyze a Job
                    </button>
                  </div>
                </div>
              </section>

              {/* ═══════════ STATS ═══════════ */}
              <section
                className="dc-stat-grid"
                style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}
              >
                {[
                  { label: 'Resume Tools', title: 'My Resumes', sub: 'Upload and analyze', code: '01', color: CYAN, acc: '0,212,255' },
                  { label: 'Job Analysis', title: 'JD Analyzer', sub: 'Find important keywords', code: '02', color: PURPLE, acc: '167,139,250' },
                  { label: 'Applications', title: 'Track Jobs', sub: 'Monitor application status', code: '03', color: GREEN, acc: '52,211,153' },
                  { label: 'Interview', title: 'AI Practice', sub: 'Prepare for interviews', code: '04', color: ORANGE, acc: '245,158,11' },
                ].map((s, i) => (
                  <TiltCard
                    key={s.label}
                    accent={s.acc}
                    style={{
                      borderRadius: 18,
                      padding: '20px 22px',
                      background: `linear-gradient(145deg, rgba(13,15,31,.96), rgba(${s.acc},.06))`,
                      animation: `fadeUp .6s ${i * 0.08}s both`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: MUTE_2 }}>{s.label}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: MONO,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: `rgba(${s.acc},.14)`,
                          color: s.color,
                        }}
                      >
                        {s.code}
                      </span>
                    </div>
                    <p style={{ marginTop: 16, fontSize: 22, fontWeight: 800, color: TEXT }}>{s.title}</p>
                    <p style={{ marginTop: 4, fontSize: 12, color: MUTE }}>{s.sub}</p>
                  </TiltCard>
                ))}
              </section>

              {/* ═══════════ TOOLS ═══════════ */}
              <section style={{ marginTop: 44 }}>
                <p style={{ fontSize: 11, fontFamily: MONO, letterSpacing: '.16em', color: VIOLET, marginBottom: 6 }}>
                  YOUR WORKSPACE
                </p>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>Career tools</h3>
                <p style={{ marginTop: 6, fontSize: 13, color: MUTE, marginBottom: 22 }}>
                  Everything you need to move your career forward.
                </p>

                <div className="dc-tool-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                  {TOOLS.map((tool, i) => (
                    <TiltCard
                      key={tool.key}
                      as="button"
                      accent={tool.acc}
                      onClick={() => navigate(tool.path)}
                      style={{
                        borderRadius: 20,
                        padding: '26px 24px',
                        background: `linear-gradient(145deg, rgba(13,15,31,.97), rgba(${tool.acc},.05))`,
                        animation: `fadeUp .6s ${i * 0.06}s both`,
                        display: 'block',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 13,
                            background: `rgba(${tool.acc},.14)`,
                            border: `1px solid rgba(${tool.acc},.3)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            color: tool.color,
                            boxShadow: `0 8px 24px rgba(${tool.acc},.2)`,
                          }}
                        >
                          {tool.icon}
                        </div>
                        <span style={{ color: '#4c5080', fontSize: 16 }}>→</span>
                      </div>

                      <h4 style={{ marginTop: 18, fontSize: 16, fontWeight: 700, color: TEXT }}>{tool.title}</h4>
                      <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: MUTE }}>{tool.desc}</p>

                      <div style={{ marginTop: 18, fontSize: 12, fontWeight: 700, color: tool.color }}>
                        {tool.cta}
                      </div>
                    </TiltCard>
                  ))}

                  {/* Coming soon cards */}
                  {[
                    { icon: '↗', title: 'Career Growth', desc: 'Get recommendations to improve your career profile and growth.' },
                    { icon: '○', title: 'Profile', desc: 'Manage your personal and professional information.' },
                  ].map(item => (
                    <div
                      key={item.title}
                      style={{
                        borderRadius: 20,
                        border: '1px dashed rgba(108,99,255,.22)',
                        background: 'rgba(255,255,255,.015)',
                        padding: '26px 24px',
                      }}
                    >
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 13,
                          background: 'rgba(255,255,255,.04)',
                          border: '1px solid rgba(255,255,255,.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          color: '#4c5080',
                        }}
                      >
                        {item.icon}
                      </div>

                      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: MUTE_2 }}>{item.title}</h4>
                        <span
                          style={{
                            borderRadius: 100,
                            padding: '2px 8px',
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '.08em',
                            textTransform: 'uppercase',
                            background: 'rgba(255,255,255,.06)',
                            color: '#4c5080',
                            fontFamily: MONO,
                          }}
                        >
                          Soon
                        </span>
                      </div>

                      <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: MUTE }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage