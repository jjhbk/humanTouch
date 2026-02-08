"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order } from "@humanlayer/shared";
import { ORDER_STATUS_LABELS } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, getOrderStatusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate } from "@/lib/utils";

interface DashboardStats {
  totalListings: number;
  activeOrders: number;
  totalRevenue: string;
  averageRating: number | null;
}

export default function ProviderDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setIsLoading(true);
      try {
        const statsRes = await api.get<DashboardStats>(
          "/api/v1/provider/dashboard",
        );
        setStats(statsRes.data);
        const ordersRes = await api.get<Order[]>(
          "/api/v1/provider/orders?limit=5",
        );
        setRecentOrders(ordersRes.data);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Provider Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your provider activity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total Listings</p>
            <p className="mt-1 text-2xl font-bold">
              {stats?.totalListings ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Active Orders</p>
            <p className="mt-1 text-2xl font-bold">
              {stats?.activeOrders ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold">
              {formatPrice(stats?.totalRevenue ?? "0")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Average Rating</p>
            <p className="mt-1 text-2xl font-bold">
              {stats?.averageRating?.toFixed(1) ?? "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/provider/listings/new">
          <Button>Create New Listing</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No orders yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Order</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/provider/orders/${order.id}`}
                          className="text-primary-600 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={getOrderStatusVariant(order.status)}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {formatPrice(order.amount)}
                      </td>
                      <td className="py-3">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
