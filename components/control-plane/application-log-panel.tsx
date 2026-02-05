"use client"

import { ArrowUpRight, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react"

type ApplicationStatus = "submitted" | "pending" | "failed" | "draft"

interface Application {
  id: string
  company: string
  role: string
  status: ApplicationStatus
  timestamp: string
}

const mockApplications: Application[] = [
  {
    id: "app-1",
    company: "Stripe",
    role: "Senior Software Engineer",
    status: "submitted",
    timestamp: "2 hours ago",
  },
  {
    id: "app-2",
    company: "Figma",
    role: "Staff Engineer",
    status: "submitted",
    timestamp: "5 hours ago",
  },
  {
    id: "app-3",
    company: "Notion",
    role: "Product Manager",
    status: "pending",
    timestamp: "1 day ago",
  },
  {
    id: "app-4",
    company: "Linear",
    role: "Senior Engineer",
    status: "failed",
    timestamp: "2 days ago",
  },
  {
    id: "app-5",
    company: "Vercel",
    role: "Solutions Engineer",
    status: "draft",
    timestamp: "3 days ago",
  },
]

const statusConfig: Record<ApplicationStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
  submitted: {
    icon: CheckCircle2,
    label: "Submitted",
    className: "text-success",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    className: "text-warning",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "text-destructive",
  },
  draft: {
    icon: AlertCircle,
    label: "Draft",
    className: "text-muted-foreground",
  },
}

export function ApplicationLogPanel() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Applications
          </h2>
          <a
            href="https://notion.so"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Notion
            <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
          </a>
        </div>
      </div>

      {/* Application List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border">
          {mockApplications.map((app) => {
            const config = statusConfig[app.status]
            const StatusIcon = config.icon

            return (
              <div key={app.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {app.company}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app.role}
                    </p>
                  </div>
                  <StatusIcon
                    className={`h-4 w-4 shrink-0 ${config.className}`}
                    strokeWidth={1.5}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {app.timestamp}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Synced from execution log. Read-only.
        </p>
      </div>
    </div>
  )
}
