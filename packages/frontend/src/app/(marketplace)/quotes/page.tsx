"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Quote, QuoteStatus } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Badge, getQuoteStatusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatPrice, formatDate } from "@/lib/utils";

const TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Responded", value: "RESPONDED" },
  { label: "Accepted", value: "ACCEPTED" },
];

function QuotesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const activeTab = searchParams.get("status") ?? "all";

  useEffect(() => {
    async function fetchQuotes() {
      setIsLoading(true);
      try {
        const query = activeTab !== "all" ? `?status=${activeTab}` : "";
        const res = await api.get<Quote[]>(`/api/v1/quotes${query}`);
        setQuotes(res.data);
      } catch {
        setQuotes([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuotes();
  }, [activeTab]);

  const handleAction = async (quoteId: string, action: "accept" | "reject") => {
    try {
      await api.patch(`/api/v1/quotes/${quoteId}/${action}`, {});
      toast(
        action === "accept" ? "Quote accepted!" : "Quote rejected",
        action === "accept" ? "success" : "info",
      );
      // Refresh
      const query = activeTab !== "all" ? `?status=${activeTab}` : "";
      const res = await api.get<Quote[]>(`/api/v1/quotes${query}`);
      setQuotes(res.data);
    } catch {
      toast("Action failed", "error");
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Quotes</h1>

      <div className="mb-6 flex gap-2 border-b border-gray-200 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === tab.value
                ? "bg-primary-50 text-primary-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => {
              const params = new URLSearchParams();
              if (tab.value !== "all") params.set("status", tab.value);
              router.push(`/quotes?${params.toString()}`);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <p className="py-12 text-center text-gray-500">No quotes found.</p>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getQuoteStatusVariant(quote.status)}>
                      {quote.status}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {formatDate(quote.createdAt)}
                    </span>
                  </div>
                  {quote.message && (
                    <p className="mt-1 text-sm text-gray-600">
                      {quote.message}
                    </p>
                  )}
                  {quote.quotedPrice && (
                    <p className="mt-1 text-lg font-semibold text-primary-600">
                      {formatPrice(quote.quotedPrice)}
                      {quote.estimatedDays && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({quote.estimatedDays} days)
                        </span>
                      )}
                    </p>
                  )}
                  {quote.providerNotes && (
                    <p className="mt-1 text-sm text-gray-500">
                      {quote.providerNotes}
                    </p>
                  )}
                </div>
                {quote.status === "RESPONDED" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(quote.id, "accept")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(quote.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuotesPage() {
  return (
    <Suspense>
      <QuotesContent />
    </Suspense>
  );
}
