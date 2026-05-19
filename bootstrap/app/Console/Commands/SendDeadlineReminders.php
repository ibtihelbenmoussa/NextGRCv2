<?php

namespace App\Console\Commands;

use App\Models\Requirement;
use App\Models\User;
use App\Notifications\RequirementTestDeadlineReminder;
use App\Models\RequirementTest;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendDeadlineReminders extends Command
{
    protected $signature   = 'reminders:send-deadline';
    protected $description = 'Envoie des rappels email pour les RequirementTests proches de leur deadline';

    public function handle(): void
    {
        // Jours pour lesquels on envoie un rappel (J-7, J-3, J-1, J-0)
        $triggerDays = [7, 3, 1, 0];

        $today = Carbon::today();

        foreach ($triggerDays as $days) {
            $targetDate = $today->copy()->addDays($days);

            // ✅ On cherche sur requirements.effective_date
            // car requirement_tests.effective_date est NULL
            $requirements = Requirement::with(['tests' => function ($q) {
                    $q->latest('test_date')->limit(1);
                }])
                ->whereDate('effective_date', $targetDate)
                ->whereNotNull('effective_date')
                ->where('is_deleted', 0)
                ->get();

            if ($requirements->isEmpty()) {
                $this->line("ℹ️  Aucun requirement trouvé pour J-{$days} ({$targetDate->format('Y-m-d')})");
                continue;
            }

            foreach ($requirements as $requirement) {
                // ✅ Cherche l'utilisateur responsable
                // Essaie owner_id en premier, puis user_id
                $userId = $requirement->owner_id ?? $requirement->user_id ?? null;
                $user   = $userId ? User::find($userId) : null;

                if (!$user) {
                    $this->warn("⚠️  Aucun utilisateur trouvé pour requirement {$requirement->code}");
                    continue;
                }

                // ✅ Vérifie qu'un test n'a pas déjà été fait et accepté
                $latestTest = $requirement->tests->first();
                if ($latestTest && $latestTest->validation_status === 'accepted') {
                    $this->line("⏭️  Test déjà accepté pour {$requirement->code} — rappel ignoré");
                    continue;
                }

                // ✅ Crée un RequirementTest temporaire pour la notification
                // (on n'insère rien en DB, juste pour passer les données)
                $fakeTest = new RequirementTest([
                    'test_code'      => 'REMINDER',
                    'name'           => $requirement->title,
                    'effective_date' => $requirement->effective_date,
                    'status'         => 'pending',
                ]);
                $fakeTest->requirement_id = $requirement->id;
                $fakeTest->setRelation('requirement', $requirement);

                // ✅ Envoie la notification (email + DB)
                $user->notify(
                    new RequirementTestDeadlineReminder($fakeTest, $days)
                );

                $this->info("✅ Rappel envoyé à {$user->name} pour {$requirement->code} (J-{$days})");
            }
        }

        $this->info('✅ Traitement des rappels terminé.');
    }
}