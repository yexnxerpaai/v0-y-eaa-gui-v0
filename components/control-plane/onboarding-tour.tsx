"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"

/* ─── Types ──────────────────────────────────────────── */

interface TourStep {
  id: string
  /** querySelector for the target element, or null for center-screen steps */
  target: string | null
  headline: string
  points: string[]
  /** If true, nudge validation is skipped (welcome/final screens) */
  skipValidation: boolean
}

interface OnboardingTourProps {
  /** Ref to the scrollable steps container inside the extension popup */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Called when tour completes. `dontShowAgain` = checkbox state */
  onComplete: (dontShowAgain: boolean) => void
  /** Whether the tour is visible */
  active: boolean
}

/* ─── Step Definitions ───────────────────────────────── */

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    headline: "Welcome to Y.EAA",
    points: [
      "⚠️ This is for internal testing usage only.",
      "Fast, high-quality application filling.",
      "Supports LinkedIn Easy Apply (more platforms coming).",
      "Use our credits or your Gemini Key (Settings).",
    ],
    skipValidation: true,
  },
  {
    id: "resume",
    target: '[data-onboarding="step-1-upload"]',
    headline: "Resume Core",
    points: [
      "This is the AI's primary source of truth.",
      "Upload your latest PDF or Docx here.",
    ],
    skipValidation: false,
  },
  {
    id: "legal",
    target: '[data-onboarding="step-1-preferences"]',
    headline: "Legal Automations",
    points: [
      "Pre-fill your legal disclosures.",
      "Lets the AI skip repetitive questions.",
    ],
    skipValidation: false,
  },
  {
    id: "profiles",
    target: '[data-onboarding="step-2-profiles"]',
    headline: "Define Your Target",
    points: [
      "Define your ideal role here.",
      "Used to filter and prioritize onscreen jobs.",
    ],
    skipValidation: false,
  },
  {
    id: "execute",
    target: null,
    headline: "Ready to Apply?",
    points: [
      "We scan and score LinkedIn jobs in real-time.",
      'Apply to "Recommended" (best match) or "All."',
    ],
    skipValidation: true,
  },
]

/* ─── Animated SVG Arrow ─────────────────────────────── */

/**
 * Draws a curved SVG arrow from the card's right edge to the
 * target element's left edge. The arrow uses a gradient stroke
 * and has a subtle bounce animation via framer-motion.
 */
function SvgArrow({
  fromX,
  fromY,
  toX,
  toY,
}: {
  fromX: number
  fromY: number
  toX: number
  toY: number
}) {
  const midX = (fromX + toX) / 2
  // Cubic bezier control points — gentle S-curve
  const d = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`

  // Arrowhead at the end
  const angle = Math.atan2(toY - fromY, toX - fromX)
  const headLen = 10
  const a1x = toX - headLen * Math.cos(angle - Math.PI / 6)
  const a1y = toY - headLen * Math.sin(angle - Math.PI / 6)
  const a2x = toX - headLen * Math.cos(angle + Math.PI / 6)
  const a2y = toY - headLen * Math.sin(angle + Math.PI / 6)

  const arrowId = `arrow-grad-${fromX}-${toX}`

  return (
    <motion.svg
      className="pointer-events-none fixed inset-0 z-[10001]"
      style={{ width: "100vw", height: "100vh" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: [0, -3, 0] }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.3 },
        y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <defs>
        <linearGradient id={arrowId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={`url(#${arrowId})`}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <polygon
        points={`${toX},${toY} ${a1x},${a1y} ${a2x},${a2y}`}
        fill="#3b82f6"
      />
    </motion.svg>
  )
}

/* ─── Spotlight Overlay (SVG mask with cutout) ───────── */

