import { useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/* =========================================================
   MATCH RESULT
   ========================================================= */

interface MatchResult {
  matchScore?: number
  summary?: string

  matchedSkills?: string[]
  missingSkills?: string[]

  matchedKeywords?: string[]
  missingKeywords?: string[]

  strengths?: string[]
  recommendations?: string[]
}

/* =========================================================
   TAILORED RESUME
   ========================================================= */

interface TailoredResume {
  name?: string
  email?: string
  phone?: string
  location?: string

  headline?: string
  summary?: string

  skills?: string[]
  education?: string[]
  experience?: string[]
  projects?: string[]
  certifications?: string[]
}

/* =========================================================
   PAGE STATE
   ========================================================= */

interface TailoringState {
  resumeId?: string
  jobDescription?: string
  matchResult?: MatchResult | null
}

/* =========================================================
   API RESPONSE
   ========================================================= */

interface TailoringResponse {
  success: boolean
  message?: string
  data?: TailoredResume
}

/* =========================================================
   API URL
   ========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000'

/* =========================================================
   AMBIENT KEYFRAMES + GLOBAL LOOK
   (same dark 3D theme used across CareerCraft AI pages)
   ========================================================= */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .rtp-root, .rtp-root * { box-sizing: border-box; }
    .rtp-root {
      font-family: 'Outfit', sans-serif;
      background: #03040e;
      color: #e8eaf6;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    .rtp-mono { font-family: 'JetBrains Mono', monospace; }

    @keyframes rtpFadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes rtpSpin {
      to { transform: rotate(360deg); }
    }
    @keyframes rtpScanH {
      from { transform: translateY(-100%); }
      to   { transform: translateY(100vh); }
    }

    .rtp-tilt {
      transition: transform .4s cubic-bezier(.23,1,.32,1), box-shadow .4s ease;
      transform-style: preserve-3d;
    }
    .rtp-spin { animation: rtpSpin 0.9s linear infinite; }

    .rtp-scroll { scrollbar-width: thin; scrollbar-color: rgba(108,99,255,.4) transparent; }
    .rtp-scroll::-webkit-scrollbar { width: 6px; }
    .rtp-scroll::-webkit-scrollbar-thumb { background: rgba(108,99,255,.4); border-radius: 4px; }
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
      className={`rtp-tilt ${className}`}
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
          animation: 'rtpScanH 8s linear infinite',
        }}
      />
    </div>
  )
}

/* =========================================================
   PAGE
   ========================================================= */

