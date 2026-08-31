import { useEffect, useRef, useState } from 'react'

interface ParsedData {
  name?: string
  email?: string
  phone?: string
  location?: string
  headline?: string
  summary?: string
  skills?: string[]
  education?: unknown[]
  experience?: unknown[]
  projects?: unknown[]
  certifications?: unknown[]
}

interface Resume {
  _id: string
  id?: string
  userId?: string
  fileName: string
  fileType: string
  fileSize: number
  extractedText?: string
  uploadedAt: string
  createdAt?: string
  updatedAt?: string
  parsedData: ParsedData
}

interface ResumeListResponse {
  success: boolean
  message?: string
  data?: Resume[]
  resumes?: Resume[]
}

interface SingleResumeResponse {
  success: boolean
  message?: string
  data?: Resume
  resume?: Resume
}

interface ScoreItem {
  score: number
  maxScore: number
}

interface Analysis {
  resumeId: string
  fileName: string
  score: ScoreItem
  contact: ScoreItem
  structure: ScoreItem
  skills: ScoreItem
  experience: ScoreItem
  projects: ScoreItem
  education: ScoreItem
  keywords: ScoreItem
  formatting: ScoreItem
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  statistics: {
    skills: number
    education: number
    experience: number
    projects: number
    certifications: number
  }
  parsedData?: ParsedData
}

interface AnalysisResponse {
  success: boolean
  message?: string
  data?: unknown
  analysis?: unknown
  result?: unknown
}

interface ScoreCategory {
  name: string
  score: number
  maxScore: number
}

const API_URL = 'http://localhost:5000/api'

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS (matches AXIOM spatial-OS reference)
══════════════════════════════════════════════════════════ */
const INK = '#03040e'
const PANEL = '#0d0f1f'
const TEXT = '#e8eaf6'
const MUTE = '#6b6f99'
const MUTE_2 = '#9da0c4'
const VIOLET = '#6c63ff'
const CYAN = '#00d4ff'
const PURPLE = '#a78bfa'
const GREEN = '#34d399'
const AMBER = '#f59e0b'
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
  className = '',
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  accent?: string
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
      className={className}
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
   ARC GAUGE — svg score ring
