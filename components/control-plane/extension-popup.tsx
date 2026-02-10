"use client"

import React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
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
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

/* ─── Types ───────────────────────────────────────────── */

type StepStatus = "not-started" | "in-progress" | "completed" | "invalidated"

interface StepState {
  step1: StepStatus
  step2: StepStatus
  step3: StepStatus
}

interface ExtensionPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/* ─── Status Color Map (Industrial Silence) ──────────── */

const STATUS_BAR: Record<StepStatus, string> = {
  completed: "bg-[#16a34a]",
  "in-progress": "bg-[#002366]",
  invalidated: "bg-[#ca8a04]",
  "not-started": "bg-[#e2e8f0]",
}

const STATUS_TEXT: Record<StepStatus, string> = {
  completed: "text-white",
  "in-progress": "text-white",
  invalidated: "text-white",
  "not-started": "text-[#64748b]",
}

/* ─── Mock: Referral Code Verification ────────────────── */

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

/* ─── Mock: Resume Analysis ───────────────────────────── */

const ANALYSIS_MESSAGES = [
  "Analyzing resume structure\u2026",
  "Mapping career trajectory\u2026",
  "Extracting experience timeline\u2026",
  "Mapping skills to market taxonomy\u2026",
  "Identifying target roles\u2026",
  "Finalizing recommendations\u2026",
]

const MOCK_ROLES = [
  { title: "Senior Software Engineer", confidence: 0.94 },
  { title: "Staff Engineer", confidence: 0.87 },
]

/* ─── Main Component ──────────────────────────────────── */

