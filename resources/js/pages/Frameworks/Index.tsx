import { useMemo, useState, useEffect, useRef } from 'react';
import { useCan } from '@/hooks/use-can';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ServerDataTable } from '@/components/server-data-table';
import { DataTableColumnHeader } from '@/components/server-data-table-column-header';
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from '@/components/server-data-table-faceted-filter';
import {
  DataTableSelectFilter,
  type SelectOption,
} from '@/components/server-data-table-select-filter';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

import {
  Key,
  BookOpen,
  RefreshCw,
  Layers,
  User,
  Globe,
  Tag,
  SignalHigh,
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Archive,
  LayoutGrid,
  Table as TableIcon,
  GripVertical,
  ListFilter,
  CircleDot,
  Globe2,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import type { ColumnDef } from '@tanstack/react-table';
import type { PaginatedData } from '@/types';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

// --- Jurisdiction flags ---
const jurisdictionFlags: Record<string, string> = {
  'Algerie': 'dz', 'Algeria': 'dz', 'Angola': 'ao', 'Benin': 'bj',
  'Botswana': 'bw', 'Burkina Faso': 'bf', 'Burundi': 'bi', 'Cameroun': 'cm', 'Cameroon': 'cm',
  'Cap-Vert': 'cv', 'Cape Verde': 'cv', 'Chad': 'td', 'Comoros': 'km', 'Congo': 'cg',
  'Democratic Republic of the Congo': 'cd', 'RDC': 'cd',
  'Djibouti': 'dj', 'Egypt': 'eg', 'Equatorial Guinea': 'gq', 'Eritrea': 'er',
  'Eswatini': 'sz', 'Swaziland': 'sz', 'Ethiopia': 'et', 'Gabon': 'ga', 'Gambia': 'gm',
  'Ghana': 'gh', 'Guinea': 'gn', 'Guinea-Bissau': 'gw',
  'Kenya': 'ke', 'Lesotho': 'ls', 'Liberia': 'lr', 'Libya': 'ly',
  'Madagascar': 'mg', 'Malawi': 'mw', 'Mali': 'ml', 'Mauritania': 'mr',
  'Mauritius': 'mu', 'Morocco': 'ma', 'Mozambique': 'mz',
  'Namibia': 'na', 'Niger': 'ne', 'Nigeria': 'ng', 'Rwanda': 'rw',
  'Senegal': 'sn', 'Seychelles': 'sc', 'Sierra Leone': 'sl', 'Somalia': 'so',
  'South Africa': 'za', 'South Sudan': 'ss', 'Sudan': 'sd',
  'Tanzania': 'tz', 'Togo': 'tg', 'Tunisia': 'tn', 'Uganda': 'ug',
  'Zambia': 'zm', 'Zimbabwe': 'zw', 'Canada': 'ca', 'Costa Rica': 'cr', 'Cuba': 'cu',
  'United States': 'us', 'USA': 'us',
  'Argentina': 'ar', 'Bolivia': 'bo', 'Brazil': 'br', 'Chile': 'cl', 'Colombia': 'co',
  'Ecuador': 'ec', 'Guyana': 'gy', 'Paraguay': 'py', 'Peru': 'pe',
  'Suriname': 'sr', 'Uruguay': 'uy', 'Venezuela': 've',
  'China': 'cn', 'India': 'in', 'Japan': 'jp', 'South Korea': 'kr',
  'United Arab Emirates': 'ae', 'UAE': 'ae', 'Singapore': 'sg',
  'Turkey': 'tr', 'Germany': 'de', 'France': 'fr',
  'United Kingdom': 'gb', 'UK': 'gb', 'Italy': 'it', 'Spain': 'es',
  'Netherlands': 'nl', 'Belgium': 'be', 'Switzerland': 'ch', 'Sweden': 'se',
  'Norway': 'no', 'Denmark': 'dk', 'Finland': 'fi', 'Poland': 'pl',
  'Portugal': 'pt', 'Russia': 'ru', 'Ukraine': 'ua',
  'Australia': 'au', 'New Zealand': 'nz',
  'European Union': 'eu',
};

const getFlagUrl = (jurisdictionName: string): string | null => {
  const code = jurisdictionFlags[jurisdictionName.trim()];
  if (!code) return null;
  return `https://flagcdn.com/w20/${code}.png`;
};

// --- Types ---
interface RelationItem {
  id: number;
  name: string;
  pivot?: Record<string, any>;
}

export interface Framework {
  id: number;
  code: string;
  name: string;
  version?: string | null;
  type: string;
  publisher?: string | null;
  jurisdictions: (string | RelationItem)[] | null;
  tags: (string | RelationItem)[] | null;
  status: string;
  description?: string | null;
  updated_at?: string | null;
}

interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  first_page_url: string;
  last_page_url: string;
  prev_page_url: string | null;
  next_page_url: string | null;
  links: { url: string | null; label: string; active: boolean }[];
  path: string;
}

