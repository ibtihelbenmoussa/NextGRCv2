import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { cn } from '@/lib/utils'
import {
    Bot, Send, X, Minimize2, Maximize2,
    Loader2, Sparkles, ChevronDown,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Plan {
    id: number
    title: string
    description?: string
    assigned_to?: number | null
    assigned_user_name?: string | null
    due_date?: string | null
    status: string
    gap_assessment_name?: string | null
    gap_assessment_code?: string | null
}

interface Message {
    id: string
    role: 'user' | 'bot'
    text: string
    intent?: string
    timestamp: Date
    typing?: boolean
}

interface Props {
    plans: Plan[]
}

// ─── Quick suggestions ────────────────────────────────────────────────────────
const SUGGESTIONS = [
    { label: '🔴 Overdue',    query: 'show overdue plans' },
    { label: '⏰ Due soon',   query: 'due this week' },
    { label: '🎯 Priority',   query: 'top priority plans' },
    { label: '👥 Workload',   query: 'assignee workload' },
    { label: '📊 Summary',    query: 'status summary' },
    { label: '👤 Unassigned', query: 'unassigned plans' },
]

// ─── Markdown-like renderer ───────────────────────────────────────────────────
function MessageContent({ text }: { text: string }) {
    const lines = text.split('\n')
    return (
        <div className="space-y-0.5 text-sm leading-relaxed">
            {lines.map((line, i) => {
                // bold **text**
                const rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                // italic *text*
                const rendered2 = rendered.replace(/\*(.+?)\*/g, '<em>$1</em>')
                if (!line.trim()) return <div key={i} className="h-1.5" />
                return (
                    <div
                        key={i}
                        dangerouslySetInnerHTML={{ __html: rendered2 }}
                        className="leading-relaxed"
                    />
                )
            })}
        </div>
    )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
                />
            ))}
        </div>
    )
}

// ─── Main Chatbot Component ───────────────────────────────────────────────────
export function ActionPlanChatbot({ plans }: Props) {
    const [open, setOpen]           = useState(false)
    const [minimized, setMinimized] = useState(false)
    const [messages, setMessages]   = useState<Message[]>([
        {
            id: 'welcome',
            role: 'bot',
            text: "👋 **Hi! I'm your Action Plans AI assistant.**\n\nI analyze your plans using ML models to give you insights.\n\nAsk me anything or pick a suggestion below:",
            timestamp: new Date(),
        },
    ])
    const [input, setInput]         = useState('')
    const [loading, setLoading]     = useState(false)
    const [unread, setUnread]       = useState(0)

    const bottomRef  = useRef<HTMLDivElement>(null)
    const inputRef   = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setUnread(0)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, open])

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return

        const userMsg: Message = {
            id: `u-${Date.now()}`,
            role: 'user',
            text: text.trim(),
            timestamp: new Date(),
        }

        // Typing placeholder
        const typingId = `typing-${Date.now()}`
        const typingMsg: Message = {
            id: typingId,
            role: 'bot',
            text: '',
            typing: true,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMsg, typingMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await axios.post('/ml/chat', {
                question: text.trim(),
                plans: plans,
            })

            const botMsg: Message = {
                id: `b-${Date.now()}`,
                role: 'bot',
                text: res.data.answer || 'No response',
                intent: res.data.intent,
                timestamp: new Date(),
            }

            setMessages(prev => prev.filter(m => m.id !== typingId).concat(botMsg))
            if (!open) setUnread(u => u + 1)

        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== typingId).concat({
                id: `err-${Date.now()}`,
                role: 'bot',
                text: '⚠️ Could not reach the ML service. Make sure Flask is running on port 5000.',
                timestamp: new Date(),
            }))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(input)
    }

    const activeCount  = plans.filter(p => p.status !== 'closed').length
    const overdueCount = plans.filter(p => {
        if (!p.due_date || p.status === 'closed') return false
        return new Date(p.due_date) < new Date()
    }).length

    return (
        <>
            {/* ── Floating Button ── */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

                {/* Pulse ring when overdue plans exist */}
                {overdueCount > 0 && !open && (
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                )}

                <button
                    onClick={() => { setOpen(o => !o); setMinimized(false) }}
                    className={cn(
                        'relative flex items-center gap-2.5 px-4 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-300',
                        open
                            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95',
                    )}
                >
                    {open ? <X size={17} /> : <Bot size={17} />}
                    {open ? 'Close' : 'AI Assistant'}
                    {!open && unread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {unread}
                        </span>
                    )}
                    {!open && overdueCount > 0 && (
                        <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {overdueCount} overdue
                        </span>
                    )}
                </button>
            </div>

            {/* ── Chat Window ── */}
            {open && (
                <div
                    className={cn(
                        'fixed bottom-20 right-6 z-50 w-[380px] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden transition-all duration-300',
                        minimized ? 'h-14' : 'h-[560px]',
                    )}
                    style={{ boxShadow: '0 24px 60px -12px rgba(0,0,0,0.35)' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                                <Bot size={16} className="text-primary" />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold leading-none">Plans AI</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {activeCount} active · ML-powered
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setMinimized(m => !m)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                            </button>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {!minimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            'flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200',
                                            msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                                        )}
                                    >
                                        {msg.role === 'bot' && (
                                            <div className="shrink-0 w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                                                <Sparkles size={13} className="text-primary" />
                                            </div>
                                        )}
                                        <div
                                            className={cn(
                                                'max-w-[85%] px-3.5 py-2.5 rounded-2xl',
                                                msg.role === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                    : 'bg-muted/60 border border-border/50 rounded-tl-sm',
                                            )}
                                        >
                                            {msg.typing
                                                ? <TypingDots />
                                                : <MessageContent text={msg.text} />
                                            }
                                            {msg.intent && msg.intent !== 'unknown' && msg.role === 'bot' && (
                                                <span className="inline-block mt-1.5 text-[9px] font-mono text-muted-foreground/60 bg-muted/40 px-1.5 py-0.5 rounded">
                                                    {msg.intent}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            {/* Suggestions */}
                            <div className="px-3 pb-2 flex gap-1.5 flex-wrap border-t border-border/50 pt-2 shrink-0">
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s.query}
                                        onClick={() => sendMessage(s.query)}
                                        disabled={loading}
                                        className="text-[11px] px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/50 transition-colors disabled:opacity-50"
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSubmit} className="px-3 pb-3 pt-1 shrink-0">
                                <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-xl px-3 py-2 focus-within:border-primary/50 focus-within:bg-muted/60 transition-all">
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Ask about your plans..."
                                        disabled={loading}
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-60"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || loading}
                                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-primary/90 active:scale-95"
                                    >
                                        {loading
                                            ? <Loader2 size={13} className="animate-spin" />
                                            : <Send size={13} />
                                        }
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    )
}