
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizonal, Bot, User, FileText, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "./typing-indicator";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import type { Message, ChatSession, HighlightedContext } from "@/lib/schemas";
import { CHAT_HISTORY_KEY_PREFIX, ALL_CHATS_SESSIONS_KEY } from "@/lib/schemas";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";


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
      const historyForApi = updatedMessages
        .map(({ role, content }) => ({ role, content }));
      
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
        highlighted_contexts: responseData.highlighted_contexts,
      };

      setMessages((prev) => {
        // Find the user message and remove it to replace with the full context
        const newMessages = prev.filter(msg => msg.id !== userMessage.id);
        return [...newMessages, userMessage, assistantResponse];
      });

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
    <div className="flex flex-col flex-1 h-full">
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
              <div className="flex-1 group/message space-y-2">
                 <Card
                  className={cn(
                    "max-w-[85%]",
                    "relative group",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  )}
                >
                  <CardContent>
                    <article className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </article>
                  </CardContent>
                </Card>
                {message.role === 'assistant' && message.highlighted_contexts && message.highlighted_contexts.length > 0 && (
                  <div className="flex items-center justify-start w-full max-w-[85%]">
                      <TooltipProvider>
                        {message.highlighted_contexts.map((context, index) => (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <button className="transition-opacity">
                                <Dot className="h-6 w-6 text-primary" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="w-80" align="start">
                              <div className="space-y-4">
                                <h4 className="font-medium leading-none">Source</h4>
                                <div className="grid gap-2">
                                    <div className="flex items-start gap-2 text-sm">
                                      <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
                                      <div className="flex flex-col">
                                        <span className="font-semibold">{context.source}</span>
                                        {context.page && <span>Page: {context.page}</span>}
                                        {context.language && <span>Language: {context.language}</span>}
                                        {context.context_text && <p className="mt-2 text-xs text-muted-foreground">{context.context_text}</p>}
                                      </div>
                                    </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                  </div>
              )}
              </div>
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
      <div className="border-t bg-background px-4 py-2">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about regulations..."
            className="min-h-[42px] w-full rounded-full resize-none p-3 pr-14 border-input focus:border-primary-foreground"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8"
            disabled={isLoading || !input.trim()}
          >
            <SendHorizonal className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );

}

    