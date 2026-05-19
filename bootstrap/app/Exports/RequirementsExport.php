<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class RequirementsExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithColumnWidths,
    WithTitle
{
    protected $requirements;

    public function __construct(Collection $requirements)
    {
        $this->requirements = $requirements;
    }

    public function title(): string
    {
        return 'Requirements';
    }

    public function collection(): Collection
    {
        return $this->requirements;
    }

    public function headings(): array
    {
        return [
            'Code',
            'Title',
            'Type',
            'Status',
            'Priority',
            'Framework',
            'Process',
            'Tags',
            'Deadline',
            'Completion Date',
            'Compliance Level',
        ];
    }

    public function map($requirement): array
    {
        return [
            $requirement->code,
            $requirement->title,
            $requirement->type,
            $requirement->status,
            $requirement->priority,
            $requirement->framework ? $requirement->framework->name : '—',
            $requirement->process ? $requirement->process->name : '—',
            implode(', ', $requirement->tags_names ?? []),
            $requirement->deadline ?? '—',
            $requirement->completion_date ?? '—',
            $requirement->compliance_level,
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 18,  // Code
            'B' => 40,  // Title
            'C' => 14,  // Type
            'D' => 14,  // Status
            'E' => 12,  // Priority
            'F' => 24,  // Framework
            'G' => 24,  // Process
            'H' => 30,  // Tags
            'I' => 14,  // Deadline
            'J' => 16,  // Completion Date
            'K' => 18,  // Compliance Level
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $this->requirements->count() + 1;
        $lastColumn = 'K';

        // ── Header row ───────────────────────────────────────────────
        $sheet->getStyle("A1:{$lastColumn}1")->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size'  => 11,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF1E293B'],  // slate-800
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
                'wrapText'   => true,
            ],
            'borders' => [
                'bottom' => [
                    'borderStyle' => Border::BORDER_MEDIUM,
                    'color'       => ['argb' => 'FF6366F1'],  // indigo accent
                ],
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(22);

        // ── Data rows — alternating zebra ────────────────────────────
        for ($row = 2; $row <= $lastRow; $row++) {
            $argb = ($row % 2 === 0) ? 'FFF8FAFC' : 'FFFFFFFF';
            $sheet->getStyle("A{$row}:{$lastColumn}{$row}")->applyFromArray([
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => $argb],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
                'borders' => [
                    'bottom' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color'       => ['argb' => 'FFE2E8F0'],
                    ],
                ],
            ]);

            $sheet->getRowDimension($row)->setRowHeight(18);
        }

        // ── Outer border ─────────────────────────────────────────────
        $sheet->getStyle("A1:{$lastColumn}{$lastRow}")->applyFromArray([
            'borders' => [
                'outline' => [
                    'borderStyle' => Border::BORDER_MEDIUM,
                    'color'       => ['argb' => 'FF94A3B8'],
                ],
            ],
        ]);

        // ── Center-align specific columns (codes, dates, status, priority, etc.) ──
        $centerColumns = ['A', 'C', 'D', 'E', 'I', 'J', 'K'];
        foreach ($centerColumns as $col) {
            $sheet->getStyle("{$col}2:{$col}{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
        }

        // Left-align the description-like columns (B, F, G, H)
        $leftColumns = ['B', 'F', 'G', 'H'];
        foreach ($leftColumns as $col) {
            $sheet->getStyle("{$col}2:{$col}{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
        }

        return [];
    }
}