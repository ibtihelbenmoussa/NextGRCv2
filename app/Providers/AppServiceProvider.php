<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;
use App\Services\WorkingDayService;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
            $this->app->singleton(WorkingDayService::class);

    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register morph map for polymorphic relationships
        Relation::morphMap([
            'process' => \App\Models\Process::class,
            'macro_process' => \App\Models\MacroProcess::class,
        ]);
    }
}
