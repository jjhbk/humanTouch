"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Quote } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatPrice, formatDate } from "@/lib/utils";

export default function CreateOrderPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchQuote() {
      setIsLoading(true);
      try {
        const res = await api.get<Quote>(`/quotes/${quoteId}`);
        const quoteData = res.data;

        // Verify quote is accepted
        if (quoteData.status !== "ACCEPTED") {
          toast("Quote must be accepted before creating an order", "error");
          router.push(`/quotes/${quoteId}`);
          return;
        }

        setQuote(quoteData);
      } catch (error) {
        console.error("Failed to fetch quote:", error);
        toast("Failed to load quote", "error");
        router.push("/quotes");
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuote();
  }, [quoteId, router, toast]);

  const handleCreateOrder = async () => {
    if (!quote) return;

    setIsCreating(true);
    try {
      console.log("Creating order with quoteId:", quote.id);

      const res = await api.post("/orders", {
        quoteId: quote.id,
      });

      console.log("Order created successfully:", res.data);

      toast("Order created successfully!", "success");

      // Redirect to the order page - res.data is already the order object
      const orderId = (res.data as any).id;
      setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 1000);
    } catch (error: any) {
      console.error("Failed to create order:", error);
      const errorMessage = error?.message || "Failed to create order";
      toast(errorMessage, "error");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-64 w-full" />
      </div>
    );
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review the details and create your order
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quoteWithRelations.listing && (
            <div>
              <p className="text-sm font-medium text-gray-700">Service</p>
              <p className="text-lg font-semibold text-gray-900">
                {quoteWithRelations.listing.title}
              </p>
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

          <div className="border-t pt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-gray-700">Price</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatPrice(quote.quotedPrice || "0")}
              </p>
            </div>
          </div>

          {quote.estimatedDays && (
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-gray-700">Estimated Duration</p>
              <p className="text-sm text-gray-900">{quote.estimatedDays} days</p>
            </div>
          )}

          {quote.providerNotes && (
            <div>
              <p className="text-sm font-medium text-gray-700">Provider Notes</p>
              <p className="text-sm text-gray-600">{quote.providerNotes}</p>
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
              <p className="text-sm text-gray-500">No specific requirements</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-5">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Create the order by clicking the button below</li>
            <li>Deposit USDC to the escrow contract to confirm the order</li>
            <li>The provider will be notified and begin work</li>
            <li>Once complete, release payment from escrow or wait for auto-release</li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/quotes/${quoteId}`)}
          disabled={isCreating}
        >
          Back to Quote
        </Button>

        <Button
          onClick={handleCreateOrder}
          disabled={isCreating}
          size="lg"
        >
          {isCreating ? "Creating Order..." : "Create Order"}
        </Button>
      </div>
    </div>
  );
}
