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

class RequirementTestsExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithColumnWidths,
    WithTitle
{
    protected Collection $tests;

    public function __construct(Collection $tests)
    {
        $this->tests = $tests;
    }

    public function title(): string
    {
        return 'Requirement Tests';
    }

    public function collection(): Collection
    {
        return $this->tests;
    }

    public function headings(): array
    {
        return [
            'Test Code',
            'Requirement Code',
            'Requirement Title',
            'Framework',
            'Test Date',
            'Result',
            'Validation Status',
            'Tested By',
            'Comment',
        ];
    }

    public function map($test): array
    {
        return [
            $test->test_code ?? '—',
            $test->requirement?->code ?? '—',
            $test->requirement?->title ?? '—',
            $test->framework?->code ?? '—',
            $test->test_date?->format('Y-m-d') ?? '—',
            $test->result ?? '—',
            $test->validation_status ?? '—',
            $test->user?->name ?? '—',
            $test->comment ?? '',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 16,  // Test Code
            'B' => 20,  // Requirement Code
            'C' => 40,  // Requirement Title
            'D' => 16,  // Framework
            'E' => 14,  // Test Date
            'F' => 14,  // Result
            'G' => 18,  // Validation Status
            'H' => 18,  // Tested By
            'I' => 50,  // Comment
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $this->tests->count() + 1;
        $lastColumn = 'I';

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

        // ── Center-align specific columns (codes, dates, result, status) ──
        $centerColumns = ['A', 'B', 'D', 'E', 'F', 'G', 'H'];
        foreach ($centerColumns as $col) {
            $sheet->getStyle("{$col}2:{$col}{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
        }

        // Left-align the description-like columns (C, I)
        $leftColumns = ['C', 'I'];
        foreach ($leftColumns as $col) {
            $sheet->getStyle("{$col}2:{$col}{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
        }

        return [];
    }
}