"use client"

import { MapPin, Mail, Linkedin, Building2 } from "lucide-react"

export function IdentityStrip() {
  return (
    <div className="py-5">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="h-14 w-14 shrink-0 rounded-sm bg-muted" />

        {/* Identity Info */}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            Alex Chen
          </h1>
          
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
      </div>
    </div>
  )
}
