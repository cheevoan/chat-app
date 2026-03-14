<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserOnline implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public User $user,
        public bool $online
    ) {}

    /**
     * Broadcast on the global presence channel so all connected
     * users can see who is online / offline.
     */
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
        return [
            'user_id' => $this->user->id,
            'name'    => $this->user->name,
            'online'  => $this->online,
        ];
    }
}
