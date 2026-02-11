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
  MapPin,
  Briefcase,
  Shield,
  Link,
  Pencil,
  RotateCcw,
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

type RunState = "idle" | "running" | "paused" | "stopped" | "completed"

interface ExtensionPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/* ─── Status Color Map ────────────────────────────────── */
/* Left border colors: muted yellow = not started, blue = active, green = completed */

const BORDER_COLOR: Record<StepStatus, string> = {
  "not-started": "border-l-[#d4a017]/40",
  "in-progress": "border-l-[#3b82f6]",
  completed: "border-l-[#16a34a]",
}

const TITLE_COLOR: Record<StepStatus, string> = {
  "not-started": "text-[#334155]",
  "in-progress": "text-[#1e40af]",
  completed: "text-[#16a34a]",
}

const STATUS_LABEL: Record<StepStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
}

const STATUS_LABEL_COLOR: Record<StepStatus, string> = {
  "not-started": "text-[#94a3b8]",
  "in-progress": "text-[#3b82f6]",
  completed: "text-[#16a34a]",
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

/* ─── Mock: AI Suggested Profiles ─────────────────────── */

const AI_PROFILES = [
  {
    id: "ai-1",
    role: "Senior Frontend Engineer",
    location: "Remote (US)",
    seniority: "Senior",
    type: "Full-time",
    summary: "React/TypeScript roles at growth-stage startups",
  },
  {
    id: "ai-2",
    role: "Staff Software Engineer",
    location: "San Francisco, CA",
    seniority: "Staff",
    type: "Full-time",
    summary: "Platform & infrastructure engineering at mid-to-large companies",
  },
]

/* ─── Main Component ──────────────────────────────────── */

export function ExtensionPopup({ open, onOpenChange }: ExtensionPopupProps) {
  const [quota, setQuota] = useState(5)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const balanceRef = useRef<HTMLButtonElement>(null)

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
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [customProfileOpen, setCustomProfileOpen] = useState(false)
  const [customUrl, setCustomUrl] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [customLocation, setCustomLocation] = useState("")
  const [customSeniority, setCustomSeniority] = useState("")
  const [customType, setCustomType] = useState("")
  const [profileLocked, setProfileLocked] = useState(false)
  const [prefsEditing, setPrefsEditing] = useState(false)
  const [locationRemote, setLocationRemote] = useState(true)
  const [seniority, setSeniority] = useState("senior")
  const [jobType, setJobType] = useState("full-time")
  const [sponsorship, setSponsorship] = useState(true)
  const [eeoOptOut, setEeoOptOut] = useState(true)

  // Step 3: Search Results Controller
  const [detectedPositions] = useState(14)
  const [runState, setRunState] = useState<RunState>("idle")
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  // Referral
  const [referralCode, setReferralCode] = useState("")
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [appliedCodes, setAppliedCodes] = useState<string[]>([])

  // Credit toast
  const [creditToast, setCreditToast] = useState<string | null>(null)

  const quotaIsZero = quota === 0

  /* ─── Close popover on outside click ───────────────── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        balanceRef.current &&
        !balanceRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false)
      }
    }
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [popoverOpen])

  /* ─── Credit toast helper ──────────────────────────── */
  const showCreditToast = useCallback((msg: string) => {
    setCreditToast(msg)
    setTimeout(() => setCreditToast(null), 3000)
  }, [])

  /* ─── Step 1: Resume Upload ─────────────────────────── */

  const simulateParsing = useCallback((name: string) => {
    setResumeName(name)
    setParsingStatus("parsing")
    setSteps((prev) => ({ ...prev, step1: "in-progress" }))
    setActiveStep(1)
    setTimeout(() => {
      setParsingStatus("done")
      setSteps((prev) => ({
        ...prev,
        step1: "completed",
        step2: prev.step2 === "not-started" ? "in-progress" : prev.step2,
      }))
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

  /* ─── Step 2: Profile selection & lock ─────────────── */

  const handleSaveProfile = useCallback(() => {
    if (!selectedProfile && !customUrl.trim() && !customTitle.trim()) return
    setSteps((prev) => ({ ...prev, step2: "completed", step3: "in-progress" }))
    setActiveStep(3)
  }, [selectedProfile, customUrl, customTitle])

  const handleLockAndProceed = useCallback(() => {
    setProfileLocked(true)
    setConfirmModalOpen(true)
  }, [])

  /* ─── Step 3: Run State ─────────────────────────────── */

  const handleConfirmProceed = useCallback(() => {
    setConfirmModalOpen(false)
    setRunState("running")
  }, [])

  const handleApplyAll = useCallback(() => {
    if (steps.step2 !== "completed") return
    handleLockAndProceed()
  }, [steps.step2, handleLockAndProceed])

  const handlePause = useCallback(() => {
    setRunState("paused")
  }, [])

  const handleResume = useCallback(() => {
    setRunState("running")
  }, [])

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
    } else {
      setReferralError(result.error || "Invalid")
      setTimeout(() => setReferralError(null), 3000)
    }
    setReferralLoading(false)
  }, [referralCode, appliedCodes])

  /* ─── Derived ───────────────────────────────────────── */
  const activeProfile = selectedProfile
    ? AI_PROFILES.find((p) => p.id === selectedProfile)
    : customTitle.trim()
      ? { role: customTitle, location: customLocation || "Not specified", seniority: customSeniority || "Any", type: customType || "Any" }
      : null

  const prefsLine = [
    locationRemote ? "Remote" : "On-site",
    seniority === "senior" ? "Senior" : "Mid",
    jobType === "full-time" ? "Full-time" : "Contract",
  ].join(" \u00B7 ")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[380px] flex-col border-l border-[#e2e8f0] bg-white p-0 sm:w-[380px]"
      >
        {/* ─── Credit Deduction Toast ──────────────────── */}
        <AnimatePresence>
          {creditToast && (
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-0 z-[60] flex justify-center p-2"
            >
              <div className="rounded border border-[#e2e8f0] bg-white px-4 py-2 text-[11px] font-medium text-[#334155] shadow-sm">
                {creditToast}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Run State Status Label ──────────────────── */}
        <AnimatePresence>
          {runState !== "idle" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-2.5">
                <div className="flex items-center gap-2">
                  {runState === "running" && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3b82f6] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3b82f6]" />
                    </span>
                  )}
                  {runState === "paused" && <Pause className="h-3 w-3 text-[#d4a017]" strokeWidth={2} />}
                  {runState === "stopped" && <Square className="h-3 w-3 text-[#dc2626]" strokeWidth={2} />}
                  {runState === "completed" && <Check className="h-3 w-3 text-[#16a34a]" strokeWidth={2} />}
                  <p className="text-[12px] font-medium text-[#334155]">
                    {runState === "running" && "Running"}
                    {runState === "paused" && "Paused"}
                    {runState === "stopped" && "Stopped"}
                    {runState === "completed" && "Completed"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {runState === "running" && (
                    <>
                      <button
                        type="button"
                        className="flex h-6 items-center gap-1 rounded border border-[#e2e8f0] bg-transparent px-2 text-[10px] font-medium text-[#334155] transition-all hover:border-[#cbd5e1]"
                        onClick={handlePause}
                      >
                        <Pause className="h-2.5 w-2.5" strokeWidth={1.5} />
                        Pause
                      </button>
                      <button
                        type="button"
                        className="flex h-6 items-center gap-1 rounded border border-red-200 bg-transparent px-2 text-[10px] font-medium text-red-600 transition-all hover:bg-red-50"
                        onClick={handleStop}
                      >
                        <Square className="h-2.5 w-2.5" strokeWidth={1.5} />
                        Stop
                      </button>
                    </>
                  )}
                  {runState === "paused" && (
                    <>
                      <button
                        type="button"
                        className="flex h-6 items-center gap-1 rounded border border-[#3b82f6]/30 bg-[#3b82f6] px-2 text-[10px] font-medium text-white transition-all hover:bg-[#2563eb]"
                        onClick={handleResume}
                      >
                        <Play className="h-2.5 w-2.5" strokeWidth={1.5} />
                        Resume
                      </button>
                      <button
                        type="button"
                        className="flex h-6 items-center gap-1 rounded border border-red-200 bg-transparent px-2 text-[10px] font-medium text-red-600 transition-all hover:bg-red-50"
                        onClick={handleStop}
                      >
                        <Square className="h-2.5 w-2.5" strokeWidth={1.5} />
                        Stop
                      </button>
                    </>
                  )}
                  {(runState === "stopped" || runState === "completed") && (
                    <button
                      type="button"
                      className="flex h-6 items-center gap-1 rounded border border-[#e2e8f0] bg-transparent px-2 text-[10px] font-medium text-[#334155] transition-all hover:border-[#cbd5e1]"
                      onClick={() => setRunState("idle")}
                    >
                      <RotateCcw className="h-2.5 w-2.5" strokeWidth={1.5} />
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Header ─────────────────────────────────────── */}
        <div className="relative shrink-0 px-5 pb-0 pt-5">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <SheetTitle
                className="text-2xl font-bold text-[#0f172a]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Y.EAA
              </SheetTitle>
              {/* Balance pill - triggers anchored popover */}
              <button
                ref={balanceRef}
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all",
                  quotaIsZero
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-[#e2e8f0] bg-transparent text-[#334155] hover:border-[#cbd5e1] hover:shadow-sm"
                )}
                onClick={() => setPopoverOpen(!popoverOpen)}
              >
                <span>Balance:</span>
                <span className="font-mono font-semibold">{quota}</span>
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#cbd5e1] text-[9px] font-bold text-[#64748b]">
                  +
                </span>
              </button>
            </div>
          </SheetHeader>

          {/* ─── Anchored Popover ─────────────────────────── */}
          <AnimatePresence>
            {popoverOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-5 top-full z-50 mt-2 w-[300px] rounded border border-[#e2e8f0] bg-white shadow-lg"
              >
                <div className="p-4">
                  {/* Section 1: Credits */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">Credits</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-mono text-2xl font-bold text-[#0f172a]">{quota}</span>
                      <span className="text-[11px] text-[#64748b]">/ 15 max</span>
                    </div>
                    {/* Quota bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-[#f1f5f9]">
                      <motion.div
                        className={cn("h-full rounded-full", quotaIsZero ? "bg-red-400" : "bg-[#3b82f6]")}
                        initial={false}
                        animate={{ width: `${Math.min((quota / 15) * 100, 100)}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-[#94a3b8]">
                      Resets daily at 3:00 AM (device time at install).
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-[#94a3b8]">
                      1 credit = 1 completed run or manual stop.
                    </p>
                  </div>

                  {/* Section 2: API Toggle */}
                  <div className="mt-4 border-t border-[#f1f5f9] pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-[#334155]">Use custom OpenAI API key</p>
                      <MiniToggle active={useOwnKey} onToggle={() => setUseOwnKey(!useOwnKey)} />
                    </div>
                    <AnimatePresence>
                      {useOwnKey && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2">
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#94a3b8]" strokeWidth={1.5} />
                              <Input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="h-8 rounded border-[#e2e8f0] bg-transparent pl-8 text-xs placeholder:text-[#94a3b8]"
                              />
                            </div>
                            <button
                              type="button"
                              className={cn(
                                "flex h-7 w-full items-center justify-center rounded text-[10px] font-semibold transition-all",
                                apiKey.trim()
                                  ? "bg-[#0f172a] text-white hover:bg-[#1e293b]"
                                  : "cursor-not-allowed bg-[#f1f5f9] text-[#94a3b8]"
                              )}
                              disabled={!apiKey.trim()}
                            >
                              Save
                            </button>
                            <p className="text-[9px] leading-relaxed text-[#94a3b8]">
                              Your key is stored locally and never sent to our servers.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Section 3: Referral Code */}
                  <div className="mt-4 border-t border-[#f1f5f9] pt-4">
                    <p className="text-[11px] font-medium text-[#334155]">Referral code</p>
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !referralLoading) handleApplyReferral()
                        }}
                        placeholder="YEAA-XXXX"
                        disabled={referralLoading}
                        className="h-8 flex-1 rounded border-[#e2e8f0] bg-transparent text-xs placeholder:text-[#94a3b8]"
                      />
                      <button
                        type="button"
                        className={cn(
                          "flex h-8 shrink-0 items-center justify-center rounded px-3 text-[10px] font-semibold transition-all",
                          referralCode.trim() && !referralLoading
                            ? "bg-[#0f172a] text-white hover:bg-[#1e293b]"
                            : "cursor-not-allowed bg-[#f1f5f9] text-[#94a3b8]"
                        )}
                        onClick={handleApplyReferral}
                        disabled={referralLoading || !referralCode.trim()}
                      >
                        {referralLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                    {referralError && (
                      <p className="mt-1.5 text-[10px] text-red-500">{referralError}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Section 0: Quick Link Entry ───────────────── */}
        <div className="shrink-0 border-b border-[#e2e8f0] px-5 py-4">
          <div className="flex items-center gap-2">
            <Link className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" strokeWidth={1.5} />
            <p className="text-[11px] font-medium text-[#334155]">Paste Job Link</p>
          </div>
          <Input
            type="url"
            value={jobLink}
            onChange={(e) => setJobLink(e.target.value)}
            placeholder="https://www.linkedin.com/jobs/view/..."
            className="mt-2 h-9 rounded border-[#e2e8f0] bg-transparent text-sm placeholder:text-[#94a3b8]"
          />
          <p className="mt-1.5 text-[10px] leading-relaxed text-[#94a3b8]">
            If the job is already open, Y.EAA will activate that tab.
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
            onToggle={() => setActiveStep(1)}
            canToggle={true}
          >
            {/* Parsing state */}
            {parsingStatus === "parsing" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3b82f6]" strokeWidth={2} />
                  <p className="text-[12px] text-[#334155]">{"Parsing resume\u2026"}</p>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-[#3b82f6]"
                    animate={{ x: ["0%", "200%", "0%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}

            {parsingStatus === "done" && resumeName && (
              <div className="flex items-center gap-2 rounded border border-[#16a34a]/20 bg-[#f0fdf4] px-3 py-2.5">
                <Check className="h-3.5 w-3.5 text-[#16a34a]" strokeWidth={2} />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-[#16a34a]">Resume parsed</p>
                  <p className="text-[10px] text-[#16a34a]/70">{resumeName}</p>
                </div>
              </div>
            )}

            {parsingStatus === "idle" && (
              <>
                {resumeName && (
                  <div className="mb-3 flex items-center gap-2 rounded border border-[#16a34a]/20 bg-[#f0fdf4] px-3 py-2">
                    <FileText className="h-3.5 w-3.5 text-[#16a34a]" strokeWidth={1.5} />
                    <span className="flex-1 truncate text-[11px] text-[#0f172a]">{resumeName}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded border border-dashed border-[#cbd5e1] px-3 py-4 text-[12px] font-medium text-[#64748b] transition-all hover:border-[#94a3b8] hover:text-[#334155]"
                  onClick={() => {
                    setResumeModalOpen(true)
                    setResumeModalMode("choose")
                    setSteps((prev) =>
                      prev.step1 === "not-started" ? { ...prev, step1: "in-progress" } : prev
                    )
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
              <div className="mb-4 flex items-center gap-2 rounded border border-[#d4a017]/20 bg-[#fefce8] px-3 py-2">
                <Lock className="h-3 w-3 text-[#a16207]" strokeWidth={1.5} />
                <p className="text-[10px] text-[#a16207]">Locked for this session</p>
              </div>
            )}

            {/* A. AI Suggested Profiles */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                AI Suggested
              </p>
              {AI_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className={cn(
                    "w-full rounded border p-3 text-left transition-all",
                    selectedProfile === profile.id
                      ? "border-[#3b82f6] bg-[#eff6ff]"
                      : "border-[#e2e8f0] bg-transparent hover:border-[#cbd5e1]",
                    profileLocked && "cursor-not-allowed opacity-60"
                  )}
                  onClick={() => {
                    if (profileLocked) return
                    setSelectedProfile(profile.id)
                    setCustomProfileOpen(false)
                  }}
                  disabled={profileLocked}
                >
                  <p className="text-[12px] font-semibold text-[#0f172a]">{profile.role}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-[#64748b]">
                    <span>{profile.location}</span>
                    <span>{profile.seniority}</span>
                    <span>{profile.type}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#94a3b8]">{profile.summary}</p>
                </button>
              ))}
            </div>

            {/* B. Custom Profile */}
            <div className="mt-3">
              {!customProfileOpen ? (
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-[#cbd5e1] py-3 text-[11px] font-medium text-[#64748b] transition-all hover:border-[#94a3b8] hover:text-[#334155]",
                    profileLocked && "cursor-not-allowed opacity-60"
                  )}
                  onClick={() => {
                    if (profileLocked) return
                    setCustomProfileOpen(true)
                    setSelectedProfile(null)
                  }}
                  disabled={profileLocked}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Create Custom Job Profile
                </button>
              ) : (
                <div className="space-y-3 rounded border border-[#e2e8f0] p-3">
                  <p className="text-[11px] font-semibold text-[#334155]">Custom Profile</p>
                  <div>
                    <label className="text-[10px] text-[#64748b]">LinkedIn Search URL or Job Title *</label>
                    <Input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://linkedin.com/jobs/search/... or Job Title"
                      className="mt-1 h-8 rounded border-[#e2e8f0] bg-transparent text-xs placeholder:text-[#94a3b8]"
                      disabled={profileLocked}
                    />
                    <p className="mt-1 text-[9px] text-[#94a3b8]">
                      If URL is provided, it takes priority over title.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-[#64748b]">Location</label>
                      <Input
                        type="text"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        placeholder="Any"
                        className="mt-1 h-7 rounded border-[#e2e8f0] bg-transparent text-[10px] placeholder:text-[#94a3b8]"
                        disabled={profileLocked}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#64748b]">Seniority</label>
                      <Input
                        type="text"
                        value={customSeniority}
                        onChange={(e) => setCustomSeniority(e.target.value)}
                        placeholder="Any"
                        className="mt-1 h-7 rounded border-[#e2e8f0] bg-transparent text-[10px] placeholder:text-[#94a3b8]"
                        disabled={profileLocked}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#64748b]">Type</label>
                      <Input
                        type="text"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        placeholder="Any"
                        className="mt-1 h-7 rounded border-[#e2e8f0] bg-transparent text-[10px] placeholder:text-[#94a3b8]"
                        disabled={profileLocked}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-[10px] text-[#64748b] hover:text-[#334155]"
                    onClick={() => {
                      setCustomProfileOpen(false)
                      setCustomUrl("")
                      setCustomTitle("")
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* D. Preferences summary */}
            {(selectedProfile || customProfileOpen) && !profileLocked && (
              <div className="mt-4 border-t border-[#f1f5f9] pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[#94a3b8]">{prefsLine}</p>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[10px] text-[#64748b] hover:text-[#334155]"
                    onClick={() => setPrefsEditing(!prefsEditing)}
                  >
                    <Pencil className="h-2.5 w-2.5" strokeWidth={1.5} />
                    Edit
                  </button>
                </div>

                <AnimatePresence>
                  {prefsEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#334155]">Remote</span>
                          <MiniToggle active={locationRemote} onToggle={() => setLocationRemote(!locationRemote)} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#334155]">Seniority: {seniority}</span>
                          <button
                            type="button"
                            className="rounded border border-[#e2e8f0] bg-transparent px-2 py-0.5 text-[10px] text-[#64748b] hover:border-[#cbd5e1]"
                            onClick={() => setSeniority(seniority === "senior" ? "mid" : "senior")}
                          >
                            Toggle
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#334155]">Type: {jobType}</span>
                          <button
                            type="button"
                            className="rounded border border-[#e2e8f0] bg-transparent px-2 py-0.5 text-[10px] text-[#64748b] hover:border-[#cbd5e1]"
                            onClick={() => setJobType(jobType === "full-time" ? "contract" : "full-time")}
                          >
                            Toggle
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-[#64748b]" strokeWidth={1.5} />
                            <span className="text-[11px] text-[#334155]">Sponsorship</span>
                          </div>
                          <MiniToggle active={sponsorship} onToggle={() => setSponsorship(!sponsorship)} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Save profile */}
            {!profileLocked && steps.step2 === "in-progress" && (selectedProfile || (customProfileOpen && (customUrl.trim() || customTitle.trim()))) && (
              <button
                type="button"
                className="mt-4 flex h-9 w-full items-center justify-center rounded bg-[#0f172a] text-[12px] font-semibold text-white transition-all hover:bg-[#1e293b]"
                onClick={handleSaveProfile}
              >
                Save profile & continue
              </button>
            )}
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
              <div className="mb-3 flex items-center gap-2 rounded border border-[#d4a017]/15 bg-[#fefce8] px-3 py-2">
                <AlertCircle className="h-3 w-3 shrink-0 text-[#a16207]" strokeWidth={1.5} />
                <p className="text-[10px] text-[#a16207]">
                  We recommend handling 10 at a time.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {/* Apply All */}
              <button
                type="button"
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded text-[12px] font-semibold transition-all",
                  runState === "idle"
                    ? "bg-[#0f172a] text-white hover:bg-[#1e293b]"
                    : "cursor-not-allowed bg-[#f1f5f9] text-[#94a3b8]"
                )}
                onClick={runState === "idle" ? handleApplyAll : undefined}
                disabled={runState !== "idle"}
              >
                Apply All
              </button>

              {/* Recommend (Disabled) */}
              <button
                type="button"
                className="flex h-10 w-full cursor-not-allowed items-center justify-center rounded border border-[#e2e8f0] text-[12px] font-medium text-[#94a3b8]"
                disabled
                title="AI analysis not available in MVP"
              >
                Recommend
              </button>
              <p className="text-center text-[10px] text-[#94a3b8]">
                Coming soon
              </p>

              {/* // TODO: Public version – inject Select buttons into LinkedIn HTML */}
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
                    <button
                      type="button"
                      className="group flex w-full items-center gap-4 rounded border border-[#e2e8f0] bg-transparent px-5 py-5 text-left transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                      onClick={handleUploadPDF}
                    >
                      <Upload className="h-5 w-5 text-[#94a3b8] transition-colors group-hover:text-[#64748b]" strokeWidth={1.5} />
                      <div>
                        <p className="text-sm font-medium text-[#0f172a]">Upload PDF</p>
                        <p className="mt-0.5 text-[10px] text-[#94a3b8]">PDF, DOC, or DOCX</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="group flex w-full items-center gap-4 rounded border border-[#e2e8f0] bg-transparent px-5 py-5 text-left transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                      onClick={() => setResumeModalMode("paste")}
                    >
                      <ClipboardPaste className="h-5 w-5 text-[#94a3b8] transition-colors group-hover:text-[#64748b]" strokeWidth={1.5} />
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
                      className="min-h-[160px] resize-none rounded border-[#e2e8f0] bg-transparent text-sm leading-relaxed placeholder:text-[#94a3b8] focus:border-[#3b82f6]"
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
                            ? "bg-[#0f172a] text-white hover:bg-[#1e293b]"
                            : "cursor-not-allowed bg-[#f1f5f9] text-[#94a3b8]"
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

        {/* ─── Confirmation Modal ─────────────────────────── */}
        <AnimatePresence>
          {confirmModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
            >
              <div className="w-full max-w-[300px] px-6">
                <h3 className="text-base font-semibold text-[#0f172a]">Before you continue</h3>
                <div className="mt-4 space-y-3">
                  <p className="text-[12px] leading-relaxed text-[#64748b]">
                    Y.EAA will automate job applications on your behalf. By proceeding, you acknowledge:
                  </p>
                  <ul className="space-y-2 text-[11px] leading-relaxed text-[#64748b]">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-[#94a3b8]" />
                      You are responsible for all submissions made.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-[#94a3b8]" />
                      Platform behavior may change at any time.
                    </li>
                  </ul>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="flex h-9 flex-1 items-center justify-center rounded border border-[#e2e8f0] text-[11px] font-medium text-[#64748b] transition-all hover:border-[#cbd5e1]"
                    onClick={() => setConfirmModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex h-9 flex-1 items-center justify-center rounded bg-[#0f172a] text-[11px] font-semibold text-white transition-all hover:bg-[#1e293b]"
                    onClick={handleConfirmProceed}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
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
        active ? "bg-[#3b82f6]" : "bg-[#e2e8f0]",
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
    <div className={cn("border-b border-[#e2e8f0] border-l-4", BORDER_COLOR[status])}>
      {/* Step header - neutral background */}
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[#f8fafc]",
          !canToggle && "cursor-default hover:bg-transparent"
        )}
        onClick={onToggle}
        disabled={!canToggle}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-bold text-[#94a3b8]">{number}</span>
          <span className={cn("text-[13px] font-semibold", TITLE_COLOR[status])}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px]", STATUS_LABEL_COLOR[status])}>
            {STATUS_LABEL[status]}
          </span>
          {status === "completed" && (
            <Check className="h-3 w-3 text-[#16a34a]" strokeWidth={2} />
          )}
          {(status === "in-progress" || (canToggle && status !== "completed")) && (
            <ChevronDown
              className={cn(
                "h-3 w-3 text-[#94a3b8] transition-transform",
                isActive && "rotate-180"
              )}
              strokeWidth={1.5}
            />
          )}
        </div>
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
            <div className="px-5 pb-5 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
