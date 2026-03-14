<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserOnline implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public User $user, public bool $online) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('online')];
    }

    public function broadcastAs(): string
    {
        return 'UserOnline';
    }

    public function broadcastWith(): array
    {
        return ['user_id' => $this->user->id, 'name' => $this->user->name, 'online' => $this->online];
    }
}
