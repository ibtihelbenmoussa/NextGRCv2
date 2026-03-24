<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

trait HasDataTable
{
    /**
     * Build a query using Spatie Query Builder with common DataTable features
     *
     * @param string|Builder $modelClass The model class name or builder instance
     * @param array $config Configuration array with the following keys:
     *   - searchColumns: array of columns to search in (default: [])
     *   - filters: array of allowed filters (default: [])
     *   - sorts: array of allowed sorts (default: [])
     *   - defaultSort: string or array of default sort (default: null)
     *   - includes: array of allowed includes (default: [])
     *   - perPage: int number of items per page (default: 10)
     *   - scopes: array of scopes to apply (default: [])
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    protected function buildDataTableQuery($modelClass, array $config = [])
    {
        $request = request();

        // Extract configuration with defaults
        $searchColumns = $config['searchColumns'] ?? [];
        $filters = $config['filters'] ?? [];
        $sorts = $config['sorts'] ?? [];
        $defaultSort = $config['defaultSort'] ?? null;
        $includes = $config['includes'] ?? [];
        $perPage = $request->input('per_page', $config['perPage'] ?? 10);
        $scopes = $config['scopes'] ?? [];

        // Start building query
        $query = QueryBuilder::for($modelClass);

        // Apply scopes if any
        foreach ($scopes as $scope => $parameters) {
            if (is_numeric($scope)) {
                // Simple scope without parameters
                $query->$parameters();
            } else {
                // Scope with parameters
                $query->$scope(...(is_array($parameters) ? $parameters : [$parameters]));
            }
        }

        // Build allowed filters
        $allowedFilters = $this->buildAllowedFilters($filters, $searchColumns);

        // Build allowed sorts
        $allowedSorts = $this->buildAllowedSorts($sorts);

        // Apply to query builder
        if (!empty($allowedFilters)) {
            $query->allowedFilters($allowedFilters);
        }

        if (!empty($allowedSorts)) {
            $query->allowedSorts($allowedSorts);
        }

        if (!empty($includes)) {
            $query->allowedIncludes($includes);
        }

        // Apply default sorting
        if ($defaultSort) {
            $query->defaultSort($defaultSort);
        }

        // Handle global search across multiple columns
        if ($request->has('search') && !empty($searchColumns)) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchColumns, $searchTerm) {
                foreach ($searchColumns as $column) {
                    // Handle nested relationships (e.g., 'managers.name')
                    if (str_contains($column, '.')) {
                        [$relation, $field] = explode('.', $column);
                        $q->orWhereHas($relation, function ($subQuery) use ($field, $searchTerm) {
                            $subQuery->where($field, 'like', "%{$searchTerm}%");
                        });
                    } else {
                        $q->orWhere($column, 'like', "%{$searchTerm}%");
                    }
                }
            });
        }

        // Paginate results
        return $query->paginate($perPage)->appends($request->query());
    }

    /**
     * Build allowed filters array
     *
     * @param array $filters
     * @param array $searchColumns
     * @return array
     */
    protected function buildAllowedFilters(array $filters, array $searchColumns = []): array
    {
        $allowedFilters = [];

        foreach ($filters as $key => $filter) {
            // If filter is already an AllowedFilter instance, use it directly
            if ($filter instanceof AllowedFilter) {
                $allowedFilters[] = $filter;
            }
            // If filter is a string, treat it as a partial match filter
            elseif (is_string($filter)) {
                $allowedFilters[] = AllowedFilter::partial($filter);
            }
            // If filter is an array, extract configuration
            elseif (is_array($filter)) {
                $filterName = $filter['name'] ?? $key;
                $filterType = $filter['type'] ?? 'partial';
                $filterColumn = $filter['column'] ?? $filterName;
                $nullable = $filter['nullable'] ?? false;
                $default = $filter['default'] ?? null;

                $allowedFilter = match ($filterType) {
                    'exact' => AllowedFilter::exact($filterName, $filterColumn),
                    'partial' => AllowedFilter::partial($filterName, $filterColumn),
                    'scope' => AllowedFilter::scope($filterName),
                    'trashed' => AllowedFilter::trashed(),
                    'callback' => isset($filter['callback'])
                        ? AllowedFilter::callback($filterName, $filter['callback'])
                        : AllowedFilter::partial($filterName, $filterColumn),
                    default => AllowedFilter::partial($filterName, $filterColumn),
                };

                if ($nullable) {
                    $allowedFilter->nullable();
                }

                if ($default !== null) {
                    $allowedFilter->default($default);
                }

                $allowedFilters[] = $allowedFilter;
            }
        }

        return $allowedFilters;
    }

    /**
     * Build allowed sorts array
     *
     * @param array $sorts
     * @return array
     */
    protected function buildAllowedSorts(array $sorts): array
    {
        $allowedSorts = [];

        foreach ($sorts as $key => $sort) {
            // If sort is a string, use it directly
            if (is_string($sort)) {
                $allowedSorts[] = $sort;
            }
            // If sort is an array, extract configuration
            elseif (is_array($sort)) {
                $sortName = $sort['name'] ?? $key;
                $sortColumn = $sort['column'] ?? null;

                if ($sortColumn) {
                    $allowedSorts[] = AllowedSort::field($sortName, $sortColumn);
                } else {
                    $allowedSorts[] = $sortName;
                }
            }
        }

        return $allowedSorts;
    }

    /**
     * Get current filters from request
     *
     * @return array
     */
    protected function getCurrentFilters(): array
    {
        $request = request();
        $sort = $request->input('sort', '');

        // Get all filter values from the request
        $filterData = $request->input('filter', []);

        return [
            'search' => $request->input('search'),
            'status' => $filterData['status'] ?? [],
            'date_from' => $filterData['date_from'] ?? null,
            'date_to' => $filterData['date_to'] ?? null,
            'sort_column' => ltrim($sort, '-'),
            'sort_direction' => str_starts_with($sort, '-') ? 'desc' : 'asc',
            'per_page' => $request->input('per_page', 10),
        ];
    }

    /**
     * Format pagination data for frontend
     *
     * @param \Illuminate\Contracts\Pagination\LengthAwarePaginator $paginator
     * @return array
     */
    protected function formatPaginationData($paginator): array
    {
        return [
            'data' => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
