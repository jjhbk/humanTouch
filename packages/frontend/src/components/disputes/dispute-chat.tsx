"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface DisputeComment {
  id: string;
  disputeId: string;
  userId: string;
  comment: string;
  isAdmin: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

interface DisputeChatProps {
  disputeId: string;
}

export function DisputeChat({ disputeId }: DisputeChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<DisputeComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchComments = async () => {
    try {
      const res = await api.get<DisputeComment[]>(`/disputes/${disputeId}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Poll for new comments every 20 seconds (reduced for scalability)
    // Disputes are less time-critical than regular messages
    pollIntervalRef.current = setInterval(fetchComments, 20000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [disputeId]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleSend = async () => {
    if (!newComment.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post<DisputeComment>(`/disputes/${disputeId}/comments`, {
        comment: newComment.trim(),
      });

      setComments((prev) => [...prev, res.data]);
      setNewComment("");
      toast("Comment added", "success");
    } catch (error) {
      console.error("Failed to send comment:", error);
      toast("Failed to send comment", "error");
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
        <CardTitle>Dispute Discussion</CardTitle>
        <p className="text-sm text-gray-600">
          Communicate with the admin and other party to resolve this dispute
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        <div className="h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          {isLoading ? (
            <p className="text-center text-sm text-gray-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              No comments yet. Start the discussion!
            </p>
          ) : (
            comments.map((comment) => {
              const isOwn = comment.userId === user?.id;
              const isAdminComment = comment.isAdmin;

              return (
                <div
                  key={comment.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      isAdminComment
                        ? "bg-yellow-100 border-2 border-yellow-400 text-gray-900"
                        : isOwn
                          ? "bg-primary-600 text-white"
                          : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-xs font-semibold ${
                        isAdminComment ? "text-yellow-900" : isOwn ? "text-primary-100" : "text-gray-700"
                      }`}>
                        {comment.user.name || comment.user.email}
                        {isAdminComment && " (Admin)"}
                      </p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {comment.comment}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isAdminComment ? "text-yellow-700" : isOwn ? "text-primary-100" : "text-gray-500"
                      }`}
                    >
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input */}
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none"
            rows={3}
          />
          <Button
            onClick={handleSend}
            disabled={!newComment.trim() || isSending}
            className="self-end"
          >
            {isSending ? "Sending..." : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
