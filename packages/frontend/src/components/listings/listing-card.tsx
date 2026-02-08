"use client";

import Link from "next/link";
import type { Listing } from "@humanlayer/shared";
import { CATEGORY_LABELS, PRICING_MODEL_LABELS } from "@humanlayer/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listings/${listing.slug}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <Badge variant="primary">
              {CATEGORY_LABELS[listing.category] ?? listing.category}
            </Badge>
            {listing.averageRating !== null && (
              <span className="text-sm text-yellow-600">
                {listing.averageRating.toFixed(1)} / 5
              </span>
            )}
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-900">
            {listing.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm text-gray-500">
            {listing.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary-600">
              {formatPrice(listing.basePrice)}
            </span>
            <span className="text-xs text-gray-400">
              {PRICING_MODEL_LABELS[listing.pricingModel] ?? listing.pricingModel}
            </span>
          </div>
          {listing.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {listing.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
