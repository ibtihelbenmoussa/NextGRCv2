import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Framework { code: string; name: string; }

interface LastAssessment {
    score: number;
    maturity_level: number;
    created_at: string;
}

interface Requirement {
    id: number;
    code: string;
    title: string;
    priority: string;
    framework: Framework | null;
    last_assessment: LastAssessment | null;
}

interface Question {
    id: number;
    text: string;
    dimension: string;
    weight: number;
    order: number;
}

type Answer = 'YES' | 'PARTIAL' | 'NO';
type Phase = 'list' | 'assess' | 'result';

interface AssessmentResult {
    assessment_id: number;
    score: number;
    maturity_level: number;
    raw_level: number;
    gate_capped: boolean;
    gate_cap: number | null;
}

interface Props {
    requirements: Requirement[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_LABELS = ['', 'Initial', 'Developing', 'Defined', 'Managed', 'Optimizing'];
const LEVEL_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#3b82f6', '#22c55e'];
const ANSWER_VALUES: Record<Answer, number> = { YES: 1.0, PARTIAL: 0.5, NO: 0.0 };

const PRIORITY_BADGE: Record<string, string> = {
    high:   'bg-red-500/15 text-red-400 border border-red-500/20',
    medium: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
    low:    'bg-blue-500/15 text-blue-400 border border-blue-500/20',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
    const level  = getLevel(score);
    const color  = LEVEL_COLORS[level];
    const r      = (size - 8) / 2;
    const circ   = 2 * Math.PI * r;
    const dash   = (score / 100) * circ;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f1f1f" strokeWidth={8} />
                <circle
                    cx={size/2} cy={size/2} r={r}
                    fill="none" stroke={color} strokeWidth={8}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono font-bold text-sm" style={{ color }}>
                    {Math.round(score)}%
                </span>
            </div>
        </div>
    );
}

function MaturityBars({ level }: { level: number }) {
    const color = LEVEL_COLORS[level];
    return (
        <div className="flex gap-1">
            {[1,2,3,4,5].map(l => (
                <div
                    key={l}
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                        width: 20,
                        background: l <= level ? color : '#1f1f1f',
                    }}
                />
            ))}
        </div>
    );
}

function DimensionBar({
    label, answered, value,
}: { label: string; answered: boolean; value: number }) {
    const color = value === 1 ? '#22c55e' : value === 0.5 ? '#eab308' : value === 0 ? '#ef4444' : '#1f1f1f';
    const pct   = answered ? value * 100 : 0;
    const text  = !answered ? null : value === 1 ? 'YES' : value === 0.5 ? 'PARTIAL' : 'NO';

    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-24 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: answered ? color : 'transparent' }}
                />
            </div>
            {text && (
                <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded w-14 text-center"
                    style={{ background: color + '20', color }}
                >
                    {text}
                </span>
            )}
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLevel(score: number): number {
    if (score < 20) return 1;
    if (score < 40) return 2;
    if (score < 60) return 3;
    if (score < 80) return 4;
    return 5;
}

