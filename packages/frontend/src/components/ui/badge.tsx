import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800",
        primary: "bg-primary-100 text-primary-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        destructive: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function getOrderStatusVariant(
  status: string,
): BadgeProps["variant"] {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "IN_PROGRESS":
    case "CONFIRMED":
      return "primary";
    case "PENDING":
      return "warning";
    case "DELIVERED":
      return "info";
    case "DISPUTED":
    case "CANCELLED":
    case "REFUNDED":
      return "destructive";
    default:
      return "default";
  }
}

export function getQuoteStatusVariant(
  status: string,
): BadgeProps["variant"] {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "RESPONDED":
      return "primary";
    case "PENDING":
      return "warning";
    case "REJECTED":
    case "WITHDRAWN":
    case "EXPIRED":
      return "destructive";
    default:
      return "default";
  }
}

export { Badge, badgeVariants };
