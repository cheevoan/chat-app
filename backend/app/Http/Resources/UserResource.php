<?php

// app/Http/Resources/UserResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'avatar'     => $this->avatar
                                ? rtrim(config('app.url'), '/') . '/storage/' . $this->avatar
                                : null,
            'is_admin'   => $this->is_admin,
            'blocked_at' => $this->blocked_at,
            'created_at' => $this->created_at,
        ];
    }
}
