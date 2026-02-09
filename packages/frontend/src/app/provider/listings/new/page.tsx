"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { useToast } from "@/components/ui/toast";
import { SpecificationForm } from "@/components/listings/specification-form";

interface ListingForm {
  title: string;
  description: string;
  category: string;
  pricingModel: string;
  basePrice: string;
  tags: string;
  availableSlots: string;
}

export default function NewListingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specifications, setSpecifications] = useState<Record<string, any>>({});
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ListingForm>({
    defaultValues: {
      category: "OTHER",
      pricingModel: "FIXED",
      availableSlots: "10",
    },
  });

  const selectedCategory = watch("category");

  const categoryOptions = LISTING_CATEGORIES.map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c] ?? c,
  }));

  const pricingOptions = PRICING_MODELS.map((p) => ({
    value: p,
    label: PRICING_MODEL_LABELS[p] ?? p,
  }));

  const onSubmit = async (data: ListingForm) => {
    setIsSubmitting(true);
    try {
      await api.post("/listings", {
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
      });
      toast("Listing created!", "success");
      router.push("/provider/dashboard");
    } catch {
      toast("Failed to create listing", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Create New Listing
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="title"
              label="Title"
              placeholder="e.g., Professional Blog Writing"
              error={errors.title?.message}
              {...register("title", { required: "Title is required" })}
            />
            <Textarea
              id="description"
              label="Description"
              placeholder="Describe your service..."
              {...register("description", {
                required: "Description is required",
              })}
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
                placeholder="50.00"
                error={errors.basePrice?.message}
                {...register("basePrice", {
                  required: "Price is required",
                })}
              />
              <Input
                id="availableSlots"
                label="Available Slots"
                type="number"
                placeholder="10"
                {...register("availableSlots")}
              />
            </div>
            <SpecificationForm
              category={selectedCategory}
              value={specifications}
              onChange={setSpecifications}
            />
            <Input
              id="tags"
              label="Tags (comma-separated)"
              placeholder="writing, blog, seo"
              {...register("tags")}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Listing"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
