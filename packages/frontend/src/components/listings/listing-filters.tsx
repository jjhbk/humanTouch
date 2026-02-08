"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { LISTING_CATEGORIES, CATEGORY_LABELS } from "@humanlayer/shared";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      router.push(`/listings?${params.toString()}`);
    },
    [router, searchParams],
  );

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...LISTING_CATEGORIES.map((c) => ({
      value: c,
      label: CATEGORY_LABELS[c] ?? c,
    })),
  ];

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
  ];

  const ratingOptions = [
    { value: "", label: "Any Rating" },
    { value: "4", label: "4+ Stars" },
    { value: "3", label: "3+ Stars" },
    { value: "2", label: "2+ Stars" },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="min-w-[200px] flex-1">
        <Input
          placeholder="Search listings..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value)}
        />
      </div>
      <div className="w-48">
        <Select
          options={categoryOptions}
          value={searchParams.get("category") ?? ""}
          onChange={(e) => updateParam("category", e.target.value)}
        />
      </div>
      <div className="w-36">
        <Input
          type="number"
          placeholder="Min Price"
          defaultValue={searchParams.get("minPrice") ?? ""}
          onChange={(e) => updateParam("minPrice", e.target.value)}
        />
      </div>
      <div className="w-36">
        <Input
          type="number"
          placeholder="Max Price"
          defaultValue={searchParams.get("maxPrice") ?? ""}
          onChange={(e) => updateParam("maxPrice", e.target.value)}
        />
      </div>
      <div className="w-36">
        <Select
          options={ratingOptions}
          value={searchParams.get("minRating") ?? ""}
          onChange={(e) => updateParam("minRating", e.target.value)}
        />
      </div>
      <div className="w-44">
        <Select
          options={sortOptions}
          value={searchParams.get("sortBy") ?? "newest"}
          onChange={(e) => updateParam("sortBy", e.target.value)}
        />
      </div>
    </div>
  );
}
