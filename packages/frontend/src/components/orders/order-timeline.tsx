"use client";

import type { OrderStatusLog, OrderStatus } from "@humanlayer/shared";
import { ORDER_STATUS_LABELS } from "@humanlayer/shared";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

interface OrderTimelineProps {
  statusLogs: OrderStatusLog[];
  currentStatus: OrderStatus;
}

const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "DELIVERED",
  "COMPLETED",
];

export function OrderTimeline({
  statusLogs,
  currentStatus,
}: OrderTimelineProps) {
  const reachedStatuses = new Set(statusLogs.map((l) => l.toStatus));
  reachedStatuses.add(currentStatus);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Order Timeline</h3>
      <div className="relative">
        {STATUS_ORDER.map((status, i) => {
          const log = statusLogs.find((l) => l.toStatus === status);
          const isReached = reachedStatuses.has(status);
          const isCurrent = status === currentStatus;

          return (
            <div key={status} className="flex gap-3 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                    isCurrent
                      ? "bg-primary-600 text-white"
                      : isReached
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-400",
                  )}
                >
                  {i + 1}
                </div>
                {i < STATUS_ORDER.length - 1 && (
                  <div
                    className={cn(
                      "h-full w-0.5",
                      isReached ? "bg-green-300" : "bg-gray-200",
                    )}
                  />
                )}
              </div>
              <div className="pt-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-primary-700" : "text-gray-700",
                  )}
                >
                  {ORDER_STATUS_LABELS[status]}
                </p>
                {log && (
                  <p className="text-xs text-gray-400">
                    {formatDateTime(log.createdAt)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
