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
  ChevronRight,
  Pause,
  Square,
  Play,
  Lock,
  MapPin,
  Briefcase,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

/* ─── Types ───────────────────────────────────────────── */

type StepStatus = "not-started" | "in-progress" | "completed"

interface StepState {
  step1: StepStatus
  step2: StepStatus
  step3: StepStatus
}

type RunState = "idle" | "running" | "paused" | "stopped"

interface ExtensionPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/* ─── Status Color Map ────────────────────────────────── */
/* Yellow = not started, Blue (#ADD8E6) = active, Green = completed */

const STATUS_BAR: Record<StepStatus, string> = {
  completed: "bg-[#16a34a]",
  "in-progress": "bg-[#ADD8E6]",
  "not-started": "bg-[#FFF44F]",
}

const STATUS_TEXT: Record<StepStatus, string> = {
  completed: "text-white",
  "in-progress": "text-[#0f172a]",
  "not-started": "text-[#0f172a]",
}

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

/* ─── Main Component ──────────────────────────────────── */

export function ExtensionPopup({ open, onOpenChange }: ExtensionPopupProps) {
  const [quota, setQuota] = useState(5)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [useOwnKey, setUseOwnKey] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [steps, setSteps] = useState<StepState>({
    step1: "not-started",
    step2: "not-started",
    step3: "not-started",
  })

  // Quick link
  const [jobLink, setJobLink] = useState("")

  // Step 1: Upload Resume
  const [resumeModalOpen, setResumeModalOpen] = useState(false)
  const [resumeModalMode, setResumeModalMode] = useState<"choose" | "paste" | null>(null)
  const [pasteText, setPasteText] = useState("")
  const [parsingStatus, setParsingStatus] = useState<"idle" | "parsing" | "done">("idle")
  const [resumeName, setResumeName] = useState<string | null>(null)

  // Step 2: Create Job Profile
  const [profileLocked, setProfileLocked] = useState(false)
  const [locationRemote, setLocationRemote] = useState(true)
  const [seniority, setSeniority] = useState("senior")
  const [jobType, setJobType] = useState("full-time")
  const [sponsorship, setSponsorship] = useState(true)
  const [eeoOptOut, setEeoOptOut] = useState(true)

  // Step 3: Search Results Controller
  const [detectedPositions, setDetectedPositions] = useState(14)
  const [runState, setRunState] = useState<RunState>("idle")

  // Referral
  const [referralCode, setReferralCode] = useState("")
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [appliedCodes, setAppliedCodes] = useState<string[]>([])

  const quotaIsZero = quota === 0

  /* ─── Step 1: Resume Upload ─────────────────────────── */

  const simulateParsing = useCallback((name: string) => {
    setResumeName(name)
    setParsingStatus("parsing")
    setSteps((prev) => ({ ...prev, step1: "in-progress" }))
    setActiveStep(1)
    setTimeout(() => {
      setParsingStatus("done")
      setSteps((prev) => ({ ...prev, step1: "completed", step2: prev.step2 === "not-started" ? "in-progress" : prev.step2 }))
      setTimeout(() => setActiveStep(2), 400)
    }, 2500)
  }, [])

  const handleUploadPDF = useCallback(() => {
    setResumeModalOpen(false)
    setResumeModalMode(null)
    simulateParsing("resume_2026.pdf")
  }, [simulateParsing])

  const handlePasteSubmit = useCallback(() => {
    if (pasteText.trim()) {
      setResumeModalOpen(false)
      setResumeModalMode(null)
      simulateParsing(`Pasted (${pasteText.trim().split(/\s+/).length} words)`)
      setPasteText("")
    }
  }, [pasteText, simulateParsing])

  /* ─── Step 2: Lock after first run ──────────────────── */

  const handleStartRun = useCallback(() => {
    setProfileLocked(true)
    setSteps((prev) => ({ ...prev, step2: "completed", step3: "in-progress" }))
    setActiveStep(3)
  }, [])

  /* ─── Step 3: Run State ─────────────────────────────── */

  const handleApplyAll = useCallback(() => {
    setRunState("running")
  }, [])

  const handlePause = useCallback(() => {
    setRunState("paused")
  }, [])

  const handleResume = useCallback(() => {
    setRunState("running")
  }, [])

  const handleStop = useCallback(() => {
    setRunState("stopped")
    setQuota((prev) => Math.max(prev - 1, 0))
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
      setQuota((prev) => Math.min(prev + result.quotaAdded!, 15))
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
        {/* ─── Run State Banner ─────────────────────────── */}
        <AnimatePresence>
          {runState !== "idle" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden"
            >
              <div className={cn(
                "flex items-center justify-between px-5 py-2.5",
                runState === "running" && "bg-[#ADD8E6]/30",
                runState === "paused" && "bg-[#FFF44F]/20",
                runState === "stopped" && "bg-red-50"
              )}>
                <div>
                  <p className="text-[12px] font-semibold text-[#0f172a]">
                    {runState === "running" && "Applying\u2026"}
                    {runState === "paused" && "Paused."}
                    {runState === "stopped" && "Session stopped."}
                  </p>
                  {runState === "stopped" && (
                    <p className="text-[10px] text-[#64748b]">1 credit deducted.</p>
                  )}
                </div>
                {runState !== "stopped" && (
                  <div className="flex gap-2">
                    {runState === "running" && (
                      <>
                        <button
                          type="button"
                          className="flex h-7 items-center gap-1.5 rounded border border-[#e2e8f0] bg-white px-3 text-[11px] font-medium text-[#334155] transition-all hover:border-[#cbd5e1]"
                          onClick={handlePause}
                        >
                          <Pause className="h-3 w-3" strokeWidth={1.5} />
                          Pause
                        </button>
                        <button
                          type="button"
                          className="flex h-7 items-center gap-1.5 rounded border border-red-200 bg-white px-3 text-[11px] font-medium text-red-600 transition-all hover:bg-red-50"
                          onClick={handleStop}
                        >
                          <Square className="h-3 w-3" strokeWidth={1.5} />
                          Stop
                        </button>
                      </>
                    )}
                    {runState === "paused" && (
                      <>
                        <button
                          type="button"
                          className="flex h-7 items-center gap-1.5 rounded bg-[#002366] px-3 text-[11px] font-medium text-white transition-all hover:bg-[#001a4d]"
                          onClick={handleResume}
                        >
                          <Play className="h-3 w-3" strokeWidth={1.5} />
                          Resume
                        </button>
                        <button
                          type="button"
                          className="flex h-7 items-center gap-1.5 rounded border border-red-200 bg-white px-3 text-[11px] font-medium text-red-600 transition-all hover:bg-red-50"
                          onClick={handleStop}
                        >
                          <Square className="h-3 w-3" strokeWidth={1.5} />
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Header ─────────────────────────────────────── */}
        <div className="shrink-0 px-5 pb-0 pt-5">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <SheetTitle
                className="text-2xl font-bold text-[#0f172a]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Y.EAA
              </SheetTitle>
              {/* Balance pill */}
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all",
                  quotaIsZero
                    ? "border-transparent bg-red-500 text-white"
                    : "border-[#e2e8f0] bg-transparent text-[#334155] hover:border-[#cbd5e1]"
                )}
                onClick={() => setDrawerOpen(!drawerOpen)}
              >
                <span>Balance:</span>
                <span className="font-mono font-semibold">{quota}</span>
                <Plus className="ml-0.5 h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          </SheetHeader>
        </div>

        {/* ─── Quota Progress Bar (2px) ──────────────────── */}
        <div className="mt-3 h-[2px] w-full bg-[#e2e8f0]">
          <motion.div
            className={cn("h-full", quotaIsZero ? "bg-red-500" : "bg-[#ADD8E6]")}
            initial={false}
            animate={{ width: `${Math.min((quota / 15) * 100, 100)}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* ─── Section 0: Quick Link Entry ───────────────── */}
        <div className="shrink-0 border-b border-[#e2e8f0] px-5 py-4">
          <p className="text-[11px] font-medium text-[#334155]">Paste Job Link</p>
          <Input
            type="url"
            value={jobLink}
            onChange={(e) => setJobLink(e.target.value)}
            placeholder="https://www.linkedin.com/jobs/view/..."
            className="mt-2 h-9 rounded border-[#e2e8f0] bg-transparent text-sm placeholder:text-[#94a3b8]"
          />
          <p className="mt-1.5 text-[10px] leading-relaxed text-[#94a3b8]">
            If the job is already open, Y.EAA will activate that tab. Otherwise, a new tab will be opened.
          </p>
        </div>

        {/* ─── Accordion Steps ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ─── Step 1: Upload Resume ─────────────────── */}
          <AccordionStep
            number={1}
            title="Upload Resume"
            status={steps.step1}
            isActive={activeStep === 1}
            onToggle={() => {
              if (steps.step1 !== "not-started") setActiveStep(1)
            }}
            canToggle={steps.step1 !== "not-started"}
          >
            {/* Parsing state */}
            {parsingStatus === "parsing" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ADD8E6]" strokeWidth={2} />
                  <p className="text-[12px] text-[#334155]">Parsing resume&hellip;</p>
                </div>
                {/* Shimmer bar */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-[#ADD8E6]"
                    animate={{ x: ["0%", "200%", "0%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}

            {parsingStatus === "done" && resumeName && (
              <div className="flex items-center gap-2 rounded border border-[#16a34a]/30 bg-[#16a34a]/5 px-3 py-2.5">
                <Check className="h-3.5 w-3.5 text-[#16a34a]" strokeWidth={2} />
                <p className="text-[12px] text-[#16a34a]">Resume parsed successfully.</p>
              </div>
            )}

            {parsingStatus === "idle" && (
              <>
                {resumeName && (
                  <div className="mb-3 flex items-center gap-2 rounded border border-[#16a34a]/30 bg-[#16a34a]/5 px-3 py-2">
                    <FileText className="h-3.5 w-3.5 text-[#16a34a]" strokeWidth={1.5} />
                    <span className="flex-1 truncate text-[11px] text-[#0f172a]">{resumeName}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-[#cbd5e1] px-3 py-4 text-[12px] font-medium text-[#64748b] transition-all hover:border-[#ADD8E6] hover:bg-[#ADD8E6]/5 hover:text-[#334155]"
                  onClick={() => {
                    setResumeModalOpen(true)
                    setResumeModalMode("choose")
                    setSteps((prev) => prev.step1 === "not-started" ? { ...prev, step1: "in-progress" } : prev)
                  }}
                >
                  <Upload className="h-4 w-4" strokeWidth={1.5} />
                  {resumeName ? "Replace resume" : "Click to upload"}
                </button>
              </>
            )}
          </AccordionStep>

          {/* ─── Step 2: Create Job Profile ────────────── */}
          <AccordionStep
            number={2}
            title="Create Job Profile"
            status={steps.step2}
            isActive={activeStep === 2}
            onToggle={() => {
              if (steps.step2 === "in-progress" || steps.step2 === "completed") setActiveStep(2)
            }}
            canToggle={steps.step2 === "in-progress" || steps.step2 === "completed"}
          >
            {profileLocked && (
              <div className="mb-4 flex items-center gap-2 rounded border border-[#FFF44F]/40 bg-[#FFF44F]/10 px-3 py-2">
                <Lock className="h-3 w-3 text-[#a16207]" strokeWidth={1.5} />
                <p className="text-[10px] text-[#a16207]">Locked after first run (MVP limitation)</p>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase text-[#94a3b8]">Preferences</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Location / Remote */}
                <GhostToggle
                  icon={<MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  label="Remote"
                  active={locationRemote}
                  onToggle={() => !profileLocked && setLocationRemote(!locationRemote)}
                  disabled={profileLocked}
                />
                {/* Seniority */}
                <GhostToggle
                  icon={<Briefcase className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  label="Senior"
                  active={seniority === "senior"}
                  onToggle={() => !profileLocked && setSeniority(seniority === "senior" ? "mid" : "senior")}
                  disabled={profileLocked}
                />
                {/* Job Type */}
                <GhostToggle
                  icon={<Briefcase className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  label="Full-time"
                  active={jobType === "full-time"}
                  onToggle={() => !profileLocked && setJobType(jobType === "full-time" ? "contract" : "full-time")}
                  disabled={profileLocked}
                />
              </div>

              {/* Work Authorization */}
              <div className="mt-2 border-t border-[#e2e8f0] pt-4">
                <p className="text-[10px] font-semibold uppercase text-[#94a3b8]">Work Authorization</p>

                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-[11px] text-[#334155]">Detected Countries</p>
                    <div className="mt-1.5 flex gap-2">
                      <span className="rounded border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#334155]">Japan</span>
                      <span className="rounded border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#334155]">USA</span>
                    </div>
                    <p className="mt-1 text-[9px] text-[#94a3b8]">Detected from resume history.</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-[#64748b]" strokeWidth={1.5} />
                      <span className="text-[11px] text-[#334155]">Sponsorship</span>
                    </div>
                    <MiniToggle active={sponsorship} onToggle={() => !profileLocked && setSponsorship(!sponsorship)} disabled={profileLocked} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#334155]">EEO: Prefer not to say</span>
                    <MiniToggle active={eeoOptOut} onToggle={() => !profileLocked && setEeoOptOut(!eeoOptOut)} disabled={profileLocked} />
                  </div>
                </div>
              </div>

              {/* Confirm / Save profile */}
              {!profileLocked && steps.step2 === "in-progress" && (
                <button
                  type="button"
                  className="mt-2 flex h-10 w-full items-center justify-center rounded bg-[#002366] text-[12px] font-semibold text-white transition-all hover:bg-[#001a4d]"
                  onClick={handleStartRun}
                >
                  Save profile & continue
                </button>
              )}
            </div>
          </AccordionStep>

          {/* ─── Step 3: Search Results Controller ──────── */}
          <AccordionStep
            number={3}
            title="Search Results Controller"
            status={steps.step3}
            isActive={activeStep === 3}
            onToggle={() => {
              if (steps.step3 === "in-progress" || steps.step3 === "completed") setActiveStep(3)
            }}
            canToggle={steps.step3 === "in-progress" || steps.step3 === "completed"}
          >
            {/* Warning if > 10 positions */}
            {detectedPositions > 10 && runState === "idle" && (
              <div className="mb-4 rounded border border-[#FFF44F]/40 bg-[#FFF44F]/10 px-3 py-2.5">
                <p className="text-[11px] text-[#a16207]">
                  More than 10 positions detected. We recommend starting with 10.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {/* Apply All */}
              <button
                type="button"
                className={cn(
                  "flex h-11 w-full items-center justify-center rounded text-[13px] font-semibold transition-all",
                  runState === "idle"
                    ? "bg-[#002366] text-white hover:bg-[#001a4d]"
                    : "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
                )}
                onClick={runState === "idle" ? handleApplyAll : undefined}
                disabled={runState !== "idle"}
              >
                Apply All
              </button>

              {/* Recommend (Disabled) */}
              <button
                type="button"
                className="flex h-11 w-full cursor-not-allowed items-center justify-center rounded border border-[#e2e8f0] text-[13px] font-medium text-[#94a3b8]"
                disabled
              >
                Recommend
              </button>
              <p className="text-center text-[10px] text-[#94a3b8]">
                AI-recommended applications coming soon.
              </p>
            </div>
          </AccordionStep>
        </div>

        {/* ─── Footer ────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#e2e8f0] px-5 py-3">
          <p className="text-center text-[9px] text-[#94a3b8]">
            Y.EAA does not store credentials, cookies, or login sessions.
          </p>
        </div>

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
                  <h3 className="text-lg font-semibold text-[#0f172a]">Upload Resume</h3>
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
                      className="group flex w-full items-center gap-4 rounded border border-[#e2e8f0] bg-transparent px-5 py-5 text-left transition-all hover:border-[#ADD8E6] hover:bg-[#ADD8E6]/5"
                      onClick={handleUploadPDF}
                    >
                      <Upload className="h-5 w-5 text-[#94a3b8] transition-colors group-hover:text-[#ADD8E6]" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-[#0f172a]">Upload PDF</p>
                        <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOC, or DOCX</p>
                      </div>
                    </button>

                    {/* Paste Text tile */}
                    <button
                      type="button"
                      className="group flex w-full items-center gap-4 rounded border border-[#e2e8f0] bg-transparent px-5 py-5 text-left transition-all hover:border-[#ADD8E6] hover:bg-[#ADD8E6]/5"
                      onClick={() => setResumeModalMode("paste")}
                    >
                      <ClipboardPaste className="h-5 w-5 text-[#94a3b8] transition-colors group-hover:text-[#ADD8E6]" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-[#0f172a]">Paste Text</p>
                        <p className="mt-0.5 text-[10px] text-[#94a3b8]">Plain text resume content</p>
                      </div>
                    </button>

                    {/* Connect with LinkedIn */}
                    <button
                      type="button"
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-[#e2e8f0] py-3 text-[11px] font-medium text-[#64748b] transition-all hover:border-[#cbd5e1] hover:text-[#334155]"
                    >
                      Connect with LinkedIn
                    </button>
                  </div>
                )}

                {resumeModalMode === "paste" && (
                  <div className="mt-6 space-y-3">
                    <Textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Paste your resume text here"
                      className="min-h-[160px] resize-none rounded border-[#e2e8f0] bg-transparent text-sm leading-relaxed placeholder:text-[#94a3b8] focus:border-[#ADD8E6]"
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
                        Upload
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Bottom Drawer ──────────────────────────────── */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/10"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="absolute inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-[#e2e8f0] bg-white"
              >
                <div className="px-5 pb-6 pt-4">
                  <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-[#e2e8f0]" />

                  {/* Toggle: Use own Gemini API Key */}
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium text-[#334155]">Use my own Gemini API Key</p>
                    <MiniToggle active={useOwnKey} onToggle={() => setUseOwnKey(!useOwnKey)} />
                  </div>
                  {useOwnKey && (
                    <div className="mt-2">
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#94a3b8]" strokeWidth={1.5} />
                        <Input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="AIza..."
                          className="h-9 rounded border-[#e2e8f0] bg-transparent pl-8 text-sm placeholder:text-[#94a3b8]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Referral code */}
                  <div className="mt-4 border-t border-[#e2e8f0] pt-4">
                    <p className="text-[12px] font-medium text-[#334155]">Enter Referral Code</p>
                    <p className="mt-0.5 text-[10px] text-[#94a3b8]">
                      Refills to 5 daily (Max stockpile: 15)
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !referralLoading) handleApplyReferral()
                        }}
                        placeholder="Enter referral code"
                        disabled={referralLoading}
                        className="h-9 flex-1 rounded border-[#e2e8f0] bg-transparent text-sm placeholder:text-[#94a3b8]"
                      />
                      <button
                        type="button"
                        className={cn(
                          "flex h-9 shrink-0 items-center justify-center rounded px-4 text-[11px] font-semibold transition-all",
                          referralCode.trim() && !referralLoading
                            ? "bg-[#002366] text-white hover:bg-[#001a4d]"
                            : "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
                        )}
                        onClick={handleApplyReferral}
                        disabled={referralLoading || !referralCode.trim()}
                      >
                        {referralLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
                        ) : (
                          "Redeem"
                        )}
                      </button>
                    </div>
                    {referralError && (
                      <p className="mt-1.5 text-[10px] text-red-500">{referralError}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  )
}

/* ─── Ghost Toggle Button ─────────────────────────────── */

function GhostToggle({
  icon,
  label,
  active,
  onToggle,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2 rounded border px-3 py-2.5 text-[11px] font-medium transition-all",
        active
          ? "border-[#ADD8E6] bg-[#ADD8E6]/10 text-[#334155]"
          : "border-[#e2e8f0] bg-transparent text-[#94a3b8]",
        disabled ? "cursor-not-allowed opacity-50" : "hover:border-[#ADD8E6]"
      )}
      onClick={onToggle}
      disabled={disabled}
    >
      {icon}
      {label}
    </button>
  )
}

/* ─── Mini Toggle Switch ──────────────────────────────── */

function MiniToggle({
  active,
  onToggle,
  disabled,
}: {
  active: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors",
        active ? "bg-[#ADD8E6]" : "bg-[#e2e8f0]",
        disabled && "cursor-not-allowed opacity-50"
      )}
      onClick={onToggle}
      disabled={disabled}
    >
      <motion.div
        className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
        animate={{ x: active ? 16 : 0 }}
        transition={{ duration: 0.15 }}
      />
    </button>
  )
}

/* ─── Accordion Step Component ────────────────────────── */

function AccordionStep({
  number,
  title,
  status,
  isActive,
  onToggle,
  canToggle,
  children,
}: {
  number: number
  title: string
  status: StepStatus
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
        {status === "completed" && (
          <Check className="ml-auto h-3.5 w-3.5 text-white" strokeWidth={2} />
        )}
        {status === "in-progress" && (
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
