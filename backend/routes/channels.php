<?php

use App\Models\Conversation;
use App\Models\Group;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('conversation.{conversationId}', function (User $user, int $conversationId) {
    $conversation = Conversation::find($conversationId);
    if (!$conversation) {
        return false;
    }
    return $conversation->includesUser($user->id) ? $user->toArray() : false;
});

Broadcast::channel('group.{groupId}', function (User $user, int $groupId) {
    $group = Group::find($groupId);
    if (!$group) {
        return false;
    }
    return $group->hasMember($user) ? $user->toArray() : false;
});

Broadcast::channel('user.{userId}', function (User $user, int $userId) {
    return $user->id === $userId ? $user->toArray() : false;
});

Broadcast::channel('online', function (User $user) {
    return ['id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar];
});
