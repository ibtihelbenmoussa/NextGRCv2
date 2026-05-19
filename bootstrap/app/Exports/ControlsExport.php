<?php

namespace App\Exports;

use App\Models\Control;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ControlsExport implements FromCollection, WithHeadings
{
    protected int $orgId;
    protected array $filters;

    public function __construct(int $orgId, array $filters = [])
    {
        $this->orgId = $orgId;
        $this->filters = $filters;
    }

    public function collection()
    {
        $query = Control::where('organization_id', $this->orgId)
            ->with('owner');

   
        if (!empty($this->filters['filter']['status'])) {
            $status = $this->filters['filter']['status'];
            if ($status === 'Active') {
                $query->where('is_active', true);
            } elseif ($status === 'Inactive') {
                $query->where('is_active', false);
            }
        }

        if (!empty($this->filters['filter']['owner'])) {
            $query->where('owner_id', $this->filters['filter']['owner']);
        }

        if (!empty($this->filters['filter']['date_from'])) {
            $query->whereDate('created_at', '>=', $this->filters['filter']['date_from']);
        }

        if (!empty($this->filters['filter']['date_to'])) {
            $query->whereDate('created_at', '<=', $this->filters['filter']['date_to']);
        }

        return $query->get()->map(function ($control) {
            return [
                'Code'       => $control->code,
                'Name'       => $control->name,
                'Owner'      => $control->owner?->name,
                'Status'     => $control->is_active ? 'Active' : 'Inactive',
                'Updated At' => optional($control->updated_at)->format('Y-m-d H:i'),
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Owner',
            'Status',
            'Updated At',
        ];
    }
}
