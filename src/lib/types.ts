
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  name: string;
  path: string;
}
