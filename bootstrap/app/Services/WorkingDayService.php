<?php
namespace App\Services;

use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class WorkingDayService
{
    // Cache des jours fériés pour éviter N requêtes DB
    private ?Collection $holidayCache = null;
    private ?int $cachedOrgId = null;

    // ── Jours ouvrables par fréquence ─────────────────────────────
    const WORKING_DAYS = [
        'daily'       => 1,
        'weekly'      => 5,
        'monthly'     => 21,
        'quarterly'   => 63,
        'yearly'      => 252,
        'continuous'  => 1,
        'one_time'    => 0,
    ];

    // ── Charger les jours fériés (avec cache) ─────────────────────
    private function loadHolidays(?int $organizationId): Collection
    {
        if ($this->holidayCache !== null && $this->cachedOrgId === $organizationId) {
            return $this->holidayCache;
        }

        $this->cachedOrgId = $organizationId;
        $this->holidayCache = Holiday::query()
            ->where(function ($q) use ($organizationId) {
                $q->whereNull('organization_id'); // jours fériés globaux
                if ($organizationId) {
                    $q->orWhere('organization_id', $organizationId);
                }
            })
            ->pluck('date')
            ->map(fn($d) => Carbon::parse($d)->toDateString());

        return $this->holidayCache;
    }

    // ── isWorkingDay ──────────────────────────────────────────────
    public function isWorkingDay(Carbon $date, ?int $organizationId = null): bool
    {
        // Samedi (6) ou Dimanche (0)
        if ($date->isWeekend()) {
            return false;
        }

        $holidays = $this->loadHolidays($organizationId);

        return !$holidays->contains($date->toDateString());
    }

    // ── addWorkingDays ─────────────────────────────────────────────
    public function addWorkingDays(Carbon $date, int $days, ?int $organizationId = null): Carbon
    {
        if ($days <= 0) return $date->copy();

        $result  = $date->copy();
        $added   = 0;

        while ($added < $days) {
            $result->addDay();
            if ($this->isWorkingDay($result, $organizationId)) {
                $added++;
            }
        }

        return $result;
    }

    // ── nextEffectiveDate ──────────────────────────────────────────
    public function nextEffectiveDate(
        Carbon  $from,
        string  $frequency,
        ?int    $organizationId = null
    ): ?Carbon {
        $days = self::WORKING_DAYS[strtolower($frequency)] ?? null;

        if ($days === null || $days === 0) {
            return null; // one_time → pas de prochaine date
        }

        return $this->addWorkingDays($from, $days, $organizationId);
    }

    // ── previousWorkingDay (bonus) ─────────────────────────────────
    public function previousWorkingDay(Carbon $date, ?int $organizationId = null): Carbon
    {
        $result = $date->copy()->subDay();
        while (!$this->isWorkingDay($result, $organizationId)) {
            $result->subDay();
        }
        return $result;
    }

    // ── nearestWorkingDay ──────────────────────────────────────────
    // Si la date tombe un week-end/férié, avance au prochain jour ouvrable
    public function nearestWorkingDay(Carbon $date, ?int $organizationId = null): Carbon
    {
        $result = $date->copy();
        while (!$this->isWorkingDay($result, $organizationId)) {
            $result->addDay();
        }
        return $result;
    }

    // ── countWorkingDaysBetween (bonus analytics) ──────────────────
    public function countWorkingDaysBetween(
        Carbon $start,
        Carbon $end,
        ?int   $organizationId = null
    ): int {
        $count   = 0;
        $current = $start->copy();

        while ($current->lte($end)) {
            if ($this->isWorkingDay($current, $organizationId)) {
                $count++;
            }
            $current->addDay();
        }

        return $count;
    }
}