"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Mail, Linkedin, Building2, Pencil } from "lucide-react"

const mockResumes = [
  { id: "resume-1", name: "Software_Engineer_2024.pdf" },
  { id: "resume-2", name: "PM_Resume.pdf" },
]

export function IdentityStrip() {
  const [selectedResume, setSelectedResume] = useState(mockResumes[0].id)

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="h-14 w-14 shrink-0 rounded-sm bg-muted" />

        {/* Identity Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Alex Chen
            </h1>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              aria-label="Edit profile"
            >
              <Pencil className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
          
          {/* Meta row */}
          <div className="mt-1.5 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
              San Francisco, CA
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Senior Engineer @ Airbnb
            </span>
          </div>
          
          {/* Links row */}
          <div className="mt-2 flex items-center gap-4 text-xs">
            <a
              href="mailto:alex@email.com"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-3 w-3" strokeWidth={1.5} />
              alex@email.com
            </a>
            <a
              href="https://linkedin.com/in/alexchen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Linkedin className="h-3 w-3" strokeWidth={1.5} />
              alexchen
            </a>
          </div>
        </div>

        {/* Resume selector */}
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Active Resume
          </p>
          <Select value={selectedResume} onValueChange={setSelectedResume}>
            <SelectTrigger className="mt-1 h-auto w-auto gap-1.5 border-0 bg-transparent p-0 text-sm text-foreground shadow-none hover:text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {mockResumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id} className="text-sm">
                  {resume.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
