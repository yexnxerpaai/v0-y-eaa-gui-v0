"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

/* ─── Types ──────────────────────────────────────────── */

interface TourStep {
  id: string
  target: string | null       // data-onboarding="xxx", null = centered welcome/finish
  headline: string
  body: string
  actionHint?: string         // brief CTA shown under body
}

interface OnboardingTourProps {
  containerRef: React.RefObject<HTMLElement | null>
  onComplete: (dontShowAgain: boolean) => void
}

/* ─── Step Definitions ───────────────────────────────── */

const SIDEBAR_WIDTH = 400
const CARD_WIDTH = 320
const GAP = 40

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    headline: "Welcome to Y.EAA",
    body: "High-quality, fast applications. We support LinkedIn Easy Apply with Gemini or internal credits.",
  },
  {
    id: "resume",
    target: "step-1-upload",
    headline: "Upload Your Resume",
    body: "Your resume is the AI\u2019s primary source of truth. Upload your latest PDF or paste text.",
    actionHint: "Try uploading now \u2014 the panel is interactive.",
  },
  {
    id: "legal",
    target: "step-1-preferences",
    headline: "EEO & Work Auth",
    body: "Pre-fill your legal disclosures so the AI can skip repetitive questions automatically.",
    actionHint: "Fill in your details while this guide is open.",
  },
  {
    id: "role",
    target: "step-2-profiles",
    headline: "Define Your Target Role",
    body: "Your job profile directs the scanner on what to prioritize when scoring jobs.",
    actionHint: "Select or edit a profile now.",
  },
  {
    id: "execute",
    target: null,
    headline: "Scan & Apply",
    body: "We score LinkedIn jobs in real-time. Choose \u201CRecommended\u201D for high-match jobs, or apply to all.",
  },
]

/* ─── Dynamic SVG Bridge ─────────────────────────────── */

