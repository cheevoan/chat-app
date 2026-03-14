/**
 * In-app notification system — works in Expo Go without any native modules.
 * Shows a banner at the top of the screen when a message arrives.
 */
import { router } from "expo-router";

type NotifCallback = (params: {
  title: string;
  body: string;
  conversationId?: number;
  groupId?: number;
  senderName?: string;
}) => void;

// Global listener — set by NotificationBanner component
let _listener: NotifCallback | null = null;

export function setNotificationListener(cb: NotifCallback) {
  _listener = cb;
}

export function clearNotificationListener() {
  _listener = null;
}

export async function requestNotificationPermission(): Promise<boolean> {
  return true; // no-op for in-app banners
}

export async function showMessageNotification(params: {
  title: string;
  body: string;
  conversationId?: number;
  groupId?: number;
  senderName?: string;
}) {
  // Fire the in-app banner listener
  if (_listener) {
    _listener(params);
  }
}

export function setupNotificationTapHandler() {
  // no-op — handled by banner onPress
  return () => {};
}

export function navigateToChat(params: {
  conversationId?: number;
  groupId?: number;
  senderName?: string;
}) {
  if (params.conversationId) {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: String(params.conversationId),
        name: params.senderName ?? "Chat",
      },
    });
  } else if (params.groupId) {
    router.push({
      pathname: "/group/[id]",
      params: {
        id: String(params.groupId),
        name: params.senderName ?? "Group",
      },
    });
  }
}
