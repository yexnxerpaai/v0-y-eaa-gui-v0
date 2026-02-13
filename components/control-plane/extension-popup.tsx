"use client"

import React from "react"
import { useState, useCallback, useRef, useEffect } from "react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Upload,
  FileText,
  Key,
  AlertCircle,
  Loader2,
  Check,
  Plus,
  X,
  ClipboardPaste,
  ChevronDown,
  Pause,
  Square,
  Play,
  Lock,
  Shield,
  Pencil,
  RotateCcw,
  Zap,
  Linkedin,
  RefreshCw,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

/* ─── Types ───────────────────────────────────────────── */

type AuthState = "ANON_FREE" | "AUTH_REQUIRED" | "AUTH_ACTIVE" | "AUTH_NO_CREDIT"
type StepStatus = "not-started" | "in-progress" | "completed"

interface StepState {
  step1: StepStatus
  step2: StepStatus
  step3: StepStatus
}

type RunState = "idle" | "running" | "paused" | "stopped" | "completed"

interface ExtensionPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/* ─── Status Visual System ───────────────────────────── */

const STEP_INDICATOR: Record<StepStatus, { bg: string; ring: string; text: string }> = {
  "not-started": { bg: "bg-[#fafafa]", ring: "ring-[#e2e8f0]", text: "text-[#94a3b8]" },
  "in-progress": { bg: "bg-[#f0f7ff]", ring: "ring-[#bfdbfe]", text: "text-[#1d4ed8]" },
  completed: { bg: "bg-[#f0fdf4]", ring: "ring-[#bbf7d0]", text: "text-[#15803d]" },
}

const STATUS_COPY: Record<StepStatus, string> = {
  "not-started": "Pending",
  "in-progress": "Active",
  completed: "Done",
}

/* ─── Constants ──────────────────────────────────────── */

const SENIORITY_OPTIONS = ["Entry", "Mid", "Senior", "Staff", "Principal", "Director", "VP", "C-Level"]
const JOB_TYPE_OPTIONS = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"]
const LOCATION_OPTIONS = ["Remote", "On-Site", "Hybrid"]

/* ─── Mock: Referral Code ─────────────────────────────── */

async function verifyReferralCode(
  code: string
): Promise<{ success: boolean; quotaAdded?: number; error?: string }> {
  await new Promise((r) => setTimeout(r, 1200))
  const validCodes = ["YEAA-ALPHA", "YEAA-BETA", "YEAA-TEST", "YEAA-2026"]
  if (validCodes.includes(code.trim().toUpperCase())) {
    return { success: true, quotaAdded: 5 }
  }
  return { success: false, error: "Invalid or already used" }
}

/* ─── Mock: AI Suggested Profiles ─────────────────────── */

const AI_PROFILES = [
  {
    id: "ai-1",
    role: "Senior Frontend Engineer",
    targetingLocations: "United States, Remote",
    location: ["Remote"],
    seniority: "Senior",
    type: "Full-time",
    summary: "React/TypeScript roles at growth-stage startups",
  },
  {
    id: "ai-2",
    role: "Staff Software Engineer",
    targetingLocations: "New York, San Francisco",
    location: ["On-Site"],
    seniority: "Staff",
    type: "Full-time",
    summary: "Platform & infrastructure at mid-to-large companies",
  },
]

/* ─── 2x2 Matrix Types ───────────────────────────────── */

type MatrixValue = "yes" | "no"

interface MatrixState {
  [country: string]: {
    workAuth: MatrixValue
    sponsorship: MatrixValue
  }
}

/* ─── Main Component ──────────────────────────────────── */

