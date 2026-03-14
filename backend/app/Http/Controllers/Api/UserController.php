<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    /**
     * GET /api/users
     * List users (searchable, excludes blocked for non-admins).
     */
    public function index(Request $request)
    {
        $query = User::query()
            ->when(
                $request->search,
                fn($q, $s)
                => $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
            )
            ->when(
                ! $request->user()->is_admin,
                fn($q)
                => $q->whereNull('blocked_at')
            )
            ->where('id', '!=', $request->user()->id)
            ->orderBy('name')
            ->paginate(20);

        return UserResource::collection($query);
    }

    /**
     * GET /api/users/{user}
     */
    public function show(User $user)
    {
        return new UserResource($user);
    }

    /**
     * POST /api/users/profile/avatar
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate(['avatar' => ['required', 'image', 'max:4096']]);
        $user = $request->user();
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);
        return new UserResource($user->fresh());
    }

    /**
     * PUT /api/users/profile
     * Update own profile.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'         => ['sometimes', 'string', 'max:255'],
            'email'        => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'password'     => ['sometimes', 'confirmed', 'min:8'],
            'avatar'       => ['sometimes', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return new UserResource($user->fresh());
    }

    /**
     * POST /api/users/{user}/block   [admin only]
     */
    public function block(User $user, Request $request)
    {
        abort_unless($request->user()->is_admin, 403, 'Only admins can block users.');

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot block yourself.'], 422);
        }

        $user->update(['blocked_at' => now()]);
        $user->tokens()->delete();

        return response()->json(['message' => "User {$user->name} has been blocked."]);
    }

    /**
     * POST /api/users/{user}/unblock   [admin only]
     */
    public function unblock(User $user, Request $request)
    {
        abort_unless($request->user()->is_admin, 403, 'Only admins can unblock users.');

        $user->update(['blocked_at' => null]);

        return response()->json(['message' => "User {$user->name} has been unblocked."]);
    }
}
