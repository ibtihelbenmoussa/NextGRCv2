<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class BooleanFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property): Builder
    {
        // Handle various boolean representations
        $boolValue = filter_var($value, FILTER_VALIDATE_BOOLEAN);

        return $query->where($property, $boolValue);
    }
}