interface FrameworksIndexProps {
  frameworks: LaravelPaginator<Framework>;
}

type GroupBy = 'status' | 'type';
type ViewMode = 'table' | 'cards';

const INITIAL_VISIBLE = 2;

// --- Styles ---
const statusStyles: Record<string, { pill: string; dot: string; kanbanBg: string; kanbanBorder: string; kanbanText: string }> = {
  active: {
    pill: 'bg-[#EAF3DE] text-[#27500A] dark:bg-[#27500A] dark:text-[#C0DD97]',
    dot: 'bg-[#3B6D11] dark:bg-[#97C459]',
    kanbanBg: 'bg-[#EAF3DE]/60 dark:bg-[#27500A]/40',
    kanbanBorder: 'border-[#97C459] dark:border-[#3B6D11]',
    kanbanText: 'text-[#27500A] dark:text-[#C0DD97]',
  },
  draft: {
    pill: 'bg-[#FAEEDA] text-[#412402] dark:bg-[#412402] dark:text-[#FAC775]',
    dot: 'bg-[#854F0B] dark:bg-[#EF9F27]',
    kanbanBg: 'bg-[#FAEEDA]/60 dark:bg-[#412402]/40',
    kanbanBorder: 'border-[#EF9F27] dark:border-[#854F0B]',
    kanbanText: 'text-[#412402] dark:text-[#FAC775]',
  },
  archived: {
    pill: 'bg-[#F1EFE8] text-[#444441] dark:bg-[#444441] dark:text-[#D3D1C7]',
    dot: 'bg-[#888780] dark:bg-[#B4B2A9]',
    kanbanBg: 'bg-[#F1EFE8]/60 dark:bg-[#444441]/40',
    kanbanBorder: 'border-[#B4B2A9] dark:border-[#5F5E5A]',
    kanbanText: 'text-[#444441] dark:text-[#D3D1C7]',
  },
};

