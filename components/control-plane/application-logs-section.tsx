"use client"

import { ArrowUpRight, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApplicationLogsSectionProps {
  isActive: boolean
}

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

export function ApplicationLogsSection({ isActive }: ApplicationLogsSectionProps) {
  const submittedCount = mockApplications.filter((a) => a.status === "submitted").length

  return (
    <div className={cn(
      "flex h-full flex-col overflow-hidden border border-border",
      !isActive && "pointer-events-none"
    )}>
      {/* Section Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Application Logs
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {submittedCount} submitted, {mockApplications.length} total
            </p>
          </div>
          {isActive && (
            <a
              href="https://notion.so"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open in Notion
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </a>
          )}
        </div>
      </div>

      {isActive && (
        <>
          {/* Application List */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-border">
              {mockApplications.map((app) => {
                const config = statusConfig[app.status]
                const StatusIcon = config.icon

                return (
                  <div key={app.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {app.company}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {app.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs", config.className)}>
                          {config.label}
                        </span>
                        <StatusIcon
                          className={cn("h-4 w-4 shrink-0", config.className)}
                          strokeWidth={1.5}
                        />
                      </div>
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
          <div className="shrink-0 border-t border-border px-6 py-3">
            <p className="text-[10px] text-muted-foreground">
              Synced from execution log. Read-only.
            </p>
          </div>
        </>
      )}

      {/* Collapsed preview */}
      {!isActive && (
        <div className="flex-1 overflow-hidden p-4">
          <div className="space-y-2">
            {mockApplications.slice(0, 3).map((app) => {
              const config = statusConfig[app.status]
              return (
                <div key={app.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("h-1.5 w-1.5 rounded-full", 
                    app.status === "submitted" ? "bg-success" :
                    app.status === "pending" ? "bg-warning" :
                    app.status === "failed" ? "bg-destructive" : "bg-muted-foreground"
                  )} />
                  <span className="truncate">{app.company}</span>
                </div>
              )
            })}
            {mockApplications.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{mockApplications.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
