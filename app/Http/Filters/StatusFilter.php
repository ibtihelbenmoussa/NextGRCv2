<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class StatusFilter implements Filter
{
    /**
     * Custom status filter for handling active/inactive status
     *
     * @param Builder $query
     * @param mixed $value Can be 'Active', 'Inactive', or array of both
     * @param string $property The column to filter (default: 'is_active')
     */
    public function __invoke(Builder $query, $value, string $property = 'is_active'): Builder
    {
        // Handle comma-separated values or arrays
        $statuses = is_array($value) ? $value : explode(',', $value);

        // Remove duplicates
        $statuses = array_unique($statuses);

        // Check which statuses are selected
        $hasActive = in_array('Active', $statuses);
        $hasInactive = in_array('Inactive', $statuses);

        // Only filter if not both selected (both = show all)
        if ($hasActive && !$hasInactive) {
            return $query->where($property, true);
        } elseif ($hasInactive && !$hasActive) {
            return $query->where($property, false);
        }

        // If both or neither, don't filter (show all)
        return $query;
    }
}
