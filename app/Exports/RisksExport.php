<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class RisksExport implements FromCollection, WithHeadings, WithMapping
{
    protected $risks;

    public function __construct($risks)
    {
        $this->risks = $risks;
    }

    public function collection()
    {
        return collect($this->risks);
    }

    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Description',
            'Category',
            'Owner',
            'Inherent Likelihood',
            'Inherent Impact',
            'Inherent Score',
            'Residual Likelihood',
            'Residual Impact',
            'Residual Score',
            'Processes',
            'Controls',
            'Status',
            'Created At',
            'Updated At',
        ];
    }

    public function map($risk): array
    {
        return [
            $risk->code,
            $risk->name,
            $risk->description ?? '',
            $risk->category ?? '',
            $risk->owner ? $risk->owner->name : '',
            $risk->inherent_likelihood ?? '',
            $risk->inherent_impact ?? '',
            $risk->inherent_score ?? '',
            $risk->residual_likelihood ?? '',
            $risk->residual_impact ?? '',
            $risk->residual_score ?? '',
            $risk->processes ? $risk->processes->pluck('name')->join(', ') : '',
            $risk->controls_count ?? 0,
            $risk->is_active ? 'Active' : 'Inactive',
            $risk->created_at ? $risk->created_at->format('Y-m-d H:i:s') : '',
            $risk->updated_at ? $risk->updated_at->format('Y-m-d H:i:s') : '',
        ];
    }
}
