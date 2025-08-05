
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  MessageSquare,
  Settings,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChatSession } from "@/lib/schemas";
import { ALL_CHATS_SESSIONS_KEY, CHAT_HISTORY_KEY_PREFIX } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from "next/image";


export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

  const handleStorageChange = () => {
    const storedSessions = localStorage.getItem(ALL_CHATS_SESSIONS_KEY);
    if (storedSessions) {
      setChatHistory(JSON.parse(storedSessions));
    } else {
      setChatHistory([]);
    }
  };

  useEffect(() => {
    handleStorageChange(); // Initial load

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDeleteChat = (e: React.MouseEvent, chatIdToDelete: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Remove from all sessions
    const updatedSessions = chatHistory.filter(chat => chat.id !== chatIdToDelete);
    localStorage.setItem(ALL_CHATS_SESSIONS_KEY, JSON.stringify(updatedSessions));
    
    // Remove individual chat history
    localStorage.removeItem(CHAT_HISTORY_KEY_PREFIX + chatIdToDelete);
    
    // Update UI
    handleStorageChange();
    
    // If user is currently on the deleted chat page, redirect them
    if (pathname === `/chat/${chatIdToDelete}`) {
        router.push('/chat');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
      // TODO: Implement file upload logic
    }
  };


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Image src="https://anbgpt.web.app/static/media/anb.17001d91be60b4e96b91f1420625ba78.svg" alt="ANB GPT Logo" width={24} height={24} className="h-6 w-6" />
          <span className="text-lg font-semibold">ANB GPT</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/chat" className="w-full">
              <SidebarMenuButton
                isActive={pathname === "/chat"}
                className="w-full"
              >
                <MessageSquare className="h-5 w-5" />
                <span>New Chat</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel className="font-bold text-base">Chat History</SidebarGroupLabel>
          <SidebarMenu>
            {chatHistory.map((chat) => (
              <SidebarMenuItem key={chat.id} className="group/item relative">
                <Link href={`/chat/${chat.id}`} className="w-full">
                  <SidebarMenuButton
                    isActive={pathname === `/chat/${chat.id}`}
                    className="w-full justify-start pr-8"
                  >
                    <span className="truncate">{chat.name}</span>
                  </SidebarMenuButton>
                </Link>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover/item:opacity-100">
                            <Trash2 className="h-4 w-4 text-red-500" />
                         </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your chat history and remove your data from our servers.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => handleDeleteChat(e, chat.id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 flex flex-col gap-2">
        <SidebarMenu>
            <SidebarMenuItem>
                <label htmlFor="pdf-upload" className="w-full cursor-pointer">
                <SidebarMenuButton className="w-full" asChild>
                    <div>
                    <Upload className="h-5 w-5" />
                    <span>Upload PDF</span>
                    </div>
                </SidebarMenuButton>
                </label>
                <input 
                id="pdf-upload" 
                type="file" 
                accept=".pdf" 
                className="hidden"
                onChange={handleFileChange} 
                />
            </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex flex-row items-center justify-around w-full">
            <Link href="/settings">
              <Button variant="ghost" size="icon" className={pathname === "/settings" ? "bg-accent" : ""}>
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/profile">
               <Button variant="ghost" size="icon" className={pathname === "/profile" ? "bg-accent" : ""}>
                <User className="h-5 w-5" />
              </Button>
            </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
