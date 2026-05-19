<?php
namespace App\Console\Commands;

use Database\Seeders\TunisianHolidaysSeeder;
use Illuminate\Console\Command;

class SeedHolidays extends Command
{
    protected $signature   = 'holidays:seed {--year= : Specific year to seed}';
    protected $description = 'Seed Tunisian public holidays (fixed + Islamic via Aladhan API)';

    public function handle(): void
    {
        $seeder = new TunisianHolidaysSeeder();
        $seeder->setCommand($this);

        $year = $this->option('year');

        if ($year) {
            if (!is_numeric($year) || (int)$year < 2000 || (int)$year > 2100) {
                $this->error("Invalid year: $year");
                return;
            }
            $seeder->seedYear((int) $year);
        } else {
            $seeder->run();
        }
    }
}