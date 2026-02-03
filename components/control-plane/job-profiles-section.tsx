"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Link2, Play, Building2, FileText, ExternalLink } from "lucide-react"

// Mock resumes
const mockResumes = [
  { id: "resume-1", name: "Software_Engineer_Resume_2024.pdf" },
  { id: "resume-2", name: "PM_Resume_Full.pdf" },
]

// Mock job profiles
const initialJobProfiles = [
  {
    id: "jp-1",
    roleTitle: "Senior Software Engineer",
    company: "Stripe",
    sourceUrl: "https://stripe.com/jobs/listing/senior-software-engineer",
    selectedResume: "resume-1",
  },
  {
    id: "jp-2",
    roleTitle: "Staff Engineer",
    company: "Figma",
    sourceUrl: "https://figma.com/careers/staff-engineer",
    selectedResume: "resume-1",
  },
  {
    id: "jp-3",
    roleTitle: "Product Manager",
    company: "Notion",
    sourceUrl: "https://notion.so/careers/product-manager",
    selectedResume: "resume-2",
  },
]

export function JobProfilesSection() {
  const [jobProfiles, setJobProfiles] = useState(initialJobProfiles)
  const [newJobUrl, setNewJobUrl] = useState("")
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const handleCreateProfile = () => {
    if (!newJobUrl.trim()) return

    // Mock extraction
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
    }

    setJobProfiles([mockNewProfile, ...jobProfiles])
    setNewJobUrl("")
  }

  const handleActivate = (profileId: string) => {
    setActivatingId(profileId)
    // Mock activation - in real system, this triggers Playwright
    setTimeout(() => {
      setActivatingId(null)
      // Would open Playwright window
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
    <section className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-base font-medium text-foreground">Job Profiles</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Give the agent permission to act.
        </p>
      </div>

      {/* Create Job - Always Visible */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Label className="text-xs text-muted-foreground">
          Drop a job link to create a profile
        </Label>
        <div className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="https://company.com/jobs/role-title"
              value={newJobUrl}
              onChange={(e) => setNewJobUrl(e.target.value)}
              className="h-9 pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProfile()
              }}
            />
          </div>
          <Button
            size="sm"
            onClick={handleCreateProfile}
            disabled={!newJobUrl.trim()}
          >
            Create
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Manual creation is not available. The system extracts role and company from the link.
        </p>
      </div>

      {/* Job Profile Cards */}
      <div className="space-y-3">
        {jobProfiles.map((profile) => {
          const selectedResumeData = mockResumes.find(
            (r) => r.id === profile.selectedResume
          )

          return (
            <div
              key={profile.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Profile Info */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {profile.roleTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile.company}
                    </p>
                    <a
                      href={profile.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                    >
                      View source
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {/* Resume Selector (Read-only display, but selectable) */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <Select
                      value={profile.selectedResume}
                      onValueChange={(value) => handleResumeChange(profile.id, value)}
                    >
                      <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent p-0 text-xs shadow-none hover:bg-muted">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockResumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id} className="text-xs">
                            {resume.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Activate Button */}
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleActivate(profile.id)}
                    disabled={activatingId === profile.id}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {activatingId === profile.id ? "Activating..." : "Activate"}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {jobProfiles.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No job profiles yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Drop a job link above to create your first profile.
          </p>
        </div>
      )}
    </section>
  )
}
