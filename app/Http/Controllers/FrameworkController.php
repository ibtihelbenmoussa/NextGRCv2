<?php

namespace App\Http\Controllers;

use App\Models\Framework;
use App\Models\Tag;
use App\Models\Jurisdiction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\FrameworksExport;

class FrameworkController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $currentOrgId = $user->current_organization_id;

        if (!$currentOrgId) {
            return redirect()->route('organizations.select.page')
                ->with('error', 'Veuillez sélectionner une organisation d\'abord.');
        }

        $frameworks = Framework::where('is_deleted', 0)
            ->where('organization_id', $currentOrgId)
            ->with(['tags:id,name', 'jurisdictions:id,name'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->search;
                $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('filter.status'), function ($q) use ($request) {
                $q->where('status', $request->input('filter.status'));
            })
            ->when($request->filled('filter.type') && $request->input('filter.type') !== 'all', function ($q) use ($request) {
                $q->where('type', $request->input('filter.type'));
            })
            ->when($request->filled('sort'), function ($q) use ($request) {
                $sort = $request->sort;
                $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
                $column = ltrim($sort, '-');
                $q->orderBy($column, $direction);
            }, function ($q) {
                $q->orderBy('created_at', 'desc');
            })
            ->paginate(15)
            ->withQueryString();

        $frameworks->getCollection()->transform(function ($fw) {
            $fw->tags = $fw->tags ? $fw->tags->pluck('name')->toArray() : [];
            $fw->jurisdictions = $fw->jurisdictions ? $fw->jurisdictions->pluck('name')->toArray() : [];
            return $fw;
        });

        return Inertia::render('Frameworks/Index', [
            'frameworks' => $frameworks,
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        $currentOrgId = $user->current_organization_id;

        return Inertia::render('Frameworks/Create', [
            'jurisdictions' => Jurisdiction::where('is_deleted', 0)
                ->where('organization_id', $currentOrgId)
                ->get(['id', 'name']),
            'tags' => Tag::where('is_deleted', 0)
                ->where('organization_id', $currentOrgId)
                ->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $currentOrgId = $user->current_organization_id;

        $data = $request->validate([
            'code'            => 'required|string|max:255',
            'name'            => 'required|string|max:255',
            'version'         => 'nullable|string|max:255',
            'type'            => 'required|in:standard,regulation,contract,internal_policy',
            'publisher'       => 'nullable|string|max:255',
            'tags'            => 'nullable|array',
            'tags.*'          => 'exists:tags,id',
            'jurisdictions'   => 'nullable|array',
            'jurisdictions.*' => 'exists:jurisdictions,id',
            'scope'           => 'nullable|string',
            'status'          => 'required|in:active,draft,deprecated,archived',
            'release_date'    => 'nullable|date',
            'effective_date'  => 'nullable|date',
            'retired_date'    => 'nullable|date',
            'description'     => 'nullable|string',
            'language'        => 'nullable|string',
            'url_reference'   => 'nullable|url',
        ]);

        $framework = Framework::create([
            'name'            => $data['name'],
            'code'            => $data['code'],
            'version'         => $data['version'] ?? null,
            'type'            => $data['type'],
            'publisher'       => $data['publisher'] ?? null,
            'scope'           => $data['scope'] ?? null,
            'status'          => $data['status'],
            'release_date'    => $data['release_date'] ?? null,
            'effective_date'  => $data['effective_date'] ?? null,
            'retired_date'    => $data['retired_date'] ?? null,
            'description'     => $data['description'] ?? null,
            'language'        => $data['language'] ?? null,
            'url_reference'   => $data['url_reference'] ?? null,
            'organization_id' => $currentOrgId,
        ]);

        $framework->tags()->sync($data['tags'] ?? []);
        $framework->jurisdictions()->sync($data['jurisdictions'] ?? []);

        return redirect('/frameworks')->with('success', 'Framework created successfully.');
    }

    public function show(Framework $framework)
    {
        $this->authorizeFramework($framework);

        $framework->load(['tags:id,name', 'jurisdictions:id,name']);

        $framework->tags_names = $framework->tags
            ? $framework->tags->pluck('name')->toArray()
            : [];

        $framework->jurisdictions_names = $framework->jurisdictions
            ? $framework->jurisdictions->pluck('name')->toArray()
            : [];

        return Inertia::render('Frameworks/Show', [
            'framework' => $framework,
        ]);
    }

    public function edit(Framework $framework)
    {
        $this->authorizeFramework($framework);

        $user = request()->user();
        $currentOrgId = $user->current_organization_id;

        $framework->load(['jurisdictions:id,name', 'tags:id,name']);

        $jurisdictions = Jurisdiction::where('is_deleted', 0)
            ->where('organization_id', $currentOrgId)
            ->get(['id', 'name']);

        $tags = Tag::where('is_deleted', 0)
            ->where('organization_id', $currentOrgId)
            ->get(['id', 'name']);

        return Inertia::render('Frameworks/Edit', [
            'framework'             => $framework,
            'jurisdictions'         => $jurisdictions,
            'tags'                  => $tags,
            'selectedJurisdictions' => $framework->jurisdictions
                ? $framework->jurisdictions->pluck('id')->values()
                : [],
            'selectedTags'          => $framework->tags
                ? $framework->tags->pluck('id')->values()
                : [],
        ]);
    }

    public function update(Request $request, Framework $framework)
    {
        $this->authorizeFramework($framework);

        $data = $request->validate([
            'code'            => 'required|unique:frameworks,code,' . $framework->id,
            'name'            => 'required|string|max:255',
            'version'         => 'nullable|string|max:255',
            'type'            => 'required|in:standard,regulation,contract,internal_policy',
            'publisher'       => 'nullable|string|max:255',
            'tags'            => 'nullable|array',
            'tags.*'          => 'exists:tags,id',
            'jurisdictions'   => 'nullable|array',
            'jurisdictions.*' => 'exists:jurisdictions,id',
            'scope'           => 'nullable|string',
            'status'          => 'required|in:active,draft,deprecated,archived',
            'release_date'    => 'nullable|date',
            'effective_date'  => 'nullable|date',
            'retired_date'    => 'nullable|date',
            'description'     => 'nullable|string',
            'language'        => 'nullable|string',
            'url_reference'   => 'nullable|url',
        ]);

        $framework->update([
            'name'           => $data['name'],
            'code'           => $data['code'],
            'version'        => $data['version'] ?? null,
            'type'           => $data['type'],
            'publisher'      => $data['publisher'] ?? null,
            'scope'          => $data['scope'] ?? null,
            'status'         => $data['status'],
            'release_date'   => $data['release_date'] ?? null,
            'effective_date' => $data['effective_date'] ?? null,
            'retired_date'   => $data['retired_date'] ?? null,
            'description'    => $data['description'] ?? null,
            'language'       => $data['language'] ?? null,
            'url_reference'  => $data['url_reference'] ?? null,
        ]);

        $framework->tags()->sync($data['tags'] ?? []);
        $framework->jurisdictions()->sync($data['jurisdictions'] ?? []);

        return redirect('/frameworks')->with('success', 'Framework updated successfully.');
    }

    public function destroy(Framework $framework)
    {
        $this->authorizeFramework($framework);
        $framework->update(['is_deleted' => 1]);

        return redirect('/frameworks')->with('success', 'Framework deleted successfully.');
    }

public function export()
{
    $frameworks = Framework::where('is_deleted', 0)
        ->with(['tags:id,name', 'jurisdictions:id,name'])
        ->get();

    return Excel::download(
        new FrameworksExport($frameworks),
        'frameworks-' . now()->format('Y-m-d-His') . '.xlsx'
    );
}

    private function authorizeFramework($framework)
    {
        $user = auth()->user();
        if ($framework->organization_id != $user->current_organization_id || $framework->is_deleted) {
            abort(403, 'Unauthorized');
        }
    }
}