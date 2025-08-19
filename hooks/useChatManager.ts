"use client";

import { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvocations?: any[];
}

export function useChatManager() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Helper function to try database first, then fallback to local storage
  const tryWithFallback = async <T>(
    dbOperation: () => Promise<T>,
    localOperation: () => Promise<T>,
  ): Promise<T> => {
    if (useLocalStorage) {
      return localOperation();
    }

    try {
      return await dbOperation();
    } catch (error) {
      console.warn(
        "Database operation failed, falling back to local storage:",
        error,
      );
      setUseLocalStorage(true);
      return localOperation();
    }
  };

  const saveMessage = async (
    chatId: string,
    role: string,
    content: string,
    toolInvocations?: any,
  ) => {
    await tryWithFallback(
      async () => {
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, content, toolInvocations }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      },
      async () => {
        const response = await fetch(`/api/chats-local/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, content, toolInvocations }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      },
    );
  };

  const createChat = async (title: string): Promise<string | null> => {
    return tryWithFallback(
      async () => {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.slice(0, 50) || "New Chat" }),
        });

        if (response.ok) {
          const newChat = await response.json();
          setCurrentChatId(newChat.id);
          window.dispatchEvent(new CustomEvent("chatCreated"));
          return newChat.id;
        }
        throw new Error(`HTTP ${response.status}`);
      },
      async () => {
        const response = await fetch("/api/chats-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.slice(0, 50) || "New Chat" }),
        });

        if (response.ok) {
          const newChat = await response.json();
          setCurrentChatId(newChat.id);
          window.dispatchEvent(new CustomEvent("chatCreated"));
          return newChat.id;
        }
        throw new Error(`HTTP ${response.status}`);
      },
    );
  };

  const loadChat = async (chatId: string): Promise<Message[]> => {
    if (currentChatId === chatId) return [];

    setCurrentChatId(chatId);

    return tryWithFallback(
      async () => {
        const response = await fetch(`/api/chats/${chatId}`);
        if (response.ok) {
          const { messages: chatMessages } = await response.json();
          return chatMessages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            toolInvocations: msg.toolInvocations,
          }));
        }
        throw new Error(`HTTP ${response.status}`);
      },
      async () => {
        const response = await fetch(`/api/chats-local/${chatId}`);
        if (response.ok) {
          const { messages: chatMessages } = await response.json();
          return chatMessages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            toolInvocations: msg.toolInvocations,
          }));
        }
        throw new Error(`HTTP ${response.status}`);
      },
    );
  };

  const handleChatSubmit = async (
    userInput: string,
    onSubmit: (e: React.FormEvent) => void,
  ) => {
    // Create chat if needed (async, don't wait)
    let chatId = currentChatId;
    if (!currentChatId) {
      chatId = await createChat(userInput);
    }

    // Save user message to existing or new chat
    if (chatId) {
      await saveMessage(chatId, "user", userInput);
    }

    // Trigger the UI updates for responsiveness
    onSubmit({} as React.FormEvent);
  };

  const startNewChat = () => {
    setCurrentChatId(null);
  };

  return {
    currentChatId,
    saveMessage,
    createChat,
    loadChat,
    handleChatSubmit,
    startNewChat,
    setCurrentChatId,
    useLocalStorage, // Expose this for debugging
  };
}
