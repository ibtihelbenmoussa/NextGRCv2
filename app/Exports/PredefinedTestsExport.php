<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Illuminate\Support\Collection;

class PredefinedTestsExport implements FromCollection, WithHeadings, WithMapping
{
    protected Collection $tests;

    public function __construct(Collection $tests)
    {
        $this->tests = $tests;
    }

    
    public function collection()
    {
        return $this->tests;
    }

    
    public function headings(): array
    {
        return [
            'Test Code',
            'Test Name',
            'Objective',
            'Procedure',
            'Requirement',
            'Created',
        ];
    }

    /**
     * Mapper chaque ligne pour Excel
     */
    public function map($test): array
    {
        return [
            $test->test_code ?? $test->code ?? '',
            $test->test_name ?? $test->name ?? '',
             $test->objective ?? '', 
            $test->procedure ?? '', 
            optional($test->requirement)->code ?? '',
            optional($test->created_at)->format('Y-m-d') ?? '',
        ];
    }
}