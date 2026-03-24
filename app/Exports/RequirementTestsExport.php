<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RequirementTestsExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Collection $tests;

    public function __construct(Collection $tests)
    {
        $this->tests = $tests;
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

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]], 
        ];
    }
}