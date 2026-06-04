<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\Framework;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DomainController extends Controller
{
    // GET /domains?framework_id=X → domains liés à ce framework
    public function index(Request $request)
    {
        $orgId = Auth::user()->current_organization_id;

        if ($request->filled('framework_id')) {
            $framework = Framework::where('id', $request->framework_id)
                ->where('organization_id', $orgId)
                ->first();

            if (!$framework) {
                return response()->json(['domains' => []]);
            }

            $domains = $framework->domains()
                ->select('domains.id', 'domains.name')
                ->orderBy('domains.name')
                ->get();
        } else {
            $domains = Domain::where('organization_id', $orgId)
                ->select('id', 'name')
                ->orderBy('name')
                ->get();
        }

        return response()->json(['domains' => $domains]);
    }

    // POST /domains → créer + attacher au framework via pivot
    public function store(Request $request)
    {
        $orgId = Auth::user()->current_organization_id;

        $request->validate([
            'name'         => 'required|string|max:255',
            'framework_id' => 'nullable|integer|exists:frameworks,id',
        ]);

        $domain = Domain::create([
            'name'            => $request->name,
            'organization_id' => $orgId,
        ]);

        // Attacher au framework via pivot
        if ($request->filled('framework_id')) {
            $domain->frameworks()->syncWithoutDetaching([$request->framework_id]);
        }

        // Retourner la liste filtrée par framework
        $domains = collect();
        if ($request->filled('framework_id')) {
            $framework = Framework::find($request->framework_id);
            $domains = $framework?->domains()
                ->select('domains.id', 'domains.name')
                ->orderBy('domains.name')
                ->get() ?? collect();
        }

        return response()->json([
            'domain'  => $domain,
            'domains' => $domains,
        ]);
    }

    // PUT /domains/{domain}
    public function update(Request $request, Domain $domain)
    {
        if ($domain->organization_id !== Auth::user()->current_organization_id) {
            abort(403);
        }

        $request->validate(['name' => 'required|string|max:255']);
        $domain->update(['name' => $request->name]);

        return response()->json(['domain' => $domain]);
    }

    // DELETE /domains/{domain}
    public function destroy(Domain $domain)
    {
        if ($domain->organization_id !== Auth::user()->current_organization_id) {
            abort(403);
        }

        // cascade sur la pivot via migration → nettoyage auto
        $domain->delete();

        return response()->json(['success' => true]);
    }
}