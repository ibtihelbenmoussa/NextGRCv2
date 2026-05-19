<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class BusinessUnitsExport implements FromCollection, WithHeadings, WithMapping
{
    protected $businessUnits;

    public function __construct($businessUnits)
    {
        $this->businessUnits = $businessUnits;
    }

    public function collection()
    {
        return collect($this->businessUnits);
    }

    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Description',
            'Status',
            'Managers',
            'Macro Processes',
            'Created At',
            'Updated At',
        ];
    }

    public function map($businessUnit): array
    {
        return [
            $businessUnit->code,
            $businessUnit->name,
            $businessUnit->description ?? '',
            $businessUnit->is_active ? 'Active' : 'Inactive',
            $businessUnit->managers ? $businessUnit->managers->pluck('name')->join(', ') : '',
            $businessUnit->macro_processes_count ?? 0,
            $businessUnit->created_at ? $businessUnit->created_at->format('Y-m-d H:i:s') : '',
            $businessUnit->updated_at ? $businessUnit->updated_at->format('Y-m-d H:i:s') : '',
        ];
    }
}
