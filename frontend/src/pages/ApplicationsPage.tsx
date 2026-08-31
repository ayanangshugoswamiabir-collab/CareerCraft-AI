import { FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:5000/api'

interface Application {
  _id: string
  userId?: string
  resumeId?: string
  company: string
  jobTitle: string
  jobDescription?: string
  jobUrl?: string
  status: string
  appliedAt?: string
  appliedDate?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface ApplicationsResponse {
  success?: boolean
  message?: string
  data?: Application[]
  applications?: Application[]
}

interface ApplicationResponse {
  success?: boolean
  message?: string
  data?: Application
  application?: Application
}

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS
   Dark spatial theme — matches the CareerCraft "AXIOM" system.
══════════════════════════════════════════════════════════ */
const STATUS_STYLES: Record<string, { color: string; glow: string }> = {
  applied: { color: '#60a5fa', glow: 'rgba(96,165,250,.16)' },
  screening: { color: '#f59e0b', glow: 'rgba(245,158,11,.16)' },
  interview: { color: '#a78bfa', glow: 'rgba(167,139,250,.16)' },
  offer: { color: '#34d399', glow: 'rgba(52,211,153,.16)' },
  rejected: { color: '#ef4444', glow: 'rgba(239,68,68,.16)' },
  withdrawn: { color: '#9da0c4', glow: 'rgba(157,160,196,.14)' },
}

function getStatusStyle(status: string) {
  return (
    STATUS_STYLES[status.toLowerCase()] || {
      color: '#9da0c4',
      glow: 'rgba(157,160,196,.14)',
    }
  )
}

/* ══════════════════════════════════════════════════════════
   TILT CARD — subtle 3D hover, borrowed from the AXIOM kit
══════════════════════════════════════════════════════════ */
function TiltCard({
  children,
  className = '',
  style = {},
  accent = '108,99,255',
}: {
  children: React.ReactNode
  className?: string
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
      el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 7}deg) translateZ(8px)`
      el.style.boxShadow = `${-x * 24}px ${-y * 18}px 48px rgba(${accent},.2), 0 0 0 1px rgba(${accent},.3), inset 0 1px 0 rgba(255,255,255,.05)`
    })
  }

  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateZ(0)'
    el.style.boxShadow = `0 12px 32px rgba(${accent},.1), 0 0 0 1px rgba(${accent},.12), inset 0 1px 0 rgba(255,255,255,.04)`
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{
        transition: 'transform .35s cubic-bezier(.23,1,.32,1), box-shadow .35s ease',
        transformStyle: 'preserve-3d',
        boxShadow: `0 12px 32px rgba(${accent},.1), 0 0 0 1px rgba(${accent},.12), inset 0 1px 0 rgba(255,255,255,.04)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function ApplicationsPage() {
  const navigate = useNavigate()

  const [applications, setApplications] = useState<Application[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const [showForm, setShowForm] = useState(false)

  /*
   * null = creating a new application
   * ID = editing an existing application
   */
  const [editingId, setEditingId] = useState<string | null>(null)

  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [status, setStatus] = useState('Applied')
  const [appliedAt, setAppliedAt] = useState('')
  const [notes, setNotes] = useState('')

  /*
   * =========================================================
   * GET TOKEN
   * =========================================================
   */

  const getToken = (): string | null => {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('jwt')
    )
  }

  /*
   * =========================================================
   * AUTH HEADERS
   * =========================================================
   */

  const getAuthHeaders = (): Record<string, string> => {
    const token = getToken()

    if (!token) {
      return {}
    }

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  /*
   * =========================================================
   * LOAD APPLICATIONS
   * GET /api/applications
   * =========================================================
   */

  const loadApplications = async (): Promise<void> => {
    try {
      setLoading(true)
      setError('')

      const token = getToken()

      if (!token) {
        setError('You are not logged in. Please log in again.')
        return
      }

      const response = await fetch(`${API_URL}/applications`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      })

      const data = (await response.json()) as ApplicationsResponse

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('authToken')
        localStorage.removeItem('jwt')

        setError('Your login session is no longer valid. Please log in again.')

        return
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load applications.')
      }

      const list = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.applications)
          ? data.applications
          : []

      setApplications(list)
    } catch (err: unknown) {
      console.error('Load applications error:', err)

      if (err instanceof Error) {
        setError(err.message || 'Unable to load applications.')
      } else {
        setError('Unable to load applications.')
      }
    } finally {
      setLoading(false)
    }
  }

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {
    void loadApplications()
  }, [])

  /*
   * =========================================================
   * RESET FORM
   * =========================================================
   */

  const resetForm = (): void => {
    setEditingId(null)

    setJobTitle('')
    setCompany('')
    setJobDescription('')
    setJobUrl('')
    setStatus('Applied')
    setAppliedAt('')
    setNotes('')

    setFormError('')
  }

  /*
   * =========================================================
   * OPEN CREATE FORM
   * =========================================================
   */

  const openCreateForm = (): void => {
    resetForm()
    setFormError('')
    setShowForm(true)
  }

  /*
   * =========================================================
   * OPEN EDIT FORM
   * =========================================================
   */

  const openEditForm = (application: Application): void => {
    setEditingId(application._id)

    setJobTitle(application.jobTitle || '')

    setCompany(application.company || '')

    setJobDescription(application.jobDescription || '')

    setJobUrl(application.jobUrl || '')

    setStatus(application.status || 'Applied')

    if (application.appliedAt) {
      const date = new Date(application.appliedAt)

      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear()

        const month = String(date.getMonth() + 1).padStart(2, '0')

        const day = String(date.getDate()).padStart(2, '0')

        setAppliedAt(`${year}-${month}-${day}`)
      } else {
        setAppliedAt('')
      }
    } else if (application.appliedDate) {
      const date = new Date(application.appliedDate)

      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear()

        const month = String(date.getMonth() + 1).padStart(2, '0')

        const day = String(date.getDate()).padStart(2, '0')

        setAppliedAt(`${year}-${month}-${day}`)
      } else {
        setAppliedAt('')
      }
    } else {
      setAppliedAt('')
    }

    setNotes(application.notes || '')

    setFormError('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /*
   * =========================================================
   * CREATE APPLICATION
   * POST /api/applications
   * =========================================================
   */

  const handleCreateApplication = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault()

    try {
      setSaving(true)
      setFormError('')
      setError('')

      const token = getToken()

      if (!token) {
        setFormError('You are not logged in. Please log in again.')
        return
      }

      if (!jobTitle.trim()) {
        setFormError('Job title is required.')
        return
      }

      if (!company.trim()) {
        setFormError('Company name is required.')
        return
      }

      const response = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          jobDescription: jobDescription.trim() || undefined,
          jobUrl: jobUrl.trim() || undefined,
          status,
          appliedAt: appliedAt
            ? new Date(`${appliedAt}T00:00:00`).toISOString()
            : undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = (await response.json()) as ApplicationResponse

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('authToken')
        localStorage.removeItem('jwt')

        setFormError('Your login session is no longer valid. Please log in again.')

        return
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create application.')
      }

      const newApplication = data.data || data.application

      if (newApplication) {
        setApplications((current) => [newApplication, ...current])
      } else {
        await loadApplications()
      }

      resetForm()
      setShowForm(false)
    } catch (err: unknown) {
      console.error('Create application error:', err)

      if (err instanceof Error) {
        setFormError(err.message || 'Failed to create application.')
      } else {
        setFormError('Failed to create application.')
      }
    } finally {
      setSaving(false)
    }
  }

  /*
   * =========================================================
   * UPDATE APPLICATION
   * PATCH /api/applications/:id
   * =========================================================
   */

  const handleUpdateApplication = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault()

    if (!editingId) {
      return
    }

    try {
      setSaving(true)
      setFormError('')
      setError('')

      const token = getToken()

      if (!token) {
        setFormError('You are not logged in. Please log in again.')
        return
      }

      if (!jobTitle.trim()) {
        setFormError('Job title is required.')
        return
      }

      if (!company.trim()) {
        setFormError('Company name is required.')
        return
      }

      const response = await fetch(`${API_URL}/applications/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          company: company.trim(),
          jobDescription: jobDescription.trim(),
          jobUrl: jobUrl.trim(),
          status,
          appliedAt: appliedAt
            ? new Date(`${appliedAt}T00:00:00`).toISOString()
            : undefined,
          notes: notes.trim(),
        }),
      })

      const data = (await response.json()) as ApplicationResponse

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('authToken')
        localStorage.removeItem('jwt')

        setFormError('Your login session is no longer valid. Please log in again.')

        return
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update application.')
      }

      const updatedApplication = data.data || data.application

      if (updatedApplication) {
        setApplications((current) =>
          current.map((application) =>
            application._id === editingId ? updatedApplication : application,
          ),
        )
      } else {
        await loadApplications()
      }

      resetForm()
      setShowForm(false)
    } catch (err: unknown) {
      console.error('Update application error:', err)

      if (err instanceof Error) {
        setFormError(err.message || 'Failed to update application.')
      } else {
        setFormError('Failed to update application.')
      }
    } finally {
      setSaving(false)
    }
  }

  /*
   * =========================================================
   * FORM SUBMIT
   * =========================================================
   */

  const handleFormSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    if (editingId) {
      await handleUpdateApplication(event)
    } else {
      await handleCreateApplication(event)
    }
  }

  /*
   * =========================================================
   * DELETE APPLICATION
   * DELETE /api/applications/:id
   * =========================================================
   */

  const handleDeleteApplication = async (id: string): Promise<void> => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this application?',
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(id)
      setError('')

      const token = getToken()

      if (!token) {
        setError('You are not logged in. Please log in again.')
        return
      }

      const response = await fetch(`${API_URL}/applications/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      })

      const data = (await response.json()) as {
        success?: boolean
        message?: string
      }

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('authToken')
        localStorage.removeItem('jwt')

        setError('Your login session is no longer valid. Please log in again.')

        return
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete application.')
      }

      setApplications((current) =>
        current.filter((application) => application._id !== id),
      )

      if (editingId === id) {
        resetForm()
        setShowForm(false)
      }
    } catch (err: unknown) {
      console.error('Delete application error:', err)

      if (err instanceof Error) {
        setError(err.message || 'Failed to delete application.')
      } else {
        setError('Failed to delete application.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  /*
   * =========================================================
   * FORMAT DATE
   * =========================================================
   */

  const formatDate = (date?: string): string => {
    if (!date) {
      return 'Not specified'
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Not specified'
    }

    return parsedDate.toLocaleDateString('en-GB')
  }

  /*
   * =========================================================
   * PAGE — dark spatial theme
   * =========================================================
   */

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .cc-page, .cc-page * { box-sizing: border-box; }
    .cc-page { font-family: 'Outfit', sans-serif; }
    .cc-mono { font-family: 'JetBrains Mono', monospace; }

    @keyframes cc-pulse { 0%,100% { opacity:.55; transform:scale(1); } 50% { opacity:1; transform:scale(1.25); } }
    @keyframes cc-spin { to { transform: rotate(360deg); } }
    @keyframes cc-fade-up { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }

    .cc-input, .cc-select, .cc-textarea {
      width: 100%; padding: 12px 14px; border-radius: 10px;
      background: rgba(255,255,255,.03);
      border: 1px solid rgba(108,99,255,.22);
      color: #e8eaf6; font-family: 'Outfit', sans-serif; font-size: 14px;
      outline: none; transition: border-color .2s, box-shadow .2s, background .2s;
    }
    .cc-input::placeholder, .cc-textarea::placeholder { color: #565a82; }
    .cc-input:focus, .cc-select:focus, .cc-textarea:focus {
      border-color: rgba(108,99,255,.6);
      box-shadow: 0 0 0 3px rgba(108,99,255,.14);
      background: rgba(108,99,255,.05);
    }
    .cc-select option { background: #0d0f1f; color: #e8eaf6; }

    .cc-btn-primary {
      background: linear-gradient(135deg,#6c63ff,#00a8e8);
      color: #fff; border: none; border-radius: 10px;
      font-weight: 600; cursor: pointer; transition: transform .15s, box-shadow .2s;
      box-shadow: 0 8px 24px rgba(108,99,255,.32);
    }
    .cc-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(108,99,255,.45); }
    .cc-btn-primary:disabled { opacity:.55; cursor:not-allowed; transform:none; }

    .cc-btn-ghost {
      background: rgba(255,255,255,.03); color: #c5c9e8;
      border: 1px solid rgba(108,99,255,.25); border-radius: 10px;
      font-weight: 600; cursor: pointer; transition: all .18s;
    }
    .cc-btn-ghost:hover { border-color: rgba(108,99,255,.55); background: rgba(108,99,255,.1); }

    .cc-btn-danger {
      background: transparent; color: #f87171; border: none;
      border-radius: 10px; font-weight: 600; cursor: pointer; transition: background .18s;
    }
    .cc-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,.12); }
    .cc-btn-danger:disabled { opacity:.5; cursor:not-allowed; }

    .cc-link {
      color: #7dd3fc; font-weight: 600; text-decoration: none;
      border-radius: 10px; padding: 8px 12px; transition: background .18s;
    }
    .cc-link:hover { background: rgba(0,212,255,.1); }

    .cc-card { animation: cc-fade-up .5s ease both; }

    @media (max-width: 860px) {
      .cc-form-grid { grid-template-columns: 1fr !important; }
      .cc-cards-grid { grid-template-columns: 1fr !important; }
      .cc-title-row { flex-direction: column !important; align-items: flex-start !important; }
    }
    @media (min-width: 861px) and (max-width: 1180px) {
      .cc-cards-grid { grid-template-columns: repeat(2,1fr) !important; }
    }
  `

  return (
    <div
      className="cc-page"
      style={{
        minHeight: '100vh',
        background: '#03040e',
        color: '#e8eaf6',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <style>{css}</style>

      {/* Ambient background glow */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(ellipse 90% 50% at 50% -8%, rgba(108,99,255,.18) 0%, transparent 62%), radial-gradient(ellipse 60% 45% at 85% 15%, rgba(0,212,255,.08) 0%, transparent 55%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* HEADER */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            height: 68,
            background: 'rgba(3,4,14,.88)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(108,99,255,.16)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                flexShrink: 0,
                background: 'linear-gradient(135deg,#6c63ff,#00d4ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(108,99,255,.5)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <polygon
                  points="10,2 18,7 18,13 10,18 2,13 2,7"
                  stroke="white"
                  strokeWidth="1.6"
                  fill="none"
                />
                <circle cx="10" cy="10" r="2.8" fill="white" opacity=".85" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '.02em' }}>
                CareerCraft AI
              </div>
              <div className="cc-mono" style={{ fontSize: 10, color: '#6b6f99' }}>
                JOB APPLICATIONS
              </div>
            </div>
          </div>

          <button type="button" onClick={() => navigate('/dashboard')} className="cc-btn-ghost" style={{ padding: '10px 18px', fontSize: 13.5 }}>
            ← Dashboard
          </button>
        </header>

        {/* MAIN */}
        <main style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 32px 64px' }}>
          {/* PAGE TITLE */}
          <div
            className="cc-title-row"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 20,
              marginBottom: 32,
            }}
          >
            <div>
              <div
                className="cc-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '.15em',
                  color: '#6c63ff',
                  marginBottom: 10,
                }}
              >
                CAREER MANAGEMENT
              </div>
              <h1
                style={{
                  fontSize: 'clamp(1.7rem,3vw,2.3rem)',
                  fontWeight: 800,
                  letterSpacing: '-.02em',
                  background: 'linear-gradient(110deg,#e8eaf6,#a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                }}
              >
                Job Applications
              </h1>
              <p style={{ marginTop: 10, maxWidth: 560, color: '#8a8ec0', fontSize: 14.5, lineHeight: 1.6 }}>
                Track your job applications, companies, positions, and application status in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (showForm) {
                  resetForm()
                  setShowForm(false)
                } else {
                  openCreateForm()
                }
              }}
              className="cc-btn-primary"
              style={{ padding: '13px 22px', fontSize: 14.5, whiteSpace: 'nowrap' }}
            >
              {showForm ? 'Cancel' : '+ Add Application'}
            </button>
          </div>

          {/* ERROR */}
          {!loading && error && (
            <TiltCard
              accent="239,68,68"
              style={{
                borderRadius: 18,
                padding: '22px 24px',
                marginBottom: 28,
                background: 'linear-gradient(155deg,rgba(13,15,31,.97),rgba(239,68,68,.06))',
              }}
            >
              <h3 style={{ margin: 0, fontWeight: 700, color: '#fca5a5', fontSize: 15 }}>
                Unable to load applications
              </h3>
              <p style={{ marginTop: 8, fontSize: 13.5, color: '#e0a7a7', lineHeight: 1.6 }}>{error}</p>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => void loadApplications()}
                  className="cc-btn-ghost"
                  style={{ padding: '10px 16px', fontSize: 13, borderColor: 'rgba(239,68,68,.35)', color: '#fca5a5' }}
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '10px 16px',
                    fontSize: 13,
                    borderRadius: 10,
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg,#ef4444,#f59e0b)',
                    color: '#fff',
                  }}
                >
                  Go to Login
                </button>
              </div>
            </TiltCard>
          )}

          {/* APPLICATION FORM */}
          {showForm && (
            <TiltCard
              accent="108,99,255"
              style={{
                borderRadius: 20,
                padding: 28,
                marginBottom: 32,
                background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(108,99,255,.05))',
              }}
            >
              <div style={{ marginBottom: 22 }}>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#e8eaf6' }}>
                  {editingId ? 'Edit Job Application' : 'Add Job Application'}
                </h3>
                <p style={{ marginTop: 6, fontSize: 13.5, color: '#8a8ec0' }}>
                  {editingId
                    ? 'Update the details of this job application.'
                    : 'Enter the details of the job application.'}
                </p>
              </div>

              {formError && (
                <div
                  style={{
                    marginBottom: 18,
                    borderRadius: 10,
                    border: '1px solid rgba(239,68,68,.35)',
                    background: 'rgba(239,68,68,.08)',
                    padding: '11px 14px',
                    fontSize: 13,
                    color: '#fca5a5',
                  }}
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="cc-form-grid" style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr' }}>
                {/* JOB TITLE */}
                <div>
                  <label htmlFor="jobTitle" style={{ display: 'block', marginBottom: 7, fontSize: 12.5, fontWeight: 600, color: '#9da0c4' }}>
                    Job Title *
                  </label>
                  <input
                    id="jobTitle"
                    type="text"
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                    placeholder="Software Engineer"
                    required
                    className="cc-input"
                  />
                </div>

                {/* COMPANY */}
                <div>
                  <label htmlFor="company" style={{ display: 'block', marginBottom: 7, fontSize: 12.5, fontWeight: 600, color: '#9da0c4' }}>
                    Company *
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Google"
                    required
                    className="cc-input"
                  />
                </div>

                {/* JOB URL */}
                <div>
                  <label htmlFor="jobUrl" style={{ display: 'block', marginBottom: 7, fontSize: 12.5, fontWeight: 600, color: '#9da0c4' }}>
                    Job URL
                  </label>
                  <input
                    id="jobUrl"
                    type="url"
                    value={jobUrl}
                    onChange={(event) => setJobUrl(event.target.value)}
                    placeholder="https://company.com/jobs/..."
                    className="cc-input"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label htmlFor="status" style={{ display: 'block', marginBottom: 7, fontSize: 12.5, fontWeight: 600, color: '#9da0c4' }}>
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="cc-select"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>

                {/* APPLICATION DATE */}
                <div>
                  <label htmlFor="appliedAt" style={{ display: 'block', marginBottom: 7, fontSize: 12.5, fontWeight: 600, color: '#9da0c4' }}>
                    Application Date
                  </label>
                  <input
                    id="appliedAt"
                    type="date"
                    value={appliedAt}
                    onChange={(event) => setAppliedAt(event.target.value)}
                    className="cc-input"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* JOB DESCRIPTION */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="jobDescription" style={{ display: 'block', marginBottom: 7, fontSize: 12.5, fontWeight: 600, color: '#9da0c4' }}>
                    Job Description
                  </label>
                  <textarea
                    id="jobDescription"
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    rows={5}
                    placeholder="Paste the job description here..."
                    className="cc-textarea"
                    style={{ resize: 'none' }}
                  />
                </div>

                {/* NOTES */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="notes" style={{ display: 'block', marginBottom: 7, fontSize: 12.5, fontWeight: 600, color: '#9da0c4' }}>
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Add notes about this application..."
                    className="cc-textarea"
                    style={{ resize: 'none' }}
                  />
                </div>

                {/* BUTTONS */}
                <div style={{ display: 'flex', gap: 12, gridColumn: '1 / -1' }}>
                  <button type="submit" disabled={saving} className="cc-btn-primary" style={{ padding: '13px 26px', fontSize: 14.5 }}>
                    {saving ? 'Saving...' : editingId ? 'Update Application' : 'Save Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm()
                      setShowForm(false)
                    }}
                    className="cc-btn-ghost"
                    style={{ padding: '13px 26px', fontSize: 14.5 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </TiltCard>
          )}

          {/* LOADING */}
          {loading && (
            <TiltCard
              style={{
                borderRadius: 20,
                padding: '56px 24px',
                textAlign: 'center',
                background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(108,99,255,.04))',
              }}
            >
              <div
                style={{
                  margin: '0 auto',
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  border: '3px solid rgba(108,99,255,.18)',
                  borderTopColor: '#6c63ff',
                  animation: 'cc-spin 0.9s linear infinite',
                }}
              />
              <p style={{ marginTop: 18, fontSize: 13.5, color: '#8a8ec0' }}>Loading your applications...</p>
            </TiltCard>
          )}

          {/* EMPTY STATE */}
          {!loading && !error && applications.length === 0 && (
            <TiltCard
              style={{
                borderRadius: 20,
                padding: '64px 24px',
                textAlign: 'center',
                background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(108,99,255,.05))',
              }}
            >
              <div
                style={{
                  margin: '0 auto',
                  width: 76,
                  height: 76,
                  borderRadius: 20,
                  background: 'rgba(108,99,255,.14)',
                  border: '1px solid rgba(108,99,255,.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 34,
                  boxShadow: '0 8px 24px rgba(108,99,255,.2)',
                }}
              >
                📝
              </div>

              <h3 style={{ marginTop: 20, fontSize: 19, fontWeight: 700, color: '#e8eaf6' }}>
                No applications yet
              </h3>

              <p style={{ margin: '10px auto 0', maxWidth: 380, fontSize: 13.5, lineHeight: 1.7, color: '#8a8ec0' }}>
                Start tracking your job applications by adding your first application.
              </p>

              <button type="button" onClick={openCreateForm} className="cc-btn-primary" style={{ marginTop: 24, padding: '13px 24px', fontSize: 14.5 }}>
                + Add Your First Application
              </button>
            </TiltCard>
          )}

          {/* APPLICATION LIST */}
          {!loading && !error && applications.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8eaf6' }}>Your Applications</h3>

                <span
                  className="cc-mono"
                  style={{
                    borderRadius: 999,
                    background: 'rgba(108,99,255,.14)',
                    border: '1px solid rgba(108,99,255,.3)',
                    padding: '5px 12px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#a78bfa',
                  }}
                >
                  {applications.length} {applications.length === 1 ? 'APPLICATION' : 'APPLICATIONS'}
                </span>
              </div>

              <div className="cc-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                {applications.map((application, i) => {
                  const applicationDate = application.appliedAt || application.appliedDate
                  const statusStyle = getStatusStyle(application.status)

                  return (
                    <TiltCard
                      key={application._id}
                      accent="108,99,255"
                      className="cc-card"
                      style={{
                        borderRadius: 18,
                        padding: 22,
                        background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(108,99,255,.04))',
                        animationDelay: `${Math.min(i, 8) * 0.05}s`,
                      }}
                    >
                      {/* CARD HEADER */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e8eaf6', wordBreak: 'break-word' }}>
                            {application.jobTitle}
                          </h3>
                          <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 500, color: '#8a8ec0', wordBreak: 'break-word' }}>
                            {application.company}
                          </p>
                        </div>

                        <span
                          style={{
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 999,
                            padding: '5px 11px',
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            color: statusStyle.color,
                            background: statusStyle.glow,
                            border: `1px solid ${statusStyle.color}40`,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: statusStyle.color,
                              boxShadow: `0 0 6px ${statusStyle.color}`,
                              animation: 'cc-pulse 2.2s ease-in-out infinite',
                            }}
                          />
                          {application.status}
                        </span>
                      </div>

                      {/* DATE */}
                      {applicationDate && (
                        <div
                          style={{
                            marginTop: 16,
                            borderRadius: 10,
                            background: 'rgba(255,255,255,.03)',
                            border: '1px solid rgba(108,99,255,.12)',
                            padding: '9px 12px',
                          }}
                        >
                          <p className="cc-mono" style={{ margin: 0, fontSize: 9.5, letterSpacing: '.08em', color: '#6b6f99' }}>
                            APPLIED
                          </p>
                          <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 600, color: '#c5c9e8' }}>
                            {formatDate(applicationDate)}
                          </p>
                        </div>
                      )}

                      {/* JOB DESCRIPTION */}
                      {application.jobDescription && (
                        <div style={{ marginTop: 14 }}>
                          <p className="cc-mono" style={{ margin: 0, fontSize: 9.5, letterSpacing: '.08em', color: '#6b6f99' }}>
                            JOB DESCRIPTION
                          </p>
                          <p
                            style={{
                              margin: '5px 0 0',
                              fontSize: 13,
                              lineHeight: 1.6,
                              color: '#a3a7d1',
                              display: '-webkit-box',
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {application.jobDescription}
                          </p>
                        </div>
                      )}

                      {/* NOTES */}
                      {application.notes && (
                        <div style={{ marginTop: 14 }}>
                          <p className="cc-mono" style={{ margin: 0, fontSize: 9.5, letterSpacing: '.08em', color: '#6b6f99' }}>
                            NOTES
                          </p>
                          <p style={{ margin: '5px 0 0', fontSize: 13, lineHeight: 1.6, color: '#a3a7d1' }}>
                            {application.notes}
                          </p>
                        </div>
                      )}

                      {/* ACTIONS */}
                      <div
                        style={{
                          marginTop: 20,
                          paddingTop: 16,
                          borderTop: '1px solid rgba(108,99,255,.14)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {application.jobUrl ? (
                            <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="cc-link" style={{ fontSize: 13 }}>
                              View Job →
                            </a>
                          ) : (
                            <span style={{ padding: '8px 12px', fontSize: 13, color: '#565a82' }}>No job link</span>
                          )}

                          <button type="button" onClick={() => openEditForm(application)} className="cc-btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }}>
                            Edit
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleDeleteApplication(application._id)}
                          disabled={deletingId === application._id}
                          className="cc-btn-danger"
                          style={{ padding: '8px 14px', fontSize: 13 }}
                        >
                          {deletingId === application._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </TiltCard>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ApplicationsPage