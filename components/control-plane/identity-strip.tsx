"use client"

import { MapPin, Mail, Linkedin, Building2 } from "lucide-react"

export function IdentityStrip() {
  return (
    <div className="py-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="h-12 w-12 shrink-0 rounded-lg bg-muted/70" />

        {/* Identity Info */}
        <div className="flex-1">
          <h1 className="text-[15px] font-semibold text-foreground">
            Alex Chen
          </h1>
          
          {/* Meta row */}
          <div className="mt-1 flex items-center gap-3.5 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" strokeWidth={1.5} />
              San Francisco, CA
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3" strokeWidth={1.5} />
              Senior Engineer @ Airbnb
            </span>
          </div>
          
          {/* Links row */}
          <div className="mt-1.5 flex items-center gap-3.5 text-[11px]">
            <a
              href="mailto:alex@email.com"
              className="flex items-center gap-1 text-muted-foreground/70 transition-colors duration-200 hover:text-foreground"
            >
              <Mail className="h-2.5 w-2.5" strokeWidth={1.5} />
              alex@email.com
            </a>
            <a
              href="https://linkedin.com/in/alexchen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground/70 transition-colors duration-200 hover:text-foreground"
            >
              <Linkedin className="h-2.5 w-2.5" strokeWidth={1.5} />
              alexchen
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
