<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'description'  => $this->description,
            'avatar'       => $this->avatar
                                 ? rtrim(config('app.url'), '/') . '/storage/' . $this->avatar
                                 : null,
            'owner'        => new UserResource($this->whenLoaded('owner')),
            'members'      => UserResource::collection($this->whenLoaded('users')),
            'member_count' => $this->whenCounted('users'),
            'last_message' => new MessageResource($this->whenLoaded('lastMessage')),
            'created_at'   => $this->created_at,
        ];
    }
}
