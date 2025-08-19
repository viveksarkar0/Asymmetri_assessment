"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ChatSidebar } from "@/components/ChatSidebar";
import { AuthView } from "@/components/chat/AuthView";
import { useChat } from "@/hooks/useChat";
import { useChatManager } from "@/hooks/useChatManager";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    currentChatId,
    saveMessage,
    createChat,
    loadChat,
    startNewChat,
    setCurrentChatId,
    useLocalStorage,
  } = useChatManager();

  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    setMessages,
    clearMessages,
    setQuickInput,
  } = useChat({
    api: "/api/chat",
    onFinish: async (message) => {
      // Save assistant message to database if we have a chat
      if (currentChatId) {
        await saveMessage(
          currentChatId,
          message.role,
          message.content,
          message.toolInvocations,
        );
      }
    },
  });

  // Handle chat submission with proper state management
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();

    // Handle chat creation and user message saving
    let chatId = currentChatId;
    if (!currentChatId) {
      // Create new chat
      chatId = await createChat(userInput);
      if (chatId) {
        // Save user message to new chat
        await saveMessage(chatId, "user", userInput);
      }
    } else {
      // Save user message to existing chat
      await saveMessage(currentChatId, "user", userInput);
    }

    // Submit to UI (this will handle the AI response)
    handleSubmit(e);
  };

  // Handle quick action inputs
  const handleQuickAction = (action: string) => {
    setQuickInput(action);
  };

  // Handle loading an existing chat
  const handleLoadChat = async (chatId: string) => {
    if (currentChatId === chatId) return;

    try {
      const chatMessages = await loadChat(chatId);
      setMessages(chatMessages);
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  // Handle starting a new chat
  const handleNewChat = () => {
    startNewChat();
    clearMessages();
  };

  // Show auth view if not authenticated
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } flex-shrink-0 border-r border-border transition-all duration-300 overflow-hidden h-full`}
      >
        <ChatSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSelectChat={handleLoadChat}
          onNewChat={handleNewChat}
          currentChatId={currentChatId || undefined}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 h-full">
        <ChatInterface
          messages={messages}
          input={input}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={handleChatSubmit}
          onQuickAction={handleQuickAction}
          title={currentChatId ? "Chat" : "New Chat"}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          useLocalStorage={useLocalStorage}
        />
      </div>
    </div>
  );
}
