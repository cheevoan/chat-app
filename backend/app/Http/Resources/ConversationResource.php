<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $authId = $request->user()->id;

        // relationLoaded() returns a real boolean — whenLoaded() returns MissingValue (always truthy)
        $otherUser = null;
        if ($this->relationLoaded('user1') && $this->relationLoaded('user2')) {
            $otherUser = $this->user_id1 === $authId ? $this->user2 : $this->user1;
        }

        return [
            'id'           => $this->id,
            'user_id1'     => $this->user_id1,
            'user_id2'     => $this->user_id2,
            'other_user'   => $otherUser ? new UserResource($otherUser) : null,
            'last_message' => $this->relationLoaded('lastMessage')
                ? new MessageResource($this->lastMessage)
                : null,
            'created_at'   => $this->created_at,
        ];
    }
}