function computeClientScore(questions: Question[], answers: Record<number, Answer>): number {
    let total = 0, weights = 0;
    for (const q of questions) {
        const v = ANSWER_VALUES[answers[q.id]] ?? 0;
        total   += v * q.weight;
        weights += q.weight;
    }
    return weights > 0 ? (total / weights) * 100 : 0;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GapAssessmentIndex({ requirements }: Props) {
    // Phase state
    const [phase,     setPhase]     = useState<Phase>('list');
    const [selected,  setSelected]  = useState<Requirement | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [qIdx,      setQIdx]      = useState(0);
    const [answers,   setAnswers]   = useState<Record<number, Answer>>({});
    const [gateCap,   setGateCap]   = useState<number | null>(null);
    const [result,    setResult]    = useState<AssessmentResult | null>(null);
    const [aiText,    setAiText]    = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [animKey,   setAnimKey]   = useState(0);

    // ── Start assessment ──────────────────────────────────────────────────────
    const startAssessment = useCallback(async (req: Requirement) => {
        setLoading(true);
        try {
            const res  = await fetch(`/gap-assessment/questions/${req.id}`);
            const data = await res.json();
            setSelected(req);
            setQuestions(data.questions);
            setAnswers({});
            setQIdx(0);
            setGateCap(null);
            setResult(null);
            setAiText('');
            setPhase('assess');
            setAnimKey(k => k + 1);
        } catch {
            alert('Failed to load questions. Please try again.');
        }
        setLoading(false);
    }, []);

    // ── Handle answer ─────────────────────────────────────────────────────────
    const handleAnswer = useCallback(async (val: Answer) => {
        const currentQ   = questions[qIdx];
        const newAnswers = { ...answers, [currentQ.id]: val };
        setAnswers(newAnswers);

        // Gate check on Q1
        let cap = gateCap;
        if (currentQ.order === 1) {
            if (val === 'NO')      { cap = 1; setGateCap(1); }
            if (val === 'PARTIAL') { cap = 2; setGateCap(2); }
        }

        const isLast    = qIdx >= questions.length - 1;
        const gateStop  = currentQ.order === 1 && val === 'NO';

        if (isLast || gateStop) {
            // Submit to backend
            setLoading(true);
            try {
                const res = await fetch('/gap-assessments', {
                    method:  'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                    },
                    body: JSON.stringify({
                        requirement_id: selected!.id,
                        answers:        newAnswers,
                    }),
                });
                const data: AssessmentResult = await res.json();
                setResult(data);
                setPhase('result');
                setAnimKey(k => k + 1);
            } catch {
                alert('Failed to save assessment.');
            }
            setLoading(false);
        } else {
            setAnimKey(k => k + 1);
            setQIdx(i => i + 1);
        }
    }, [questions, qIdx, answers, gateCap, selected]);

    // ── AI feedback ───────────────────────────────────────────────────────────
    const generateAI = useCallback(async () => {
        if (!result || !selected) return;
        setAiLoading(true);

        const answerSummary = questions.map(q =>
            `${q.dimension}: ${answers[q.id] ?? 'NOT ANSWERED'}`
        ).join(', ');

        try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model:      'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    system:     `You are a GRC compliance expert. Write a concise 3-sentence gap analysis narrative. Be specific and actionable. Return ONLY the paragraph, no headers or bullets.`,
                    messages: [{
                        role:    'user',
                        content: `Requirement: ${selected.code} - ${selected.title}
Maturity Level: ${result.maturity_level}/5 (${LEVEL_LABELS[result.maturity_level]})
Score: ${result.score}%
Answers: ${answerSummary}
Gap to Level 5: ${5 - result.maturity_level} levels.
Provide a professional gap analysis with 2-3 specific, prioritized improvement actions.`,
                    }],
                }),
            });
            const data = await res.json();
            const text = data.content?.[0]?.text ?? 'Unable to generate analysis.';
            setAiText(text);

            // Save to backend
            await fetch(`/gap-assessments/${result.assessment_id}/ai-feedback`, {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify({ feedback: text }),
            });
        } catch {
            setAiText('AI analysis unavailable. Please check your connection.');
        }
        setAiLoading(false);
    }, [result, selected, questions, answers]);

    // ── Render ────────────────────────────────────────────────────────────────

    const currentQ      = questions[qIdx];
    const answeredCount = Object.keys(answers).length;
    const clientScore   = computeClientScore(questions, answers);
    const finalLevel    = result
        ? result.maturity_level
        : (gateCap ? Math.min(getLevel(clientScore), gateCap) : getLevel(clientScore));

    return (
        <AppLayout breadcrumbs={[
            { title: 'Compliance Management', href: '#' },
            { title: 'Gap Assessment', href: '/gap-assessment' },
        ]}>
            <div className="px-8 py-8 max-w-5xl mx-auto">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
                        Gap Assessment
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Evaluate compliance maturity through adaptive Yes/No questionnaires
                    </p>
                </div>

                {/* ══ PHASE: LIST ══════════════════════════════════════════════ */}
                {phase === 'list' && (
                    <div>
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {[
                                { label: 'Total Requirements', value: requirements.length },
                                { label: 'Assessed',           value: requirements.filter(r => r.last_assessment).length },
                                { label: 'Pending Assessment', value: requirements.filter(r => !r.last_assessment).length },
                            ].map(stat => (
                                <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                                    <p className="text-xs text-zinc-500 mb-2">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Requirements list */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Requirements
                                </span>
                                <span className="text-xs text-zinc-600">
                                    Click a row to start assessment
                                </span>
                            </div>

                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-800/50">
                                        {['Code', 'Title', 'Framework', 'Priority', 'Last Score', 'Maturity', ''].map(h => (
                                            <th key={h} className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {requirements.map((req, i) => {
                                        const la    = req.last_assessment;
                                        const color = la ? LEVEL_COLORS[la.maturity_level] : undefined;
                                        return (
                                            <tr
                                                key={req.id}
                                                className="border-b border-zinc-800/30 hover:bg-zinc-800/40 transition-colors cursor-pointer"
                                                onClick={() => startAssessment(req)}
                                            >
                                                <td className="px-5 py-3.5">
                                                    <span className="font-mono text-xs font-semibold text-zinc-300">
                                                        {req.code}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 max-w-xs">
                                                    <span className="text-sm text-zinc-200 line-clamp-1">
                                                        {req.title}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {req.framework && (
                                                        <span className="text-xs text-zinc-500">
                                                            {req.framework.code}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${PRIORITY_BADGE[req.priority] ?? ''}`}>
                                                        {req.priority}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {la ? (
                                                        <span className="font-mono text-sm font-bold" style={{ color }}>
                                                            {Math.round(la.score)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-zinc-600">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {la ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold" style={{ color }}>
                                                                L{la.maturity_level}
                                                            </span>
                                                            <MaturityBars level={la.maturity_level} />
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-zinc-600">Not assessed</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button
                                                        className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                                                        onClick={e => { e.stopPropagation(); startAssessment(req); }}
                                                    >
                                                        {la ? 'Re-assess →' : 'Start →'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {requirements.length === 0 && (
                                <div className="py-16 text-center text-zinc-600 text-sm">
                                    No active requirements found. Activate requirements first.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══ PHASE: ASSESS ════════════════════════════════════════════ */}
                {phase === 'assess' && currentQ && (
                    <div key={`assess-${animKey}`} style={{ animation: 'fadeSlideIn 0.25s ease' }}>
                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <span className="text-xs text-zinc-500 font-mono">{selected?.code}</span>
                                <span className="text-xs text-zinc-600 mx-2">—</span>
                                <span className="text-xs text-zinc-400">{selected?.title}</span>
                            </div>
                            <button
                                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                                onClick={() => setPhase('list')}
                            >
                                ← Back to list
                            </button>
                        </div>

                        {/* Progress */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-zinc-500 shrink-0">
                                {qIdx + 1} / {questions.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-5 gap-5">
                            {/* Question card — left */}
                            <div className="col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-7">
                                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
                                    Question {qIdx + 1} · {currentQ.dimension}
                                </div>
                                <p className="text-xl font-semibold text-white leading-relaxed mb-10">
                                    {currentQ.text}
                                </p>

                                {/* Answer buttons */}
                                <div className="flex gap-3">
                                    {(['YES', 'PARTIAL', 'NO'] as Answer[]).map(val => {
                                        const styles: Record<Answer, string> = {
                                            YES:     'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500',
                                            PARTIAL: 'border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500',
                                            NO:      'border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500',
                                        };
                                        const labels: Record<Answer, string> = {
                                            YES: '✓ Yes', PARTIAL: '~ Partial', NO: '✕ No',
                                        };
                                        return (
                                            <button
                                                key={val}
                                                disabled={loading}
                                                onClick={() => handleAnswer(val)}
                                                className={`flex-1 py-4 rounded-xl border-2 font-bold text-sm transition-all duration-150 ${styles[val]} disabled:opacity-40`}
                                            >
                                                {labels[val]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live progress — right */}
                            <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
                                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                    Live Progress
                                </div>
                                <div className="flex flex-col gap-3">
                                    {questions.map(q => (
                                        <DimensionBar
                                            key={q.id}
                                            label={q.dimension}
                                            answered={answers[q.id] !== undefined}
                                            value={ANSWER_VALUES[answers[q.id]] ?? 0}
                                        />
                                    ))}
                                </div>

                                {/* Gate warning */}
                                {gateCap && (
                                    <div className="mt-auto p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                                        ⚠ Maturity capped at Level {gateCap}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ PHASE: RESULT ════════════════════════════════════════════ */}
                {phase === 'result' && result && selected && (
                    <div key={`result-${animKey}`} style={{ animation: 'fadeSlideIn 0.3s ease' }}>
                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <span className="text-xs font-mono text-zinc-400">{selected.code}</span>
                                <span className="mx-2 text-zinc-700">—</span>
                                <span className="text-sm font-semibold text-white">{selected.title}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                                    onClick={() => setPhase('list')}
                                >
                                    ← All Requirements
                                </button>
                                <button
                                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
                                    onClick={() => startAssessment(selected)}
                                >
                                    Retake
                                </button>
                            </div>
                        </div>

                        {/* Result cards */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Score card */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-5">
                                    Maturity Level
                                </div>
                                <div className="flex items-center gap-5 mb-6">
                                    <ScoreRing score={result.score} size={88} />
                                    <div>
                                        <div className="flex items-baseline gap-1 mb-1">
                                            <span className="text-5xl font-black" style={{ color: LEVEL_COLORS[result.maturity_level] }}>
                                                {result.maturity_level}
                                            </span>
                                            <span className="text-xl text-zinc-700 font-light">/5</span>
                                        </div>
                                        <span className="text-sm font-semibold" style={{ color: LEVEL_COLORS[result.maturity_level] }}>
                                            {LEVEL_LABELS[result.maturity_level]}
                                        </span>
                                        <div className="mt-2">
                                            <MaturityBars level={result.maturity_level} />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-zinc-800 pt-4 space-y-2.5">
                                    {[
                                        { label: 'Score',             value: `${Math.round(result.score)}%`,     color: undefined },
                                        { label: 'Gap to Level 5',    value: `${5 - result.maturity_level} levels`, color: '#ef4444' },
                                        { label: 'Questions answered', value: `${answeredCount} / ${questions.length}`, color: undefined },
                                    ].map(row => (
                                        <div key={row.label} className="flex justify-between">
                                            <span className="text-xs text-zinc-500">{row.label}</span>
                                            <span className="text-xs font-semibold" style={{ color: row.color ?? '#e5e5e5' }}>
                                                {row.value}
                                            </span>
                                        </div>
                                    ))}
                                    {result.gate_capped && (
                                        <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                                            ⚠ Capped at Level {result.gate_cap} — gate question failed
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dimension breakdown */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-5">
                                    Dimension Breakdown
                                </div>
                                <div className="flex flex-col gap-3 mb-5">
                                    {questions.map(q => (
                                        <DimensionBar
                                            key={q.id}
                                            label={q.dimension}
                                            answered={answers[q.id] !== undefined}
                                            value={ANSWER_VALUES[answers[q.id]] ?? 0}
                                        />
                                    ))}
                                </div>

                                <div className="border-t border-zinc-800 pt-4">
                                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
                                        Answer Summary
                                    </div>
                                    {questions.map(q => {
                                        const ans   = answers[q.id];
                                        const color = ans === 'YES' ? '#22c55e' : ans === 'PARTIAL' ? '#eab308' : ans === 'NO' ? '#ef4444' : '#3f3f46';
                                        return (
                                            <div key={q.id} className="flex justify-between items-center py-1">
                                                <span className="text-xs text-zinc-500">Q{q.order}: {q.dimension}</span>
                                                <span
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded"
                                                    style={{ background: color + '20', color }}
                                                >
                                                    {ans ?? '—'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* AI Analysis */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                    ✦ AI Gap Analysis & Recommendations
                                </div>
                                {!aiText && (
                                    <button
                                        onClick={generateAI}
                                        disabled={aiLoading}
                                        className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                                    >
                                        {aiLoading ? (
                                            <>
                                                <span className="animate-spin">⟳</span> Generating...
                                            </>
                                        ) : '✦ Generate Analysis'}
                                    </button>
                                )}
                            </div>

                            {aiText ? (
                                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
                                    <p className="text-sm text-zinc-400 leading-relaxed">{aiText}</p>
                                </div>
                            ) : (
                                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-10 text-center">
                                    <div className="text-3xl mb-3 text-zinc-700">✦</div>
                                    <p className="text-sm text-zinc-600">
                                        Click "Generate Analysis" to get AI-powered recommendations
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-8 py-6 text-sm text-zinc-300 flex items-center gap-3">
                            <span className="animate-spin text-red-500 text-xl">⟳</span>
                            Processing...
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </AppLayout>
    );
}