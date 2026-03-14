<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'message'         => $this->message,
            'sender'          => new UserResource($this->whenLoaded('sender')),
            'receiver'        => new UserResource($this->whenLoaded('receiver')),
            'group_id'        => $this->group_id,
            'conversation_id' => $this->conversation_id,
            'attachments'     => MessageAttachmentResource::collection(
                $this->whenLoaded('attachments')
            ),
            'created_at'      => $this->created_at,
        ];
    }
}
