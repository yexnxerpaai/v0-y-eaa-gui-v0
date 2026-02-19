"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

/* ─── Types ──────────────────────────────────────────── */

interface TourStep {
  id: string
  target: string | null // data-onboarding="xxx" selector, null = center screen
  headline: string
  points: string[]
  footer?: string
  arrowSide?: "top" | "bottom" | "left" | "right"
}

interface OnboardingTourProps {
  containerRef: React.RefObject<HTMLElement | null>
  onComplete: (dontShowAgain: boolean) => void
}

/* ─── Steps ──────────────────────────────────────────── */

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    headline: "Welcome to Y.EAA",
    points: [
      "Fast, high-quality application filling.",
      "Support: LinkedIn Easy Apply (More platforms coming).",
      "LLM: Use our credits or your Gemini Key (Settings).",
    ],
  },
  {
    id: "resume-core",
    target: "step-1-upload",
    headline: "Resume Core",
    points: [
      "Our AI\u2019s primary \u201CSource of Truth.\u201D",
      "Upload your latest PDF/Docx here.",
    ],
    arrowSide: "top",
  },
  {
    id: "legal-automations",
    target: "step-1-preferences",
    headline: "Legal Automations",
    points: [
      "Pre-fill your legal disclosures.",
      "Allows the AI to bypass repetitive questions.",
    ],
    arrowSide: "top",
  },
  {
    id: "define-target",
    target: "step-2-profiles",
    headline: "Define Your Target",
    points: [
      "Define your \u201CIdeal Role.\u201D",
      "Used to filter and prioritize onscreen jobs.",
    ],
    arrowSide: "top",
  },
  {
    id: "execute",
    target: null,
    headline: "Ready to Apply?",
    points: [
      "We scan and score LinkedIn jobs in real-time.",
      "Apply to \u201CRecommended\u201D (Best Match) or \u201CAll.\u201D",
    ],
  },
]

/* ─── Gradient SVG Arrow ─────────────────────────────── */

