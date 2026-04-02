<?php
namespace Database\Seeders;

use App\Models\Holiday;
use Illuminate\Database\Seeder;

class TunisianHolidaysSeeder extends Seeder
{
    public function run(): void
    {
        $year = now()->year;

        $holidays = [
            // Jours fériés fixes
            ['date' => "$year-01-01", 'name' => 'Jour de l\'An'],
            ['date' => "$year-03-20", 'name' => 'Fête de l\'Indépendance'],
            ['date' => "$year-04-09", 'name' => 'Jour des Martyrs'],
            ['date' => "$year-05-01", 'name' => 'Fête du Travail'],
            ['date' => "$year-06-01", 'name' => 'Fête de la Jeunesse'],
            ['date' => "$year-07-25", 'name' => 'Fête de la République'],
            ['date' => "$year-08-13", 'name' => 'Fête de la Femme'],
            ['date' => "$year-10-15", 'name' => 'Fête de l\'Évacuation'],
            // Jours fériés religieux 2026 (approximatifs — à ajuster)
            ['date' => "$year-03-29", 'name' => 'Aïd el-Fitr (J1)'],
            ['date' => "$year-03-30", 'name' => 'Aïd el-Fitr (J2)'],
            ['date' => "$year-06-05", 'name' => 'Aïd el-Adha (J1)'],
            ['date' => "$year-06-06", 'name' => 'Aïd el-Adha (J2)'],
            ['date' => "$year-06-26", 'name' => 'Aïd el-Adha (J2)'],
            ['date' => "$year-06-27", 'name' => 'Ras el-Am el-Hijri'],
            ['date' => "$year-09-04", 'name' => 'Mouled'],
        ];

        foreach ($holidays as $h) {
            Holiday::updateOrCreate(
                ['date' => $h['date'], 'organization_id' => null],
                ['name' => $h['name']]
            );
        }
    }
}