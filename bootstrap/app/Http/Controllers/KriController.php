<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\KRI;
use App\Models\Risk;
use App\Models\Mesure;
use Inertia\Inertia;
class KriController extends Controller
{

   public function KriByRisk(Request $request, $riskId)
{
    $user = $request->user();
    $currentOrgId = $user->current_organization_id;

    $risk = Risk::findOrFail($riskId);

    if ($risk->organization_id !== $currentOrgId) {
        abort(403, 'Unauthorized');
    }

    $kris = KRI::where('id', $risk->kri_id)->with('owner')
                ->orderBy('created_at', 'desc')
                ->get();
     if ($kris->isEmpty()) {
        return redirect()->back()->with('error', 'KRI for this risk not found');
    }
    $measures = Mesure::whereIn('kri_id', $kris->pluck('id'))
            ->with('user')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'value' => $m->value,
                    'date' => $m->date,
                    'created_by' => $m->user?->name,
                ];
            });
    return Inertia::render('risks/kri', [
        'kris' => $kris,
        'risk'=>$risk,
        'measures' => $measures,
    ]);

     }   public function store(Request $request)
    {

        $request->validate([
            'kri_id' => 'required|exists:k_r_i_s,id',
            'value' => 'required|numeric',
            'date' => 'required|date',
        ]);

        Mesure::create([
            'kri_id' => $request->kri_id,
            'value' => $request->value,
            'date' => $request->date,
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Mesure created successfully');
           }


}
