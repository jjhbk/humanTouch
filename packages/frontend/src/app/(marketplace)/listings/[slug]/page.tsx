"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Listing, Review } from "@humanlayer/shared";
import { CATEGORY_LABELS, PRICING_MODEL_LABELS } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteRequestForm } from "@/components/quotes/quote-request-form";
import { formatPrice, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";

export default function ListingDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await api.get<Listing>(`/api/v1/listings/${slug}`);
        setListing(res.data);
        try {
          const reviewsRes = await api.get<Review[]>(
            `/api/v1/listings/${slug}/reviews`,
          );
          setReviews(reviewsRes.data);
        } catch {
          // Reviews endpoint may not exist yet
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-500">Listing not found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Badge variant="primary">
              {CATEGORY_LABELS[listing.category] ?? listing.category}
            </Badge>
            <Badge>
              {PRICING_MODEL_LABELS[listing.pricingModel] ?? listing.pricingModel}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
        </div>

        <div className="prose max-w-none text-gray-600">
          <p>{listing.description}</p>
        </div>

        {Object.keys(listing.specifications).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                {Object.entries(listing.specifications).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-gray-500">{key}</dt>
                    <dd className="text-sm text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        {listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {listing.tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Reviews ({listing.totalReviews})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-100 pb-4 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-yellow-600">
                      {review.rating}/5
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-1 text-sm text-gray-600">
                      {review.comment}
                    </p>
                  )}
                  {review.providerReply && (
                    <div className="mt-2 rounded bg-gray-50 p-2">
                      <p className="text-xs font-medium text-gray-500">
                        Provider reply:
                      </p>
                      <p className="text-sm text-gray-600">
                        {review.providerReply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-primary-600">
              {formatPrice(listing.basePrice)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {PRICING_MODEL_LABELS[listing.pricingModel] ?? listing.pricingModel}
            </p>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              {listing.averageRating !== null && (
                <p>
                  Rating: {listing.averageRating.toFixed(1)}/5 (
                  {listing.totalReviews} reviews)
                </p>
              )}
              <p>Available slots: {listing.availableSlots}</p>
            </div>

            <Button
              className="mt-6 w-full"
              onClick={() => setQuoteDialogOpen(true)}
              disabled={!isAuthenticated}
            >
              {isAuthenticated ? "Request Quote" : "Sign in to Request"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <QuoteRequestForm
        listingId={listing.id}
        open={quoteDialogOpen}
        onClose={() => setQuoteDialogOpen(false)}
      />
    </div>
  );
}
