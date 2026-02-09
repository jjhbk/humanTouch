"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { SpecificationForm } from "@/components/listings/specification-form";

interface QuoteRequestFormProps {
  listingId: string;
  listingCategory: string;
  listingSpecifications?: Record<string, any>;
  open: boolean;
  onClose: () => void;
}

interface FormData {
  message: string;
}

export function QuoteRequestForm({
  listingId,
  listingCategory,
  listingSpecifications = {},
  open,
  onClose,
}: QuoteRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requirements, setRequirements] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await api.post("/quotes", {
        listingId,
        requirements,
        message: data.message || null,
      });
      toast("Quote request sent!", "success");
      reset();
      setRequirements({});
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {listingSpecifications && Object.keys(listingSpecifications).length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Provider's Service Details</h4>
            <div className="space-y-1">
              {Object.entries(listingSpecifications).map(([key, value]) => (
                <div key={key} className="text-xs text-blue-800">
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{" "}
                  <span>{Array.isArray(value) ? value.join(", ") : String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Requirements</h4>
          <p className="text-xs text-gray-600 mb-4">
            Fill in the details below to specify what you need for your project.
          </p>
          <SpecificationForm
            category={listingCategory}
            value={requirements}
            onChange={setRequirements}
          />
        </div>

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