const typeStyles: Record<string, { pill: string; dot: string; kanbanBg: string; kanbanBorder: string; kanbanText: string }> = {
  standard: {
    pill: 'bg-[#EAF3DE] text-[#27500A] dark:bg-[#27500A] dark:text-[#C0DD97]',
    dot: 'bg-[#3B6D11] dark:bg-[#97C459]',
    kanbanBg: 'bg-[#EAF3DE]/60 dark:bg-[#27500A]/40',
    kanbanBorder: 'border-[#97C459] dark:border-[#3B6D11]',
    kanbanText: 'text-[#27500A] dark:text-[#C0DD97]',
  },
  regulation: {
    pill: 'bg-[#E6F1FB] text-[#0C447C] dark:bg-[#0C447C] dark:text-[#B5D4F4]',
    dot: 'bg-[#0C447C] dark:bg-[#6CA4E0]',
    kanbanBg: 'bg-[#E6F1FB]/60 dark:bg-[#0C447C]/40',
    kanbanBorder: 'border-[#6CA4E0] dark:border-[#0C447C]',
    kanbanText: 'text-[#0C447C] dark:text-[#B5D4F4]',
  },
  contract: {
    pill: 'bg-[#FAEEDA] text-[#412402] dark:bg-[#412402] dark:text-[#FAC775]',
    dot: 'bg-[#854F0B] dark:bg-[#EF9F27]',
    kanbanBg: 'bg-[#FAEEDA]/60 dark:bg-[#412402]/40',
    kanbanBorder: 'border-[#EF9F27] dark:border-[#854F0B]',
    kanbanText: 'text-[#412402] dark:text-[#FAC775]',
  },
  internal_policy: {
    pill: 'bg-[#F0E9FF] text-[#3C3489] dark:bg-[#3C3489] dark:text-[#CECBF6]',
    dot: 'bg-[#5B4B9C] dark:bg-[#9B8BDB]',
    kanbanBg: 'bg-[#F0E9FF]/60 dark:bg-[#3C3489]/40',
    kanbanBorder: 'border-[#9B8BDB] dark:border-[#5B4B9C]',
    kanbanText: 'text-[#3C3489] dark:text-[#CECBF6]',
  },
};

const fallbackStyle = {
  pill: 'bg-[#F1EFE8] text-[#444441] dark:bg-[#444441] dark:text-[#D3D1C7]',
  dot: 'bg-[#888780]',
  kanbanBg: 'bg-muted/40',
  kanbanBorder: 'border-muted',
  kanbanText: 'text-muted-foreground',
};

// --- StatusPill / TypePill ---
function StatusPill({ value }: { value: string }) {
  const key = value?.toLowerCase() ?? '';
  const s = statusStyles[key] ?? fallbackStyle;
  const label = key.charAt(0).toUpperCase() + key.slice(1);
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', s.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {label || '-'}
    </span>
  );
}

function TypePill({ value }: { value: string }) {
  const key = value?.toLowerCase().replace(/\s+/g, '_') ?? '';
  const s = typeStyles[key] ?? fallbackStyle;
  const label = key === 'internal_policy' ? 'Internal Policy' : key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', s.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
      {label}
    </span>
  );
}

// --- Animated counter hook ---
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// --- KPI Card ---
function KpiCard({
  label, value, sub, fillPercent, fillColor, icon, valueColor, delay = 0,
}: {
  label: string;
  value: number | string;
  sub?: string;
  fillPercent?: number;
  fillColor: string;
  icon: React.ReactNode;
  valueColor?: string;
  delay?: number;
}) {
  const numericValue = typeof value === 'number' ? value : 0;
  const [mounted, setMounted] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const animatedValue = useCountUp(mounted ? numericValue : 0, 900);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), delay);
    const t2 = setTimeout(() => setBarWidth(fillPercent ?? 0), delay + 120);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay, fillPercent]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setTilt({ x: dy * -10, y: dx * 10 });
    setGlowPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const handleMouseLeave = () => { setTilt({ x: 0, y: 0 }); setIsHovered(false); };
  const transformValue = isHovered
    ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04) translateY(-3px)`
    : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px)';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformValue,
        transition: isHovered ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, opacity 0.5s ease-out' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease-out, opacity 0.5s ease-out',
        boxShadow: isHovered ? `0 12px 32px -8px ${fillColor}40, 0 4px 16px -4px ${fillColor}25` : '0 1px 3px rgba(0,0,0,0.12)',
        opacity: mounted ? 1 : 0,
      }}
      className="bg-muted/40 rounded-lg p-4 flex flex-col gap-1.5 cursor-default relative overflow-hidden"
    >
      {isHovered && (
        <div className="pointer-events-none absolute inset-0 rounded-lg" style={{ background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${fillColor}18 0%, transparent 65%)` }} />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-lg transition-opacity duration-300" style={{ background: `linear-gradient(90deg, transparent, ${fillColor}80, transparent)`, opacity: isHovered ? 1 : 0 }} />
      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs text-muted-foreground font-mono tracking-wide uppercase">{label}</span>
        <span className={cn('transition-all duration-300', isHovered ? 'text-foreground/80 scale-110' : 'text-muted-foreground/60')}>{icon}</span>
      </div>
      <div className={cn('text-2xl font-semibold leading-none tabular-nums relative z-10 transition-transform duration-200', valueColor, isHovered && 'scale-105 origin-left')}>
        {typeof value === 'number' ? animatedValue : value}
      </div>
      {sub && (
        <div className={cn('text-xs font-mono relative z-10 transition-opacity duration-500', mounted ? 'opacity-100' : 'opacity-0')} style={{ color: fillColor, transitionDelay: `${delay + 350}ms` }}>
          {sub}
        </div>
      )}
      <div className="h-0.5 rounded-full bg-border mt-1 overflow-hidden relative z-10">
        <div className="h-0.5 rounded-full" style={{ width: `${Math.min(barWidth, 100)}%`, backgroundColor: fillColor, transition: isHovered ? 'width 0.3s ease-out, filter 0.2s ease-out' : `width 900ms cubic-bezier(0.4, 0, 0.2, 1) ${delay + 150}ms`, filter: isHovered ? `drop-shadow(0 0 3px ${fillColor})` : 'none' }} />
      </div>
    </div>
  );
}

