<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
public function index(Request $request)
{
    $notifications = \DB::table('notifications')
        ->where('notifiable_id', $request->user()->id)  
        ->where('notifiable_type', \App\Models\User::class)
        ->where('type', \App\Notifications\ActionPlanDueReminder::class)
        ->orderBy('created_at', 'desc')
        ->take(50)
        ->get()
        ->map(fn($n) => [
            'id'             => $n->id,
            'object'         => json_decode($n->data)->object,
            'date'           => json_decode($n->data)->due_date,
            'is_read'        => !is_null($n->read_at),
            'days_remaining' => json_decode($n->data)->days_remaining,
            'action_plan_id' => json_decode($n->data)->action_plan_id,
        ]);

    return response()->json($notifications);
}
    public function markRead(Request $request, string $id)
    {
        $notification = $request->user()
            ->notifications()
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['ok' => true]);
    }
}