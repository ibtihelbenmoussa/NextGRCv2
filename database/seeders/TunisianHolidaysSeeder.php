<?php
namespace Database\Seeders;

use App\Models\Holiday;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TunisianHolidaysSeeder extends Seeder
{
    private const ISLAMIC_EVENTS = [
        [1,  1,  "Ras el-Am el-Hijri"],
        [3,  12, "Mouled an-Nabawi"],
        [10, 1,  "Aïd el-Fitr (J1)"],
        [10, 2,  "Aïd el-Fitr (J2)"],
        [12, 10, "Aïd el-Adha (J1)"],
        [12, 11, "Aïd el-Adha (J2)"],
    ];

    private const FIXED_HOLIDAYS = [
        ["01-01", "Jour de l'An"],
        ["03-20", "Fête de l'Indépendance"],
        ["04-09", "Jour des Martyrs"],
        ["05-01", "Fête du Travail"],
        ["06-01", "Fête de la Jeunesse"],
        ["07-25", "Fête de la République"],
        ["08-13", "Fête de la Femme"],
        ["10-15", "Fête de l'Évacuation"],
    ];

    // ── Point d'entrée principal ───────────────────────────────────
    public function run(): void
    {
        $years = [now()->year, now()->year + 1, now()->year + 2];

        foreach ($years as $year) {
            $this->seedYear($year);
        }

        $this->command->info("\n✅ All years seeded!");
    }

    // ── Seeder une année précise ───────────────────────────────────
    public function seedYear(int $year): void
    {
        $this->command->info("\n🗓  Seeding holidays for $year...");
        $this->seedFixedHolidays($year);
        $this->seedIslamicHolidays($year);
        $this->command->info("✅ Done for $year!");
    }

    // ── Jours fériés civils ────────────────────────────────────────
    private function seedFixedHolidays(int $year): void
    {
        foreach (self::FIXED_HOLIDAYS as [$monthDay, $name]) {
            $date = "$year-$monthDay";
            Holiday::updateOrCreate(
                ['date' => $date, 'organization_id' => null],
                ['name' => $name]
            );
            $this->command->line("  ✔ $name → $date");
        }
    }

    // ── Jours fériés islamiques ────────────────────────────────────
   private function seedIslamicHolidays(int $year): void
{
    $this->command->info("  🌙 Fetching Islamic holidays from Aladhan API...");

    // Dates des jours fixes pour cette année (ne pas les écraser)
    $fixedDates = collect(self::FIXED_HOLIDAYS)
        ->map(fn($h) => "$year-{$h[0]}")
        ->toArray();

    $hijriYear  = $this->approximateHijriYear($year);
    $hijriYears = [$hijriYear - 1, $hijriYear, $hijriYear + 1];

    foreach (self::ISLAMIC_EVENTS as [$hijriMonth, $hijriDay, $name]) {
        $found = false;

        foreach ($hijriYears as $hy) {
            $gregorianDate = $this->hijriToGregorian($hijriDay, $hijriMonth, $hy);

            if ($gregorianDate && str_starts_with($gregorianDate, (string) $year)) {
                if (in_array($gregorianDate, $fixedDates)) {
                    // Coïncidence : jour islamique tombe sur un jour fixe
                    // On ajoute un suffixe au nom du jour fixe existant
                    Holiday::where('date', $gregorianDate)
                        ->whereNull('organization_id')
                        ->update(['name' => Holiday::where('date', $gregorianDate)
                            ->whereNull('organization_id')
                            ->value('name') . " / $name"]);
                    $this->command->line("  ✔ $name → $gregorianDate (coïncide avec jour fixe)");
                } else {
                    Holiday::updateOrCreate(
                        ['date' => $gregorianDate, 'organization_id' => null],
                        ['name' => $name]
                    );
                    $this->command->line("  ✔ $name → $gregorianDate");
                }
                $found = true;
                break;
            }

            usleep(200_000);
        }

        if (!$found) {
            $this->command->warn("  ⚠ Not found: $name ($year)");
        }
    }
}
    // ── Appel API Aladhan : hijri → grégorien ─────────────────────
    private function hijriToGregorian(int $day, int $month, int $hijriYear): ?string
    {
        $dateStr = sprintf('%02d-%02d-%04d', $day, $month, $hijriYear);

        try {
            $response = Http::timeout(15)
                ->get("https://api.aladhan.com/v1/hToG/$dateStr");

            if (!$response->successful()) {
                Log::warning("Aladhan non-200 for $dateStr", ['status' => $response->status()]);
                return null;
            }

            $raw = $response->json('data.gregorian.date'); // "DD-MM-YYYY"
            if (!$raw) return null;

            $parts = explode('-', $raw);
            if (count($parts) !== 3) return null;

            return "{$parts[2]}-{$parts[1]}-{$parts[0]}"; // YYYY-MM-DD

        } catch (\Exception $e) {
            Log::error("Aladhan exception for $dateStr: " . $e->getMessage());
            return null;
        }
    }

    // ── Estimation année hijri ─────────────────────────────────────
    private function approximateHijriYear(int $gregorianYear): int
    {
        return (int) round(($gregorianYear - 622) * (33 / 32));
    }
}