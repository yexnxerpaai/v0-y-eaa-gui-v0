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
  "not-started": "(Not Start)",
  "in-progress": "In progress",
  completed: "Completed",
}

const STATUS_LABEL_COLOR: Record<StepStatus, string> = {
  "not-started": "text-[#d4a017]",
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
  const [quota, setQuota] = useState(5)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const balanceRef = useRef<HTMLButtonElement>(null)

  const [apiKey, setApiKey] = useState("sk-...hidden")
  const [apiKeyEditing, setApiKeyEditing] = useState(false)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [steps, setSteps] = useState<StepState>({
    step1: "not-started",
    step2: "not-started",
    step3: "not-started",
  })

  // Step 1: Upload Resume
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pasteModalOpen, setPasteModalOpen] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [parsingStatus, setParsingStatus] = useState<"idle" | "parsing" | "done" | "syncing">("idle")
  const [resumeName, setResumeName] = useState<string | null>(null)

  // Step 2: Job Profile
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [aiProfileOverrides, setAiProfileOverrides] = useState<Record<string, {
    targetingLocations?: string
    location?: string[]
    seniority?: string
    type?: string
  }>>({})
  const [userProfile, setUserProfile] = useState({
    role: "",
    targetingLocations: "",
    location: [] as string[],
    seniority: "",
    type: "",
  })
  const [profileLocked, setProfileLocked] = useState(false)

  // Location chips
  const LOCATION_OPTIONS = ["Remote", "On-Site", "Hybrid"]

  // 2x2 Matrix
  const [matrixCountries, setMatrixCountries] = useState<string[]>(["USA", "Japan"])
  const [matrix, setMatrix] = useState<MatrixState>({
    USA: { workAuth: "yes", sponsorship: "yes" },
    Japan: { workAuth: "yes", sponsorship: "yes" },
  })
  const [addingCountry, setAddingCountry] = useState(false)
  const [newCountryName, setNewCountryName] = useState("")

  // EEO
  const [eeoExpanded, setEeoExpanded] = useState(false)

  // Step 3: Start Fill
  const [topPositions, setTopPositions] = useState(10)
  const [runState, setRunState] = useState<RunState>("idle")
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmAcknowledged, setConfirmAcknowledged] = useState(false)

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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      simulateParsing(file.name)
    }
    // Reset input so the same file can be re-selected
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
      setSteps((prev) => ({
        ...prev,
        step1: "completed",
        step2: prev.step2 === "not-started" ? "in-progress" : prev.step2,
      }))
      setTimeout(() => setActiveStep(2), 400)
    }, 3000)
  }, [])

  /* ─── Step 2: Matrix toggle ─────────────────────────── */

  const toggleMatrixCell = useCallback(
    (country: string, row: "workAuth" | "sponsorship") => {
      setMatrix((prev) => ({
        ...prev,
        [country]: {
          ...prev[country],
          [row]: prev[country][row] === "yes" ? "no" : "yes",
        },
      }))
    },
    []
  )

  const addCountryToMatrix = useCallback(() => {
    const name = newCountryName.trim()
    if (!name || matrixCountries.includes(name)) return
    setMatrixCountries((prev) => [...prev, name])
    setMatrix((prev) => ({
      ...prev,
      [name]: { workAuth: "yes", sponsorship: "yes" },
    }))
    setNewCountryName("")
    setAddingCountry(false)
  }, [newCountryName, matrixCountries])

  /* ─── Step 2: Start Applying ────────────────────────── */

  const handleStartApplying = useCallback(() => {
    if (!selectedProfile && !userProfile.role.trim()) return
    setSteps((prev) => ({ ...prev, step2: "completed", step3: "in-progress" }))
    setProfileLocked(true)
    setConfirmModalOpen(true)
    setConfirmAcknowledged(false)
  }, [selectedProfile, userProfile.role])

  /* ─── Step 3: Run State ─────────────────────────────── */

  const handleConfirmProceed = useCallback(() => {
    setConfirmModalOpen(false)
    setRunState("running")
    setActiveStep(3)
    // Redirect to LinkedIn Jobs Search
    window.open("https://www.linkedin.com/jobs/search/", "_blank")
  }, [])

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
    } else {
      setReferralError(result.error || "Invalid")
      setTimeout(() => setReferralError(null), 3000)
    }
    setReferralLoading(false)
  }, [referralCode, appliedCodes])

  /* ─── Location chip toggle ─────────────────────────── */

  const toggleLocationChip = useCallback(
    (profileId: string | null, loc: string) => {
      if (profileLocked) return
      if (profileId === null) {
        setUserProfile((prev) => ({
          ...prev,
          location: prev.location.includes(loc)
            ? prev.location.filter((l) => l !== loc)
            : [...prev.location, loc],
        }))
      } else {
        // AI profile override
        setAiProfileOverrides((prev) => {
          const current = prev[profileId]?.location || AI_PROFILES.find((p) => p.id === profileId)?.location || []
          const updated = current.includes(loc)
            ? current.filter((l) => l !== loc)
            : [...current, loc]
          return {
            ...prev,
            [profileId]: { ...prev[profileId], location: updated },
          }
        })
      }
    },
    [profileLocked]
  )

  const getProfileLocation = (profileId: string) => {
    return aiProfileOverrides[profileId]?.location || AI_PROFILES.find((p) => p.id === profileId)?.location || []
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[380px] flex-col border-l border-[#e2e8f0] bg-white p-0 sm:w-[380px]"
      >
        {/* Hidden file input for native OS file picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileChange}
        />

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
                      <button type="button" className="flex h-6 items-center gap-1 rounded border border-[#e2e8f0] bg-transparent px-2 text-[10px] font-medium text-[#334155] transition-all hover:border-[#cbd5e1]" onClick={handlePause}>
                        <Pause className="h-2.5 w-2.5" strokeWidth={1.5} /> Pause
                      </button>
                      <button type="button" className="flex h-6 items-center gap-1 rounded border border-red-200 bg-transparent px-2 text-[10px] font-medium text-red-600 transition-all hover:bg-red-50" onClick={handleStop}>
                        <Square className="h-2.5 w-2.5" strokeWidth={1.5} /> Stop
                      </button>
                    </>
                  )}
                  {runState === "paused" && (
                    <>
                      <button type="button" className="flex h-6 items-center gap-1 rounded border border-[#3b82f6]/30 bg-[#3b82f6] px-2 text-[10px] font-medium text-white transition-all hover:bg-[#2563eb]" onClick={handleResume}>
                        <Play className="h-2.5 w-2.5" strokeWidth={1.5} /> Resume
                      </button>
                      <button type="button" className="flex h-6 items-center gap-1 rounded border border-red-200 bg-transparent px-2 text-[10px] font-medium text-red-600 transition-all hover:bg-red-50" onClick={handleStop}>
                        <Square className="h-2.5 w-2.5" strokeWidth={1.5} /> Stop
                      </button>
                    </>
                  )}
                  {(runState === "stopped" || runState === "completed") && (
                    <button type="button" className="flex h-6 items-center gap-1 rounded border border-[#e2e8f0] bg-transparent px-2 text-[10px] font-medium text-[#334155] transition-all hover:border-[#cbd5e1]" onClick={() => setRunState("idle")}>
                      <RotateCcw className="h-2.5 w-2.5" strokeWidth={1.5} /> Reset
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
              {/* Balance pill */}
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
                <Zap className="h-3 w-3" strokeWidth={2} />
                <span className="font-mono font-semibold">{quota}</span>
                <span>Credits</span>
                <span className="ml-0.5 text-[#94a3b8]">|</span>
                <span className="font-bold text-[#64748b]">+</span>
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
                  {/* Gemini API Key */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
                        <p className="text-[11px] font-medium text-[#334155]">API Active</p>
                      </div>
                      {!apiKeyEditing && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-[10px] text-[#3b82f6] hover:underline"
                            onClick={() => setApiKeyEditing(true)}
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            className="text-[10px] text-red-500 hover:underline"
                            onClick={() => {
                              setApiKey("")
                              setApiKeyEditing(true)
                            }}
                          >
                            Discontinue
                          </button>
                        </div>
                      )}
                    </div>
                    <AnimatePresence>
                      {apiKeyEditing && (
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
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className={cn(
                                  "flex h-7 flex-1 items-center justify-center rounded text-[10px] font-semibold transition-all",
                                  apiKey.trim()
                                    ? "bg-[#0f172a] text-white hover:bg-[#1e293b]"
                                    : "cursor-not-allowed bg-[#f1f5f9] text-[#94a3b8]"
                                )}
                                disabled={!apiKey.trim()}
                                onClick={() => setApiKeyEditing(false)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="flex h-7 flex-1 items-center justify-center rounded border border-[#e2e8f0] text-[10px] font-medium text-[#64748b] hover:border-[#cbd5e1]"
                                onClick={() => setApiKeyEditing(false)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <p className="mt-3 text-[10px] leading-relaxed text-[#94a3b8]">
                      Refills to 5 daily (Max stockpile: 15)
                    </p>
                  </div>

                  {/* Referral Code */}
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

        {/* ─── Accordion Steps ───────────────────────────── */}
        <div className="mt-4 flex-1 overflow-y-auto">

          {/* ─── Step 1: Upload Resume ─────────────────── */}
          <AccordionStep
            number={1}
            title="Upload Resume"
            status={steps.step1}
            isActive={activeStep === 1}
            onToggle={() => setActiveStep(1)}
            canToggle={true}
          >
            {/* Syncing state (LinkedIn) */}
            {parsingStatus === "syncing" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0077b5]" strokeWidth={2} />
                  <p className="text-[12px] text-[#334155]">{"Syncing LinkedIn profile\u2026"}</p>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-[#0077b5]"
                    animate={{ x: ["0%", "200%", "0%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}

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

            {/* Done state */}
            {parsingStatus === "done" && resumeName && (
              <div className="flex items-center gap-2 rounded border border-[#16a34a]/20 bg-[#f0fdf4] px-3 py-2.5">
                <Check className="h-3.5 w-3.5 text-[#16a34a]" strokeWidth={2} />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-[#16a34a]">Resume parsed</p>
                  <p className="text-[10px] text-[#16a34a]/70">{resumeName}</p>
                </div>
              </div>
            )}

            {/* Idle state: 3-column action tiles */}
            {parsingStatus === "idle" && (
              <div className="grid grid-cols-3 gap-2">
                {/* Upload File - triggers native OS file picker */}
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-2 rounded border border-[#e2e8f0] bg-transparent px-2 py-5 text-center transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                  onClick={handleUploadFile}
                >
                  <Upload className="h-5 w-5 text-[#64748b]" strokeWidth={1.5} />
                  <span className="text-[11px] font-medium text-[#334155]">Upload File</span>
                </button>

                {/* Paste Text */}
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-2 rounded border border-[#e2e8f0] bg-transparent px-2 py-5 text-center transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                  onClick={() => setPasteModalOpen(true)}
                >
                  <ClipboardPaste className="h-5 w-5 text-[#64748b]" strokeWidth={1.5} />
                  <span className="text-[11px] font-medium text-[#334155]">Paste Text</span>
                </button>

                {/* Connect LinkedIn */}
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-2 rounded border border-[#e2e8f0] bg-transparent px-2 py-5 text-center transition-all hover:border-[#0077b5]/30 hover:bg-[#f0f9ff]"
                  onClick={handleConnectLinkedIn}
                >
                  <Linkedin className="h-5 w-5 text-[#0077b5]" strokeWidth={1.5} />
                  <span className="text-[11px] font-medium text-[#334155]">Connect LinkedIn</span>
                </button>
              </div>
            )}
          </AccordionStep>

          {/* ─── Step 2: Job Profile ──────────────────────── */}
          <AccordionStep
            number={2}
            title="Job Profile"
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
              {AI_PROFILES.map((profile) => {
                const isEditing = editingProfileId === profile.id
                const isSelected = selectedProfile === profile.id
                const currentLocation = getProfileLocation(profile.id)
                const currentTargeting = aiProfileOverrides[profile.id]?.targetingLocations ?? profile.targetingLocations

                return (
                  <div key={profile.id} className="relative">
                    {/* Pencil edit icon - top right */}
                    {!profileLocked && isSelected && (
                      <button
                        type="button"
                        className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded text-[#94a3b8] hover:text-[#334155]"
                        onClick={() => setEditingProfileId(isEditing ? null : profile.id)}
                      >
                        <Pencil className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    )}
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded border p-3 text-left transition-all",
                        isSelected
                          ? "border-[#3b82f6] bg-[#eff6ff]"
                          : "border-[#e2e8f0] bg-transparent hover:border-[#cbd5e1]",
                        profileLocked && "cursor-not-allowed opacity-60"
                      )}
                      onClick={() => {
                        if (profileLocked) return
                        setSelectedProfile(profile.id)
                      }}
                      disabled={profileLocked}
                    >
                      <p className="pr-6 text-[12px] font-semibold text-[#0f172a]">{profile.role}</p>

                      {/* Targeting Locations */}
                      {!isEditing && (
                        <p className="mt-1.5 text-[10px] text-[#64748b]">
                          {currentTargeting}
                        </p>
                      )}

                      {/* Work Model chips */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {LOCATION_OPTIONS.map((loc) => (
                          <span
                            key={loc}
                            className={cn(
                              "rounded border px-2 py-0.5 text-[10px]",
                              currentLocation.includes(loc)
                                ? "border-[#3b82f6] bg-[#dbeafe] text-[#1e40af]"
                                : "border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8]"
                            )}
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[#94a3b8]">
                        <span>{profile.seniority}</span>
                        <span>{profile.type}</span>
                      </div>
                    </button>

                    {/* Editable fields (when editing) */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 rounded-b border border-t-0 border-[#3b82f6] bg-[#eff6ff] p-3 pt-2">
                            <div>
                              <label className="text-[9px] text-[#64748b]">Targeting Locations</label>
                              <Input
                                type="text"
                                value={currentTargeting}
                                onChange={(e) =>
                                  setAiProfileOverrides((prev) => ({
                                    ...prev,
                                    [profile.id]: { ...prev[profile.id], targetingLocations: e.target.value },
                                  }))
                                }
                                placeholder="e.g. United States, New York"
                                className="mt-1 h-7 rounded border-[#e2e8f0] bg-white text-[11px] placeholder:text-[#94a3b8]"
                                disabled={profileLocked}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-[#64748b]">Work Model</label>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {LOCATION_OPTIONS.map((loc) => (
                                  <button
                                    key={loc}
                                    type="button"
                                    className={cn(
                                      "rounded border px-2 py-0.5 text-[10px] transition-all",
                                      currentLocation.includes(loc)
                                        ? "border-[#3b82f6] bg-[#dbeafe] text-[#1e40af]"
                                        : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
                                    )}
                                    onClick={() => toggleLocationChip(profile.id, loc)}
                                    disabled={profileLocked}
                                  >
                                    {loc}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-[#64748b]">Seniority</label>
                                <Input
                                  type="text"
                                  value={aiProfileOverrides[profile.id]?.seniority ?? profile.seniority}
                                  onChange={(e) =>
                                    setAiProfileOverrides((prev) => ({
                                      ...prev,
                                      [profile.id]: { ...prev[profile.id], seniority: e.target.value },
                                    }))
                                  }
                                  className="mt-1 h-7 rounded border-[#e2e8f0] bg-white text-[10px]"
                                  disabled={profileLocked}
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-[#64748b]">Job Type</label>
                                <Input
                                  type="text"
                                  value={aiProfileOverrides[profile.id]?.type ?? profile.type}
                                  onChange={(e) =>
                                    setAiProfileOverrides((prev) => ({
                                      ...prev,
                                      [profile.id]: { ...prev[profile.id], type: e.target.value },
                                    }))
                                  }
                                  className="mt-1 h-7 rounded border-[#e2e8f0] bg-white text-[10px]"
                                  disabled={profileLocked}
                                />
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

            {/* B. Create Custom Profile (Coming Soon) */}
            <div className="mt-3">
              <button
                type="button"
                className="flex h-10 w-full cursor-not-allowed items-center justify-center rounded border border-dashed border-[#e2e8f0] text-[11px] font-medium text-[#94a3b8]"
                disabled
              >
                Create Custom Profile (Coming Soon)
              </button>
            </div>

            {/* C. Necessary Info: 2x2 Matrix (always visible, always interactive) */}
            <div className="mt-4 border-t border-[#f1f5f9] pt-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                  Necessary Info
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex h-5 w-5 items-center justify-center rounded border border-[#e2e8f0] text-[10px] text-[#64748b] hover:border-[#cbd5e1]"
                    onClick={() => setAddingCountry(true)}
                    title="Add country"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="flex h-5 w-5 items-center justify-center rounded border border-[#e2e8f0] text-[10px] text-[#64748b] hover:border-[#cbd5e1]"
                    title="More options"
                  >
                    {"..."}
                  </button>
                </div>
              </div>

              {/* Add country input */}
              <AnimatePresence>
                {addingCountry && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 flex gap-2">
                      <Input
                        type="text"
                        value={newCountryName}
                        onChange={(e) => setNewCountryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addCountryToMatrix()
                        }}
                        placeholder="Country name"
                        className="h-7 flex-1 rounded border-[#e2e8f0] bg-transparent text-[10px] placeholder:text-[#94a3b8]"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="flex h-7 items-center rounded bg-[#0f172a] px-2 text-[10px] font-medium text-white hover:bg-[#1e293b]"
                        onClick={addCountryToMatrix}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="flex h-7 items-center rounded border border-[#e2e8f0] px-2 text-[10px] text-[#64748b] hover:border-[#cbd5e1]"
                        onClick={() => {
                          setAddingCountry(false)
                          setNewCountryName("")
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Matrix table */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr>
                      <th className="w-[110px] min-w-[110px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-2 text-left font-medium text-[#64748b]" />
                      {matrixCountries.map((country) => (
                        <th
                          key={country}
                          className="border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-center font-medium text-[#334155]"
                        >
                          {country}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="w-[110px] min-w-[110px] border border-[#e2e8f0] px-2 py-2 font-medium text-[#64748b]">
                        Work Authorization
                      </td>
                      {matrixCountries.map((country) => (
                        <td key={country} className="border border-[#e2e8f0] p-0 text-center">
                          <button
                            type="button"
                            className={cn(
                              "flex h-9 w-full items-center justify-center transition-colors",
                              matrix[country]?.workAuth === "yes"
                                ? "bg-[#f0fdf4] text-[#16a34a]"
                                : "bg-[#fef2f2] text-[#dc2626]"
                            )}
                            onClick={() => toggleMatrixCell(country, "workAuth")}
                          >
                            {matrix[country]?.workAuth === "yes" ? (
                              <Check className="h-4 w-4" strokeWidth={2.5} />
                            ) : (
                              <X className="h-4 w-4" strokeWidth={2.5} />
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="w-[110px] min-w-[110px] border border-[#e2e8f0] px-2 py-2 font-medium text-[#64748b]">
                        Sponsorship
                      </td>
                      {matrixCountries.map((country) => (
                        <td key={country} className="border border-[#e2e8f0] p-0 text-center">
                          <button
                            type="button"
                            className={cn(
                              "flex h-9 w-full items-center justify-center transition-colors",
                              matrix[country]?.sponsorship === "yes"
                                ? "bg-[#f0fdf4] text-[#16a34a]"
                                : "bg-[#fef2f2] text-[#dc2626]"
                            )}
                            onClick={() => toggleMatrixCell(country, "sponsorship")}
                          >
                            {matrix[country]?.sponsorship === "yes" ? (
                              <Check className="h-4 w-4" strokeWidth={2.5} />
                            ) : (
                              <X className="h-4 w-4" strokeWidth={2.5} />
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* D. EEO Section */}
            <div className="mt-4 border-t border-[#f1f5f9] pt-3">
              <button
                type="button"
                className="flex w-full items-center justify-between"
                onClick={() => setEeoExpanded(!eeoExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-[#64748b]" strokeWidth={1.5} />
                  <span className="text-[11px] font-medium text-[#334155]">
                    EEO: Prefer not to say
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-[#94a3b8] transition-transform",
                    eeoExpanded && "rotate-180"
                  )}
                  strokeWidth={1.5}
                />
              </button>

              <AnimatePresence>
                {eeoExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {["Gender", "Race", "Veteran", "Disability"].map((field) => (
                        <div key={field}>
                          <label className="text-[9px] text-[#64748b]">{field}</label>
                          <select
                            className="mt-1 h-7 w-full rounded border border-[#e2e8f0] bg-transparent px-2 text-[10px] text-[#334155] outline-none"
                            disabled={profileLocked}
                            defaultValue=""
                          >
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

            {/* Start Applying button */}
            {!profileLocked && steps.step2 === "in-progress" && (
              <button
                type="button"
                className={cn(
                  "mt-4 flex h-9 w-full items-center justify-center rounded text-[12px] font-semibold transition-all",
                  selectedProfile || userProfile.role.trim()
                    ? "bg-[#0f172a] text-white hover:bg-[#1e293b]"
                    : "cursor-not-allowed bg-[#f1f5f9] text-[#94a3b8]"
                )}
                onClick={handleStartApplying}
                disabled={!selectedProfile && !userProfile.role.trim()}
              >
                Start Applying
              </button>
            )}
          </AccordionStep>

          {/* ─── Step 3: Start Fill ──────────────────────── */}
          <AccordionStep
            number={3}
            title="Start Fill"
            status={steps.step3}
            isActive={activeStep === 3}
            onToggle={() => {
              if (steps.step3 === "in-progress" || steps.step3 === "completed") setActiveStep(3)
            }}
            canToggle={steps.step3 === "in-progress" || steps.step3 === "completed"}
          >
            <div className="space-y-3">
              {/* Numeric input: Apply the top [X] positions */}
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-[#334155]">Apply the top</p>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={topPositions}
                  onChange={(e) => setTopPositions(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  className="h-7 w-16 rounded border-[#e2e8f0] bg-transparent text-center text-[12px] font-semibold text-[#0f172a]"
                  disabled={runState !== "idle"}
                />
                <p className="text-[11px] text-[#334155]">positions</p>
              </div>

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

              {/* Recommend (Coming Soon) */}
              <button
                type="button"
                className="flex h-10 w-full cursor-not-allowed items-center justify-center rounded border border-[#e2e8f0] text-[12px] font-medium text-[#94a3b8]"
                disabled
                title="AI analysis not available in MVP"
              >
                Recommend (coming soon)
              </button>
            </div>
          </AccordionStep>
        </div>

        {/* ─── Footer ────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#e2e8f0] px-5 py-3">
          <p className="text-center text-[9px] text-[#94a3b8]">
            Y.EAA does not store credentials, cookies, or login sessions.
          </p>
        </div>

        {/* ─── Paste Text Modal Overlay ────────────────────── */}
        <AnimatePresence>
          {pasteModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm"
            >
              <div className="w-full max-w-[320px] px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#0f172a]">Paste Resume</h3>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center text-[#94a3b8] hover:text-[#0f172a]"
                    onClick={() => {
                      setPasteModalOpen(false)
                      setPasteText("")
                    }}
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>

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
                      onClick={() => {
                        setPasteModalOpen(false)
                        setPasteText("")
                      }}
                    >
                      Cancel
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
                  {/* Target summary */}
                  {selectedProfile && AI_PROFILES.find((p) => p.id === selectedProfile) && (
                    <div className="rounded border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                      <p className="text-[10px] text-[#64748b]">Target position</p>
                      <p className="mt-0.5 text-[12px] font-medium text-[#0f172a]">
                        {AI_PROFILES.find((p) => p.id === selectedProfile)?.role}
                      </p>
                    </div>
                  )}
                  {selectedProfile === "user" && userProfile.role && (
                    <div className="rounded border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
                      <p className="text-[10px] text-[#64748b]">Target position</p>
                      <p className="mt-0.5 text-[12px] font-medium text-[#0f172a]">
                        {userProfile.role}
                      </p>
                    </div>
                  )}
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
                  {/* I understand checkbox */}
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={confirmAcknowledged}
                      onChange={(e) => setConfirmAcknowledged(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[#e2e8f0] text-[#0f172a] accent-[#0f172a]"
                    />
                    <span className="text-[11px] font-medium text-[#334155]">I understand</span>
                  </label>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    className="flex h-9 flex-1 items-center justify-center rounded border border-[#e2e8f0] text-[11px] font-medium text-[#64748b] transition-all hover:border-[#cbd5e1]"
                    onClick={() => {
                      setConfirmModalOpen(false)
                      setConfirmAcknowledged(false)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex h-9 flex-1 items-center justify-center rounded text-[11px] font-semibold transition-all",
                      confirmAcknowledged
                        ? "bg-[#0f172a] text-white hover:bg-[#1e293b]"
                        : "cursor-not-allowed bg-[#f1f5f9] text-[#94a3b8]"
                    )}
                    onClick={handleConfirmProceed}
                    disabled={!confirmAcknowledged}
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
      {/* Step header */}
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
