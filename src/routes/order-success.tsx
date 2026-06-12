import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { Check, ShoppingBag, Home } from "lucide-react";
import { formatINR } from "@/lib/products";
import { z } from "zod";

const orderSuccessSearchSchema = z.object({
  orderId: z.string().optional(),
  amount: z.coerce.number().optional(),
  paymentMethod: z.string().optional(),
});

export const Route = createFileRoute("/order-success")({
  validateSearch: (search) => orderSuccessSearchSchema.parse(search),
  component: OrderSuccess,
});

function OrderSuccess() {
  const { orderId, amount, paymentMethod } = Route.useSearch();

  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-5 py-16 lg:py-24 flex flex-col items-center text-center fade-up">
        {/* Animated Checkmark Badge */}
        <div className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-900/50">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20"></span>
          <Check className="h-10 w-10 stroke-[2.5]" />
        </div>

        <h1 className="font-serif text-3xl md:text-5xl tracking-wide text-foreground mb-4">
          Thank you for shopping!
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-md mb-10 leading-relaxed">
          Your order has been successfully placed and is being processed. A confirmation email will be sent to you shortly.
        </p>

        {/* Order Info Summary */}
        <div className="w-full bg-card border border-border rounded-lg p-6 mb-10 text-left divide-y divide-border/60 shadow-soft">
          <h2 className="font-serif text-xl pb-4 text-foreground tracking-wide flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gold shrink-0" /> Order Summary
          </h2>
          <div className="pt-4 space-y-3.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
                Placed & Confirmed
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium text-foreground capitalize">
                {paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "razorpay" ? "Razorpay Online" : paymentMethod || "Razorpay"}
              </span>
            </div>

            {orderId && (
              <div className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground">Order Reference</span>
                <span className="font-mono text-xs text-foreground bg-secondary/50 px-2 py-1 rounded truncate select-all" title={orderId}>
                  {orderId}
                </span>
              </div>
            )}

            {amount !== undefined && (
              <div className="flex justify-between items-baseline pt-4 border-t border-border/50">
                <span className="text-muted-foreground font-medium">Total Paid</span>
                <span className="font-serif font-semibold text-xl text-gold">
                  {formatINR(amount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 transition text-center font-medium shadow-sm hover:scale-[1.01]"
          >
            <Home className="h-3.5 w-3.5" /> Back to Home Page
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 border border-border bg-transparent text-foreground px-8 py-4 text-xs uppercase tracking-[0.24em] hover:border-foreground hover:bg-secondary/20 transition text-center font-medium hover:scale-[1.01]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
