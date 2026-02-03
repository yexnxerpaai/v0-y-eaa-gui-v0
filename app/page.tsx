"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPersonaSection } from "@/components/control-plane/user-persona-section"
import { JobProfilesSection } from "@/components/control-plane/job-profiles-section"
import { SystemPanel } from "@/components/control-plane/system-panel"
import { Settings2, ExternalLink } from "lucide-react"

export default function ControlPlane() {
  const [systemPanelOpen, setSystemPanelOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium tracking-tight text-foreground">
              Y.EAA
            </span>
            <span className="text-xs text-muted-foreground">v0</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSystemPanelOpen(true)}
            aria-label="System controls"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content - Single Page Vertical Flow */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-12">
          {/* User Persona - Primary Section */}
          <UserPersonaSection />

          {/* Job Profiles - Action-Oriented Section */}
          <JobProfilesSection />

          {/* Applications Access - Page-Level Action */}
          <section className="border-t border-border pt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-foreground">Applications</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  View all generated applications in Notion.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={() => window.open("https://notion.so/your-workspace/applications", "_blank")}
              >
                Open Applications
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </section>
        </div>
      </main>

      {/* System Panel (Side Panel) */}
      <SystemPanel open={systemPanelOpen} onOpenChange={setSystemPanelOpen} />
    </div>
  )
}
