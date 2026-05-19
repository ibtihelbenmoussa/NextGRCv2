<?php

namespace App\Enums;

enum AuditMissionStatus: string
{
    case PLANNED = 'planned';
    case IN_PROGRESS = 'in_progress';
    case CLOSED = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::PLANNED => 'Planned',
            self::IN_PROGRESS => 'In Progress',
            self::CLOSED => 'Closed',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PLANNED => 'blue',
            self::IN_PROGRESS => 'yellow',
            self::CLOSED => 'green',
        };
    }
}
