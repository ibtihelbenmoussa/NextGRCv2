import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    ClipboardList,
    Target,
    TrendingUp,
    Lightbulb,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ChevronRight,
    Calendar,
    Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Requirement {
    id: number;
    title: string;
    code?: string;
}

interface GapAssessment {
    id: number;
    requirement_id: number;
    current_state: string | null;
    expected_state: string | null;
    gap_description: string | null;
    compliance_level: 'compliant' | 'partial' | 'non_compliant';
    score: number | null;
    recommendation: string | null;
    created_at: string;
    updated_at: string;
    requirement: Requirement;
}

interface Props {
    gapAssessment: GapAssessment;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const complianceConfig = {
    compliant: {
        label: 'Compliant',
        icon: CheckCircle2,
        color: '#22c55e',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-400',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        range: '75 – 100',
    },
    partial: {
        label: 'Partial',
        icon: AlertCircle,
        color: '#f59e0b',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-400',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        dot: 'bg-amber-500',
        range: '40 – 74',
    },
    non_compliant: {
        label: 'Non Compliant',
        icon: XCircle,
        color: '#ef4444',
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-400',
        pill: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        dot: 'bg-red-500',
        range: '0 – 39',
    },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
    icon: Icon,
    title,
    description,
    children,
    accent,
    empty,
}: {
    icon: React.ElementType;
    title: string;
    description?: string;
    children?: React.ReactNode;
    accent?: string;
    empty?: string;
}) {
    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="flex items-start gap-3 px-5 py-4 border-b border-border bg-muted/30">
                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ backgroundColor: accent ? `${accent}18` : undefined }}
                >
                    <Icon className="h-4 w-4" style={{ color: accent ?? 'currentColor' }} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
            </div>
            <div className="p-5">
                {children ?? (
                    <p className="text-sm text-muted-foreground italic">{empty ?? '—'}</p>
                )}
            </div>
        </div>
    );
}

function ReadField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {label}
            </p>
            <div className="text-sm text-foreground leading-relaxed">{children}</div>
        </div>
    );
}

