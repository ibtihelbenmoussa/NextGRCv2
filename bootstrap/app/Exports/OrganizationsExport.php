<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class OrganizationsExport implements FromCollection, WithHeadings, WithMapping
{
    protected $organizations;

    public function __construct($organizations)
    {
        $this->organizations = $organizations;
    }

    public function collection()
    {
        return collect($this->organizations);
    }

    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Description',
            'Email',
            'Phone',
            'Address',
            'Status',
            'Business Units',
            'Users',
            'Risks',
            'Controls',
            'Created At',
        ];
    }

    public function map($organization): array
    {
        return [
            $organization->code,
            $organization->name,
            $organization->description ?? '',
            $organization->email ?? '',
            $organization->phone ?? '',
            $organization->address ?? '',
            $organization->is_active ? 'Active' : 'Inactive',
            $organization->business_units_count ?? 0,
            $organization->users_count ?? 0,
            $organization->risks_count ?? 0,
            $organization->controls_count ?? 0,
            $organization->created_at ? $organization->created_at->format('Y-m-d H:i:s') : '',
        ];
    }
}
