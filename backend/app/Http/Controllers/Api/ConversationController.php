<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    /**
     * GET /api/conversations
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Conversation::with(['user1', 'user2', 'lastMessage.sender'])
            ->where('user_id1', $userId)
            ->orWhere('user_id2', $userId)
            ->latest('updated_at')
            ->paginate(20);

        return ConversationResource::collection($conversations);
    }

    /**
     * POST /api/conversations
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id', 'different:' . $request->user()->id],
        ]);

        $conversation = Conversation::findOrCreateBetween(
            $request->user()->id,
            $data['user_id']
        );

        return new ConversationResource(
            $conversation->load(['user1', 'user2', 'lastMessage.sender'])
        );
    }

    /**
     * GET /api/conversations/{conversation}
     */
    public function show(Conversation $conversation, Request $request)
    {
        $this->authorizeAccess($conversation, $request->user()->id);

        return new ConversationResource(
            $conversation->load(['user1', 'user2', 'lastMessage.sender'])
        );
    }

    /**
     * DELETE /api/conversations/{conversation}
     * Fix circular FK: conversations.last_message_id ↔ messages.conversation_id
     */
    public function destroy(Conversation $conversation, Request $request)
    {
        $this->authorizeAccess($conversation, $request->user()->id);

        DB::transaction(function () use ($conversation) {
            // Step 1: break circular FK — clear last_message_id first
            $conversation->update(['last_message_id' => null]);

            // Step 2: null out conversation_id on messages (keeps messages but unlinks)
            $conversation->messages()->update(['conversation_id' => null]);

            // Step 3: safe to delete now
            $conversation->delete();
        });

        return response()->json(['message' => 'Conversation deleted.']);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private function authorizeAccess(Conversation $conversation, int $userId): void
    {
        if (! $conversation->includesUser($userId)) {
            abort(403, 'You are not part of this conversation.');
        }
    }
}
