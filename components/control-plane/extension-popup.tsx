"use client"

import { useState, useCallback } from "react"
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
  ArrowRight,
  CheckSquare,
  Square,
  Play,
  Pause,
  StopCircle,
  RotateCcw,
  Pencil,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ExtensionPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ExtensionState =
  | "setup"
  | "consent"
  | "ready"
  | "running"
  | "paused"
  | "completed"

export function ExtensionPopup({ open, onOpenChange }: ExtensionPopupProps) {
  const [state, setState] = useState<ExtensionState>("setup")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[380px] border-l border-border bg-background p-0 sm:w-[380px]"
      >
        {/* Extension Header */}
        <div className="border-b border-border px-5 py-4">
          <SheetHeader className="space-y-0">
            <div className="flex items-baseline gap-1.5">
              <SheetTitle className="text-sm font-semibold text-foreground">
                Y.EAA Extension
              </SheetTitle>
              <span className="text-[10px] text-muted-foreground">MVP</span>
            </div>
          </SheetHeader>
        </div>

        {/* State Content */}
        <div className="flex h-[calc(100%-57px)] flex-col">
          {state === "setup" && <SetupState onContinue={() => setState("consent")} />}
          {state === "consent" && (
            <ConsentState
              onAccept={() => setState("ready")}
              onBack={() => setState("setup")}
            />
          )}
          {state === "ready" && <ReadyState onStart={() => setState("running")} onEditSetup={() => setState("setup")} />}
          {state === "running" && <RunningState onPause={() => setState("paused")} />}
          {state === "paused" && (
            <PausedState
              onResume={() => setState("running")}
              onStop={() => setState("completed")}
            />
          )}
          {state === "completed" && <CompletedState onReset={() => setState("setup")} />}
        </div>
      </SheetContent>
    </Sheet>
  )
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
  if (code.trim().length === 0) {
    return { success: false, error: "Invalid referral code" }
  }
  return { success: false, error: "This referral code has already been used" }
}

/* ─── STATE 0: Setup ──────────────────────────────────── */

function SetupState({ onContinue }: { onContinue: () => void }) {
  const [resumeText, setResumeText] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [freeQuota, setFreeQuota] = useState(5)

  // Referral code state
  const [referralCode, setReferralCode] = useState("")
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [appliedCodes, setAppliedCodes] = useState<string[]>([])

  const hasResume = resumeText.trim().length > 0

  const handleApplyReferral = useCallback(async () => {
    const code = referralCode.trim().toUpperCase()
    if (!code) return

    if (appliedCodes.includes(code)) {
      setReferralError("This referral code has already been used")
      setTimeout(() => setReferralError(null), 3000)
      return
    }

    setReferralLoading(true)
    setReferralSuccess(null)
    setReferralError(null)

    const result = await verifyReferralCode(code)

    if (result.success && result.quotaAdded) {
      setFreeQuota((prev) => prev + result.quotaAdded!)
      setAppliedCodes((prev) => [...prev, code])
      setReferralSuccess(
        `Referral code applied. +${result.quotaAdded} applications added.`
      )
      setReferralCode("")
    } else {
      setReferralError(result.error || "Invalid referral code")
      setTimeout(() => setReferralError(null), 3000)
    }

    setReferralLoading(false)
  }, [referralCode, appliedCodes])

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Resume Input */}
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Resume
            </p>
            <button
              type="button"
              className="flex items-center gap-1 text-[10px] text-primary hover:underline"
            >
              <Upload className="h-3 w-3" strokeWidth={1.5} />
              Upload PDF
            </button>
          </div>
          <Textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume as plain text, or upload a PDF above."
            className="mt-3 min-h-[120px] resize-none border-border bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground focus:border-primary"
          />
          {hasResume && (
            <div className="mt-2 flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[10px] text-muted-foreground">
                {resumeText.split(/\s+/).length} words loaded
              </span>
            </div>
          )}
        </div>

        {/* API Key */}
        <div className="border-b border-border px-5 py-5">
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              LLM API Key
            </p>
            <span className="text-xs text-muted-foreground">
              Optional
            </span>
          </button>
          {showApiKey && (
            <div className="mt-3">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="h-9 border-border bg-transparent pl-9 text-sm placeholder:text-muted-foreground"
                />
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Without an API key, Y.EAA uses a free quota of {freeQuota} applications.
              </p>
            </div>
          )}
        </div>

        {/* Referral Code */}
        <div className="border-b border-border px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Referral Code (Internal Testing)
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              type="text"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value)
                if (referralSuccess) setReferralSuccess(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !referralLoading) handleApplyReferral()
              }}
              placeholder="Enter referral code"
              disabled={referralLoading}
              className="h-9 flex-1 border-border bg-transparent text-sm placeholder:text-muted-foreground"
            />
            <Button
              variant="outline"
              className="h-9 shrink-0 border-border bg-transparent px-4 text-xs font-medium text-foreground hover:bg-secondary"
              onClick={handleApplyReferral}
              disabled={referralLoading || referralCode.trim().length === 0}
            >
              {referralLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
              ) : (
                "Apply"
              )}
            </Button>
          </div>

          {/* Success feedback */}
          {referralSuccess && (
            <p className="mt-2 text-[10px] leading-relaxed text-[#16a34a]">
              {referralSuccess}
            </p>
          )}

          {/* Error toast (inline) */}
          {referralError && (
            <div className="mt-2 flex items-center gap-1.5 border border-destructive/20 bg-destructive/5 px-2.5 py-1.5">
              <AlertCircle className="h-3 w-3 shrink-0 text-destructive" strokeWidth={1.5} />
              <p className="text-[10px] text-destructive">{referralError}</p>
            </div>
          )}
        </div>

        {/* Quota Display */}
        <div className="px-5 py-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Quota
            </p>
            {apiKey ? (
              <span className="text-xs text-foreground">Using your API key</span>
            ) : (
              <span className="font-mono text-xs text-foreground">{freeQuota} remaining</span>
            )}
          </div>
          {!apiKey && (
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
              Free applications remaining. Total, not per day.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-5 py-4">
        <p className="mb-3 text-[10px] leading-relaxed text-muted-foreground">
          Y.EAA only works on LinkedIn job pages. Setup does not start any application.
        </p>
        <Button
          className="h-9 w-full gap-2 bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90"
          onClick={onContinue}
          disabled={!hasResume}
        >
          Continue to LinkedIn Jobs
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Button>
      </div>
    </>
  )
}