function ResumeTailoringPage() {
  const navigate = useNavigate()
  const location = useLocation()

  /* =======================================================
     PAGE STATE
     ======================================================= */

  const state =
    (location.state as TailoringState | null) || null

  const resumeId =
    state?.resumeId?.trim() || ''

  const jobDescription =
    state?.jobDescription?.trim() || ''

  const matchResult =
    state?.matchResult || null

  /* =======================================================
     LOCAL STATE
     ======================================================= */

  const [isGenerating, setIsGenerating] =
    useState(false)

  const [tailoredResume, setTailoredResume] =
    useState<TailoredResume | null>(null)

  const [error, setError] =
    useState('')

  const [isDownloading, setIsDownloading] =
    useState(false)

  /* =======================================================
     PDF REF
     ======================================================= */

  const resumePdfRef =
    useRef<HTMLDivElement | null>(null)

  /* =======================================================
     GENERATE TAILORED RESUME
     ======================================================= */

  const handleGenerateTailoredResume =
    async (): Promise<void> => {
      if (!resumeId) {
        setError(
          'Resume ID is missing. Please go back and select a resume.',
        )
        return
      }

      if (!jobDescription) {
        setError(
          'Job description is missing. Please go back and provide the job description.',
        )
        return
      }

      if (!matchResult) {
        setError(
          'Resume match analysis is missing. Please analyze the resume first.',
        )
        return
      }

      const token =
        localStorage.getItem('token')

      if (!token) {
        setError(
          'Authentication token is missing. Please log in again.',
        )
        return
      }

      setError('')
      setTailoredResume(null)
      setIsGenerating(true)

      try {
        console.log(
          '==============================================',
        )
        console.log(
          '🚀 CAREERCRAFT AI - RESUME TAILORING',
        )
        console.log(
          '==============================================',
        )

        console.log(
          'API URL:',
          API_URL,
        )

        console.log(
          'Endpoint:',
          `${API_URL}/api/tailoring/generate`,
        )

        console.log(
          'Resume ID:',
          resumeId,
        )

        const response =
          await fetch(
            `${API_URL}/api/tailoring/generate`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              credentials: 'include',

              body: JSON.stringify({
                resumeId,
                jobDescription,
                matchResult,
              }),
            },
          )

        console.log(
          'Tailoring HTTP Status:',
          response.status,
        )

        const responseText =
          await response.text()

        console.log(
          'Raw tailoring response:',
          responseText,
        )

        let result: TailoringResponse

        try {
          result =
            JSON.parse(
              responseText,
            ) as TailoringResponse
        } catch {
          throw new Error(
            `Backend returned an invalid response. HTTP status: ${response.status}`,
          )
        }

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            'token',
          )

          throw new Error(
            result.message ||
              'Your authentication session has expired. Please log in again.',
          )
        }

        if (!response.ok) {
          throw new Error(
            result.message ||
              `Tailoring request failed with HTTP ${response.status}`,
          )
        }

        if (!result.success) {
          throw new Error(
            result.message ||
              'Resume tailoring failed.',
          )
        }

        if (!result.data) {
          throw new Error(
            'Backend successfully completed the request but returned no tailored resume.',
          )
        }

        setTailoredResume(
          result.data,
        )

        console.log(
          '✅ TAILORED RESUME GENERATED',
          result.data,
        )
      } catch (
        error: unknown
      ) {
        console.error(
          '❌ RESUME TAILORING FAILED',
          error,
        )

        if (
          error instanceof TypeError
        ) {
          setError(
            'Unable to connect to the backend. Make sure the CareerCraft AI backend is running on port 5000.',
          )
        } else if (
          error instanceof Error
        ) {
          setError(
            error.message ||
              'Failed to generate tailored resume.',
          )
        } else {
          setError(
            'Failed to generate tailored resume.',
          )
        }
      } finally {
        setIsGenerating(false)
      }
    }

  /* =======================================================
     PDF EXPORT
     ======================================================= */

  const handleDownloadPDF =
    async (): Promise<void> => {
      if (!tailoredResume) {
        setError(
          'Please generate the tailored resume first.',
        )
        return
      }

      if (!resumePdfRef.current) {
        setError(
          'Unable to find the generated resume for PDF export.',
        )
        return
      }

      setError('')
      setIsDownloading(true)

      let pdfContainer:
        HTMLDivElement | null = null

      try {
        console.log(
          '==============================================',
        )

        console.log(
          '📄 CAREERCRAFT AI - PDF EXPORT',
        )

        console.log(
          '==============================================',
        )

        /*
         * IMPORTANT:
         *
         * Do NOT directly screenshot the Tailwind
         * element because modern Tailwind can generate
         * colors using oklch().
         *
         * html2canvas may fail with:
         *
         * "Attempting to parse an unsupported color
         * function 'oklch'"
         *
         * Therefore we create a completely separate
         * PDF-safe HTML document using only RGB colors.
         */

        pdfContainer =
          document.createElement('div')

        pdfContainer.style.position =
          'fixed'

        pdfContainer.style.left =
          '-100000px'

        pdfContainer.style.top =
          '0'

        pdfContainer.style.width =
          '794px'

        pdfContainer.style.backgroundColor =
          '#ffffff'

        pdfContainer.style.color =
          '#111827'

        pdfContainer.style.padding =
          '48px'

        pdfContainer.style.boxSizing =
          'border-box'

        pdfContainer.style.fontFamily =
          'Arial, Helvetica, sans-serif'

        pdfContainer.style.fontSize =
          '14px'

        pdfContainer.style.lineHeight =
          '1.6'

        /*
         * ---------------------------------------------------
         * HEADER
         * ---------------------------------------------------
         */

        const header =
          document.createElement('div')

        header.style.borderBottom =
          '2px solid #d1d5db'

        header.style.paddingBottom =
          '20px'

        header.style.marginBottom =
          '28px'

        pdfContainer.appendChild(
          header,
        )

        const name =
          document.createElement('h1')

        name.textContent =
          tailoredResume.name ||
          'Candidate Name'

        name.style.margin =
          '0'

        name.style.fontSize =
          '30px'

        name.style.fontWeight =
          '700'

        name.style.lineHeight =
          '1.2'

        name.style.color =
          '#111827'

        header.appendChild(
          name,
        )

        if (
          tailoredResume.headline
        ) {
          const headline =
            document.createElement('p')

          headline.textContent =
            tailoredResume.headline

          headline.style.margin =
            '8px 0 0 0'

          headline.style.fontSize =
            '17px'

          headline.style.fontWeight =
            '600'

          headline.style.color =
            '#2563eb'

          header.appendChild(
            headline,
          )
        }

        /*
         * CONTACT INFORMATION
         */

        const contact =
          document.createElement('div')

        contact.style.display =
          'flex'

        contact.style.flexWrap =
          'wrap'

        contact.style.gap =
          '8px 24px'

        contact.style.marginTop =
          '14px'

        contact.style.fontSize =
          '12px'

        contact.style.color =
          '#4b5563'

        header.appendChild(
          contact,
        )

        const contactItems = [
          tailoredResume.email,
          tailoredResume.phone,
          tailoredResume.location,
        ].filter(
          Boolean,
        ) as string[]

        contactItems.forEach(
          (item) => {
            const span =
              document.createElement(
                'span',
              )

            span.textContent =
              item

            contact.appendChild(
              span,
            )
          },
        )

        /*
         * ---------------------------------------------------
         * SECTION HELPER
         * ---------------------------------------------------
         */

        const addSectionTitle =
          (
            title: string,
          ) => {
            const heading =
              document.createElement(
                'h2',
              )

            heading.textContent =
              title

            heading.style.margin =
              '28px 0 10px 0'

            heading.style.fontSize =
              '16px'

            heading.style.fontWeight =
              '700'

            heading.style.textTransform =
              'uppercase'

            heading.style.letterSpacing =
              '0.6px'

            heading.style.color =
              '#111827'

            heading.style.borderBottom =
              '1px solid #e5e7eb'

            heading.style.paddingBottom =
              '5px'

            pdfContainer!.appendChild(
              heading,
            )
          }

        /*
         * ---------------------------------------------------
         * SUMMARY
         * ---------------------------------------------------
         */

        if (
          tailoredResume.summary
        ) {
          addSectionTitle(
            'Professional Summary',
          )

          const summary =
            document.createElement('p')

          summary.textContent =
            tailoredResume.summary

          summary.style.margin =
            '0'

          summary.style.fontSize =
            '13px'

          summary.style.lineHeight =
            '1.7'

          summary.style.color =
            '#374151'

          pdfContainer.appendChild(
            summary,
          )
        }

        /*
         * ---------------------------------------------------
         * SKILLS
         * ---------------------------------------------------
         */

        if (
          tailoredResume.skills &&
          tailoredResume.skills.length > 0
        ) {
          addSectionTitle(
            'Skills',
          )

          const skillsContainer =
            document.createElement('div')

          skillsContainer.style.display =
            'flex'

          skillsContainer.style.flexWrap =
            'wrap'

          skillsContainer.style.gap =
            '6px'

          tailoredResume.skills.forEach(
            (skill) => {
              const skillElement =
                document.createElement(
                  'span',
                )

              skillElement.textContent =
                skill

              skillElement.style.display =
                'inline-block'

              skillElement.style.padding =
                '5px 9px'

              skillElement.style.border =
                '1px solid #bfdbfe'

              skillElement.style.borderRadius =
                '5px'

              skillElement.style.backgroundColor =
                '#eff6ff'

              skillElement.style.color =
                '#1e40af'

              skillElement.style.fontSize =
                '12px'

              skillElement.style.fontWeight =
                '600'

              skillsContainer.appendChild(
                skillElement,
              )
            },
          )

          pdfContainer.appendChild(
            skillsContainer,
          )
        }

        /*
         * ---------------------------------------------------
         * LIST SECTION HELPER
         * ---------------------------------------------------
         */

        const addListSection =
          (
            title: string,
            items?: string[],
          ) => {
            if (
              !items ||
              items.length === 0
            ) {
              return
            }

            addSectionTitle(
              title,
            )

            const list =
              document.createElement(
                'div',
              )

            list.style.display =
              'flex'

            list.style.flexDirection =
              'column'

            list.style.gap =
              '8px'

            items.forEach(
              (item) => {
                const row =
                  document.createElement(
                    'div',
                  )

                row.style.display =
                  'flex'

                row.style.gap =
                  '8px'

                row.style.fontSize =
                  '13px'

                row.style.lineHeight =
                  '1.6'

                row.style.color =
                  '#374151'

                const bullet =
                  document.createElement(
                    'span',
                  )

                bullet.textContent =
                  '•'

                bullet.style.fontWeight =
                  '700'

                bullet.style.color =
                  '#2563eb'

                const text =
                  document.createElement(
                    'span',
                  )

                text.textContent =
                  item

                row.appendChild(
                  bullet,
                )

                row.appendChild(
                  text,
                )

                list.appendChild(
                  row,
                )
              },
            )

            pdfContainer!.appendChild(
              list,
            )
          }

        /*
         * ---------------------------------------------------
         * EXPERIENCE
         * ---------------------------------------------------
         */

        addListSection(
          'Experience',
          tailoredResume.experience,
        )

        /*
         * ---------------------------------------------------
         * PROJECTS
         * ---------------------------------------------------
         */

        addListSection(
          'Projects',
          tailoredResume.projects,
        )

        /*
         * ---------------------------------------------------
         * EDUCATION
         * ---------------------------------------------------
         */

        addListSection(
          'Education',
          tailoredResume.education,
        )

        /*
         * ---------------------------------------------------
         * CERTIFICATIONS
         * ---------------------------------------------------
         */

        addListSection(
          'Certifications',
          tailoredResume.certifications,
        )

        /*
         * ---------------------------------------------------
         * ADD TO DOCUMENT
         * ---------------------------------------------------
         */

        document.body.appendChild(
          pdfContainer,
        )

        /*
         * Allow browser to render the hidden
         * PDF document before html2canvas.
         */

        await new Promise<void>(
          (resolve) => {
            requestAnimationFrame(
              () => {
                requestAnimationFrame(
                  () => {
                    resolve()
                  },
                )
              },
            )
          },
        )

        /*
         * ---------------------------------------------------
         * CANVAS
         * ---------------------------------------------------
         */

        const canvas =
          await html2canvas(
            pdfContainer,
            {
              scale: 2,

              useCORS: true,

              backgroundColor:
                '#ffffff',

              logging: false,

              allowTaint: false,

              imageTimeout: 15000,

              width:
                pdfContainer.scrollWidth,

              height:
                pdfContainer.scrollHeight,

              windowWidth:
                pdfContainer.scrollWidth,

              windowHeight:
                pdfContainer.scrollHeight,
            },
          )

        /*
         * ---------------------------------------------------
         * CREATE PDF
         * ---------------------------------------------------
         */

        const pdf =
          new jsPDF({
            orientation:
              'portrait',

            unit:
              'mm',

            format:
              'a4',

            compress:
              true,
          })

        const pageWidth =
          pdf.internal.pageSize.getWidth()

        const pageHeight =
          pdf.internal.pageSize.getHeight()

        const margin =
          10

        const usableWidth =
          pageWidth -
          margin * 2

        const usableHeight =
          pageHeight -
          margin * 2

        /*
         * Image dimensions
         */

        const imageWidth =
          canvas.width

        const imageHeight =
          canvas.height

        const imageRatio =
          usableWidth /
          imageWidth

        const fullImageHeight =
          imageHeight *
          imageRatio

        /*
         * ---------------------------------------------------
         * MULTI-PAGE PDF
         * ---------------------------------------------------
         *
         * Instead of putting the complete huge image on
         * every page, crop the canvas page by page.
         *
         * This gives much more reliable pagination.
         */

        const pagePixelHeight =
          Math.floor(
            usableHeight /
              imageRatio,
          )

        let sourceY =
          0

        let pageNumber =
          0

        while (
          sourceY <
          imageHeight
        ) {
          const remainingHeight =
            imageHeight -
            sourceY

          const currentPageHeight =
            Math.min(
              pagePixelHeight,
              remainingHeight,
            )

          const pageCanvas =
            document.createElement(
              'canvas',
            )

          pageCanvas.width =
            imageWidth

          pageCanvas.height =
            currentPageHeight

          const pageContext =
            pageCanvas.getContext(
              '2d',
            )

          if (!pageContext) {
            throw new Error(
              'Unable to create PDF page canvas.',
            )
          }

          pageContext.fillStyle =
            '#ffffff'

          pageContext.fillRect(
            0,
            0,
            pageCanvas.width,
            pageCanvas.height,
          )

          pageContext.drawImage(
            canvas,

            0,
            sourceY,

            imageWidth,
            currentPageHeight,

            0,
            0,

            imageWidth,
            currentPageHeight,
          )

          const pageImage =
            pageCanvas.toDataURL(
              'image/png',
              1.0,
            )

          const currentPageHeightMM =
            currentPageHeight *
            imageRatio

          if (
            pageNumber > 0
          ) {
            pdf.addPage()
          }

          pdf.addImage(
            pageImage,
            'PNG',
            margin,
            margin,
            usableWidth,
            currentPageHeightMM,
          )

          sourceY +=
            currentPageHeight

          pageNumber +=
            1
        }

        /*
         * ---------------------------------------------------
         * FILE NAME
         * ---------------------------------------------------
         */

        const candidateName =
          tailoredResume.name
            ?.trim()
            .replace(
              /[^a-zA-Z0-9]+/g,
              '_',
            )
            .replace(
              /^_+|_+$/g,
              '',
            ) ||
          'Candidate'

        const fileName =
          `${candidateName}_Tailored_Resume.pdf`

        /*
         * ---------------------------------------------------
         * DOWNLOAD
         * ---------------------------------------------------
         */

        pdf.save(
          fileName,
        )

        console.log(
          '✅ PDF downloaded:',
          fileName,
        )

        console.log(
          'PDF pages:',
          pageNumber,
        )
      } catch (
        error: unknown
      ) {
        console.error(
          '❌ PDF generation failed:',
          error,
        )

        if (
          error instanceof Error
        ) {
          console.error(
            'PDF error message:',
            error.message,
          )
        }

        setError(
          'Failed to generate the PDF. Please try again. If the problem continues, refresh the page and generate the resume again.',
        )
      } finally {
        /*
         * Always remove the temporary PDF DOM.
         */

        if (
          pdfContainer &&
          pdfContainer.parentNode
        ) {
          pdfContainer.parentNode.removeChild(
            pdfContainer,
          )
        }

        setIsDownloading(false)
      }
    }

  /* =======================================================
     GENERATE AGAIN
     ======================================================= */

  const handleGenerateAgain =
    (): void => {
      setTailoredResume(null)
      setError('')
    }

  /* =======================================================
     ARRAY RENDERER
     ======================================================= */

  const renderList = (
    items?: string[],
  ) => {
    if (
      !items ||
      items.length === 0
    ) {
      return (
        <p className="text-sm" style={{ color: '#6b6f99' }}>
          No information available.
        </p>
      )
    }

    return (
      <div className="flex flex-col gap-2">
        {items.map(
          (item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-lg px-3.5 py-3 text-sm leading-6"
              style={{
                background: 'rgba(255,255,255,.025)',
                border: '1px solid rgba(108,99,255,.14)',
                borderLeft: '2px solid rgba(108,99,255,.7)',
                color: '#c5c9e8',
              }}
            >
              {item}
            </div>
          ),
        )}
      </div>
    )
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="rtp-root">
      <GlobalStyle />
      <Backdrop />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* =================================================
            HEADER
            ================================================= */}

        <header
          className="sticky top-0 z-20 backdrop-blur"
          style={{ borderBottom: '1px solid rgba(108,99,255,.14)', background: 'rgba(3,4,14,.85)' }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={isGenerating || isDownloading}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
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
                <p className="rtp-mono text-xs" style={{ color: '#6b6f99' }}>
                  AI Resume Tailoring
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/resume-jd-matching',
                )
              }
              disabled={
                isGenerating ||
                isDownloading
              }
              className="rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'transparent',
                color: '#9da0c4',
                border: '1px solid rgba(108,99,255,.28)',
              }}
            >
              ← Back to Matching
            </button>

          </div>
        </header>

        {/* =================================================
            MAIN
            ================================================= */}

        <main className="mx-auto max-w-7xl px-6 py-10">

          {/* =================================================
              TITLE
              ================================================= */}

          <div className="mb-8" style={{ animation: 'rtpFadeUp .6s both' }}>
            <div
              className="rtp-mono mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wider"
              style={{
                background: 'rgba(108,99,255,.1)',
                border: '1px solid rgba(108,99,255,.3)',
                color: '#a5a0ff',
              }}
            >
              <span>✦</span>
              AI Career Tool
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
              Tailor Your Resume
            </h2>

            <p className="mt-3 max-w-3xl text-base leading-7" style={{ color: '#6b6f99' }}>
              CareerCraft AI will use your original resume, the job description,
              and your Resume ↔ JD analysis to create a tailored version for this
              position.
            </p>
          </div>

          {/* =================================================
              ERROR
              ================================================= */}

          {error && (

            <div
              className="mb-8 rounded-xl p-5"
              style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>

                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: '#fca5a5' }}>
                    Operation failed
                  </h3>

                  <p className="mt-1 text-sm leading-6" style={{ color: '#f8b4b4' }}>
                    {error}
                  </p>

                  {error.toLowerCase().includes('log in') && (
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
                      style={{ background: '#ef4444', border: 'none' }}
                    >
                      Go to Login
                    </button>
                  )}
                </div>
              </div>
            </div>

          )}

          {/* =================================================
              INPUT INFORMATION
              ================================================= */}

          {!tailoredResume && (

            <div className="grid gap-6 lg:grid-cols-2">

              {/* RESUME */}

              <TiltCard
                className="p-6"
                style={{
                  borderRadius: 20,
                  background: 'linear-gradient(150deg,rgba(13,15,31,.97),rgba(108,99,255,.05))',
                  animation: 'rtpFadeUp .6s .05s both',
                }}
              >
                <h3 className="text-xl font-semibold" style={{ color: '#e8eaf6' }}>
                  Selected Resume
                </h3>

                <div
                  className="mt-5 rounded-xl p-5"
                  style={{ background: 'rgba(108,99,255,.08)', border: '1px solid rgba(108,99,255,.25)' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ background: 'rgba(108,99,255,.15)' }}
                    >
                      📄
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: '#e8eaf6' }}>
                        Resume selected
                      </p>
                      <p className="mt-1 break-all text-xs" style={{ color: '#a5a0ff' }}>
                        Resume ID: {resumeId || 'Not available'}
                      </p>
                    </div>
                  </div>
                </div>

                {matchResult && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold" style={{ color: '#e8eaf6' }}>
                      Current Match
                    </h4>

                    <div
                      className="mt-3 rounded-xl p-5"
                      style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}
                    >
                      <div className="text-center">
                        <p className="text-sm font-medium" style={{ color: '#6b6f99' }}>
                          Resume Compatibility
                        </p>

                        <p
                          className="mt-2 text-5xl font-extrabold"
                          style={{
                            background: 'linear-gradient(110deg,#6c63ff,#00d4ff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {matchResult.matchScore ?? 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TiltCard>

              {/* JOB DESCRIPTION */}

              <TiltCard
                accent="0,212,255"
                className="p-6"
                style={{
                  borderRadius: 20,
                  background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(0,212,255,.04))',
                  animation: 'rtpFadeUp .6s .1s both',
                }}
              >
                <h3 className="text-xl font-semibold" style={{ color: '#e8eaf6' }}>
                  Job Description
                </h3>

                <p className="mt-1 text-sm" style={{ color: '#6b6f99' }}>
                  This is the job description used for your Resume ↔ JD analysis.
                </p>

                <div
                  className="rtp-scroll mt-5 max-h-[420px] overflow-y-auto rounded-xl p-5"
                  style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}
                >
                  {jobDescription ? (
                    <p className="whitespace-pre-wrap text-sm leading-6" style={{ color: '#c5c9e8' }}>
                      {jobDescription}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: '#6b6f99' }}>
                      Job description was not received.
                    </p>
                  )}
                </div>
              </TiltCard>

            </div>

          )}

          {/* =================================================
              MATCH ANALYSIS
              ================================================= */}

          {!tailoredResume &&
            matchResult && (

              <TiltCard
                className="mt-6 p-6"
                style={{
                  borderRadius: 20,
                  background: 'linear-gradient(150deg,rgba(13,15,31,.97),rgba(108,99,255,.04))',
                }}
              >
                <h3 className="text-xl font-semibold" style={{ color: '#e8eaf6' }}>
                  What AI Will Improve
                </h3>

                <p className="mt-1 text-sm" style={{ color: '#6b6f99' }}>
                  These findings come directly from your Resume ↔ JD analysis.
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">

                  {/* MISSING SKILLS */}

                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.28)' }}
                  >
                    <h4 className="font-semibold" style={{ color: '#f87171' }}>
                      Missing Skills
                    </h4>

                    {matchResult.missingSkills &&
                    matchResult.missingSkills.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-2">
                        {matchResult.missingSkills.map(
                          (skill, index) => (
                            <p key={`${skill}-${index}`} className="text-sm" style={{ color: '#fca5a5' }}>
                              • {skill}
                            </p>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm" style={{ color: '#f8b4b4' }}>
                        No major missing skills identified.
                      </p>
                    )}
                  </div>

                  {/* MISSING KEYWORDS */}

                  <div
                    className="rounded-xl p-5"
                    style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.28)' }}
                  >
                    <h4 className="font-semibold" style={{ color: '#f59e0b' }}>
                      Missing Keywords
                    </h4>

                    {matchResult.missingKeywords &&
                    matchResult.missingKeywords.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-2">
                        {matchResult.missingKeywords.map(
                          (keyword, index) => (
                            <p key={`${keyword}-${index}`} className="text-sm" style={{ color: '#fbbf24' }}>
                              • {keyword}
                            </p>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm" style={{ color: '#fcd34d' }}>
                        No major missing keywords identified.
                      </p>
                    )}
                  </div>

                </div>

                {matchResult.recommendations &&
                  matchResult.recommendations.length > 0 && (

                    <div
                      className="mt-6 rounded-xl p-5"
                      style={{ background: 'rgba(108,99,255,.08)', border: '1px solid rgba(108,99,255,.25)' }}
                    >
                      <h4 className="font-semibold" style={{ color: '#a5a0ff' }}>
                        AI Recommendations
                      </h4>

                      <div className="mt-3 flex flex-col gap-3">
                        {matchResult.recommendations.map(
                          (recommendation, index) => (
                            <div
                              key={index}
                              className="flex gap-3 text-sm leading-6"
                              style={{ color: '#c5c9e8' }}
                            >
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                style={{ background: 'rgba(108,99,255,.2)', color: '#a5a0ff' }}
                              >
                                {index + 1}
                              </span>
                              <span>{recommendation}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                  )}

              </TiltCard>

            )}

          {/* =================================================
              GENERATE SECTION
              ================================================= */}

          {!tailoredResume && (

            <TiltCard
              accent="167,139,250"
              className="mt-6 overflow-hidden"
              style={{
                borderRadius: 20,
                background: 'linear-gradient(150deg,rgba(13,15,31,.98),rgba(167,139,250,.08))',
              }}
            >
              <div className="p-8 text-center">

                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                  style={{
                    background: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
                    boxShadow: '0 8px 28px rgba(108,99,255,.4)',
                  }}
                >
                  ✨
                </div>

                <h3 className="mt-5 text-2xl font-bold" style={{ color: '#e8eaf6' }}>
                  AI Resume Tailoring
                </h3>

                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6" style={{ color: '#9da0c4' }}>
                  Your resume, job description, and match analysis are ready.
                  Gemini will rewrite your resume while preserving your real
                  experience and qualifications.
                </p>

                <button
                  type="button"
                  onClick={handleGenerateTailoredResume}
                  disabled={
                    isGenerating ||
                    !resumeId ||
                    !jobDescription ||
                    !matchResult
                  }
                  className="mt-6 rounded-xl px-8 py-3.5 text-sm font-bold text-white transition disabled:cursor-not-allowed"
                  style={{
                    background:
                      isGenerating || !resumeId || !jobDescription || !matchResult
                        ? 'rgba(108,99,255,.3)'
                        : 'linear-gradient(135deg,#6c63ff,#a78bfa)',
                    border: 'none',
                    boxShadow:
                      isGenerating || !resumeId || !jobDescription || !matchResult
                        ? 'none'
                        : '0 12px 36px rgba(108,99,255,.4)',
                  }}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-3">
                      <span
                        className="rtp-spin h-5 w-5 rounded-full"
                        style={{ border: '2px solid rgba(255,255,255,.25)', borderTopColor: '#fff' }}
                      />
                      Generating Tailored Resume...
                    </span>
                  ) : (
                    <>✨ Generate Tailored Resume</>
                  )}
                </button>

                <p className="mt-3 text-xs" style={{ color: '#6b6f99' }}>
                  AI will tailor your existing resume to this specific job
                  description.
                </p>

              </div>
            </TiltCard>

          )}

          {/* =================================================
              GENERATED RESUME
              ================================================= */}

          {tailoredResume && (

            <TiltCard
              accent="0,212,255"
              className="overflow-hidden"
              style={{
                borderRadius: 20,
                background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(0,212,255,.04))',
              }}
            >

              {/* GENERATED HEADER */}

              <div
                className="p-8"
                style={{
                  borderBottom: '1px solid rgba(0,212,255,.14)',
                  background: 'linear-gradient(160deg,rgba(0,212,255,.07),transparent 70%)',
                }}
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                  <div>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                        style={{
                          background: 'linear-gradient(135deg,#6c63ff,#00d4ff)',
                          boxShadow: '0 8px 24px rgba(0,212,255,.35)',
                        }}
                      >
                        ✨
                      </div>

                      <div>
                        <p
                          className="rtp-mono text-[11px] font-semibold tracking-wider"
                          style={{ color: '#00d4ff' }}
                        >
                          AI GENERATED
                        </p>
                        <h3 className="text-2xl font-bold" style={{ color: '#e8eaf6' }}>
                          Tailored Resume
                        </h3>
                      </div>
                    </div>

                    <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: '#9da0c4' }}>
                      This resume has been optimized for the supplied job
                      description using your original resume and match analysis.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAgain}
                    disabled={isDownloading}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: 'transparent',
                      color: '#9da0c4',
                      border: '1px solid rgba(108,99,255,.28)',
                    }}
                  >
                    ← Generate Again
                  </button>

                </div>
              </div>

              {/* =================================================
                  RESUME DISPLAY
                  ================================================= */}

              <div
                ref={resumePdfRef}
                className="p-8"
                style={{ background: 'rgba(255,255,255,.015)' }}
              >

                {/* PERSONAL INFORMATION */}

                <div className="pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  <h1 className="text-3xl font-bold" style={{ color: '#e8eaf6' }}>
                    {tailoredResume.name || 'Candidate Name'}
                  </h1>

                  {tailoredResume.headline && (
                    <p className="mt-2 text-lg font-medium" style={{ color: '#00d4ff' }}>
                      {tailoredResume.headline}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: '#9da0c4' }}>
                    {tailoredResume.email && <span>{tailoredResume.email}</span>}
                    {tailoredResume.phone && <span>{tailoredResume.phone}</span>}
                    {tailoredResume.location && <span>{tailoredResume.location}</span>}
                  </div>
                </div>

                {/* SUMMARY */}

                {tailoredResume.summary && (
                  <div className="mt-8">
                    <h3
                      className="rtp-mono text-sm font-bold tracking-wider"
                      style={{ color: '#e8eaf6' }}
                    >
                      PROFESSIONAL SUMMARY
                    </h3>
                    <p className="mt-3 text-sm leading-7" style={{ color: '#c5c9e8' }}>
                      {tailoredResume.summary}
                    </p>
                  </div>
                )}

                {/* SKILLS */}

                <div className="mt-8">
                  <h3
                    className="rtp-mono text-sm font-bold tracking-wider"
                    style={{ color: '#e8eaf6' }}
                  >
                    SKILLS
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {tailoredResume.skills &&
                    tailoredResume.skills.length > 0 ? (
                      tailoredResume.skills.map(
                        (skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium"
                            style={{ background: 'rgba(0,212,255,.1)', color: '#7fe3ff', border: '1px solid rgba(0,212,255,.28)' }}
                          >
                            {skill}
                          </span>
                        ),
                      )
                    ) : (
                      <p className="text-sm" style={{ color: '#6b6f99' }}>
                        No skills available.
                      </p>
                    )}
                  </div>
                </div>

                {/* EXPERIENCE */}

                <div className="mt-8">
                  <h3
                    className="rtp-mono text-sm font-bold tracking-wider"
                    style={{ color: '#e8eaf6' }}
                  >
                    EXPERIENCE
                  </h3>
                  <div className="mt-4">
                    {renderList(tailoredResume.experience)}
                  </div>
                </div>

                {/* PROJECTS */}

                <div className="mt-8">
                  <h3
                    className="rtp-mono text-sm font-bold tracking-wider"
                    style={{ color: '#e8eaf6' }}
                  >
                    PROJECTS
                  </h3>
                  <div className="mt-4">
                    {renderList(tailoredResume.projects)}
                  </div>
                </div>

                {/* EDUCATION */}

                <div className="mt-8">
                  <h3
                    className="rtp-mono text-sm font-bold tracking-wider"
                    style={{ color: '#e8eaf6' }}
                  >
                    EDUCATION
                  </h3>
                  <div className="mt-4">
                    {renderList(tailoredResume.education)}
                  </div>
                </div>

                {/* CERTIFICATIONS */}

                {tailoredResume.certifications &&
                  tailoredResume.certifications.length > 0 && (
                    <div className="mt-8">
                      <h3
                        className="rtp-mono text-sm font-bold tracking-wider"
                        style={{ color: '#e8eaf6' }}
                      >
                        CERTIFICATIONS
                      </h3>
                      <div className="mt-4">
                        {renderList(tailoredResume.certifications)}
                      </div>
                    </div>
                  )}

              </div>

              {/* =================================================
                  FOOTER
                  ================================================= */}

              <div
                className="p-6"
                style={{ borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.015)' }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div>
                    <p className="font-semibold" style={{ color: '#e8eaf6' }}>
                      Resume tailoring complete 🎉
                    </p>
                    <p className="mt-1 text-sm" style={{ color: '#6b6f99' }}>
                      Review the generated resume before using it for your
                      application.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">

                    {/* DOWNLOAD PDF */}

                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="rounded-xl px-6 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed"
                      style={{
                        background: isDownloading ? 'rgba(52,211,153,.35)' : 'linear-gradient(135deg,#34d399,#10b981)',
                        border: 'none',
                        boxShadow: isDownloading ? 'none' : '0 12px 32px rgba(52,211,153,.35)',
                      }}
                    >
                      {isDownloading ? (
                        <span className="flex items-center gap-3">
                          <span
                            className="rtp-spin h-4 w-4 rounded-full"
                            style={{ border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff' }}
                          />
                          Creating PDF...
                        </span>
                      ) : (
                        <>📄 Download PDF</>
                      )}
                    </button>

                    {/* BACK TO MATCHING */}

                    <button
                      type="button"
                      onClick={() =>
                        navigate('/resume-jd-matching')
                      }
                      disabled={isDownloading}
                      className="rounded-xl px-6 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg,#6c63ff,#a78bfa)',
                        border: 'none',
                        boxShadow: '0 12px 32px rgba(108,99,255,.4)',
                      }}
                    >
                      Back to Matching
                    </button>

                  </div>

                </div>
              </div>

            </TiltCard>

          )}

        </main>

      </div>

    </div>
  )
}

export default ResumeTailoringPage