function SvgBridge({
  cardRight,
  cardCenterY,
  targetLeft,
  targetCenterY,
}: {
  cardRight: number
  cardCenterY: number
  targetLeft: number
  targetCenterY: number
}) {
  const startX = cardRight + 4
  const startY = cardCenterY
  const endX = targetLeft - 4
  const endY = targetCenterY

  const midX = startX + (endX - startX) * 0.5
  const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`

  // Arrow head at end
  const angle = Math.atan2(endY - startY, endX - midX)
  const arrowLen = 8
  const a1x = endX - arrowLen * Math.cos(angle - 0.4)
  const a1y = endY - arrowLen * Math.sin(angle - 0.4)
  const a2x = endX - arrowLen * Math.cos(angle + 0.4)
  const a2y = endY - arrowLen * Math.sin(angle + 0.4)

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[10001] h-full w-full"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="bridge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <motion.path
        d={d}
        fill="none"
        stroke="url(#bridge-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      <motion.path
        d={`M ${a1x} ${a1y} L ${endX} ${endY} L ${a2x} ${a2y}`}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ delay: 0.3, duration: 0.2 }}
      />
    </svg>
  )
}

/* ─── Interactive Spotlight Overlay ───────────────────── */

function SpotlightOverlay({ targetRect }: { targetRect: DOMRect | null }) {
  const pad = 10
  const radius = 14

  if (!targetRect) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black/8 backdrop-blur-[2px]"
        style={{ pointerEvents: "none" }}
        role="presentation"
      />
    )
  }

  const x = targetRect.left - pad
  const y = targetRect.top - pad
  const w = targetRect.width + pad * 2
  const h = targetRect.height + pad * 2

  return (
    <>
      <svg
        className="fixed inset-0 z-[9999] h-full w-full"
        style={{ pointerEvents: "none" }}
        role="presentation"
      >
        <defs>
          <mask id="sidecar-spotlight">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx={radius} ry={radius} fill="black" />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.06)"
          mask="url(#sidecar-spotlight)"
          style={{ backdropFilter: "blur(2px)" }}
        />
      </svg>

      {/* Highlight ring around target */}
      <div
        className="pointer-events-none fixed z-[10000] rounded-[14px] ring-2 ring-[#3b82f6]/25 transition-all duration-300"
        style={{ left: x, top: y, width: w, height: h }}
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
          className="absolute -top-12 left-0 right-0 z-[10003] text-center"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
        >
          <span className="inline-block rounded-lg border border-amber-200/60 bg-amber-50/95 px-3 py-1.5 text-[12px] font-medium text-amber-700 shadow-sm backdrop-blur-sm">
            Try completing this step first for the best experience.
          </span>
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
  const [nudgeCount, setNudgeCount] = useState(0)
  const [showNudge, setShowNudge] = useState(false)
  const [actionPerformed, setActionPerformed] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  // For dragging: track card position to re-draw SVG bridge
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const [cardOffset, setCardOffset] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1

  useEffect(() => setMounted(true), [])

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

  /* ─── Reset nudge/drag on step change ──────────────── */

  useEffect(() => {
    setNudgeCount(0)
    setShowNudge(false)
    setCardOffset({ x: 0, y: 0 })
    dragX.set(0)
    dragY.set(0)
  }, [currentStep, dragX, dragY])

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

  /* ─── Navigation with soft-lock nudge ──────────────── */

  const handleNext = useCallback(() => {
    if (step.target && !actionPerformed[step.id]) {
      const count = nudgeCount + 1
      setNudgeCount(count)

      if (count === 1) {
        setShowNudge(true)
        setTimeout(() => setShowNudge(false), 3000)
        return
      }
      // Second click = hidden skip, fall through
    }

    if (isLast) {
      onComplete(dontShowAgain)
    } else {
      setCurrentStep((s) => s + 1)
    }
  }, [step, isLast, onComplete, dontShowAgain, actionPerformed, nudgeCount])

  const handleBack = useCallback(() => {
    if (!isFirst) setCurrentStep((s) => s - 1)
  }, [isFirst])

  const handleSkip = useCallback(() => {
    onComplete(dontShowAgain)
  }, [onComplete, dontShowAgain])

  /* ─── Card position calculation (sidecar) ──────────── */

  const getCardStyle = (): React.CSSProperties => {
    const sidebarLeft = window.innerWidth - SIDEBAR_WIDTH

    if (!targetRect) {
      // Welcome / Execute: center in the viewport area left of sidebar
      return {
        position: "fixed",
        top: "50%",
        left: `${(sidebarLeft - CARD_WIDTH) / 2}px`,
        width: `${CARD_WIDTH}px`,
        transform: "translateY(-50%)",
      }
    }

    // Sidecar: vertically centered to target, 40px gap to sidebar left edge
    const cardLeft = sidebarLeft - CARD_WIDTH - GAP
    const targetCenterY = targetRect.top + targetRect.height / 2
    const cardTop = targetCenterY // will be shifted by transform: -50%

    return {
      position: "fixed",
      top: `${cardTop}px`,
      left: `${Math.max(12, cardLeft)}px`,
      width: `${CARD_WIDTH}px`,
      transform: "translateY(-50%)",
    }
  }

  /* ─── SVG bridge coordinates ───────────────────────── */

  const getBridgeProps = () => {
    if (!targetRect || !cardRef.current) return null

    const cardRect = cardRef.current.getBoundingClientRect()
    return {
      cardRight: cardRect.right + cardOffset.x,
      cardCenterY: cardRect.top + cardRect.height / 2 + cardOffset.y,
      targetLeft: targetRect.left,
      targetCenterY: targetRect.top + targetRect.height / 2,
    }
  }

  const bridgeProps = getBridgeProps()

  if (!mounted) return null

  const content = (
    <>
      {/* Overlay */}
      <SpotlightOverlay targetRect={targetRect} />

      {/* SVG Bridge */}
      <AnimatePresence>
        {bridgeProps && targetRect && (
          <SvgBridge
            key={step.id + "-bridge-" + cardOffset.x + cardOffset.y}
            {...bridgeProps}
          />
        )}
      </AnimatePresence>

      {/* Draggable sidecar card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={cardRef}
          className="z-[10002] cursor-grab rounded-2xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-black/[0.08] backdrop-blur-xl active:cursor-grabbing"
          style={{
            ...getCardStyle(),
            x: dragX,
            y: dragY,
          }}
          drag
          dragMomentum={false}
          dragElastic={0}
          onDrag={() => {
            setCardOffset({ x: dragX.get(), y: dragY.get() })
          }}
          initial={{ opacity: 0, scale: 0.95, x: -16 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: -16 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Drag handle hint */}
          <div className="mb-3 flex justify-center">
            <div className="h-1 w-8 rounded-full bg-[#cbd5e1]/50" />
          </div>

          {/* Progress dots */}
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
            <span className="ml-auto text-[11px] font-medium tabular-nums text-[#94a3b8]">
              {currentStep + 1}/{TOUR_STEPS.length}
            </span>
          </div>

          {/* Content */}
          <h3 className="text-[20px] font-bold leading-tight tracking-tight text-[#0f172a]">
            {step.headline}
          </h3>
          <p className="mt-2.5 text-[15px] leading-relaxed text-[#475569]">
            {step.body}
          </p>
          {step.actionHint && (
            <p className="mt-2 text-[13px] font-medium text-[#3b82f6]">
              {step.actionHint}
            </p>
          )}

          {/* Last step: don't-show-again checkbox */}
          {isLast && (
            <div className="mt-5 border-t border-[#e2e8f0]/50 pt-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-4 w-4 rounded border-[#cbd5e1] bg-white accent-[#3b82f6]"
                />
                <span className="text-[13px] text-[#64748b]">
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
              className="text-[12px] font-medium text-[#94a3b8] transition-colors duration-200 hover:text-[#64748b]"
              onClick={handleSkip}
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  className="flex h-9 items-center rounded-lg border border-[#e2e8f0] bg-white px-4 text-[13px] font-medium text-[#475569] transition-all duration-200 hover:border-[#cbd5e1] hover:text-[#0f172a]"
                  onClick={handleBack}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                className="flex h-9 items-center rounded-lg bg-[#0f172a] px-5 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[#1e293b]"
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

  return createPortal(content, document.body)
}
