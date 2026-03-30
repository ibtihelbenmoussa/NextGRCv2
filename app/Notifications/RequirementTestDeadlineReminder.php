<?php

namespace App\Notifications;

use App\Models\RequirementTest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class RequirementTestDeadlineReminder extends Notification
{
    use Queueable;

    public function __construct(
        public RequirementTest $test,
        public int $daysLeft       // nombre de jours restants avant deadline
    ) {}

    /**
     * Canaux : email + base de données (badge cloche)
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Email envoyé à l'utilisateur
     */
    public function toMail(object $notifiable): MailMessage
    {
        $requirement = $this->test->requirement;
        $url = url("/requirement-tests/{$this->test->id}");

        $label = $this->daysLeft === 0
            ? "aujourd'hui"
            : "dans {$this->daysLeft} jour(s)";

        return (new MailMessage)
            ->subject("⏰ Rappel NextGRC — Test à effectuer {$label}")
            ->greeting("Bonjour {$notifiable->name},")
            ->line("Un test de conformité arrive à échéance **{$label}**.")
            ->line("**Requirement :** " . ($requirement->title ?? $requirement->code ?? 'N/A'))
            ->line("**Test :** " . ($this->test->name ?? $this->test->test_code ?? 'N/A'))
            ->line("**Date limite :** " . optional($this->test->effective_date)->format('d/m/Y'))
            ->action('Voir le test', $url)
            ->line('Merci de traiter ce test dans les délais.')
            ->salutation('— Équipe NextGRC');
    }

    /**
     * Données stockées en DB (badge cloche navbar)
     */
    public function toArray(object $notifiable): array
    {
        $requirement = $this->test->requirement;

        return [
            'requirement_test_id' => $this->test->id,
            'test_code'           => $this->test->test_code,
            'test_name'           => $this->test->name,
            'requirement_title'   => $requirement->title ?? $requirement->code ?? null,
            'effective_date'      => optional($this->test->effective_date)->toDateString(),
            'days_left'           => $this->daysLeft,
            'message'             => $this->daysLeft === 0
                ? "Test à effectuer aujourd'hui"
                : "Test à effectuer dans {$this->daysLeft} jour(s)",
        ];
    }
}