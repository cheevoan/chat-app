<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessageAttachment extends Model
{
    use HasFactory;

    protected $fillable = ['message_id', 'name', 'path', 'mime', 'size'];

    // ─── Relationships ────────────────────────────────────────────

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────

    public function isImage(): bool
    {
        return str_starts_with($this->mime, 'image/');
    }

    public function url(): string
    {
        return asset('storage/' . $this->path);
    }
}
