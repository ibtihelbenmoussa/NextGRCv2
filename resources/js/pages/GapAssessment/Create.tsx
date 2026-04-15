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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, ClipboardList } from 'lucide-react';

interface Requirement {
    id: number;
    title: string;
    code?: string;
}

interface Props {
    requirements: Requirement[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Compliance Management', href: '/compliance-management' },
    { title: 'Gap Assessment', href: '/gapassessment' },
    { title: 'Create', href: '/gapassessment/create' },
];

const getComplianceFromScore = (score: number): string => {
    if (score >= 75) return 'compliant';
    if (score >= 40) return 'partial';
    return 'non_compliant';
};

const complianceLevelConfig = {
    compliant: { label: 'Compliant', color: 'text-emerald-600' },
    partial: { label: 'Partial', color: 'text-amber-600' },
    non_compliant: { label: 'Non Compliant', color: 'text-red-600' },
};

export default function Create({ requirements }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        requirement_id: '',
        current_state: '',
        expected_state: '',
        gap_description: '',
        compliance_level: '',
        score: '',
        recommendation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/gapassessment');
    };

    // Gestion du changement de score avec mise à jour automatique du niveau
    const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericScore = value === '' ? '' : Number(value);

        setData('score', numericScore as any);

        // Mise à jour automatique du compliance_level
        if (numericScore !== '' && !isNaN(numericScore)) {
            const newLevel = getComplianceFromScore(numericScore);
            setData('compliance_level', newLevel);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Gap Assessment" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">New Gap Assessment</h1>
                            <p className="text-sm text-muted-foreground">
                                Evaluate compliance gaps for a specific requirement
                            </p>
                        </div>
                    </div>
                    <Link href="/gapassessment">
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left Column – Main Fields */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Requirement Selection */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Requirement</CardTitle>
                                    <CardDescription>
                                        Select the requirement this assessment applies to
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="requirement_id">
                                            Requirement <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={data.requirement_id}
                                            onValueChange={(val) => setData('requirement_id', val)}
                                        >
                                            <SelectTrigger id="requirement_id" className={errors.requirement_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select a requirement…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {requirements.map((req) => (
                                                    <SelectItem key={req.id} value={String(req.id)}>
                                                        {req.code ? `[${req.code}] ` : ''}{req.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.requirement_id && (
                                            <p className="text-xs text-red-500">{errors.requirement_id}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Current vs Expected State */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">State Analysis</CardTitle>
                                    <CardDescription>
                                        Describe the current situation and what is expected
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="current_state">Current State</Label>
                                        <Textarea
                                            id="current_state"
                                            rows={4}
                                            placeholder="Describe the current state of compliance…"
                                            value={data.current_state}
                                            onChange={(e) => setData('current_state', e.target.value)}
                                            className={errors.current_state ? 'border-red-500' : ''}
                                        />
                                        {errors.current_state && (
                                            <p className="text-xs text-red-500">{errors.current_state}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="expected_state">Expected State</Label>
                                        <Textarea
                                            id="expected_state"
                                            rows={4}
                                            placeholder="Describe the expected / target state…"
                                            value={data.expected_state}
                                            onChange={(e) => setData('expected_state', e.target.value)}
                                            className={errors.expected_state ? 'border-red-500' : ''}
                                        />
                                        {errors.expected_state && (
                                            <p className="text-xs text-red-500">{errors.expected_state}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="gap_description">Gap Description</Label>
                                        <Textarea
                                            id="gap_description"
                                            rows={4}
                                            placeholder="Describe the gap between current and expected state…"
                                            value={data.gap_description}
                                            onChange={(e) => setData('gap_description', e.target.value)}
                                            className={errors.gap_description ? 'border-red-500' : ''}
                                        />
                                        {errors.gap_description && (
                                            <p className="text-xs text-red-500">{errors.gap_description}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recommendation */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Recommendation</CardTitle>
                                    <CardDescription>
                                        Provide actionable recommendations to close the gap
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="recommendation">Recommendation</Label>
                                        <Textarea
                                            id="recommendation"
                                            rows={5}
                                            placeholder="Enter recommendations to address the gap…"
                                            value={data.recommendation}
                                            onChange={(e) => setData('recommendation', e.target.value)}
                                            className={errors.recommendation ? 'border-red-500' : ''}
                                        />
                                        {errors.recommendation && (
                                            <p className="text-xs text-red-500">{errors.recommendation}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column – Compliance Rating */}
                        <div className="flex flex-col gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Compliance Rating</CardTitle>
                                    <CardDescription>
                                        Score determines the compliance level automatically
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-5">
                                    {/* Score */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="score">
                                            Score (%) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="score"
                                            type="number"
                                            min={0}
                                            max={100}
                                            placeholder="0 – 100"
                                            value={data.score}
                                            onChange={handleScoreChange}
                                            className={errors.score ? 'border-red-500' : ''}
                                        />
                                        {errors.score && (
                                            <p className="text-xs text-red-500">{errors.score}</p>
                                        )}

                                        {/* Visual score bar */}
                                        {data.score !== '' && (
                                            <div className="mt-2">
                                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min(100, Math.max(0, Number(data.score)))}%`,
                                                            backgroundColor:
                                                                Number(data.score) >= 75
                                                                    ? '#10b981'
                                                                    : Number(data.score) >= 40
                                                                        ? '#f59e0b'
                                                                        : '#ef4444',
                                                        }}
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground text-right">
                                                    {data.score}%
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Compliance Level (Auto-calculated + Disabled) */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="compliance_level">Compliance Level</Label>
                                        <Select
                                            value={data.compliance_level}
                                            onValueChange={() => {}} // Bloqué
                                            disabled
                                        >
                                            <SelectTrigger
                                                id="compliance_level"
                                                className={errors.compliance_level ? 'border-red-500' : ''}
                                            >
                                                <SelectValue placeholder="Auto-calculated from score" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(complianceLevelConfig).map(([value, cfg]) => (
                                                    <SelectItem key={value} value={value}>
                                                        <span className={cfg.color}>{cfg.label}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {data.compliance_level && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                ✓ Automatically calculated from score
                                            </p>
                                        )}

                                        {errors.compliance_level && (
                                            <p className="text-xs text-red-500">{errors.compliance_level}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit Buttons */}
                            <Button type="submit" disabled={processing} className="w-full gap-2">
                                <Save className="h-4 w-4" />
                                {processing ? 'Saving…' : 'Save Assessment'}
                            </Button>

                            <Link href="/gapassessment" className="w-full">
                                <Button variant="outline" type="button" className="w-full">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}