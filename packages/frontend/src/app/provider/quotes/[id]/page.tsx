"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Quote } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Badge, getQuoteStatusVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteResponseForm } from "@/components/quotes/quote-response-form";
import { formatDate, formatPrice } from "@/lib/utils";

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
        const res = await api.get<Quote>(`/quotes/${quoteId}`);
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
          <CardTitle>Buyer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(quote as any).requester && (
            <div>
              <p className="text-sm font-medium text-gray-700">Requester</p>
              <p className="text-sm text-gray-900">
                {(quote as any).requester.name || (quote as any).requester.email}
              </p>
            </div>
          )}
          {(quote as any).listing && (
            <div>
              <p className="text-sm font-medium text-gray-700">Listing</p>
              <p className="text-sm text-gray-900">{(quote as any).listing.title}</p>
            </div>
          )}
          {quote.message && (
            <div>
              <p className="text-sm font-medium text-gray-700">Message</p>
              <p className="text-sm text-gray-600">{quote.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.keys(quote.requirements).length > 0 ? (
              Object.entries(quote.requirements).map(([key, value]) => (
                <div key={key} className="flex items-start">
                  <span className="font-medium capitalize text-gray-700 mr-2">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-gray-900">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No specific requirements provided</p>
            )}
          </div>
        </CardContent>
      </Card>

      {quote.status === "RESPONDED" && quote.quotedPrice && (
        <Card>
          <CardHeader>
            <CardTitle>Your Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Quoted Price</p>
                <p className="text-lg font-semibold text-primary-600">
                  {formatPrice(quote.quotedPrice)}
                </p>
              </div>
              {quote.estimatedDays && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Estimated Duration</p>
                  <p className="text-sm text-gray-900">{quote.estimatedDays} days</p>
                </div>
              )}
              {quote.providerNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Your Notes</p>
                  <p className="text-sm text-gray-600">{quote.providerNotes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
