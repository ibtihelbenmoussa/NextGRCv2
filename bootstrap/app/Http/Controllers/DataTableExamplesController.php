<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

/**
 * Example controller demonstrating various DataTable use cases with Spatie Query Builder
 */
class DataTableExamplesController extends Controller
{
    /**
     * Example 1: Simple DataTable with basic filters
     */
    public function simpleExample(Request $request)
    {
        $users = QueryBuilder::for(\App\Models\User::class)
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::partial('email'),
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts(['name', 'email', 'created_at'])
            ->defaultSort('name')
            ->paginate($request->input('per_page', 10))
            ->appends($request->query());

        return inertia('examples/simple', [
            'users' => $users,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Example 2: Advanced DataTable with relationships
     */
    public function advancedExample(Request $request)
    {
        $posts = QueryBuilder::for(\App\Models\Post::class)
            ->allowedFilters([
                AllowedFilter::partial('title'),
                AllowedFilter::partial('content'),

                // Filter by relationship
                AllowedFilter::exact('author.name', 'users.name'),
                AllowedFilter::exact('category_id'),

                // Scope filter
                AllowedFilter::scope('published'),

                // Custom callback filter
                AllowedFilter::callback('has_comments', function (Builder $query, $value) {
                    if ($value) {
                        $query->has('comments');
                    } else {
                        $query->doesntHave('comments');
                    }
                }),

                // Date range filters
                AllowedFilter::callback('date_from', function (Builder $query, $value) {
                    $query->whereDate('created_at', '>=', $value);
                }),
                AllowedFilter::callback('date_to', function (Builder $query, $value) {
                    $query->whereDate('created_at', '<=', $value);
                }),
            ])
            ->allowedSorts([
                'title',
                'created_at',
                'updated_at',
                AllowedSort::field('author_name', 'users.name'),
            ])
            ->allowedIncludes(['author', 'category', 'tags'])
            ->with(['author', 'category']) // Always load these
            ->withCount('comments') // Include comment count
            ->defaultSort('-created_at')
            ->paginate($request->input('per_page', 10))
            ->appends($request->query());

        return inertia('examples/advanced', [
            'posts' => $posts,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Example 3: DataTable with global search across multiple columns
     */
    public function searchExample(Request $request)
    {
        $query = \App\Models\Product::query();

        // Apply global search if provided
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($subQuery) use ($search) {
                        $subQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $products = QueryBuilder::for($query)
            ->allowedFilters([
                AllowedFilter::exact('category_id'),
                AllowedFilter::scope('in_stock'),
                AllowedFilter::callback('price_range', function (Builder $query, $value) {
                    [$min, $max] = explode(',', $value);
                    $query->whereBetween('price', [$min, $max]);
                }),
            ])
            ->allowedSorts(['name', 'price', 'created_at'])
            ->with('category')
            ->defaultSort('name')
            ->paginate($request->input('per_page', 10))
            ->appends($request->query());

        return inertia('examples/search', [
            'products' => $products,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Example 4: DataTable with soft deletes (trashed filter)
     */
    public function trashedExample(Request $request)
    {
        $orders = QueryBuilder::for(\App\Models\Order::class)
            ->allowedFilters([
                AllowedFilter::trashed(), // Enables filter[trashed]=with|only|without
                AllowedFilter::exact('status'),
                AllowedFilter::partial('customer_name'),
            ])
            ->allowedSorts(['created_at', 'total', 'status'])
            ->defaultSort('-created_at')
            ->paginate($request->input('per_page', 10))
            ->appends($request->query());

        return inertia('examples/trashed', [
            'orders' => $orders,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Example 5: DataTable with custom aggregates
     */
    public function aggregatesExample(Request $request)
    {
        $departments = QueryBuilder::for(\App\Models\Department::class)
            ->allowedFilters([
                AllowedFilter::partial('name'),
                AllowedFilter::exact('is_active'),
            ])
            ->allowedSorts([
                'name',
                'employees_count',
                'total_salary',
            ])
            ->withCount('employees')
            ->withSum('employees as total_salary', 'salary')
            ->withAvg('employees as average_salary', 'salary')
            ->defaultSort('name')
            ->paginate($request->input('per_page', 10))
            ->appends($request->query());

        return inertia('examples/aggregates', [
            'departments' => $departments,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Example 6: DataTable with multiple array filters
     */
    public function multipleFiltersExample(Request $request)
    {
        $tasks = QueryBuilder::for(\App\Models\Task::class)
            ->allowedFilters([
                // Multiple status values: filter[status][]=pending&filter[status][]=in_progress
                AllowedFilter::exact('status'),

                // Multiple assignee IDs: filter[assignee_id][]=1&filter[assignee_id][]=2
                AllowedFilter::exact('assignee_id'),

                // Multiple priority values
                AllowedFilter::exact('priority'),

                // Tags (many-to-many relationship)
                AllowedFilter::callback('tags', function (Builder $query, $value) {
                    $tags = is_array($value) ? $value : [$value];
                    $query->whereHas('tags', function ($q) use ($tags) {
                        $q->whereIn('name', $tags);
                    });
                }),
            ])
            ->allowedSorts(['title', 'due_date', 'priority', 'created_at'])
            ->with(['assignee', 'tags'])
            ->defaultSort('due_date')
            ->paginate($request->input('per_page', 10))
            ->appends($request->query());

        return inertia('examples/multiple-filters', [
            'tasks' => $tasks,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Example 7: DataTable with numeric range filters
     */
    public function numericRangeExample(Request $request)
    {
        $properties = QueryBuilder::for(\App\Models\Property::class)
            ->allowedFilters([
                // Price range
                AllowedFilter::callback('price_min', function (Builder $query, $value) {
                    $query->where('price', '>=', $value);
                }),
                AllowedFilter::callback('price_max', function (Builder $query, $value) {
                    $query->where('price', '<=', $value);
                }),

                // Bedrooms
                AllowedFilter::callback('bedrooms_min', function (Builder $query, $value) {
                    $query->where('bedrooms', '>=', $value);
                }),

                // Square footage range
                AllowedFilter::callback('sqft_range', function (Builder $query, $value) {
                    [$min, $max] = explode('-', $value);
                    $query->whereBetween('square_feet', [(int)$min, (int)$max]);
                }),

                // Location
                AllowedFilter::partial('city'),
                AllowedFilter::exact('state'),
            ])
            ->allowedSorts(['price', 'bedrooms', 'square_feet', 'created_at'])
            ->defaultSort('-created_at')
            ->paginate($request->input('per_page', 10))
            ->appends($request->query());

        return inertia('examples/numeric-range', [
            'properties' => $properties,
            'filters' => $this->getCurrentFilters(),
        ]);
    }

    /**
     * Helper method to get current filters from request
     */
    protected function getCurrentFilters(): array
    {
        $request = request();
        $sort = $request->input('sort', '');

        return [
            'search' => $request->input('search'),
            'status' => $request->input('filter.status', []),
            'date_from' => $request->input('filter.date_from'),
            'date_to' => $request->input('filter.date_to'),
            'sort_column' => ltrim($sort, '-'),
            'sort_direction' => str_starts_with($sort, '-') ? 'desc' : 'asc',
            'per_page' => $request->input('per_page', 10),
        ];
    }
}