/* ─── STATE 1: Pre-LinkedIn Consent ────────────────────── */

function ConsentState({
  onAccept,
  onBack,
}: {
  onAccept: () => void
  onBack: () => void
}) {
  const [consented, setConsented] = useState(false)

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <h2 className="text-lg font-semibold tracking-normal text-foreground">
          Before you continue
        </h2>

        <div className="mt-5 space-y-4">
          {[
            "Y.EAA operates only on LinkedIn pages you open.",
            "It works only while you are logged into LinkedIn in this browser.",
            "No passwords are stored.",
            "No cookies are saved.",
            "No actions happen outside this session.",
          ].map((line) => (
            <div key={line} className="flex items-start gap-3">
              <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
              <p className="text-sm leading-relaxed text-foreground">{line}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-border pt-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Y.EAA assists you only while you are logged into LinkedIn in this
            browser tab. We do not store credentials, cookies, or login sessions.
            All actions happen visibly during this session.
          </p>
        </div>

        {/* Consent Checkbox */}
        <button
          type="button"
          className="mt-6 flex items-start gap-3"
          onClick={() => setConsented(!consented)}
        >
          {consented ? (
            <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
          ) : (
            <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          )}
          <span className="text-left text-sm leading-relaxed text-foreground">
            I understand and want to continue
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-5 py-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-9 flex-1 border-border bg-transparent text-xs font-medium text-foreground"
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            className="h-9 flex-1 gap-2 bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90"
            onClick={onAccept}
            disabled={!consented}
          >
            Go to LinkedIn Jobs
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </>
  )
}

/* ─── STATE 2: Ready (On LinkedIn, Idle) ────────────────── */

function ReadyState({
  onStart,
  onEditSetup,
}: {
  onStart: () => void
  onEditSetup: () => void
}) {
  const [resumeExpanded, setResumeExpanded] = useState(false)
  const freeQuota = 5

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Status */}
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-sm font-medium text-foreground">Ready</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Open a job with Easy Apply to begin.
          </p>
        </div>

        {/* Quota */}
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Quota
            </span>
            <span className="font-mono text-xs text-foreground">{freeQuota} remaining</span>
          </div>
        </div>

        {/* Resume Summary */}
        <div className="border-b border-border px-5 py-4">
          <button
            type="button"
            className="flex w-full items-center justify-between"
            onClick={() => setResumeExpanded(!resumeExpanded)}
          >
            <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Resume
            </span>
            {resumeExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            )}
          </button>
          {resumeExpanded && (
            <div className="mt-3 border border-border p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Alex Chen - Senior Software Engineer with 8+ years experience...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-5 py-4">
        <Button
          className="h-10 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
          onClick={onStart}
        >
          <Play className="h-3.5 w-3.5" strokeWidth={2} />
          Start Easy Apply
        </Button>
        <div className="mt-3 flex justify-center gap-4">
          <button
            type="button"
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={onEditSetup}
          >
            <Pencil className="h-3 w-3" strokeWidth={1.5} />
            Edit Resume
          </button>
          <button
            type="button"
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={onEditSetup}
          >
            <Key className="h-3 w-3" strokeWidth={1.5} />
            Edit Settings
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── STATE 3: Running ─────────────────────────────────── */

function RunningState({ onPause }: { onPause: () => void }) {
  const [current] = useState(2)
  const total = 5

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Status */}
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-sm font-medium text-foreground">Running</span>
          </div>
        </div>

        {/* Progress */}
        <div className="border-b border-border px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Progress
          </p>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-semibold text-foreground">{current}</span>
            <span className="text-sm text-muted-foreground">of {total}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 w-full bg-border">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(current / total) * 100}%` }}
            />
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            Applying to Senior Software Engineer at Stripe...
          </p>
        </div>

        {/* Recent Activity */}
        <div className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Activity
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Staff Engineer at Figma - submitted
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Senior Software Engineer at Stripe - in progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-5 py-4">
        <Button
          variant="outline"
          className="h-10 w-full gap-2 border-border bg-transparent text-sm font-medium text-foreground"
          onClick={onPause}
        >
          <Pause className="h-3.5 w-3.5" strokeWidth={2} />
          Pause
        </Button>
      </div>
    </>
  )
}

/* ─── STATE 4: Paused ──────────────────────────────────── */

function PausedState({
  onResume,
  onStop,
}: {
  onResume: () => void
  onStop: () => void
}) {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Status */}
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-sm font-medium text-foreground">Paused</span>
          </div>
        </div>

        {/* Confirmation */}
        <div className="px-5 py-6">
          <p className="text-sm leading-relaxed text-foreground">
            Application paused. You can resume or stop the session.
          </p>

          <div className="mt-6 space-y-3 border-t border-border pt-5">
            <div className="flex items-start gap-3">
              <Play className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-foreground">Resume</p>
                <p className="text-xs text-muted-foreground">
                  Restart from the current job.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StopCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-foreground">Stop</p>
                <p className="text-xs text-muted-foreground">
                  End this session. Shows summary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-5 py-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-9 flex-1 gap-1.5 border-border bg-transparent text-xs font-medium text-foreground"
            onClick={onStop}
          >
            <StopCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            Stop
          </Button>
          <Button
            className="h-9 flex-1 gap-1.5 bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90"
            onClick={onResume}
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2} />
            Resume
          </Button>
        </div>
      </div>
    </>
  )
}

