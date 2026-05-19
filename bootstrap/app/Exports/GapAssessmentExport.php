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
use PhpOffice\PhpSpreadsheet\Style\Color;

class GapAssessmentExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithColumnWidths,
    WithTitle
{
    public function __construct(protected Collection $assessments) {}

    public function title(): string
    {
        return 'Gap Assessments';
    }

    public function collection(): Collection
    {
        return $this->assessments;
    }

    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Description',
            'Framework',
            'Status',
            'Start Date',
            'End Date',
            'Requirements',
            'Questions',
            'Answers',
            'Progress (%)',
        ];
    }

    public function map($assessment): array
    {
        $questionsCount = $assessment['questions_count'] ?? 0;
        $answersCount   = $assessment['answers_count']   ?? 0;

        // Compute status
        $status = 'In Progress';
        if ($questionsCount > 0 && $answersCount >= $questionsCount) {
            $status = 'Completed';
        } elseif (!empty($assessment['end_date']) && strtotime($assessment['end_date']) < time() && $answersCount < $questionsCount) {
            $status = 'Overdue';
        } elseif (!empty($assessment['start_date']) && strtotime($assessment['start_date']) > time()) {
            $status = 'Upcoming';
        }

        $progress = $questionsCount > 0
            ? round(($answersCount / $questionsCount) * 100, 1)
            : 0;

        return [
            $assessment['code']                     ?? '',
            $assessment['name']                     ?? '',
            $assessment['description']              ?? '',
            $assessment['framework']['code'] ?? '' .
                ($assessment['framework']['name'] ?? '' ? ' — ' . $assessment['framework']['name'] : ''),
            $status,
            $assessment['start_date']               ?? '',
            $assessment['end_date']                 ?? '',
            $assessment['requirements_count']       ?? 0,
            $questionsCount,
            $answersCount,
            $progress . '%',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 18,  // Code
            'B' => 36,  // Name
            'C' => 40,  // Description
            'D' => 36,  // Framework
            'E' => 16,  // Status
            'F' => 16,  // Start Date
            'G' => 16,  // End Date
            'H' => 14,  // Requirements
            'I' => 12,  // Questions
            'J' => 12,  // Answers
            'K' => 14,  // Progress
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // ── Header row ───────────────────────────────────────────────
        $sheet->getStyle('A1:K1')->applyFromArray([
            'font' => [
                'bold'  => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size'  => 11,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF1E293B'],  // slate-800 — matches NextGRC dark theme
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
        $lastRow = $this->assessments->count() + 1;

        for ($row = 2; $row <= $lastRow; $row++) {
            $argb = ($row % 2 === 0) ? 'FFF8FAFC' : 'FFFFFFFF';
            $sheet->getStyle("A{$row}:K{$row}")->applyFromArray([
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => $argb],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
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
        $sheet->getStyle("A1:K{$lastRow}")->applyFromArray([
            'borders' => [
                'outline' => [
                    'borderStyle' => Border::BORDER_MEDIUM,
                    'color'       => ['argb' => 'FF94A3B8'],
                ],
            ],
        ]);

        // ── Numeric columns right-aligned ────────────────────────────
        $sheet->getStyle("H2:K{$lastRow}")->applyFromArray([
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        return [];
    }
}