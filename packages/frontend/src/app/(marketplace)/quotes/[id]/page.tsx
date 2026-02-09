"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Quote } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Badge, getQuoteStatusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatPrice } from "@/lib/utils";

export default function BuyerQuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchQuote() {
      setIsLoading(true);
      try {
        const res = await api.get<Quote>(`/quotes/${quoteId}`);
        setQuote(res.data);
      } catch (error) {
        console.error("Failed to fetch quote:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuote();
  }, [quoteId]);

  const handleAction = async (action: "accept" | "reject" | "withdraw") => {
    setIsActing(true);
    try {
      await api.post(`/quotes/${quoteId}/${action}`, {});
      toast(
        action === "accept" ? "Quote accepted! Click 'Create Order' to proceed." :
        action === "reject" ? "Quote rejected" :
        "Quote withdrawn",
        action === "accept" ? "success" : "info"
      );

      // Refresh quote data
      const res = await api.get<Quote>(`/quotes/${quoteId}`);
      setQuote(res.data);
    } catch (error) {
      console.error(`Failed to ${action} quote:`, error);
      toast(`Failed to ${action} quote`, "error");
    } finally {
      setIsActing(false);
    }
  };

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

  const quoteWithRelations = quote as any;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quote Request</h1>
        <div className="mt-2 flex items-center gap-3">
          <Badge variant={getQuoteStatusVariant(quote.status)}>
            {quote.status}
          </Badge>
          <span className="text-sm text-gray-500">
            Requested {formatDate(quote.createdAt)}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quoteWithRelations.listing && (
            <div>
              <p className="text-sm font-medium text-gray-700">Listing</p>
              <Link
                href={`/listings/${quoteWithRelations.listing.slug}`}
                className="text-primary-600 hover:underline"
              >
                {quoteWithRelations.listing.title}
              </Link>
            </div>
          )}
          {quoteWithRelations.provider && (
            <div>
              <p className="text-sm font-medium text-gray-700">Provider</p>
              <p className="text-sm text-gray-900">
                {quoteWithRelations.provider.name || quoteWithRelations.provider.email}
              </p>
            </div>
          )}
          {quote.message && (
            <div>
              <p className="text-sm font-medium text-gray-700">Your Message</p>
              <p className="text-sm text-gray-600">{quote.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Requirements</CardTitle>
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

      {(quote.status === "RESPONDED" || quote.status === "ACCEPTED") && quote.quotedPrice && (
        <Card className={`${quote.status === "ACCEPTED" ? "border-green-200 bg-green-50" : "border-primary-200 bg-primary-50"}`}>
          <CardHeader>
            <CardTitle className={quote.status === "ACCEPTED" ? "text-green-900" : "text-primary-900"}>
              {quote.status === "ACCEPTED" ? "Quote Accepted" : "Provider Response"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className={`text-sm font-medium ${quote.status === "ACCEPTED" ? "text-green-900" : "text-primary-900"}`}>
                Quoted Price
              </p>
              <p className={`text-2xl font-bold ${quote.status === "ACCEPTED" ? "text-green-700" : "text-primary-700"}`}>
                {formatPrice(quote.quotedPrice)}
              </p>
            </div>
            {quote.estimatedDays && (
              <div>
                <p className={`text-sm font-medium ${quote.status === "ACCEPTED" ? "text-green-900" : "text-primary-900"}`}>
                  Estimated Duration
                </p>
                <p className={`text-lg font-semibold ${quote.status === "ACCEPTED" ? "text-green-700" : "text-primary-700"}`}>
                  {quote.estimatedDays} days
                </p>
              </div>
            )}
            {quote.providerNotes && (
              <div>
                <p className={`text-sm font-medium ${quote.status === "ACCEPTED" ? "text-green-900" : "text-primary-900"}`}>
                  Provider Notes
                </p>
                <p className={`text-sm ${quote.status === "ACCEPTED" ? "text-green-800" : "text-primary-800"}`}>
                  {quote.providerNotes}
                </p>
              </div>
            )}
            {quote.expiresAt && (
              <div>
                <p className={`text-sm font-medium ${quote.status === "ACCEPTED" ? "text-green-900" : "text-primary-900"}`}>
                  Quote Expires
                </p>
                <p className={`text-sm ${quote.status === "ACCEPTED" ? "text-green-800" : "text-primary-800"}`}>
                  {formatDate(quote.expiresAt)}
                </p>
              </div>
            )}
            {quote.status === "ACCEPTED" && (
              <div className="pt-3 border-t border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Next Step
                </p>
                <p className="text-sm text-green-800">
                  Click "Create Order" below to proceed with this service.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Link href="/quotes">
          <Button variant="outline">Back to Quotes</Button>
        </Link>

        <div className="flex gap-3">
          {quote.status === "PENDING" && (
            <Button
              variant="outline"
              onClick={() => handleAction("withdraw")}
              disabled={isActing}
            >
              Withdraw Request
            </Button>
          )}
          {quote.status === "RESPONDED" && (
            <>
              <Button
                variant="outline"
                onClick={() => handleAction("reject")}
                disabled={isActing}
              >
                Decline
              </Button>
              <Button
                onClick={() => handleAction("accept")}
                disabled={isActing}
              >
                {isActing ? "Processing..." : "Accept Quote"}
              </Button>
            </>
          )}
          {quote.status === "ACCEPTED" && (
            <Link href={`/quotes/${quoteId}/create-order`}>
              <Button size="lg">
                Create Order
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
