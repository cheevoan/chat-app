<?php

namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public Message $message)
    {
        //
    }

    /**
     * Broadcast on the correct private channel.
     *
     * DM conversation  → private-conversation.{id}
     * Group message    → private-group.{id}
     */
    public function broadcastOn(): array
    {
        if ($this->message->group_id) {
            return [new PrivateChannel('group.' . $this->message->group_id)];
        }

        if ($this->message->conversation_id) {
            return [new PrivateChannel('conversation.' . $this->message->conversation_id)];
        }

        // Fallback for direct receiver_id messages
        return [
            new PrivateChannel('user.' . $this->message->sender_id),
            new PrivateChannel('user.' . $this->message->receiver_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => (new MessageResource(
                $this->message->load(['sender', 'attachments'])
            ))->resolve(),
        ];
    }
}
