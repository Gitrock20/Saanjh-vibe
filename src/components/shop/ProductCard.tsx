import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/products";
import { cart, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { wishlist } = useCart();
  const wished = wishlist.includes(product.id);

  return (
    <div className="group relative">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block overflow-hidden rounded-md bg-muted aspect-[3/4] relative"
      >
        <img
          src={product.image}
          alt={product.name}
          width={900}
          height={1100}
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
        {product.badge && (
          <span className="absolute left-3 top-3 bg-background/85 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-medium">
            {product.badge}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            cart.toggleWish(product.id);
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 backdrop-blur hover:bg-background transition"
          aria-label="Wishlist"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-foreground")} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            cart.add({
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.image,
            });
          }}
          className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all bg-foreground text-background py-3 text-[11px] uppercase tracking-[0.22em]"
        >
          Quick add
        </button>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="font-serif text-lg leading-tight hover:text-gold transition"
          >
            {product.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">{product.tagline}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-medium">{formatINR(product.price)}</div>
          {product.compareAt && (
            <div className="text-xs text-muted-foreground line-through">{formatINR(product.compareAt)}</div>
          )}
        </div>
      </div>

    </div>
  );
}
