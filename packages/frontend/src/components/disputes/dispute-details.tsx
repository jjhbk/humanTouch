"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Dispute } from "@humanlayer/shared";

interface DisputeDetailsProps {
  dispute: Dispute | null;
}

const DISPUTE_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under Review",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

const DISPUTE_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "error"
> = {
  OPEN: "error",
  UNDER_REVIEW: "warning",
  RESOLVED: "success",
  REJECTED: "secondary",
};

export function DisputeDetails({ dispute }: DisputeDetailsProps) {
  if (!dispute) return null;

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dispute Details</CardTitle>
          <Badge variant={DISPUTE_STATUS_VARIANTS[dispute.status]}>
            {DISPUTE_STATUS_LABELS[dispute.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Reason</p>
          <p className="text-sm text-gray-900 capitalize">
            {dispute.reason.replace(/_/g, " ")}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {dispute.description}
          </p>
        </div>

        {dispute.resolution && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-1">Resolution</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {dispute.resolution}
            </p>
            {dispute.resolvedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Resolved on {formatDate(dispute.resolvedAt)}
              </p>
            )}
          </div>
        )}

        <div className="pt-2">
          <p className="text-xs text-gray-500">
            Opened on {formatDate(dispute.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
