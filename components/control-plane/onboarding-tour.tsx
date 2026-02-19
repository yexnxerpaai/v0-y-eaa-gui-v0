"use client"

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

/* ─── Types ──────────────────────────────────────────── */

interface TourStep {
  id: string
  target: string | null       // data-onboarding="xxx", null = centered welcome/finish
  headline: string
  body: string
  actionHint?: string
}

interface OnboardingTourProps {
  containerRef: React.RefObject<HTMLElement | null>
  onComplete: (dontShowAgain: boolean) => void
}

/* ─── Step Definitions ───────────────────────────────── */

const CARD_WIDTH = 300
const GAP = 32

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

/* ─── Highlight Ring ─────────────────────────────────── */

function HighlightRing({ rect }: { rect: DOMRect }) {
  const pad = 8
  return (
    <div
      className="pointer-events-none fixed z-[10000] rounded-xl ring-2 ring-[#3b82f6]/30 transition-all duration-300"
      style={{
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }}
    />
  )
}

/* ─── Dynamic SVG Bridge ─────────────────────────────── */

function SvgBridge({
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
  const midX = fromX + (toX - fromX) * 0.45
  const d = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`

  const angle = Math.atan2(toY - fromY, toX - midX)
  const aLen = 7
  const a1x = toX - aLen * Math.cos(angle - 0.35)
  const a1y = toY - aLen * Math.sin(angle - 0.35)
  const a2x = toX - aLen * Math.cos(angle + 0.35)
  const a2y = toY - aLen * Math.sin(angle + 0.35)

  return (
    <svg className="pointer-events-none fixed inset-0 z-[10001] h-screen w-screen overflow-visible">
      <motion.path
        d={d}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      <motion.polygon
        points={`${a1x},${a1y} ${toX},${toY} ${a2x},${a2y}`}
        fill="#3b82f6"
        fillOpacity="0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.15 }}
      />
    </svg>
  )
}

/* ─── Nudge Toast ────────────────────────────────────── */

function NudgeToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute -top-11 left-0 right-0 z-[10003] text-center"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
        >
          <span className="inline-block rounded-lg border border-amber-200/50 bg-amber-50/90 px-3 py-1.5 text-[11px] font-medium text-amber-700 shadow-sm backdrop-blur-sm">
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
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null)

  // For drag
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const step = TOUR_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOUR_STEPS.length - 1
  const hasTarget = step.target !== null

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

  /* ─── Reset state on step change ───────────────────── */

  useEffect(() => {
    setNudgeCount(0)
    setShowNudge(false)
    setDragOffset({ x: 0, y: 0 })
  }, [currentStep])

  /* ─── Scroll target into view, then measure ────────── */

  useEffect(() => {
    if (!step.target) {
      setTargetRect(null)
      return
    }

    const el = document.querySelector(`[data-onboarding="${step.target}"]`)
    if (!el) {
      setTargetRect(null)
      return
    }

    // Scroll into view inside the overflow container
    if (containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }

    // Delay measure to let scroll finish
    const timer = setTimeout(() => {
      setTargetRect(el.getBoundingClientRect())
    }, 400)

    return () => clearTimeout(timer)
  }, [step.target, containerRef])

  /* ─── Continuously re-measure target ───────────────── */

  useEffect(() => {
    if (!step.target) return

    const measure = () => {
      const el = document.querySelector(`[data-onboarding="${step.target}"]`)
      if (el) setTargetRect(el.getBoundingClientRect())
    }

    const id = setInterval(measure, 300)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      clearInterval(id)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [step.target])

  /* ─── Compute card position ────────────────────────── */

  useLayoutEffect(() => {
    if (!mounted) return

    if (!hasTarget || !targetRect) {
      // Welcome / Execute: find the sidebar, center card in viewport left of it
      const sidebar = document.querySelector('[data-onboarding-sidebar]') ||
                      document.querySelector('.fixed.inset-y-0.right-0') // fallback
      const sidebarLeft = sidebar ? sidebar.getBoundingClientRect().left : window.innerWidth - 400
      setCardPos({
        left: Math.max(16, (sidebarLeft - CARD_WIDTH) / 2),
        top: window.innerHeight / 2,
      })
      return
    }

    // Sidecar: card is to the left of the sidebar, vertically centered to the target
    const sidebarLeft = targetRect.right + (window.innerWidth - targetRect.right - targetRect.width)
    // More reliably: the sidebar edge is where the target starts
    // Target is inside the sidebar (400px from right). Card goes to the left of the sidebar.
    const sidebarLeftEdge = window.innerWidth - 400
    const cardLeft = sidebarLeftEdge - CARD_WIDTH - GAP
    const targetCenterY = targetRect.top + targetRect.height / 2

    setCardPos({
      left: Math.max(16, cardLeft),
      top: targetCenterY,
    })
  }, [mounted, hasTarget, targetRect])

  /* ─── Navigation ───────────────────────────────────── */

  const handleNext = useCallback(() => {
    if (step.target && !actionPerformed[step.id]) {
      const count = nudgeCount + 1
      setNudgeCount(count)

      if (count === 1) {
        setShowNudge(true)
        setTimeout(() => setShowNudge(false), 3000)
        return
      }
      // count >= 2: silent skip, fall through
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

  /* ─── SVG bridge coordinates ───────────────────────── */

  const getBridgeCoords = () => {
    if (!targetRect || !cardPos) return null

    const cardRight = cardPos.left + dragOffset.x + CARD_WIDTH
    const cardCenterY = cardPos.top + dragOffset.y // card is already centered via transform

    return {
      fromX: cardRight + 6,
      fromY: cardCenterY,
      toX: targetRect.left - 6,
      toY: targetRect.top + targetRect.height / 2,
    }
  }

  if (!mounted || !cardPos) return null

  const bridgeCoords = getBridgeCoords()

  const content = (
    <>
      {/* Very subtle overlay - pointer events pass through everywhere */}
      <div
        className="fixed inset-0 z-[9999] bg-black/[0.04]"
        style={{ pointerEvents: "none" }}
        role="presentation"
      />

      {/* Highlight ring on target */}
      {targetRect && <HighlightRing rect={targetRect} />}

      {/* SVG Bridge */}
      {bridgeCoords && targetRect && (
        <SvgBridge
          key={`bridge-${step.id}`}
          fromX={bridgeCoords.fromX}
          fromY={bridgeCoords.fromY}
          toX={bridgeCoords.toX}
          toY={bridgeCoords.toY}
        />
      )}

      {/* Sidecar Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={cardRef}
          className="fixed z-[10002] cursor-grab rounded-2xl border border-white/60 bg-white/85 shadow-lg shadow-black/[0.06] backdrop-blur-2xl active:cursor-grabbing"
          style={{
            left: cardPos.left + dragOffset.x,
            top: cardPos.top + dragOffset.y,
            width: CARD_WIDTH,
            transform: "translateY(-50%)",
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          draggable
          onDragStart={(e) => {
            // Track starting mouse position for manual drag
            const el = e.currentTarget as HTMLElement
            el.dataset.dragStartX = String(e.clientX)
            el.dataset.dragStartY = String(e.clientY)
            el.dataset.dragOffsetX = String(dragOffset.x)
            el.dataset.dragOffsetY = String(dragOffset.y)
          }}
          onDrag={(e) => {
            const el = e.currentTarget as HTMLElement
            const startX = Number(el.dataset.dragStartX || 0)
            const startY = Number(el.dataset.dragStartY || 0)
            const origX = Number(el.dataset.dragOffsetX || 0)
            const origY = Number(el.dataset.dragOffsetY || 0)
            if (e.clientX === 0 && e.clientY === 0) return // dragend fires with 0,0
            setDragOffset({
              x: origX + (e.clientX - startX),
              y: origY + (e.clientY - startY),
            })
          }}
        >
          <div className="p-5">
            {/* Drag handle */}
            <div className="mb-3 flex justify-center">
              <div className="h-[3px] w-7 rounded-full bg-[#cbd5e1]/40" />
            </div>

            {/* Progress dots */}
            <div className="mb-3.5 flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep
                      ? "w-5 bg-[#3b82f6]"
                      : i < currentStep
                        ? "w-1.5 bg-[#3b82f6]/25"
                        : "w-1.5 bg-[#94a3b8]/15"
                  )}
                />
              ))}
              <span className="ml-auto text-[10px] font-medium tabular-nums text-[#94a3b8]/70">
                {currentStep + 1}/{TOUR_STEPS.length}
              </span>
            </div>

            {/* Content */}
            <h3 className="text-[17px] font-semibold leading-tight tracking-tight text-[#0f172a]">
              {step.headline}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
              {step.body}
            </p>
            {step.actionHint && (
              <p className="mt-1.5 text-[12px] font-medium text-[#3b82f6]/80">
                {step.actionHint}
              </p>
            )}

            {/* Last step: don't show again */}
            {isLast && (
              <div className="mt-4 border-t border-[#e2e8f0]/40 pt-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-[#cbd5e1] bg-white accent-[#3b82f6]"
                  />
                  <span className="text-[11px] text-[#94a3b8]">
                    {"Don\u2019t show this guide again"}
                  </span>
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="relative mt-4 flex items-center justify-between">
              <NudgeToast visible={showNudge} />

              <button
                type="button"
                className="text-[11px] font-medium text-[#94a3b8]/60 transition-colors duration-200 hover:text-[#64748b]"
                onClick={handleSkip}
              >
                Skip tour
              </button>
              <div className="flex items-center gap-1.5">
                {!isFirst && (
                  <button
                    type="button"
                    className="flex h-8 items-center rounded-lg border border-[#e2e8f0]/60 bg-white/80 px-3 text-[12px] font-medium text-[#64748b] transition-all duration-200 hover:border-[#cbd5e1] hover:text-[#0f172a]"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  className="flex h-8 items-center rounded-lg bg-[#0f172a] px-4 text-[12px] font-semibold text-white transition-all duration-200 hover:bg-[#1e293b]"
                  onClick={handleNext}
                >
                  {isLast ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )

  return createPortal(content, document.body)
}
