import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis,
    CartesianGrid, BarChart, Bar, Cell,
} from 'recharts';
import axios from 'axios';
import {
    Bot, Send, X, Minimize2, Maximize2, Sparkles, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Plan {
    id: number;
    title: string;
    description: string;
    assigned_to: number | null;
    assigned_user_name: string | null;
    due_date: string | null;
    status: string;
    gap_assessment_name: string | null;
    gap_assessment_code: string | null;
}

interface Kpis {
    compliance_score: number;
    avg_maturity: number;
    action_plans: { total: number; overdue: number; in_progress: number; done: number };
    gap_assessments: { total: number; this_month: number; avg_score: number };
}

interface ActivityItem { id: string; type: string; message: string; time: string; read: boolean }
interface DeadlineItem { id: number; name: string; due_date: string; type: 'test' | 'action_plan'; status: 'overdue' | 'soon' | 'ok' }
interface RadarItem { framework: string; score: number; target: number }
interface HeatmapRow { framework: string; scores: { bu: string; score: number }[] }
interface BuComplianceItem { name: string; code: string; score: number; count: number }
interface EvolutionItem { month: string; score: number; new_assessments: number }
interface CriticalGapItem { id: number; name: string; code: string; framework: string; maturity: number; score: number; status: string; severity: 'critical' | 'high' }
interface OverdueActionPlan { id: number; title: string; gap: string; due_date: string; days_overdue: number; priority: string; status: string }
interface ExecutiveSummary { best_bu: { name: string; code: string; score: number } | null; worst_bu: { name: string; code: string; score: number } | null; critical_gaps: number; overdue_plans: number; total_assessments: number; remediation_rate: number }
interface Recommendation { type: 'critical' | 'warning' | 'success' | 'info'; icon: string; title: string; message: string; priority: number }
interface ProcessComplianceItem { id: number; name: string; macro: string; score: number; maturity: number; count: number }
interface FrameworkComparisonItem { framework: string; compliance: number; maturity: number; total: number; critical: number; overdue_plans: number }

interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    text: string;
    intent?: string;
    timestamp: Date;
    typing?: boolean;
}

interface Props {
    kpis: Kpis;
    recentActivity: ActivityItem[];
    deadlines: DeadlineItem[];
    radarData: RadarItem[];
    heatmapData: HeatmapRow[];
    businessUnitCompliance: BuComplianceItem[];
    complianceEvolution: EvolutionItem[];
    topCriticalGaps: CriticalGapItem[];
    overdueActionPlans: OverdueActionPlan[];
    executiveSummary: ExecutiveSummary;
    recommendations: Recommendation[];
    processCompliance: ProcessComplianceItem[];
    frameworkComparison: FrameworkComparisonItem[];
    allPlans: Plan[];
}

// ─── Chatbot Props ────────────────────────────────────────────────────────────

