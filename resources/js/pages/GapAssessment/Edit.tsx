import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    Save,
    ClipboardList,
    Target,
    TrendingUp,
    Lightbulb,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ChevronRight,
    Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    compliance_level: string;
    score: number | null;
    recommendation: string | null;
    requirement: Requirement;
}

interface Props {
    gapAssessment: GapAssessment;
    requirements: Requirement[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getComplianceFromScore = (score: number) => {
    if (score >= 75) return 'compliant';
    if (score >= 40) return 'partial';
    return 'non_compliant';
};

const complianceConfig = {
    compliant: {
        label: 'Compliant',
        icon: CheckCircle2,
        color: '#22c55e',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-400',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
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
        range: '0 – 39',
    },
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function StepDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 select-none">
                {label}
            </span>
            <div className="h-px flex-1 bg-border" />
        </div>
    );
}

function Field({
    label,
    required,
    error,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </Label>
            {children}
            {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

function Section({
    icon: Icon,
    title,
    description,
    children,
    accent,
}: {
    icon: React.ElementType;
    title: string;
    description?: string;
    children: React.ReactNode;
    accent?: string;
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
            <div className="flex flex-col gap-5 p-5">{children}</div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Edit({ gapAssessment, requirements }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Gap Assessment', href: '/gapassessment' },
        { title: gapAssessment.requirement?.title ?? 'Assessment', href: `/gapassessment/${gapAssessment.id}` },
        { title: 'Edit', href: `/gapassessment/${gapAssessment.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm({
        requirement_id: String(gapAssessment.requirement_id),
        current_state: gapAssessment.current_state ?? '',
        expected_state: gapAssessment.expected_state ?? '',
        gap_description: gapAssessment.gap_description ?? '',
        compliance_level: gapAssessment.compliance_level ?? '',
        score: gapAssessment.score !== null ? String(gapAssessment.score) : '',
        recommendation: gapAssessment.recommendation ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/gapassessment/${gapAssessment.id}`);
    };

    const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numeric = value === '' ? '' : Number(value);
        setData('score', numeric as any);
        if (numeric !== '' && !isNaN(numeric as number)) {
            setData('compliance_level', getComplianceFromScore(numeric as number));
        } else {
            setData('compliance_level', '');
        }
    };

    const scoreNum = data.score !== '' ? Number(data.score) : null;
    const compliance = data.compliance_level
        ? complianceConfig[data.compliance_level as keyof typeof complianceConfig]
        : null;
    const ComplianceIcon = compliance?.icon;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit – ${gapAssessment.requirement?.title ?? 'Assessment'}`} />

            <div className="space-y-6 p-4">

                {/* ── Page header ── */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm">
                            <Pencil className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Edit Gap Assessment
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {gapAssessment.requirement?.code && (
                                    <span className="font-mono mr-1 text-muted-foreground/70">
                                        [{gapAssessment.requirement.code}]
                                    </span>
                                )}
                                {gapAssessment.requirement?.title}
                            </p>
                        </div>
                    </div>
                    <Link href={`/gapassessment/${gapAssessment.id}`}>
                        <Button variant="outline" size="sm" className="gap-2 shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                </div>

                {/* ── Form ── */}
                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

                        {/* ── Left column ── */}
                        <div className="flex flex-col gap-6">

                            {/* Requirement */}
                            <Section
                                icon={ClipboardList}
                                title="Requirement"
                                description="Select the requirement this assessment applies to"
                                accent="#378add"
                            >
                                <Field
                                    label="Requirement"
                                    required
                                    error={errors.requirement_id}
                                    hint="Choose from your organization's active requirements"
                                >
                                    <Select
                                        value={data.requirement_id}
                                        onValueChange={(val) => setData('requirement_id', val)}
                                    >
                                        <SelectTrigger
                                            className={cn('h-10', errors.requirement_id && 'border-red-500 focus:ring-red-500')}
                                        >
                                            <SelectValue placeholder="Select a requirement…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {requirements.map((req) => (
                                                <SelectItem key={req.id} value={String(req.id)}>
                                                    <span className="flex items-center gap-2">
                                                        {req.code && (
                                                            <span className="font-mono text-xs text-muted-foreground">
                                                                [{req.code}]
                                                            </span>
                                                        )}
                                                        {req.title}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </Section>

                            {/* State Analysis */}
                            <Section
                                icon={Target}
                                title="State Analysis"
                                description="Document the current situation and the target state"
                                accent="#8b5cf6"
                            >
                                <Field label="Current State" error={errors.current_state}>
                                    <Textarea
                                        rows={3}
                                        placeholder="Describe what is currently in place…"
                                        value={data.current_state}
                                        onChange={(e) => setData('current_state', e.target.value)}
                                        className={cn('resize-none', errors.current_state && 'border-red-500')}
                                    />
                                </Field>

                                <div className="flex items-center gap-2 text-muted-foreground/40">
                                    <div className="h-px flex-1 bg-border" />
                                    <ChevronRight className="h-3.5 w-3.5" />
                                    <div className="h-px flex-1 bg-border" />
                                </div>

                                <Field label="Expected State" error={errors.expected_state}>
                                    <Textarea
                                        rows={3}
                                        placeholder="Describe the desired / target state…"
                                        value={data.expected_state}
                                        onChange={(e) => setData('expected_state', e.target.value)}
                                        className={cn('resize-none', errors.expected_state && 'border-red-500')}
                                    />
                                </Field>

                                <StepDivider label="Gap" />

                                <Field
                                    label="Gap Description"
                                    error={errors.gap_description}
                                    hint="What is missing between the current and expected state?"
                                >
                                    <Textarea
                                        rows={4}
                                        placeholder="Describe the gap in detail…"
                                        value={data.gap_description}
                                        onChange={(e) => setData('gap_description', e.target.value)}
                                        className={cn('resize-none', errors.gap_description && 'border-red-500')}
                                    />
                                </Field>
                            </Section>

                            {/* Recommendation */}
                            <Section
                                icon={Lightbulb}
                                title="Recommendation"
                                description="Provide actionable steps to close the identified gap"
                                accent="#f59e0b"
                            >
                                <Field label="Recommendation" error={errors.recommendation}>
                                    <Textarea
                                        rows={5}
                                        placeholder="Enter concrete recommendations to address the gap…"
                                        value={data.recommendation}
                                        onChange={(e) => setData('recommendation', e.target.value)}
                                        className={cn('resize-none', errors.recommendation && 'border-red-500')}
                                    />
                                </Field>
                            </Section>
                        </div>

                        {/* ── Right column ── */}
                        <div className="flex flex-col gap-4">

                            {/* Score card */}
                            <Section
                                icon={TrendingUp}
                                title="Compliance Score"
                                description="Score auto-determines the compliance level"
                                accent="#10b981"
                            >
                                <Field label="Score (%)" required error={errors.score}>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            placeholder="0 – 100"
                                            value={data.score}
                                            onChange={handleScoreChange}
                                            className={cn(
                                                'h-12 text-2xl font-bold tabular-nums pr-10 text-center',
                                                errors.score && 'border-red-500',
                                            )}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg pointer-events-none">
                                            %
                                        </span>
                                    </div>
                                </Field>

                                {/* Score bar */}
                                <div className="flex flex-col gap-2">
                                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: scoreNum !== null
                                                    ? `${Math.min(100, Math.max(0, scoreNum))}%`
                                                    : '0%',
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
                                {compliance && ComplianceIcon ? (
                                    <div className={cn(
                                        'flex items-center gap-2.5 rounded-lg border px-4 py-3 transition-all',
                                        compliance.bg,
                                        compliance.border,
                                    )}>
                                        <ComplianceIcon className={cn('h-5 w-5 shrink-0', compliance.text)} />
                                        <div>
                                            <p className={cn('text-sm font-semibold', compliance.text)}>
                                                {compliance.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Score range: {compliance.range}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-4 py-3 text-muted-foreground">
                                        <TrendingUp className="h-4 w-4 shrink-0" />
                                        <p className="text-xs">Enter a score to see the compliance level</p>
                                    </div>
                                )}

                                {/* Legend */}
                                <div className="flex flex-col gap-1.5 pt-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                                        Scale
                                    </p>
                                    {Object.entries(complianceConfig).map(([key, cfg]) => {
                                        const Icon = cfg.icon;
                                        return (
                                            <div key={key} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={cn('h-3.5 w-3.5', cfg.text)} />
                                                    <span className="text-xs text-muted-foreground">{cfg.label}</span>
                                                </div>
                                                <span className={cn('text-[11px] font-mono px-1.5 py-0.5 rounded', cfg.pill)}>
                                                    {cfg.range}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Section>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full h-11 gap-2 text-sm font-semibold shadow-sm"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Saving…' : 'Save Changes'}
                                </Button>
                                <Link href={`/gapassessment/${gapAssessment.id}`} className="w-full">
                                    <Button
                                        variant="ghost"
                                        type="button"
                                        className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}