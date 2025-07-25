
import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ChatSessionSchema = z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const CHAT_HISTORY_KEY_PREFIX = 'saama-regulation-history-';
export const ALL_CHATS_SESSIONS_KEY = 'saama-regulation-all-sessions';
