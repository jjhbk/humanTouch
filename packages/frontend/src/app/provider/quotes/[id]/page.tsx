"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Quote } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Badge, getQuoteStatusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteResponseForm } from "@/components/quotes/quote-response-form";
import { formatDate } from "@/lib/utils";

export default function ProviderQuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchQuote() {
      setIsLoading(true);
      try {
        const res = await api.get<Quote>(`/api/v1/quotes/${quoteId}`);
        setQuote(res.data);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuote();
  }, [quoteId]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!quote) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-500">Quote not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quote Request</h1>
        <div className="mt-2 flex items-center gap-3">
          <Badge variant={getQuoteStatusVariant(quote.status)}>
            {quote.status}
          </Badge>
          <span className="text-sm text-gray-500">
            Received {formatDate(quote.createdAt)}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buyer Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded bg-gray-50 p-3 text-sm">
            {JSON.stringify(quote.requirements, null, 2)}
          </pre>
          {quote.message && (
            <p className="mt-3 text-sm text-gray-600">{quote.message}</p>
          )}
        </CardContent>
      </Card>

      {quote.status === "PENDING" && (
        <Card>
          <CardHeader>
            <CardTitle>Respond to Quote</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteResponseForm
              quoteId={quoteId}
              onSuccess={() => router.push("/provider/dashboard")}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
