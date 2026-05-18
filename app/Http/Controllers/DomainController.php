<?php
namespace App\Http\Controllers;

use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DomainController extends Controller
{
    public function index()
    {
        $orgId = Auth::user()->current_organization_id;
        return response()->json(
            Domain::where('organization_id', $orgId)
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $orgId = Auth::user()->current_organization_id;

        $domain = Domain::create([
            'name' => $request->name,
            'organization_id' => $orgId,
        ]);

        $domains = Domain::where('organization_id', $orgId)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json(['domain' => $domain, 'domains' => $domains], 201);
    }

    public function update(Request $request, Domain $domain)
    {
        abort_if($domain->organization_id !== Auth::user()->current_organization_id, 403);
        $request->validate(['name' => 'required|string|max:255']);
        $domain->update(['name' => $request->name]);
        return response()->json($domain);
    }

    public function destroy(Domain $domain)
    {
        abort_if($domain->organization_id !== Auth::user()->current_organization_id, 403);
        $domain->delete();
        return response()->json(['deleted' => true]);
    }
}