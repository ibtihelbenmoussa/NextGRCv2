<?php
namespace App\Http\Controllers;

use App\Models\TestResult;
use Illuminate\Http\Request;

class TestResultController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'results'                    => ['required', 'array'],
            'results.*.predefined_test_id' => ['required', 'exists:predefined_tests,id'],
            'results.*.requirement_id'   => ['required', 'exists:requirements,id'],
            'results.*.result'           => ['required', 'in:yes,no'],
            'results.*.comment'          => ['nullable', 'string', 'max:1000'],
        ]);

        foreach ($validated['results'] as $item) {
            // Validation : comment obligatoire si result = no
            if ($item['result'] === 'no' && empty($item['comment'])) {
                return back()->withErrors([
                    'comment' => 'Comment is required when result is No.',
                ]);
            }

            TestResult::create([
                'predefined_test_id' => $item['predefined_test_id'],
                'requirement_id'     => $item['requirement_id'],
                'result'             => $item['result'],
                'comment'            => $item['result'] === 'no' ? $item['comment'] : null,
            ]);
        }

        return back()->with('success', 'Test results saved successfully.');
    }
}