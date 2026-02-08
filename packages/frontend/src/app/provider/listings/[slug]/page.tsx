"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { Listing } from "@humanlayer/shared";
import {
  LISTING_CATEGORIES,
  CATEGORY_LABELS,
  PRICING_MODELS,
  PRICING_MODEL_LABELS,
} from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface EditListingForm {
  title: string;
  description: string;
  category: string;
  pricingModel: string;
  basePrice: string;
  specifications: string;
  tags: string;
  availableSlots: string;
  isActive: boolean;
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const listingSlug = params.slug as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm<EditListingForm>();

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await api.get<Listing>(`/api/v1/listings/${listingSlug}`);
        const listing = res.data;
        reset({
          title: listing.title,
          description: listing.description,
          category: listing.category,
          pricingModel: listing.pricingModel,
          basePrice: listing.basePrice,
          specifications: JSON.stringify(listing.specifications, null, 2),
          tags: listing.tags.join(", "),
          availableSlots: String(listing.availableSlots),
          isActive: listing.isActive,
        });
      } catch {
        toast("Failed to load listing", "error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchListing();
  }, [listingSlug, reset, toast]);

  const categoryOptions = LISTING_CATEGORIES.map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c] ?? c,
  }));

  const pricingOptions = PRICING_MODELS.map((p) => ({
    value: p,
    label: PRICING_MODEL_LABELS[p] ?? p,
  }));

  const onSubmit = async (data: EditListingForm) => {
    setIsSubmitting(true);
    try {
      let specifications: Record<string, unknown> = {};
      if (data.specifications.trim()) {
        try {
          specifications = JSON.parse(data.specifications);
        } catch {
          specifications = Object.fromEntries(
            data.specifications
              .split("\n")
              .filter(Boolean)
              .map((line) => {
                const [key, ...rest] = line.split("=");
                return [key.trim(), rest.join("=").trim()];
              }),
          );
        }
      }

      await api.patch(`/api/v1/listings/${listingSlug}`, {
        title: data.title,
        description: data.description,
        category: data.category,
        pricingModel: data.pricingModel,
        basePrice: data.basePrice,
        specifications,
        tags: data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        availableSlots: parseInt(data.availableSlots, 10),
        isActive: data.isActive,
      });
      toast("Listing updated!", "success");
      router.push("/provider/dashboard");
    } catch {
      toast("Failed to update listing", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Listing</h1>

      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="title"
              label="Title"
              {...register("title", { required: true })}
            />
            <Textarea
              id="description"
              label="Description"
              {...register("description", { required: true })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                id="category"
                label="Category"
                options={categoryOptions}
                {...register("category")}
              />
              <Select
                id="pricingModel"
                label="Pricing Model"
                options={pricingOptions}
                {...register("pricingModel")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="basePrice"
                label="Base Price (USDC)"
                type="number"
                step="0.01"
                {...register("basePrice", { required: true })}
              />
              <Input
                id="availableSlots"
                label="Available Slots"
                type="number"
                {...register("availableSlots")}
              />
            </div>
            <Textarea
              id="specifications"
              label="Specifications (JSON)"
              {...register("specifications")}
            />
            <Input
              id="tags"
              label="Tags (comma-separated)"
              {...register("tags")}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Listing is active
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
