"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface Message {
  id: string;
  orderId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface OrderChatProps {
  orderId: string;
  otherPartyName: string;
}

export function OrderChat({ orderId, otherPartyName }: OrderChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get<{
        messages: Message[];
        total: number;
        unreadCount: number;
      }>(`/messages/order/${orderId}`);
      setMessages(res.data.messages);

      // Mark unread messages as read
      const unreadIds = res.data.messages
        .filter((m) => !m.isRead && m.senderId !== user?.id)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await api.post("/messages/mark-read", { messageIds: unreadIds });
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 15 seconds (reduced from 5s for scalability)
    // For real-time feel with better performance
    pollIntervalRef.current = setInterval(fetchMessages, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post<Message>("/messages", {
        orderId,
        content: newMessage.trim(),
      });

      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      toast("Message sent", "success");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast("Failed to send message", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages with {otherPartyName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages List */}
        <div className="h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          {isLoading ? (
            <p className="text-center text-sm text-gray-500">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isOwn
                        ? "bg-primary-600 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isOwn ? "text-primary-100" : "text-gray-500"
                      }`}
                    >
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none"
            rows={3}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="self-end"
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
