"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Database, Cpu, Globe, HardDrive } from "lucide-react"

interface SystemPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const systemComponents = [
  {
    id: "memory",
    name: "Memory",
    status: "offline",
    icon: Database,
  },
  {
    id: "agent",
    name: "Agent",
    status: "offline",
    icon: Cpu,
  },
  {
    id: "automation",
    name: "Automation",
    status: "offline",
    icon: Globe,
  },
  {
    id: "storage",
    name: "Storage",
    status: "offline",
    icon: HardDrive,
  },
]

export function SystemPanel({ open, onOpenChange }: SystemPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-72 border-l border-border bg-background p-0">
        <div className="p-6">
          <SheetHeader className="space-y-0">
            <SheetTitle className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              System
            </SheetTitle>
          </SheetHeader>

          {/* Components */}
          <div className="mt-8 space-y-4">
            {systemComponents.map((component) => (
              <div key={component.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <component.icon
                    className="h-4 w-4 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  <span className="text-sm text-foreground">{component.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{component.status}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="my-8 h-px bg-border" />

          {/* Version */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Version
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Interface</span>
                <span className="font-mono text-sm text-foreground">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Agent</span>
                <span className="font-mono text-sm text-muted-foreground">—</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
