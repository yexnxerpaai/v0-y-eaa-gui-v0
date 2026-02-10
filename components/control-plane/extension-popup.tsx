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
import {
  Upload,
  FileText,
  Key,
  AlertCircle,
  Loader2,
  Check,
  Globe,
  HardDrive,
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

/* ─── Status Color Map ────────────────────────────────── */

const STATUS_BAR: Record<StepStatus, string> = {
  completed: "bg-[#16a34a]",
  "in-progress": "bg-[#002d72]",
  invalidated: "bg-[#ca8a04]",
  "not-started": "bg-[#e5e5e5]",
}

const STATUS_TEXT: Record<StepStatus, string> = {
  completed: "text-white",
  "in-progress": "text-white",
  invalidated: "text-white",
  "not-started": "text-foreground",
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
  "Parsing source material\u2026",
  "Extracting experience timeline\u2026",
  "Mapping skills to market taxonomy\u2026",
  "Analyzing career trajectory\u2026",
  "Identifying target roles\u2026",
  "Finalizing recommendations\u2026",
]

const MOCK_ROLES = [
  { title: "Senior Software Engineer", confidence: 0.94 },
  { title: "Staff Engineer", confidence: 0.87 },
  { title: "Engineering Manager", confidence: 0.72 },
]

/* ─── Main Component ──────────────────────────────────── */

export function ExtensionPopup({ open, onOpenChange }: ExtensionPopupProps) {
  const [quota, setQuota] = useState(5)
  const [quotaTrayOpen, setQuotaTrayOpen] = useState(false)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [steps, setSteps] = useState<StepState>({
    step1: "in-progress",
    step2: "not-started",
    step3: "not-started",
  })

  // Step 1 state
  const [apiKey, setApiKey] = useState("")
  const [keyStatus, setKeyStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle")
  const [sources, setSources] = useState<{ name: string; type: string }[]>([])
  const [showPasteInput, setShowPasteInput] = useState(false)
  const [pasteText, setPasteText] = useState("")

  // Step 2 state
  const [currentMessage, setCurrentMessage] = useState("")
  const [roles, setRoles] = useState<typeof MOCK_ROLES>([])
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  // Step 3 state
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Referral state
  const [referralCode, setReferralCode] = useState("")
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [appliedCodes, setAppliedCodes] = useState<string[]>([])

  const hasSources = sources.length > 0

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

  /* ─── Step 1: Source interaction auto-completes step ──── */

  useEffect(() => {
    if (hasSources && steps.step1 === "in-progress") {
      setSteps((prev) => ({ ...prev, step1: "completed", step2: "in-progress" }))
      setActiveStep(2)
    }
  }, [hasSources, steps.step1])

  /* ─── Step 1: Add source helpers ─────────────────────── */

  const handleAddFile = useCallback(() => {
    // Mock: simulate file picker
    setSources((prev) => [...prev, { name: "resume_2026.pdf", type: "PDF" }])
  }, [])

  const handleAddWebsite = useCallback(() => {
    setSources((prev) => [...prev, { name: "linkedin.com/in/profile", type: "URL" }])
  }, [])

  const handleAddDrive = useCallback(() => {
    setSources((prev) => [...prev, { name: "Google Drive - Resume.docx", type: "Drive" }])
  }, [])

  const handleAddPaste = useCallback(() => {
    if (pasteText.trim()) {
      setSources((prev) => [...prev, { name: `Pasted text (${pasteText.trim().split(/\s+/).length} words)`, type: "Text" }])
      setPasteText("")
      setShowPasteInput(false)
    }
  }, [pasteText])

  /* ─── Step 1 Reopen (Invalidates downstream) ─────────── */

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
    setSelectedRole(null)
    setAnalysisComplete(false)
    analysisRef.current = false
  }, [steps])

  /* ─── Step 2 Analysis (auto-starts, single-line replace) */

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

    // Surface roles progressively
    const roleTimeouts = MOCK_ROLES.map((role, i) =>
      setTimeout(() => {
        setRoles((prev) => [...prev, role])
        if (i === MOCK_ROLES.length - 1) {
          setAnalysisComplete(true)
        }
      }, 3000 + i * 1500)
    )

    return () => {
      clearInterval(msgInterval)
      for (const t of roleTimeouts) clearTimeout(t)
    }
  }, [steps.step2])

  const handleSelectRole = useCallback((title: string) => {
    setSelectedRole(title)
    setSteps((prev) => ({ ...prev, step2: "completed", step3: "in-progress" }))
    setActiveStep(3)
  }, [])

  /* ─── Step 3 Go ─────────────────────────────────────── */

  const handleGo = useCallback(() => {
    setSteps((prev) => ({ ...prev, step3: "completed" }))
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
        className="flex w-[380px] flex-col border-l border-border bg-background p-0 sm:w-[380px]"
      >
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="shrink-0 border-b border-border px-5 py-4">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm font-semibold text-foreground">
                Y.EAA
              </SheetTitle>
              {/* Quota chip (clickable, opens tray) */}
              <button
                type="button"
                className="flex items-center gap-1 border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                onClick={() => setQuotaTrayOpen(!quotaTrayOpen)}
              >
                <span className="text-[10px] text-muted-foreground">Quota:</span>
                <span className="font-mono font-medium text-foreground">{quota}</span>
              </button>
            </div>
          </SheetHeader>
        </div>

        {/* ─── Quota Tray (expanded on click) ────────────── */}
        <AnimatePresence>
          {quotaTrayOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0 overflow-hidden border-b border-border"
            >
              <div className="px-5 pb-4 pt-3">
                <p className="text-[10px] uppercase tracking-normal text-muted-foreground">
                  Referral code
                </p>
                <div className="mt-2 flex gap-2">
                  <Input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !referralLoading) handleApplyReferral()
                    }}
                    placeholder="Enter code"
                    disabled={referralLoading}
                    className="h-8 flex-1 border-border bg-transparent text-xs placeholder:text-muted-foreground"
                  />
                  <Button
                    variant="outline"
                    className="h-8 shrink-0 border-border bg-transparent px-3 text-[11px] font-medium text-foreground hover:bg-secondary"
                    onClick={handleApplyReferral}
                    disabled={referralLoading || referralCode.trim().length === 0}
                  >
                    {referralLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
                {referralError && (
                  <p className="mt-1.5 text-[10px] text-destructive">{referralError}</p>
                )}
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                  Adds applications to your remaining quota.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Accordion Steps ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ─── Step 1: PREPARE ─────────────────────────── */}
          <AccordionStep
            number={1}
            title="Prepare"
            status={steps.step1}
            isActive={activeStep === 1}
            onToggle={() => {
              if (activeStep === 1) return
              if (steps.step1 === "completed") handleReopenStep1()
            }}
            canToggle={steps.step1 === "completed" || steps.step1 === "in-progress"}
          >
            {/* LLM API Key (status-only, never blocks progression) */}
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">LLM API Key</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                      if (keyStatus !== "idle") setKeyStatus("idle")
                    }}
                    placeholder="sk-..."
                    className="h-8 border-border bg-transparent pl-8 text-sm placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  variant="outline"
                  className="h-8 shrink-0 border-border bg-transparent px-3 text-[11px] font-medium text-foreground hover:bg-secondary"
                  onClick={handleValidateKey}
                  disabled={!apiKey.trim() || keyStatus === "checking"}
                >
                  {keyStatus === "checking" ? (
                    <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
                  ) : (
                    "Validate"
                  )}
                </Button>
              </div>
              {keyStatus === "checking" && (
                <p className="text-[10px] text-muted-foreground">{"Validating connection\u2026"}</p>
              )}
              {keyStatus === "valid" && (
                <div className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-[#16a34a]" strokeWidth={2} />
                  <p className="text-[10px] text-[#16a34a]">Key verified</p>
                </div>
              )}
              {keyStatus === "invalid" && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-destructive" strokeWidth={1.5} />
                  <p className="text-[10px] text-destructive">Invalid key. Please check and try again.</p>
                </div>
              )}
            </div>

            {/* Source material (NotebookLM-style container) */}
            <div className="mt-5 space-y-3">
              <p className="text-[11px] text-muted-foreground">Source material</p>

              {/* Added sources list */}
              {sources.length > 0 && (
                <div className="space-y-1.5">
                  {sources.map((src, i) => (
                    <div
                      key={`src-${i}`}
                      className="flex items-center gap-2 border border-border px-3 py-2"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                      <span className="flex-1 truncate text-[11px] text-foreground">{src.name}</span>
                      <span className="shrink-0 text-[9px] uppercase text-muted-foreground">{src.type}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Source action buttons (NotebookLM-style) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 border border-dashed border-border px-3 py-2.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  onClick={handleAddFile}
                >
                  <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Upload files
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 border border-dashed border-border px-3 py-2.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  onClick={handleAddWebsite}
                >
                  <Globe className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Website
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 border border-dashed border-border px-3 py-2.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  onClick={handleAddDrive}
                >
                  <HardDrive className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Drive
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 border border-dashed border-border px-3 py-2.5 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  onClick={() => setShowPasteInput(!showPasteInput)}
                >
                  <ClipboardPaste className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Copied text
                </button>
              </div>

              {/* Inline paste input (only shown on click) */}
              <AnimatePresence>
                {showPasteInput && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddPaste()
                        }}
                        placeholder="Paste text content"
                        className="h-8 flex-1 border-border bg-transparent text-xs placeholder:text-muted-foreground"
                        autoFocus
                      />
                      <Button
                        variant="outline"
                        className="h-8 shrink-0 border-border bg-transparent px-3 text-[11px] font-medium text-foreground hover:bg-secondary"
                        onClick={handleAddPaste}
                        disabled={!pasteText.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </AccordionStep>

          {/* ─── Step 2: SELECT ──────────────────────────── */}
          <AccordionStep
            number={2}
            title="Select"
            status={steps.step2}
            isActive={activeStep === 2}
            onToggle={() => {
              if (steps.step2 === "completed" || steps.step2 === "in-progress") {
                setActiveStep(2)
              }
            }}
            canToggle={steps.step2 === "completed" || steps.step2 === "in-progress"}
          >
            {/* Operating conditions (above roles, always visible) */}
            <div className="mb-4 space-y-1">
              {[
                "Works only inside your active LinkedIn tab",
                "Does not auto-submit applications",
                "No actions outside the current browser tab",
              ].map((line) => (
                <div key={line} className="flex items-start gap-2">
                  <span className="mt-1.5 h-0.5 w-0.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <p className="text-[10px] leading-relaxed text-muted-foreground/70">{line}</p>
                </div>
              ))}
            </div>

            {/* Single-line system message (replace on update, no heading) */}
            {currentMessage && (
              <div className="mb-4 rounded-sm bg-[#fafafa] px-3 py-2">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMessage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="font-mono text-[10px] text-muted-foreground/60"
                  >
                    {currentMessage}
                    {!analysisComplete && (
                      <span className="ml-1.5 inline-block h-1 w-1 animate-pulse rounded-full bg-[#002d72]" />
                    )}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}

            {/* Recommended roles (full-width buttons, no radio circles) */}
            {roles.length > 0 && (
              <div className="space-y-2">
                {roles.map((role) => (
                  <motion.button
                    key={role.title}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex w-full items-center justify-between border px-4 py-3.5 text-left transition-all",
                      selectedRole === role.title
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/20 hover:bg-secondary/30"
                    )}
                    onClick={() => handleSelectRole(role.title)}
                  >
                    <span className="text-sm font-medium text-foreground">{role.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/50">
                      {Math.round(role.confidence * 100)}%
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Invalidated notice */}
            {steps.step2 === "invalidated" && (
              <div className="mt-3 flex items-center gap-2 border border-[#ca8a04]/20 bg-[#ca8a04]/5 px-3 py-2">
                <AlertCircle className="h-3 w-3 shrink-0 text-[#ca8a04]" strokeWidth={1.5} />
                <p className="text-[10px] text-[#ca8a04]">
                  Prepare was modified. Re-add sources to continue.
                </p>
              </div>
            )}
          </AccordionStep>

          {/* ─── Step 3: GO APPLY ────────────────────────── */}
          <AccordionStep
            number={3}
            title="Go Apply"
            status={steps.step3}
            isActive={activeStep === 3}
            onToggle={() => {
              if (steps.step3 === "in-progress" || steps.step3 === "completed") {
                setActiveStep(3)
              }
            }}
            canToggle={steps.step3 === "in-progress" || steps.step3 === "completed"}
          >
            {/* Ready state summary */}
            {selectedRole && (
              <div className="mb-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Target role:</span>
                  <span className="text-[11px] font-medium text-foreground">{selectedRole}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Platform:</span>
                  <span className="text-[11px] font-medium text-foreground">LinkedIn Easy Apply</span>
                </div>
              </div>
            )}

            {/* Confirmation checkbox */}
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => setDontShowAgain(!dontShowAgain)}
            >
              {dontShowAgain ? (
                <CheckSquare className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
              ) : (
                <Square className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              )}
              <span className="text-xs text-muted-foreground">
                {"Don't show this again"}
              </span>
            </button>

            {/* Primary action */}
            <div className="mt-5">
              {steps.step3 === "completed" ? (
                <div className="flex items-center gap-2 py-2">
                  <Check className="h-3.5 w-3.5 text-[#16a34a]" strokeWidth={2} />
                  <span className="text-xs text-[#16a34a]">Tab group opened</span>
                </div>
              ) : (
                <Button
                  className="h-10 w-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  onClick={handleGo}
                >
                  System ready. Proceed.
                </Button>
              )}
            </div>

            {/* Invalidated notice */}
            {steps.step3 === "invalidated" && (
              <div className="mt-3 flex items-center gap-2 border border-[#ca8a04]/20 bg-[#ca8a04]/5 px-3 py-2">
                <AlertCircle className="h-3 w-3 shrink-0 text-[#ca8a04]" strokeWidth={1.5} />
                <p className="text-[10px] text-[#ca8a04]">
                  Previous steps were modified. Complete them to proceed.
                </p>
              </div>
            )}
          </AccordionStep>
        </div>

        {/* ─── Footer (background noise) ─────────────────── */}
        <div className="shrink-0 border-t border-border px-5 py-3">
          <p className="text-center text-[9px] text-muted-foreground/50">
            Y.EAA does not store credentials, cookies, or login sessions.
          </p>
        </div>
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
    <div className="border-b border-border">
      {/* Step header (full-bar color) */}
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors",
          STATUS_BAR[status],
          canToggle ? "hover:opacity-90" : "cursor-default"
        )}
        onClick={onToggle}
        disabled={!canToggle}
      >
        <span className={cn("font-mono text-[10px]", STATUS_TEXT[status])}>{number}</span>
        <span className={cn("text-sm font-medium", STATUS_TEXT[status])}>{title}</span>
        {status === "completed" && (
          <Check className="ml-auto h-3.5 w-3.5 text-white" strokeWidth={2} />
        )}
        {status === "invalidated" && (
          <AlertCircle className="ml-auto h-3.5 w-3.5 text-white" strokeWidth={1.5} />
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
            <div className="px-5 pb-5 pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
