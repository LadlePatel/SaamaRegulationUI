

"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizonal, Bot, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "./typing-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import type { Message, ChatSession, HighlightedContext } from "@/lib/schemas";
import { CHAT_HISTORY_KEY_PREFIX, ALL_CHATS_SESSIONS_KEY } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


const suggestedQuestions = [
  "What are the core principles regarding ethical AI use in Saudi Arabia?"
  "What are the key IT governance requirements for SAMA-regulated organizations?"
  "How should government data be classified and protected in Saudi Arabia?"
  "What are the key cybersecurity requirements for financial institutions regulated by SAMA?"
  "What are the national standards for managing and protecting data in Saudi Arabia?"
  "What makes Sama's outsourcing model different?"
  "How should data be classified under the NDMO policy?"
  "What are the key requirements of the SAMA Cybersecurity Framework?"
  "What are the main principles of the SAMA IT Framework?"
];

export function ChatPanel() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
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

    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }

  }, [messages, sessionId]);

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
    const currentInput = input;
    if (!currentInput.trim() || isLoading) return;

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
      content: currentInput,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const historyForApi = updatedMessages
        .map(({ role, content }) => ({ role, content }));

      const apiResponse = await fetch('https://anb-capital-84218037131.asia-south1.run.app/chat', {
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

  const handleQuestionClick = (question: string) => {
    setInput(question);
    // Use a timeout to allow the state to update before submitting
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  };

  const renderContextDialog = (context: HighlightedContext) => (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> 
            Source Details
        </DialogTitle>
        <DialogDescription>
            Detailed information about the source of this information.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="flex flex-col space-y-2">
          <h4 className="font-semibold text-sm leading-none">{context.source}</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {context.page && <span>Page: {context.page}</span>}
            {context.language && <span>Language: {context.language}</span>}
            {context.context_text && (
                <ScrollArea className="mt-2 text-xs max-h-48 p-2 border rounded-md">
                    {context.context_text}
                </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
  );


  return (
    <div className="flex flex-col h-screen">
      {/* Chat Messages Scroll Area */}
      <ScrollArea className="flex-1 flex flex-col relative" ref={scrollAreaRef}>
        <div className={cn("p-4 md:p-6 space-y-8 flex flex-col justify-end min-h-full bottom-0", { "justify-center": messages.length === 0 })}>
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="max-w-2xl text-center">
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      className="px-4 py-2 border border-border rounded-full bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-colors text-sm text-secondary-foreground cursor-pointer"
                      onClick={() => handleQuestionClick(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {[...messages].map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-4",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-9 w-9 border-2 border-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                </Avatar>
              )}
              <div className="group/message space-y-2 max-w-[85%]">
                <div
                  className={cn(
                    "relative group rounded-lg p-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-secondary text-secondary-foreground rounded-tl-none",
                  )}
                >
                  <article className="prose prose-sm prose-invert max-w-none text-inherit">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </article>
                </div>
                {message.role === 'assistant' && message.highlighted_contexts && message.highlighted_contexts.length > 0 && (
                   <div className="flex items-center justify-start">
                    <div className="flex items-center justify-start w-full">
                      {message.highlighted_contexts.map((context, index) => (
                        <Dialog key={index}>
                          <DialogTrigger asChild>
                            <button className="transition-opacity p-0">
                              <span className="h-6 w-6 text-primary flex items-center justify-center text-xs font-bold border-[1px] mr-2 border-primary rounded-full">{index + 1}</span>
                            </button>
                          </DialogTrigger>
                          {renderContextDialog(context)}
                        </Dialog>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-9 w-9 border-2 border-border">
                  <AvatarFallback className="bg-secondary text-secondary-foreground"><User /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <Avatar className="h-9 w-9 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
              </Avatar>
              <Card className="max-w-[85%] rounded-2xl rounded-tl-none bg-secondary">
                <CardContent className="p-3">
                  <TypingIndicator />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="sticky bottom-0 z-10 bg-background/95 p-4 backdrop-blur-sm">
        <Card className="relative flex w-full items-center rounded-2xl p-1.5">
          <form onSubmit={handleSubmit} ref={formRef} className="flex-1">
            <Textarea
              name="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about regulations..."
              className="min-h-[42px] w-full resize-none border-none bg-transparent p-2 focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full h-8 w-8"
              disabled={isLoading || !input.trim()}
            >
              <SendHorizonal className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
