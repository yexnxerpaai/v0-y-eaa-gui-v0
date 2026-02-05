"use client"

import { useState } from "react"
import { IdentityStrip } from "@/components/control-plane/identity-strip"
import { MemoryPanel } from "@/components/control-plane/memory-panel"
import { JobProfilesPanel } from "@/components/control-plane/job-profiles-panel"
import { ApplicationLogPanel } from "@/components/control-plane/application-log-panel"
import { SystemPanel } from "@/components/control-plane/system-panel"
import { Settings2 } from "lucide-react"

export default function ControlPlane() {
  const [systemPanelOpen, setSystemPanelOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Zone A: Identity Strip */}
      <div className="shrink-0 border-b border-border">
        {/* Top bar with logo and system */}
        <div className="flex h-10 items-center justify-between border-b border-border px-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Y.EAA
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              v0
            </span>
          </div>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setSystemPanelOpen(true)}
            aria-label="System"
          >
            <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
        
        {/* Identity content */}
        <IdentityStrip />
      </div>

      {/* Zone B: Work Arena */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Memory / Questionnaire */}
        <div className="w-80 shrink-0 overflow-y-auto border-r border-border">
          <MemoryPanel />
        </div>

        {/* Center: Job Profiles (Primary) */}
        <div className="flex-1 overflow-y-auto">
          <JobProfilesPanel />
        </div>

        {/* Right: Application Log */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-border">
          <ApplicationLogPanel />
        </div>
      </div>

      {/* System Panel */}
      <SystemPanel open={systemPanelOpen} onOpenChange={setSystemPanelOpen} />
    </div>
  )
}
