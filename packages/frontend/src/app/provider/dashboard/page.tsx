"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order, Quote } from "@humanlayer/shared";
import { ORDER_STATUS_LABELS } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, getOrderStatusVariant, getQuoteStatusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate } from "@/lib/utils";

interface DashboardStats {
  profile: {
    businessName: string;
    averageRating: number | null;
    totalReviews: number;
    verificationStatus: string;
    stakeAmount: string;
  };
  stats: {
    totalListings: number;
    activeListings: number;
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    totalRevenue: string;
    pendingQuotes: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    amount: string;
    listingTitle: string;
    buyerName: string;
    createdAt: Date;
  }>;
}

export default function ProviderDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingQuotes, setPendingQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  async function fetchDashboard() {
    setIsLoading(true);
    try {
      const [dashboardRes, quotesRes] = await Promise.all([
        api.get<DashboardStats>("/provider/dashboard"),
        api.get<Quote[]>("/quotes?status=PENDING"),
      ]);

      const dashboardData = dashboardRes.data;
      setStats(dashboardData);
      setRecentOrders(dashboardData.recentOrders as any);
      setPendingQuotes(quotesRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
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
              {stats?.stats.totalListings ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Active Orders</p>
            <p className="mt-1 text-2xl font-bold">
              {stats?.stats.activeOrders ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-bold">
              {formatPrice(stats?.stats.totalRevenue ?? "0")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Average Rating</p>
            <p className="mt-1 text-2xl font-bold">
              {stats?.profile.averageRating?.toFixed(1) ?? "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/provider/listings/new">
          <Button>Create New Listing</Button>
        </Link>
        <Link href="/provider/quotes">
          <Button variant="outline">View All Quotes</Button>
        </Link>
      </div>

      {pendingQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Quote Requests</CardTitle>
              <Link href="/provider/quotes?status=PENDING">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingQuotes.slice(0, 3).map((quote) => {
                const quoteWithRelations = quote as any;
                return (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div>
                      {quoteWithRelations.listing && (
                        <h4 className="font-semibold text-gray-900">
                          {quoteWithRelations.listing.title}
                        </h4>
                      )}
                      {quoteWithRelations.requester && (
                        <p className="text-sm text-gray-600">
                          From: {quoteWithRelations.requester.name || quoteWithRelations.requester.email}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDate(quote.createdAt)}
                      </p>
                    </div>
                    <Link href={`/provider/quotes/${quote.id}`}>
                      <Button size="sm">Respond</Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentOrders || recentOrders.length === 0 ? (
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
                  {recentOrders? (recentOrders.map((order) => (
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
                  ))):<div></div>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
