<?php

namespace App\QueryBuilder\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class ResidualScoreSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'desc' : 'asc';

        $query->orderByRaw("(residual_likelihood * residual_impact) {$direction}");
    }
}