<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class RequirementsExport implements FromCollection, WithHeadings, WithMapping
{
    protected $requirements;

    public function __construct(Collection $requirements)
    {
        $this->requirements = $requirements;
    }

    public function collection()
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
}