function GradientArrow({
  side,
  style,
}: {
  side: "top" | "bottom" | "left" | "right"
  style?: React.CSSProperties
}) {
  const rotation =
    side === "top"
      ? "rotate(180deg)"
      : side === "bottom"
        ? "rotate(0deg)"
        : side === "left"
          ? "rotate(90deg)"
          : "rotate(-90deg)"

  return (
    <motion.div
      className="pointer-events-none absolute z-[10002]"
      style={style}
      animate={{
        y: side === "top" || side === "bottom" ? [0, -5, 0] : 0,
        x: side === "left" || side === "right" ? [0, -5, 0] : 0,
      }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        width="32"
        height="44"
        viewBox="0 0 32 44"
        fill="none"
        style={{ transform: rotation }}
      >
        <defs>
          <linearGradient id="arrow-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <path
          d="M16 2 L16 30 M8 22 L16 30 L24 22"
          stroke="url(#arrow-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  )
}

/* ─── Interactive Spotlight Overlay (pointer-events: auto on cutout) ── */

function SpotlightOverlay({
  targetRect,
  onOverlayClick,
}: {
  targetRect: DOMRect | null
  onOverlayClick: () => void
}) {
  if (!targetRect) {
    return (
      <div
        className="fixed inset-0 z-[10000] bg-white/30 backdrop-blur-sm"
        onClick={onOverlayClick}
        role="presentation"
      />
    )
  }

  const pad = 10
  const radius = 14
  const x = targetRect.left - pad
  const y = targetRect.top - pad
  const w = targetRect.width + pad * 2
  const h = targetRect.height + pad * 2

  return (
    <>
      {/* Semi-transparent overlay with cutout */}
      <svg
        className="fixed inset-0 z-[10000] h-full w-full"
        style={{ pointerEvents: "none" }}
        role="presentation"
      >
        <defs>
          <mask id="spotlight-mask-live">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx={radius} ry={radius} fill="black" />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(255,255,255,0.30)"
          mask="url(#spotlight-mask-live)"
          style={{ pointerEvents: "auto", backdropFilter: "blur(2px)" }}
          onClick={onOverlayClick}
        />
      </svg>

      {/* Interactive cutout ring -- pointer-events: auto so user can interact */}
      <div
        className="fixed z-[10000] rounded-[14px] ring-2 ring-[#3b82f6]/30"
        style={{
          left: x,
          top: y,
          width: w,
          height: h,
          pointerEvents: "none",
        }}
      />
    </>
  )
}

/* ─── Nudge Toast ────────────────────────────────────── */

function NudgeToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute -top-10 right-0 z-[10003] whitespace-nowrap rounded-lg border border-amber-200/60 bg-amber-50/90 px-3 py-1.5 text-[12px] font-medium text-amber-700 shadow-sm backdrop-blur-sm"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
        >
          Wait! We recommend completing this step for the best results.
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Main Component ─────────────────────────────────── */

export function OnboardingTour({ containerRef, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [dontShowAgain, setDontShowAgain] = useState(true)
  const [nextClickCount, setNextClickCount] = useState(0)
  const [showNudge, setShowNudge] = useState(false)
  const [actionPerformed, setActionPerformed] = useState<Record<string, boolean>>({})
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1

  /* ─── Track interaction on target elements ─────────── */

  useEffect(() => {
    if (!step.target) return

    const el = document.querySelector(`[data-onboarding="${step.target}"]`)
    if (!el) return

    const handler = () => {
      setActionPerformed((prev) => ({ ...prev, [step.id]: true }))
    }

    el.addEventListener("click", handler, true)
    el.addEventListener("input", handler, true)
    return () => {
      el.removeEventListener("click", handler, true)
      el.removeEventListener("input", handler, true)
    }
  }, [step.target, step.id])

  /* ─── Reset nudge/click count on step change ───────── */

  useEffect(() => {
    setNextClickCount(0)
    setShowNudge(false)
  }, [currentStep])

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
    const id = setInterval(measureTarget, 300)
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
      // Re-measure after scroll
      setTimeout(measureTarget, 400)
    }
  }, [step.target, containerRef, measureTarget])

  /* ─── Navigation with nudge logic ──────────────────── */

  const handleNext = useCallback(() => {
    // For steps with targets: validate interaction
    if (step.target && !actionPerformed[step.id]) {
      const count = nextClickCount + 1
      setNextClickCount(count)

      if (count === 1) {
        // First click without action: show nudge
        setShowNudge(true)
        setTimeout(() => setShowNudge(false), 3000)
        return
      }
      // Second click: allow hidden skip (fall through)
    }

    if (isLast) {
      onComplete(dontShowAgain)
    } else {
      setCurrentStep((s) => s + 1)
    }
  }, [step, isLast, onComplete, dontShowAgain, actionPerformed, nextClickCount])

  const handleBack = useCallback(() => {
    if (!isFirst) setCurrentStep((s) => s - 1)
  }, [isFirst])

  const handleSkip = useCallback(() => {
    onComplete(dontShowAgain)
  }, [onComplete, dontShowAgain])

  /* ─── Tooltip positioning ──────────────────────────── */

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }
    }

    const tooltipWidth = 340
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
    const top = targetRect.bottom + 24

    if (left < 12) left = 12
    if (left + tooltipWidth > window.innerWidth - 12) {
      left = window.innerWidth - 12 - tooltipWidth
    }

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    }
  }

  /* ─── Arrow positioning ────────────────────────────── */

  const getArrowStyle = (): React.CSSProperties | undefined => {
    if (!targetRect || !step.arrowSide) return undefined

    const cx = targetRect.left + targetRect.width / 2 - 16
    const cy = targetRect.top + targetRect.height / 2 - 22

    switch (step.arrowSide) {
      case "top":
        return { left: `${cx}px`, top: `${targetRect.bottom + 2}px` }
      case "bottom":
        return { left: `${cx}px`, top: `${targetRect.top - 48}px` }
      case "left":
        return { left: `${targetRect.right + 2}px`, top: `${cy}px` }
      case "right":
        return { left: `${targetRect.left - 38}px`, top: `${cy}px` }
      default:
        return undefined
    }
  }

  return (
    <>
      {/* Overlay */}
      <SpotlightOverlay targetRect={targetRect} onOverlayClick={() => {}} />

      {/* Animated gradient arrow */}
      <AnimatePresence>
        {targetRect && step.arrowSide && (
          <GradientArrow
            key={step.id + "-arrow"}
            side={step.arrowSide}
            style={getArrowStyle()}
          />
        )}
      </AnimatePresence>

      {/* Tooltip card -- glassmorphism light theme */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={tooltipRef}
          className="z-[10001] w-[340px] rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-black/[0.08] backdrop-blur-xl"
          style={getTooltipStyle()}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Step indicator dots */}
          <div className="mb-4 flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentStep
                    ? "w-5 bg-[#3b82f6]"
                    : i < currentStep
                      ? "w-2 bg-[#3b82f6]/30"
                      : "w-2 bg-[#94a3b8]/20"
                )}
              />
            ))}
            <span className="ml-auto text-[11px] font-medium text-[#64748b]">
              {currentStep + 1}/{TOUR_STEPS.length}
            </span>
          </div>

          {/* Content */}
          <h3 className="text-[20px] font-bold tracking-tight text-[#0f172a]">
            {step.headline}
          </h3>

          <ul className="mt-3 space-y-2">
            {step.points.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#3b82f6]/60" />
                <span className="text-[16px] leading-relaxed text-[#334155]">
                  {point}
                </span>
              </li>
            ))}
          </ul>

          {/* Last step: checkbox + footer */}
          {isLast && (
            <div className="mt-5 border-t border-[#e2e8f0]/60 pt-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-[#cbd5e1] bg-white accent-[#3b82f6]"
                />
                <span className="text-[14px] text-[#64748b]">
                  {"Don\u2019t show this guide again"}
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="relative mt-5 flex items-center justify-between">
            <NudgeToast visible={showNudge} />

            <button
              type="button"
              className="text-[13px] font-medium text-[#94a3b8] transition-colors duration-200 hover:text-[#64748b]"
              onClick={handleSkip}
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  className="flex h-9 items-center rounded-lg border border-[#e2e8f0] bg-white px-4 text-[14px] font-medium text-[#475569] transition-all duration-200 hover:border-[#cbd5e1] hover:text-[#0f172a]"
                  onClick={handleBack}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className="flex h-9 items-center rounded-lg bg-[#0f172a] px-5 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-[#1e293b]"
                onClick={handleNext}
              >
                {isLast ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
