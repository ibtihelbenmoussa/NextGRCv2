import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useState, useEffect, useRef } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Test {
  id: number;
  status: string;
  comment?: string;
  evidence?: any;
  test_date?: string;
  validation_status: 'pending' | 'accepted' | 'rejected';
  validation_comment?: string;
  created_at: string;
  requirement?: {
    code: string;
    title: string;
  };
}

interface Counts {
  all: number;
  pending: number;
  accepted: number;
  rejected: number;
}

interface Props {
  tests: {
    data: Test[];
    links: any;
    meta: any;
  };
  counts: Counts;
  tab: 'all' | 'pending' | 'accepted' | 'rejected';
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const validationStyles: Record<string, { pill: string; dot: string }> = {
  accepted: {
    pill: 'bg-[#EAF3DE] text-[#27500A] dark:bg-[#27500A] dark:text-[#C0DD97]',
    dot:  'bg-[#3B6D11] dark:bg-[#97C459]',
  },
  rejected: {
    pill: 'bg-[#FCEBEB] text-[#501313] dark:bg-[#501313] dark:text-[#F7C1C1]',
    dot:  'bg-[#A32D2D] dark:bg-[#E24B4A]',
  },
  pending: {
    pill: 'bg-[#FAEEDA] text-[#412402] dark:bg-[#412402] dark:text-[#FAC775]',
    dot:  'bg-[#854F0B] dark:bg-[#EF9F27]',
  },
};

const fallbackStyle = {
  pill: 'bg-[#F1EFE8] text-[#444441] dark:bg-[#444441] dark:text-[#D3D1C7]',
  dot:  'bg-[#888780]',
};

// ─── ValidationPill ───────────────────────────────────────────────────────────
function ValidationPill({ status }: { status: Test['validation_status'] }) {
  const key = status.toLowerCase();
  const s   = validationStyles[key] ?? fallbackStyle;
  const label = key === 'accepted' ? 'Accepted' : key === 'rejected' ? 'Rejected' : 'Pending';
  const Icon  = key === 'accepted' ? CheckCircle2 : key === 'rejected' ? XCircle : Clock;

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full', s.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// ─── useCountUp ───────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, fillPercent, fillColor, icon, valueColor, delay = 0,
}: {
  label: string; value: number; sub?: string; fillPercent?: number;
  fillColor: string; icon: React.ReactNode; valueColor?: string; delay?: number;
}) {
  const [mounted,  setMounted]  = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const animatedValue = useCountUp(mounted ? value : 0, 900);

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt,     setTilt]     = useState({ x: 0, y: 0 });
  const [isHovered,setIsHovered]= useState(false);
  const [glowPos,  setGlowPos]  = useState({ x: 50, y: 50 });

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true),            delay);
    const t2 = setTimeout(() => setBarWidth(fillPercent ?? 0), delay + 120);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay, fillPercent]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current; if (!card) return;
    const rect = card.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    setTilt({ x: dy * -10, y: dx * 10 });
    setGlowPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const transformValue = isHovered
    ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04) translateY(-3px)`
    : `perspective(600px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setIsHovered(false); }}
      style={{
        transform:  transformValue,
        transition: isHovered
          ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, opacity 0.5s ease-out'
          : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease-out, opacity 0.5s ease-out',
        boxShadow: isHovered
          ? `0 12px 32px -8px ${fillColor}40, 0 4px 16px -4px ${fillColor}25`
          : '0 1px 3px rgba(0,0,0,0.12)',
        opacity: mounted ? 1 : 0,
      }}
      className="bg-muted/40 rounded-lg p-4 flex flex-col gap-1.5 cursor-default relative overflow-hidden"
    >
      {isHovered && (
        <div className="pointer-events-none absolute inset-0 rounded-lg"
          style={{ background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${fillColor}18 0%, transparent 65%)` }} />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-lg transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg,transparent,${fillColor}80,transparent)`, opacity: isHovered ? 1 : 0 }} />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs text-muted-foreground font-mono tracking-wide uppercase">{label}</span>
        <span className={cn('transition-all duration-300', isHovered ? 'text-foreground/80 scale-110' : 'text-muted-foreground/60')}>{icon}</span>
      </div>
      <div className={cn('text-2xl font-semibold leading-none tabular-nums relative z-10 transition-transform duration-200', valueColor, isHovered && 'scale-105 origin-left')}>
        {animatedValue}
      </div>
      {sub && (
        <div className={cn('text-xs font-mono relative z-10 transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')}
          style={{ color: fillColor, transitionDelay: `${delay + 350}ms` }}>
          {sub}
        </div>
      )}
      <div className="h-0.5 rounded-full bg-border mt-1 overflow-hidden relative z-10">
        <div className="h-0.5 rounded-full" style={{
          width: `${Math.min(barWidth, 100)}%`,
          backgroundColor: fillColor,
          transition: isHovered ? 'width 0.3s ease-out, filter 0.2s ease-out' : `width 900ms cubic-bezier(0.4,0,0.2,1) ${delay + 150}ms`,
          filter: isHovered ? `drop-shadow(0 0 3px ${fillColor})` : 'none',
        }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Validation({ tests, counts, tab }: Props) {
  const [modalOpen,     setModalOpen]     = useState(false);
  const [selectedTest,  setSelectedTest]  = useState<Test | null>(null);
  const [actionType,    setActionType]    = useState<'accept' | 'reject' | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [processing,    setProcessing]    = useState(false);

  const safeTotal = counts.all || 1;

  // ── Navigation par tab (rechargement serveur) ─────────────────────────────
  const handleTabChange = (newTab: 'all' | 'pending' | 'accepted' | 'rejected') => {
    router.visit(route('requirement-tests.validation') + `?tab=${newTab}`, {
      preserveScroll: true,
      replace: true,
    });
  };

  const openModal = (test: Test, type: 'accept' | 'reject') => {
    setSelectedTest(test);
    setActionType(type);
    setRejectComment('');
    setModalOpen(true);
  };

  const handleAction = () => {
    if (!selectedTest || !actionType) return;
    if (actionType === 'reject' && !rejectComment.trim()) {
      alert('Rejection reason is required');
      return;
    }
    setProcessing(true);
    const routeName = actionType === 'accept'
      ? 'requirement-tests.accept'
      : 'requirement-tests.reject';

    router.patch(
      route(routeName, selectedTest.id),
      { comment: actionType === 'reject' ? rejectComment : undefined },
      {
        preserveScroll: true,
        onSuccess: () => {
          setModalOpen(false);
          setSelectedTest(null);
          setActionType(null);
          setRejectComment('');
          setProcessing(false);
        },
        onError: (errors) => {
          console.error('Validation error:', errors);
          setProcessing(false);
        },
      }
    );
  };

  const kpiCards = [
    {
      label: 'Total', value: counts.all, sub: 'tests on this page',
      fillPercent: 100, fillColor: '#378add',
      icon: <ClipboardList className="h-4 w-4" />, valueColor: 'text-foreground', delay: 0,
    },
    {
      label: 'Pending', value: counts.pending,
      sub: `${Math.round((counts.pending / safeTotal) * 100)}% of total`,
      fillPercent: Math.round((counts.pending / safeTotal) * 100), fillColor: '#ba7517',
      icon: <Clock className="h-4 w-4" />,
      valueColor: counts.pending > 0 ? 'text-[#854F0B] dark:text-[#EF9F27]' : 'text-foreground', delay: 80,
    },
    {
      label: 'Accepted', value: counts.accepted,
      sub: `${Math.round((counts.accepted / safeTotal) * 100)}% of total`,
      fillPercent: Math.round((counts.accepted / safeTotal) * 100), fillColor: '#639922',
      icon: <ShieldCheck className="h-4 w-4" />,
      valueColor: counts.accepted > 0 ? 'text-[#3B6D11] dark:text-[#97C459]' : 'text-foreground', delay: 160,
    },
    {
      label: 'Rejected', value: counts.rejected,
      sub: `${Math.round((counts.rejected / safeTotal) * 100)}% of total`,
      fillPercent: Math.round((counts.rejected / safeTotal) * 100), fillColor: '#e24b4a',
      icon: <ShieldX className="h-4 w-4" />,
      valueColor: counts.rejected > 0 ? 'text-[#A32D2D] dark:text-[#F7C1C1]' : 'text-foreground', delay: 240,
    },
  ];

  const filterTabs = [
    { key: 'all'      as const, label: 'All',      count: counts.all      },
    { key: 'pending'  as const, label: 'Pending',  count: counts.pending  },
    { key: 'accepted' as const, label: 'Accepted', count: counts.accepted },
    { key: 'rejected' as const, label: 'Rejected', count: counts.rejected },
  ];

  const emptyState = {
    all:      { icon: <ClipboardList className="h-8 w-8 text-muted-foreground" />, title: 'No tests found',                          sub: 'Tests will appear here once they are submitted'  },
    pending:  { icon: <Clock         className="h-8 w-8 text-amber-400"        />, title: 'No tests pending validation',             sub: 'Tests will appear here once they are submitted'  },
    accepted: { icon: <ShieldCheck   className="h-8 w-8 text-emerald-400"      />, title: 'No accepted tests yet',                   sub: 'Try switching to a different filter'             },
    rejected: { icon: <ShieldX       className="h-8 w-8 text-red-400"          />, title: 'No rejected tests — all tests passed',    sub: 'Try switching to a different filter'             },
  };

  return (
    <AppLayout>
      <Head title="Test Validation" />

      <div className="space-y-6 py-6 px-4">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Validation</h1>
          <p className="text-muted-foreground mt-1.5">Review and validate compliance test results</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ perspective: '1200px' }}>
          {kpiCards.map((card) => <KpiCard key={card.label} {...card} />)}
        </div>

        <Separator />

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition-all duration-150',
                tab === t.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/60 text-muted-foreground bg-muted/20 hover:bg-muted/40 hover:text-foreground'
              )}
            >
              {t.label}
              <span className={cn(
                'inline-flex items-center justify-center rounded-full text-xs font-semibold min-w-[20px] h-5 px-1.5',
                tab === t.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[140px_1fr_140px_180px_180px] gap-4 px-5 py-3 bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span>Validation</span>
            <span>Requirement</span>
            <span>Date</span>
            <span>Comment</span>
            <span className="text-right">Actions</span>
          </div>

          {tests.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-4 rounded-full bg-muted/40">{emptyState[tab].icon}</div>
              <p className="text-muted-foreground font-medium">{emptyState[tab].title}</p>
              <p className="text-sm text-muted-foreground/60">{emptyState[tab].sub}</p>
            </div>
          ) : (
            tests.data.map((test, idx) => (
              <div
                key={test.id}
                className={cn(
                  'grid grid-cols-[140px_1fr_140px_180px_180px] gap-4 px-5 py-4 items-center border-b last:border-0 transition-colors hover:bg-muted/20',
                  idx % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                )}
              >
                {/* Validation status */}
                <div><ValidationPill status={test.validation_status} /></div>

                {/* Requirement */}
                <div className="min-w-0">
                  {test.requirement ? (
                    <>
                      <span className="text-xs font-mono text-muted-foreground">{test.requirement.code}</span>
                      <p className="text-sm font-medium truncate">{test.requirement.title}</p>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </div>

                {/* Date */}
                <div className="text-sm text-muted-foreground">
                  {test.test_date
                    ? format(new Date(test.test_date), 'MMM d, yyyy', { locale: enUS })
                    : '—'}
                </div>

                {/* Comment */}
                <div
                  className="text-sm text-muted-foreground truncate max-w-[170px]"
                  title={test.comment || undefined}
                >
                  {test.comment || '—'}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  {test.validation_status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        className="bg-emerald-700 hover:bg-emerald-600 text-white gap-1.5"
                        onClick={() => openModal(test, 'accept')}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-700 text-red-400 hover:bg-red-950/40 gap-1.5"
                        onClick={() => openModal(test, 'reject')}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic pr-2">
                      {test.validation_status === 'accepted' ? '✓ Validated' : '✗ Rejected'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              {actionType === 'accept'
                ? <ShieldCheck className="h-5 w-5 text-emerald-400" />
                : <ShieldX     className="h-5 w-5 text-red-400"     />}
              Test Validation
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Info requirement */}
            <div className="rounded-lg border border-border/60 bg-muted/20 px-5 py-4 space-y-1">
              {selectedTest?.requirement && (
                <p className="text-xs font-mono text-muted-foreground">{selectedTest.requirement.code}</p>
              )}
              <p className="font-medium">{selectedTest?.requirement?.title || 'Compliance Test'}</p>
              {selectedTest?.test_date && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selectedTest.test_date), 'EEEE, MMMM d, yyyy', { locale: enUS })}
                </p>
              )}
            </div>

            {/* Accept / Reject toggle */}
            <div className="flex justify-center gap-6">
              {(['accept', 'reject'] as const).map((type) => {
                const isActive = actionType === type;
                const Icon = type === 'accept' ? CheckCircle : XCircle;
                return (
                  <button
                    key={type}
                    onClick={() => setActionType(type)}
                    className={cn(
                      'flex flex-col items-center gap-2 px-8 py-5 rounded-xl border-2 transition-all duration-200',
                      isActive && type === 'accept' && 'border-emerald-500 bg-emerald-950/50 text-emerald-300 scale-105 shadow-lg shadow-emerald-950/50',
                      isActive && type === 'reject' && 'border-red-500     bg-red-950/50     text-red-300     scale-105 shadow-lg shadow-red-950/50',
                      !isActive && type === 'accept' && 'border-border/60 bg-muted/20 text-muted-foreground hover:border-emerald-700 hover:text-emerald-400',
                      !isActive && type === 'reject' && 'border-border/60 bg-muted/20 text-muted-foreground hover:border-red-700     hover:text-red-400',
                    )}
                  >
                    <Icon className="h-8 w-8" />
                    <span className="font-semibold text-sm capitalize">{type}</span>
                  </button>
                );
              })}
            </div>

            {/* Rejection reason */}
            {actionType === 'reject' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Rejection reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Explain why this test is being rejected..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              disabled={!actionType || processing}
              onClick={handleAction}
              className={cn(
                'min-w-[140px]',
                actionType === 'accept' ? 'bg-emerald-700 hover:bg-emerald-600 text-white' :
                actionType === 'reject' ? 'bg-red-700     hover:bg-red-600     text-white' : ''
              )}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Saving...
                </span>
              ) : actionType === 'accept' ? (
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Confirm Accept</span>
              ) : actionType === 'reject' ? (
                <span className="flex items-center gap-2"><XCircle className="h-4 w-4" /> Confirm Reject</span>
              ) : 'Select an action'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}