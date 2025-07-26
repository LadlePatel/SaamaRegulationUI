
import { z } from 'zod';

export const HighlightedContextSchema = z.object({
  file_id: z.number().optional(),
  page: z.number().optional(),
  source: z.string(),
  language: z.string().optional(),
  context_text: z.string().optional(),
});

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  highlighted_contexts: z.array(HighlightedContextSchema).optional(),
});

export const ChatSessionSchema = z.object({
    id: z.string(),
    name: z.string(),
    path: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type HighlightedContext = z.infer<typeof HighlightedContextSchema>;


export const CHAT_HISTORY_KEY_PREFIX = 'saama-regulation-history-';
export const ALL_CHATS_SESSIONS_KEY = 'saama-regulation-all-sessions';