// --- KanbanColumn ---
function KanbanColumn({
  columnKey, title, items, styles: s,
  canEdit = false, canDelete = false, onDeleteRequest,
}: {
  columnKey: string;
  title: string;
  items: Framework[];
  styles: { kanbanBg: string; kanbanBorder: string; kanbanText: string };
  canEdit?: boolean;
  canDelete?: boolean;
  onDeleteRequest?: (fw: Framework) => void;
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((fw) => fw.code.toLowerCase().includes(q) || fw.name.toLowerCase().includes(q) || (fw.publisher ?? '').toLowerCase().includes(q));
  }, [items, search]);

  const isSearching = search.trim().length > 0;
  const visibleItems = isSearching || expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hiddenCount = filtered.length - INITIAL_VISIBLE;
  const showToggle = !isSearching && filtered.length > INITIAL_VISIBLE;

  useEffect(() => { if (isSearching) setExpanded(false); }, [isSearching]);

  return (
    <Droppable droppableId={columnKey}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn('flex flex-col min-w-[320px] rounded-xl border bg-gradient-to-b from-card/80 to-card/40 shadow-sm transition-all duration-200', snapshot.isDraggingOver && 'ring-2 ring-primary/50 shadow-xl')}
        >
          <div className={cn('px-5 pt-4 pb-3 rounded-t-xl border-b-2 flex flex-col gap-2.5', s.kanbanBg, s.kanbanBorder)}>
            <div className="flex items-center justify-between">
              <span className={cn('font-medium text-base', s.kanbanText)}>{title}</span>
              <span className={cn('inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border bg-background/70', s.kanbanBorder, s.kanbanText)}>
                {isSearching ? `${filtered.length} / ${items.length}` : items.length}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input ref={searchInputRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="h-8 pl-8 text-xs bg-background/70 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40" />
              {search && (
                <button onClick={() => { setSearch(''); searchInputRef.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Clear">x</button>
              )}
            </div>
          </div>

          <div className="p-4 flex-1 space-y-4 min-h-[400px]">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/70 italic py-12">
                <Search className="h-5 w-5 opacity-40" />
                <span className="text-sm">No results</span>
              </div>
            ) : (
              <>
                {visibleItems.map((fw, idx) => (
                  <Draggable key={fw.id} draggableId={String(fw.id)} index={idx}>
                    {(dragProvided, dragSnapshot) => (
                      <Card
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={cn('transition-all duration-200 cursor-grab active:cursor-grabbing', dragSnapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/60 scale-[1.02]' : 'hover:shadow-md hover:ring-1 hover:ring-primary/30')}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div {...dragProvided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-muted-foreground/70 hover:text-foreground transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium leading-tight mb-1.5">
                                <HighlightText text={`${fw.code} - ${fw.name}`} query={search} />
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{fw.description || 'No description'}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <StatusPill value={fw.status} />
                            <TypePill value={fw.type} />
                            {fw.version && <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">v{fw.version}</span>}
                          </div>

                          {fw.jurisdictions?.length ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {fw.jurisdictions.slice(0, 4).map((j, i) => {
                                const name = typeof j === 'string' ? j : j.name || '-';
                                const flagUrl = getFlagUrl(name);
                                return (
                                  <Badge key={i} variant="outline" className="text-xs flex items-center gap-1 px-2.5 py-1">
                                    {flagUrl ? <img src={flagUrl} alt={`${name} flag`} className="w-5 h-4 rounded-sm object-cover" loading="lazy" /> : <Globe2 className="h-3.5 w-3.5 text-emerald-400" />}
                                    <span className="truncate max-w-[140px]">{name}</span>
                                  </Badge>
                                );
                              })}
                              {fw.jurisdictions.length > 4 && <Badge variant="outline" className="text-xs px-2.5 py-1">+{fw.jurisdictions.length - 4}</Badge>}
                            </div>
                          ) : null}

                          {fw.tags?.length ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {fw.tags.slice(0, 4).map((tag, i) => {
                                const name = typeof tag === 'string' ? tag : (tag as RelationItem).name || '-';
                                return <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>;
                              })}
                              {fw.tags.length > 4 && <Badge variant="secondary" className="text-xs">+{fw.tags.length - 4}</Badge>}
                            </div>
                          ) : null}

                          <div className="pt-3 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                              <Link href={`/frameworks/${fw.id}`}><Eye className="mr-1.5 h-3.5 w-3.5" /> View</Link>
                            </Button>
                            {canEdit && (
                              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                                <Link href={`/frameworks/${fw.id}/edit`}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Editt</Link>
                              </Button>
                            )}
                            {canDelete && onDeleteRequest && (
                              <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10" onClick={() => onDeleteRequest(fw)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}

                {showToggle && (
                  <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className={cn('w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium', 'border border-dashed border-border/60 text-muted-foreground', 'hover:border-primary/50 hover:text-primary hover:bg-primary/5', 'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40')}
                  >
                    {expanded ? <><ChevronUp className="h-4 w-4" /> Collapse</> : <><ChevronDown className="h-4 w-4" /> Show {hiddenCount} more</>}
                  </button>
                )}
              </>
            )}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}

// --- HighlightText ---
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// --- Main Component ---
export default function FrameworksIndex({ frameworks }: FrameworksIndexProps) {
  const { can } = useCan();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [frameworkToDelete, setFrameworkToDelete] = useState<Framework | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [exportLoading, setExportLoading] = useState(false);

  const statusStats = useMemo(() => {
    const data = frameworks.data;
    const total = frameworks.total;
    const pageSize = data.length || 1;
    const active = data.filter(f => f.status?.toLowerCase() === 'active').length;
    const draft = data.filter(f => f.status?.toLowerCase() === 'draft').length;
    const archived = data.filter(f => f.status?.toLowerCase() === 'archived').length;
    return { total, active, draft, archived, activeRate: Math.round((active / pageSize) * 100), draftRate: Math.round((draft / pageSize) * 100), archivedRate: Math.round((archived / pageSize) * 100) };
  }, [frameworks.data, frameworks.total]);

  const typeStats = useMemo(() => {
    const data = frameworks.data;
    const total = frameworks.total;
    const pageSize = data.length || 1;
    const standard = data.filter(f => f.type?.toLowerCase() === 'standard').length;
    const regulation = data.filter(f => f.type?.toLowerCase() === 'regulation').length;
    const contract = data.filter(f => f.type?.toLowerCase() === 'contract').length;
    const internalPolicy = data.filter(f => f.type?.toLowerCase() === 'internal_policy').length;
    return { total, standard, regulation, contract, internalPolicy, standardRate: Math.round((standard / pageSize) * 100), regulationRate: Math.round((regulation / pageSize) * 100), contractRate: Math.round((contract / pageSize) * 100), internalRate: Math.round((internalPolicy / pageSize) * 100) };
  }, [frameworks.data, frameworks.total]);

  const kpiCards = groupBy === 'status'
    ? [
        { label: 'Total', value: statusStats.total, sub: `${frameworks.data.length} on page`, fillPercent: 100, fillColor: '#378add', icon: <CircleDot className="h-4 w-4" />, valueColor: 'text-foreground', delay: 0 },
        { label: 'Active', value: statusStats.active, sub: `${statusStats.activeRate}%`, fillPercent: statusStats.activeRate, fillColor: '#639922', icon: <CheckCircle2 className="h-4 w-4" />, valueColor: 'text-[#3B6D11] dark:text-[#97C459]', delay: 80 },
        { label: 'Draft', value: statusStats.draft, sub: `${statusStats.draftRate}%`, fillPercent: statusStats.draftRate, fillColor: '#ba7517', icon: <FileText className="h-4 w-4" />, valueColor: 'text-[#854F0B] dark:text-[#EF9F27]', delay: 160 },
        { label: 'Archived', value: statusStats.archived, sub: `${statusStats.archivedRate}%`, fillPercent: statusStats.archivedRate, fillColor: '#6b7280', icon: <Archive className="h-4 w-4" />, valueColor: 'text-[#5F5E5A] dark:text-[#B4B2A9]', delay: 240 },
      ]
    : [
        { label: 'Total', value: typeStats.total, sub: `${frameworks.data.length} on page`, fillPercent: 100, fillColor: '#378add', icon: <CircleDot className="h-4 w-4" />, valueColor: 'text-foreground', delay: 0 },
        { label: 'Standard', value: typeStats.standard, sub: `${typeStats.standardRate}%`, fillPercent: typeStats.standardRate, fillColor: '#639922', icon: <Layers className="h-4 w-4" />, valueColor: 'text-[#3B6D11] dark:text-[#97C459]', delay: 60 },
        { label: 'Regulation', value: typeStats.regulation, sub: `${typeStats.regulationRate}%`, fillPercent: typeStats.regulationRate, fillColor: '#0C447C', icon: <Globe className="h-4 w-4" />, valueColor: 'text-[#0C447C] dark:text-[#B5D4F4]', delay: 120 },
        { label: 'Contract', value: typeStats.contract, sub: `${typeStats.contractRate}%`, fillPercent: typeStats.contractRate, fillColor: '#ba7517', icon: <FileText className="h-4 w-4" />, valueColor: 'text-[#854F0B] dark:text-[#EF9F27]', delay: 180 },
        { label: 'Internal Policy', value: typeStats.internalPolicy, sub: `${typeStats.internalRate}%`, fillPercent: typeStats.internalRate, fillColor: '#5B4B9C', icon: <Building2 className="h-4 w-4" />, valueColor: 'text-[#3C3489] dark:text-[#CECBF6]', delay: 240 },
      ];

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch(`/frameworks/export?${params.toString()}`, { method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `frameworks-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const groupedData = useMemo(() => {
    return frameworks.data.reduce((acc, fw) => {
      const key = groupBy === 'status' ? (fw.status || 'other').toLowerCase() : (fw.type || 'other').toLowerCase().replace(/\s+/g, '_');
      acc[key] = acc[key] || [];
      acc[key].push(fw);
      return acc;
    }, {} as Record<string, Framework[]>);
  }, [frameworks.data, groupBy]);

  const columnConfig = groupBy === 'status'
    ? { keys: ['active', 'draft', 'archived'], getTitle: (key: string) => key.charAt(0).toUpperCase() + key.slice(1), styles: statusStyles, field: 'status' as const }
    : { keys: ['standard', 'regulation', 'contract', 'internal_policy'], getTitle: (key: string) => key === 'internal_policy' ? 'Internal Policy' : key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), styles: typeStyles, field: 'type' as const };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;
    const framework = frameworks.data.find(f => f.id === Number(draggableId));
    if (!framework) return;
    router.put(`/frameworks/${Number(draggableId)}`, {
      code: framework.code, name: framework.name, type: framework.type, status: framework.status,
      version: framework.version ?? undefined, publisher: framework.publisher ?? undefined,
      description: framework.description ?? undefined, [columnConfig.field]: destination.droppableId,
    }, { preserveState: true, preserveScroll: true, onError: (e) => console.error('Update failed', e) });
  };

  const goToPage = (url: string | null) => {
    if (!url) return;
    router.get(url, {}, { preserveState: true, preserveScroll: true });
  };

  const handleDeleteRequest = (fw: Framework) => {
    setFrameworkToDelete(fw);
    setDeleteDialogOpen(true);
  };

  // --- Columns ---
  const columns: ColumnDef<Framework>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => (<div className="flex items-center gap-1.5"><Key className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Code" /></div>),
      cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('code')}</div>,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (<div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Name" /></div>),
      cell: ({ row }) => (<Link href={`/frameworks/${row.original.id}`} className="font-medium hover:underline">{row.getValue('name')}</Link>),
    },
    {
      accessorKey: 'version',
      header: ({ column }) => (<div className="flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Version" /></div>),
      cell: ({ row }) => row.getValue('version') ?? '-',
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (<div className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Type" /></div>),
      cell: ({ row }) => <TypePill value={row.getValue('type') as string} />,
    },
    {
      accessorKey: 'publisher',
      header: ({ column }) => (<div className="flex items-center gap-1.5"><User className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Publisher" /></div>),
      cell: ({ row }) => row.getValue('publisher') ?? '-',
    },
    {
      id: 'jurisdictions',
      header: ({ column }) => (<div className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Jurisdictions" /></div>),
      cell: ({ row }) => {
        const items = row.original.jurisdictions || [];
        if (!items.length) return <span className="text-muted-foreground text-xs">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {items.slice(0, 5).map((item, i) => {
              const name = typeof item === 'string' ? item : item.name || '-';
              const flagUrl = getFlagUrl(name);
              return (
                <Badge key={i} variant="outline" className="text-xs flex items-center gap-1 px-2 py-0.5">
                  {flagUrl ? <img src={flagUrl} alt={`${name} flag`} className="w-4 h-3 rounded-sm object-cover" loading="lazy" /> : <Globe2 className="h-3.5 w-3.5 text-emerald-400" />}
                  {name}
                </Badge>
              );
            })}
            {items.length > 5 && <Badge variant="outline" className="text-xs px-2 py-0.5">+{items.length - 5}</Badge>}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (<div className="flex items-center gap-1.5"><SignalHigh className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Status" /></div>),
      cell: ({ row }) => <StatusPill value={row.getValue('status') as string} />,
    },
    {
      id: 'tags',
      header: ({ column }) => (<div className="flex items-center gap-1.5"><Tag className="h-4 w-4 text-muted-foreground" /><DataTableColumnHeader column={column} title="Tags" /></div>),
      cell: ({ row }) => {
        const tags = row.original.tags || [];
        if (!tags.length) return <span className="text-muted-foreground text-xs">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, i) => {
              const name = typeof tag === 'string' ? tag : (tag as RelationItem).name || '-';
              return <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>;
            })}
            {tags.length > 3 && <Badge variant="secondary" className="text-xs">+{tags.length - 3}</Badge>}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const framework = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.visit(`/frameworks/${framework.id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              {can('frameworks.update') && (
                <DropdownMenuItem onClick={() => router.visit(`/frameworks/${framework.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              {can('frameworks.delete') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDeleteRequest(framework)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleDeleteConfirm = () => {
    if (frameworkToDelete) {
      router.delete(`/frameworks/${frameworkToDelete.id}`, {
        onSuccess: () => { setDeleteDialogOpen(false); setFrameworkToDelete(null); },
      });
    }
  };

  return (
    <AppLayout>
      <Head title="Frameworks" />
      <div className="space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Frameworks</h1>
            <p className="text-muted-foreground mt-1.5">Manage compliance and regulatory frameworks</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {can('frameworks.create') && (
              <Button asChild>
                <Link href="/frameworks/create"><Plus className="mr-2 h-4 w-4" /> New Framework</Link>
              </Button>
            )}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="hidden sm:block">
              <TabsList className="grid w-44 grid-cols-2">
                <TabsTrigger value="table"><TableIcon className="mr-2 h-4 w-4" />Table</TabsTrigger>
                <TabsTrigger value="cards"><LayoutGrid className="mr-2 h-4 w-4" />Cards</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* KPI Cards */}
        <div className={cn('grid gap-3', groupBy === 'status' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5')} style={{ perspective: '1200px' }}>
          {kpiCards.map((card) => (<KpiCard key={card.label} {...card} />))}
        </div>

        <Separator className="my-6" />

        {/* Table or Kanban */}
        {viewMode === 'table' ? (
          <>
            <ServerDataTable
              columns={columns}
              data={frameworks}
              searchPlaceholder="Search code, name, publisher..."
              onExport={handleExport}
              exportLoading={exportLoading}
              filters={
                <>
                  <DataTableFacetedFilter filterKey="status" title="Status" options={[{ label: 'Active', value: 'active', icon: CheckCircle2 }, { label: 'Draft', value: 'draft', icon: FileText }, { label: 'Archived', value: 'archived', icon: Archive }]} />
                  <DataTableSelectFilter filterKey="type" title="Type" placeholder="All types" options={[{ label: 'All', value: 'all' }, { label: 'Standard', value: 'standard' }, { label: 'Regulation', value: 'regulation' }, { label: 'Contract', value: 'contract' }, { label: 'Internal Policy', value: 'internal_policy' }]} />
                </>
              }
              initialState={{ columnPinning: { right: ['actions'] } }}
            />
            {frameworks.last_page > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{frameworks.from}</span> - <span className="font-medium">{frameworks.to}</span> of <span className="font-medium">{frameworks.total}</span> results
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={!frameworks.prev_page_url} onClick={() => goToPage(frameworks.prev_page_url)}>Previous</Button>
                  {frameworks.links.filter((l) => !['&laquo; Previous', 'Next &raquo;'].includes(l.label)).map((link, idx) => (
                    <Button key={idx} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url || link.active} onClick={() => goToPage(link.url)} dangerouslySetInnerHTML={{ __html: link.label }} />
                  ))}
                  <Button variant="outline" size="sm" disabled={!frameworks.next_page_url} onClick={() => goToPage(frameworks.next_page_url)}>Next</Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-semibold tracking-tight">{groupBy === 'status' ? 'Status Board' : 'Type Board'}</h2>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                <SelectTrigger className="w-48"><ListFilter className="mr-2 h-4 w-4" /><SelectValue placeholder="Group by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Group by Status</SelectItem>
                  <SelectItem value="type">Group by Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="overflow-x-auto pb-6 scrollbar-thin">
                <div className="grid grid-flow-col auto-cols-[minmax(320px,1fr)] gap-5 lg:gap-6">
                  {columnConfig.keys.map((key) => (
                    <KanbanColumn
                      key={key}
                      columnKey={key}
                      title={columnConfig.getTitle(key)}
                      items={groupedData[key] || []}
                      styles={columnConfig.styles[key] ?? fallbackStyle}
                      canEdit={can('frameworks.update')}
                      canDelete={can('frameworks.delete')}
                      onDeleteRequest={handleDeleteRequest}
                    />
                  ))}
                </div>
              </div>
            </DragDropContext>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Framework</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{frameworkToDelete?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}