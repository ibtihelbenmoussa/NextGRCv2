<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ProcessesExport implements FromCollection, WithHeadings, WithMapping
{
    protected $processes;

    public function __construct($processes)
    {
        $this->processes = $processes;
    }

    public function collection()
    {
        return collect($this->processes);
    }

    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Description',
            'Objectives',
            'Macro Process',
            'Business Unit',
            'Status',
            'Managers',
            'Risks',
            'Created At',
            'Updated At',
        ];
    }

    public function map($process): array
    {
        return [
            $process->code,
            $process->name,
            $process->description ?? '',
            $process->objectives ?? '',
            $process->macroProcess ? $process->macroProcess->name : '',
            $process->macroProcess && $process->macroProcess->businessUnit ? $process->macroProcess->businessUnit->name : '',
            $process->is_active ? 'Active' : 'Inactive',
            $process->managers ? $process->managers->pluck('name')->join(', ') : '',
            $process->risks_count ?? 0,
            $process->created_at ? $process->created_at->format('Y-m-d H:i:s') : '',
            $process->updated_at ? $process->updated_at->format('Y-m-d H:i:s') : '',
        ];
    }
}
