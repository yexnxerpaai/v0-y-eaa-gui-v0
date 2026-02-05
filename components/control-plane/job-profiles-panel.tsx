"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUpRight, Play, Plus } from "lucide-react"

const mockResumes = [
  { id: "resume-1", name: "Software_Engineer_2024.pdf" },
  { id: "resume-2", name: "PM_Resume.pdf" },
]

const initialJobProfiles = [
  {
    id: "jp-1",
    roleTitle: "Senior Software Engineer",
    company: "Stripe",
    sourceUrl: "https://stripe.com/jobs/listing/senior-software-engineer",
    selectedResume: "resume-1",
    status: "ready",
  },
  {
    id: "jp-2",
    roleTitle: "Staff Engineer",
    company: "Figma",
    sourceUrl: "https://figma.com/careers/staff-engineer",
    selectedResume: "resume-1",
    status: "ready",
  },
  {
    id: "jp-3",
    roleTitle: "Product Manager",
    company: "Notion",
    sourceUrl: "https://notion.so/careers/product-manager",
    selectedResume: "resume-2",
    status: "ready",
  },
]

export function JobProfilesPanel() {
  const [jobProfiles, setJobProfiles] = useState(initialJobProfiles)
  const [newJobUrl, setNewJobUrl] = useState("")
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const handleCreateProfile = () => {
    if (!newJobUrl.trim()) return

    let hostname = "company"
    try {
      hostname = new URL(newJobUrl).hostname.replace("www.", "").split(".")[0]
    } catch {
      // Use default
    }

    const mockNewProfile = {
      id: `jp-${Date.now()}`,
      roleTitle: "Extracted Role Title",
      company: hostname.charAt(0).toUpperCase() + hostname.slice(1),
      sourceUrl: newJobUrl,
      selectedResume: "resume-1",
      status: "ready" as const,
    }

    setJobProfiles([mockNewProfile, ...jobProfiles])
    setNewJobUrl("")
  }

  const handleActivate = (profileId: string) => {
    setActivatingId(profileId)
    setTimeout(() => {
      setActivatingId(null)
      alert("Playwright window would open here. Backend not connected.")
    }, 500)
  }

  const handleResumeChange = (profileId: string, resumeId: string) => {
    setJobProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, selectedResume: resumeId } : p
      )
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with input */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Job Profiles
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {jobProfiles.length}
          </span>
        </div>
        
        {/* Create new profile */}
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Paste job URL to create profile"
            value={newJobUrl}
            onChange={(e) => setNewJobUrl(e.target.value)}
            className="h-9 flex-1 border-border bg-transparent text-sm placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateProfile()
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-9 shrink-0 border-border p-0 bg-transparent"
            onClick={handleCreateProfile}
            disabled={!newJobUrl.trim()}
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {jobProfiles.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No job profiles</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobProfiles.map((profile) => (
              <div
                key={profile.id}
                className="group border border-border p-4 transition-colors hover:border-primary/30"
              >
                {/* Top row: Title + Company */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {profile.roleTitle}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {profile.company}
                    </p>
                  </div>
                  
                  {/* Activate button */}
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleActivate(profile.id)}
                    disabled={activatingId === profile.id}
                  >
                    <Play className="h-3 w-3" strokeWidth={2} />
                    {activatingId === profile.id ? "Starting..." : "Activate"}
                  </Button>
                </div>

                {/* Bottom row: Source + Resume */}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <a
                    href={profile.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View source
                    <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                  </a>
                  
                  <Select
                    value={profile.selectedResume}
                    onValueChange={(value) => handleResumeChange(profile.id, value)}
                  >
                    <SelectTrigger className="h-auto w-auto gap-1 border-0 bg-transparent p-0 text-xs text-muted-foreground shadow-none hover:text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {mockResumes.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id} className="text-xs">
                          {resume.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
