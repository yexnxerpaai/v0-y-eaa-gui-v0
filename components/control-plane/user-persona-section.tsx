"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, FileText, ExternalLink, Search, Pencil, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data
const mockResumes = [
  { id: "resume-1", name: "Software_Engineer_Resume_2024.pdf", status: "active" },
  { id: "resume-2", name: "PM_Resume_Full.pdf", status: "available" },
]

const mockQuestions = [
  { id: "q1", question: "Are you authorized to work in the United States?", answer: "Yes" },
  { id: "q2", question: "Do you require visa sponsorship now or in the future?", answer: "No" },
  { id: "q3", question: "What is your expected salary range?", answer: "$180,000 - $220,000" },
  { id: "q4", question: "Are you willing to relocate?", answer: "Yes, for the right opportunity" },
  { id: "q5", question: "Do you have experience with agile methodologies?", answer: "Yes, 5+ years of Scrum and Kanban experience across multiple teams." },
  { id: "q6", question: "Have you ever been convicted of a felony?", answer: "No" },
  { id: "q7", question: "What is your proficiency level in Python?", answer: "Advanced - 4+ years professional experience" },
  { id: "q8", question: "Describe a time you resolved a conflict with a teammate.", answer: "In my previous role, I mediated a disagreement between two engineers about API design by facilitating a technical review session where we documented trade-offs objectively. We reached consensus on a hybrid approach." },
  { id: "q9", question: "What accessibility standards are you familiar with?", answer: "WCAG 2.1 AA, Section 508, ARIA best practices" },
  { id: "q10", question: "Do you have a security clearance?", answer: "No" },
  { id: "q11", question: "What is your notice period?", answer: "2 weeks" },
  { id: "q12", question: "Are you comfortable working in a hybrid environment?", answer: "Yes, I prefer 2-3 days in office." },
]

export function UserPersonaSection() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedResume, setSelectedResume] = useState(mockResumes[0].id)
  const [questions, setQuestions] = useState(mockQuestions)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const selectedResumeData = mockResumes.find((r) => r.id === selectedResume)

  const filteredQuestions = questions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartEdit = (id: string, currentAnswer: string) => {
    setEditingId(id)
    setEditValue(currentAnswer)
  }

  const handleSaveEdit = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answer: editValue } : q))
    )
    setEditingId(null)
    setEditValue("")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue("")
  }

  return (
    <section>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Collapsed View - Always Visible */}
        <div className="space-y-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <h2 className="text-base font-medium text-foreground">User Persona</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  This is who the agent represents.
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
          </CollapsibleTrigger>

          {/* Summary Card - Always Visible */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Alex Chen</p>
                  <a
                    href="https://linkedin.com/in/alexchen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    linkedin.com/in/alexchen
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {selectedResumeData?.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedResumeData?.status}
                  </Badge>
                </div>
              </div>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="Select resume" />
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
          </div>
        </div>

        {/* Expanded View - Inline Expansion */}
        <CollapsibleContent className="mt-6 space-y-6">
          {/* Learned Questions & Answers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Learned Questions & Answers
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Inspecting and adjusting the agent's memory.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {questions.length} questions
              </Badge>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions or answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-4"
                disabled
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                Search is not active in this version.
              </span>
            </div>

            {/* Questions Table */}
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40%] text-xs font-medium">Question</TableHead>
                    <TableHead className="w-[50%] text-xs font-medium">Answer</TableHead>
                    <TableHead className="w-[10%] text-xs font-medium text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((q) => (
                    <TableRow key={q.id} className="group">
                      <TableCell className="py-3 align-top text-sm text-foreground">
                        {q.question}
                      </TableCell>
                      <TableCell className="py-3 align-top">
                        {editingId === q.id ? (
                          <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="min-h-[60px] resize-none text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {q.answer}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right align-top">
                        {editingId === q.id ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleSaveEdit(q.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                            onClick={() => handleStartEdit(q.id, q.answer)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">
              Edits are local only. Backend save is not connected.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
