use App\Models\ActionPlan;
use App\Observers\ActionPlanObserver;

public function boot(): void
{
    ActionPlan::observe(ActionPlanObserver::class);
}