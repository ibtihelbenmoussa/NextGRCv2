<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\Framework;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TagController extends Controller
{
    private function orgId()
    {
        return Auth::user()->current_organization_id;
    }

    private function activeTags()
    {
        return Tag::where('organization_id', $this->orgId())
            ->where('is_deleted', 0)
            ->orderBy('name')
            ->get();
    }

    /** CREATE */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tags,name,NULL,id,organization_id,' . $this->orgId(),
        ]);

        $tag = Tag::create([
            'name' => trim($validated['name']),
            'organization_id' => $this->orgId(),
            'is_deleted' => 0,
        ]);

        return redirect()->back()->with([
            'success' => 'Tag created successfully',
            'tag' => $tag,
            'tags' => $this->activeTags(),
        ]);
    }

    /** UPDATE */
     public function update(Request $request, Tag $tag)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:tags,name,' . $tag->id,
        ]);

        $tag->update($data);

        return back()->with('success', 'Tag updated successfully');
    }

    public function destroy(Tag $tag)
    {
        $tag->update(['is_deleted'=>1]);

        return back()->with('success', 'Tag deleted successfully');
    }
}
