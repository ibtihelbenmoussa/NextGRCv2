<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class UsersExport implements FromCollection, WithHeadings, WithMapping
{
    protected $users;

    public function __construct($users)
    {
        $this->users = $users;
    }

    public function collection()
    {
        return collect($this->users);
    }

    public function headings(): array
    {
        return [
            'Name',
            'Email',
            'Email Verified',
            'Organizations',
            'Roles',
            'Created At',
            'Updated At',
        ];
    }

    public function map($user): array
    {
        return [
            $user->name,
            $user->email,
            $user->email_verified_at ? 'Yes' : 'No',
            $user->organizations ? $user->organizations->pluck('name')->join(', ') : '',
            $user->roles ? $user->roles->pluck('name')->join(', ') : '',
            $user->created_at ? $user->created_at->format('Y-m-d H:i:s') : '',
            $user->updated_at ? $user->updated_at->format('Y-m-d H:i:s') : '',
        ];
    }
}
