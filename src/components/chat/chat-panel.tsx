
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizonal, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "./typing-indicator";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import type { Message, ChatSession } from "@/lib/schemas";
import { CHAT_HISTORY_KEY_PREFIX, ALL_CHATS_SESSIONS_KEY } from "@/lib/schemas";

const initialMessages: Message[] = [];

export function ChatPanel() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Logic to handle session initialization and loading chat history
    const chatId = params.chatId?.[0];

    if (chatId) {
      setSessionId(chatId);
      const storedMessages = localStorage.getItem(CHAT_HISTORY_KEY_PREFIX + chatId);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        // This case might happen if the URL is for a session that doesn't exist in localStorage
        setMessages([]);
      }
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setSessionId(newSessionId);
      setMessages([]);
    }
  }, [params.chatId]);


  useEffect(() => {
    // Save messages to local storage whenever they change, but only if there are messages.
    if (sessionId && messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY_PREFIX + sessionId, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector("div[data-radix-scroll-area-viewport]");
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewChat = (newSessionId: string, firstMessage: string) => {
    const newChatName = firstMessage.substring(0, 35) + (firstMessage.length > 35 ? "..." : "");
    const newSession: ChatSession = {
      id: newSessionId,
      name: newChatName,
      path: `/chat/${newSessionId}`
    };

    const allSessionsRaw = localStorage.getItem(ALL_CHATS_SESSIONS_KEY);
    const allSessions: ChatSession[] = allSessionsRaw ? JSON.parse(allSessionsRaw) : [];

    // Check if a session with the same ID already exists to avoid duplicates
    if (!allSessions.some(session => session.id === newSessionId)) {
      const updatedSessions = [newSession, ...allSessions];
      localStorage.setItem(ALL_CHATS_SESSIONS_KEY, JSON.stringify(updatedSessions));
      window.dispatchEvent(new Event('storage')); // To update sidebar
      // Redirect to the new chat URL
      router.push(newSession.path, { scroll: false });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let currentSessionId = sessionId;
    const isNewChat = !params.chatId?.[0];

    // Ensure we have a session ID
    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setSessionId(currentSessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const historyForApi = updatedMessages.slice(0, -1).map(({ role, content }) => ({ role, content }));

      const apiResponse = await fetch('http://localhost:8080/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: currentSessionId,
          question: currentInput,
          history: historyForApi,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.message || 'The API returned an error.');
      }

      const responseData = await apiResponse.json();

      const assistantResponse: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: responseData.answer,
      };

      setMessages((prev) => [...prev, assistantResponse]);

      // 🔥 Move session creation and router push *after* assistant message
      if (isNewChat) {
        handleNewChat(currentSessionId, currentInput);
      }

    } catch (error: any) {
      console.error("Error fetching chat response:", error);
      setMessages(messages); // Rollback
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get a response. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col">
      {/* Chat Messages Scroll Area */}
      <ScrollArea className="flex-1 overflow-auto" ref={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-8">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-4",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <Avatar className="h-9 w-9 border">
                {message.role === "assistant" ? (
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-secondary text-secondary-foreground"><User /></AvatarFallback>
                )}
              </Avatar>
              <Card
                className={cn(
                  "max-w-[85%] rounded-2xl",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted rounded-tl-none"
                )}
              >
                <CardContent className="p-3">
                  <article className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </article>
                </CardContent>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <Avatar className="h-9 w-9 border">
                <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
              </Avatar>
              <Card className="max-w-[85%] rounded-2xl rounded-tl-none bg-muted">
                <CardContent className="p-3">
                  <TypingIndicator />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background px-4 py-3 " style={{
        position: 'fixed',
        bottom: 0,
        width: '-webkit-fill-available'

      }}>
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about regulations..."
            className="min-h-[52px] w-full rounded-2xl resize-none p-4 pr-16 border-input focus:border-primary-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full h-9 w-9"
            disabled={isLoading || !input.trim()}
          >
            <SendHorizonal className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );

}
