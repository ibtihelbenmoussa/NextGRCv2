<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class FrameworksExport implements FromCollection, WithHeadings, WithMapping
{
    protected $frameworks;

    public function __construct(Collection $frameworks)
    {
        $this->frameworks = $frameworks;
    }

    public function collection()
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
}