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
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Upload,
  FileText,
  Key,
  ChevronDown,
  AlertCircle,
  Loader2,
  Check,
  Circle,
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

function statusDot(status: StepStatus) {
  switch (status) {
    case "completed":
      return "bg-[#16a34a]"
    case "in-progress":
      return "bg-[#002d72]"
    case "invalidated":
      return "bg-[#ca8a04]"
    case "not-started":
    default:
      return "bg-[#ca8a04]"
  }
}

function statusBorder(status: StepStatus) {
  switch (status) {
    case "completed":
      return "border-l-[#16a34a]"
    case "in-progress":
      return "border-l-[#002d72]"
    case "invalidated":
      return "border-l-[#ca8a04]"
    case "not-started":
    default:
      return "border-l-[#e5e5e5]"
  }
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

const ANALYSIS_LINES = [
  "Parsing resume structure\u2026",
  "Extracting experience timeline\u2026",
  "Mapping skills to market taxonomy\u2026",
  "Analyzing career trajectory\u2026",
  "Identifying target roles\u2026",
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

  // Step 1 data
  const [resumeText, setResumeText] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [keyStatus, setKeyStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle")

  // Step 2 data
  const [analysisLog, setAnalysisLog] = useState<string[]>([])
  const [roles, setRoles] = useState<typeof MOCK_ROLES>([])
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [analysisComplete, setAnalysisComplete] = useState(false)

  // Step 3 data
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Referral
  const [referralCode, setReferralCode] = useState("")
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [appliedCodes, setAppliedCodes] = useState<string[]>([])

  const hasResume = resumeText.trim().length > 0

  /* ─── Step 1: API Key Validation ────────────────────── */

  const handleValidateKey = useCallback(async () => {
    if (!apiKey.trim()) return
    setKeyStatus("checking")
    await new Promise((r) => setTimeout(r, 1500))
    // Mock: any key starting with "sk-" is valid
    if (apiKey.startsWith("sk-") && apiKey.length > 5) {
      setKeyStatus("valid")
    } else {
      setKeyStatus("invalid")
    }
  }, [apiKey])

  /* ─── Step 1: Implicit completion check ─────────────── */

  useEffect(() => {
    if (keyStatus === "valid" && hasResume && steps.step1 === "in-progress") {
      setSteps((prev) => ({ ...prev, step1: "completed", step2: "in-progress" }))
      setActiveStep(2)
    }
  }, [keyStatus, hasResume, steps.step1])

  /* ─── Step 1 Reopen (Invalidates downstream) ───────── */

  const handleReopenStep1 = useCallback(() => {
    setActiveStep(1)
    setSteps({
      step1: "in-progress",
      step2: steps.step2 !== "not-started" ? "invalidated" : "not-started",
      step3: steps.step3 !== "not-started" ? "invalidated" : "not-started",
    })
    setKeyStatus("idle")
    setAnalysisLog([])
    setRoles([])
    setSelectedRole(null)
    setAnalysisComplete(false)
  }, [steps])

  /* ─── Step 2 Analysis (auto-starts) ─────────────────── */

  const analysisRef = useRef(false)

  useEffect(() => {
    if (steps.step2 !== "in-progress" || analysisRef.current) return
    analysisRef.current = true

    let idx = 0
    const logInterval = setInterval(() => {
      if (idx < ANALYSIS_LINES.length) {
        setAnalysisLog((prev) => [...prev, ANALYSIS_LINES[idx]])
        idx++
      } else {
        clearInterval(logInterval)
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
      clearInterval(logInterval)
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
        {/* ─── Header (Global) ───────────────────────────── */}
        <div className="shrink-0 border-b border-border px-5 py-4">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <SheetTitle className="text-sm font-semibold text-foreground">
                  Y.EAA
                </SheetTitle>
                <span className="text-[10px] text-muted-foreground">LinkedIn Easy Apply Assistant</span>
              </div>
              {/* Quota (clickable) */}
              <button
                type="button"
                className="flex items-center gap-1.5"
                onClick={() => setQuotaTrayOpen(!quotaTrayOpen)}
              >
                <span className="font-mono text-[11px] font-medium text-foreground">
                  {quota}
                </span>
                <span className="text-[10px] text-muted-foreground">applications remaining</span>
                <span className="ml-0.5 text-sm text-muted-foreground">+</span>
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
            {/* API Key */}
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">API Key</p>
              <p className="text-[10px] text-muted-foreground">LLM API key</p>
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
                    placeholder="sk-\u2026"
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

            {/* Source material */}
            <div className="mt-5 space-y-2">
              <p className="text-[11px] text-muted-foreground">Source material</p>
              <p className="text-[10px] text-muted-foreground">
                Provide source material to help Y.EAA understand your background.
              </p>
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste text here"
                className="min-h-[100px] resize-none border-border bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground focus:border-primary"
              />
              <p className="text-center text-[10px] text-muted-foreground">or</p>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 border border-dashed border-border py-3 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
                Upload files
              </button>
              <p className="text-center text-[10px] text-muted-foreground">
                PDF, DOC, or plain text
              </p>
              {hasResume && (
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-[10px] text-muted-foreground">
                    {resumeText.split(/\s+/).length} words loaded
                  </span>
                </div>
              )}
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
            {/* System activity (background, secondary) */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-normal text-muted-foreground">
                System activity
              </p>
              <div className="rounded-sm bg-[#fafafa] p-3">
                <div className="max-h-[120px] space-y-1 overflow-y-auto font-mono text-[11px] leading-relaxed">
                  {analysisLog.map((line, i) => (
                    <motion.div
                      key={`log-${i}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-muted-foreground"
                    >
                      {line}
                    </motion.div>
                  ))}
                  {!analysisComplete && steps.step2 === "in-progress" && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#002d72]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Target role (Primary decision surface) */}
            {roles.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-[10px] uppercase tracking-normal text-muted-foreground">
                  Recommended roles
                </p>
                {roles.map((role) => (
                  <motion.button
                    key={role.title}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex w-full items-center justify-between border px-4 py-3 text-left transition-colors",
                      selectedRole === role.title
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/20"
                    )}
                    onClick={() => handleSelectRole(role.title)}
                  >
                    <div className="flex items-center gap-2.5">
                      {selectedRole === role.title ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" strokeWidth={1} />
                      )}
                      <span className="text-sm text-foreground">{role.title}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {Math.round(role.confidence * 100)}%
                    </span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Operating conditions */}
            <div className="mt-5 space-y-1.5">
              <p className="text-[10px] text-muted-foreground">
                Y.EAA operates under the following conditions:
              </p>
              {[
                "Works only inside your active LinkedIn tab",
                "Does not auto-submit applications",
                "No actions outside the current browser tab",
              ].map((line) => (
                <div key={line} className="flex items-start gap-2">
                  <span className="mt-1.5 h-0.5 w-0.5 shrink-0 rounded-full bg-muted-foreground" />
                  <p className="text-[10px] leading-relaxed text-muted-foreground">{line}</p>
                </div>
              ))}
            </div>

            {/* Invalidated notice */}
            {steps.step2 === "invalidated" && (
              <div className="mt-3 flex items-center gap-2 border border-[#ca8a04]/20 bg-[#ca8a04]/5 px-3 py-2">
                <AlertCircle className="h-3 w-3 shrink-0 text-[#ca8a04]" strokeWidth={1.5} />
                <p className="text-[10px] text-[#ca8a04]">
                  Prepare was modified. Re-validate to continue.
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

            {/* Confirmation */}
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

        {/* ─── Footer (Global, Persistent) ───────────────── */}
        <div className="shrink-0 border-t border-border px-5 py-3">
          <p className="text-center text-[10px] text-muted-foreground">
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
    <div
      className={cn(
        "border-b border-border border-l-2 transition-colors duration-200",
        statusBorder(status)
      )}
    >
      {/* Step header */}
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors",
          canToggle ? "hover:bg-secondary/50" : "cursor-default",
          isActive && "bg-secondary/30"
        )}
        onClick={onToggle}
        disabled={!canToggle}
      >
        <div className={cn("h-2 w-2 shrink-0 rounded-full", statusDot(status))} />
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{number}</span>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {status === "completed" && (
          <Check className="ml-auto h-3.5 w-3.5 text-[#16a34a]" strokeWidth={2} />
        )}
        {status === "invalidated" && (
          <AlertCircle className="ml-auto h-3.5 w-3.5 text-[#ca8a04]" strokeWidth={1.5} />
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
            <div className="px-5 pb-5 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
