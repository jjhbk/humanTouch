"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface QuoteResponseFormProps {
  quoteId: string;
  onSuccess?: () => void;
}

interface FormData {
  quotedPrice: string;
  estimatedDays: string;
  providerNotes: string;
}

export function QuoteResponseForm({
  quoteId,
  onSuccess,
}: QuoteResponseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await api.post(`/quotes/${quoteId}/respond`, {
        quotedPrice: data.quotedPrice,
        estimatedDays: parseInt(data.estimatedDays, 10),
        providerNotes: data.providerNotes || null,
      });
      toast("Quote response sent!", "success");
      onSuccess?.();
    } catch {
      toast("Failed to send response", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Quoted Price (USDC)"
        type="number"
        step="0.01"
        placeholder="100.00"
        {...register("quotedPrice", { required: true })}
      />
      <Input
        label="Estimated Days"
        type="number"
        placeholder="5"
        {...register("estimatedDays", { required: true })}
      />
      <Textarea
        label="Notes for Buyer"
        placeholder="Additional details about your quote..."
        {...register("providerNotes")}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Response"}
      </Button>
    </form>
  );
}
