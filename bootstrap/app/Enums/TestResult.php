<?php

namespace App\Enums;

enum TestResult: string
{
    case EFFECTIVE = 'effective';
    case PARTIALLY_EFFECTIVE = 'partially_effective';
    case INEFFECTIVE = 'ineffective';
    case NOT_APPLICABLE = 'not_applicable';

    public function label(): string
    {
        return match ($this) {
            self::EFFECTIVE => 'Effective',
            self::PARTIALLY_EFFECTIVE => 'Partially Effective',
            self::INEFFECTIVE => 'Ineffective',
            self::NOT_APPLICABLE => 'Not Applicable',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::EFFECTIVE => 'green',
            self::PARTIALLY_EFFECTIVE => 'yellow',
            self::INEFFECTIVE => 'red',
            self::NOT_APPLICABLE => 'gray',
        };
    }
}
