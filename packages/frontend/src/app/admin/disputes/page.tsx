"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import type { Dispute } from "@humanlayer/shared";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Rejected", value: "REJECTED" },
];

const DISPUTE_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "error"
> = {
  OPEN: "error",
  UNDER_REVIEW: "warning",
  RESOLVED: "success",
  REJECTED: "secondary",
};

interface DisputeWithOrder extends Dispute {
  order: {
    orderNumber: string;
    buyer: { name: string | null; email: string };
    provider: { name: string | null; email: string };
  };
  raiser: { name: string | null; email: string };
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<DisputeWithOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDisputes() {
      setIsLoading(true);
      setError("");
      try {
        const query = activeTab ? `?status=${activeTab}` : "";
        const res = await api.get<DisputeWithOrder[]>(`/disputes${query}`);
        setDisputes(res.data);
      } catch (error: any) {
        console.error("Failed to fetch disputes:", error);
        if (error.response?.status === 403) {
          setError("You don't have permission to view disputes. Admin access required.");
        } else {
          setError("Failed to fetch disputes");
        }
        setDisputes([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDisputes();
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dispute Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and resolve order disputes
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.value
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500">No disputes found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card
              key={dispute.id}
              className="hover:shadow-md transition-shadow border-l-4"
              style={{
                borderLeftColor:
                  dispute.status === "OPEN"
                    ? "#ef4444"
                    : dispute.status === "UNDER_REVIEW"
                      ? "#f59e0b"
                      : "#10b981",
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/admin/disputes/${dispute.id}`}
                        className="text-lg font-semibold text-primary-600 hover:underline"
                      >
                        Order {dispute.order.orderNumber}
                      </Link>
                      <Badge variant={DISPUTE_STATUS_VARIANTS[dispute.status]}>
                        {dispute.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-900 font-medium mb-1 capitalize">
                      Reason: {dispute.reason.replace(/_/g, " ")}
                    </p>
                  </div>
                  {dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW" ? (
                    <Link href={`/admin/disputes/${dispute.id}`}>
                      <Button size="sm">Resolve</Button>
                    </Link>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="font-medium">Buyer:</span>{" "}
                    {dispute.order.buyer.name || dispute.order.buyer.email}
                  </div>
                  <div>
                    <span className="font-medium">Provider:</span>{" "}
                    {dispute.order.provider.name || dispute.order.provider.email}
                  </div>
                  <div>
                    <span className="font-medium">Raised by:</span>{" "}
                    {dispute.raiser.name || dispute.raiser.email}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {formatDate(dispute.createdAt)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {dispute.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
