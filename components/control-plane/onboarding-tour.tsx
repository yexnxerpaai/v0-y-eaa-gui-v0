"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ArrowRight, MousePointerClick } from "lucide-react"

/* ─── Constants ──────────────────────────────────────── */

const SIDEBAR_WIDTH = 400
const CARD_WIDTH = 300
const GAP = 24 // gap between card and sidebar edge

/* ─── Types ──────────────────────────────────────────── */

interface TourStep {
  id: string
  target: string | null          // data-onboarding="xxx", null = no target (center card)
  actionTarget?: string | null   // data-onboarding="xxx" for the clickable element user should interact with
  headline: string
  body: string
  cta: string                    // label on the indicator arrow, e.g. "Upload your resume"
  advanceOn: "action" | "dismiss" // "action" = wait for user click in target; "dismiss" = show a Got It button
}

/* ─── Steps ──────────────────────────────────────────── */

const STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    actionTarget: null,
    headline: "Welcome to Y.EAA",
    body: "Fast, high-quality application filling.\nSupports LinkedIn Easy Apply. More platforms coming.\nUse our credits or bring your Gemini key.",
    cta: "",
    advanceOn: "dismiss",
  },
  {
    id: "resume",
    target: "step-1-upload",
    actionTarget: "step-1-upload",
    headline: "Upload Your Resume",
    body: "This is the AI\u2019s primary source of truth.\nUpload your latest PDF or paste text.",
    cta: "Click to upload your resume",
    advanceOn: "action",
  },
  {
    id: "preferences",
    target: "step-1-preferences",
    actionTarget: "step-1-preferences",
    headline: "Set Your Preferences",
    body: "Pre-fill work authorization & EEO disclosures.\nLets the AI skip repetitive legal questions.",
    cta: "Review and set your preferences",
    advanceOn: "action",
  },
  {
    id: "profiles",
    target: "step-2-profiles",
    actionTarget: "step-2-profiles",
    headline: "Define Your Target Role",
    body: "Select or configure your ideal role.\nUsed to filter and prioritize jobs on screen.",
    cta: "Select a job profile",
    advanceOn: "action",
  },
  {
    id: "ready",
    target: null,
    actionTarget: null,
    headline: "You\u2019re Ready!",
    body: "We scan and score LinkedIn jobs in real-time.\nApply to Recommended (best match) or All.",
    cta: "",
    advanceOn: "dismiss",
  },
]

/* ─── Pulsing Pointer Indicator ──────────────────────── */

