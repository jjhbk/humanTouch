"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface QuoteRequestFormProps {
  listingId: string;
  open: boolean;
  onClose: () => void;
}

interface FormData {
  requirements: string;
  message: string;
}

export function QuoteRequestForm({
  listingId,
  open,
  onClose,
}: QuoteRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/quotes", {
        listingId,
        requirements: { description: data.requirements },
        message: data.message || null,
      });
      toast("Quote request sent!", "success");
      reset();
      onClose();
    } catch {
      toast("Failed to send quote request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Request a Quote</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textarea
          label="Requirements"
          placeholder="Describe what you need..."
          {...register("requirements", { required: true })}
        />
        <Input
          label="Additional Message (optional)"
          placeholder="Any special instructions or questions..."
          {...register("message")}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Request"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
