<?php

namespace App\Http\Controllers;

use App\Models\RiskCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\RiskCategoriesExport;

class RiskCategoryController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        // Get all categories with their relationships
        $allCategories = RiskCategory::where('organization_id', $currentOrgId)
            ->withCount('risks')
            ->get();

        $stats = [
            'total' => $allCategories->count(),
            'active' => $allCategories->where('is_active', true)->count(),
            'root_categories' => $allCategories->whereNull('parent_id')->count(),
            'total_risks' => $allCategories->sum('risks_count'),
        ];

        // Get all categories with nested children for tree view
        $riskCategories = RiskCategory::where('organization_id', $currentOrgId)
            ->with(['parent', 'children'])
            ->withCount('risks')
            ->orderBy('name')
            ->get();

        return Inertia::render('risk-categories/index', [
            'riskCategories' => $riskCategories,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        // Get all categories for parent selection (tree structure)
        $categories = RiskCategory::where('organization_id', $currentOrgId)
            ->where('is_active', true)
            ->with('parent')
            ->orderBy('name')
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'path' => $category->path,
                    'depth' => $category->depth,
                ];
            });

        return Inertia::render('risk-categories/create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Please select an organization first.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:risk_categories,id',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'boolean',
        ]);

        // Verify parent belongs to same organization if provided
        if (isset($validated['parent_id'])) {
            $parent = RiskCategory::find($validated['parent_id']);
            if ($parent->organization_id !== $currentOrgId) {
                return back()->withErrors(['parent_id' => 'Invalid parent category.']);
            }
        }

        // Check code uniqueness within organization
        $exists = RiskCategory::where('organization_id', $currentOrgId)
            ->where('code', $validated['code'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['code' => 'The code has already been taken for this organization.']);
        }

        $validated['organization_id'] = $currentOrgId;

        $riskCategory = RiskCategory::create($validated);

        // If request wants JSON (Inertia/AJAX), return back to stay on same page
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return back()->with('success', 'Risk Category created successfully.');
        }

        return redirect()->route('risk-categories.show', $riskCategory)
            ->with('success', 'Risk Category created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, RiskCategory $riskCategory)
    {
        $user = $request->user();

        // Verify risk category belongs to current organization
        if ($riskCategory->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this risk category.');
        }

        $riskCategory->load([
            'organization',
            'parent',
            'children.children',
            'risks',
        ])->loadCount(['risks', 'children']);

        return Inertia::render('risk-categories/show', [
            'riskCategory' => $riskCategory,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, RiskCategory $riskCategory)
    {
        $user = $request->user();

        // Verify risk category belongs to current organization
        if ($riskCategory->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this risk category.');
        }

        // Get all categories for parent selection (excluding self and descendants)
        $categories = RiskCategory::where('organization_id', $user->current_organization_id)
            ->where('is_active', true)
            ->where('id', '!=', $riskCategory->id)
            ->with('parent')
            ->orderBy('name')
            ->get()
            ->filter(function ($category) use ($riskCategory) {
                // Exclude descendants to prevent circular references
                $parent = $category->parent;
                while ($parent) {
                    if ($parent->id === $riskCategory->id) {
                        return false;
                    }
                    $parent = $parent->parent;
                }
                return true;
            })
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'path' => $category->path,
                    'depth' => $category->depth,
                ];
            })
            ->values();

        $riskCategory->load('parent');

        return Inertia::render('risk-categories/edit', [
            'riskCategory' => $riskCategory,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, RiskCategory $riskCategory)
    {
        $user = $request->user();

        // Verify risk category belongs to current organization
        if ($riskCategory->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this risk category.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:risk_categories,id',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'boolean',
        ]);

        // Verify parent belongs to same organization if provided
        if (isset($validated['parent_id'])) {
            // Prevent self-reference
            if ($validated['parent_id'] == $riskCategory->id) {
                return back()->withErrors(['parent_id' => 'A category cannot be its own parent.']);
            }

            $parent = RiskCategory::find($validated['parent_id']);
            if ($parent->organization_id !== $user->current_organization_id) {
                return back()->withErrors(['parent_id' => 'Invalid parent category.']);
            }

            // Prevent circular references
            $checkParent = $parent;
            while ($checkParent) {
                if ($checkParent->id === $riskCategory->id) {
                    return back()->withErrors(['parent_id' => 'Cannot create circular reference.']);
                }
                $checkParent = $checkParent->parent;
            }
        }

        // Check code uniqueness within organization
        $exists = RiskCategory::where('organization_id', $user->current_organization_id)
            ->where('code', $validated['code'])
            ->where('id', '!=', $riskCategory->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['code' => 'The code has already been taken for this organization.']);
        }

        $riskCategory->update($validated);

        return redirect()->route('risk-categories.show', $riskCategory)
            ->with('success', 'Risk Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, RiskCategory $riskCategory)
    {
        $user = $request->user();

        // Verify risk category belongs to current organization
        if ($riskCategory->organization_id !== $user->current_organization_id) {
            abort(403, 'You do not have access to this risk category.');
        }

        // Check if category has risks (including in children)
        $totalRisks = $riskCategory->risks()->count();
        if ($riskCategory->children()->count() > 0) {
            // Also count risks in all descendants
            $descendants = $riskCategory->children()->with('risks')->get();
            foreach ($descendants as $child) {
                $totalRisks += $child->risks()->count();
            }
        }

        if ($totalRisks > 0) {
            return back()->with('error', 'Cannot delete category with associated risks. Please reassign ' . $totalRisks . ' risk(s) first.');
        }

        // If category has children, delete them recursively (cascade delete)
        if ($riskCategory->children()->count() > 0) {
            $this->deleteWithChildren($riskCategory);
        } else {
            $riskCategory->delete();
        }

        // If request is from Inertia (index page), return back to stay on same page
        if ($request->wantsJson() || $request->header('X-Inertia')) {
            return back()->with('success', 'Risk Category deleted successfully.');
        }

        return redirect()->route('risk-categories.index')
            ->with('success', 'Risk Category deleted successfully.');
    }

    /**
     * Recursively delete a category and all its children.
     */
    private function deleteWithChildren(RiskCategory $category)
    {
        // Get all children
        $children = $category->children()->get();
        
        // Recursively delete each child
        foreach ($children as $child) {
            if ($child->children()->count() > 0) {
                $this->deleteWithChildren($child);
            } else {
                $child->delete();
            }
        }
        
        // Delete the parent category
        $category->delete();
    }

    /**
     * Get tree structure of categories for the current organization.
     */
    public function tree(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return response()->json(['message' => 'No organization selected'], 400);
        }

        $categories = RiskCategory::where('organization_id', $currentOrgId)
            ->where('is_active', true)
            ->with('descendants')
            ->roots()
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Export risk categories to Excel.
     */
    public function export(Request $request)
    {
        $user = $request->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return response()->json(['message' => 'No organization selected'], 400);
        }

        // Get all categories for export
        $riskCategories = RiskCategory::where('organization_id', $currentOrgId)
            ->with('parent')
            ->withCount('risks')
            ->orderBy('name')
            ->get();

        try {
            $filename = 'risk-categories-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
            return Excel::download(new RiskCategoriesExport($riskCategories), $filename);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
