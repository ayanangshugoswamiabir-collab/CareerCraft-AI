import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* =========================================================
   SPEECH RECOGNITION TYPES
   ========================================================= */

interface SpeechRecognitionAlternative {
  transcript: string
  confidence?: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
  readonly resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message?: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string

  start: () => void
  stop: () => void
  abort: () => void

  onresult:
    | ((event: SpeechRecognitionEvent) => void)
    | null

  onerror:
    | ((event: SpeechRecognitionErrorEvent) => void)
    | null

  onend:
    | (() => void)
    | null

  onstart:
    | (() => void)
    | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

/* =========================================================
   API TYPES
   ========================================================= */

interface InterviewStartResponse {
  success: boolean
  message: string
  interviewType: string
  question?: string
}

interface InterviewEvaluateResponse {
  success: boolean
  message: string
  score: number
  strengths: string[]
  improvements: string[]
  feedback: string
  nextQuestion: string
}

/* =========================================================
   TILT CARD — subtle 3D hover, matches the AXIOM kit
   ========================================================= */
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
      el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateZ(6px)`
      el.style.boxShadow = `${-x * 20}px ${-y * 16}px 42px rgba(${accent},.18), 0 0 0 1px rgba(${accent},.28), inset 0 1px 0 rgba(255,255,255,.05)`
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

/* =========================================================
   COMPONENT
   ========================================================= */

function InterviewPrepPage() {
  const navigate = useNavigate()

  /* =======================================================
     INTERVIEW STATE
     ======================================================= */

  const [interviewType, setInterviewType] =
    useState('General')

  const [jobDescription, setJobDescription] =
    useState('')

  const [started, setStarted] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [evaluating, setEvaluating] =
    useState(false)

  const [error, setError] =
    useState('')

  /* =======================================================
     QUESTION STATE
     ======================================================= */

  const [question, setQuestion] =
    useState('')

  const [questionNumber, setQuestionNumber] =
    useState(1)

  /* =======================================================
     ANSWER STATE
     ======================================================= */

  const [answer, setAnswer] =
    useState('')

  const [listening, setListening] =
    useState(false)

  /* =======================================================
     AI SPEAKING STATE
     ======================================================= */

  const [speaking, setSpeaking] =
    useState(false)

  /* =======================================================
     EVALUATION STATE
     ======================================================= */

  const [score, setScore] =
    useState<number | null>(null)

  const [strengths, setStrengths] =
    useState<string[]>([])

  const [improvements, setImprovements] =
    useState<string[]>([])

  const [feedback, setFeedback] =
    useState('')

  const [showEvaluation, setShowEvaluation] =
    useState(false)

  /* =======================================================
     REFS
     ======================================================= */

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null)

  /*
   * Stores the finalized speech text.
   *
   * This prevents Chrome interim results from being
   * repeatedly appended and creating duplicate text.
   */
  const finalTranscriptRef =
    useRef('')

  /*
   * Prevents automatic recognition restart after the
   * user intentionally stops recording.
   */
  const shouldRestartRecognition =
    useRef(false)

  /*
   * Prevents recognition restart loops.
   */
  const recognitionStartingRef =
    useRef(false)

  /* =======================================================
     INTERVIEW TYPES
     ======================================================= */

  const interviewTypes = [
    'General',
    'Technical',
    'HR',
    'Behavioral',
    'Software Engineer',
    'Data Science',
    'Machine Learning / AI',
  ]

  /* =========================================================
     STOP SPEECH SYNTHESIS
     ========================================================= */

  const stopSpeech = () => {
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel()
    }

    setSpeaking(false)
  }

  /* =========================================================
     SPEAK QUESTION
     ========================================================= */

  const speakQuestion = (
    text: string,
  ) => {
    if (!text.trim()) {
      return
    }

    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      console.warn(
        'Speech synthesis is not supported by this browser.',
      )

      return
    }

    window.speechSynthesis.cancel()

    const utterance =
      new SpeechSynthesisUtterance(
        text,
      )

    utterance.lang = 'en-US'

    /*
     * Slightly slower than normal speech so the
     * interview question is easier to understand.
     */
    utterance.rate = 0.95

    utterance.pitch = 1

    utterance.volume = 1

    utterance.onstart = () => {
      setSpeaking(true)
    }

    utterance.onend = () => {
      setSpeaking(false)
    }

    utterance.onerror = () => {
      setSpeaking(false)
    }

    window.speechSynthesis.speak(
      utterance,
    )
  }

  /* =========================================================
     REPEAT QUESTION
     ========================================================= */

  const repeatQuestion = () => {
    if (!question || evaluating) {
      return
    }

    speakQuestion(question)
  }

  /* =========================================================
     STOP SPEAKING
     ========================================================= */

  const stopSpeaking = () => {
    stopSpeech()
  }

  /* =========================================================
     GET SPEECH RECOGNITION
     ========================================================= */

  const getSpeechRecognition =
    (): SpeechRecognitionConstructor | null => {
      if (
        typeof window === 'undefined'
      ) {
        return null
      }

      return (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null
      )
    }

  /* =========================================================
     STOP LISTENING
     ========================================================= */

  const stopListening = () => {
    /*
     * IMPORTANT:
     * This tells onend() NOT to restart recognition.
     */
    shouldRestartRecognition.current =
      false

    recognitionStartingRef.current =
      false

    const recognition =
      recognitionRef.current

    if (recognition) {
      try {
        recognition.stop()
      } catch {
        /*
         * Recognition may already have stopped.
         */
      }
    }

    setListening(false)
  }

  /* =========================================================
     START LISTENING
     ========================================================= */

  const startListening = () => {
    setError('')

    const SpeechRecognition =
      getSpeechRecognition()

    if (!SpeechRecognition) {
      setError(
        'Speech recognition is not supported by this browser. Please use Google Chrome or Microsoft Edge.',
      )

      return
    }

    /*
     * Stop AI speech before microphone recording.
     */
    if (speaking) {
      stopSpeech()
    }

    /*
     * Stop previous recognition instance.
     */
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        // Ignore abort errors.
      }
    }

    /*
     * Preserve manually typed or previously recognized
     * answer text.
     */
    finalTranscriptRef.current =
      answer.trim()

    const recognition =
      new SpeechRecognition()

    recognition.continuous = true

    recognition.interimResults = true

    recognition.lang = 'en-US'

    shouldRestartRecognition.current =
      true

    recognitionStartingRef.current =
      false

    /* =====================================================
       RECOGNITION START
       ===================================================== */

    recognition.onstart = () => {
      recognitionStartingRef.current =
        false

      setListening(true)

      setError('')
    }

    /* =====================================================
       RECOGNITION RESULT
       ===================================================== */

    recognition.onresult = (
      event: SpeechRecognitionEvent,
    ) => {
      let interimTranscript = ''

      /*
       * IMPORTANT:
       *
       * We process every result.
       *
       * Final results go into finalTranscriptRef.
       *
       * Interim results are displayed temporarily.
       *
       * This prevents the same sentence from being
       * duplicated every time Chrome fires onresult.
       */

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result =
          event.results[i]

        if (!result) {
          continue
        }

        const alternative =
          result[0]

        if (!alternative) {
          continue
        }

        const transcript =
          alternative.transcript

        if (result.isFinal) {
          finalTranscriptRef.current =
            `${finalTranscriptRef.current} ${transcript}`.trim()
        } else {
          interimTranscript += transcript
        }
      }

      const finalText =
        finalTranscriptRef.current.trim()

      const combinedText =
        `${finalText} ${interimTranscript}`.trim()

      if (combinedText) {
        setAnswer(combinedText)
      }
    }

    /* =====================================================
       RECOGNITION ERROR
       ===================================================== */

    recognition.onerror = (
      event: SpeechRecognitionErrorEvent,
    ) => {
      console.error(
        '❌ Speech recognition error:',
        event.error,
        event.message || '',
      )

      /*
       * User intentionally stopped recognition.
       */
      if (
        event.error === 'aborted'
      ) {
        return
      }

      /*
       * Browser did not hear speech.
       */
      if (
        event.error === 'no-speech'
      ) {
        setError(
          'No speech was detected. Please try speaking again.',
        )

        return
      }

      /*
       * Microphone permission problem.
       */
      if (
        event.error === 'not-allowed' ||
        event.error ===
          'service-not-allowed'
      ) {
        shouldRestartRecognition.current =
          false

        setListening(false)

        setError(
          'Microphone permission was denied. Please allow microphone access in your browser.',
        )

        return
      }

      /*
       * Microphone/device problem.
       */
      if (
        event.error ===
        'audio-capture'
      ) {
        shouldRestartRecognition.current =
          false

        setListening(false)

        setError(
          'No microphone was detected. Please connect a microphone and try again.',
        )

        return
      }

      setError(
        'Unable to recognize your voice. Please try again.',
      )
    }

    /* =====================================================
       RECOGNITION END
       ===================================================== */

    recognition.onend = () => {
      setListening(false)

      /*
       * Chrome can automatically stop recognition.
       *
       * Restart only when the user still wants recording.
       */
      if (
        shouldRestartRecognition.current &&
        !evaluating
      ) {
        if (
          recognitionStartingRef.current
        ) {
          return
        }

        recognitionStartingRef.current =
          true

        try {
          recognition.start()
        } catch {
          recognitionStartingRef.current =
            false

          setListening(false)
        }
      }
    }

    recognitionRef.current =
      recognition

    try {
      recognition.start()
    } catch (recognitionError) {
      console.error(
        '❌ Failed to start speech recognition:',
        recognitionError,
      )

      recognitionStartingRef.current =
        false

      shouldRestartRecognition.current =
        false

      setListening(false)

      setError(
        'Unable to start microphone recording. Please try again.',
      )
    }
  }

  /* =========================================================
     TOGGLE LISTENING
     ========================================================= */

  const toggleListening = () => {
    if (evaluating) {
      return
    }

    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  /* =========================================================
     START INTERVIEW
     ========================================================= */

  const startInterview = async () => {
    const cleanedJobDescription =
      jobDescription.trim()

    if (!cleanedJobDescription) {
      setError(
        'Please paste the job description before starting the interview.',
      )

      return
    }

    setLoading(true)

    setError('')

    /*
     * Reset interview data.
     */
    setAnswer('')

    finalTranscriptRef.current =
      ''

    setScore(null)

    setStrengths([])

    setImprovements([])

    setFeedback('')

    setShowEvaluation(false)

    setQuestionNumber(1)

    stopListening()

    stopSpeech()

    try {
      const response =
        await fetch(
          'http://localhost:5000/api/interview/start',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              interviewType,

              jobDescription:
                cleanedJobDescription,
            }),
          },
        )

      /*
       * Read response safely.
       */
      const data =
        (await response.json()) as InterviewStartResponse

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            'Failed to start interview',
        )
      }

      console.log(
        '✅ Interview started:',
        data,
      )

      const firstQuestion =
        data.question?.trim() || ''

      if (!firstQuestion) {
        throw new Error(
          'The AI did not return an interview question.',
        )
      }

      setQuestion(
        firstQuestion,
      )

      setStarted(true)

      /*
       * Wait for React to render the interview screen,
       * then speak the question.
       */
      window.setTimeout(() => {
        speakQuestion(
          firstQuestion,
        )
      }, 500)
    } catch (error) {
      console.error(
        '❌ Failed to start interview:',
        error,
      )

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to start interview',
      )
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     EVALUATE ANSWER
     ========================================================= */

  const evaluateAnswer =
    async () => {
      const cleanedAnswer =
        answer.trim()

      const cleanedQuestion =
        question.trim()

      const cleanedJobDescription =
        jobDescription.trim()

      if (!cleanedAnswer) {
        setError(
          'Please provide an answer before submitting.',
        )

        return
      }

      if (!cleanedQuestion) {
        setError(
          'The current interview question is missing.',
        )

        return
      }

      if (!cleanedJobDescription) {
        setError(
          'The job description is missing.',
        )

        return
      }

      /*
       * Stop microphone and AI speech.
       */
      stopListening()

      stopSpeech()

      setEvaluating(true)

      setError('')

      try {
        console.log(
          '🤖 Sending answer for AI evaluation...',
        )

        const response =
          await fetch(
            'http://localhost:5000/api/interview/evaluate',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                interviewType,

                jobDescription:
                  cleanedJobDescription,

                question:
                  cleanedQuestion,

                answer:
                  cleanedAnswer,
              }),
            },
          )

        const data =
          (await response.json()) as InterviewEvaluateResponse

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Failed to evaluate interview answer',
          )
        }

        console.log(
          '✅ Interview answer evaluated:',
          data,
        )

        /* =================================================
           SAVE EVALUATION
           ================================================= */

        setScore(
          typeof data.score ===
            'number'
            ? data.score
            : 0,
        )

        setStrengths(
          Array.isArray(
            data.strengths,
          )
            ? data.strengths
            : [],
        )

        setImprovements(
          Array.isArray(
            data.improvements,
          )
            ? data.improvements
            : [],
        )

        setFeedback(
          typeof data.feedback ===
            'string'
            ? data.feedback
            : '',
        )

        setShowEvaluation(true)

        /* =================================================
           NEXT QUESTION
           ================================================= */

        const nextQuestion =
          data.nextQuestion?.trim() ||
          ''

        if (!nextQuestion) {
          throw new Error(
            'The AI did not return the next interview question.',
          )
        }

        /*
         * Clear answer for the next question.
         */
        setAnswer('')

        finalTranscriptRef.current =
          ''

        /*
         * Increase question number.
         */
        setQuestionNumber(
          (current) =>
            current + 1,
        )

        /*
         * Set next question.
         */
        setQuestion(
          nextQuestion,
        )

        /*
         * Speak the next question.
         */
        window.setTimeout(() => {
          speakQuestion(
            nextQuestion,
          )
        }, 600)
      } catch (error) {
        console.error(
          '❌ Failed to evaluate answer:',
          error,
        )

        setError(
          error instanceof Error
            ? error.message
            : 'Unable to evaluate interview answer',
        )
      } finally {
        setEvaluating(false)
      }
    }

  /* =========================================================
     CHANGE INTERVIEW TYPE
     ========================================================= */

  const changeInterviewType =
    () => {
      stopListening()

      stopSpeech()

      setStarted(false)

      setQuestion('')

      setAnswer('')

      finalTranscriptRef.current =
        ''

      setQuestionNumber(1)

      setScore(null)

      setStrengths([])

      setImprovements([])

      setFeedback('')

      setShowEvaluation(false)

      setError('')
    }

  /* =========================================================
     END INTERVIEW
     ========================================================= */

  const endInterview = () => {
    stopListening()

    stopSpeech()

    setStarted(false)

    setQuestion('')

    setAnswer('')

    finalTranscriptRef.current =
      ''

    setQuestionNumber(1)

    setScore(null)

    setStrengths([])

    setImprovements([])

    setFeedback('')

    setShowEvaluation(false)

    setError('')
  }

  /* =========================================================
     CLEANUP
     ========================================================= */

  useEffect(() => {
    return () => {
      shouldRestartRecognition.current =
        false

      recognitionStartingRef.current =
        false

      if (
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore cleanup errors.
        }
      }

      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  /* =========================================================
     SCORE LABEL
     ========================================================= */

  const getScoreLabel =
    (value: number) => {
      if (value >= 90) {
        return 'Excellent'
      }

      if (value >= 75) {
        return 'Good'
      }

      if (value >= 60) {
        return 'Average'
      }

      if (value >= 40) {
        return 'Needs Improvement'
      }

      return 'Poor'
    }

  const getScoreColor = (value: number) => {
    if (value >= 90) return '#34d399'
    if (value >= 75) return '#60a5fa'
    if (value >= 60) return '#f59e0b'
    if (value >= 40) return '#fb923c'
    return '#ef4444'
  }

  /* =========================================================
     RENDER — dark spatial theme
     ========================================================= */

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

    .cc-page, .cc-page * { box-sizing: border-box; }
    .cc-page { font-family: 'Outfit', sans-serif; }
    .cc-mono { font-family: 'JetBrains Mono', monospace; }

    @keyframes cc-pulse { 0%,100% { opacity:.55; transform:scale(1); } 50% { opacity:1; transform:scale(1.25); } }
    @keyframes cc-spin { to { transform: rotate(360deg); } }
    @keyframes cc-ring { 0% { transform:scale(.7); opacity:.8; } 100% { transform:scale(1.8); opacity:0; } }

    .cc-textarea, .cc-input {
      width: 100%; padding: 12px 14px; border-radius: 10px;
      background: rgba(255,255,255,.03);
      border: 1px solid rgba(108,99,255,.22);
      color: #e8eaf6; font-family: 'Outfit', sans-serif; font-size: 14px;
      outline: none; transition: border-color .2s, box-shadow .2s, background .2s;
    }
    .cc-textarea::placeholder, .cc-input::placeholder { color: #565a82; }
    .cc-textarea:focus, .cc-input:focus {
      border-color: rgba(108,99,255,.6);
      box-shadow: 0 0 0 3px rgba(108,99,255,.14);
      background: rgba(108,99,255,.05);
    }
    .cc-textarea:disabled, .cc-input:disabled { background: rgba(255,255,255,.015); cursor: not-allowed; opacity:.6; }

    .cc-btn-primary {
      background: linear-gradient(135deg,#6c63ff,#00a8e8);
      color: #fff; border: none; border-radius: 10px;
      font-weight: 700; cursor: pointer; transition: transform .15s, box-shadow .2s, opacity .2s;
      box-shadow: 0 8px 24px rgba(108,99,255,.32);
    }
    .cc-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 30px rgba(108,99,255,.45); }
    .cc-btn-primary:disabled { opacity:.5; cursor:not-allowed; transform:none; }

    .cc-btn-ghost {
      background: rgba(255,255,255,.03); color: #c5c9e8;
      border: 1px solid rgba(108,99,255,.25); border-radius: 10px;
      font-weight: 600; cursor: pointer; transition: all .18s;
    }
    .cc-btn-ghost:hover:not(:disabled) { border-color: rgba(108,99,255,.55); background: rgba(108,99,255,.1); }
    .cc-btn-ghost:disabled { opacity:.45; cursor:not-allowed; }

    .cc-btn-danger-outline {
      background: rgba(255,255,255,.02); color: #f87171;
      border: 1px solid rgba(239,68,68,.35); border-radius: 10px;
      font-weight: 600; cursor: pointer; transition: all .18s;
    }
    .cc-btn-danger-outline:hover:not(:disabled) { background: rgba(239,68,68,.12); }
    .cc-btn-danger-outline:disabled { opacity:.45; cursor:not-allowed; }

    .cc-btn-danger-solid {
      background: linear-gradient(135deg,#ef4444,#f59e0b);
      color: #fff; border: none; border-radius: 10px;
      font-weight: 700; cursor: pointer; transition: transform .15s, opacity .2s;
    }
    .cc-btn-danger-solid:hover:not(:disabled) { transform: translateY(-1px); }
    .cc-btn-danger-solid:disabled { opacity:.45; cursor:not-allowed; transform:none; }

    .cc-btn-success {
      background: linear-gradient(135deg,#34d399,#10b981);
      color: #06251c; border: none; border-radius: 10px;
      font-weight: 700; cursor: pointer; transition: transform .15s, opacity .2s;
      box-shadow: 0 8px 24px rgba(52,211,153,.28);
    }
    .cc-btn-success:hover:not(:disabled) { transform: translateY(-1px); }
    .cc-btn-success:disabled { opacity:.4; cursor:not-allowed; transform:none; background: rgba(255,255,255,.05); color:#565a82; box-shadow:none; }

    .cc-type-btn {
      border-radius: 12px; padding: 15px; text-align: left; cursor: pointer;
      background: rgba(255,255,255,.02); border: 1px solid rgba(108,99,255,.18);
      color: #9da0c4; font-weight: 600; transition: all .18s;
    }
    .cc-type-btn:hover:not(:disabled) { border-color: rgba(108,99,255,.4); background: rgba(108,99,255,.06); }
    .cc-type-btn.active { border-color: rgba(108,99,255,.6); background: rgba(108,99,255,.14); color: #a78bfa; box-shadow: 0 0 0 1px rgba(108,99,255,.3); }
    .cc-type-btn:disabled { opacity:.5; cursor:not-allowed; }

    .cc-fade { animation: cc-fade-up .45s ease both; }
    @keyframes cc-fade-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

    @media (max-width: 760px) {
      .cc-type-grid { grid-template-columns: 1fr !important; }
      .cc-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
      .cc-btn-row { flex-direction: column !important; }
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
        {/* =====================================================
            HEADER
        ===================================================== */}

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
                <polygon points="10,2 18,7 18,13 10,18 2,13 2,7" stroke="white" strokeWidth="1.6" fill="none" />
                <circle cx="10" cy="10" r="2.8" fill="white" opacity=".85" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '.02em' }}>CareerCraft AI</div>
              <div className="cc-mono" style={{ fontSize: 10, color: '#6b6f99' }}>
                AI INTERVIEW PREP
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopListening()
              stopSpeech()

              navigate('/dashboard')
            }}
            className="cc-btn-ghost"
            style={{ padding: '10px 18px', fontSize: 13.5 }}
          >
            ← Dashboard
          </button>
        </header>

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main style={{ maxWidth: 940, margin: '0 auto', padding: '40px 32px 64px' }}>
          {/* ===================================================
              PAGE INTRO
          =================================================== */}

          <div style={{ marginBottom: 32 }}>
            <div className="cc-mono" style={{ fontSize: 11, letterSpacing: '.15em', color: '#6c63ff', marginBottom: 10 }}>
              AI CAREER TOOL
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
              AI Interview Prep
            </h1>
            <p style={{ marginTop: 10, maxWidth: 620, color: '#8a8ec0', fontSize: 14.5, lineHeight: 1.65 }}>
              Practice a realistic interview with an AI interviewer. The AI generates questions from your job description, listens to your answer, evaluates it, and continues the interview.
            </p>
          </div>

          {/* ===================================================
              START SCREEN
          =================================================== */}

          {!started ? (
            <TiltCard
              style={{
                borderRadius: 20,
                padding: 32,
                background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(108,99,255,.05))',
              }}
            >
              <div style={{ textAlign: 'center' }}>
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
                    fontSize: 32,
                    boxShadow: '0 8px 24px rgba(108,99,255,.2)',
                  }}
                >
                  🎤
                </div>

                <h3 style={{ marginTop: 18, fontSize: 21, fontWeight: 700, color: '#e8eaf6' }}>
                  Start Your AI Interview
                </h3>

                <p style={{ margin: '8px auto 0', maxWidth: 480, fontSize: 13.5, lineHeight: 1.7, color: '#8a8ec0' }}>
                  Paste the job description, choose the interview type, and practice with an AI interviewer.
                </p>
              </div>

              <div style={{ margin: '32px auto 0', maxWidth: 640 }}>
                {/* JOB DESCRIPTION */}
                <label htmlFor="job-description" style={{ fontSize: 12.5, fontWeight: 600, color: '#9da0c4' }}>
                  Job Description
                </label>

                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(event) => {
                    setJobDescription(event.target.value)
                    setError('')
                  }}
                  disabled={loading}
                  placeholder="Paste the complete job description here..."
                  rows={10}
                  className="cc-textarea"
                  style={{ marginTop: 10, resize: 'vertical', lineHeight: 1.6 }}
                />

                <p style={{ marginTop: 8, fontSize: 11.5, color: '#6b6f99' }}>
                  The AI will use this job description to generate relevant questions and evaluate your answers.
                </p>

                {/* INTERVIEW TYPE */}
                <label style={{ display: 'block', marginTop: 26, fontSize: 12.5, fontWeight: 600, color: '#9da0c4' }}>
                  Interview Type
                </label>

                <div className="cc-type-grid" style={{ marginTop: 10, display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                  {interviewTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setInterviewType(type)
                        setError('')
                      }}
                      disabled={loading}
                      className={`cc-type-btn${interviewType === type ? ' active' : ''}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* ERROR */}
                {error && (
                  <div
                    style={{
                      marginTop: 18,
                      borderRadius: 10,
                      border: '1px solid rgba(239,68,68,.35)',
                      background: 'rgba(239,68,68,.08)',
                      padding: '12px 14px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#fca5a5' }}>{error}</p>
                  </div>
                )}

                {/* START BUTTON */}
                <button
                  type="button"
                  onClick={startInterview}
                  disabled={loading}
                  className="cc-btn-primary"
                  style={{ marginTop: 26, width: '100%', padding: '15px 24px', fontSize: 15 }}
                >
                  {loading ? '🤖 Generating AI Question...' : `🎤 Start ${interviewType} Interview`}
                </button>
              </div>
            </TiltCard>
          ) : (
            /* ===================================================
               INTERVIEW SESSION
            =================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* =================================================
                  INTERVIEW HEADER
              ================================================= */}

              <TiltCard
                style={{
                  borderRadius: 18,
                  padding: 22,
                  background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(108,99,255,.04))',
                }}
              >
                <div className="cc-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <p className="cc-mono" style={{ margin: 0, fontSize: 11, letterSpacing: '.1em', color: '#6c63ff' }}>
                      {interviewType.toUpperCase()} INTERVIEW
                    </p>
                    <h3 style={{ margin: '5px 0 0', fontSize: 18, fontWeight: 700, color: '#e8eaf6' }}>AI Interviewer</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      className="cc-mono"
                      style={{
                        borderRadius: 999,
                        background: 'rgba(108,99,255,.14)',
                        border: '1px solid rgba(108,99,255,.3)',
                        padding: '7px 14px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#a78bfa',
                      }}
                    >
                      Question {questionNumber}
                    </span>

                    <button type="button" onClick={endInterview} disabled={evaluating} className="cc-btn-danger-outline" style={{ padding: '9px 16px', fontSize: 13 }}>
                      End Interview
                    </button>
                  </div>
                </div>
              </TiltCard>

              {/* =================================================
                  QUESTION CARD
              ================================================= */}

              <TiltCard
                accent="0,212,255"
                style={{
                  borderRadius: 18,
                  padding: 30,
                  background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(0,212,255,.05))',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {speaking &&
                      [0, 0.5].map((d) => (
                        <div
                          key={d}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            border: '1px solid rgba(52,211,153,.5)',
                            animation: `cc-ring 1.6s ${d}s ease-out infinite`,
                          }}
                        />
                      ))}
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 40,
                        background: speaking ? 'rgba(52,211,153,.14)' : 'rgba(108,99,255,.14)',
                        border: speaking ? '1px solid rgba(52,211,153,.5)' : '1px solid rgba(108,99,255,.3)',
                        boxShadow: speaking ? '0 0 28px rgba(52,211,153,.35)' : '0 0 20px rgba(108,99,255,.2)',
                      }}
                    >
                      {speaking ? '🔊' : '🎤'}
                    </div>
                  </div>

                  {speaking ? (
                    <p style={{ marginTop: 16, fontSize: 13.5, fontWeight: 600, color: '#34d399' }}>AI interviewer is speaking...</p>
                  ) : (
                    <p style={{ marginTop: 16, fontSize: 13.5, color: '#8a8ec0' }}>Listen to the question and then answer using your microphone.</p>
                  )}
                </div>

                {/* QUESTION */}
                <div
                  style={{
                    margin: '28px auto 0',
                    maxWidth: 620,
                    borderRadius: 16,
                    border: '1px solid rgba(0,212,255,.28)',
                    background: 'rgba(0,212,255,.06)',
                    padding: 22,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p className="cc-mono" style={{ margin: 0, fontSize: 11, letterSpacing: '.1em', color: '#38bdf8' }}>
                      AI INTERVIEW QUESTION
                    </p>
                    <span
                      className="cc-mono"
                      style={{
                        borderRadius: 999,
                        background: 'rgba(255,255,255,.06)',
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#c5c9e8',
                      }}
                    >
                      #{questionNumber}
                    </span>
                  </div>

                  <p style={{ marginTop: 14, fontSize: 18, fontWeight: 600, lineHeight: 1.55, color: '#e8eaf6' }}>
                    {question || 'Waiting for question...'}
                  </p>
                </div>

                {/* QUESTION CONTROLS */}
                <div className="cc-btn-row" style={{ margin: '20px auto 0', maxWidth: 620, display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={repeatQuestion}
                    disabled={!question || speaking || evaluating}
                    className="cc-btn-primary"
                    style={{ flex: 1, padding: '13px 20px', fontSize: 14 }}
                  >
                    🔊 Repeat Question
                  </button>

                  <button
                    type="button"
                    onClick={stopSpeaking}
                    disabled={!speaking || evaluating}
                    className="cc-btn-danger-outline"
                    style={{ flex: 1, padding: '13px 20px', fontSize: 14 }}
                  >
                    ⏹ Stop Speaking
                  </button>
                </div>
              </TiltCard>

              {/* =================================================
                  ANSWER CARD
              ================================================= */}

              <TiltCard
                style={{
                  borderRadius: 18,
                  padding: 28,
                  background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(108,99,255,.04))',
                }}
              >
                <div className="cc-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p className="cc-mono" style={{ margin: 0, fontSize: 11, letterSpacing: '.1em', color: '#6b6f99' }}>
                      YOUR ANSWER
                    </p>
                    <h3 style={{ margin: '5px 0 0', fontSize: 18, fontWeight: 700, color: '#e8eaf6' }}>Speak your response</h3>
                  </div>

                  {listening && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 999,
                        background: 'rgba(239,68,68,.12)',
                        border: '1px solid rgba(239,68,68,.3)',
                        padding: '7px 14px',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: '#f87171',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#ef4444',
                          boxShadow: '0 0 8px #ef4444',
                          animation: 'cc-pulse 1.4s ease-in-out infinite',
                        }}
                      />
                      Listening...
                    </span>
                  )}
                </div>

                {/* ANSWER TEXT */}
                <div style={{ marginTop: 18 }}>
                  <textarea
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value)

                      /*
                       * Keep manually edited text as the
                       * current finalized transcript.
                       */
                      finalTranscriptRef.current = event.target.value

                      setError('')
                    }}
                    disabled={evaluating}
                    placeholder={
                      listening
                        ? 'Speak now... your answer will appear here.'
                        : 'Your spoken answer will appear here. You can also edit it manually.'
                    }
                    rows={8}
                    className="cc-textarea"
                    style={{ resize: 'vertical', lineHeight: 1.6 }}
                  />

                  <p style={{ marginTop: 8, fontSize: 11.5, color: '#6b6f99' }}>
                    You can speak your answer or type/edit it manually before submitting.
                  </p>
                </div>

                {/* MICROPHONE + SUBMIT */}
                <div className="cc-btn-row" style={{ marginTop: 18, display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={evaluating}
                    className={listening ? 'cc-btn-danger-solid' : 'cc-btn-primary'}
                    style={{ flex: 1, padding: '15px 22px', fontSize: 14.5 }}
                  >
                    {listening ? '⏹ Stop Recording' : '🎙️ Start Answer Recording'}
                  </button>

                  <button
                    type="button"
                    onClick={evaluateAnswer}
                    disabled={evaluating || !answer.trim()}
                    className="cc-btn-success"
                    style={{ flex: 1, padding: '15px 22px', fontSize: 14.5 }}
                  >
                    {evaluating ? '🤖 AI Evaluating...' : '✅ Submit Answer'}
                  </button>
                </div>

                {/* ERROR */}
                {error && (
                  <div
                    style={{
                      marginTop: 18,
                      borderRadius: 10,
                      border: '1px solid rgba(239,68,68,.35)',
                      background: 'rgba(239,68,68,.08)',
                      padding: '12px 14px',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#fca5a5' }}>{error}</p>
                  </div>
                )}
              </TiltCard>

              {/* =================================================
                  EVALUATION CARD
              ================================================= */}

              {showEvaluation && (
                <TiltCard
                  accent="167,139,250"
                  className="cc-fade"
                  style={{
                    borderRadius: 18,
                    padding: 28,
                    background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(167,139,250,.05))',
                  }}
                >
                  <div className="cc-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
                    <div>
                      <p className="cc-mono" style={{ margin: 0, fontSize: 11, letterSpacing: '.1em', color: '#a78bfa' }}>
                        AI EVALUATION
                      </p>
                      <h3 style={{ margin: '5px 0 0', fontSize: 20, fontWeight: 700, color: '#e8eaf6' }}>Your Answer Feedback</h3>
                    </div>

                    {score !== null && (
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            fontSize: 34,
                            fontWeight: 800,
                            letterSpacing: '-.02em',
                            color: getScoreColor(score),
                          }}
                        >
                          {score}
                          <span style={{ fontSize: 16, color: '#565a82' }}>/100</span>
                        </div>
                        <p className="cc-mono" style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 600, color: getScoreColor(score) }}>
                          {getScoreLabel(score)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* FEEDBACK */}
                  {feedback && (
                    <div
                      style={{
                        marginTop: 24,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,.03)',
                        border: '1px solid rgba(108,99,255,.14)',
                        padding: 18,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#c5c9e8' }}>💬 Interviewer Feedback</p>
                      <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.75, color: '#a3a7d1' }}>{feedback}</p>
                    </div>
                  )}

                  {/* STRENGTHS */}
                  <div style={{ marginTop: 22 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#c5c9e8' }}>✅ Strengths</p>

                    {strengths.length > 0 ? (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {strengths.map((item, index) => (
                          <div
                            key={`${item}-${index}`}
                            style={{
                              borderRadius: 10,
                              background: 'rgba(52,211,153,.08)',
                              border: '1px solid rgba(52,211,153,.22)',
                              borderLeft: '3px solid #34d399',
                              padding: '10px 14px',
                              fontSize: 13,
                              lineHeight: 1.6,
                              color: '#a7e8cf',
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ marginTop: 8, fontSize: 13, color: '#6b6f99' }}>No specific strengths were returned.</p>
                    )}
                  </div>

                  {/* IMPROVEMENTS */}
                  <div style={{ marginTop: 22 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#c5c9e8' }}>📈 Areas to Improve</p>

                    {improvements.length > 0 ? (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {improvements.map((item, index) => (
                          <div
                            key={`${item}-${index}`}
                            style={{
                              borderRadius: 10,
                              background: 'rgba(245,158,11,.08)',
                              border: '1px solid rgba(245,158,11,.22)',
                              borderLeft: '3px solid #f59e0b',
                              padding: '10px 14px',
                              fontSize: 13,
                              lineHeight: 1.6,
                              color: '#f2d199',
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ marginTop: 8, fontSize: 13, color: '#6b6f99' }}>No specific improvements were returned.</p>
                    )}
                  </div>

                  {/* NEXT QUESTION */}
                  <div
                    style={{
                      marginTop: 24,
                      borderRadius: 12,
                      border: '1px solid rgba(0,212,255,.28)',
                      background: 'rgba(0,212,255,.06)',
                      padding: 18,
                    }}
                  >
                    <p className="cc-mono" style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
                      ➡️ NEXT QUESTION READY
                    </p>
                    <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.65, color: '#a3d5e8' }}>
                      The AI has evaluated your answer and generated the next interview question. Scroll up to continue.
                    </p>
                  </div>
                </TiltCard>
              )}

              {/* =================================================
                  JD CONTEXT
              ================================================= */}

              <TiltCard
                style={{
                  borderRadius: 16,
                  padding: 22,
                  background: 'linear-gradient(160deg,rgba(13,15,31,.97),rgba(108,99,255,.03))',
                }}
              >
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#c5c9e8' }}>🎯 AI Job Description Context</p>
                <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.65, color: '#8a8ec0' }}>
                  Every question and answer evaluation uses the job description and selected interview type you provided.
                </p>
              </TiltCard>

              {/* =================================================
                  CHANGE TYPE
              ================================================= */}

              <div style={{ textAlign: 'center', paddingBottom: 12 }}>
                <button type="button" onClick={changeInterviewType} disabled={evaluating} className="cc-btn-ghost" style={{ padding: '13px 24px', fontSize: 14 }}>
                  ← Change Interview Type
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default InterviewPrepPage