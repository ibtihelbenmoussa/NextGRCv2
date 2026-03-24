<?php

namespace App\QueryBuilder\Sorts;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Sorts\Sort;

class InherentScoreSort implements Sort
{
    public function __invoke(Builder $query, bool $descending, string $property)
    {
        $direction = $descending ? 'desc' : 'asc';

        $query->orderByRaw("(inherent_likelihood * inherent_impact) {$direction}");
    }
}