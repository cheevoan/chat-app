export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  is_admin: boolean;
  blocked_at: string | null;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  owner: User;
  members?: User[];
  member_count?: number;
  last_message?: Message | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  other_user: User;
  last_message?: Message | null;
  created_at: string;
}

export interface Message {
  id: number;
  message: string | null;
  sender: User;
  receiver?: User | null;
  group_id?: number | null;
  conversation_id?: number | null;
  attachments?: MessageAttachment[];
  created_at: string;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  name: string;
  url: string;
  mime: string;
  size: number;
  is_image: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    next: string | null;
    prev: string | null;
  };
}
