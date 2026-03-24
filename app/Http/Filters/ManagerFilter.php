<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class ManagerFilter implements Filter
{
    protected string $relationName;

    public function __construct(string $relationName = 'managers')
    {
        $this->relationName = $relationName;
    }

    public function __invoke(Builder $query, $value, string $property): Builder
    {
        return $query->whereHas($this->relationName, function ($q) use ($value) {
            $q->where('users.id', $value);
        });
    }
}