/* ─── STATE 5: Completed / Stopped ─────────────────────── */

function CompletedState({ onReset }: { onReset: () => void }) {
  const attempted = 5
  const submitted = 3
  const skipped = 2
  const quotaRemaining = 0

  const skippedFields = [
    "Cover letter field at Notion was unclear.",
    "Salary expectation at Linear had unexpected format.",
  ]

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        {/* Status */}
        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Session Complete</span>
          </div>
        </div>

        {/* Summary */}
        <div className="border-b border-border px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            Summary
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Attempted</span>
              <span className="font-mono text-sm text-foreground">{attempted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Submitted</span>
              <span className="font-mono text-sm text-foreground">{submitted}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Skipped</span>
              <span className="font-mono text-sm text-foreground">{skipped}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quota remaining</span>
              <span className="font-mono text-sm text-foreground">{quotaRemaining}</span>
            </div>
          </div>
        </div>

        {/* Skipped Details */}
        {skippedFields.length > 0 && (
          <div className="px-5 py-5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                Skipped Fields
              </p>
            </div>
            <div className="mt-3 space-y-2">
              {skippedFields.map((field) => (
                <p key={field} className="text-xs leading-relaxed text-muted-foreground">
                  {field}
                </p>
              ))}
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
              Some fields were skipped due to unclear format. You may update your resume or answers and try again.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-5 py-4">
        <Button
          variant="outline"
          className="h-9 w-full gap-2 border-border bg-transparent text-xs font-medium text-foreground"
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          New Session
        </Button>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          This UI is generated as a working draft. Final behavior will be reviewed and refined.
        </p>
      </div>
    </>
  )
}