function ActionPointer({
  label,
  targetRect,
  sidebarLeft,
}: {
  label: string
  targetRect: DOMRect
  sidebarLeft: number
}) {
  // Position the pointer at the vertical center of the target, just inside the sidebar
  const top = targetRect.top + targetRect.height / 2
  const left = sidebarLeft + 20

  return (
    <motion.div
      className="pointer-events-none fixed z-[10003] flex items-center gap-2"
      style={{ top, left, transform: "translateY(-50%)" }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
    >
      <motion.div
        className="flex items-center gap-2 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6] px-3 py-1.5 shadow-lg shadow-[#3b82f6]/20"
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <MousePointerClick className="h-3.5 w-3.5 text-white" strokeWidth={2} />
        <span className="whitespace-nowrap text-[11px] font-semibold text-white">{label}</span>
        <ArrowRight className="h-3 w-3 text-white/80" strokeWidth={2} />
      </motion.div>
    </motion.div>
  )
}

/* ─── Main Component ─────────────────────────────────── */

export interface OnboardingTourProps {
  containerRef: React.RefObject<HTMLElement | null>
  onComplete: (dontShowAgain: boolean) => void
  onStepAction?: (stepId: string) => void
}

export function OnboardingTour({ containerRef, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [sidebarLeft, setSidebarLeft] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(true)
  const [mounted, setMounted] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1
  const totalSteps = STEPS.length

  /* ─── Mount guard for portal ───────────────────────── */

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  /* ─── Measure sidebar position ─────────────────────── */

  useEffect(() => {
    const measure = () => {
      const sheetEl = document.querySelector("[data-sheet-content]") as HTMLElement
      if (sheetEl) {
        const rect = sheetEl.getBoundingClientRect()
        setSidebarLeft(rect.left)
      } else {
        setSidebarLeft(window.innerWidth - SIDEBAR_WIDTH)
      }
    }
    measure()
    const id = setInterval(measure, 200)
    window.addEventListener("resize", measure)
    return () => {
      clearInterval(id)
      window.removeEventListener("resize", measure)
    }
  }, [])

  /* ─── Measure target element ───────────────────────── */

  const measureTarget = useCallback(() => {
    if (!step.target) {
      setTargetRect(null)
      return
    }
    const el = document.querySelector(`[data-onboarding="${step.target}"]`)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    } else {
      setTargetRect(null)
    }
  }, [step.target])

  useEffect(() => {
    measureTarget()
    const id = setInterval(measureTarget, 250)
    window.addEventListener("resize", measureTarget)
    window.addEventListener("scroll", measureTarget, true)
    return () => {
      clearInterval(id)
      window.removeEventListener("resize", measureTarget)
      window.removeEventListener("scroll", measureTarget, true)
    }
  }, [measureTarget])

  /* ─── Scroll target into view ──────────────────────── */

  useEffect(() => {
    if (!step.target) return
    const el = document.querySelector(`[data-onboarding="${step.target}"]`)
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      setTimeout(measureTarget, 400)
    }
  }, [step.target, containerRef, measureTarget])

  /* ─── Listen for user actions on target (auto-advance) */

  useEffect(() => {
    if (step.advanceOn !== "action" || !step.actionTarget) return

    const el = document.querySelector(`[data-onboarding="${step.actionTarget}"]`)
    if (!el) return

    const handler = () => {
      console.log("[v0] Tour: action detected on", step.actionTarget, "advancing from step", currentStep)
      // Small delay so the user sees their action take effect first
      setTimeout(() => {
        if (isLast) {
          onComplete(dontShowAgain)
        } else {
          setCurrentStep((s) => s + 1)
        }
      }, 400)
    }

    el.addEventListener("click", handler, { capture: true, once: true })
    return () => {
      el.removeEventListener("click", handler, { capture: true })
    }
  }, [step.advanceOn, step.actionTarget, currentStep, isLast, onComplete, dontShowAgain])

  /* ─── Card position: to the LEFT of the sidebar ────── */

  const getCardPosition = (): React.CSSProperties => {
    const cardLeft = sidebarLeft - CARD_WIDTH - GAP

    if (!targetRect) {
      // Center vertically on screen
      return {
        position: "fixed",
        left: Math.max(12, cardLeft),
        top: "50%",
        transform: "translateY(-50%)",
        width: CARD_WIDTH,
      }
    }

    // Vertically center to the target element
    const targetCenterY = targetRect.top + targetRect.height / 2
    let cardTop = targetCenterY - 100 // approximate half card height

    // Clamp to viewport
    if (cardTop < 20) cardTop = 20
    if (cardTop > window.innerHeight - 300) cardTop = window.innerHeight - 300

    return {
      position: "fixed",
      left: Math.max(12, cardLeft),
      top: cardTop,
      width: CARD_WIDTH,
    }
  }

  /* ─── Handlers ─────────────────────────────────────── */

  const handleDismiss = useCallback(() => {
    if (isLast) {
      onComplete(dontShowAgain)
    } else {
      setCurrentStep((s) => s + 1)
    }
  }, [isLast, onComplete, dontShowAgain])

  const handleSkip = useCallback(() => {
    onComplete(dontShowAgain)
  }, [onComplete, dontShowAgain])

  /* ─── Render ───────────────────────────────────────── */

  if (!mounted) return null

  const content = (
    <>
      {/* Light scrim -- does NOT block pointer events on the sidebar */}
      <div
        className="fixed inset-0 z-[10000]"
        style={{ pointerEvents: "none" }}
      >
        {/* Only cover the area LEFT of the sidebar with a subtle scrim */}
        <div
          className="absolute inset-y-0 left-0 bg-black/[0.03]"
          style={{ width: sidebarLeft, pointerEvents: "none" }}
        />
      </div>

      {/* Highlight ring around target -- no pointer blocking */}
      <AnimatePresence>
        {targetRect && (
          <motion.div
            key={step.id + "-ring"}
            className="pointer-events-none fixed z-[10001] rounded-xl ring-2 ring-[#3b82f6]/25"
            style={{
              left: targetRect.left - 6,
              top: targetRect.top - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
          >
            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0 rounded-xl ring-2 ring-[#3b82f6]/10"
              animate={{ scale: [1, 1.03, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action pointer indicator inside the sidebar */}
      <AnimatePresence>
        {targetRect && step.advanceOn === "action" && step.cta && (
          <ActionPointer
            key={step.id + "-pointer"}
            label={step.cta}
            targetRect={targetRect}
            sidebarLeft={sidebarLeft}
          />
        )}
      </AnimatePresence>

      {/* Sidecar card to the LEFT of the sidebar */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={cardRef}
          className="fixed z-[10002] rounded-2xl border border-white/70 bg-white/90 shadow-2xl shadow-black/[0.08] backdrop-blur-xl"
          style={getCardPosition()}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="p-5">
            {/* Step indicator */}
            <div className="mb-3 flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === currentStep
                      ? "w-5 bg-[#3b82f6]"
                      : i < currentStep
                        ? "w-2 bg-[#3b82f6]/25"
                        : "w-2 bg-[#94a3b8]/15"
                  )}
                />
              ))}
              <span className="ml-auto text-[10px] font-medium tabular-nums text-[#94a3b8]">
                {currentStep + 1}/{totalSteps}
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-[17px] font-bold tracking-tight text-[#0f172a]">
              {step.headline}
            </h3>

            {/* Body -- supports line breaks */}
            <div className="mt-2.5 space-y-1.5">
              {step.body.split("\n").map((line, i) => (
                <p key={i} className="text-[13px] leading-relaxed text-[#475569]">
                  {line}
                </p>
              ))}
            </div>

            {/* For action steps: hint text */}
            {step.advanceOn === "action" && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#3b82f6]/10 bg-[#f0f7ff] px-3 py-2">
                <MousePointerClick className="h-3.5 w-3.5 shrink-0 text-[#3b82f6]" strokeWidth={1.5} />
                <span className="text-[12px] font-medium text-[#3b82f6]">
                  {step.cta}
                </span>
              </div>
            )}

            {/* For dismiss steps: Got It button */}
            {step.advanceOn === "dismiss" && (
              <button
                type="button"
                className="mt-4 flex h-9 w-full items-center justify-center rounded-lg bg-[#0f172a] text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[#1e293b]"
                onClick={handleDismiss}
              >
                {isLast ? "Start Applying" : "Got it"}
              </button>
            )}

            {/* Last step: checkbox */}
            {isLast && (
              <label className="mt-3 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#cbd5e1] accent-[#3b82f6]"
                />
                <span className="text-[11px] text-[#94a3b8]">
                  {"Don\u2019t show this guide again"}
                </span>
              </label>
            )}

            {/* Skip link */}
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                className="text-[11px] font-medium text-[#cbd5e1] transition-colors duration-200 hover:text-[#94a3b8]"
                onClick={handleSkip}
              >
                Skip tour
              </button>
            </div>
          </div>

          {/* Connecting line from card to sidebar */}
          {targetRect && (
            <div
              className="pointer-events-none absolute"
              style={{
                top: "50%",
                left: "100%",
                width: GAP,
                height: 2,
                transform: "translateY(-50%)",
              }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-[#3b82f6]/30 to-[#3b82f6]/10"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{ transformOrigin: "left" }}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )

  return createPortal(content, document.body)
}
