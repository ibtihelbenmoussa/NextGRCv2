// resources/js/Pages/PredefinedTestRequirements/Index.tsx
import { Head, Link, router, usePage } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { useMemo, useState } from 'react'

import type { ColumnDef } from '@tanstack/react-table'
import type { PaginatedData } from '@/types'

import AppLayout from '@/layouts/app-layout'
import { ServerDataTable } from '@/components/server-data-table'
import { DataTableColumnHeader } from '@/components/server-data-table-column-header'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { ClipboardList, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Requirement {
  id: number
  code: string
  title: string
}

interface PredefinedTest {
  id: number
  test_code: string
  test_name: string
  objective?: string | null
  procedure?: string | null
  requirement: Requirement | null
  created_at: string
}

interface Props {
  tests: PaginatedData<PredefinedTest>
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PredefinedTestsIndex({ tests }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewTest, setViewTest] = useState<PredefinedTest | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  const handleDelete = () => {
    if (!deleteId) return
    router.delete(route('predefinedTestReq.destroy', deleteId), {
      preserveScroll: true,
      onSuccess: () => setDeleteId(null),
    })
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const response = await fetch(`${route('predefinedTestReq.export')}?${params.toString()}`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `predefined-tests-${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExportLoading(false)
    }
  }

  // ── Column Definitions ──────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<PredefinedTest>[]>(
    () => [
      {
        accessorKey: 'test_code',
        header: ({ column }) => (
          <div className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <DataTableColumnHeader column={column} title="Test Code" />
          </div>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
            {row.getValue('test_code')}
          </Badge>
        ),
        size: 150,
      },
      {
        accessorKey: 'test_name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Test Name" />
        ),
        cell: ({ row }) => (
          <div className="font-medium line-clamp-2 max-w-[240px]">
            {row.getValue('test_name')}
          </div>
        ),
      },
      {
        accessorKey: 'objective',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Objective" />
        ),
        cell: ({ row }) => {
          const val = row.getValue('objective') as string | null
          return val ? (
            <p className="text-sm text-muted-foreground line-clamp-2 max-w-[260px]">
              {val}
            </p>
          ) : (
            <span className="text-muted-foreground/70 italic text-xs">—</span>
          )
        },
      },
      {
        accessorKey: 'procedure',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Procedure" />
        ),
        cell: ({ row }) => {
          const val = row.getValue('procedure') as string | null
          return val ? (
            <p className="text-sm text-muted-foreground line-clamp-2 max-w-[260px]">
              {val}
            </p>
          ) : (
            <span className="text-muted-foreground/70 italic text-xs">—</span>
          )
        },
      },
      {
        accessorKey: 'requirement.code',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Requirement" />
        ),
        cell: ({ row }) => {
          const req = row.original.requirement
          return req ? (
            <div className="flex items-center gap-2 max-w-[220px]">
              <Badge variant="outline" className="font-mono text-xs">
                {req.code}
              </Badge>
              <span className="text-sm text-muted-foreground truncate">
                {req.title}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground italic">—</span>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {format(new Date(row.getValue('created_at')), 'MMM d, yyyy')}
          </div>
        ),
        size: 140,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const test = row.original
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => setViewTest(test)}
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                onClick={() => router.visit(route('predefinedTestReq.edit', test.id))}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteId(test.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
        size: 120,
      },
    ],
    []
  )

  return (
    <AppLayout breadcrumbs={[{ title: 'Predefined Tests', href: '' }]}>
      <Head title="Predefined Tests" />

      <div className="container mx-auto space-y-6 py-6 px-4 md:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Predefined Tests</h1>
            <p className="text-muted-foreground mt-1.5">
              Manage standardized compliance test templates per requirement
            </p>
          </div>

          <Button asChild>
            <Link href={route('predefinedTestReq.create')}>
              <Plus className="mr-2 h-4 w-4" />
              New Predefined Test
            </Link>
          </Button>
        </div>

        {/* Flash message */}
        {flash?.success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg px-4 py-3 text-sm">
            {flash.success}
          </div>
        )}

        {/* Main Table */}
        <ServerDataTable
          columns={columns}
          data={tests}
          searchPlaceholder="Search test code, name, objective, requirement..."
          onExport={handleExport}
          exportLoading={exportLoading}
          initialState={{
            columnPinning: { right: ['actions'] },
            sorting: [{ id: 'created_at', desc: true }],
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Predefined Test</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete this predefined test?
                <br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Details Sheet */}
        <Sheet open={!!viewTest} onOpenChange={open => !open && setViewTest(null)}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader className="pb-4 border-b border-border/60">
              <SheetTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Predefined Test Details
              </SheetTitle>
              {viewTest && (
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {viewTest.test_code}
                  </span>
                  —
                  <span className="font-medium">{viewTest.test_name}</span>
                </SheetDescription>
              )}
            </SheetHeader>

            {viewTest && (
              <div className="mt-6 space-y-6">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Requirement
                  </p>
                  {viewTest.requirement ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {viewTest.requirement.code}
                      </Badge>
                      <span className="text-sm">{viewTest.requirement.title}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">No requirement linked</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Objective
                  </p>
                  <p
                    className={cn(
                      "text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-lg border",
                      viewTest.objective
                        ? "bg-muted/30 border-border/40"
                        : "text-muted-foreground italic bg-muted/20"
                    )}
                  >
                    {viewTest.objective || "No objective defined."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Procedure / Steps
                  </p>
                  <p
                    className={cn(
                      "text-sm leading-relaxed whitespace-pre-wrap p-3 rounded-lg border",
                      viewTest.procedure
                        ? "bg-muted/30 border-border/40"
                        : "text-muted-foreground italic bg-muted/20"
                    )}
                  >
                    {viewTest.procedure || "No procedure defined."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Created At
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(viewTest.created_at), 'PPP')}
                  </p>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

      </div>
    </AppLayout>
  )
}