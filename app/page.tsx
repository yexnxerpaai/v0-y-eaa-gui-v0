"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPersonaSection } from "@/components/control-plane/user-persona-section"
import { JobProfilesSection } from "@/components/control-plane/job-profiles-section"
import { SystemPanel } from "@/components/control-plane/system-panel"
import { Settings2, ArrowUpRight } from "lucide-react"

export default function ControlPlane() {
  const [systemPanelOpen, setSystemPanelOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Minimal, structural */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Y.EAA
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              v0
            </span>
          </div>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setSystemPanelOpen(true)}
            aria-label="System"
          >
            <Settings2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6">
        {/* User Persona */}
        <div className="border-b border-border py-10">
          <UserPersonaSection />
        </div>

        {/* Job Profiles */}
        <div className="border-b border-border py-10">
          <JobProfilesSection />
        </div>

        {/* Applications - Minimal row */}
        <div className="py-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Applications
              </h2>
              <p className="mt-1 text-sm text-foreground">
                View generated applications in Notion
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs font-medium text-primary hover:text-primary"
              onClick={() => window.open("https://notion.so", "_blank")}
            >
              Open
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </main>

      {/* System Panel */}
      <SystemPanel open={systemPanelOpen} onOpenChange={setSystemPanelOpen} />
    </div>
  )
}
