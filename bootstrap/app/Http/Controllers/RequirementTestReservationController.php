<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RequirementTestReservation;

class RequirementTestReservationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'requirement_id' => 'required|exists:requirements,id',
            'date'           => 'required|date',
        ]);

        $existing = RequirementTestReservation::where('requirement_id', $request->requirement_id)
            ->where('date', $request->date)
            ->first();

        if ($existing && $existing->user_id !== auth()->id()) {
            return back()->withErrors([
                'reservation' => 'Already claimed by ' . $existing->user->name,
            ]);
        }

        if ($existing && $existing->user_id === auth()->id()) {
            return back();
        }

        RequirementTestReservation::create([
            'requirement_id' => $request->requirement_id,
            'user_id'        => auth()->id(),
            'date'           => $request->date,
        ]);

        return back();
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'requirement_id' => 'required|exists:requirements,id',
            'date'           => 'required|date',
        ]);

        RequirementTestReservation::where('requirement_id', $request->requirement_id)
            ->where('user_id', auth()->id())
            ->where('date', $request->date)
            ->delete();

        return back();
    }
}