function SpotlightOverlay({ rect }: { rect: DOMRect | null }) {
  const padding = 8
  const radius = 12

  return (
    <motion.div
      className="fixed inset-0 z-[9999]"
      style={{ pointerEvents: "none" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <svg width="100%" height="100%" className="absolute inset-0" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="spotlight-mask">
            {/* White = visible overlay area */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black = cutout (transparent hole) */}
            {rect && (
              <rect
                x={rect.left - padding}
                y={rect.top - padding}
                width={rect.width + padding * 2}
                height={rect.height + padding * 2}
                rx={radius}
                ry={radius}
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Semi-transparent white overlay with mask */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(255, 255, 255, 0.35)"
          style={{ backdropFilter: "blur(2px)" }}
          mask="url(#spotlight-mask)"
        />
      </svg>
    </motion.div>
  )
}

/* ─── Nudge Toast ────────────────────────────────────── */

function NudgeToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-amber-200/60 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 shadow-lg shadow-amber-100/40"
        >
          Wait! We recommend completing this step for best results.
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Main Tour Component ────────────────────────────── */

export function OnboardingTour({ containerRef, onComplete, active }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [showNudge, setShowNudge] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1

  /* ─── Measure target element position ──────────────── */

  const measureTarget = useCallback(() => {
    if (!step.target) {
      setTargetRect(null)
      return
    }
    const el = document.querySelector(step.target)
    if (el) {
      setTargetRect(el.getBoundingClientRect())

      // Scroll element into view within the container
      if (containerRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" })
        // Re-measure after scroll settles
        setTimeout(() => {
          setTargetRect(el.getBoundingClientRect())
        }, 350)
      }
    }
  }, [step.target, containerRef])

  // Re-measure on step change and on scroll/resize
  useEffect(() => {
    if (!active) return
    measureTarget()

    const handleUpdate = () => measureTarget()
    window.addEventListener("resize", handleUpdate)
    window.addEventListener("scroll", handleUpdate, true)

    return () => {
      window.removeEventListener("resize", handleUpdate)
      window.removeEventListener("scroll", handleUpdate, true)
    }
  }, [active, currentStep, measureTarget])

  // Re-measure periodically to catch layout shifts
  useEffect(() => {
    if (!active || !step.target) return
    const interval = setInterval(measureTarget, 500)
    return () => clearInterval(interval)
  }, [active, step.target, measureTarget])

  /* ─── Reset nudge state on step change ─────────────── */

  useEffect(() => {
    setClickCount(0)
    setShowNudge(false)
  }, [currentStep])

  /* ─── Navigation ───────────────────────────────────── */

  const handleNext = useCallback(() => {
    // If step has validation, implement nudge logic
    if (!step.skipValidation) {
      const newCount = clickCount + 1
      setClickCount(newCount)

      if (newCount === 1) {
        // First click without action → show nudge
        setShowNudge(true)
        // Auto-hide nudge after 2.5s
        setTimeout(() => setShowNudge(false), 2500)
        return
      }
      // Second click → silent skip (hidden skip)
    }

    if (isLast) {
      onComplete(dontShowAgain)
      return
    }

    setCurrentStep((s) => Math.min(s + 1, TOUR_STEPS.length - 1))
  }, [step, clickCount, isLast, dontShowAgain, onComplete])

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }, [])

  const handleSkip = useCallback(() => {
    onComplete(false)
  }, [onComplete])

  /* ─── Card positioning: sidecar layout ─────────────── */

  const cardStyle = useMemo((): React.CSSProperties => {
    const GAP = 24 // px gap between card right edge and sidebar left edge
    const SIDEBAR_WIDTH = 400
    const CARD_WIDTH = 320

    // Sidebar is right-aligned, so its left edge is at:
    const sidebarLeft = window.innerWidth - SIDEBAR_WIDTH

    // Card sits to the left of the sidebar
    const cardLeft = sidebarLeft - GAP - CARD_WIDTH

    if (targetRect) {
      // Vertically center the card to the target element
      const targetCenterY = targetRect.top + targetRect.height / 2
      // Offset card so its center aligns with the target center
      // We'll estimate card height at ~220px (will auto-adjust via ref)
      const estimatedCardHeight = cardRef.current?.offsetHeight || 220
      const cardTop = Math.max(
        16,
        Math.min(
          targetCenterY - estimatedCardHeight / 2,
          window.innerHeight - estimatedCardHeight - 16
        )
      )

      return {
        position: "fixed",
        left: Math.max(16, cardLeft),
        top: cardTop,
        width: CARD_WIDTH,
        zIndex: 10002,
      }
    }

    // Center-screen for steps without a target
    return {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: CARD_WIDTH,
      zIndex: 10002,
    }
  }, [targetRect])

  /* ─── Arrow coordinates ────────────────────────────── */

  const arrowCoords = useMemo(() => {
    if (!targetRect || !cardRef.current) return null

    const cardRect = cardRef.current.getBoundingClientRect()
    // Arrow: from card right edge center → target left edge center
    return {
      fromX: cardRect.right + 4,
      fromY: cardRect.top + cardRect.height / 2,
      toX: targetRect.left - 4,
      toY: targetRect.top + targetRect.height / 2,
    }
  }, [targetRect])

  /* ─── Don't render if inactive ─────────────────────── */

  if (!active) return null

  /* ─── Render via portal ────────────────────────────── */

  return createPortal(
    <>
      {/* Overlay with spotlight cutout */}
      <SpotlightOverlay rect={targetRect} />

      {/* SVG Arrow */}
      <AnimatePresence>
        {arrowCoords && (
          <SvgArrow
            fromX={arrowCoords.fromX}
            fromY={arrowCoords.fromY}
            toX={arrowCoords.toX}
            toY={arrowCoords.toY}
          />
        )}
      </AnimatePresence>

      {/* Card — stopPropagation prevents React synthetic events from
          bubbling through the portal to the Sheet's backdrop handler */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={cardRef}
          style={cardStyle}
          initial={{ opacity: 0, x: -20, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="rounded-2xl border border-white/50 bg-white/80 p-6 shadow-2xl shadow-black/[0.08] backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Step counter */}
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500/70">
            Step {currentStep + 1} of {TOUR_STEPS.length}
          </p>

          {/* Headline */}
          <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900">
            {step.headline}
          </h2>

          {/* Points */}
          <ul className="mt-4 space-y-2.5">
            {step.points.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[15px] leading-relaxed text-gray-700"
              >
                <span className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                {point}
              </li>
            ))}
          </ul>

          {/* Don't show again — only on final step */}
          {isLast && (
            <label className="mt-5 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
              />
              <span className="text-sm font-medium text-gray-600">
                Don&apos;t show this guide again
              </span>
            </label>
          )}

          {/* Progress dots */}
          <div className="mt-5 flex justify-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-5 bg-indigo-500"
                    : i < currentStep
                      ? "w-1.5 bg-indigo-300"
                      : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="relative mt-5 flex items-center justify-between">
            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              disabled={isFirst}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                isFirst
                  ? "cursor-not-allowed text-gray-300"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              Back
            </button>

            {/* Nudge toast — anchored near the Next button */}
            <NudgeToast visible={showNudge} />

            {/* Next / Finish */}
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200/50 transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200/60"
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>

          {/* Skip — subtle, bottom of card */}
          {!isLast && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
              >
                Skip tour
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>,
    document.body
  )
}
