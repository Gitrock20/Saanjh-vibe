import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Truck, RotateCcw, ShieldCheck, Minus, Plus, Tag } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/shop/ProductCard";
import { products, formatINR, type Product } from "@/lib/products";
import { cart, useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { getDbProduct } from "@/lib/api/products.functions";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getDbProduct({ data: params.slug });
    if (!product) throw notFound();
    return { product };
  },
  component: ProductPage,
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.product.name} — Saanjh` },
            { name: "description", content: loaderData.product.description },
          ],
        }
      : {},
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  return (
    <SiteShell>
      <ProductDetails key={product.id} product={product} />
    </SiteShell>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const { wishlist } = useCart();
  const wished = wishlist.includes(product.id);
  const [active, setActive] = useState(product.gallery[0]);
  const [variant, setVariant] = useState(product.variants?.options[0]);
  const [qty, setQty] = useState(1);
  const [coupon, setCoupon] = useState("");
  const similar = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  const handleAdd = () => {
    cart.add(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        variant,
      },
      qty,
    );
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 lg:px-10 pt-8 pb-20">
      <nav className="text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" search={{ category: product.category } as any} className="hover:text-foreground capitalize">{product.category}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
        {/* Gallery */}
        <div className="grid grid-cols-[80px_1fr] gap-4">
          <div className="flex flex-col gap-3">
            {product.gallery.map((src: string) => (
              <button
                key={src}
                onClick={() => setActive(src)}
                className={`aspect-square overflow-hidden rounded border transition ${active === src ? "border-foreground" : "border-border"}`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-lg bg-muted aspect-[4/5] group">
            <img
              src={active}
              alt={product.name}
              width={900}
              height={1100}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        </div>

        {/* Details */}
        <div className="lg:sticky lg:top-28 self-start">
          {product.badge && (
            <span className="inline-block bg-foreground text-background px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] mb-4">
              {product.badge}
            </span>
          )}
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{product.subCategory}</p>
          <h1 className="font-serif text-4xl md:text-5xl mt-2 leading-tight">{product.name}</h1>
          <p className="mt-2 text-muted-foreground">{product.tagline}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-serif text-3xl">{formatINR(product.price)}</span>
            {product.compareAt && (
              <>
                <span className="text-muted-foreground line-through">{formatINR(product.compareAt)}</span>
                <span className="text-xs uppercase tracking-widest text-gold">
                  Save {Math.round(((product.compareAt - product.price) / product.compareAt) * 100)}%
                </span>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Inclusive of all taxes (GST). Free shipping over ₹999.</p>

          {product.variants && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase tracking-[0.22em]">{product.variants.label}</h3>
                <span className="text-xs text-muted-foreground">{variant}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.options.map((o: string) => (
                  <button
                    key={o}
                    onClick={() => setVariant(o)}
                    className={`px-4 py-2.5 text-sm border rounded-full transition ${
                      variant === o ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="inline-flex items-center border border-border rounded-full">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3" aria-label="Decrease">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-3" aria-label="Increase">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">
              {product.stock < 10 ? `Only ${product.stock} left` : "In stock"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
            <button
              onClick={handleAdd}
              className="bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 transition"
            >
              Add to cart · {formatINR(product.price * qty)}
            </button>
            <button
              onClick={() => cart.toggleWish(product.id)}
              className={`flex items-center justify-center w-14 border border-border rounded transition ${wished ? "bg-foreground/5" : "hover:border-foreground"}`}
              aria-label="Wishlist"
            >
              <Heart className={`h-4 w-4 ${wished ? "fill-foreground" : ""}`} />
            </button>
          </div>
          <Link
            to="/checkout"
            onClick={handleAdd}
            className="mt-3 block text-center border border-foreground py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground hover:text-background transition"
          >
            Buy it now
          </Link>

          <div className="mt-6 flex items-center gap-2 border border-dashed border-border rounded p-3">
            <Tag className="h-4 w-4 text-gold" />
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <button
              onClick={() => toast.success("Coupon will be applied at checkout")}
              className="text-xs uppercase tracking-widest"
            >
              Apply
            </button>
          </div>

          <p className="mt-8 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-8 grid grid-cols-3 gap-4 text-xs">
            {[
              { Icon: Truck, t: "Free shipping", s: "Over ₹999" },
              { Icon: RotateCcw, t: "7-day returns", s: "No questions" },
              { Icon: ShieldCheck, t: "Secure checkout", s: "Razorpay" },
            ].map(({ Icon, t, s }) => (
              <div key={t} className="border-t border-border pt-4">
                <Icon className="h-4 w-4 mb-2 text-gold" />
                <div className="font-medium">{t}</div>
                <div className="text-muted-foreground">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-32">
          <h2 className="font-serif text-3xl md:text-4xl mb-10">You may also love</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
            {similar.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
