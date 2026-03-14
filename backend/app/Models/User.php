<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Conversation;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;
    use TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'is_admin',
        'blocked_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'email_verified_at'       => 'datetime',
        'two_factor_confirmed_at' => 'datetime',
        'blocked_at'              => 'datetime',
        'is_admin'                => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function ownedGroups()
    {
        return $this->hasMany(Group::class, 'owner_id');
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_users')->withTimestamps();
    }

    public function conversations()
    {
        return Conversation::where('user_id1', $this->id)
            ->orWhere('user_id2', $this->id);
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    // ─── Helpers ──────────────────────────────────────────────────

    public function isBlocked(): bool
    {
        return $this->blocked_at !== null;
    }
}
