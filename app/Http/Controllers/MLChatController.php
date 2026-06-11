<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MLChatController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'question' => 'required|string|max:500',
            'plans'    => 'nullable|array',
        ]);

        try {
            $mlUrl = config('services.ml.url', 'http://localhost:5000');

            $response = Http::timeout(15)->post("{$mlUrl}/chat", [
                'question' => $request->input('question'),
                'plans'    => $request->input('plans', []),
            ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['error' => 'ML service error'], 502);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}