export function ExtensionPopup({ open, onOpenChange }: ExtensionPopupProps) {
  /* ─── Auth State ────────────────────────────────────── */
  const [authState, setAuthState] = useState<AuthState>("ANON_FREE")
  const [authLoading, setAuthLoading] = useState(false)
  const [freeUsed, setFreeUsed] = useState(false)

  /* ─── Credits & Account ─────────────────────────────── */
  const [quota, setQuota] = useState(5)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const balanceRef = useRef<HTMLButtonElement>(null)

  const [apiKey, setApiKey] = useState("sk-...hidden")
  const [apiKeyEditing, setApiKeyEditing] = useState(false)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | null>(1)
  const [steps, setSteps] = useState<StepState>({
    step1: "not-started",
    step2: "not-started",
    step3: "not-started",
  })

  // Step 1
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pasteModalOpen, setPasteModalOpen] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [parsingStatus, setParsingStatus] = useState<"idle" | "parsing" | "done" | "syncing">("idle")
  const [resumeName, setResumeName] = useState<string | null>(null)

  // Step 2
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [aiProfileOverrides, setAiProfileOverrides] = useState<Record<string, {
    role?: string
    targetingLocations?: string
    location?: string[]
    seniority?: string[]
    type?: string[]
  }>>({})

  // Countries detected from resume
  const [detectedCountries, setDetectedCountries] = useState<string[]>([])
  const [matrixCountries, setMatrixCountries] = useState<string[]>([])
  const [matrix, setMatrix] = useState<MatrixState>({})
  const [addingCountry, setAddingCountry] = useState(false)
  const [newCountryName, setNewCountryName] = useState("")
  const [eeoExpanded, setEeoExpanded] = useState(false)

  // Step 3
  const [topPositions, setTopPositions] = useState(10)
  const [runState, setRunState] = useState<RunState>("idle")
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmAcknowledged, setConfirmAcknowledged] = useState(false)

  // Referral & toast
  const [referralCode, setReferralCode] = useState("")
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [appliedCodes, setAppliedCodes] = useState<string[]>([])
  const [creditToast, setCreditToast] = useState<string | null>(null)

  const quotaIsZero = quota === 0

  /* Derived: is the profile read-only? Only during active run */
  const isRunning = runState === "running" || runState === "paused"

  /* ─── Auth Handlers ─────────────────────────────────── */

  const handleStartFreeApplication = useCallback(() => {
    // Let user enter the main flow with 1 free credit (no login needed)
    setQuota(1)
    setAuthState("AUTH_ACTIVE")
  }, [])

  const handleGoogleLogin = useCallback(() => {
    setAuthLoading(true)
    // Simulate Google authentication delay
    setTimeout(() => {
      setAuthLoading(false)
      setQuota(5)
      setAuthState("AUTH_ACTIVE")
    }, 1800)
  }, [])

  const showCreditToast = useCallback((msg: string) => {
    setCreditToast(msg)
    setTimeout(() => setCreditToast(null), 3000)
  }, [])

  /* ─── Start Fresh (inner, no auth reset) ────────────── */

  const handleStartFresh_inner = useCallback(() => {
    setSteps({ step1: "not-started", step2: "not-started", step3: "not-started" })
    setActiveStep(1)
    setParsingStatus("idle")
    setResumeName(null)
    setSelectedProfile(null)
    setEditingProfileId(null)
    setAiProfileOverrides({})
    setDetectedCountries([])
    setMatrixCountries([])
    setMatrix({})
    setEeoExpanded(false)
    setRunState("idle")
    setConfirmModalOpen(false)
    setConfirmAcknowledged(false)
    setTopPositions(10)
  }, [])

  const handleStartFresh = useCallback(() => {
    handleStartFresh_inner()
  }, [handleStartFresh_inner])

  const handleLogout = useCallback(() => {
    setAuthState(freeUsed ? "AUTH_REQUIRED" : "ANON_FREE")
    setQuota(5)
    handleStartFresh_inner()
  }, [freeUsed, handleStartFresh_inner])

  /* ─── Credit check → auto-switch to no-credits ──────── */

  useEffect(() => {
    if (authState === "AUTH_ACTIVE" && quota === 0) {
      // If free use was consumed without login, require auth; otherwise show no-credit
      if (!freeUsed) {
        setFreeUsed(true)
        setAuthState("AUTH_REQUIRED")
      } else {
        setAuthState("AUTH_NO_CREDIT")
      }
    }
  }, [authState, quota, freeUsed])

  /* ─── Step 1: Resume Upload ─────────────────────────── */

  const simulateParsing = useCallback((name: string) => {
    setResumeName(name)
    setParsingStatus("parsing")
    setSteps((prev) => ({ ...prev, step1: "in-progress" }))
    setActiveStep(1)
    setTimeout(() => {
      setParsingStatus("done")
      const countries = ["United States"]
      setDetectedCountries(countries)
      setMatrixCountries(countries)
      setMatrix(
        countries.reduce((acc, c) => ({ ...acc, [c]: { workAuth: "yes", sponsorship: "yes" } }), {} as MatrixState)
      )
      setSteps((prev) => ({
        ...prev,
        step1: "completed",
        step2: prev.step2 === "not-started" ? "in-progress" : prev.step2,
      }))
      setTimeout(() => setActiveStep(2), 400)
    }, 2500)
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) simulateParsing(file.name)
    e.target.value = ""
  }, [simulateParsing])

  const handleUploadFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handlePasteSubmit = useCallback(() => {
    if (pasteText.trim()) {
      setPasteModalOpen(false)
      simulateParsing(`Pasted (${pasteText.trim().split(/\s+/).length} words)`)
      setPasteText("")
    }
  }, [pasteText, simulateParsing])

  const handleConnectLinkedIn = useCallback(() => {
    setParsingStatus("syncing")
    setSteps((prev) => ({ ...prev, step1: "in-progress" }))
    setTimeout(() => {
      setResumeName("LinkedIn Profile (synced)")
      setParsingStatus("done")
      const countries = ["United States"]
      setDetectedCountries(countries)
      setMatrixCountries(countries)
      setMatrix(
        countries.reduce((acc, c) => ({ ...acc, [c]: { workAuth: "yes", sponsorship: "yes" } }), {} as MatrixState)
      )
      setSteps((prev) => ({
        ...prev,
        step1: "completed",
        step2: prev.step2 === "not-started" ? "in-progress" : prev.step2,
      }))
      setTimeout(() => setActiveStep(2), 400)
    }, 3000)
  }, [])

  const handleUploadNewResume = useCallback(() => {
    setParsingStatus("idle")
    setResumeName(null)
    setSteps((prev) => ({ ...prev, step1: "not-started" }))
    setActiveStep(1)
  }, [])

  /* ─── Step 2: Matrix toggle ─────────────────────────── */

  const toggleMatrixCell = useCallback(
    (country: string, row: "workAuth" | "sponsorship") => {
      if (isRunning) return
      setMatrix((prev) => ({
        ...prev,
        [country]: { ...prev[country], [row]: prev[country][row] === "yes" ? "no" : "yes" },
      }))
    }, [isRunning]
  )

  const addCountryToMatrix = useCallback(() => {
    const name = newCountryName.trim()
    if (!name || matrixCountries.includes(name)) return
    setMatrixCountries((prev) => [...prev, name])
    setMatrix((prev) => ({ ...prev, [name]: { workAuth: "yes", sponsorship: "yes" } }))
    setNewCountryName("")
    setAddingCountry(false)
  }, [newCountryName, matrixCountries])

  const handleStartApplying = useCallback(() => {
    if (!selectedProfile) return
    setSteps((prev) => ({ ...prev, step2: "completed", step3: "in-progress" }))
    setActiveStep(3)
  }, [selectedProfile])

  const handleGoToLinkedIn = useCallback(() => {
    window.open("https://www.linkedin.com/jobs/search/", "_blank")
  }, [])

  /* ─── Step 3: Run State ─────────────────────────────── */

  const handleConfirmProceed = useCallback(() => {
    setConfirmModalOpen(false)
    setRunState("running")
    setActiveStep(3)
    window.open("https://www.linkedin.com/jobs/search/", "_blank")
  }, [])

  const handleApplySelected = useCallback(() => {
    if (steps.step2 !== "completed") return
    setConfirmModalOpen(true)
    setConfirmAcknowledged(false)
  }, [steps.step2])

  const handleApplyAll = useCallback(() => {
    if (steps.step2 !== "completed") return
    setConfirmModalOpen(true)
    setConfirmAcknowledged(false)
  }, [steps.step2])

  const handlePause = useCallback(() => setRunState("paused"), [])
  const handleResume = useCallback(() => setRunState("running"), [])

  const handleStop = useCallback(() => {
    setRunState("stopped")
    setQuota((prev) => Math.max(prev - 1, 0))
    showCreditToast("-1 credit (session stopped)")
  }, [showCreditToast])

  /* ─── Referral ──────────────────────────────────────── */

  const handleApplyReferral = useCallback(async () => {
    const code = referralCode.trim().toUpperCase()
    if (!code || appliedCodes.includes(code)) {
      setReferralError("Already applied")
      setTimeout(() => setReferralError(null), 3000)
      return
    }
    setReferralLoading(true)
    setReferralError(null)
    const result = await verifyReferralCode(code)
    if (result.success && result.quotaAdded) {
      setQuota((prev) => Math.min(prev + result.quotaAdded!, 15))
      setAppliedCodes((prev) => [...prev, code])
      setReferralCode("")
      if (authState === "AUTH_NO_CREDIT") setAuthState("AUTH_ACTIVE")
    } else {
      setReferralError(result.error || "Invalid")
      setTimeout(() => setReferralError(null), 3000)
    }
    setReferralLoading(false)
  }, [referralCode, appliedCodes, authState])

  /* ─── Location chip toggle (per-card isolated) ──────── */

  const toggleLocationChip = useCallback(
    (profileId: string, loc: string) => {
      if (isRunning) return
      setAiProfileOverrides((prev) => {
        const current = prev[profileId]?.location || AI_PROFILES.find((p) => p.id === profileId)?.location || []
        const updated = current.includes(loc) ? current.filter((l) => l !== loc) : [...current, loc]
        return { ...prev, [profileId]: { ...prev[profileId], location: updated } }
      })
    },
    [isRunning]
  )

  const getProfileField = (profileId: string, field: "role" | "targetingLocations" | "seniority" | "type" | "location") => {
    const override = aiProfileOverrides[profileId]
    const base = AI_PROFILES.find((p) => p.id === profileId)
    if (!base) return field === "location" || field === "seniority" || field === "type" ? [] : ""
    if (field === "location") return override?.location || base.location
    if (field === "seniority") return override?.seniority || [base.seniority]
    if (field === "type") return override?.type || [base.type]
    return override?.[field] ?? base[field]
  }

  /* ─── Step toggle (collapse on re-click) ───────────── */

  const handleStepToggle = useCallback((step: 1 | 2 | 3) => {
    setActiveStep((prev) => (prev === step ? null : step))
  }, [])

  /* ─── Render ────────────────────────────────────────── */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[400px] flex-col border-l border-border/60 bg-[#fcfcfd] p-0 shadow-2xl sm:w-[400px]"
      >
        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileChange} />

        {/* ═══════════════════════════════════════════════════════
            STATE 1: Anonymous (Not Logged In)
            ═══════════════════════════════════════════════════════ */}
        {authState === "ANON_FREE" && (
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="shrink-0 border-b border-border px-6 pb-5 pt-6">
              <SheetHeader className="space-y-0">
                <div className="flex items-baseline gap-2">
                  <SheetTitle className="text-[22px] font-bold tracking-tight text-foreground">Y.EAA</SheetTitle>
                  <span className="rounded-full bg-[#f0f7ff] px-2 py-0.5 text-[10px] font-semibold tracking-widest text-[#3b82f6]">BETA</span>
                </div>
              </SheetHeader>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col items-center justify-center px-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground">
                <Zap className="h-6 w-6 text-background" strokeWidth={2} />
              </div>
              <h2 className="mt-5 text-center text-xl font-bold tracking-tight text-foreground">Apply Instantly</h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
                No account required to get started.
              </p>
              <button
                type="button"
                className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-bold text-background transition-all hover:opacity-90"
                onClick={handleStartFreeApplication}
              >
                {"Start Application \u2192"}
              </button>
              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/70">
                Login required after your first successful application.
              </p>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-6 py-4">
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground/60">
                Y.EAA does not store credentials or login sessions.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STATE 2: Login Required (After First Application)
            ═══════════════════════════════════════════════════════ */}
        {authState === "AUTH_REQUIRED" && (
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="shrink-0 border-b border-border px-6 pb-5 pt-6">
              <SheetHeader className="space-y-0">
                <div className="flex items-baseline gap-2">
                  <SheetTitle className="text-[22px] font-bold tracking-tight text-foreground">Y.EAA</SheetTitle>
                  <span className="rounded-full bg-[#f0f7ff] px-2 py-0.5 text-[10px] font-semibold tracking-widest text-[#3b82f6]">BETA</span>
                </div>
              </SheetHeader>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col items-center justify-center px-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Lock className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <h2 className="mt-5 text-center text-xl font-bold tracking-tight text-foreground">Create Account to Continue</h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
                Sign in to continue applying.
              </p>

              <div className="mt-8 w-full space-y-3">
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-background text-sm font-semibold text-foreground transition-all hover:border-border hover:shadow-md hover:shadow-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

              </div>

              <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground/70">
                We use your account only to manage application credits.
              </p>
              <button type="button" className="mt-4 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground" onClick={() => setAuthState("ANON_FREE")}>
                {"< Back"}
              </button>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-6 py-4">
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground/60">
                Y.EAA does not store credentials or login sessions.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STATE 4: No Credits Remaining
            ═══════════════════════════════════════════════════════ */}
        {authState === "AUTH_NO_CREDIT" && (
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="shrink-0 border-b border-border px-6 pb-5 pt-6">
              <SheetHeader className="space-y-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <SheetTitle className="text-[22px] font-bold tracking-tight text-foreground">Y.EAA</SheetTitle>
                    <span className="rounded-full bg-[#f0f7ff] px-2 py-0.5 text-[10px] font-semibold tracking-widest text-[#3b82f6]">BETA</span>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600">
                    Credits: <span className="font-mono font-bold tabular-nums">0</span>
                  </span>
                </div>
              </SheetHeader>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col items-center justify-center px-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                <AlertCircle className="h-6 w-6 text-red-500" strokeWidth={1.5} />
              </div>
              <h2 className="mt-5 text-center text-xl font-bold tracking-tight text-foreground">{"You\u2019re Out of Credits"}</h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
                Credits refresh automatically.
              </p>

              <button
                type="button"
                className="mt-8 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground"
                disabled
              >
                Start Application
              </button>



              {/* Referral code rescue */}
              <div className="mt-8 w-full">
                <div className="h-px bg-border" />
                <p className="mt-4 text-sm font-semibold text-foreground">Have a referral code?</p>
                <div className="mt-2.5 flex gap-2">
                  <Input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !referralLoading) handleApplyReferral() }}
                    placeholder="YEAA-XXXX"
                    disabled={referralLoading}
                    className="h-9 flex-1 rounded-lg border-border/60 bg-muted/50 text-xs placeholder:text-muted-foreground/60 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20"
                  />
                  <button
                    type="button"
                    className={cn("flex h-9 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-all", referralCode.trim() && !referralLoading ? "bg-foreground text-background hover:opacity-90" : "cursor-not-allowed bg-muted text-muted-foreground")}
                    onClick={handleApplyReferral}
                    disabled={referralLoading || !referralCode.trim()}
                  >
                    {referralLoading ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} /> : "Redeem"}
                  </button>
                </div>
                {referralError && <p className="mt-2 text-xs text-red-500">{referralError}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-6 py-4">
              <button type="button" className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground" onClick={handleLogout}>
                <LogOut className="h-3 w-3" strokeWidth={1.5} />
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            STATE 3: Logged In With Credits (Main Application UI)
            ═══════════════════════════════════════════════════════ */}
        {authState === "AUTH_ACTIVE" && (
          <div className="flex flex-1 flex-col">
            {/* ─── Credit Toast ────────────────────────────── */}
            <AnimatePresence>
              {creditToast && (
                <motion.div
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute inset-x-0 top-0 z-[60] flex justify-center p-3"
                >
                  <div className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg shadow-black/5">
                    {creditToast}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Run State Banner ───────────────────────── */}
            <AnimatePresence>
              {runState !== "idle" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className={cn(
                    "flex items-center justify-between px-6 py-3",
                    runState === "running" && "bg-[#eff6ff] border-b border-[#bfdbfe]/60",
                    runState === "paused" && "bg-[#fefce8] border-b border-[#fde68a]/60",
                    runState === "stopped" && "bg-[#fef2f2] border-b border-[#fecaca]/60",
                    runState === "completed" && "bg-[#f0fdf4] border-b border-[#bbf7d0]/60",
                  )}>
                    <div className="flex items-center gap-2.5">
                      {runState === "running" && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3b82f6] opacity-60" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3b82f6]" />
                        </span>
                      )}
                      {runState === "paused" && <Pause className="h-3 w-3 text-[#ca8a04]" strokeWidth={2} />}
                      {runState === "stopped" && <Square className="h-3 w-3 text-[#dc2626]" strokeWidth={2} />}
                      {runState === "completed" && <Check className="h-3 w-3 text-[#16a34a]" strokeWidth={2} />}
                      <span className="text-sm font-semibold tracking-wide text-foreground">
                        {runState === "running" && "Applying"}
                        {runState === "paused" && "Paused"}
                        {runState === "stopped" && "Stopped"}
                        {runState === "completed" && "Completed"}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {runState === "running" && (
                        <>
                          <button type="button" className="flex h-6 items-center gap-1 rounded-md border border-border/80 bg-background px-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground hover:shadow-sm" onClick={handlePause}>
                            <Pause className="h-2.5 w-2.5" strokeWidth={1.5} /> Pause
                          </button>
                          <button type="button" className="flex h-6 items-center gap-1 rounded-md border border-red-200/80 bg-background px-2.5 text-sm font-medium text-red-600 transition-all hover:border-red-300 hover:shadow-sm" onClick={handleStop}>
                            <Square className="h-2.5 w-2.5" strokeWidth={1.5} /> Stop
                          </button>
                        </>
                      )}
                      {runState === "paused" && (
                        <>
                          <button type="button" className="flex h-6 items-center gap-1 rounded-md bg-[#1d4ed8] px-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1e40af] hover:shadow-sm" onClick={handleResume}>
                            <Play className="h-2.5 w-2.5" strokeWidth={1.5} /> Resume
                          </button>
                          <button type="button" className="flex h-6 items-center gap-1 rounded-md border border-red-200/80 bg-background px-2.5 text-sm font-medium text-red-600 transition-all hover:border-red-300" onClick={handleStop}>
                            <Square className="h-2.5 w-2.5" strokeWidth={1.5} /> Stop
                          </button>
                        </>
                      )}
                      {(runState === "stopped" || runState === "completed") && (
                        <button type="button" className="flex h-6 items-center gap-1 rounded-md border border-border/80 bg-background px-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground" onClick={() => {
                          setRunState("idle")
                          setSteps((prev) => ({ ...prev, step3: "in-progress" }))
                          setConfirmAcknowledged(false)
                        }}>
                          <RotateCcw className="h-2.5 w-2.5" strokeWidth={1.5} /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Header ─────────────────────────────────── */}
            <div className="shrink-0 border-b border-border px-6 pb-5 pt-6">
              <SheetHeader className="space-y-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <SheetTitle className="text-[22px] font-bold tracking-tight text-foreground">
                      Y.EAA
                    </SheetTitle>
                    <span className="rounded-full bg-[#f0f7ff] px-2 py-0.5 text-[10px] font-semibold tracking-widest text-[#3b82f6]">
                      BETA
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Start Fresh */}
                    <button
                      type="button"
                      className="flex h-8 items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground hover:shadow-sm"
                      onClick={handleStartFresh}
                    >
                      <RefreshCw className="h-3 w-3" strokeWidth={1.5} />
                      Start Fresh
                    </button>
                    {/* Balance pill */}
                    <button
                      ref={balanceRef}
                      type="button"
                      className={cn(
                        "group flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                        quotaIsZero
                          ? "border-red-200 bg-red-50 text-red-600 hover:border-red-300"
                          : "border-border/60 bg-background text-foreground hover:border-border hover:shadow-sm"
                      )}
                      onClick={() => setPopoverOpen(!popoverOpen)}
                    >
                      <span className="text-sm text-muted-foreground">Credits:</span>
                      <span className="font-mono text-sm font-bold tabular-nums">{quota}</span>
                    </button>
                  </div>
                </div>
              </SheetHeader>

              {/* Quota progress bar */}
              <div className="mt-3.5">
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn("h-full rounded-full", quotaIsZero ? "bg-red-500" : "bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]")}
                    initial={false}
                    animate={{ width: `${(quota / 15) * 100}%` }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                </div>
              </div>
            </div>

            {/* ─── Account View (full-page opaque takeover) ── */}
            <AnimatePresence>
              {popoverOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-50 flex flex-col bg-background"
                >
                  <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="text-[15px] font-bold text-foreground">Account</h3>
                    <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => { setPopoverOpen(false); setApiKeyEditing(false) }}>
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    {/* Credits overview */}
                    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Credits remaining</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Credits refresh automatically.</p>
                      </div>
                      <span className="font-mono text-2xl font-bold tabular-nums text-foreground">{quota}</span>
                    </div>

                    <div className="my-5 h-px bg-border" />

                    {/* API Key section */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0fdf4]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                          </span>
                          <span className="text-sm font-semibold text-foreground">API Connected</span>
                        </div>
                        {!apiKeyEditing && (
                          <div className="flex gap-3">
                            <button type="button" className="text-sm font-medium text-[#3b82f6] transition-colors hover:text-[#1d4ed8]" onClick={() => setApiKeyEditing(true)}>Change</button>
                            <button type="button" className="text-sm font-medium text-red-400 transition-colors hover:text-red-600" onClick={() => { setApiKey(""); setApiKeyEditing(true) }}>Remove</button>
                          </div>
                        )}
                      </div>
                      <AnimatePresence>
                        {apiKeyEditing && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                            <div className="mt-4 space-y-3">
                              <div className="relative">
                                <Key className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="h-9 rounded-lg border-border/60 bg-muted/50 pl-8 text-xs placeholder:text-muted-foreground/60 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20" />
                              </div>
                              <div className="flex gap-2">
                                <button type="button" className={cn("flex h-8 flex-1 items-center justify-center rounded-lg text-sm font-semibold transition-all", apiKey.trim() ? "bg-foreground text-background hover:opacity-90" : "cursor-not-allowed bg-muted text-muted-foreground")} disabled={!apiKey.trim()} onClick={() => setApiKeyEditing(false)}>Save</button>
                                <button type="button" className="flex h-8 flex-1 items-center justify-center rounded-lg border border-border/60 text-sm font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground" onClick={() => setApiKeyEditing(false)}>Cancel</button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="my-5 h-px bg-border" />

                    {/* Referral */}
                    <div>
                      <p className="text-sm font-semibold text-foreground">Referral code</p>
                      <div className="mt-2.5 flex gap-2">
                        <Input
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && !referralLoading) handleApplyReferral() }}
                          placeholder="YEAA-XXXX"
                          disabled={referralLoading}
                          className="h-9 flex-1 rounded-lg border-border/60 bg-muted/50 text-xs placeholder:text-muted-foreground/60 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20"
                        />
                        <button
                          type="button"
                          className={cn("flex h-9 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-all", referralCode.trim() && !referralLoading ? "bg-foreground text-background hover:opacity-90" : "cursor-not-allowed bg-muted text-muted-foreground")}
                          onClick={handleApplyReferral}
                          disabled={referralLoading || !referralCode.trim()}
                        >
                          {referralLoading ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} /> : "Redeem"}
                        </button>
                      </div>
                      {referralError && <p className="mt-2 text-sm text-red-500">{referralError}</p>}
                    </div>

                    <div className="my-5 h-px bg-border" />

                    {/* Sign out */}
                    <button type="button" className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground" onClick={handleLogout}>
                      <LogOut className="h-3 w-3" strokeWidth={1.5} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Steps ──────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

              {/* Step 1: Upload Resume */}
              <StepAccordion
                number={1}
                title="Upload Resume"
                status={steps.step1}
                isActive={activeStep === 1}
                onToggle={() => handleStepToggle(1)}
                canToggle={true}
                titleAction={
                  steps.step1 === "completed" ? (
                    <button
                      type="button"
                      className="flex h-6 items-center gap-1 rounded-md border border-border/60 bg-background px-2 text-[10px] font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground hover:shadow-sm"
                      onClick={(e) => { e.stopPropagation(); handleUploadNewResume() }}
                    >
                      <Plus className="h-2.5 w-2.5" strokeWidth={2} />
                      New
                    </button>
                  ) : undefined
                }
              >
                {parsingStatus === "syncing" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-[#0077b5]" strokeWidth={2} />
                      <span className="text-sm font-medium text-foreground">{"Syncing LinkedIn profile\u2026"}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div className="h-full w-1/3 rounded-full bg-[#0077b5]" animate={{ x: ["0%", "200%", "0%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
                    </div>
                  </div>
                )}

                {parsingStatus === "parsing" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="h-4 w-4 animate-spin text-[#3b82f6]" strokeWidth={2} />
                      <span className="text-sm font-medium text-foreground">{"Parsing resume\u2026"}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div className="h-full w-1/3 rounded-full bg-[#3b82f6]" animate={{ x: ["0%", "200%", "0%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
                    </div>
                  </div>
                )}

                {parsingStatus === "done" && resumeName && (
                  <div className="flex items-center gap-3 rounded-xl border border-[#bbf7d0]/60 bg-[#f0fdf4] px-4 py-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#16a34a]/10">
                      <Check className="h-3.5 w-3.5 text-[#16a34a]" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#15803d]">Resume parsed</p>
                      <p className="truncate text-sm text-[#16a34a]/70">{resumeName}</p>
                    </div>
                  </div>
                )}

                {parsingStatus === "idle" && (
                  <div className="grid grid-cols-3 gap-2.5">
                    <button type="button" className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-background px-2 py-6 text-center transition-all hover:border-border hover:shadow-md hover:shadow-black/5" onClick={handleUploadFile}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-[#f0f7ff]">
                        <Upload className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[#3b82f6]" strokeWidth={1.5} />
                      </span>
                      <span className="text-sm font-semibold text-foreground">Upload File</span>
                    </button>
                    <button type="button" className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-background px-2 py-6 text-center transition-all hover:border-border hover:shadow-md hover:shadow-black/5" onClick={() => setPasteModalOpen(true)}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-[#faf5ff]">
                        <ClipboardPaste className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[#8b5cf6]" strokeWidth={1.5} />
                      </span>
                      <span className="text-sm font-semibold text-foreground">Paste Text</span>
                    </button>
                    <button type="button" className="group flex flex-col items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-background px-2 py-6 text-center transition-all hover:border-[#0077b5]/30 hover:shadow-md hover:shadow-black/5" onClick={handleConnectLinkedIn}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f9ff] transition-colors group-hover:bg-[#e0f2fe]">
                        <Linkedin className="h-4 w-4 text-[#0077b5]" strokeWidth={1.5} />
                      </span>
                      <span className="text-sm font-semibold text-foreground">LinkedIn</span>
                    </button>
                  </div>
                )}
              </StepAccordion>

              {/* Step 2: Job Profile */}
              <StepAccordion number={2} title="Job Profile" status={steps.step2} isActive={activeStep === 2} onToggle={() => { if (steps.step2 !== "not-started") handleStepToggle(2) }} canToggle={steps.step2 !== "not-started"}>

                {/* Work Authorization */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Work Authorization</p>
                      {detectedCountries.length > 0 && (
                        <span className="rounded bg-[#f0f7ff] px-1.5 py-0.5 text-[10px] font-medium text-[#3b82f6]">From resume</span>
                      )}
                    </div>
                    {!isRunning && (
                      <button type="button" className="flex h-5 w-5 items-center justify-center rounded-md border border-border/60 text-sm font-bold text-muted-foreground transition-colors hover:border-border hover:text-foreground" onClick={() => setAddingCountry(true)}>+</button>
                    )}
                  </div>

                  <AnimatePresence>
                    {addingCountry && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                        <div className="mt-2.5 flex gap-2">
                          <Input type="text" value={newCountryName} onChange={(e) => setNewCountryName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCountryToMatrix() }} placeholder="Country name" className="h-8 flex-1 rounded-lg border-border/60 bg-muted/50 text-sm placeholder:text-muted-foreground/60" autoFocus />
                          <button type="button" className="flex h-8 items-center rounded-lg bg-foreground px-3 text-sm font-semibold text-background transition-all hover:opacity-90" onClick={addCountryToMatrix}>Add</button>
                          <button type="button" className="flex h-8 items-center rounded-lg border border-border/60 px-3 text-sm text-muted-foreground hover:border-border" onClick={() => { setAddingCountry(false); setNewCountryName("") }}>Cancel</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {matrixCountries.length === 0 ? (
                    <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-6">
                      <p className="text-sm text-muted-foreground">No countries detected yet. Upload a resume to auto-detect, or add manually.</p>
                    </div>
                  ) : (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="w-[110px] min-w-[110px] border-b border-r border-border/40 bg-muted/50 px-3 py-2.5 text-left font-semibold text-muted-foreground" />
                            {matrixCountries.map((country) => (
                              <th key={country} className="border-b border-r border-border/40 bg-muted/50 px-3 py-2.5 text-center font-semibold text-foreground last:border-r-0">
                                {country}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="w-[110px] min-w-[110px] border-b border-r border-border/40 px-3 py-2 font-medium text-muted-foreground">Work Auth</td>
                            {matrixCountries.map((country) => (
                              <td key={country} className="border-b border-r border-border/40 p-0 text-center last:border-r-0">
                                <button type="button" className={cn("flex h-10 w-full items-center justify-center transition-colors", matrix[country]?.workAuth === "yes" ? "bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7]" : "bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]", isRunning && "cursor-not-allowed opacity-60")} onClick={() => toggleMatrixCell(country, "workAuth")} disabled={isRunning}>
                                  {matrix[country]?.workAuth === "yes" ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <X className="h-4 w-4" strokeWidth={2.5} />}
                                </button>
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="w-[110px] min-w-[110px] border-r border-border/40 px-3 py-2 font-medium text-muted-foreground">Sponsorship</td>
                            {matrixCountries.map((country) => (
                              <td key={country} className="border-r border-border/40 p-0 text-center last:border-r-0">
                                <button type="button" className={cn("flex h-10 w-full items-center justify-center transition-colors", matrix[country]?.sponsorship === "yes" ? "bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7]" : "bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]", isRunning && "cursor-not-allowed opacity-60")} onClick={() => toggleMatrixCell(country, "sponsorship")} disabled={isRunning}>
                                  {matrix[country]?.sponsorship === "yes" ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <X className="h-4 w-4" strokeWidth={2.5} />}
                                </button>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* EEO */}
                <div className="mb-6">
                  <button type="button" className="flex w-full items-center justify-between rounded-lg px-0 py-0" onClick={() => setEeoExpanded(!eeoExpanded)}>
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground">EEO Responses</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Optional</span>
                    </div>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", eeoExpanded && "rotate-180")} strokeWidth={1.5} />
                  </button>
                  <AnimatePresence>
                    {eeoExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {["Gender", "Race", "Veteran", "Disability"].map((field) => (
                            <div key={field}>
                              <label className="text-sm font-medium text-muted-foreground">{field}</label>
                              <select className="mt-1.5 h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus:border-[#3b82f6]" disabled={isRunning} defaultValue="">
                                <option value="">Select...</option>
                                <option value="prefer-not">Prefer not to say</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Divider */}
                <div className="mb-5 h-px bg-border" />

                {/* AI Suggested */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">AI Suggested</p>
                  {AI_PROFILES.map((profile) => {
                    const isEditing = editingProfileId === profile.id
                    const isSelected = selectedProfile === profile.id
                    const currentLocation = getProfileField(profile.id, "location") as string[]
                    const currentTargeting = getProfileField(profile.id, "targetingLocations") as string
                    const currentRole = getProfileField(profile.id, "role") as string
                    const currentSeniority = getProfileField(profile.id, "seniority") as string[]
                    const currentType = getProfileField(profile.id, "type") as string[]

                    return (
                      <div key={profile.id} className="relative">
                        {!isRunning && isSelected && (
                          <button type="button" className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => setEditingProfileId(isEditing ? null : profile.id)}>
                            <Pencil className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        )}
                        <button
                          type="button"
                          className={cn(
                            "w-full rounded-xl border p-4 text-left transition-all",
                            isSelected
                              ? "border-[#3b82f6]/40 bg-[#f8fbff] shadow-sm shadow-[#3b82f6]/5"
                              : "border-border/60 bg-background hover:border-border hover:shadow-sm hover:shadow-black/5",
                            isRunning && "pointer-events-none opacity-60"
                          )}
                          onClick={() => { if (!isRunning) setSelectedProfile(profile.id) }}
                          disabled={isRunning}
                        >
                          <p className="pr-8 text-sm font-semibold text-foreground">{currentRole}</p>
                          {!isEditing && <p className="mt-1 text-sm text-muted-foreground">{currentTargeting}</p>}
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {LOCATION_OPTIONS.map((loc) => (
                              <span key={loc} className={cn("rounded-md px-2 py-0.5 text-sm font-medium transition-colors", currentLocation.includes(loc) ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-muted text-muted-foreground")}>
                                {loc}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                            {currentSeniority.map((s) => (
                              <span key={s} className="rounded bg-muted px-1.5 py-0.5 font-medium">{s}</span>
                            ))}
                            {currentType.map((t) => (
                              <span key={t} className="rounded bg-muted px-1.5 py-0.5 font-medium">{t}</span>
                            ))}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isEditing && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                              <div className="space-y-4 rounded-b-xl border border-t-0 border-[#3b82f6]/40 bg-[#f8fbff] p-4 pt-3">
                                {/* Editable Role Title */}
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Role Title</label>
                                  <Input
                                    type="text"
                                    value={currentRole}
                                    onChange={(e) => setAiProfileOverrides((prev) => ({ ...prev, [profile.id]: { ...prev[profile.id], role: e.target.value } }))}
                                    className="mt-1.5 h-8 rounded-lg border-border/60 bg-background text-sm font-semibold focus:border-[#3b82f6]"
                                    disabled={isRunning}
                                  />
                                </div>
                                {/* Targeting Locations */}
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Targeting Locations</label>
                                  <Input type="text" value={currentTargeting} onChange={(e) => setAiProfileOverrides((prev) => ({ ...prev, [profile.id]: { ...prev[profile.id], targetingLocations: e.target.value } }))} placeholder="e.g. United States, New York" className="mt-1.5 h-8 rounded-lg border-border/60 bg-background text-sm placeholder:text-muted-foreground/50 focus:border-[#3b82f6]" disabled={isRunning} />
                                </div>
                                {/* Remote chips */}
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Remote</label>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {LOCATION_OPTIONS.map((loc) => (
                                      <button key={loc} type="button" className={cn("rounded-md border px-2.5 py-1 text-sm font-medium transition-all", currentLocation.includes(loc) ? "border-[#3b82f6]/40 bg-[#dbeafe] text-[#1d4ed8]" : "border-border/60 bg-background text-muted-foreground hover:border-border")} onClick={() => toggleLocationChip(profile.id, loc)} disabled={isRunning}>
                                        {loc}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {/* Experience level chips */}
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Experience level</label>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {SENIORITY_OPTIONS.map((s) => {
                                      const active = currentSeniority.includes(s)
                                      return (
                                        <button key={s} type="button" className={cn("rounded-md border px-2.5 py-1 text-sm font-medium transition-all", active ? "border-[#3b82f6]/40 bg-[#dbeafe] text-[#1d4ed8]" : "border-border/60 bg-background text-muted-foreground hover:border-border")} onClick={() => {
                                          setAiProfileOverrides((prev) => {
                                            const cur = prev[profile.id]?.seniority || [AI_PROFILES.find((p) => p.id === profile.id)?.seniority || "Senior"]
                                            const updated = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]
                                            return { ...prev, [profile.id]: { ...prev[profile.id], seniority: updated.length ? updated : [s] } }
                                          })
                                        }} disabled={isRunning}>
                                          {s}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                                {/* Job Type chips */}
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Job Type</label>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {JOB_TYPE_OPTIONS.map((t) => {
                                      const active = currentType.includes(t)
                                      return (
                                        <button key={t} type="button" className={cn("rounded-md border px-2.5 py-1 text-sm font-medium transition-all", active ? "border-[#3b82f6]/40 bg-[#dbeafe] text-[#1d4ed8]" : "border-border/60 bg-background text-muted-foreground hover:border-border")} onClick={() => {
                                          setAiProfileOverrides((prev) => {
                                            const cur = prev[profile.id]?.type || [AI_PROFILES.find((p) => p.id === profile.id)?.type || "Full-time"]
                                            const updated = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
                                            return { ...prev, [profile.id]: { ...prev[profile.id], type: updated.length ? updated : [t] } }
                                          })
                                        }} disabled={isRunning}>
                                          {t}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>

                {/* Create Custom (Coming Soon) */}
                <div className="mt-3">
                  <button type="button" className="flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl border border-dashed border-border/60 text-sm font-medium text-muted-foreground" disabled>
                    <Plus className="mr-1.5 h-3 w-3" strokeWidth={1.5} />
                    Custom Profile (Coming Soon)
                  </button>
                </div>

                {/* Apply to selected role + Start */}
                {steps.step2 === "in-progress" && !isRunning && (
                  <div className="mt-7 space-y-2.5">
                    <button
                      type="button"
                      className={cn(
                        "flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all",
                        selectedProfile
                          ? "bg-foreground text-background shadow-lg shadow-black/10 hover:opacity-90"
                          : "cursor-not-allowed bg-muted text-muted-foreground"
                      )}
                      onClick={handleStartApplying}
                      disabled={!selectedProfile}
                    >
                      Apply to selected role
                    </button>
                    <button
                      type="button"
                      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground hover:shadow-sm"
                      onClick={handleGoToLinkedIn}
                    >
                      {"Start \u2192"}
                    </button>
                  </div>
                )}
              </StepAccordion>

              {/* Step 3: Start Fill */}
              <StepAccordion number={3} title="Start Fill" status={steps.step3} isActive={activeStep === 3} onToggle={() => { if (steps.step3 !== "not-started") handleStepToggle(3) }} canToggle={steps.step3 !== "not-started"}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-foreground">Apply the top</span>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={topPositions}
                      onChange={(e) => setTopPositions(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      onFocus={(e) => e.target.select()}
                      className="h-8 w-16 rounded-lg border-border/60 bg-muted/50 text-center text-sm font-bold tabular-nums text-foreground"
                      disabled={runState !== "idle"}
                    />
                    <span className="text-sm font-medium text-foreground">positions</span>
                  </div>

                  {/* Apply the Selected */}
                  <button
                    type="button"
                    className={cn(
                      "flex h-11 w-full items-center justify-center rounded-xl border-2 border-foreground text-sm font-bold tracking-wide transition-all",
                      runState === "idle"
                        ? "bg-background text-foreground hover:bg-muted"
                        : "cursor-not-allowed border-muted bg-muted text-muted-foreground"
                    )}
                    onClick={runState === "idle" ? handleApplySelected : undefined}
                    disabled={runState !== "idle"}
                  >
                    Apply the Selected
                  </button>

                  {/* Apply All */}
                  <button
                    type="button"
                    className={cn(
                      "flex h-11 w-full items-center justify-center rounded-xl border-2 text-sm font-bold tracking-wide transition-all",
                      runState === "idle"
                        ? "border-foreground bg-background text-foreground hover:bg-muted"
                        : "cursor-not-allowed border-muted bg-muted text-muted-foreground"
                    )}
                    onClick={runState === "idle" ? handleApplyAll : undefined}
                    disabled={runState !== "idle"}
                  >
                    Apply All
                  </button>

                  <button type="button" className="flex h-11 w-full cursor-not-allowed items-center justify-center rounded-xl border border-dashed border-border/60 text-sm font-medium text-muted-foreground" disabled>
                    Recommend (coming soon)
                  </button>
                </div>
              </StepAccordion>
            </div>

            {/* ─── Footer ────────────────────────────────── */}
            <div className="shrink-0 border-t border-border px-6 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] leading-relaxed text-muted-foreground/60">
                  Y.EAA does not store credentials or login sessions.
                </p>
                <button type="button" className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground" onClick={handleLogout}>
                  <LogOut className="h-2.5 w-2.5" strokeWidth={1.5} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* ─── Paste Modal ─────────────────────────────── */}
            <AnimatePresence>
              {pasteModalOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/97 backdrop-blur-md">
                  <div className="w-full max-w-[320px] px-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold tracking-tight text-foreground">Paste Resume</h3>
                      <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => { setPasteModalOpen(false); setPasteText("") }}>
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="mt-5 space-y-3">
                      <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste your resume text here" className="min-h-[180px] resize-none rounded-xl border-border/60 bg-muted/30 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20" autoFocus />
                      <div className="flex gap-2.5">
                        <button type="button" className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground" onClick={() => { setPasteModalOpen(false); setPasteText("") }}>Cancel</button>
                        <button type="button" className={cn("flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-bold transition-all", pasteText.trim() ? "bg-foreground text-background hover:opacity-90" : "cursor-not-allowed bg-muted text-muted-foreground")} onClick={handlePasteSubmit} disabled={!pasteText.trim()}>Upload</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Confirmation Modal (frosted glass) ─────── */}
            <AnimatePresence>
              {confirmModalOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl">
                  <div className="w-full max-w-[300px] px-6">
                    <h3 className="text-[17px] font-bold tracking-tight text-foreground">Before you continue</h3>
                    <div className="mt-4 space-y-3.5">
                      {selectedProfile && AI_PROFILES.find((p) => p.id === selectedProfile) && (
                        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                          <p className="text-sm font-medium text-muted-foreground">Target position</p>
                          <p className="mt-0.5 text-sm font-semibold text-foreground">{getProfileField(selectedProfile, "role") as string}</p>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Y.EAA will open each position in a separate tab, fill the Easy Apply form, and pause at the review step for you to submit or discard.
                      </p>
                      <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                        <li className="flex items-start gap-2.5">
                          <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                          Each tab stops at the review page -- you decide what to submit.
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                          You are responsible for all submissions made.
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                          Platform behavior may change at any time.
                        </li>
                      </ul>
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input type="checkbox" checked={confirmAcknowledged} onChange={(e) => setConfirmAcknowledged(e.target.checked)} className="h-4 w-4 rounded border-border accent-foreground" />
                        <span className="text-sm font-semibold text-foreground">I understand</span>
                      </label>
                    </div>
                    <div className="mt-6 flex gap-2.5">
                      <button type="button" className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground transition-all hover:border-border hover:text-foreground" onClick={() => { setConfirmModalOpen(false); setConfirmAcknowledged(false) }}>
                        Cancel
                      </button>
                      <button type="button" className={cn("flex h-10 flex-1 items-center justify-center rounded-xl border text-sm font-semibold transition-all", confirmAcknowledged ? "border-foreground text-foreground hover:bg-muted" : "cursor-not-allowed border-muted text-muted-foreground")} onClick={handleConfirmProceed} disabled={!confirmAcknowledged}>
                        Proceed
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/* ─── Step Accordion ──────────────────────────────────── */

function StepAccordion({
  number,
  title,
  status,
  isActive,
  onToggle,
  canToggle,
  titleAction,
  children,
}: {
  number: number
  title: string
  status: StepStatus
  isActive: boolean
  onToggle: () => void
  canToggle: boolean
  titleAction?: React.ReactNode
  children: React.ReactNode
}) {
  const indicator = STEP_INDICATOR[status]

  return (
    <div className="border-b border-border">
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between px-6 py-5 text-left transition-colors",
          canToggle ? "hover:bg-muted/50" : "cursor-default"
        )}
        onClick={onToggle}
        disabled={!canToggle}
      >
        <div className="flex items-center gap-3.5">
          <span className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ring-1 transition-colors",
            indicator.bg, indicator.ring, indicator.text,
            status === "completed" && "ring-0"
          )}>
            {status === "completed" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : number}
          </span>
          <span className={cn(
            "text-[15px] font-bold transition-colors",
            status === "not-started" ? "text-muted-foreground" : "text-foreground"
          )}>
            {title}
          </span>
          {titleAction && <span className="ml-1">{titleAction}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
            status === "not-started" && "bg-muted text-muted-foreground",
            status === "in-progress" && "bg-[#eff6ff] text-[#1d4ed8]",
            status === "completed" && "bg-[#f0fdf4] text-[#15803d]",
          )}>
            {STATUS_COPY[status]}
          </span>
          {canToggle && (
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", isActive && "rotate-180")} strokeWidth={1.5} />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-7 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