function Prose({ value }: { value: string | null }) {
    if (!value) return <span className="text-muted-foreground italic text-sm">Not provided</span>;
    return <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Show({ gapAssessment }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Gap Assessment', href: '/gapassessment' },
        { title: gapAssessment.requirement?.title ?? 'Assessment', href: `/gapassessment/${gapAssessment.id}` },
    ];

    const compliance = complianceConfig[gapAssessment.compliance_level] ?? null;
    const ComplianceIcon = compliance?.icon;
    const score = gapAssessment.score;

    const handleDelete = () => {
        router.delete(`/gapassessment/${gapAssessment.id}`, {
            onSuccess: () => setDeleteDialogOpen(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={gapAssessment.requirement?.title ?? 'Gap Assessment'} />

            <div className="space-y-6 p-4">

                {/* ── Page header ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm">
                            <ClipboardList className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {gapAssessment.requirement?.title ?? 'Gap Assessment'}
                                </h1>
                                {compliance && ComplianceIcon && (
                                    <span className={cn(
                                        'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                                        compliance.pill,
                                    )}>
                                        <span className={cn('w-1.5 h-1.5 rounded-full', compliance.dot)} />
                                        {compliance.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                {gapAssessment.requirement?.code && (
                                    <span className="flex items-center gap-1 font-mono">
                                        <Hash className="h-3 w-3" />
                                        {gapAssessment.requirement.code}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(gapAssessment.created_at).toLocaleDateString('fr-TN', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Link href="/gapassessment">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <Link href={`/gapassessment/${gapAssessment.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* ── Main layout ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">

                    {/* ── Left column ── */}
                    <div className="flex flex-col gap-6">

                        {/* State Analysis */}
                        <Section
                            icon={Target}
                            title="State Analysis"
                            description="Current situation vs. target state"
                            accent="#8b5cf6"
                        >
                            <div className="flex flex-col gap-5">
                                <ReadField label="Current State">
                                    <Prose value={gapAssessment.current_state} />
                                </ReadField>

                                <div className="flex items-center gap-2 text-muted-foreground/40">
                                    <div className="h-px flex-1 bg-border" />
                                    <ChevronRight className="h-3.5 w-3.5" />
                                    <div className="h-px flex-1 bg-border" />
                                </div>

                                <ReadField label="Expected State">
                                    <Prose value={gapAssessment.expected_state} />
                                </ReadField>

                                {/* Gap divider */}
                                <div className="flex items-center gap-3 py-1">
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 select-none">
                                        Gap
                                    </span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>

                                <ReadField label="Gap Description">
                                    <Prose value={gapAssessment.gap_description} />
                                </ReadField>
                            </div>
                        </Section>

                        {/* Recommendation */}
                        <Section
                            icon={Lightbulb}
                            title="Recommendation"
                            description="Actionable steps to close the identified gap"
                            accent="#f59e0b"
                        >
                            <Prose value={gapAssessment.recommendation} />
                        </Section>
                    </div>

                    {/* ── Right column ── */}
                    <div className="flex flex-col gap-4">

                        {/* Score card */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                            <div className="flex items-start gap-3 px-5 py-4 border-b border-border bg-muted/30">
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                                    style={{ backgroundColor: '#10b98118' }}
                                >
                                    <TrendingUp className="h-4 w-4" style={{ color: '#10b981' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Compliance Score</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Current assessment result
                                    </p>
                                </div>
                            </div>
                            <div className="p-5 flex flex-col gap-4">

                                {/* Big score number */}
                                <div className="flex items-end gap-1">
                                    <span className="text-5xl font-bold tabular-nums leading-none" style={{ color: compliance?.color }}>
                                        {score !== null ? score : '—'}
                                    </span>
                                    {score !== null && (
                                        <span className="text-xl font-semibold text-muted-foreground mb-1">%</span>
                                    )}
                                </div>

                                {/* Bar */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: score !== null ? `${Math.min(100, Math.max(0, score))}%` : '0%',
                                                backgroundColor: compliance?.color ?? '#e5e7eb',
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                                        <span>0</span>
                                        <span>40</span>
                                        <span>75</span>
                                        <span>100</span>
                                    </div>
                                </div>

                                {/* Compliance badge */}
                                {compliance && ComplianceIcon && (
                                    <div className={cn(
                                        'flex items-center gap-2.5 rounded-lg border px-4 py-3',
                                        compliance.bg,
                                        compliance.border,
                                    )}>
                                        <ComplianceIcon className={cn('h-5 w-5 shrink-0', compliance.text)} />
                                        <div>
                                            <p className={cn('text-sm font-semibold', compliance.text)}>
                                                {compliance.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Range: {compliance.range}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Scale legend */}
                                <div className="flex flex-col gap-1.5 pt-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                                        Scale
                                    </p>
                                    {Object.entries(complianceConfig).map(([key, cfg]) => {
                                        const Icon = cfg.icon;
                                        const isActive = key === gapAssessment.compliance_level;
                                        return (
                                            <div
                                                key={key}
                                                className={cn(
                                                    'flex items-center justify-between rounded-md px-2 py-1 transition-colors',
                                                    isActive && cfg.bg,
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon className={cn('h-3.5 w-3.5', cfg.text)} />
                                                    <span className={cn(
                                                        'text-xs',
                                                        isActive ? cn(cfg.text, 'font-semibold') : 'text-muted-foreground',
                                                    )}>
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <span className={cn('text-[11px] font-mono px-1.5 py-0.5 rounded', cfg.pill)}>
                                                    {cfg.range}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Metadata card */}
                        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                            <div className="flex items-start gap-3 px-5 py-4 border-b border-border bg-muted/30">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 bg-muted">
                                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-semibold text-foreground mt-0.5">Metadata</p>
                            </div>
                            <div className="p-5 flex flex-col gap-4">
                                <ReadField label="Requirement">
                                    <Link
                                        href={`/requirements/${gapAssessment.requirement_id}`}
                                        className="font-medium hover:underline text-primary"
                                    >
                                        {gapAssessment.requirement?.title}
                                    </Link>
                                    {gapAssessment.requirement?.code && (
                                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                                            [{gapAssessment.requirement.code}]
                                        </span>
                                    )}
                                </ReadField>

                                <ReadField label="Created At">
                                    <span className="text-muted-foreground">
                                        {new Date(gapAssessment.created_at).toLocaleDateString('fr-TN', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                        })}
                                    </span>
                                </ReadField>

                                <ReadField label="Last Updated">
                                    <span className="text-muted-foreground">
                                        {new Date(gapAssessment.updated_at).toLocaleDateString('fr-TN', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                        })}
                                    </span>
                                </ReadField>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex flex-col gap-2">
                            <Link href={`/gapassessment/${gapAssessment.id}/edit`} className="w-full">
                                <Button variant="outline" className="w-full gap-2 h-10">
                                    <Pencil className="h-4 w-4" />
                                    Edit Assessment
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                className="w-full gap-2 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Assessment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Delete dialog ── */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this gap assessment for "
                            {gapAssessment.requirement?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}