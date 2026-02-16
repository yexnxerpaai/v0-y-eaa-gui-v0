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
      <SheetContent className="w-72 border-l border-border/40 bg-background p-0">
        <div className="p-6">
          <SheetHeader className="space-y-0">
            <SheetTitle className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              System
            </SheetTitle>
          </SheetHeader>

          {/* Components */}
          <div className="mt-6 space-y-3.5">
            {systemComponents.map((component) => (
              <div key={component.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <component.icon
                    className="h-3.5 w-3.5 text-muted-foreground/60"
                    strokeWidth={1.5}
                  />
                  <span className="text-[13px] text-foreground">{component.name}</span>
                </div>
                <span className="text-[11px] text-muted-foreground/60">{component.status}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-border/40" />

          {/* Version */}
          <div className="space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Version
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[13px] text-muted-foreground">Interface</span>
                <span className="font-mono text-[13px] text-foreground">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[13px] text-muted-foreground">Agent</span>
                <span className="font-mono text-[13px] text-muted-foreground/60">—</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
