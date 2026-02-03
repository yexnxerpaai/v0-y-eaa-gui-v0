"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Database, Server, Brain, HardDrive } from "lucide-react"

interface SystemPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const systemComponents = [
  {
    id: "memory",
    name: "Memory Store",
    description: "Long-term storage for learned data",
    status: "not-connected",
    icon: Database,
  },
  {
    id: "agent",
    name: "Agent Core",
    description: "Decision-making and execution",
    status: "not-connected",
    icon: Brain,
  },
  {
    id: "automation",
    name: "Automation",
    description: "Browser automation layer",
    status: "not-connected",
    icon: Server,
  },
  {
    id: "storage",
    name: "Documents",
    description: "Resume and file storage",
    status: "not-connected",
    icon: HardDrive,
  },
]

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  connected: { label: "Connected", variant: "default" },
  "not-connected": { label: "Not Connected", variant: "secondary" },
  error: { label: "Error", variant: "destructive" },
}

export function SystemPanel({ open, onOpenChange }: SystemPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="text-base font-medium">System</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Notice */}
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              System internals are de-emphasized in v0. This panel exists for transparency.
            </p>
          </div>

          {/* Components Status */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Components
            </p>
            <div className="space-y-2">
              {systemComponents.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <component.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">{component.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {component.description}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={statusConfig[component.status]?.variant || "secondary"}
                    className="text-[10px]"
                  >
                    {statusConfig[component.status]?.label || component.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Version Info */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Version
            </p>
            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Interface</span>
                <span className="font-mono text-foreground">v0.1.0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Agent</span>
                <span className="font-mono text-muted-foreground">not deployed</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Last sync</span>
                <span className="font-mono text-muted-foreground">never</span>
              </div>
            </div>
          </div>

          {/* Config Reference */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Configuration
            </p>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">
                Memory and configuration references will appear here when the backend is connected.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
