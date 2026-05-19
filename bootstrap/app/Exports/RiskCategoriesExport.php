<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RiskCategoriesExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected $riskCategories;

    public function __construct(Collection $riskCategories)
    {
        $this->riskCategories = $riskCategories;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->riskCategories;
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Code',
            'Name',
            'Description',
            'Parent Category',
            'Color',
            'Status',
            'Risks Count',
            'Created At',
            'Updated At',
        ];
    }

    /**
     * @param mixed $riskCategory
     * @return array
     */
    public function map($riskCategory): array
    {
        return [
            $riskCategory->code,
            $riskCategory->name,
            $riskCategory->description ?? 'N/A',
            $riskCategory->parent ? $riskCategory->parent->name : 'Root',
            $riskCategory->color ?? 'N/A',
            $riskCategory->is_active ? 'Active' : 'Inactive',
            $riskCategory->risks_count ?? 0,
            $riskCategory->created_at->format('Y-m-d H:i:s'),
            $riskCategory->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as bold text
            1 => ['font' => ['bold' => true]],
        ];
    }
}
