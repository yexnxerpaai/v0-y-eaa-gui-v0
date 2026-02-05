"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, X, Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const mockQuestions = [
  { id: "q1", question: "Are you authorized to work in the United States?", answer: "Yes" },
  { id: "q2", question: "Do you require visa sponsorship?", answer: "No" },
  { id: "q3", question: "Expected salary range?", answer: "$180,000 – $220,000" },
  { id: "q4", question: "Willing to relocate?", answer: "Yes" },
  { id: "q5", question: "Experience with agile methodologies?", answer: "5+ years Scrum and Kanban" },
  { id: "q6", question: "Python proficiency level?", answer: "Advanced" },
  { id: "q7", question: "Notice period?", answer: "2 weeks" },
  { id: "q8", question: "Comfortable with hybrid work?", answer: "Yes, 2-3 days in office" },
  { id: "q9", question: "Preferred programming languages?", answer: "TypeScript, Python, Go" },
  { id: "q10", question: "Leadership experience?", answer: "Led teams of 5-8 engineers" },
]

export function MemoryPanel() {
  const [questions, setQuestions] = useState(mockQuestions)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredQuestions = searchQuery
    ? questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : questions

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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Memory
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {filteredQuestions.length}
          </span>
        </div>
        
        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-sm border border-border bg-transparent pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="group px-4 py-3">
              <p className="text-sm leading-relaxed text-foreground">{q.question}</p>
              {editingId === q.id ? (
                <div className="mt-2 flex items-start gap-2">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="min-h-[56px] flex-1 resize-none border-border bg-transparent text-sm"
                    autoFocus
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(q.id)}
                      className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{q.answer}</p>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(q.id, q.answer)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                  >
                    <Pencil className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-4 py-2">
        <p className="text-[10px] text-muted-foreground">
          Edits are local. Backend not connected.
        </p>
      </div>
    </div>
  )
}
