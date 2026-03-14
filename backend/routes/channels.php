<?php

use App\Models\Conversation;
use App\Models\Group;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});


// ── Private: DM conversation channel ────────────────────────────────────
// Only the two participants can subscribe
Broadcast::channel('conversation.{conversationId}', function (User $user, int $conversationId) {
    $conversation = Conversation::find($conversationId);
    if (! $conversation) {
        return false;
    }
    return $conversation->includesUser($user->id) ? $user->toArray() : false;
});

// ── Private: Group channel ───────────────────────────────────────────────
// Only group members can subscribe
Broadcast::channel('group.{groupId}', function (User $user, int $groupId) {
    $group = Group::find($groupId);
    if (! $group) {
        return false;
    }
    return $group->hasMember($user) ? $user->toArray() : false;
});

// ── Private: User personal channel ──────────────────────────────────────
// Only the authenticated user can subscribe to their own channel
Broadcast::channel('user.{userId}', function (User $user, int $userId) {
    return $user->id === $userId ? $user->toArray() : false;
});

// ── Presence: Global online status channel ───────────────────────────────
// Any authenticated user can join — used to track who is online
Broadcast::channel('online', function (User $user) {
    return [
        'id'     => $user->id,
        'name'   => $user->name,
        'avatar' => $user->avatar,
    ];
});
