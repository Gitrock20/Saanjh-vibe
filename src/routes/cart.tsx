import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, X, ArrowRight, ShoppingBag } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { cart, useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { items } = useCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal === 0 ? 0 : subtotal > 999 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 lg:px-10 py-12 lg:py-20">
        <h1 className="font-serif text-4xl md:text-5xl">Your bag</h1>
        <p className="text-muted-foreground mt-2">{items.length} {items.length === 1 ? "item" : "items"}</p>

        {items.length === 0 ? (
          <div className="mt-20 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <p className="font-serif text-2xl">Your bag is empty.</p>
            <p className="text-muted-foreground mt-2">A quiet moment is just a candle away.</p>
            <Link to="/shop" className="mt-6 inline-block bg-foreground text-background px-7 py-4 text-xs uppercase tracking-[0.24em]">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-10">
            <ul className="divide-y divide-border border-y border-border">
              {items.map((i) => (
                <li key={i.id + (i.variant ?? "")} className="py-6 flex gap-5">
                  <Link to="/product/$slug" params={{ slug: i.slug }} className="shrink-0 h-32 w-24 sm:h-36 sm:w-28 bg-muted overflow-hidden rounded">
                    <img src={i.image} alt={i.name} className="h-full w-full object-cover" loading="lazy" />
                  </Link>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-3">
                      <div>
                        <Link to="/product/$slug" params={{ slug: i.slug }} className="font-serif text-lg hover:text-gold">
                          {i.name}
                        </Link>
                        {i.variant && <div className="text-xs text-muted-foreground mt-0.5">{i.variant}</div>}
                      </div>
                      <button onClick={() => cart.remove(i.id, i.variant)} aria-label="Remove" className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="inline-flex items-center border border-border rounded-full">
                        <button onClick={() => cart.setQty(i.id, i.qty - 1, i.variant)} className="p-2.5" aria-label="Decrease">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{i.qty}</span>
                        <button onClick={() => cart.setQty(i.id, i.qty + 1, i.variant)} className="p-2.5" aria-label="Increase">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-medium">{formatINR(i.price * i.qty)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="lg:sticky lg:top-28 self-start">
              <div className="bg-secondary/50 border border-border rounded-lg p-6">
                <h2 className="font-serif text-2xl mb-5">Order summary</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
                  <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd></div>
                  <div className="flex justify-between"><dt>GST</dt><dd className="text-muted-foreground">Included</dd></div>
                  <div className="border-t border-border pt-3 flex justify-between font-serif text-lg">
                    <dt>Total</dt><dd>{formatINR(total)}</dd>
                  </div>
                </dl>
                <Link
                  to="/checkout"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 transition"
                >
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-[11px] text-muted-foreground text-center">
                  Secure checkout · Razorpay · UPI · COD
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
