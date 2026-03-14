<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ══════════════════════════════════════════════════════════════
//  Public routes
// ══════════════════════════════════════════════════════════════
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ══════════════════════════════════════════════════════════════
//  Authenticated routes
// ══════════════════════════════════════════════════════════════
Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──────────────────────────────────────────────────
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ── Users ─────────────────────────────────────────────────
    // Static routes MUST come before {user} wildcard
    Route::get('/users', [UserController::class, 'index']);
    Route::put('/users/profile', [UserController::class, 'updateProfile']);
    Route::post('/users/profile/avatar', [UserController::class, 'uploadAvatar']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::post('/users/{user}/block', [UserController::class, 'block']);
    Route::post('/users/{user}/unblock', [UserController::class, 'unblock']);

    // ── Groups ────────────────────────────────────────────────
    Route::apiResource('groups', GroupController::class);
    Route::prefix('groups/{group}')->group(function () {
        Route::post('members', [GroupController::class, 'addMembers']);
        Route::delete('members/{user}', [GroupController::class, 'removeMember']);
        Route::post('leave', [GroupController::class, 'leave']);
        Route::post('avatar', [GroupController::class, 'uploadAvatar']);
    });

    // ── Conversations ─────────────────────────────────────────
    Route::apiResource('conversations', ConversationController::class)
         ->only(['index', 'store', 'show', 'destroy']);

    // ── Messages ──────────────────────────────────────────────
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/{message}', [MessageController::class, 'show']);
    Route::put('/messages/{message}', [MessageController::class, 'update']);   // ← edit
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
});