══════════════════════════════════════════════════════════ */
function ArcGauge({
  pct,
  color,
  size = 160,
  centerLabel,
  centerSub,
}: {
  pct: number
  color: string
  size?: number
  centerLabel: string
  centerSub: string
}) {
  const r = size * 0.38
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const arc = circ * 0.75
  const fill = (Math.max(0, Math.min(100, pct)) / 100) * arc

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,.06)"
          strokeWidth={size * 0.055}
          strokeDasharray={`${arc} ${circ}`}
          strokeDashoffset={-circ * 0.125}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.055}
          strokeDasharray={`${fill} ${circ - fill + circ * 0.25}`}
          strokeDashoffset={-circ * 0.125}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
            transition: 'stroke-dasharray 1.1s cubic-bezier(.23,1,.32,1)',
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
        <div
          style={{
            fontSize: size * 0.26,
            fontWeight: 800,
            background: `linear-gradient(110deg, ${VIOLET}, ${CYAN})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}
        >
          {centerLabel}
        </div>
        <div style={{ fontFamily: MONO, fontSize: size * 0.075, color: MUTE, marginTop: 4 }}>
          {centerSub}
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

function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] =
    useState<Resume | null>(null)

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef =
    useRef<HTMLInputElement>(null)

  const getToken = (): string | null => {
    return localStorage.getItem('token')
  }

  const toNumber = (
    value: unknown,
    fallback = 0,
  ): number => {
    if (typeof value === 'number') {
      return Number.isFinite(value)
        ? value
        : fallback
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

  const isObject = (
    value: unknown,
  ): value is Record<string, unknown> => {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    )
  }

  const readScore = (
    value: unknown,
    fallbackMax: number,
  ): ScoreItem => {
    if (isObject(value)) {
      return {
        score: toNumber(
          value.score ??
            value.value ??
            value.points ??
            value.total ??
            value.overall,
          0,
        ),
        maxScore: toNumber(
          value.maxScore ??
            value.max_score ??
            value.maximum ??
            value.max,
          fallbackMax,
        ),
      }
    }

    return {
      score: toNumber(value, 0),
      maxScore: fallbackMax,
    }
  }

  const readNamedScore = (
    object: Record<string, unknown>,
    names: string[],
    fallbackMax: number,
  ): ScoreItem => {
    for (const name of names) {
      if (
        object[name] !== undefined &&
        object[name] !== null
      ) {
        return readScore(
          object[name],
          fallbackMax,
        )
      }
    }

    return {
      score: 0,
      maxScore: fallbackMax,
    }
  }

  const findAnalysisObject = (
    response: AnalysisResponse,
  ): Record<string, unknown> => {
    const candidates: unknown[] = [
      response.data,
      response.analysis,
      response.result,
    ]

    for (const candidate of candidates) {
      if (!isObject(candidate)) {
        continue
      }

      if (isObject(candidate.data)) {
        return candidate.data
      }

      if (isObject(candidate.analysis)) {
        return candidate.analysis
      }

      if (isObject(candidate.result)) {
        return candidate.result
      }

      return candidate
    }

    throw new Error(
      'Backend response does not contain analysis data.',
    )
  }

  const normalizeAnalysis = (
    response: AnalysisResponse,
    resume: Resume | null,
  ): Analysis => {
    const raw =
      findAnalysisObject(response)

    const atsScore = isObject(
      raw.atsScore,
    )
      ? raw.atsScore
      : {}

    const scoreBreakdown =
      isObject(raw.scoreBreakdown)
        ? raw.scoreBreakdown
        : {}

    const parsedData =
      isObject(raw.parsedData)
        ? (raw.parsedData as ParsedData)
        : resume?.parsedData

    const fallbackSkills =
      parsedData?.skills?.length ?? 0

    const fallbackEducation =
      parsedData?.education?.length ?? 0

    const fallbackExperience =
      parsedData?.experience?.length ?? 0

    const fallbackProjects =
      parsedData?.projects?.length ?? 0

    const fallbackCertifications =
      parsedData?.certifications?.length ?? 0

    const statistics =
      isObject(raw.statistics)
        ? raw.statistics
        : isObject(raw.stats)
          ? raw.stats
          : {}

    const overallScore =
      raw.score ??
      atsScore.overall ??
      atsScore.score ??
      raw.overallScore ??
      raw.overall_score ??
      0

    const normalized: Analysis = {
      resumeId: String(
        raw.resumeId ??
          raw.resume_id ??
          resume?._id ??
          '',
      ),

      fileName: String(
        raw.fileName ??
          raw.file_name ??
          resume?.fileName ??
          '',
      ),

      score: readScore(
        overallScore,
        100,
      ),

      contact:
        readNamedScore(
          atsScore,
          ['contact'],
          10,
        ).score !== 0
          ? readNamedScore(
              atsScore,
              ['contact'],
              10,
            )
          : readNamedScore(
              scoreBreakdown,
              ['contact'],
              10,
            ),

      structure:
        readNamedScore(
          atsScore,
          ['structure'],
          20,
        ).score !== 0
          ? readNamedScore(
              atsScore,
              ['structure'],
              20,
            )
          : readNamedScore(
              scoreBreakdown,
              ['structure'],
              20,
            ),

      skills:
        readNamedScore(
          atsScore,
          ['skills'],
          15,
        ).score !== 0
          ? readNamedScore(
              atsScore,
              ['skills'],
              15,
            )
          : readNamedScore(
              scoreBreakdown,
              ['skills'],
              15,
            ),

      experience:
        readNamedScore(
          atsScore,
          ['experience'],
          20,
        ).score !== 0
          ? readNamedScore(
              atsScore,
              ['experience'],
              20,
            )
          : readNamedScore(
              scoreBreakdown,
              ['experience'],
              20,
            ),

      projects:
        readNamedScore(
          atsScore,
          ['projects'],
          10,
        ).score !== 0
          ? readNamedScore(
              atsScore,
              ['projects'],
              10,
            )
          : readNamedScore(
              scoreBreakdown,
              ['projects'],
              10,
            ),

      education:
        readNamedScore(
          atsScore,
          ['education'],
          10,
        ).score !== 0
          ? readNamedScore(
              atsScore,
              ['education'],
              10,
            )
          : readNamedScore(
              scoreBreakdown,
              ['education'],
              10,
            ),

      keywords:
        readNamedScore(
          atsScore,
          ['keywords'],
          10,
        ).score !== 0
          ? readNamedScore(
              atsScore,
              ['keywords'],
              10,
            )
          : readNamedScore(
              scoreBreakdown,
              ['keywords'],
              10,
            ),

      formatting:
        readNamedScore(
          atsScore,
          ['formatting'],
          5,
        ).score !== 0
          ? readNamedScore(
              atsScore,
              ['formatting'],
              5,
            )
          : readNamedScore(
              scoreBreakdown,
              ['formatting'],
              5,
            ),

      strengths: Array.isArray(
        raw.strengths,
      )
        ? raw.strengths.map(String)
        : [],

      weaknesses: Array.isArray(
        raw.weaknesses,
      )
        ? raw.weaknesses.map(String)
        : [],

      suggestions: Array.isArray(
        raw.suggestions,
      )
        ? raw.suggestions.map(String)
        : [],

      statistics: {
        skills: toNumber(
          statistics.skills ??
            statistics.skills_count ??
            statistics.skillCount,
          fallbackSkills,
        ),

        education: toNumber(
          statistics.education ??
            statistics.education_count ??
            statistics.educationCount,
          fallbackEducation,
        ),

        experience: toNumber(
          statistics.experience ??
            statistics.experience_count ??
            statistics.experienceCount,
          fallbackExperience,
        ),

        projects: toNumber(
          statistics.projects ??
            statistics.projects_count ??
            statistics.projectCount,
          fallbackProjects,
        ),

        certifications: toNumber(
          statistics.certifications ??
            statistics.certifications_count ??
            statistics.certificationCount,
          fallbackCertifications,
        ),
      },

      parsedData,
    }

    console.log(
      'NORMALIZED ANALYSIS:',
      normalized,
    )

    return normalized
  }

  const getResumeFromResponse = (
    data: SingleResumeResponse,
  ): Resume | null => {
    if (data.resume) {
      return data.resume
    }

    if (data.data) {
      return data.data
    }

    return null
  }

  const getResumesFromResponse = (
    data: ResumeListResponse,
  ): Resume[] => {
    if (Array.isArray(data.data)) {
      return data.data
    }

    if (Array.isArray(data.resumes)) {
      return data.resumes
    }

    return []
  }

  useEffect(() => {
    let cancelled = false

    const loadResumes = async () => {
      const authToken = getToken()

      if (!authToken) {
        setError(
          'Please log in to view your resumes.',
        )
        setLoading(false)
        return
      }

      try {
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
          (await response.json()) as ResumeListResponse

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to load resumes',
          )
        }

        if (!cancelled) {
          setResumes(
            getResumesFromResponse(data),
          )

          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load resumes',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadResumes()

    return () => {
      cancelled = true
    }
  }, [])

  const loadResumesAfterUpload =
    async () => {
      const authToken = getToken()

      if (!authToken) {
        return
      }

      try {
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
          (await response.json()) as ResumeListResponse

        if (!response.ok) {
          throw new Error(
            data.message ||
              'Failed to refresh resumes',
          )
        }

        setResumes(
          getResumesFromResponse(data),
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to refresh resumes',
        )
      }
    }

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    if (
      file.type !==
      'application/pdf'
    ) {
      setError(
        'Only PDF files are currently supported.',
      )

      event.target.value = ''
      return
    }

    const authToken = getToken()

    if (!authToken) {
      setError(
        'Please log in before uploading a resume.',
      )

      event.target.value = ''
      return
    }

    try {
      setUploading(true)
      setError('')
      setAnalysis(null)

      const formData =
        new FormData()

      formData.append(
        'resume',
        file,
      )

      const response = await fetch(
        `${API_URL}/resumes`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${authToken}`,
          },
          body: formData,
        },
      )

      const data =
        (await response.json()) as SingleResumeResponse

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to upload resume',
        )
      }

      const uploadedResume =
        getResumeFromResponse(data)

      if (uploadedResume) {
        setSelectedResume(
          uploadedResume,
        )
      }

      await loadResumesAfterUpload()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload resume',
      )
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleView = async (
    resumeId: string,
  ) => {
    const authToken = getToken()

    if (!authToken) {
      setError(
        'Please log in before viewing a resume.',
      )
      return
    }

    try {
      setError('')
      setAnalysis(null)

      const response = await fetch(
        `${API_URL}/resumes/${resumeId}`,
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
        (await response.json()) as SingleResumeResponse

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to load resume',
        )
      }

      const resume =
        getResumeFromResponse(data)

      if (!resume) {
        throw new Error(
          'Resume data was not returned',
        )
      }

      setSelectedResume(resume)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load resume',
      )
    }
  }

  const handleAnalyze = async (
    resumeId: string,
  ) => {
    const authToken = getToken()

    if (!authToken) {
      setError(
        'Please log in before analyzing a resume.',
      )
      return
    }

    try {
      setAnalyzing(true)
      setError('')
      setAnalysis(null)

      const response = await fetch(
        `${API_URL}/resumes/${resumeId}/analyze`,
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
        (await response.json()) as AnalysisResponse

      console.log(
        'RAW ANALYSIS RESPONSE:',
        data,
      )

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to analyze resume',
        )
      }

      const resume =
        selectedResume?._id === resumeId
          ? selectedResume
          : resumes.find(
              item =>
                item._id === resumeId,
            ) ?? null

      const normalized =
        normalizeAnalysis(
          data,
          resume,
        )

      setAnalysis(normalized)
    } catch (err) {
      console.error(
        'Analysis error:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to analyze resume',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDelete = async (
    resumeId: string,
  ) => {
    const authToken = getToken()

    if (!authToken) {
      setError(
        'Please log in before deleting a resume.',
      )
      return
    }

    const confirmed =
      window.confirm(
        'Are you sure you want to delete this resume?',
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      const response = await fetch(
        `${API_URL}/resumes/${resumeId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization:
              `Bearer ${authToken}`,
            Accept:
              'application/json',
          },
        },
      )

      const data =
        (await response.json()) as ResumeListResponse

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to delete resume',
        )
      }

      setResumes(
        current =>
          current.filter(
            resume =>
              resume._id !==
              resumeId,
          ),
      )

      if (
        selectedResume?._id ===
        resumeId
      ) {
        setSelectedResume(null)
        setAnalysis(null)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete resume',
      )
    }
  }

  const formatFileSize = (
    bytes: number,
  ): string => {
    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`
  }

  const getScore = (
    item: ScoreItem | undefined,
  ): number => {
    return item?.score ?? 0
  }

  const getMaxScore = (
    item: ScoreItem | undefined,
    fallback: number,
  ): number => {
    return item?.maxScore ?? fallback
  }

  const getOverallScore =
    (): number => {
      return analysis?.score.score ?? 0
    }

  const getOverallMaxScore =
    (): number => {
      return (
        analysis?.score.maxScore ??
        100
      )
    }

  const skills =
    selectedResume?.parsedData
      ?.skills ?? []

  const education =
    selectedResume?.parsedData
      ?.education ?? []

  const experience =
    selectedResume?.parsedData
      ?.experience ?? []

  const projects =
    selectedResume?.parsedData
      ?.projects ?? []

  const certifications =
    selectedResume?.parsedData
      ?.certifications ?? []

  const strengths =
    analysis?.strengths ?? []

  const weaknesses =
    analysis?.weaknesses ?? []

  const suggestions =
    analysis?.suggestions ?? []

  const statistics = {
    skills:
      analysis?.statistics.skills ??
      skills.length,

    education:
      analysis?.statistics.education ??
      education.length,

    experience:
      analysis?.statistics.experience ??
      experience.length,

    projects:
      analysis?.statistics.projects ??
      projects.length,

    certifications:
      analysis?.statistics.certifications ??
      certifications.length,
  }

  const scoreCategories: ScoreCategory[] =
    analysis
      ? [
          {
            name: 'Contact',
            score: getScore(
              analysis.contact,
            ),
            maxScore:
              getMaxScore(
                analysis.contact,
                10,
              ),
          },
          {
            name: 'Structure',
            score: getScore(
              analysis.structure,
            ),
            maxScore:
              getMaxScore(
                analysis.structure,
                20,
              ),
          },
          {
            name: 'Skills',
            score: getScore(
              analysis.skills,
            ),
            maxScore:
              getMaxScore(
                analysis.skills,
                15,
              ),
          },
          {
            name: 'Experience',
            score: getScore(
              analysis.experience,
            ),
            maxScore:
              getMaxScore(
                analysis.experience,
                20,
              ),
          },
          {
            name: 'Projects',
            score: getScore(
              analysis.projects,
            ),
            maxScore:
              getMaxScore(
                analysis.projects,
                10,
              ),
          },
          {
            name: 'Education',
            score: getScore(
              analysis.education,
            ),
            maxScore:
              getMaxScore(
                analysis.education,
                10,
              ),
          },
          {
            name: 'Keywords',
            score: getScore(
              analysis.keywords,
            ),
            maxScore:
              getMaxScore(
                analysis.keywords,
                10,
              ),
          },
          {
            name: 'Formatting',
            score: getScore(
              analysis.formatting,
            ),
            maxScore:
              getMaxScore(
                analysis.formatting,
                5,
              ),
          },
        ]
      : []

  const overallPct =
    getOverallMaxScore() > 0
      ? Math.round(
          (getOverallScore() / getOverallMaxScore()) * 100,
        )
      : 0

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .rc-scope, .rc-scope * { box-sizing: border-box; }
    .rc-scope { font-family: ${SANS}; }
    .rc-scope ::-webkit-scrollbar { width: 4px; }
    .rc-scope ::-webkit-scrollbar-track { background: transparent; }
    .rc-scope ::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.3); border-radius: 4px; }

    @keyframes pulseGlow { 0%,100% { opacity:.55; transform:scale(1);} 50% { opacity:1; transform:scale(1.18);} }
    @keyframes shimmerX { 0% { background-position:-300% 0;} 100% { background-position:300% 0;} }
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
    @keyframes scanH { from { transform:translateY(-100%);} to { transform:translateY(100vh);} }
    @keyframes spinRing { to { transform: rotate(360deg); } }
    @keyframes floatDoc { 0%,100% { transform: rotateX(12deg) rotateY(-18deg) rotateZ(3deg) translateY(0);} 50% { transform: rotateX(12deg) rotateY(-18deg) rotateZ(3deg) translateY(-14px);} }

    .rc-nav-btn:hover { border-color: rgba(108,99,255,.5) !important; color:#c5c9e8 !important; background: rgba(108,99,255,.1) !important; }
    .rc-ghost-btn:hover { border-color: rgba(108,99,255,.5) !important; color:#c5c9e8 !important; }
    .rc-primary-btn:hover { transform: translateY(-2px); box-shadow: 0 18px 48px rgba(108,99,255,.55) !important; }
    .rc-pill:hover { transform: translateY(-2px); }
    .rc-action-btn:hover { background: rgba(108,99,255,.16) !important; border-color: rgba(108,99,255,.4) !important; color:#e8eaf6 !important; }
    .rc-danger-btn:hover { background: rgba(239,68,68,.14) !important; border-color: rgba(239,68,68,.4) !important; }
    .rc-analyze-btn:hover { transform: translateY(-2px); box-shadow: 0 18px 44px rgba(108,99,255,.5) !important; }

    @media (max-width: 980px) {
      .rc-hero-grid { grid-template-columns: 1fr !important; }
      .rc-hero-doc { display:none !important; }
      .rc-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
      .rc-contact-grid { grid-template-columns: repeat(2,1fr) !important; }
      .rc-counter-grid { grid-template-columns: repeat(2,1fr) !important; }
      .rc-breakdown-grid { grid-template-columns: repeat(2,1fr) !important; }
      .rc-stats5-grid { grid-template-columns: repeat(2,1fr) !important; }
      .rc-sw-grid { grid-template-columns: 1fr !important; }
      .rc-suggestion-grid { grid-template-columns: 1fr !important; }
      .rc-cards-grid { grid-template-columns: repeat(2,1fr) !important; }
      .rc-nav-links { display:none !important; }
    }
    @media (max-width: 620px) {
      .rc-stat-grid { grid-template-columns: 1fr !important; }
      .rc-contact-grid { grid-template-columns: 1fr !important; }
      .rc-counter-grid { grid-template-columns: 1fr !important; }
      .rc-breakdown-grid { grid-template-columns: 1fr !important; }
      .rc-stats5-grid { grid-template-columns: 1fr !important; }
      .rc-cards-grid { grid-template-columns: 1fr !important; }
      .rc-analysis-hero { flex-direction: column !important; text-align:center; }
      .rc-hero-title { font-size: clamp(2.1rem, 9vw, 3rem) !important; }
      .rc-pad { padding-left:20px !important; padding-right:20px !important; }
    }
  `

  return (
    <div
      className="rc-scope"
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
          className="rc-pad"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 72,
            padding: '0 32px',
            background: 'rgba(3,4,14,.9)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(108,99,255,.14)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="rc-nav-btn"
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                border: '1px solid rgba(108,99,255,.22)',
                background: 'rgba(255,255,255,.03)',
                color: MUTE_2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .2s',
                fontSize: 16,
              }}
            >
              ←
            </button>

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
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                  <path d="M6 3h8l4 4v14H6V3Z" stroke="white" strokeWidth="1.7" />
                  <path d="M14 3v5h5" stroke="white" strokeWidth="1.7" />
                  <path d="M9 13h6M9 17h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '.08em' }}>CAREERCRAFT</div>
                <div style={{ fontSize: 10, color: MUTE, fontFamily: MONO }}>AI CAREER SYSTEM</div>
              </div>
            </div>
          </div>

          <div className="rc-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
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

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rc-primary-btn"
              style={{
                padding: '11px 22px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                color: 'white',
                border: 'none',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.55 : 1,
                boxShadow: `0 12px 34px rgba(108,99,255,.4)`,
                transition: 'all .2s',
              }}
            >
              {uploading ? 'Uploading…' : '+ Upload Resume'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </div>
        </header>

        <main className="rc-pad" style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px' }}>
          {/* ═══════════ HERO ═══════════ */}
          <section style={{ paddingTop: 56, paddingBottom: 40 }}>
            <div
              className="rc-hero-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, alignItems: 'center' }}
            >
              <div style={{ animation: 'fadeUp .7s both' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    borderRadius: 100,
                    background: 'rgba(108,99,255,.1)',
                    border: '1px solid rgba(108,99,255,.3)',
                    fontSize: 11,
                    fontFamily: MONO,
                    color: PURPLE,
                    marginBottom: 22,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: VIOLET }} />
                  Resume intelligence module
                </div>

                <h1
                  className="rc-hero-title"
                  style={{
                    fontSize: 'clamp(2.6rem, 5.4vw, 4.4rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    lineHeight: 0.98,
                    marginBottom: 20,
                  }}
                >
                  <span style={{ color: TEXT }}>Your resume,</span>
                  <br />
                  <span
                    style={{
                      background: `linear-gradient(110deg, ${VIOLET} 0%, ${CYAN} 55%, ${PURPLE} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    command center
                  </span>
                </h1>

                <p style={{ color: MUTE, maxWidth: 480, lineHeight: 1.7, marginBottom: 30, fontSize: '1.02rem' }}>
                  Upload, inspect and analyze your resumes with AI-powered career
                  intelligence. Track ATS performance and discover opportunities to
                  strengthen your profile.
                </p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rc-primary-btn"
                    style={{
                      padding: '14px 28px',
                      borderRadius: 13,
                      fontSize: 14,
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                      color: 'white',
                      border: 'none',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: uploading ? 0.55 : 1,
                      boxShadow: `0 12px 40px rgba(108,99,255,.4)`,
                      transition: 'all .2s',
                    }}
                  >
                    {uploading ? 'Uploading…' : 'Upload new resume'}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="rc-ghost-btn"
                    style={{
                      padding: '14px 28px',
                      borderRadius: 13,
                      fontSize: 14,
                      fontWeight: 600,
                      background: 'transparent',
                      color: MUTE_2,
                      border: '1px solid rgba(108,99,255,.25)',
                      cursor: 'pointer',
                      transition: 'all .2s',
                    }}
                  >
                    ← Dashboard
                  </button>
                </div>
              </div>

              {/* 3D DOCUMENT */}
              <div className="rc-hero-doc" style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ perspective: 800, width: 220, height: 260 }}>
                  <div
                    style={{
                      width: 200,
                      height: 240,
                      borderRadius: 20,
                      border: '1px solid rgba(108,99,255,.32)',
                      background: `linear-gradient(160deg, rgba(108,99,255,.1), rgba(0,212,255,.04))`,
                      boxShadow: `0 30px 70px rgba(108,99,255,.2)`,
                      position: 'relative',
                      transformStyle: 'preserve-3d',
                      animation: 'floatDoc 5s ease-in-out infinite',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 22,
                        right: 22,
                        top: 24,
                        height: 8,
                        borderRadius: 100,
                        background: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
                        opacity: 0.85,
                      }}
                    />
                    <div style={{ position: 'absolute', left: 22, right: 44, top: 58, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ height: 7, borderRadius: 100, background: 'rgba(255,255,255,.2)' }} />
                      <div style={{ height: 7, width: '75%', borderRadius: 100, background: 'rgba(255,255,255,.1)' }} />
                      <div style={{ height: 7, width: '84%', borderRadius: 100, background: 'rgba(255,255,255,.1)' }} />
                    </div>
                    <div style={{ position: 'absolute', bottom: 26, left: 22, display: 'flex', gap: 8 }}>
                      <span style={{ height: 28, width: 28, borderRadius: 8, background: 'rgba(108,99,255,.2)' }} />
                      <span style={{ height: 28, width: 68, borderRadius: 8, background: 'rgba(0,212,255,.1)' }} />
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        right: -26,
                        top: -26,
                        width: 58,
                        height: 58,
                        borderRadius: 18,
                        border: `1px solid rgba(0,212,255,.32)`,
                        background: 'rgba(3,4,14,.9)',
                        boxShadow: `0 0 34px rgba(0,212,255,.28)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        color: CYAN,
                      }}
                    >
                      ✦
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════ ERROR ═══════════ */}
          {error && (
            <div
              style={{
                marginBottom: 32,
                borderRadius: 16,
                border: `1px solid rgba(239,68,68,.3)`,
                background: 'rgba(239,68,68,.08)',
                padding: '16px 18px',
                fontSize: 13,
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: 'rgba(239,68,68,.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: RED,
                  fontWeight: 700,
                }}
              >
                !
              </span>
              {error}
            </div>
          )}

          {/* ═══════════ OVERVIEW STATS ═══════════ */}
          <section style={{ paddingBottom: 32 }}>
            <div className="rc-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { label: 'RESUMES', value: resumes.length, sub: 'Documents stored', color: VIOLET, acc: '108,99,255' },
                { label: 'SKILLS', value: skills.length, sub: 'Detected skills', color: CYAN, acc: '0,212,255' },
                { label: 'EXPERIENCE', value: experience.length, sub: 'Experience entries', color: PURPLE, acc: '167,139,250' },
                { label: 'PROJECTS', value: projects.length, sub: 'Projects detected', color: GREEN, acc: '52,211,153' },
              ].map((stat, i) => (
                <TiltCard
                  key={stat.label}
                  accent={stat.acc}
                  style={{
                    borderRadius: 18,
                    padding: '20px 22px',
                    background: `linear-gradient(145deg, rgba(13,15,31,.96), rgba(${stat.acc},.06))`,
                    animation: `fadeUp .6s ${i * 0.08}s both`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontFamily: MONO, color: MUTE, letterSpacing: '.1em' }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: '1.95rem', fontWeight: 800, color: stat.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>
                    {stat.value}
                  </div>
                  <p style={{ fontSize: 12, color: MUTE, marginBottom: 12 }}>{stat.sub}</p>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 2,
                        width: '100%',
                        background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
                        backgroundSize: '300% 100%',
                        animation: 'shimmerX 2.5s infinite',
                      }}
                    />
                  </div>
                </TiltCard>
              ))}
            </div>
          </section>

          {/* ═══════════ RESUME LIST HEADER ═══════════ */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: VIOLET, letterSpacing: '.15em', marginBottom: 6 }}>
                DOCUMENT STORAGE
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>My Resumes</h3>
            </div>
            <p style={{ fontSize: 12, color: MUTE }}>
              {resumes.length} document{resumes.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* ═══════════ LOADING ═══════════ */}
          {loading ? (
            <div
              style={{
                borderRadius: 20,
                border: '1px solid rgba(108,99,255,.15)',
                background: `linear-gradient(145deg, rgba(13,15,31,.96), rgba(108,99,255,.04))`,
                padding: '56px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  margin: '0 auto 20px',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '2px solid rgba(108,99,255,.18)',
                  borderTopColor: VIOLET,
                  animation: 'spinRing 0.9s linear infinite',
                }}
              />
              <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.15em', color: PURPLE }}>
                INITIALIZING RESUME DATABASE…
              </p>
            </div>
          ) : resumes.length === 0 ? (
            /* ═══════════ EMPTY STATE ═══════════ */
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 24,
                border: '1px dashed rgba(108,99,255,.28)',
                background: `linear-gradient(160deg, rgba(108,99,255,.07), rgba(0,212,255,.02))`,
                padding: '64px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -60,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 320,
                  height: 200,
                  borderRadius: '50%',
                  background: 'rgba(108,99,255,.12)',
                  filter: 'blur(60px)',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    margin: '0 auto',
                    width: 76,
                    height: 76,
                    borderRadius: 20,
                    border: '1px solid rgba(108,99,255,.28)',
                    background: 'rgba(108,99,255,.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    boxShadow: '0 0 40px rgba(108,99,255,.16)',
                  }}
                >
                  ◫
                </div>
                <h3 style={{ marginTop: 24, fontSize: 20, fontWeight: 700, color: TEXT }}>No resumes detected</h3>
                <p style={{ margin: '10px auto 0', maxWidth: 420, fontSize: 13, lineHeight: 1.6, color: MUTE }}>
                  Upload your first PDF resume and activate the AI resume intelligence
                  system.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rc-primary-btn"
                  style={{
                    marginTop: 24,
                    padding: '13px 26px',
                    borderRadius: 13,
                    fontSize: 13,
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                    color: 'white',
                    border: 'none',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.55 : 1,
                    boxShadow: `0 12px 35px rgba(108,99,255,.35)`,
                    transition: 'all .2s',
                  }}
                >
                  {uploading ? 'Uploading…' : 'Upload first resume'}
                </button>
              </div>
            </div>
          ) : (
            /* ═══════════ RESUME CARDS ═══════════ */
            <div className="rc-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
              {resumes.map((resume, i) => (
                <TiltCard
                  key={resume._id}
                  accent="108,99,255"
                  style={{
                    borderRadius: 18,
                    padding: 20,
                    background: `linear-gradient(145deg, rgba(13,15,31,.97), rgba(108,99,255,.045))`,
                    animation: `fadeUp .5s ${i * 0.05}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', minWidth: 0, alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          flexShrink: 0,
                          borderRadius: 12,
                          border: '1px solid rgba(239,68,68,.25)',
                          background: 'rgba(239,68,68,.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fca5a5',
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: MONO,
                        }}
                      >
                        PDF
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: TEXT,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {resume.fileName}
                        </h4>
                        <p style={{ fontSize: 10, fontFamily: MONO, color: MUTE, marginTop: 3 }}>
                          {formatFileSize(resume.fileSize)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255,255,255,.06)',
                      paddingTop: 14,
                    }}
                  >
                    <span style={{ fontSize: 9, fontFamily: MONO, letterSpacing: '.08em', color: '#4c5080', textTransform: 'uppercase' }}>
                      Uploaded
                    </span>
                    <span style={{ fontSize: 12, color: MUTE_2 }}>
                      {resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>

                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleView(resume._id)}
                      className="rc-action-btn"
                      style={{
                        padding: '10px 4px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,.1)',
                        background: 'rgba(255,255,255,.03)',
                        color: MUTE_2,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all .2s',
                      }}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnalyze(resume._id)}
                      disabled={analyzing}
                      style={{
                        padding: '10px 4px',
                        borderRadius: 10,
                        border: 'none',
                        background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: analyzing ? 'not-allowed' : 'pointer',
                        opacity: analyzing ? 0.55 : 1,
                        boxShadow: '0 6px 18px rgba(108,99,255,.28)',
                        transition: 'all .2s',
                      }}
                    >
                      {analyzing ? 'Analyzing…' : 'Analyze'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(resume._id)}
                      className="rc-danger-btn"
                      style={{
                        padding: '10px 4px',
                        borderRadius: 10,
                        border: '1px solid rgba(239,68,68,.2)',
                        background: 'rgba(239,68,68,.06)',
                        color: '#fca5a5',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all .2s',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </TiltCard>
              ))}
            </div>
          )}

          {/* ═══════════ SELECTED RESUME ═══════════ */}
          {selectedResume && (
            <section style={{ marginTop: 48, paddingBottom: 64 }}>
              <TiltCard
                accent="0,212,255"
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  background: `linear-gradient(160deg, rgba(13,15,31,.98), rgba(0,212,255,.03))`,
                }}
              >
                {/* PANEL HEADER */}
                <div
                  style={{
                    position: 'relative',
                    borderBottom: '1px solid rgba(108,99,255,.15)',
                    padding: '28px 32px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: -60,
                      top: -80,
                      width: 220,
                      height: 220,
                      borderRadius: '50%',
                      background: 'rgba(108,99,255,.12)',
                      filter: 'blur(60px)',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 20,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: CYAN,
                            boxShadow: `0 0 12px ${CYAN}`,
                          }}
                        />
                        <span style={{ fontSize: 11, fontFamily: MONO, color: CYAN, letterSpacing: '.14em' }}>
                          ACTIVE DOCUMENT
                        </span>
                      </div>
                      <h2 style={{ fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>
                        Parsed Resume
                      </h2>
                      <p
                        style={{
                          marginTop: 6,
                          maxWidth: 420,
                          fontSize: 13,
                          color: MUTE,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {selectedResume.fileName}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => handleAnalyze(selectedResume._id)}
                        disabled={analyzing}
                        className="rc-analyze-btn"
                        style={{
                          padding: '12px 22px',
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 700,
                          background: `linear-gradient(135deg, ${VIOLET}, ${PURPLE})`,
                          color: 'white',
                          border: 'none',
                          cursor: analyzing ? 'not-allowed' : 'pointer',
                          opacity: analyzing ? 0.55 : 1,
                          boxShadow: '0 10px 30px rgba(108,99,255,.35)',
                          transition: 'all .2s',
                        }}
                      >
                        {analyzing ? 'Analyzing…' : '✦ Analyze Resume'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedResume(null)
                          setAnalysis(null)
                        }}
                        className="rc-ghost-btn"
                        style={{
                          padding: '12px 22px',
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 600,
                          background: 'rgba(255,255,255,.03)',
                          color: MUTE_2,
                          border: '1px solid rgba(255,255,255,.1)',
                          cursor: 'pointer',
                          transition: 'all .2s',
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '28px 32px 36px' }}>
                  {/* CONTACT */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Contact Intelligence</h3>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(108,99,255,.3), transparent)' }} />
                  </div>

                  <div className="rc-contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    {[
                      ['NAME', selectedResume.parsedData.name, '◉'],
                      ['EMAIL', selectedResume.parsedData.email, '@'],
                      ['PHONE', selectedResume.parsedData.phone, '⌁'],
                      ['LOCATION', selectedResume.parsedData.location, '⌖'],
                    ].map(([label, value, icon]) => (
                      <div
                        key={label}
                        style={{
                          borderRadius: 14,
                          border: '1px solid rgba(255,255,255,.07)',
                          background: 'rgba(255,255,255,.02)',
                          padding: 16,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: VIOLET }}>{icon}</span>
                          <p style={{ fontSize: 9, fontFamily: MONO, letterSpacing: '.12em', color: '#4c5080' }}>{label}</p>
                        </div>
                        <p
                          style={{
                            marginTop: 8,
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#d5d8f0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {value || 'Not available'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* HEADLINE */}
                  <div
                    style={{
                      marginTop: 28,
                      borderRadius: 16,
                      border: '1px solid rgba(0,212,255,.12)',
                      background: 'rgba(0,212,255,.025)',
                      padding: 18,
                    }}
                  >
                    <p style={{ fontSize: 9, fontFamily: MONO, letterSpacing: '.14em', color: CYAN }}>
                      PROFESSIONAL HEADLINE
                    </p>
                    <p style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: '#d5d8f0' }}>
                      {selectedResume.parsedData.headline || 'Not available'}
                    </p>
                  </div>

                  {/* SUMMARY */}
                  <div
                    style={{
                      marginTop: 16,
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,.07)',
                      background: 'rgba(255,255,255,.018)',
                      padding: 18,
                    }}
                  >
                    <p style={{ fontSize: 9, fontFamily: MONO, letterSpacing: '.14em', color: VIOLET }}>
                      PROFESSIONAL SUMMARY
                    </p>
                    <p style={{ marginTop: 10, fontSize: 13, lineHeight: 1.75, color: MUTE, whiteSpace: 'pre-line' }}>
                      {selectedResume.parsedData.summary || 'Not available'}
                    </p>
                  </div>

                  {/* SKILLS */}
                  <div style={{ marginTop: 30 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>Skill Matrix</h3>
                      <span style={{ fontSize: 10, fontFamily: MONO, color: '#4c5080' }}>{skills.length} DETECTED</span>
                    </div>

                    {skills.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {skills.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rc-pill"
                            style={{
                              borderRadius: 10,
                              border: '1px solid rgba(108,99,255,.22)',
                              background: 'rgba(108,99,255,.08)',
                              padding: '8px 13px',
                              fontSize: 12,
                              fontWeight: 500,
                              color: '#c9cdf0',
                              transition: 'transform .2s',
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: '#4c5080' }}>No skills detected.</p>
                    )}
                  </div>

                  {/* COUNTERS */}
                  <div className="rc-counter-grid" style={{ marginTop: 30, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                    {[
                      ['Education', education.length, 'EDU'],
                      ['Experience', experience.length, 'EXP'],
                      ['Projects', projects.length, 'PRJ'],
                      ['Certifications', certifications.length, 'CERT'],
                    ].map(([label, count, code]) => (
                      <div
                        key={label}
                        style={{
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 16,
                          border: '1px solid rgba(108,99,255,.12)',
                          background: `linear-gradient(160deg, rgba(108,99,255,.07), transparent)`,
                          padding: 18,
                        }}
                      >
                        <span style={{ fontSize: 9, fontFamily: MONO, letterSpacing: '.12em', color: 'rgba(108,99,255,.7)' }}>
                          {code}
                        </span>
                        <p style={{ marginTop: 8, fontSize: 13, color: MUTE }}>{label}</p>
                        <p style={{ marginTop: 4, fontSize: 28, fontWeight: 800, color: TEXT }}>{count}</p>
                      </div>
                    ))}
                  </div>

                  {/* ═══════════ ANALYSIS ═══════════ */}
                  {analysis && (
                    <section style={{ marginTop: 48, paddingTop: 40, borderTop: '1px solid rgba(108,99,255,.12)' }}>
                      {/* ANALYSIS HERO */}
                      <div
                        style={{
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 22,
                          border: '1px solid rgba(108,99,255,.2)',
                          background: `linear-gradient(150deg, rgba(108,99,255,.12), rgba(13,15,31,1) 55%, rgba(0,212,255,.05))`,
                          padding: '28px 32px',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            right: -60,
                            top: -80,
                            width: 260,
                            height: 260,
                            borderRadius: '50%',
                            background: 'rgba(108,99,255,.12)',
                            filter: 'blur(70px)',
                            pointerEvents: 'none',
                          }}
                        />
                        <div
                          className="rc-analysis-hero"
                          style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 32,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 12px',
                                borderRadius: 100,
                                border: '1px solid rgba(108,99,255,.25)',
                                background: 'rgba(108,99,255,.1)',
                                fontSize: 10,
                                fontFamily: MONO,
                                color: PURPLE,
                                letterSpacing: '.1em',
                                marginBottom: 14,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: VIOLET }} />
                              AI ANALYSIS COMPLETE
                            </div>
                            <h2 style={{ fontSize: 28, fontWeight: 800, color: TEXT, letterSpacing: '-0.02em' }}>
                              ATS Resume Analysis
                            </h2>
                            <p style={{ marginTop: 8, fontSize: 13, color: MUTE }}>
                              AI-powered evaluation of your resume
                            </p>
                            <p style={{ marginTop: 4, fontSize: 11, fontFamily: MONO, color: '#4c5080' }}>
                              {analysis.fileName}
                            </p>
                          </div>

                          <ArcGauge
                            pct={overallPct}
                            color={VIOLET}
                            size={168}
                            centerLabel={`${getOverallScore()}`}
                            centerSub={`/ ${getOverallMaxScore()} ATS SCORE`}
                          />
                        </div>
                      </div>

                      {/* SCORE BREAKDOWN */}
                      <div style={{ marginTop: 40 }}>
                        <p style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '.14em', color: CYAN, marginBottom: 6 }}>
                          ANALYTICS
                        </p>
                        <h3 style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>Score Breakdown</h3>
                        <p style={{ marginTop: 4, fontSize: 13, color: MUTE, marginBottom: 20 }}>
                          Detailed ATS scoring by category
                        </p>

                        <div className="rc-breakdown-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                          {scoreCategories.map(category => {
                            const percentage =
                              category.maxScore > 0
                                ? Math.min(100, Math.round((category.score / category.maxScore) * 100))
                                : 0

                            return (
                              <TiltCard
                                key={category.name}
                                style={{
                                  borderRadius: 16,
                                  border: '1px solid rgba(255,255,255,.07)',
                                  background: 'rgba(255,255,255,.02)',
                                  padding: 18,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#c9cdf0' }}>{category.name}</span>
                                  <span style={{ fontSize: 13, fontFamily: MONO, fontWeight: 700, color: PURPLE }}>
                                    {category.score}/{category.maxScore}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    marginTop: 18,
                                    height: 6,
                                    borderRadius: 100,
                                    background: 'rgba(255,255,255,.06)',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      height: '100%',
                                      borderRadius: 100,
                                      width: `${percentage}%`,
                                      background: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
                                      boxShadow: `0 0 12px rgba(108,99,255,.5)`,
                                      transition: 'width 1s cubic-bezier(.23,1,.32,1)',
                                    }}
                                  />
                                </div>
                                <div style={{ marginTop: 8, textAlign: 'right', fontSize: 10, fontFamily: MONO, color: '#4c5080' }}>
                                  {percentage}%
                                </div>
                              </TiltCard>
                            )
                          })}
                        </div>
                      </div>

                      {/* STATISTICS */}
                      <div style={{ marginTop: 40 }}>
                        <p style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '.14em', color: VIOLET, marginBottom: 6 }}>
                          RESUME TELEMETRY
                        </p>
                        <h3 style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 20 }}>
                          Resume Statistics
                        </h3>

                        <div className="rc-stats5-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
                          {[
                            ['Skills', statistics.skills],
                            ['Education', statistics.education],
                            ['Experience', statistics.experience],
                            ['Projects', statistics.projects],
                            ['Certifications', statistics.certifications],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              style={{
                                borderRadius: 16,
                                border: '1px solid rgba(108,99,255,.1)',
                                background: 'rgba(108,99,255,.04)',
                                padding: 18,
                              }}
                            >
                              <p style={{ fontSize: 9, fontFamily: MONO, letterSpacing: '.1em', color: '#4c5080', textTransform: 'uppercase' }}>
                                {label}
                              </p>
                              <p style={{ marginTop: 8, fontSize: 26, fontWeight: 800, color: TEXT }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* STRENGTHS / WEAKNESSES */}
                      <div className="rc-sw-grid" style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div
                          style={{
                            borderRadius: 18,
                            border: '1px solid rgba(52,211,153,.16)',
                            background: 'rgba(52,211,153,.035)',
                            padding: 22,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background: 'rgba(52,211,153,.1)',
                                color: GREEN,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                              }}
                            >
                              ✓
                            </div>
                            <div>
                              <p style={{ fontSize: 9, fontFamily: MONO, letterSpacing: '.1em', color: 'rgba(52,211,153,.7)' }}>
                                POSITIVE SIGNALS
                              </p>
                              <h3 style={{ fontSize: 15, fontWeight: 700, color: GREEN }}>Strengths</h3>
                            </div>
                          </div>

                          {strengths.length > 0 ? (
                            <ul style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0 }}>
                              {strengths.map((strength, index) => (
                                <li
                                  key={`strength-${index}`}
                                  style={{
                                    display: 'flex',
                                    gap: 10,
                                    borderRadius: 12,
                                    border: '1px solid rgba(52,211,153,.1)',
                                    background: 'rgba(52,211,153,.025)',
                                    padding: 12,
                                    fontSize: 13,
                                    color: '#b8e8d4',
                                  }}
                                >
                                  <span style={{ color: GREEN }}>+</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(52,211,153,.6)' }}>
                              No strengths detected.
                            </p>
                          )}
                        </div>

                        <div
                          style={{
                            borderRadius: 18,
                            border: '1px solid rgba(239,68,68,.16)',
                            background: 'rgba(239,68,68,.035)',
                            padding: 22,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background: 'rgba(239,68,68,.1)',
                                color: '#fca5a5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                              }}
                            >
                              !
                            </div>
                            <div>
                              <p style={{ fontSize: 9, fontFamily: MONO, letterSpacing: '.1em', color: 'rgba(239,68,68,.7)' }}>
                                RISK SIGNALS
                              </p>
                              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fca5a5' }}>Weaknesses</h3>
                            </div>
                          </div>

                          {weaknesses.length > 0 ? (
                            <ul style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0 }}>
                              {weaknesses.map((weakness, index) => (
                                <li
                                  key={`weakness-${index}`}
                                  style={{
                                    display: 'flex',
                                    gap: 10,
                                    borderRadius: 12,
                                    border: '1px solid rgba(239,68,68,.1)',
                                    background: 'rgba(239,68,68,.025)',
                                    padding: 12,
                                    fontSize: 13,
                                    color: '#f3c9c9',
                                  }}
                                >
                                  <span style={{ color: RED }}>!</span>
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(239,68,68,.6)' }}>
                              No major weaknesses detected.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* SUGGESTIONS */}
                      <div
                        style={{
                          marginTop: 16,
                          borderRadius: 18,
                          border: '1px solid rgba(0,212,255,.16)',
                          background: 'rgba(0,212,255,.035)',
                          padding: 22,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: 'rgba(0,212,255,.1)',
                              color: CYAN,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            ✦
                          </div>
                          <div>
                            <p style={{ fontSize: 9, fontFamily: MONO, letterSpacing: '.1em', color: 'rgba(0,212,255,.7)' }}>
                              OPTIMIZATION ENGINE
                            </p>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: CYAN }}>AI Suggestions</h3>
                          </div>
                        </div>

                        {suggestions.length > 0 ? (
                          <div className="rc-suggestion-grid" style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {suggestions.map((suggestion, index) => (
                              <div
                                key={`suggestion-${index}`}
                                style={{
                                  display: 'flex',
                                  gap: 10,
                                  borderRadius: 12,
                                  border: '1px solid rgba(0,212,255,.1)',
                                  background: 'rgba(0,212,255,.025)',
                                  padding: 14,
                                  fontSize: 13,
                                  color: '#bfeaf5',
                                }}
                              >
                                <span style={{ fontFamily: MONO, fontWeight: 700, color: CYAN }}>
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(0,212,255,.6)' }}>
                            No suggestions available.
                          </p>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              </TiltCard>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default ResumePage