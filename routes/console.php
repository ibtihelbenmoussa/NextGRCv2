<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;


Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
Schedule::command('holidays:seed --year=' . (now()->year + 2))
    ->yearlyOn(1, 1, '00:30')
    ->withoutOverlapping()
    ->runInBackground();