export function ExtensionPopup({ open, onOpenChange }: ExtensionPopupProps) {
  const [quota, setQuota] = useState(5)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [steps, setSteps] = useState<StepState>({
    step1: "in-progress",
    step2: "not-started",
    step3: "not-started",
  })

  // Step 1 state
  const [apiKey, setApiKey] = useState("")
  const [keyStatus, setKeyStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle")
  const [resumeModalOpen, setResumeModalOpen] = useState(false)
  const [resumeModalMode, setResumeModalMode] = useState<"choose" | "paste" | null>(null)
  const [pasteText, setPasteText] = useState("")
  const [sources, setSources] = useState<{ name: string; type: string }[]>([])

  // Step 2 state
  const [currentMessage, setCurrentMessage] = useState("")
  const [roles, setRoles] = useState<typeof MOCK_ROLES>([])
  const [analysisComplete, setAnalysisComplete] = useState(false)

  // Step 3 state (authorization overlay)
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [pendingRole, setPendingRole] = useState<string | null>(null)

  // Referral state
  const [referralCode, setReferralCode] = useState("")
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [appliedCodes, setAppliedCodes] = useState<string[]>([])

  const hasSources = sources.length > 0
  const quotaIsZero = quota === 0

  /* ─── Step 1: API Key Validation (status-only, not blocking) */

  const handleValidateKey = useCallback(async () => {
    if (!apiKey.trim()) return
    setKeyStatus("checking")
    await new Promise((r) => setTimeout(r, 1500))
    if (apiKey.startsWith("sk-") && apiKey.length > 5) {
      setKeyStatus("valid")
    } else {
      setKeyStatus("invalid")
    }
  }, [apiKey])

  /* ─── Step 1: Source auto-completes step ────────────── */

  useEffect(() => {
    if (hasSources && steps.step1 === "in-progress") {
      setSteps((prev) => ({ ...prev, step1: "completed", step2: "in-progress" }))
      setActiveStep(2)
    }
  }, [hasSources, steps.step1])

  /* ─── Step 1: Resume modal helpers ─────────────────── */

  const handleUploadPDF = useCallback(() => {
    setSources((prev) => [...prev, { name: "resume_2026.pdf", type: "PDF" }])
    setResumeModalOpen(false)
    setResumeModalMode(null)
  }, [])

  const handlePasteSubmit = useCallback(() => {
    if (pasteText.trim()) {
      setSources((prev) => [
        ...prev,
        { name: `Pasted (${pasteText.trim().split(/\s+/).length} words)`, type: "Text" },
      ])
      setPasteText("")
      setResumeModalOpen(false)
      setResumeModalMode(null)
    }
  }, [pasteText])

  /* ─── Step 1 Reopen (Invalidates downstream) ────────── */

  const handleReopenStep1 = useCallback(() => {
    setActiveStep(1)
    setSteps({
      step1: "in-progress",
      step2: steps.step2 !== "not-started" ? "invalidated" : "not-started",
      step3: steps.step3 !== "not-started" ? "invalidated" : "not-started",
    })
    setSources([])
    setCurrentMessage("")
    setRoles([])
    setAnalysisComplete(false)
    setPendingRole(null)
    analysisRef.current = false
  }, [steps])

  /* ─── Step 2 Analysis (auto-starts) ────────────────── */

  const analysisRef = useRef(false)

  useEffect(() => {
    if (steps.step2 !== "in-progress" || analysisRef.current) return
    analysisRef.current = true

    let idx = 0
    const msgInterval = setInterval(() => {
      if (idx < ANALYSIS_MESSAGES.length) {
        setCurrentMessage(ANALYSIS_MESSAGES[idx])
        idx++
      } else {
        clearInterval(msgInterval)
      }
    }, 800)

    const roleTimeouts = MOCK_ROLES.map((role, i) =>
      setTimeout(() => {
        setRoles((prev) => [...prev, role])
        if (i === MOCK_ROLES.length - 1) setAnalysisComplete(true)
      }, 3000 + i * 1500)
    )

    return () => {
      clearInterval(msgInterval)
      for (const t of roleTimeouts) clearTimeout(t)
    }
  }, [steps.step2])

  /* ─── Step 2: Direct action (click role = trigger auth overlay) */

  const handleRoleClick = useCallback((title: string) => {
    setPendingRole(title)
    setShowAuthOverlay(true)
  }, [])

  /* ─── Step 3: Authorization confirmed ──────────────── */

  const handleAuthorize = useCallback(() => {
    setShowAuthOverlay(false)
    setSteps((prev) => ({ ...prev, step2: "completed", step3: "completed" }))
    // Mock: in production this would trigger LinkedIn redirect
  }, [])

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
      setQuota((prev) => prev + result.quotaAdded!)
      setAppliedCodes((prev) => [...prev, code])
      setReferralCode("")
    } else {
      setReferralError(result.error || "Invalid")
      setTimeout(() => setReferralError(null), 3000)
    }
    setReferralLoading(false)
  }, [referralCode, appliedCodes])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[380px] flex-col border-l border-[#e2e8f0] bg-white p-0 sm:w-[380px]"
      >
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="shrink-0 px-5 pb-0 pt-5">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-sans text-2xl font-bold text-[#002366]">
                Y.EAA
              </SheetTitle>
              {/* Balance pill */}
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all",
                  quotaIsZero
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-[#e2e8f0] bg-[#f8fafc] text-[#334155] hover:border-[#cbd5e1]"
                )}
                onClick={() => setDrawerOpen(!drawerOpen)}
              >
                <span>Balance:</span>
                <span className="font-mono font-semibold">{quota}</span>
                <span>Applications</span>
                <Plus className="ml-0.5 h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          </SheetHeader>
        </div>

        {/* ─── Quota Progress Bar (2px) ──────────────────── */}
        <div className="mt-3 h-[2px] w-full bg-[#e2e8f0]">
          <motion.div
            className={cn(
              "h-full",
              quotaIsZero ? "bg-red-500" : "bg-[#002366]"
            )}
            initial={false}
            animate={{ width: `${Math.min((quota / 10) * 100, 100)}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* ─── Accordion Steps ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ─── Step 1: SETUP & IDENTITY ───────────────── */}
          <AccordionStep
            number={1}
            title="Setup & Identity"
            status={steps.step1}
            statusLabel={steps.step1 === "completed" ? "Complete" : steps.step1 === "in-progress" ? "Incomplete" : ""}
            isActive={activeStep === 1}
            onToggle={() => {
              if (activeStep === 1) return
              if (steps.step1 === "completed") handleReopenStep1()
            }}
            canToggle={steps.step1 === "completed" || steps.step1 === "in-progress"}
          >
            {/* Upload your resume (opens modal) */}
            <div className="space-y-3">
              <p className="text-[11px] font-medium text-[#64748b]">Upload your resume</p>
              {sources.length > 0 && (
                <div className="space-y-1.5">
                  {sources.map((src, i) => (
                    <div
                      key={`src-${i}`}
                      className="flex items-center gap-2 rounded border border-[#16a34a]/30 bg-[#16a34a]/5 px-3 py-2"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" strokeWidth={1.5} />
                      <span className="flex-1 truncate text-[11px] text-[#0a0a0a]">{src.name}</span>
                      <span className="shrink-0 text-[9px] uppercase text-[#64748b]">{src.type}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-[#cbd5e1] px-3 py-4 text-[12px] font-medium text-[#64748b] transition-all hover:border-[#002366]/40 hover:bg-[#002366]/[0.02] hover:text-[#002366]"
                onClick={() => {
                  setResumeModalOpen(true)
                  setResumeModalMode("choose")
                }}
              >
                <Upload className="h-4 w-4" strokeWidth={1.5} />
                {sources.length > 0 ? "Add more" : "Click to upload"}
              </button>
            </div>

            {/* Gemini API Key */}
            <div className="mt-5 space-y-2">
              <p className="text-[11px] font-medium text-[#64748b]">Gemini API Key</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#94a3b8]" strokeWidth={1.5} />
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      if (keyStatus !== "idle") setKeyStatus("idle")
                    }}
                    placeholder="sk-..."
                    className={cn(
                      "h-9 rounded border bg-transparent pl-9 text-sm placeholder:text-[#94a3b8]",
                      keyStatus === "valid"
                        ? "border-[#16a34a] focus:border-[#16a34a]"
                        : keyStatus === "invalid"
                        ? "border-red-400 focus:border-red-400"
                        : "border-[#e2e8f0]"
                    )}
                  />
                </div>
                {/* Ghost button for validate */}
                <button
                  type="button"
                  className={cn(
                    "flex h-9 shrink-0 items-center justify-center rounded border px-4 text-[11px] font-medium transition-all",
                    keyStatus === "valid"
                      ? "border-[#16a34a] text-[#16a34a]"
                      : "border-[#e2e8f0] text-[#64748b] hover:border-[#002366]/40 hover:text-[#002366] hover:shadow-[0_0_0_1px_rgba(0,35,102,0.08)]"
                  )}
                  onClick={handleValidateKey}
                  disabled={!apiKey.trim() || keyStatus === "checking"}
                >
                  {keyStatus === "checking" ? (
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
                  ) : keyStatus === "valid" ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    "Validate"
                  )}
                </button>
              </div>
              {keyStatus === "checking" && (
                <p className="text-[10px] text-[#94a3b8]">{"Validating connection\u2026"}</p>
              )}
              {keyStatus === "valid" && (
                <p className="text-[10px] text-[#16a34a]">Key verified</p>
              )}
              {keyStatus === "invalid" && (
                <p className="text-[10px] text-red-500">Invalid key. Please check and try again.</p>
              )}
            </div>
          </AccordionStep>

          {/* ─── Step 2: INTENT & ANALYSIS ──────────────── */}
          <AccordionStep
            number={2}
            title="Intent & Analysis"
            status={steps.step2}
            statusLabel={steps.step2 === "completed" ? "Complete" : steps.step2 === "in-progress" ? "Analyzing" : ""}
            isActive={activeStep === 2}
            onToggle={() => {
              if (steps.step2 === "completed" || steps.step2 === "in-progress") {
                setActiveStep(2)
              }
            }}
            canToggle={steps.step2 === "completed" || steps.step2 === "in-progress"}
          >
            {/* Terminal / Comment feed */}
            {currentMessage && (
              <div className="mb-4 rounded border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="font-mono text-[10px] text-[#64748b]"
                  >
                    <span className="mr-1.5 text-[#002366]">{'>'}</span>
                    {currentMessage}
                    {!analysisComplete && (
                      <span className="ml-1.5 inline-block h-1 w-1 animate-pulse rounded-full bg-[#002366]" />
                    )}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}

            {/* "Apply Now" label above positions */}
            {roles.length > 0 && (
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                Apply Now
              </p>
            )}

            {/* Positions as Ghost Buttons (direct action: click = redirect) */}
            {roles.length > 0 && (
              <div className="space-y-2">
                {roles.map((role) => (
                  <motion.button
                    key={role.title}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group flex w-full items-center justify-between rounded border border-[#e2e8f0] bg-transparent px-4 py-3.5 text-left transition-all hover:border-[#002366]/40 hover:shadow-[0_0_8px_rgba(0,35,102,0.06)]"
                    onClick={() => handleRoleClick(role.title)}
                  >
                    <span className="text-sm font-medium text-[#0f172a] transition-colors group-hover:text-[#002366]">
                      {role.title}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#cbd5e1] transition-all group-hover:translate-x-0.5 group-hover:text-[#002366]" strokeWidth={1.5} />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Invalidated notice */}
            {steps.step2 === "invalidated" && (
              <div className="mt-3 flex items-center gap-2 rounded border border-[#ca8a04]/20 bg-[#ca8a04]/5 px-3 py-2">
                <AlertCircle className="h-3 w-3 shrink-0 text-[#ca8a04]" strokeWidth={1.5} />
                <p className="text-[10px] text-[#ca8a04]">
                  Setup was modified. Re-upload to continue.
                </p>
              </div>
            )}
          </AccordionStep>
        </div>

        {/* ─── Footer ────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#e2e8f0] px-5 py-3">
          <p className="text-center text-[9px] text-[#94a3b8]">
            Y.EAA does not store credentials, cookies, or login sessions.
          </p>
        </div>

        {/* ─── Authorization Overlay (Step 3) ────────────── */}
        <AnimatePresence>
          {showAuthOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
            >
              <div className="w-full max-w-[320px] px-6">
                <h3 className="text-lg font-semibold text-[#0f172a]">Before you continue</h3>
                <div className="mt-4 space-y-3">
                  <p className="text-[12px] leading-relaxed text-[#64748b]">
                    Y.EAA will open LinkedIn Easy Apply for the selected position. The system:
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      "Operates only within your current browser tab",
                      "Does not auto-submit any applications",
                      "Does not store your LinkedIn credentials",
                      "Will pre-fill form fields using your resume data",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[#64748b]" />
                        <span className="text-[11px] leading-relaxed text-[#64748b]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {pendingRole && (
                  <div className="mt-4 rounded border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                    <span className="text-[10px] text-[#94a3b8]">Target position:</span>
                    <p className="text-[12px] font-medium text-[#0f172a]">{pendingRole}</p>
                  </div>
                )}

                <button
                  type="button"
                  className="mt-5 flex items-center gap-2"
                  onClick={() => setAuthChecked(!authChecked)}
                >
                  {authChecked ? (
                    <CheckSquare className="h-4 w-4 text-[#002366]" strokeWidth={1.5} />
                  ) : (
                    <Square className="h-4 w-4 text-[#cbd5e1]" strokeWidth={1.5} />
                  )}
                  <span className="text-[12px] text-[#334155]">I understand</span>
                </button>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    className="flex h-10 flex-1 items-center justify-center rounded border border-[#e2e8f0] text-[12px] font-medium text-[#64748b] transition-all hover:border-[#cbd5e1] hover:text-[#334155]"
                    onClick={() => {
                      setShowAuthOverlay(false)
                      setPendingRole(null)
                      setAuthChecked(false)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex h-10 flex-1 items-center justify-center rounded text-[12px] font-semibold transition-all",
                      authChecked
                        ? "bg-[#002366] text-white hover:bg-[#001a4d] hover:shadow-[0_0_12px_rgba(0,35,102,0.15)]"
                        : "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
                    )}
                    onClick={authChecked ? handleAuthorize : undefined}
                    disabled={!authChecked}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Resume Upload Modal Overlay ────────────────── */}
        <AnimatePresence>
          {resumeModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
            >
              <div className="w-full max-w-[320px] px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#0f172a]">Add source material</h3>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center text-[#94a3b8] hover:text-[#0f172a]"
                    onClick={() => {
                      setResumeModalOpen(false)
                      setResumeModalMode("choose")
                      setPasteText("")
                    }}
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>

                {resumeModalMode === "choose" && (
                  <div className="mt-6 space-y-3">
                    {/* Upload PDF tile */}
                    <button
                      type="button"
                      className="group flex w-full items-center gap-4 rounded border border-[#e2e8f0] bg-transparent px-5 py-5 text-left transition-all hover:border-[#002366]/40 hover:shadow-[0_0_8px_rgba(0,35,102,0.06)]"
                      onClick={handleUploadPDF}
                    >
                      <Upload className="h-5 w-5 text-[#94a3b8] transition-colors group-hover:text-[#002366]" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-[#0f172a]">Upload PDF</p>
                        <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOC, or DOCX</p>
                      </div>
                    </button>

                    {/* Paste Text tile */}
                    <button
                      type="button"
                      className="group flex w-full items-center gap-4 rounded border border-[#e2e8f0] bg-transparent px-5 py-5 text-left transition-all hover:border-[#002366]/40 hover:shadow-[0_0_8px_rgba(0,35,102,0.06)]"
                      onClick={() => setResumeModalMode("paste")}
                    >
                      <ClipboardPaste className="h-5 w-5 text-[#94a3b8] transition-colors group-hover:text-[#002366]" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-[#0f172a]">Paste Text</p>
                        <p className="mt-0.5 text-[10px] text-[#94a3b8]">Plain text resume content</p>
                      </div>
                    </button>
                  </div>
                )}

                {resumeModalMode === "paste" && (
                  <div className="mt-6 space-y-3">
                    <Textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Paste your resume text here"
                      className="min-h-[160px] resize-none rounded border-[#e2e8f0] bg-transparent text-sm leading-relaxed placeholder:text-[#94a3b8] focus:border-[#002366]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex h-9 flex-1 items-center justify-center rounded border border-[#e2e8f0] text-[11px] font-medium text-[#64748b] hover:border-[#cbd5e1]"
                        onClick={() => setResumeModalMode("choose")}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "flex h-9 flex-1 items-center justify-center rounded text-[11px] font-semibold transition-all",
                          pasteText.trim()
                            ? "bg-[#002366] text-white hover:bg-[#001a4d]"
                            : "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
                        )}
                        onClick={handlePasteSubmit}
                        disabled={!pasteText.trim()}
                      >
                        Add source
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Bottom Drawer: Referral Code ──────────────── */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/10"
                onClick={() => setDrawerOpen(false)}
              />
              {/* Drawer */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-[#e2e8f0] bg-white"
              >
                <div className="px-5 pb-6 pt-4">
                  {/* Drag handle */}
                  <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-[#e2e8f0]" />
                  <p className="text-[12px] font-semibold text-[#0f172a]">Referral Code</p>
                  <p className="mt-1 text-[10px] text-[#94a3b8]">
                    Adds applications to your remaining balance.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !referralLoading) handleApplyReferral()
                      }}
                      placeholder="Enter referral code"
                      disabled={referralLoading}
                      className="h-10 flex-1 rounded border-[#e2e8f0] bg-transparent text-sm placeholder:text-[#94a3b8]"
                    />
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 shrink-0 items-center justify-center rounded px-5 text-[12px] font-semibold transition-all",
                        referralCode.trim() && !referralLoading
                          ? "bg-[#002366] text-white hover:bg-[#001a4d]"
                          : "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
                      )}
                      onClick={handleApplyReferral}
                      disabled={referralLoading || referralCode.trim().length === 0}
                    >
                      {referralLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                      ) : (
                        "Redeem"
                      )}
                    </button>
                  </div>
                  {referralError && (
                    <p className="mt-2 text-[10px] text-red-500">{referralError}</p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  )
}

/* ─── Accordion Step Component ────────────────────────── */

function AccordionStep({
  number,
  title,
  status,
  statusLabel,
  isActive,
  onToggle,
  canToggle,
  children,
}: {
  number: number
  title: string
  status: StepStatus
  statusLabel?: string
  isActive: boolean
  onToggle: () => void
  canToggle: boolean
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[#e2e8f0]">
      {/* Step header (full-bar color) */}
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors",
          STATUS_BAR[status],
          canToggle ? "hover:opacity-90" : "cursor-default"
        )}
        onClick={onToggle}
        disabled={!canToggle}
      >
        <span className={cn("font-mono text-[10px] font-bold", STATUS_TEXT[status])}>{number}</span>
        <span className={cn("text-[13px] font-semibold", STATUS_TEXT[status])}>{title}</span>
        {statusLabel && (
          <span className={cn("ml-auto text-[10px] font-medium opacity-70", STATUS_TEXT[status])}>
            {statusLabel}
          </span>
        )}
        {status === "completed" && (
          <Check className={cn("h-3.5 w-3.5", statusLabel ? "ml-1.5" : "ml-auto", "text-white")} strokeWidth={2} />
        )}
        {status === "invalidated" && (
          <AlertCircle className="ml-auto h-3.5 w-3.5 text-white" strokeWidth={1.5} />
        )}
        {status === "in-progress" && !statusLabel && (
          <ChevronRight className={cn("ml-auto h-3.5 w-3.5 transition-transform", isActive && "rotate-90", STATUS_TEXT[status])} strokeWidth={1.5} />
        )}
      </button>

      {/* Step content */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
