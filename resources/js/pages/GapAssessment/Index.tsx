import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    Search,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    XCircle,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
    requirement: Requirement;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedGapAssessments {
    data: GapAssessment[];
    links: PaginationLink[];
    total: number;
    from: number;
    to: number;
}

interface Props {
    gapAssessments: PaginatedGapAssessments;
    filters?: { search?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Compliance Management', href: '/compliance-management' },
    { title: 'Gap Assessment', href: '/gapassessment' },
];

const complianceConfig = {
    compliant: {
        label: 'Compliant',
        color: 'text-emerald-600',
        bg: 'bg-emerald-100 dark:bg-emerald-950/50',
        icon: CheckCircle2,
        border: 'border-emerald-200 dark:border-emerald-800',
    },
    partial: {
        label: 'Partial',
        color: 'text-amber-600',
        bg: 'bg-amber-100 dark:bg-amber-950/50',
        icon: AlertCircle,
        border: 'border-amber-200 dark:border-amber-800',
    },
    non_compliant: {
        label: 'Non Compliant',
        color: 'text-red-600',
        bg: 'bg-red-100 dark:bg-red-950/50',
        icon: XCircle,
        border: 'border-red-200 dark:border-red-800',
    },
};

function ScoreBar({ score }: { score: number | null }) {
    if (score === null) return <span className="text-muted-foreground text-sm">—</span>;

    const color = score >= 75 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="flex items-center gap-2 min-w-[100px]">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(Math.max(score, 0), 100)}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-xs font-medium tabular-nums w-9 text-right">{score}%</span>
        </div>
    );
}

export default function Index({ gapAssessments, filters }: Props) {
    const [search, setSearch] = useState(filters?.search ?? '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/gapassessment', { search }, { preserveState: true, replace: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this gap assessment?')) {
            router.delete(`/gapassessment/${id}`);
        }
    };

    const data = gapAssessments.data;
    const total = gapAssessments.total;

    const compliantCount = data.filter((g) => g.compliance_level === 'compliant').length;
    const partialCount = data.filter((g) => g.compliance_level === 'partial').length;
    const nonCompliantCount = data.filter((g) => g.compliance_level === 'non_compliant').length;

    const scores = data.filter((g) => g.score !== null).map((g) => g.score!);
    const avgScore = scores.length > 0
        ? Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length)
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gap Assessment" />

            <div className="space-y-6 p-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <ClipboardList className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Gap Assessment</h1>
                            <p className="text-muted-foreground mt-1">
                                Track and manage compliance gaps across requirements
                            </p>
                        </div>
                    </div>

                    <Button asChild>
                        <Link href="/gapassessment/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New Assessment
                        </Link>
                    </Button>
                </div>

                {/* KPI Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                TOTAL ASSESSMENTS
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-semibold tabular-nums">{total}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200 dark:border-emerald-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                COMPLIANT
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-semibold text-emerald-600 tabular-nums">{compliantCount}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {total > 0 ? Math.round((compliantCount / total) * 100) : 0}% of total
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200 dark:border-amber-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                PARTIAL
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-semibold text-amber-600 tabular-nums">{partialCount}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {total > 0 ? Math.round((partialCount / total) * 100) : 0}% of total
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 dark:border-red-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                NON COMPLIANT
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-semibold text-red-600 tabular-nums">{nonCompliantCount}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {total > 0 ? Math.round((nonCompliantCount / total) * 100) : 0}% of total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">AVERAGE SCORE</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-end gap-2">
                            <p className="text-4xl font-semibold tabular-nums">
                                {avgScore !== null ? avgScore : '—'}
                            </p>
                            {avgScore !== null && <span className="text-xl text-muted-foreground mb-1">%</span>}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card>
                    <CardHeader className="px-6 py-4 border-b">
                        <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by requirement title or code..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit" variant="secondary" size="sm">
                                Search
                            </Button>
                        </form>
                    </CardHeader>

                    <CardContent className="p-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                                <ClipboardList className="h-12 w-12 opacity-40" />
                                <div className="text-center">
                                    <p className="font-medium">No gap assessments found</p>
                                    <p className="text-sm mt-1">Create your first assessment to get started</p>
                                </div>
                                <Button asChild variant="outline">
                                    <Link href="/gapassessment/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Assessment
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[38%]">Requirement</TableHead>
                                        <TableHead>Compliance Level</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead className="hidden md:table-cell">Gap Description</TableHead>
                                        <TableHead className="hidden lg:table-cell">Created At</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((assessment) => {
                                        const cfg = complianceConfig[assessment.compliance_level];
                                        const Icon = cfg.icon;

                                        return (
                                            <TableRow key={assessment.id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        {assessment.requirement?.code && (
                                                            <span className="font-mono text-xs text-muted-foreground">
                                                                {assessment.requirement.code}
                                                            </span>
                                                        )}
                                                        <span className="font-medium line-clamp-1">
                                                            {assessment.requirement?.title ?? '—'}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border",
                                                        cfg.bg,
                                                        cfg.border
                                                    )}>
                                                        <Icon className={cn("h-4 w-4", cfg.color)} />
                                                        <span className={cfg.color}>{cfg.label}</span>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <ScoreBar score={assessment.score} />
                                                </TableCell>

                                                <TableCell className="hidden md:table-cell max-w-xs">
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {assessment.gap_description ?? '—'}
                                                    </p>
                                                </TableCell>

                                                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                                                    {new Date(assessment.created_at).toLocaleDateString('fr-TN', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </TableCell>

                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/gapassessment/${assessment.id}`} className="flex items-center gap-2">
                                                                    <Eye className="h-4 w-4" /> View
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/gapassessment/${assessment.id}/edit`} className="flex items-center gap-2">
                                                                    <Pencil className="h-4 w-4" /> Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={() => handleDelete(assessment.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>

                    {/* Pagination */}
                    {gapAssessments.links && gapAssessments.links.length > 3 && (
                        <div className="flex items-center justify-between border-t px-6 py-4 text-sm">
                            <p className="text-muted-foreground">
                                Showing {gapAssessments.from}–{gapAssessments.to} of {gapAssessments.total} assessments
                            </p>
                            <div className="flex gap-1">
                                {gapAssessments.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="min-w-[38px]"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}