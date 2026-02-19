"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

/* ─── Types ──────────────────────────────────────────── */

interface TourStep {
  id: string
  target: string | null // data-onboarding="xxx" selector, null = center screen
  title: string
  content: string
  subcontent?: string
  arrowPosition?: "top" | "bottom" | "left" | "right"
}

interface OnboardingTourProps {
  /** The scrollable container to observe (the steps panel) */
  containerRef: React.RefObject<HTMLElement | null>
  onComplete: (dontShowAgain: boolean) => void
}

/* ─── Steps ──────────────────────────────────────────── */

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to Y.EAA",
    content: "Our goal is to help you fill applications fast with high quality.",
    subcontent:
      "Currently optimized for LinkedIn Easy Apply. We support internal credits or your own Gemini API key (expandable to others in Settings later).",
  },
  {
    id: "resume-upload",
    target: "step-1-upload",
    title: "Upload Your Resume",
    content:
      "Your Resume is our Reasoning Engine's primary source of truth. Upload it here to begin.",
    arrowPosition: "top",
  },
  {
    id: "work-auth-eeo",
    target: "step-1-preferences",
    title: "Work Authorization & EEO",
    content:
      "Pre-filling these legal details allows the AI to handle standard disclosures automatically, saving you ~30 seconds per app.",
    arrowPosition: "top",
  },
  {
    id: "job-profiles",
    target: "step-2-profiles",
    title: "Job Profiles",
    content:
      "Define your 'Ideal Role' profiles. The extension uses these to filter and prioritize which jobs to scan first.",
    arrowPosition: "top",
  },
  {
    id: "start-fill",
    target: null,
    title: "Ready to Go!",
    content:
      "When you're on LinkedIn, we scan and score positions based on your resume. You can choose to apply to 'Recommended' (High Match) or 'All positions' in one click.",
  },
]

/* ─── Floating SVG Arrow ─────────────────────────────── */

function FloatingArrow({
  position,
  style,
}: {
  position: "top" | "bottom" | "left" | "right"
  style?: React.CSSProperties
}) {
  const rotation =
    position === "top"
      ? "rotate(180deg)"
      : position === "bottom"
        ? "rotate(0deg)"
        : position === "left"
          ? "rotate(90deg)"
          : "rotate(-90deg)"

  return (
    <motion.div
      className="pointer-events-none absolute z-[10002]"
      style={style}
      animate={{ y: position === "top" || position === "bottom" ? [0, -6, 0] : 0, x: position === "left" || position === "right" ? [0, -6, 0] : 0 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        width="28"
        height="40"
        viewBox="0 0 28 40"
        fill="none"
        style={{ transform: rotation }}
      >
        <path
          d="M14 0 L14 28 M6 20 L14 28 L22 20"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  )
}

/* ─── Spotlight Cutout Overlay ────────────────────────── */

function SpotlightOverlay({
  targetRect,
  onClick,
}: {
  targetRect: DOMRect | null
  onClick: () => void
}) {
  if (!targetRect) {
    // Full-screen darkened overlay (no cutout)
    return (
      <div
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-[1px]"
        onClick={onClick}
        role="presentation"
      />
    )
  }

  const padding = 8
  const borderRadius = 12
  const x = targetRect.left - padding
  const y = targetRect.top - padding
  const w = targetRect.width + padding * 2
  const h = targetRect.height + padding * 2

  return (
    <svg
      className="fixed inset-0 z-[10000] h-full w-full"
      onClick={onClick}
      role="presentation"
    >
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={borderRadius}
            ry={borderRadius}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.60)"
        mask="url(#spotlight-mask)"
        style={{ backdropFilter: "blur(1px)" }}
      />
      {/* Highlight ring */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={borderRadius}
        ry={borderRadius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
    </svg>
  )
}

/* ─── Main Component ─────────────────────────────────── */

export function OnboardingTour({ containerRef, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [dontShowAgain, setDontShowAgain] = useState(true)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1

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
    window.addEventListener("resize", measureTarget)
    window.addEventListener("scroll", measureTarget, true)
    return () => {
      window.removeEventListener("resize", measureTarget)
      window.removeEventListener("scroll", measureTarget, true)
    }
  }, [measureTarget])

  /* ─── Navigation ───────────────────────────────────── */

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete(dontShowAgain)
    } else {
      setCurrentStep((s) => s + 1)
    }
  }, [isLast, onComplete, dontShowAgain])

  const handleBack = useCallback(() => {
    if (!isFirst) setCurrentStep((s) => s - 1)
  }, [isFirst])

  const handleSkip = useCallback(() => {
    onComplete(dontShowAgain)
  }, [onComplete, dontShowAgain])

  /* ─── Tooltip positioning ──────────────────────────── */

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      // Center screen
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }
    }

    // Position below the target by default
    const tooltipWidth = 320
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
    const top = targetRect.bottom + 20

    // Clamp horizontal position
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
    if (!targetRect || !step.arrowPosition) return undefined

    const centerX = targetRect.left + targetRect.width / 2 - 14
    const centerY = targetRect.top + targetRect.height / 2 - 20

    switch (step.arrowPosition) {
      case "top":
        return { left: `${centerX}px`, top: `${targetRect.bottom + 2}px` }
      case "bottom":
        return { left: `${centerX}px`, top: `${targetRect.top - 44}px` }
      case "left":
        return { left: `${targetRect.right + 2}px`, top: `${centerY}px` }
      case "right":
        return { left: `${targetRect.left - 34}px`, top: `${centerY}px` }
      default:
        return undefined
    }
  }

  return (
    <>
      {/* Overlay */}
      <SpotlightOverlay targetRect={targetRect} onClick={() => {}} />

      {/* Animated arrow */}
      <AnimatePresence>
        {targetRect && step.arrowPosition && (
          <FloatingArrow
            key={step.id + "-arrow"}
            position={step.arrowPosition}
            style={getArrowStyle()}
          />
        )}
      </AnimatePresence>

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={tooltipRef}
          className="z-[10001] w-[320px] rounded-2xl border border-white/10 bg-[#1a1a2e] p-5 shadow-2xl shadow-black/40"
          style={getTooltipStyle()}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Step indicator dots */}
          <div className="mb-3 flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === currentStep
                    ? "w-4 bg-white"
                    : i < currentStep
                      ? "w-1.5 bg-white/40"
                      : "w-1.5 bg-white/15"
                )}
              />
            ))}
          </div>

          {/* Content */}
          <h3 className="text-[15px] font-semibold text-white">{step.title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">
            {step.content}
          </p>
          {step.subcontent && (
            <p className="mt-2 text-[11px] leading-relaxed text-white/45">
              {step.subcontent}
            </p>
          )}

          {/* Last step: checkbox */}
          {isLast && (
            <label className="mt-4 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-white/10 accent-white"
              />
              <span className="text-[11px] text-white/50">
                {"Don't show this onboarding again"}
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              className="text-[11px] font-medium text-white/40 transition-colors duration-200 hover:text-white/70"
              onClick={handleSkip}
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  className="flex h-8 items-center rounded-lg border border-white/10 px-3 text-[12px] font-medium text-white/60 transition-all duration-200 hover:border-white/20 hover:text-white"
                  onClick={handleBack}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className="flex h-8 items-center rounded-lg bg-white px-4 text-[12px] font-semibold text-[#1a1a2e] transition-all duration-200 hover:bg-white/90"
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
