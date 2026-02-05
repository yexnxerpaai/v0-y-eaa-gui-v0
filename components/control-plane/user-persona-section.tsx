"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ArrowUpRight, Pencil, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const mockResumes = [
  { id: "resume-1", name: "Software_Engineer_2024.pdf" },
  { id: "resume-2", name: "PM_Resume.pdf" },
]

const mockQuestions = [
  { id: "q1", question: "Are you authorized to work in the United States?", answer: "Yes" },
  { id: "q2", question: "Do you require visa sponsorship?", answer: "No" },
  { id: "q3", question: "Expected salary range?", answer: "$180,000 – $220,000" },
  { id: "q4", question: "Willing to relocate?", answer: "Yes" },
  { id: "q5", question: "Experience with agile methodologies?", answer: "5+ years Scrum and Kanban" },
  { id: "q6", question: "Python proficiency level?", answer: "Advanced" },
  { id: "q7", question: "Notice period?", answer: "2 weeks" },
  { id: "q8", question: "Comfortable with hybrid work?", answer: "Yes, 2-3 days in office" },
]

export function UserPersonaSection() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedResume, setSelectedResume] = useState(mockResumes[0].id)
  const [questions, setQuestions] = useState(mockQuestions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const selectedResumeData = mockResumes.find((r) => r.id === selectedResume)

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
      {/* Header Row */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          User Persona
        </h2>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          strokeWidth={1.5}
        />
      </button>

      {/* Identity Block */}
      <div className="mt-6 flex items-start justify-between">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            Alex Chen
          </p>
          <a
            href="https://linkedin.com/in/alexchen"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            linkedin.com/in/alexchen
            <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
          </a>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Resume
          </p>
          <Select value={selectedResume} onValueChange={setSelectedResume}>
            <SelectTrigger className="mt-1 h-auto w-auto gap-1 border-0 bg-transparent p-0 text-sm font-medium text-foreground shadow-none">
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

      {/* Expanded: Q&A Memory */}
      {isExpanded && (
        <div className="mt-10">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Memory
            </h3>
            <span className="font-mono text-xs text-muted-foreground">
              {questions.length}
            </span>
          </div>

          {/* Questions List */}
          <div className="mt-4 divide-y divide-border">
            {questions.map((q) => (
              <div key={q.id} className="group py-4 first:pt-0">
                <p className="text-sm text-foreground">{q.question}</p>
                {editingId === q.id ? (
                  <div className="mt-2 flex items-start gap-2">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="min-h-[60px] flex-1 resize-none border-border bg-transparent text-sm"
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(q.id)}
                        className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <Check className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-start justify-between gap-4">
                    <p className="text-sm text-muted-foreground">{q.answer}</p>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(q.id, q.answer)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-6 text-[10px] text-muted-foreground">
            Edits are local only. Backend not connected.
          </p>
        </div>
      )}
    </section>
  )
}
