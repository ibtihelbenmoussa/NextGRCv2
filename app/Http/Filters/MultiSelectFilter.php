<?php

namespace App\Http\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class MultiSelectFilter implements Filter
{
    protected array $mapping;

    public function __construct(array $mapping = [])
    {
        $this->mapping = $mapping;
    }

    public function __invoke(Builder $query, $value, string $property): Builder
    {
        // Handle comma-separated values or arrays
        $values = is_array($value) ? $value : explode(',', $value);

        // If mapping provided, translate values
        if (!empty($this->mapping)) {
            $values = array_map(function ($val) {
                return $this->mapping[$val] ?? $val;
            }, $values);
        }

        return $query->whereIn($property, $values);
    }
}
