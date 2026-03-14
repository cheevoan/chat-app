<?php

namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        if ($this->message->group_id) {
            return [new PrivateChannel('group.' . $this->message->group_id)];
        }
        if ($this->message->conversation_id) {
            return [new PrivateChannel('conversation.' . $this->message->conversation_id)];
        }
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
        return ['message' => (new MessageResource(
            $this->message->load(['sender', 'attachments'])
        ))->resolve()];
    }
}
