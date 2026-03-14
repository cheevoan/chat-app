<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageAttachmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'message_id' => $this->message_id,
            'name'       => $this->name,
            'url'        => asset('storage/' . $this->path),
            'mime'       => $this->mime,
            'size'       => $this->size,
            'is_image'   => $this->isImage(),
        ];
    }
}