interface ChatbotProps {
    plans: Plan[];
    kpis: Kpis;
    executiveSummary: ExecutiveSummary;
    topCriticalGaps: CriticalGapItem[];
    overdueActionPlans: OverdueActionPlan[];
    recommendations: Recommendation[];
    frameworkComparison: FrameworkComparisonItem[];
    businessUnitCompliance: BuComplianceItem[];
    complianceEvolution: EvolutionItem[];
    processCompliance: ProcessComplianceItem[];
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

const GRADIENTS = {
    red: 'linear-gradient(135deg, #e11d48, #9f1239)',
    amber: 'linear-gradient(135deg, #f59e0b, #b45309)',
    blue: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    green: 'linear-gradient(135deg, #10b981, #047857)',
    violet: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    orange: 'linear-gradient(135deg, #f97316, #c2410c)',
    teal: 'linear-gradient(135deg, #14b8a6, #0f766e)',
    rose: 'linear-gradient(135deg, #fb7185, #be123c)',
};

const CHART_COLORS = ['#e11d48', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#14b8a6'];

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function heatColor(score: number): string {
    if (score === 0) return 'bg-muted text-muted-foreground';
    if (score < 2) return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    if (score < 3.5) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
}

function scoreColor(score: number): string {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#e11d48';
}

function deadlineChip(status: string) {
    if (status === 'overdue') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    if (status === 'soon') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
}

function deadlineLabel(status: string) {
    if (status === 'overdue') return 'Overdue';
    if (status === 'soon') return 'Bientôt';
    return 'OK';
}

function activityDot(type: string) {
    const map: Record<string, string> = { success: 'bg-green-500', info: 'bg-blue-500', warning: 'bg-amber-500', danger: 'bg-red-500' };
    return map[type] ?? 'bg-gray-400';
}

function priorityBadge(priority: string) {
    switch (priority) {
        case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
        case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
        case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
        default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    }
}

function recommendationStyle(type: string) {
    switch (type) {
        case 'critical': return { border: 'border-red-500/30', icon: 'bg-red-500/10 text-red-500', dot: 'bg-red-500' };
        case 'warning': return { border: 'border-amber-500/30', icon: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' };
        case 'success': return { border: 'border-green-500/30', icon: 'bg-green-500/10 text-green-500', dot: 'bg-green-500' };
        default: return { border: 'border-blue-500/30', icon: 'bg-blue-500/10 text-blue-500', dot: 'bg-blue-500' };
    }
}

function isOverdue(dueDate: string | null, status: string): boolean {
    if (!dueDate || status === 'closed') return false;
    return new Date(dueDate) < new Date();
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-sidebar p-4 ${className}`}>
            {children}
        </div>
    );
}

function CardHeader({ gradient, icon, title, subtitle }: { gradient: string; icon: React.ReactNode; title: string; subtitle?: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: gradient }}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-foreground leading-tight">{title}</p>
                {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
    );
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 mt-2">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2">{label}</span>
            <div className="h-px flex-1 bg-border/50" />
        </div>
    );
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

const CHAT_SUGGESTIONS = [
    { label: '🔴 Overdue', query: 'show overdue plans' },
    { label: '⏰ Due soon', query: 'due this week' },
    { label: '🎯 Priority', query: 'top priority plans' },
    { label: '👥 Workload', query: 'assignee workload' },
    { label: '📊 Summary', query: 'status summary' },
    { label: '📈 Analytics', query: 'analytics' },
];

function MessageContent({ text }: { text: string }) {
    const lines = text.split('\n');
    return (
        <div className="space-y-0.5 text-sm leading-relaxed">
            {lines.map((line, i) => {
                const rendered = line
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>');
                if (!line.trim()) return <div key={i} className="h-1.5" />;
                return <div key={i} dangerouslySetInnerHTML={{ __html: rendered }} className="leading-relaxed" />;
            })}
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }} />
            ))}
        </div>
    );
}

export function ActionPlanChatbot({
    plans = [],
    kpis,
    executiveSummary,
    topCriticalGaps,
    overdueActionPlans,
    recommendations,
    frameworkComparison,
    businessUnitCompliance,
    complianceEvolution,
    processCompliance,
}: ChatbotProps) {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: 'welcome',
        role: 'bot',
        text: "👋 **Hi! I'm your GRC AI assistant.**\n\nI analyze your action plans using local ML models.\n\nAsk me anything or pick a suggestion below:",
        timestamp: new Date(),
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [unread, setUnread] = useState(0);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
    }, [open]);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    const overdueCount = plans.filter(p => isOverdue(p.due_date, p.status)).length;
    const activeCount = plans.filter(p => p.status !== 'closed').length;

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: text.trim(), timestamp: new Date() };
        const typingId = `typing-${Date.now()}`;
        const typingMsg: ChatMessage = { id: typingId, role: 'bot', text: '', typing: true, timestamp: new Date() };

        setMessages(prev => [...prev, userMsg, typingMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post('/ml/chat', {
                question: text.trim(),
                plans,
                kpis,
                executiveSummary,
                topCriticalGaps,
                overdueActionPlans,
                recommendations,
                frameworkComparison,
                businessUnitCompliance,
                complianceEvolution,
                processCompliance,
            });

            const botMsg: ChatMessage = {
                id: `b-${Date.now()}`,
                role: 'bot',
                text: res.data.answer || res.data.text || 'No response',
                intent: res.data.intent,
                timestamp: new Date(),
            };
            setMessages(prev => prev.filter(m => m.id !== typingId).concat(botMsg));
            if (!open) setUnread(u => u + 1);
        } catch {
            setMessages(prev => prev.filter(m => m.id !== typingId).concat({
                id: `err-${Date.now()}`,
                role: 'bot',
                text: '⚠️ Cannot reach ML service. Make sure Flask is running on port 5000.',
                timestamp: new Date(),
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                {overdueCount > 0 && !open && (
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
                )}
                <button
                    onClick={() => { setOpen(o => !o); setMinimized(false); }}
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

            {/* Chat Window */}
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
                                <p className="text-sm font-semibold leading-none">GRC AI Assistant</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{activeCount} active plans · ML-powered</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setMinimized(m => !m)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                            </button>
                            <button onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {!minimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
                                {messages.map(msg => (
                                    <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                                        {msg.role === 'bot' && (
                                            <div className="shrink-0 w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                                                <Sparkles size={13} className="text-primary" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            'max-w-[85%] px-3.5 py-2.5 rounded-2xl',
                                            msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                : 'bg-muted/60 border border-border/50 rounded-tl-sm',
                                        )}>
                                            {msg.typing ? <TypingDots /> : <MessageContent text={msg.text} />}
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
                                {CHAT_SUGGESTIONS.map(s => (
                                    <button key={s.query} onClick={() => sendMessage(s.query)} disabled={loading}
                                        className="text-[11px] px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/50 transition-colors disabled:opacity-50">
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Input */}
                            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="px-3 pb-3 pt-1 shrink-0">
                                <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-xl px-3 py-2 focus-within:border-primary/50 focus-within:bg-muted/60 transition-all">
                                    <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                                        placeholder="Ask about your plans..." disabled={loading}
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-60" />
                                    <button type="submit" disabled={!input.trim() || loading}
                                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-primary/90 active:scale-95">
                                        {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, maturity }: { score: number; maturity: number }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = scoreColor(score);
    const maturityLabels = ['Initial', 'Basic', 'Defined', 'Managed', 'Optimized'];

    return (
        <Card className="flex flex-col">
            <CardHeader gradient={GRADIENTS.red} title="Compliance Score Global"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
            />
            <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="9" className="opacity-[0.08]" />
                        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
                            strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 60 60)"
                            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }} />
                        <text x="60" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="600" fill={color}>{score}%</text>
                        <text x="60" y="72" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="currentColor" opacity="0.45">compliance</text>
                    </svg>
                </div>
                <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] text-muted-foreground">Maturité moyenne</p>
                            <span className="text-[10px] font-medium text-foreground">{maturity}/5</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(maturity / 5) * 100}%`, background: color, transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)' }} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        {maturityLabels.map((label, i) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i + 1 <= maturity ? 'bg-green-500' : 'bg-muted'}`} />
                                <span className={`text-[10px] ${i + 1 <= maturity ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                    <span className={`self-start text-[10px] font-medium px-2 py-0.5 rounded-full ${score >= 60 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                        {score >= 60 ? '↑ Bon niveau' : '↓ À améliorer'}
                    </span>
                </div>
            </div>
        </Card>
    );
}

// ─── Gradient KPI Card ────────────────────────────────────────────────────────

function GradientKpiCard({ label, value, sub, badge, badgeColor, gradient, icon }: {
    label: string; value: string | number; sub: string;
    badge?: string; badgeColor?: string; gradient: string; icon: React.ReactNode;
}) {
    return (
        <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: gradient }}>{icon}</div>
            </div>
            <p className="text-3xl font-medium text-foreground leading-none">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
            {badge && <span className={`mt-0.5 self-start text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
        </Card>
    );
}

// ─── Executive Summary ────────────────────────────────────────────────────────

function ExecutiveSummaryWidget({ data }: { data: ExecutiveSummary }) {
    const stats = [
        { label: 'Best BU', value: data.best_bu?.name ?? '—', sub: data.best_bu ? `${data.best_bu.score}% compliance` : 'No data', color: 'text-green-500', bg: 'bg-green-500/10', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg> },
        { label: 'Worst BU', value: data.worst_bu?.name ?? '—', sub: data.worst_bu ? `${data.worst_bu.score}% compliance` : 'No data', color: 'text-red-500', bg: 'bg-red-500/10', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg> },
        { label: 'Critical Gaps', value: data.critical_gaps, sub: 'maturity ≤ 2/5', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> },
        { label: 'Overdue Plans', value: data.overdue_plans, sub: 'require immediate action', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
        { label: 'Remediation Rate', value: `${data.remediation_rate}%`, sub: `${data.total_assessments} total assessments`, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> },
    ];

    return (
        <Card>
            <CardHeader gradient={GRADIENTS.violet} title="Executive Summary" subtitle="High-level compliance posture overview"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {stats.map(s => (
                    <div key={s.label} className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/30">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${s.bg} ${s.color}`}>{s.icon}</div>
                        <p className={`text-base font-semibold leading-tight ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                        <p className="text-[9px] text-muted-foreground/70 leading-tight">{s.sub}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ─── BU Compliance Chart ──────────────────────────────────────────────────────

function BuComplianceChart({ data }: { data: BuComplianceItem[] }) {
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-sidebar border border-sidebar-border rounded-lg p-2 text-xs shadow-lg">
                <p className="font-medium text-foreground">{payload[0]?.payload?.name}</p>
                <p className="text-muted-foreground">Score: <span className="text-foreground font-medium">{payload[0]?.value}%</span></p>
                <p className="text-muted-foreground">Assessments: {payload[0]?.payload?.count}</p>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader gradient={GRADIENTS.teal} title="Compliance by Business Unit" subtitle="Horizontal distribution of compliance scores"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="4" height="17" rx="1" /><rect x="9" y="4" width="4" height="20" rx="1" /><rect x="16" y="11" width="4" height="13" rx="1" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée disponible</p> : (
                <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
                    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="opacity-10" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} tickFormatter={v => `${v}%`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }} width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={20}>
                            {data.map((entry, i) => <Cell key={i} fill={scoreColor(entry.score)} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
}

// ─── Compliance Evolution ─────────────────────────────────────────────────────

function ComplianceEvolution({ data }: { data: EvolutionItem[] }) {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-sidebar border border-sidebar-border rounded-lg p-2 text-xs shadow-lg">
                <p className="font-medium text-foreground mb-1">{label}</p>
                <p className="text-muted-foreground">Score: <span className="text-foreground font-medium">{payload[0]?.value}%</span></p>
                {payload[1] && <p className="text-muted-foreground">New assessments: <span className="text-foreground font-medium">{payload[1]?.value}</span></p>}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader gradient={GRADIENTS.blue} title="Compliance Evolution" subtitle="Monthly compliance score trend — last 6 months"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée disponible</p> : (
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} tickFormatter={v => `${v}%`} width={36} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="new_assessments" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            )}
            <div className="flex gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> Score cumulatif</span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-3 h-0.5 bg-slate-400 inline-block rounded" /> Nouveaux assessments</span>
            </div>
        </Card>
    );
}

// ─── Top Critical Gaps ────────────────────────────────────────────────────────

function TopCriticalGaps({ data }: { data: CriticalGapItem[] }) {
    return (
        <Card>
            <CardHeader gradient={GRADIENTS.rose} title="Top Critical Gaps" subtitle="Gap assessments with lowest maturity scores"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucun gap critique</p> : (
                <div className="flex flex-col divide-y divide-border">
                    {data.map(g => (
                        <div key={g.id} className="flex items-center gap-3 py-2.5">
                            <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${g.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'}`}>
                                {g.severity === 'critical' ? 'CRITICAL' : 'HIGH'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{g.name}</p>
                                <p className="text-[10px] text-muted-foreground">{g.framework}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full rounded-full bg-red-500" style={{ width: `${(g.maturity / 5) * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-medium text-red-500 w-6 text-right">{g.maturity}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Overdue Action Plans ─────────────────────────────────────────────────────

function OverdueActionPlansWidget({ data }: { data: OverdueActionPlan[] }) {
    return (
        <Card>
            <CardHeader gradient={GRADIENTS.amber} title="Overdue Action Plans" subtitle="Plans requiring immediate attention"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucun plan en retard 🎉</p> : (
                <div className="flex flex-col divide-y divide-border">
                    {data.map(p => (
                        <div key={p.id} className="flex items-center gap-3 py-2.5">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{p.title}</p>
                                <p className="text-[10px] text-muted-foreground">{p.gap} · échéance {p.due_date}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${priorityBadge(p.priority)}`}>{p.priority}</span>
                                <span className="text-[10px] font-semibold text-red-500 whitespace-nowrap">+{p.days_overdue}j</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Smart Recommendations ────────────────────────────────────────────────────

function RecommendationIcon({ icon }: { icon: string }) {
    const icons: Record<string, React.ReactNode> = {
        alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
        building: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>,
        chart: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>,
        star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    };
    return <>{icons[icon] ?? icons.alert}</>;
}

function SmartRecommendations({ data }: { data: Recommendation[] }) {
    return (
        <Card>
            <CardHeader gradient={GRADIENTS.violet} title="Smart Recommendations" subtitle="AI-driven insights based on current compliance posture"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucune recommandation disponible</p> : (
                <div className="flex flex-col gap-2">
                    {data.map((r, i) => {
                        const style = recommendationStyle(r.type);
                        return (
                            <div key={i} className={`flex gap-3 p-3 rounded-lg border ${style.border} bg-muted/20`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${style.icon}`}><RecommendationIcon icon={r.icon} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground leading-tight">{r.title}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{r.message}</p>
                                </div>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${style.dot}`} />
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

// ─── Process Compliance ───────────────────────────────────────────────────────

function ProcessComplianceWidget({ data }: { data: ProcessComplianceItem[] }) {
    const sorted = [...data].sort((a, b) => a.score - b.score).slice(0, 8);
    return (
        <Card>
            <CardHeader gradient={GRADIENTS.orange} title="Process Compliance" subtitle="Lowest-performing processes — sorted by compliance score"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /></svg>}
            />
            {sorted.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée disponible</p> : (
                <div className="flex flex-col gap-2">
                    {sorted.map(p => (
                        <div key={p.id} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <p className="text-[11px] text-foreground truncate">{p.name}</p>
                                    <span className="text-[10px] font-medium ml-2 flex-shrink-0" style={{ color: scoreColor(p.score) }}>{p.score}%</span>
                                </div>
                                <p className="text-[9px] text-muted-foreground truncate mb-1">{p.macro}</p>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: scoreColor(p.score) }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Framework Comparison ─────────────────────────────────────────────────────

function FrameworkComparison({ data }: { data: FrameworkComparisonItem[] }) {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        const entry = data.find(d => d.framework === label);
        return (
            <div className="bg-sidebar border border-sidebar-border rounded-lg p-2 text-xs shadow-lg">
                <p className="font-medium text-foreground mb-1">{label}</p>
                <p className="text-muted-foreground">Compliance: <span className="font-medium text-foreground">{payload[0]?.value}%</span></p>
                <p className="text-muted-foreground">Maturité: <span className="font-medium text-foreground">{entry?.maturity}/5</span></p>
                <p className="text-muted-foreground">Gaps critiques: <span className="font-medium text-red-500">{entry?.critical}</span></p>
                <p className="text-muted-foreground">Plans overdue: <span className="font-medium text-amber-500">{entry?.overdue_plans}</span></p>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader gradient={GRADIENTS.green} title="Framework Comparison" subtitle="Compliance & maturity across all frameworks"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucun framework disponible</p> : (
                <>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                            <XAxis dataKey="framework" tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} angle={-25} textAnchor="end" interval={0} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} tickFormatter={v => `${v}%`} width={36} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="compliance" radius={[4, 4, 0, 0]} maxBarSize={32}>
                                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="text-muted-foreground border-b border-border">
                                    <th className="text-left py-1.5 pr-2 font-medium">Framework</th>
                                    <th className="text-right py-1.5 px-2 font-medium">Compliance</th>
                                    <th className="text-right py-1.5 px-2 font-medium">Maturité</th>
                                    <th className="text-right py-1.5 px-2 font-medium text-red-500">Critiques</th>
                                    <th className="text-right py-1.5 pl-2 font-medium text-amber-500">Overdue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((fw, i) => (
                                    <tr key={fw.framework} className="border-b border-border/50 hover:bg-muted/20">
                                        <td className="py-1.5 pr-2 text-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                {fw.framework}
                                            </span>
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-medium" style={{ color: scoreColor(fw.compliance) }}>{fw.compliance}%</td>
                                        <td className="py-1.5 px-2 text-right text-muted-foreground">{fw.maturity}/5</td>
                                        <td className="py-1.5 px-2 text-right text-red-500 font-medium">{fw.critical}</td>
                                        <td className="py-1.5 pl-2 text-right text-amber-500 font-medium">{fw.overdue_plans}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </Card>
    );
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function MaturityRadar({ data }: { data: RadarItem[] }) {
    return (
        <Card>
            <CardHeader gradient={GRADIENTS.violet} title="Maturité par framework"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucun assessment disponible</p> : (
                <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={data}>
                        <PolarGrid stroke="currentColor" className="opacity-10" />
                        <PolarAngleAxis dataKey="framework" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${v}/5`, 'Score']} />
                        <Radar name="Actuel" dataKey="score" stroke="#e11d48" fill="#e11d48" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name="Cible" dataKey="target" stroke="#94a3b8" fill="transparent" strokeDasharray="4 2" strokeWidth={1} />
                    </RadarChart>
                </ResponsiveContainer>
            )}
            <div className="flex gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-3 h-0.5 bg-red-600 inline-block rounded" /> Actuel</span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-3 h-0.5 bg-slate-400 inline-block rounded" /> Cible</span>
            </div>
        </Card>
    );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function ComplianceHeatmap({ data }: { data: HeatmapRow[] }) {
    return (
        <Card>
            <CardHeader gradient={GRADIENTS.orange} title="Compliance heatmap"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucune donnée disponible</p> : (
                <>
                    <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `120px repeat(${data[0]?.scores.length ?? 1}, 1fr)` }}>
                        <div />
                        {data[0]?.scores.map(s => <div key={s.bu} className="text-[10px] text-muted-foreground text-center font-medium truncate">{s.bu}</div>)}
                    </div>
                    {data.map(row => (
                        <div key={row.framework} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `120px repeat(${row.scores.length}, 1fr)` }}>
                            <div className="text-[10px] text-muted-foreground flex items-center truncate pr-2">{row.framework}</div>
                            {row.scores.map(s => (
                                <div key={s.bu} className={`h-6 rounded text-[10px] flex items-center justify-center font-medium ${heatColor(s.score)}`}>
                                    {s.score > 0 ? s.score : '—'}
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className="flex gap-3 mt-3">
                        {[
                            { label: 'Non conforme', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
                            { label: 'Partiel', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
                            { label: 'Conforme', cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
                        ].map(l => (
                            <span key={l.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span className={`w-3 h-3 rounded-sm inline-block ${l.cls}`} />{l.label}
                            </span>
                        ))}
                    </div>
                </>
            )}
        </Card>
    );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed({ data }: { data: ActivityItem[] }) {
    return (
        <Card>
            <CardHeader gradient={GRADIENTS.green} title="Activité récente"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucune activité récente</p> : (
                <div className="flex flex-col divide-y divide-border">
                    {data.map(item => (
                        <div key={item.id} className="flex items-start gap-3 py-2.5">
                            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${activityDot(item.type)}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground leading-snug">{item.message || 'Nouvelle notification'}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                            </div>
                            {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Deadlines ────────────────────────────────────────────────────────────────

function UpcomingDeadlines({ data }: { data: DeadlineItem[] }) {
    return (
        <Card>
            <CardHeader gradient={GRADIENTS.red} title="Deadlines à venir"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
            />
            {data.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucune deadline à venir</p> : (
                <div className="flex flex-col divide-y divide-border">
                    {data.map(d => (
                        <div key={`${d.type}-${d.id}`} className="flex items-center justify-between py-2.5 gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground truncate">{d.name}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{d.type === 'test' ? 'Req. Test' : 'Action Plan'} · {d.due_date}</p>
                            </div>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${deadlineChip(d.status)}`}>
                                {deadlineLabel(d.status)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function Dashboard({
    kpis, recentActivity, deadlines, radarData, heatmapData,
    businessUnitCompliance, complianceEvolution, topCriticalGaps,
    overdueActionPlans, executiveSummary, recommendations,
    processCompliance, frameworkComparison, allPlans,
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-4 p-4 overflow-x-auto">

                {/* ── KPI Overview ─────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ScoreRing score={kpis.compliance_score} maturity={kpis.avg_maturity} />
                    <GradientKpiCard
                        label="Action Plans"
                        value={kpis.action_plans.total}
                        sub={`${kpis.action_plans.in_progress} en cours · ${kpis.action_plans.done} terminés`}
                        badge={kpis.action_plans.overdue > 0 ? `${kpis.action_plans.overdue} overdue` : 'Aucun overdue'}
                        badgeColor={kpis.action_plans.overdue > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'}
                        gradient={GRADIENTS.amber}
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
                    />
                    <GradientKpiCard
                        label="Gap Assessments"
                        value={kpis.gap_assessments.total}
                        sub={`${kpis.gap_assessments.this_month} ce mois · Score moy. ${kpis.gap_assessments.avg_score}`}
                        badge={`Score moyen ${kpis.gap_assessments.avg_score}/100`}
                        badgeColor="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                        gradient={GRADIENTS.blue}
                        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>}
                    />
                </div>

                {/* ── Executive Summary ─────────────────────────────────────── */}
                <SectionDivider label="Executive Overview" />
                <ExecutiveSummaryWidget data={executiveSummary} />

                {/* ── Trends & Intelligence ─────────────────────────────────── */}
                <SectionDivider label="Trends & Intelligence" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ComplianceEvolution data={complianceEvolution} />
                    <SmartRecommendations data={recommendations} />
                </div>

                {/* ── Business Analysis ─────────────────────────────────────── */}
                <SectionDivider label="Business Analysis" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BuComplianceChart data={businessUnitCompliance} />
                    <ProcessComplianceWidget data={processCompliance} />
                </div>

                {/* ── Risk & Remediation ────────────────────────────────────── */}
                <SectionDivider label="Risk & Remediation" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TopCriticalGaps data={topCriticalGaps} />
                    <OverdueActionPlansWidget data={overdueActionPlans} />
                </div>

                {/* ── Framework Intelligence ────────────────────────────────── */}
                <SectionDivider label="Framework Intelligence" />
                <FrameworkComparison data={frameworkComparison} />

                {/* ── Operational Views ─────────────────────────────────────── */}
                <SectionDivider label="Operational Views" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MaturityRadar data={radarData} />
                    <ComplianceHeatmap data={heatmapData} />
                </div>

                {/* ── Activity & Calendar ───────────────────────────────────── */}
                <SectionDivider label="Activity & Calendar" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActivityFeed data={recentActivity} />
                    <UpcomingDeadlines data={deadlines} />
                </div>

            </div>

            {/* ── AI Chatbot — floating, accès global ───────────────────────── */}
            <ActionPlanChatbot
                plans={allPlans ?? []}
                kpis={kpis}
                executiveSummary={executiveSummary}
                topCriticalGaps={topCriticalGaps}
                overdueActionPlans={overdueActionPlans}
                recommendations={recommendations}
                frameworkComparison={frameworkComparison}
                businessUnitCompliance={businessUnitCompliance}
                complianceEvolution={complianceEvolution}
                processCompliance={processCompliance}
            />
        </AppLayout>
    );
}