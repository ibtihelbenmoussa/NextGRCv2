// resources/js/Pages/PredefinedTestRequirements/Index.tsx
import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next'; // ← ajouté
import type { ColumnDef } from '@tanstack/react-table';
import type { PaginatedData } from '@/types';

import AppLayout from '@/layouts/app-layout';
import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  CheckCircle2, ClipboardList, Eye,
  Pencil, Plus, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Requirement {
  id: number;
  code: string;
  title: string;
}

interface PredefinedTest {
  id: number;
  test_code: string;
  test_name: string;
  objective?: string | null;
  procedure?: string | null;
  requirement: Requirement | null;
  created_at: string;
}

interface Props {
  tests: PaginatedData<PredefinedTest>;
}

// ─── Soft Badge ───────────────────────────────────────────────────────────────
function SoftBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4] border-transparent',
        className
      )}
    >
      {children}
    </Badge>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function PredefinedTestsIndex({ tests }: Props) {
  const { t } = useTranslation(); // ← ajouté
  const { flash } = usePage<{ flash?: { success?: string } }>().props;

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewTest, setViewTest] = useState<PredefinedTest | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [flashVisible, setFlashVisible] = useState(true);

  useEffect(() => {
    if (!flash?.success) return;
    setFlashVisible(true);
    const timer = setTimeout(() => setFlashVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [flash?.success]);

  const handleDelete = () => {
    if (!deleteId) return;
    router.delete(route('predefinedTestReq.destroy', deleteId), {
      preserveScroll: true,
      onSuccess: () => setDeleteId(null),
    });
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch(
        `${route('predefinedTestReq.export')}?${params.toString()}`,
        { method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' } }
      );
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `predefined-tests-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  // ── Columns — dépend de t pour se mettre à jour au changement de langue ────
  const columns = useMemo<ColumnDef<PredefinedTest>[]>(
    () => [
      {
        accessorKey: 'test_code',
        header: ({ column }) => (
          <div className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <DataTableColumnHeader column={column} title={t('predefinedTestReq.testCode')} />
          </div>
        ),
        cell: ({ row }) => (
          <div className="font-mono font-medium text-sm">{row.getValue('test_code')}</div>
        ),
        size: 150,
      },
      {
        accessorKey: 'test_name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('predefinedTestReq.testName')} />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('test_name')}</div>
        ),
      },
      {
        accessorKey: 'objective',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('predefinedTestReq.objective')} />
        ),
        cell: ({ row }) => {
          const val = row.getValue('objective') as string | null;
          if (!val) return <span className="text-muted-foreground">—</span>;
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="line-clamp-2 text-sm text-muted-foreground cursor-help">{val}</span>
                </TooltipTrigger>
                <TooltipContent><p className="max-w-xs">{val}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        accessorKey: 'procedure',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('predefinedTestReq.procedure')} />
        ),
        cell: ({ row }) => {
          const val = row.getValue('procedure') as string | null;
          if (!val) return <span className="text-muted-foreground">—</span>;
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="line-clamp-2 text-sm text-muted-foreground cursor-help">{val}</span>
                </TooltipTrigger>
                <TooltipContent><p className="max-w-xs">{val}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        accessorKey: 'requirement.code',
        header: ({ column }) => (
          <div className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <DataTableColumnHeader column={column} title={t('predefinedTestReq.requirement')} />
          </div>
        ),
        cell: ({ row }) => {
          const req = row.original.requirement;
          if (!req) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-2">
              <SoftBadge>{req.code}</SoftBadge>
              <span className="text-sm text-muted-foreground truncate max-w-[180px]">{req.title}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('predefinedTestReq.created')} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.getValue('created_at')), 'MMM d, yyyy')}
          </span>
        ),
        size: 140,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const test = row.original;
          return (
            <div className="flex justify-end gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setViewTest(test)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('predefinedTestReq.view')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon"
                      onClick={() => router.visit(route('predefinedTestReq.edit', test.id))}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('predefinedTestReq.edit')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(test.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('predefinedTestReq.delete')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
        size: 120,
      },
    ],
    [t] // ← dépend de t
  );

  return (
    <AppLayout>
      <Head title={t('predefinedTestReq.title')} />

      <div className="space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('predefinedTestReq.title')}
            </h1>
            <p className="text-muted-foreground mt-1.5">
              {t('predefinedTestReq.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href={route('predefinedTestReq.create')}>
                <Plus className="mr-2 h-4 w-4" />
                {t('predefinedTestReq.newTest')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Flash Message */}
        {flash?.success && flashVisible && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {flash.success}
            </p>
            <Button variant="ghost" size="sm"
              onClick={() => setFlashVisible(false)}
              className="ml-auto h-7 w-7 p-0 text-emerald-500/70 hover:text-emerald-600">
              ×
            </Button>
          </div>
        )}

        {/* Main Table */}
        <ServerDataTable
          columns={columns}
          data={tests}
          searchPlaceholder={t('predefinedTestReq.searchPlaceholder')}
          onExport={handleExport}
          exportLoading={exportLoading}
          initialState={{ sorting: [{ id: 'created_at', desc: true }] }}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('predefinedTestReq.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('predefinedTestReq.confirmDeleteDesc')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('predefinedTestReq.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90">
                {t('predefinedTestReq.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Details Sheet */}
        <Sheet open={!!viewTest} onOpenChange={() => setViewTest(null)}>
          <SheetContent className="sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5" />
                {t('predefinedTestReq.details')}
              </SheetTitle>
            </SheetHeader>

            {viewTest && (
              <div className="mt-8 space-y-8">
                <div>
                  <div className="font-mono text-sm text-muted-foreground">{viewTest.test_code}</div>
                  <h2 className="text-2xl font-semibold tracking-tight mt-1">{viewTest.test_name}</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-3 space-y-8">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        {t('predefinedTestReq.objective')}
                      </div>
                      <p className="text-sm leading-relaxed">
                        {viewTest.objective || t('predefinedTestReq.noObjective')}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        {t('predefinedTestReq.procedure')}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {viewTest.procedure || t('predefinedTestReq.noProcedure')}
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        {t('predefinedTestReq.linkedRequirement')}
                      </div>
                      {viewTest.requirement ? (
                        <div className="space-y-2">
                          <SoftBadge className="text-base px-3 py-1">{viewTest.requirement.code}</SoftBadge>
                          <p className="text-sm text-muted-foreground">{viewTest.requirement.title}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{t('predefinedTestReq.noRequirement')}</p>
                      )}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        {t('predefinedTestReq.created')}
                      </div>
                      <p className="text-sm">{format(new Date(viewTest.created_at), 'PPP')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <Button variant="outline" onClick={() => setViewTest(null)} className="flex-1">
                    {t('predefinedTestReq.close')}
                  </Button>
                  <Button onClick={() => { setViewTest(null); router.visit(route('predefinedTestReq.edit', viewTest.id)); }} className="flex-1">
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('predefinedTestReq.editTest')}
                  </Button>
                  <Button variant="destructive" onClick={() => { setViewTest(null); setDeleteId(viewTest.id); }}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('predefinedTestReq.delete')}
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}