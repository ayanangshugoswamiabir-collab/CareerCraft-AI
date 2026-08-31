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
   HERO ORB — animated 3D wireframe sphere
══════════════════════════════════════════════════════════ */
function HeroOrb() {
  return (
    <div
      style={{
        position: 'relative',
        width: 300,
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {[0, 0.8, 1.6].map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 210,
            height: 210,
            borderRadius: '50%',
            border: '1px solid rgba(108,99,255,.5)',
            animation: `ringExpand 3.2s ${d}s ease-out infinite`,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,.25) 0%, rgba(0,212,255,.08) 55%, transparent 75%)',
          filter: 'blur(18px)',
        }}
      />

      <div style={{ perspective: 600, perspectiveOrigin: '50% 50%' }}>
        <div
          style={{
            width: 172,
            height: 172,
            position: 'relative',
            transformStyle: 'preserve-3d',
            animation: 'orbitY 14s linear infinite',
          }}
        >
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
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '1px solid rgba(167,139,250,.35)',
                transform: `rotateY(${y}deg)`,
              }}
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 100% 60% at 50% -5%, rgba(108,99,255,.18) 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 80% 85%, rgba(0,212,255,.08) 0%, transparent 55%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '55%',
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
              'linear-gradient(rgba(108,99,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,.18) 1px,transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '35%',
            background: 'linear-gradient(to bottom, rgba(108,99,255,.14), transparent)',
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
      {Array.from({ length: 26 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            width: 3,
            height: 3,
            borderRadius: '50%',
            left: `${(i * 37) % 100}%`,
            top: `${(i * 61) % 100}%`,
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
   PILLARS — what CareerCraft AI covers
══════════════════════════════════════════════════════════ */
const PILLARS = [
  { icon: '▤', title: 'Resumes', desc: 'Upload and get AI-scored ATS feedback in seconds.', color: CYAN, acc: '0,212,255' },
  { icon: '⇄', title: 'Job Matching', desc: 'See exactly how your resume stacks up against a role.', color: PURPLE, acc: '167,139,250' },
  { icon: '✓', title: 'Applications', desc: 'Track every application from applied to offer.', color: GREEN, acc: '52,211,153' },
  { icon: '◉', title: 'Interviews', desc: 'Practice with an AI interviewer before the real thing.', color: ORANGE, acc: '245,158,11' },
  { icon: '↗', title: 'Career Growth', desc: 'Personalized guidance to keep moving forward.', color: RED, acc: '239,68,68' },
]

function HomePage() {
  const navigate = useNavigate()

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .hp-scope, .hp-scope * { box-sizing: border-box; }
    .hp-scope { font-family: ${SANS}; }
    .hp-scope ::-webkit-scrollbar { width: 4px; }
    .hp-scope ::-webkit-scrollbar-track { background: transparent; }
    .hp-scope ::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.3); border-radius: 4px; }

    @keyframes orbitY { from { transform: rotateY(0deg) rotateX(12deg);} to { transform: rotateY(360deg) rotateX(12deg);} }
    @keyframes pulseGlow { 0%,100% { opacity:.55; transform:scale(1);} 50% { opacity:1; transform:scale(1.18);} }
    @keyframes shimmerX { 0% { background-position:-300% 0;} 100% { background-position:300% 0;} }
    @keyframes fadeUp { from { opacity:0; transform:translateY(22px);} to { opacity:1; transform:translateY(0);} }
    @keyframes scanH { from { transform:translateY(-100%);} to { transform:translateY(100vh);} }
    @keyframes ringExpand { 0% { transform:scale(.4); opacity:.9;} 100% { transform:scale(2.2); opacity:0;} }

    .hp-cta:hover { transform: translateY(-2px); box-shadow: 0 18px 50px rgba(108,99,255,.6) !important; }

    @media (max-width: 980px) {
      .hp-hero-grid { grid-template-columns: 1fr !important; }
      .hp-hero-orb { display: none !important; }
      .hp-pillar-grid { grid-template-columns: repeat(2,1fr) !important; }
    }
    @media (max-width: 620px) {
      .hp-pillar-grid { grid-template-columns: 1fr !important; }
      .hp-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .hp-hero-title { font-size: clamp(2.2rem, 9vw, 3rem) !important; }
      .hp-panel { padding: 32px 22px !important; }
    }
  `

  return (
    <div
      className="hp-scope"
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

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ═══════════ HEADER ═══════════ */}
        <header
          className="hp-pad"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderBottom: '1px solid rgba(108,99,255,.14)',
            background: 'rgba(3,4,14,.85)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              padding: '0 32px',
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  background: `linear-gradient(135deg, ${VIOLET}, ${CYAN})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 20px rgba(108,99,255,.5)`,
                  flexShrink: 0,
                }}
              >
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                  <polygon points="10,2 18,7 18,13 10,18 2,13 2,7" stroke="white" strokeWidth="1.6" fill="none" />
                  <circle cx="10" cy="10" r="2.6" fill="white" opacity=".85" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '.02em' }}>CareerCraft AI</div>
                <div style={{ fontSize: 10, fontFamily: MONO, color: MUTE }}>AI CAREER ASSISTANT</div>
              </div>
            </div>

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
              <span style={{ fontSize: 11, fontFamily: MONO, color: MUTE }}>SYSTEM ONLINE</span>
            </div>
          </div>
        </header>

        <main className="hp-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
          {/* ═══════════ HERO PANEL ═══════════ */}
          <section style={{ paddingTop: 64, paddingBottom: 64 }}>
            <TiltCard
              accent="108,99,255"
              style={{
                borderRadius: 28,
                overflow: 'hidden',
                background: `linear-gradient(150deg, rgba(108,99,255,.12), rgba(13,15,31,1) 55%, rgba(0,212,255,.05))`,
              }}
            >
              <div
                className="hp-hero-grid hp-panel"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 340px',
                  gap: 40,
                  alignItems: 'center',
                  padding: '56px 52px',
                  animation: 'fadeUp .7s both',
                }}
              >
                <div>
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
                      marginBottom: 20,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: VIOLET }} />
                    PHASE 1
                  </div>

                  <h2
                    className="hp-hero-title"
                    style={{
                      fontSize: 'clamp(2.6rem, 5vw, 3.8rem)',
                      fontWeight: 900,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.02,
                      marginBottom: 20,
                    }}
                  >
                    <span style={{ color: TEXT }}>Career</span>
                    <span
                      style={{
                        background: `linear-gradient(110deg, ${VIOLET} 0%, ${CYAN} 55%, ${PURPLE} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Craft AI
                    </span>
                  </h2>

                  <p style={{ color: MUTE, maxWidth: 480, lineHeight: 1.75, fontSize: '1.02rem', marginBottom: 32 }}>
                    Your AI-powered career assistant for resumes, job matching,
                    applications, interviews, and career growth.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="hp-cta"
                    style={{
                      padding: '15px 32px',
                      borderRadius: 13,
                      fontSize: 14,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: `0 12px 40px rgba(108,99,255,.45)`,
                      transition: 'all .2s',
                    }}
                  >
                    Get Started
                  </button>
                </div>

                <div className="hp-hero-orb" style={{ display: 'flex', justifyContent: 'center' }}>
                  <HeroOrb />
                </div>
              </div>
            </TiltCard>
          </section>

          {/* ═══════════ PILLARS ═══════════ */}
          <section style={{ paddingBottom: 88 }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <p style={{ fontSize: 11, fontFamily: MONO, letterSpacing: '.16em', color: VIOLET, marginBottom: 10 }}>
                ONE WORKSPACE
              </p>
              <h3 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', color: TEXT }}>
                Everything your job search needs
              </h3>
            </div>

            <div className="hp-pillar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
              {PILLARS.map((p, i) => (
                <TiltCard
                  key={p.title}
                  accent={p.acc}
                  style={{
                    borderRadius: 18,
                    padding: '24px 18px',
                    background: `linear-gradient(145deg, rgba(13,15,31,.97), rgba(${p.acc},.05))`,
                    animation: `fadeUp .6s ${i * 0.07}s both`,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      marginBottom: 14,
                      background: `rgba(${p.acc},.14)`,
                      border: `1px solid rgba(${p.acc},.3)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: p.color,
                      boxShadow: `0 8px 22px rgba(${p.acc},.2)`,
                    }}
                  >
                    {p.icon}
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 6 }}>{p.title}</h4>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: MUTE }}>{p.desc}</p>
                </TiltCard>
              ))}
            </div>
          </section>
        </main>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer
          className="hp-pad"
          style={{
            borderTop: '1px solid rgba(108,99,255,.1)',
            background: 'rgba(3,4,14,.7)',
            padding: '22px 32px',
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: '0 auto',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.04em', color: TEXT }}>CareerCraft AI</span>
            <span style={{ fontSize: 11, fontFamily: MONO, color: MUTE }}>Phase 1</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, fontFamily: MONO, color: MUTE }}>AI Career Assistant</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default HomePage