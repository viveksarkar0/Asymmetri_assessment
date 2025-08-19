"use client";

import { useState, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvocations?: any[];
  isThinking?: boolean;
}

interface UseChatProps {
  api: string;
  onFinish?: (message: Message) => Promise<void>;
}

export function useChat({ api, onFinish }: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    [],
  );

  // Helper function to generate unique IDs
  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Helper function to update specific message without duplicates
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) => {
        const messageExists = prev.some((msg) => msg.id === messageId);
        if (!messageExists) return prev;

        return prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg,
        );
      });
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input.trim(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Store input and clear immediately for better UX
    const userInput = input.trim();
    setInput("");

    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Create assistant message with unique ID
      const assistantId = generateId();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        toolInvocations: [],
        isThinking: true,
      };

      // Add assistant message immediately
      setMessages((prev) => [...prev, assistantMessage]);

      // Stream the response
      let isComplete = false;
      while (!isComplete) {
        const { done, value } = await reader.read();
        if (done) {
          isComplete = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        // Check for tool results in the stream
        if (assistantContent.includes("TOOL_RESULT:")) {
          const toolResultIndex = assistantContent.indexOf("TOOL_RESULT:");
          const textPart = assistantContent
            .substring(0, toolResultIndex)
            .trim();
          const toolPart = assistantContent.substring(toolResultIndex + 12);

          try {
            const toolResult = JSON.parse(toolPart);

            // Update message with final content and tool result
            updateMessage(assistantId, {
              content: textPart,
              toolInvocations: [toolResult],
              isThinking: false,
            });

            // Call onFinish with the complete message
            if (onFinish) {
              const finalMessage: Message = {
                id: assistantId,
                role: "assistant",
                content: textPart,
                toolInvocations: [toolResult],
              };
              await onFinish(finalMessage);
            }

            isComplete = true;
            break;
          } catch (e) {
            console.error("Failed to parse tool result:", e);
            // If parsing fails, just show the text part
            updateMessage(assistantId, {
              content: textPart,
              isThinking: false,
            });
          }
        } else {
          // Update with streaming content
          updateMessage(assistantId, {
            content: assistantContent,
            isThinking: false,
          });
        }
      }

      // Handle case where no tool results were found
      if (!assistantContent.includes("TOOL_RESULT:")) {
        updateMessage(assistantId, {
          content: assistantContent,
          isThinking: false,
        });

        // Call onFinish for text-only responses
        if (onFinish) {
          const finalMessage: Message = {
            id: assistantId,
            role: "assistant",
            content: assistantContent,
            toolInvocations: [],
          };
          await onFinish(finalMessage);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        toolInvocations: [],
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const setQuickInput = useCallback((value: string) => {
    setInput(value);
  }, []);

  // Function to set messages from external source (like loading from DB)
  const setMessagesFromExternal = useCallback((newMessages: Message[]) => {
    // Ensure all messages have valid IDs
    const validatedMessages = newMessages.map((msg) => ({
      ...msg,
      id: msg.id || generateId(),
    }));
    setMessages(validatedMessages);
  }, []);

  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    setMessages: setMessagesFromExternal,
    clearMessages,
    setQuickInput,
  };
}
