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
import { ArrowUpRight, Play } from "lucide-react"

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
    <section>
      {/* Header */}
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Job Profiles
      </h2>

      {/* Input */}
      <div className="mt-6">
        <div className="flex gap-3">
          <Input
            placeholder="Paste job URL"
            value={newJobUrl}
            onChange={(e) => setNewJobUrl(e.target.value)}
            className="h-10 flex-1 border-border bg-transparent text-sm placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateProfile()
            }}
          />
          <Button
            size="sm"
            className="h-10 px-4 text-xs font-medium"
            onClick={handleCreateProfile}
            disabled={!newJobUrl.trim()}
          >
            Create
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Role and company are extracted automatically.
        </p>
      </div>

      {/* Profiles List */}
      <div className="mt-8 divide-y divide-border">
        {jobProfiles.map((profile) => (
          <div key={profile.id} className="flex items-center justify-between py-5 first:pt-0">
            {/* Left: Profile Info */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-foreground">
                  {profile.roleTitle}
                </span>
                <span className="text-sm text-muted-foreground">
                  {profile.company}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-4">
                <a
                  href={profile.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Source
                  <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                </a>
                <Select
                  value={profile.selectedResume}
                  onValueChange={(value) => handleResumeChange(profile.id, value)}
                >
                  <SelectTrigger className="h-auto w-auto gap-1 border-0 bg-transparent p-0 text-xs text-muted-foreground shadow-none hover:text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {mockResumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id} className="text-xs">
                        {resume.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right: Activate */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-primary bg-transparent px-4 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleActivate(profile.id)}
              disabled={activatingId === profile.id}
            >
              <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
              {activatingId === profile.id ? "Starting..." : "Activate"}
            </Button>
          </div>
        ))}
      </div>

      {jobProfiles.length === 0 && (
        <div className="mt-8 py-16 text-center">
          <p className="text-sm text-muted-foreground">No job profiles</p>
        </div>
      )}
    </section>
  )
}
