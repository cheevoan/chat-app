<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = ['user_id1', 'user_id2', 'last_message_id'];

    // ─── Relationships ────────────────────────────────────────────

    public function user1()
    {
        return $this->belongsTo(User::class, 'user_id1');
    }

    public function user2()
    {
        return $this->belongsTo(User::class, 'user_id2');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function lastMessage()
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    // ─── Helpers ──────────────────────────────────────────────────

    /**
     * Find or create a conversation between two users.
     */
    public static function findOrCreateBetween(int $userId1, int $userId2): self
    {
        // Normalize order so (A,B) and (B,A) are the same row
        [$a, $b] = $userId1 < $userId2
            ? [$userId1, $userId2]
            : [$userId2, $userId1];

        return self::firstOrCreate(
            ['user_id1' => $a, 'user_id2' => $b]
        );
    }

    public function includesUser(int $userId): bool
    {
        return $this->user_id1 === $userId || $this->user_id2 === $userId;
    }

    /**
     * Return the other participant from the authenticated user's perspective.
     */
    public function otherUser(int $authId): User
    {
        return $this->user_id1 === $authId ? $this->user2 : $this->user1;
    }
}
