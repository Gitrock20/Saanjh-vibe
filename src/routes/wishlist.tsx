import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCart } from "@/lib/cart-store";
import { Heart } from "lucide-react";
import { getDbProducts } from "@/lib/api/products.functions";

export const Route = createFileRoute("/wishlist")({
  loader: async () => {
    const products = await getDbProducts();
    return { products };
  },
  component: Wishlist,
});

function Wishlist() {
  const { products } = Route.useLoaderData();
  const { wishlist } = useCart();
  const items = products.filter((p) => wishlist.includes(p.id));
  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-5 lg:px-10 py-12 lg:py-20">
        <h1 className="font-serif text-4xl md:text-5xl">Wishlist</h1>
        <p className="text-muted-foreground mt-2">Saved for slow moments.</p>

        {items.length === 0 ? (
          <div className="mt-20 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <p className="font-serif text-2xl">Nothing saved yet.</p>
            <Link to="/shop" className="mt-6 inline-block bg-foreground text-background px-7 py-4 text-xs uppercase tracking-[0.24em]">
              Browse the edit
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
            {items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
