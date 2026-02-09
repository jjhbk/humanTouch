"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface DisputeFormProps {
  orderId: string;
  onDisputeCreated?: () => void;
}

const DISPUTE_REASONS = [
  { value: "quality", label: "Quality Issues" },
  { value: "incomplete", label: "Incomplete Work" },
  { value: "deadline", label: "Missed Deadline" },
  { value: "communication", label: "Communication Issues" },
  { value: "payment", label: "Payment Issue" },
  { value: "other", label: "Other" },
];

export function DisputeForm({ orderId, onDisputeCreated }: DisputeFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!reason) {
      toast("Please select a reason", "error");
      return;
    }

    if (description.length < 10) {
      toast("Description must be at least 10 characters", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/disputes", {
        orderId,
        reason,
        description,
      });

      console.log("Dispute created:", res.data);
      toast("Dispute submitted successfully", "success");
      setIsOpen(false);
      setReason("");
      setDescription("");

      // Call the callback to refresh parent component
      if (onDisputeCreated) {
        await onDisputeCreated();
      }
    } catch (error: any) {
      console.error("Failed to submit dispute:", error);
      const errorMessage = error.response?.data?.error?.message || "Failed to submit dispute";
      toast(errorMessage, "error");
      console.error("Full error:", error.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50"
      >
        Open Dispute
      </Button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Open a Dispute</DialogTitle>
            <DialogDescription>
              If you're not satisfied with this order, you can open a dispute. Our team
              will review and help resolve the issue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Reason for Dispute
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select a reason...</option>
              {DISPUTE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Textarea
              label="Description"
              placeholder="Please provide detailed information about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum 10 characters. Be specific about the problem.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Dispute"}
            </Button>
          </div>
        </div>
        </div>
      </Dialog>
    </>
  );
}
