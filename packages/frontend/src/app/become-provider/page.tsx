"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/hooks/use-auth";
import { api } from "@/lib/api";

const becomeProviderSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(200),
  description: z.string().max(2000).optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type BecomeProviderForm = z.infer<typeof becomeProviderSchema>;

export default function BecomeProviderPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BecomeProviderForm>({
    resolver: zodResolver(becomeProviderSchema),
  });

  const onSubmit = async (data: BecomeProviderForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post("/auth/become-provider", data);
      await refreshUser(); // Refresh user data to get updated role
      router.push("/provider/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to become a provider");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>You must be signed in to become a provider</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role === "PROVIDER") {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Already a Provider</CardTitle>
            <CardDescription>You&apos;re already registered as a provider</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/provider/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Become a Service Provider</CardTitle>
          <CardDescription>
            Start offering your services on HumanLayer. Fill out your profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="businessName"
                {...register("businessName")}
                placeholder="Your Business or Professional Name"
              />
              {errors.businessName && (
                <p className="text-sm text-red-600 mt-1">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your services, experience, and what makes you unique..."
                rows={5}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                This will be shown to buyers considering your services
              </p>
            </div>

            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <Input
                id="websiteUrl"
                {...register("websiteUrl")}
                placeholder="https://yourwebsite.com"
                type="url"
              />
              {errors.websiteUrl && (
                <p className="text-sm text-red-600 mt-1">{errors.websiteUrl.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Profile..." : "Become a Provider"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">What happens next?</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ Create service listings for buyers to discover</li>
          <li>✓ Receive and respond to quote requests</li>
          <li>✓ Fulfill orders and receive payments via USDC escrow</li>
          <li>✓ Build your reputation with ratings and reviews</li>
        </ul>
      </div>
    </div>
  );
}
