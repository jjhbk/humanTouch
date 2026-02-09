"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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

function ProviderQuotesContent() {
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
        // Provider role will be auto-detected by backend
        const query = activeTab !== "all" ? `?status=${activeTab}` : "";
        const res = await api.get<Quote[]>(`/quotes${query}`);
        setQuotes(res.data);
      } catch (error) {
        console.error("Failed to fetch quotes:", error);
        setQuotes([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuotes();
  }, [activeTab]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Quote Requests</h1>

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
              router.push(`/provider/quotes?${params.toString()}`);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <p className="py-12 text-center text-gray-500">No quote requests found.</p>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const quoteWithRelations = quote as any;
            return (
              <Card key={quote.id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getQuoteStatusVariant(quote.status)}>
                        {quote.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(quote.createdAt)}
                      </span>
                    </div>
                    {quoteWithRelations.listing && (
                      <h3 className="mt-1 font-semibold text-gray-900">
                        {quoteWithRelations.listing.title}
                      </h3>
                    )}
                    {quoteWithRelations.requester && (
                      <p className="mt-1 text-sm text-gray-600">
                        From: {quoteWithRelations.requester.name || quoteWithRelations.requester.email}
                      </p>
                    )}
                    {quote.message && (
                      <p className="mt-1 text-sm text-gray-600">
                        {quote.message}
                      </p>
                    )}
                    {quote.quotedPrice && (
                      <p className="mt-2 text-lg font-semibold text-primary-600">
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
                        Your notes: {quote.providerNotes}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <Link href={`/provider/quotes/${quote.id}`}>
                      <Button size="sm" variant={quote.status === "PENDING" ? "default" : "outline"}>
                        {quote.status === "PENDING" ? "Respond" : "View"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProviderQuotesPage() {
  return (
    <Suspense>
      <ProviderQuotesContent />
    </Suspense>
  );
}
