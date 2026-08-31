import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:5000/api'

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
const RED = '#ef4444'
const MONO = "'JetBrains Mono', monospace"
const SANS = "'Outfit', sans-serif"

/* ══════════════════════════════════════════════════════════
   TILT CARD — pointer-reactive 3D panel
══════════════════════════════════════════════════════════ */
function TiltCard({
  children,
  style = {},
  accent = '108,99,255',
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  accent?: string
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
      el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateZ(8px) scale(1.008)`
      el.style.boxShadow = `${-x * 24}px ${-y * 18}px 50px rgba(${accent},.2), 0 0 0 1px rgba(${accent},.3), inset 0 1px 0 rgba(255,255,255,.05)`
    })
  }

  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateZ(0) scale(1)'
    el.style.boxShadow = `0 14px 40px rgba(${accent},.12), 0 0 0 1px rgba(${accent},.1), inset 0 1px 0 rgba(255,255,255,.04)`
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transition: 'transform .4s cubic-bezier(.23,1,.32,1), box-shadow .4s ease',
        transformStyle: 'preserve-3d',
        boxShadow: `0 14px 40px rgba(${accent},.12), 0 0 0 1px rgba(${accent},.1), inset 0 1px 0 rgba(255,255,255,.04)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   HERO ORB — animated 3D wireframe sphere (smaller, ambient)
══════════════════════════════════════════════════════════ */
function HeroOrb() {
  return (
    <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[0, 0.8, 1.6].map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: '50%',
            border: '1px solid rgba(108,99,255,.5)',
            animation: `ringExpand 3.2s ${d}s ease-out infinite`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          width: 190,
          height: 190,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,.25) 0%, rgba(0,212,255,.08) 55%, transparent 75%)',
          filter: 'blur(16px)',
        }}
      />
      <div style={{ perspective: 600, perspectiveOrigin: '50% 50%' }}>
        <div style={{ width: 130, height: 130, position: 'relative', transformStyle: 'preserve-3d', animation: 'orbitY 14s linear infinite' }}>
          {[0, 30, 60, -30, -60].map((tilt, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `${i === 0 ? '2px' : '1px'} solid rgba(${i === 0 ? '108,99,255' : '0,212,255'},.${i === 0 ? 7 : 4})`,
                transform: `rotateX(${tilt}deg)`,
                boxShadow: i === 0 ? '0 0 20px rgba(108,99,255,.35)' : 'none',
              }}
            />
          ))}
          {[0, 60, 120].map((y, i) => (
            <div
              key={`lng-${i}`}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(167,139,250,.35)', transform: `rotateY(${y}deg)` }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '35%',
              width: '30%',
              height: '30%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #6c63ff, #00d4ff88)',
              boxShadow: '0 0 40px #6c63ff, 0 0 80px rgba(108,99,255,.5)',
              animation: 'pulseGlow 2.4s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   GRID FLOOR BACKGROUND
══════════════════════════════════════════════════════════ */
function GridBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 100% 60% at 50% -5%, rgba(108,99,255,.16) 0%, transparent 60%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 50% at 80% 90%, rgba(0,212,255,.07) 0%, transparent 55%)` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', perspective: '380px', perspectiveOrigin: '50% 0%', overflow: 'hidden' }}>
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
      {Array.from({ length: 20 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            width: 3,
            height: 3,
            borderRadius: '50%',
            left: `${(i * 43) % 100}%`,
            top: `${(i * 59) % 100}%`,
            background: i % 4 === 0 ? CYAN : VIOLET,
            boxShadow: `0 0 8px ${i % 4 === 0 ? CYAN : VIOLET}`,
            animation: `pulseGlow ${2.4 + (i % 5) * 0.3}s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Login failed',
        )
      }

      if (!data.token) {
        throw new Error(
          'Login succeeded but no token was returned',
        )
      }

      localStorage.setItem('token', data.token)

      navigate('/dashboard')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed',
      )
    } finally {
      setLoading(false)
    }
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .lp-scope, .lp-scope * { box-sizing: border-box; }
    .lp-scope { font-family: ${SANS}; }
    .lp-scope input::placeholder { color: #4c5080; }
    .lp-scope input { color-scheme: dark; }
    .lp-scope ::-webkit-scrollbar { width: 4px; }
    .lp-scope ::-webkit-scrollbar-track { background: transparent; }
    .lp-scope ::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.3); border-radius: 4px; }

    @keyframes orbitY { from { transform: rotateY(0deg) rotateX(12deg);} to { transform: rotateY(360deg) rotateX(12deg);} }
    @keyframes pulseGlow { 0%,100% { opacity:.55; transform:scale(1);} 50% { opacity:1; transform:scale(1.18);} }
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
    @keyframes scanH { from { transform:translateY(-100%);} to { transform:translateY(100vh);} }
    @keyframes ringExpand { 0% { transform:scale(.4); opacity:.9;} 100% { transform:scale(2.2); opacity:0;} }
    @keyframes spinRing { to { transform: rotate(360deg); } }

    .lp-input:hover { border-color: rgba(108,99,255,.35) !important; }
    .lp-input:focus { border-color: rgba(108,99,255,.65) !important; background: rgba(108,99,255,.06) !important; box-shadow: 0 0 0 4px rgba(108,99,255,.12) !important; }
    .lp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 18px 48px rgba(108,99,255,.55) !important; }
    .lp-submit:hover:not(:disabled) .lp-arrow { transform: translateX(4px); }
    .lp-back:hover { color: #e8eaf6 !important; }
    .lp-logo-btn:hover .lp-logo-box { box-shadow: 0 0 26px rgba(108,99,255,.6) !important; }

    @media (max-width: 980px) {
      .lp-left { display: none !important; }
    }
  `

  return (
    <div
      className="lp-scope"
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

      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }} className="lp-grid">
        <style>{`
          @media (max-width: 980px) {
            .lp-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* ═══════════ LEFT SIDE ═══════════ */}
        <div
          className="lp-left"
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 56px',
            borderRight: '1px solid rgba(108,99,255,.14)',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="lp-logo-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: 'fit-content',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <div
              className="lp-logo-box"
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 20px rgba(108,99,255,.5)`,
                transition: 'box-shadow .25s ease',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <polygon points="10,2 18,7 18,13 10,18 2,13 2,7" stroke="white" strokeWidth="1.6" fill="none" />
                <circle cx="10" cy="10" r="2.6" fill="white" opacity=".85" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.02em', color: TEXT }}>CareerCraft AI</div>
              <div style={{ fontSize: 10, fontFamily: MONO, color: MUTE, marginTop: 2 }}>AI CAREER ASSISTANT</div>
            </div>
          </button>

          <div style={{ maxWidth: 520, animation: 'fadeUp .7s both' }}>
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
                marginBottom: 22,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN }} />
              YOUR CAREER, POWERED BY AI
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 4vw, 3.4rem)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                marginBottom: 20,
              }}
            >
              <span style={{ color: TEXT }}>Build a career</span>
              <br />
              <span
                style={{
                  background: `linear-gradient(110deg, ${VIOLET} 0%, ${CYAN} 55%, ${PURPLE} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                worth building.
              </span>
            </h1>

            <p style={{ color: MUTE, maxWidth: 440, lineHeight: 1.75, fontSize: '1rem', marginBottom: 34 }}>
              Analyze your resume, improve your profile, prepare for interviews,
              and discover opportunities with your personal AI career assistant.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 34 }}>
              <HeroOrb />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <TiltCard
                accent="0,212,255"
                style={{
                  borderRadius: 16,
                  padding: 16,
                  background: `linear-gradient(145deg, rgba(13,15,31,.96), rgba(0,212,255,.05))`,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    marginBottom: 12,
                    background: 'rgba(0,212,255,.14)',
                    border: '1px solid rgba(0,212,255,.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: CYAN,
                    fontSize: 15,
                  }}
                >
                  ✓
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Resume Analysis</p>
                <p style={{ marginTop: 4, fontSize: 11, lineHeight: 1.55, color: MUTE }}>
                  Get actionable insights and ATS scores.
                </p>
              </TiltCard>

              <TiltCard
                accent="167,139,250"
                style={{
                  borderRadius: 16,
                  padding: 16,
                  background: `linear-gradient(145deg, rgba(13,15,31,.96), rgba(167,139,250,.05))`,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    marginBottom: 12,
                    background: 'rgba(167,139,250,.14)',
                    border: '1px solid rgba(167,139,250,.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: PURPLE,
                    fontSize: 15,
                  }}
                >
                  ✦
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>AI Interview Prep</p>
                <p style={{ marginTop: 4, fontSize: 11, lineHeight: 1.55, color: MUTE }}>
                  Practice interviews with intelligent feedback.
                </p>
              </TiltCard>
            </div>
          </div>

          <p style={{ fontSize: 11, fontFamily: MONO, color: '#4c5080' }}>© CareerCraft AI</p>
        </div>

        {/* ═══════════ RIGHT SIDE (FORM) ═══════════ */}
        <main
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 400 }}>
            {/* Mobile logo */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="lp-left"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: 12,
                marginBottom: 40,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <polygon points="10,2 18,7 18,13 10,18 2,13 2,7" stroke="white" strokeWidth="1.6" fill="none" />
                  <circle cx="10" cy="10" r="2.6" fill="white" opacity=".85" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>CareerCraft AI</div>
                <div style={{ fontSize: 10, color: MUTE }}>AI Career Assistant</div>
              </div>
            </button>

            <TiltCard
              accent="108,99,255"
              style={{
                borderRadius: 24,
                padding: '36px 32px',
                background: `linear-gradient(160deg, rgba(13,15,31,.98), rgba(108,99,255,.05))`,
                animation: 'fadeUp .6s both',
              }}
            >
              {/* Header */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  marginBottom: 20,
                  background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'white',
                  boxShadow: `0 10px 28px rgba(108,99,255,.4)`,
                }}
              >
                →
              </div>

              <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>Welcome back</h2>
              <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: MUTE }}>
                Sign in to continue building your career with CareerCraft AI.
              </p>

              {/* Error */}
              {error && (
                <div
                  style={{
                    marginTop: 22,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    borderRadius: 14,
                    border: '1px solid rgba(239,68,68,.3)',
                    background: 'rgba(239,68,68,.08)',
                    padding: '13px 15px',
                    fontSize: 13,
                    color: '#fca5a5',
                  }}
                >
                  <span
                    style={{
                      marginTop: 1,
                      width: 18,
                      height: 18,
                      flexShrink: 0,
                      borderRadius: '50%',
                      background: 'rgba(239,68,68,.16)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: RED,
                    }}
                  >
                    !
                  </span>
                  <p style={{ lineHeight: 1.5 }}>{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label
                    htmlFor="email"
                    style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: MUTE_2 }}
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="lp-input"
                    style={{
                      height: 46,
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,.1)',
                      background: 'rgba(255,255,255,.03)',
                      padding: '0 16px',
                      fontSize: 13,
                      color: TEXT,
                      outline: 'none',
                      transition: 'all .2s',
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: MUTE_2 }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="lp-input"
                    style={{
                      height: 46,
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,.1)',
                      background: 'rgba(255,255,255,.03)',
                      padding: '0 16px',
                      fontSize: 13,
                      color: TEXT,
                      outline: 'none',
                      transition: 'all .2s',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="lp-submit"
                  style={{
                    marginTop: 6,
                    height: 48,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                    color: 'white',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    boxShadow: `0 12px 34px rgba(108,99,255,.4)`,
                    transition: 'all .2s',
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          width: 15,
                          height: 15,
                          borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,.3)',
                          borderTopColor: 'white',
                          animation: 'spinRing .8s linear infinite',
                        }}
                      />
                      Logging in…
                    </>
                  ) : (
                    <>
                      Log in
                      <span className="lp-arrow" style={{ transition: 'transform .2s' }}>→</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
                <span style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '.14em', color: '#4c5080', textTransform: 'uppercase' }}>
                  Secure access
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
              </div>

              {/* Security message */}
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,.08)',
                  background: 'rgba(255,255,255,.025)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      borderRadius: 10,
                      background: 'rgba(108,99,255,.1)',
                      border: '1px solid rgba(108,99,255,.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                    }}
                  >
                    🔒
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#c9cdf0' }}>Your account is secure</p>
                    <p style={{ marginTop: 4, fontSize: 11, lineHeight: 1.6, color: MUTE }}>
                      Your career profile and resume data are protected by your
                      authenticated account.
                    </p>
                  </div>
                </div>
              </div>

              {/* Back */}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="lp-back"
                style={{
                  marginTop: 22,
                  width: '100%',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 500,
                  color: MUTE,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color .2s',
                }}
              >
                ← Back to home
              </button>
            </TiltCard>
          </div>
        </main>
      </div>
    </div>
  )
}

export default LoginPage