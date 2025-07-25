
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
  BotMessageSquare,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChatSession } from "@/lib/schemas";
import { ALL_CHATS_SESSIONS_KEY } from "@/lib/schemas";

export function AppSidebar() {
  const pathname = usePathname();
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedSessions = localStorage.getItem(ALL_CHATS_SESSIONS_KEY);
      if (storedSessions) {
        setChatHistory(JSON.parse(storedSessions));
      } else {
        setChatHistory([]);
      }
    };

    handleStorageChange(); // Initial load

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <BotMessageSquare className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">SaamaRegulation</span>
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

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Chat History</SidebarGroupLabel>
          <SidebarMenu>
            {chatHistory.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <Link href={`/chat/${chat.id}`} className="w-full">
                  <SidebarMenuButton
                    isActive={pathname === `/chat/${chat.id}`}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <span className="truncate">{chat.name}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" className="w-full">
              <SidebarMenuButton
                isActive={pathname === "/settings"}
                className="w-full"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/profile" className="w-full">
              <SidebarMenuButton
                isActive={pathname === "/profile"}
                className="w-full"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
