<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use App\Http\Resources\GroupResource;
use App\Http\Resources\UserResource;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupController extends Controller
{
    /**
     * GET /api/groups
     */
    public function index(Request $request)
    {
        $groups = Group::with(['owner', 'lastMessage.sender'])
            ->withCount('users')
            ->where('owner_id', $request->user()->id)
            ->orWhereHas('users', fn($q) => $q->where('user_id', $request->user()->id))
            ->latest()
            ->paginate(20);

        return GroupResource::collection($groups);
    }

    /**
     * POST /api/groups
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'user_ids'    => ['nullable', 'array'],
            'user_ids.*'  => ['integer', 'exists:users,id'],
        ]);

        $group = Group::create([
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'owner_id'    => $request->user()->id,
        ]);

        $memberIds = array_unique(
            array_merge([$request->user()->id], $data['user_ids'] ?? [])
        );
        $group->users()->attach($memberIds);

        return (new GroupResource($group->load(['owner', 'users'])))
            ->response()->setStatusCode(201);
    }

    /**
     * GET /api/groups/{group}
     */
    public function show(Group $group, Request $request)
    {
        $this->authorizeAccess($group, $request->user());

        return new GroupResource(
            $group->load(['owner', 'users', 'lastMessage.sender'])
                  ->loadCount('users')
        );
    }

    /**
     * PUT /api/groups/{group}
     */
    public function update(Group $group, Request $request)
    {
        $this->authorizeOwner($group, $request->user());

        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'avatar'      => ['sometimes', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('avatar')) {
            if ($group->avatar) {
                Storage::disk('public')->delete($group->avatar);
            }
            $data['avatar'] = $request->file('avatar')->store('avatars/groups', 'public');
        }

        $group->update($data);

        return new GroupResource($group->fresh(['owner', 'users']));
    }

    /**
     * POST /api/groups/{group}/avatar
     */
    public function uploadAvatar(Group $group, Request $request)
    {
        $this->authorizeOwner($group, $request->user());
        $request->validate(['avatar' => ['required', 'image', 'max:4096']]);
        if ($group->avatar) {
            Storage::disk('public')->delete($group->avatar);
        }
        $path = $request->file('avatar')->store('avatars/groups', 'public');
        $group->update(['avatar' => $path]);
        return new GroupResource($group->fresh(['owner', 'users']));
    }

    /**
     * DELETE /api/groups/{group}
     * Fix circular FK: groups.last_message_id ↔ messages.group_id
     */
    public function destroy(Group $group, Request $request)
    {
        $this->authorizeOwner($group, $request->user());

        DB::transaction(function () use ($group) {
            // Step 1: break circular FK — clear last_message_id first
            $group->update(['last_message_id' => null]);

            // Step 2: detach all pivot members
            $group->users()->detach();

            // Step 3: null out group_id on messages (keeps messages but unlinks them)
            $group->messages()->update(['group_id' => null]);

            // Step 4: safe to delete now
            $group->delete();
        });

        return response()->json(['message' => 'Group deleted.']);
    }

    /**
     * POST /api/groups/{group}/members
     */
    public function addMembers(Group $group, Request $request)
    {
        $this->authorizeOwner($group, $request->user());

        $data = $request->validate([
            'user_ids'   => ['required', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $group->users()->syncWithoutDetaching($data['user_ids']);

        return new GroupResource($group->fresh(['users']));
    }

    /**
     * DELETE /api/groups/{group}/members/{user}
     */
    public function removeMember(Group $group, User $user, Request $request)
    {
        $this->authorizeOwner($group, $request->user());

        if ($user->id === $group->owner_id) {
            return response()->json(['message' => 'Cannot remove the group owner.'], 422);
        }

        $group->users()->detach($user->id);

        return response()->json(['message' => "User {$user->name} removed from group."]);
    }

    /**
     * POST /api/groups/{group}/leave
     */
    public function leave(Group $group, Request $request)
    {
        $user = $request->user();

        if ($group->owner_id === $user->id) {
            return response()->json([
                'message' => 'Owner cannot leave. Transfer ownership or delete the group.',
            ], 422);
        }

        $group->users()->detach($user->id);

        return response()->json(['message' => 'You have left the group.']);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private function authorizeAccess(Group $group, User $user): void
    {
        if (! $group->hasMember($user) && ! $group->isOwner($user)) {
            abort(403, 'You are not a member of this group.');
        }
    }

    private function authorizeOwner(Group $group, User $user): void
    {
        if (! $group->isOwner($user)) {
            abort(403, 'Only the group owner can perform this action.');
        }
    }
}
