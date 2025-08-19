"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  MessageSquare,
  Trash2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  open: boolean;
  onToggle: () => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  currentChatId?: string;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export function ChatSidebar({
  open,
  onToggle,
  onSelectChat,
  onNewChat,
  currentChatId,
}: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  useEffect(() => {
    loadChats();

    // Listen for chat creation events to refresh the sidebar
    const handleChatCreated = () => {
      loadChats();
    };

    window.addEventListener("chatCreated", handleChatCreated);

    return () => {
      window.removeEventListener("chatCreated", handleChatCreated);
    };
  }, []);

  const loadChats = async () => {
    try {
      setError(null);
      let response;

      if (useLocalStorage) {
        response = await fetch("/api/chats-local");
      } else {
        try {
          response = await fetch("/api/chats");
        } catch (error) {
          console.warn(
            "Database failed, falling back to local storage:",
            error,
          );
          setUseLocalStorage(true);
          response = await fetch("/api/chats-local");
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to load chats: ${response.status}`);
      }
      const data = await response.json();
      setChats(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load chats";
      setError(errorMessage);
      toast.error("Error loading chats", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingChatId(chatId);
    try {
      let response;

      if (useLocalStorage) {
        response = await fetch(`/api/chats-local/${chatId}`, {
          method: "DELETE",
        });
      } else {
        try {
          response = await fetch(`/api/chats/${chatId}`, {
            method: "DELETE",
          });
        } catch (error) {
          console.warn(
            "Database failed, falling back to local storage:",
            error,
          );
          setUseLocalStorage(true);
          response = await fetch(`/api/chats-local/${chatId}`, {
            method: "DELETE",
          });
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to delete chat: ${response.status}`);
      }
      setChats(chats.filter((chat) => chat.id !== chatId));
      if (currentChatId === chatId) {
        onNewChat();
      }
      toast.success("Chat deleted", {
        description: "Chat has been successfully deleted.",
      });
      // Refresh the chat list
      loadChats();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete chat";
      toast.error("Error deleting chat", {
        description: errorMessage,
      });
    } finally {
      setDeletingChatId(null);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    loadChats();
  };

  return (
    <Card className="w-full h-full border-0 bg-sidebar shadow-lg">
      <CardContent className="p-3 md:p-6 h-full flex flex-col">
        <Button
          onClick={onNewChat}
          className="w-full mb-4 md:mb-6 h-10 md:h-12 text-sm md:text-base shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 bg-gradient-to-r from-sidebar-primary to-sidebar-primary/90"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Chat
        </Button>

        <div className="mb-3 md:mb-4">
          <h3 className="text-xs md:text-sm font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-2 md:mb-3">
            Recent Chats
          </h3>
        </div>

        <ScrollArea className="flex-1 -mx-1 md:mx-0">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 md:h-16 bg-sidebar-accent/50 rounded-lg md:rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-sidebar-foreground/70 py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-sm mb-4 font-medium">Failed to load chats</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="shadow-md hover:shadow-lg transition-all duration-200 bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center text-sidebar-foreground/70 py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-sidebar-accent/20 to-sidebar-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-sidebar-foreground/50" />
              </div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs text-sidebar-foreground/50 mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center justify-between p-2 md:p-4 rounded-lg md:rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    currentChatId === chat.id
                      ? "bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/10 border border-sidebar-primary/30 shadow-md"
                      : "hover:bg-sidebar-accent/50 hover:shadow-md"
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div
                      className={`w-6 md:w-8 h-6 md:h-8 rounded-md md:rounded-lg flex items-center justify-center flex-shrink-0 ${
                        currentChatId === chat.id
                          ? "bg-gradient-to-br from-sidebar-primary/30 to-sidebar-primary/20"
                          : "bg-sidebar-accent/30"
                      }`}
                    >
                      <MessageSquare className="h-3 md:h-4 w-3 md:w-4 text-sidebar-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm md:text-base font-medium truncate text-sidebar-foreground">
                        {chat.title}
                      </p>
                      <div className="flex items-center gap-1 md:gap-2 mt-1">
                        <p className="text-xs text-sidebar-foreground/60">
                          {formatTimeAgo(chat.updatedAt)}
                        </p>
                        {currentChatId === chat.id && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-sidebar-primary/20 text-sidebar-primary px-1 md:px-2"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/20 hover:text-destructive h-6 w-6 md:h-8 md:w-8 p-0"
                    onClick={(e) => deleteChat(chat.id, e)}
                    disabled={deletingChatId === chat.id}
                  >
                    {deletingChatId === chat.id ? (
                      <RefreshCw className="h-3 md:h-4 w-3 md:w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 md:h-4 w-3 md:w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-sidebar-foreground/50">
            <Sparkles className="h-3 md:h-4 w-3 md:w-4" />
            <span className="text-xs font-medium">AI Assistant</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
