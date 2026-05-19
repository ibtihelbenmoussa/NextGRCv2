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

class FrameworksExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithColumnWidths,
    WithTitle
{
    protected $frameworks;

    public function __construct(Collection $frameworks)
    {
        $this->frameworks = $frameworks;
    }

    public function title(): string
    {
        return 'Frameworks';
    }

    public function collection(): Collection
    {
        return $this->frameworks;
    }

    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Version',
            'Type',
            'Status',
            'Publisher',
            'Jurisdictions',
            'Tags',
            'Scope',
            'Release Date',
            'Effective Date',
            'Retired Date'
        ];
    }

    public function map($framework): array
    {
        return [
            $framework->code,
            $framework->name,
            $framework->version,
            $framework->type,
            $framework->status,
            $framework->publisher,
            $framework->jurisdictions->pluck('name')->implode(', '),
            $framework->tags->pluck('name')->implode(', '),
            $framework->scope,
            $framework->release_date,
            $framework->effective_date,
            $framework->retired_date,
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 18,  // Code
            'B' => 36,  // Name
            'C' => 12,  // Version
            'D' => 18,  // Type
            'E' => 14,  // Status
            'F' => 24,  // Publisher
            'G' => 30,  // Jurisdictions
            'H' => 30,  // Tags
            'I' => 40,  // Scope
            'J' => 14,  // Release Date
            'K' => 14,  // Effective Date
            'L' => 14,  // Retired Date
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $this->frameworks->count() + 1;
        $lastColumn = 'L';

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

        // ── Center-align specific columns (dates, codes, status, etc.) ──
        $centerColumns = ['A', 'C', 'D', 'E', 'J', 'K', 'L'];
        foreach ($centerColumns as $col) {
            $sheet->getStyle("{$col}2:{$col}{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
        }

        // Left-align the description-like columns (B, F, G, H, I)
        $leftColumns = ['B', 'F', 'G', 'H', 'I'];
        foreach ($leftColumns as $col) {
            $sheet->getStyle("{$col}2:{$col}{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
        }

        return [];
    }
}