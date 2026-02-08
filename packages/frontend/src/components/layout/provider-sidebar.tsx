"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/provider/dashboard", label: "Dashboard" },
  { href: "/provider/listings/new", label: "New Listing" },
  { href: "/provider/settings", label: "Settings" },
];

export function ProviderSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50">
      <nav className="flex flex-col gap-1 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Provider
        </p>
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200",
              pathname === link.href && "bg-primary-50 text-primary-700",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
