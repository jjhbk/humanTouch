"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Listing, PaginationMeta, ListingSearchQuery } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { ListingGrid } from "@/components/listings/listing-grid";
import { ListingFilters } from "@/components/listings/listing-filters";
import { Button } from "@/components/ui/button";

function ListingsContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const query: ListingSearchQuery = {};
      const category = searchParams.get("category");
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      const minRating = searchParams.get("minRating");
      const search = searchParams.get("search");
      const sortBy = searchParams.get("sortBy");
      const page = searchParams.get("page");

      if (category) query.category = category as ListingSearchQuery["category"];
      if (minPrice) query.minPrice = parseFloat(minPrice);
      if (maxPrice) query.maxPrice = parseFloat(maxPrice);
      if (minRating) query.minRating = parseFloat(minRating);
      if (search) query.search = search;
      if (sortBy) query.sortBy = sortBy as ListingSearchQuery["sortBy"];
      if (page) query.page = parseInt(page, 10);

      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, String(v));
      });

      const res = await api.get<Listing[]>(`/api/v1/listings?${params.toString()}`);
      setListings(res.data);
      setMeta(res.meta ?? null);
    } catch {
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const currentPage = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Services</h1>
        <p className="mt-1 text-sm text-gray-500">
          Find human services for your AI workflows
        </p>
      </div>

      <ListingFilters />
      <ListingGrid listings={listings} isLoading={isLoading} />

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(currentPage - 1));
              window.location.search = params.toString();
            }}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", String(currentPage + 1));
              window.location.search = params.toString();
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense>
      <ListingsContent />
    </Suspense>
  );
}
