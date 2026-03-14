<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * GET /api/messages
     * Fetch messages for a group OR a conversation (query param required).
     *
     * ?group_id=1
     * ?conversation_id=1
     */
    public function index(Request $request)
    {
        $request->validate([
            'group_id'        => ['required_without:conversation_id', 'nullable', 'integer', 'exists:groups,id'],
            'conversation_id' => ['required_without:group_id', 'nullable', 'integer', 'exists:conversations,id'],
        ]);

        $user = $request->user();

        if ($request->filled('group_id')) {
            $group = Group::findOrFail($request->group_id);
            abort_unless($group->hasMember($user), 403, 'Not a group member.');

            $messages = Message::with(['sender', 'attachments'])
                ->where('group_id', $request->group_id)
                ->latest()
                ->paginate(50);
        } else {
            $conversation = Conversation::findOrFail($request->conversation_id);
            abort_unless($conversation->includesUser($user->id), 403, 'Not in this conversation.');

            // Fetch messages by conversation_id OR by the two participants (covers seeded data)
            $messages = Message::with(['sender', 'attachments'])
                ->where(function ($q) use ($conversation, $request) {
                    $q->where('conversation_id', $request->conversation_id)
                      ->orWhere(function ($q2) use ($conversation) {
                          $q2->whereNull('group_id')
                             ->whereNull('conversation_id')
                             ->where(function ($q3) use ($conversation) {
                                 $q3->where(function ($q4) use ($conversation) {
                                     $q4->where('sender_id', $conversation->user_id1)
                                        ->where('receiver_id', $conversation->user_id2);
                                 })->orWhere(function ($q4) use ($conversation) {
                                     $q4->where('sender_id', $conversation->user_id2)
                                        ->where('receiver_id', $conversation->user_id1);
                                 });
                             });
                      });
                })
                ->latest()
                ->paginate(50);
        }

        return MessageResource::collection($messages);
    }

    /**
     * POST /api/messages
     * Send a message to a group or conversation, with optional attachments.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'message'         => ['nullable', 'string', 'required_without:attachments'],
            'group_id'        => ['nullable', 'integer', 'exists:groups,id'],
            'conversation_id' => ['nullable', 'integer', 'exists:conversations,id'],
            'receiver_id'     => ['nullable', 'integer', 'exists:users,id'],
            'attachments'     => ['nullable', 'array', 'max:10'],
            'attachments.*'   => ['file', 'max:20480'], // 20MB per file
        ]);

        // Ensure exactly one target is set
        $targets = array_filter([
            $data['group_id'] ?? null,
            $data['conversation_id'] ?? null,
            $data['receiver_id'] ?? null,
        ]);
        if (count($targets) !== 1) {
            return response()->json([
                'message' => 'Provide exactly one of: group_id, conversation_id, or receiver_id.',
            ], 422);
        }

        $user = $request->user();

        // Authorization checks
        if (isset($data['group_id'])) {
            $group = Group::findOrFail($data['group_id']);
            abort_unless($group->hasMember($user), 403, 'Not a group member.');
        }
        if (isset($data['conversation_id'])) {
            $conversation = Conversation::findOrFail($data['conversation_id']);
            abort_unless($conversation->includesUser($user->id), 403, 'Not in this conversation.');
        }

        DB::transaction(function () use ($data, $request, $user, &$message) {
            $message = Message::create([
                'message'         => $data['message'] ?? null,
                'sender_id'       => $user->id,
                'receiver_id'     => $data['receiver_id'] ?? null,
                'group_id'        => $data['group_id'] ?? null,
                'conversation_id' => $data['conversation_id'] ?? null,
            ]);

            // Handle file attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('attachments', 'public');
                    MessageAttachment::create([
                        'message_id' => $message->id,
                        'name'       => $file->getClientOriginalName(),
                        'path'       => $path,
                        'mime'       => $file->getMimeType(),
                        'size'       => $file->getSize(),
                    ]);
                }
            }

            // Update last_message_id on parent
            if (isset($data['group_id'])) {
                Group::where('id', $data['group_id'])
                    ->update(['last_message_id' => $message->id]);
            }
            if (isset($data['conversation_id'])) {
                Conversation::where('id', $data['conversation_id'])
                    ->update(['last_message_id' => $message->id]);
            }
        });

        // ── Broadcast to WebSocket subscribers via Reverb ─────────
        broadcast(new MessageSent($message->load(['sender', 'attachments'])));

        return (new MessageResource($message->load(['sender', 'attachments'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/messages/{message}
     */
    public function show(Message $message, Request $request)
    {
        $this->authorizeRead($message, $request->user());

        return new MessageResource($message->load(['sender', 'receiver', 'attachments']));
    }

    /**
     * PUT /api/messages/{message}
     * Only the sender can edit their own message.
     */
    public function update(Message $message, Request $request)
    {
        $user = $request->user();

        if ($message->sender_id !== $user->id) {
            abort(403, 'You can only edit your own messages.');
        }

        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $message->update(['message' => $data['message']]);

        return new MessageResource($message->load(['sender', 'attachments']));
    }

    /**
     * DELETE /api/messages/{message}
     * Only the sender (or admin) can delete a message.
     */
    public function destroy(Message $message, Request $request)
    {
        $user = $request->user();

        if ($message->sender_id !== $user->id && ! $user->is_admin) {
            abort(403, 'You can only delete your own messages.');
        }

        DB::transaction(function () use ($message) {
            // Delete stored files
            foreach ($message->attachments as $attachment) {
                Storage::disk('public')->delete($attachment->path);
            }
            $message->attachments()->delete();
            $message->delete();
        });

        return response()->json(['message' => 'Message deleted.']);
    }

    // ─── Private Helpers ──────────────────────────────────────────

    private function authorizeRead(Message $message, $user): void
    {
        if ($message->group_id) {
            $group = Group::findOrFail($message->group_id);
            abort_unless($group->hasMember($user), 403);
        } elseif ($message->conversation_id) {
            $conv = Conversation::findOrFail($message->conversation_id);
            abort_unless($conv->includesUser($user->id), 403);
        } elseif ($message->receiver_id) {
            abort_unless(
                $message->sender_id === $user->id || $message->receiver_id === $user->id,
                403
            );
        }
    }
}
