<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class MacroProcessesExport implements FromCollection, WithHeadings, WithMapping
{
    protected $macroProcesses;

    public function __construct($macroProcesses)
    {
        $this->macroProcesses = $macroProcesses;
    }

    public function collection()
    {
        return collect($this->macroProcesses);
    }

    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Description',
            'Objectives',
            'Business Unit',
            'Status',
            'Managers',
            'Processes',
            'Created At',
            'Updated At',
        ];
    }

    public function map($macroProcess): array
    {
        return [
            $macroProcess->code,
            $macroProcess->name,
            $macroProcess->description ?? '',
            $macroProcess->objectives ?? '',
            $macroProcess->businessUnit ? $macroProcess->businessUnit->name : '',
            $macroProcess->is_active ? 'Active' : 'Inactive',
            $macroProcess->managers ? $macroProcess->managers->pluck('name')->join(', ') : '',
            $macroProcess->processes_count ?? 0,
            $macroProcess->created_at ? $macroProcess->created_at->format('Y-m-d H:i:s') : '',
            $macroProcess->updated_at ? $macroProcess->updated_at->format('Y-m-d H:i:s') : '',
        ];
    }
}
