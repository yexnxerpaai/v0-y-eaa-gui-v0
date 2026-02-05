"use client"

import { useState } from "react"
import { IdentityStrip } from "@/components/control-plane/identity-strip"
import { SystemPanel } from "@/components/control-plane/system-panel"
import { JobProfilesSection } from "@/components/control-plane/job-profiles-section"
import { QuestionnaireSection } from "@/components/control-plane/questionnaire-section"
import { ApplicationLogsSection } from "@/components/control-plane/application-logs-section"
import { Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Section = "job-profiles" | "questionnaire" | "application-logs"

const sections: { id: Section; label: string }[] = [
  { id: "job-profiles", label: "Job Profiles" },
  { id: "questionnaire", label: "Questionnaire" },
  { id: "application-logs", label: "Application Logs" },
]

export default function ControlPlane() {
  const [systemPanelOpen, setSystemPanelOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>("job-profiles")

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Zone A: Identity Strip */}
      <div className="shrink-0 border-b border-border">
        {/* Top bar with logo and system */}
        <div className="mx-auto max-w-6xl px-8">
          <div className="flex h-10 items-center justify-between">
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
        </div>
        
        {/* Identity content */}
        <div className="mx-auto max-w-6xl px-8">
          <IdentityStrip />
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="shrink-0 border-b border-border">
        <div className="mx-auto max-w-6xl px-8">
          <nav className="flex gap-8" aria-label="Section navigation">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "relative py-3 text-sm font-medium transition-colors",
                  activeSection === section.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {section.label}
                {activeSection === section.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Zone B: Work Arena - Scrollable Sections */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-6xl gap-6 px-8 py-6">
          {/* Job Profiles */}
          <div
            className={cn(
              "shrink-0 transition-all duration-300 ease-out",
              activeSection === "job-profiles"
                ? "w-full flex-1 opacity-100"
                : "w-48 cursor-pointer opacity-40 hover:opacity-60"
            )}
            onClick={() => activeSection !== "job-profiles" && setActiveSection("job-profiles")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && activeSection !== "job-profiles") {
                setActiveSection("job-profiles")
              }
            }}
            role={activeSection !== "job-profiles" ? "button" : undefined}
            tabIndex={activeSection !== "job-profiles" ? 0 : undefined}
          >
            <JobProfilesSection isActive={activeSection === "job-profiles"} />
          </div>

          {/* Questionnaire */}
          <div
            className={cn(
              "shrink-0 transition-all duration-300 ease-out",
              activeSection === "questionnaire"
                ? "w-full flex-1 opacity-100"
                : "w-48 cursor-pointer opacity-40 hover:opacity-60"
            )}
            onClick={() => activeSection !== "questionnaire" && setActiveSection("questionnaire")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && activeSection !== "questionnaire") {
                setActiveSection("questionnaire")
              }
            }}
            role={activeSection !== "questionnaire" ? "button" : undefined}
            tabIndex={activeSection !== "questionnaire" ? 0 : undefined}
          >
            <QuestionnaireSection isActive={activeSection === "questionnaire"} />
          </div>

          {/* Application Logs */}
          <div
            className={cn(
              "shrink-0 transition-all duration-300 ease-out",
              activeSection === "application-logs"
                ? "w-full flex-1 opacity-100"
                : "w-48 cursor-pointer opacity-40 hover:opacity-60"
            )}
            onClick={() => activeSection !== "application-logs" && setActiveSection("application-logs")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && activeSection !== "application-logs") {
                setActiveSection("application-logs")
              }
            }}
            role={activeSection !== "application-logs" ? "button" : undefined}
            tabIndex={activeSection !== "application-logs" ? 0 : undefined}
          >
            <ApplicationLogsSection isActive={activeSection === "application-logs"} />
          </div>
        </div>
      </div>

      {/* System Panel */}
      <SystemPanel open={systemPanelOpen} onOpenChange={setSystemPanelOpen} />
    </div>
  )
}
