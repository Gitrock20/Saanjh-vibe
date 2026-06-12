import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/shop/ProductCard";
import { candleCategories, jewelleryCategories, formatINR } from "@/lib/products";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { getDbProducts } from "@/lib/api/products.functions";

type Search = {
  category?: "candles" | "jewellery";
  filter?: "new" | "sale";
  sort?: "featured" | "price-asc" | "price-desc" | "rating";
  q?: string;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: s.category === "candles" || s.category === "jewellery" ? s.category : undefined,
    filter: s.filter === "new" || s.filter === "sale" ? s.filter : undefined,
    sort: (s.sort as Search["sort"]) ?? "featured",
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  loader: async () => {
    const products = await getDbProducts();
    return { products };
  },
  component: Shop,
});

function Shop() {
  const { products } = Route.useLoaderData();
  const { category, filter, sort, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [price, setPrice] = useState<number[]>([0, 4000]);
  const [sub, setSub] = useState<string | null>(null);

  useEffect(() => {
    // Reset subcategory filter when category changes
    setSub(null);
  }, [category]);

  const list = useMemo(() => {
    let r = products.slice();
    if (category) r = r.filter((p) => p.category === category);
    if (sub) r = r.filter((p) => p.subCategory === sub);
    if (filter === "new") r = r.filter((p) => p.badge === "New");
    if (filter === "sale") r = r.filter((p) => p.compareAt);
    if (q) {
      const query = q.toLowerCase().trim();
      r = r.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(query))
      );
    }
    r = r.filter((p) => p.price >= price[0] && p.price <= price[1]);
    if (sort === "price-asc") r.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") r.sort((a, b) => b.price - a.price);
    if (sort === "rating") r.sort((a, b) => b.rating - a.rating);
    return r;
  }, [category, filter, sort, sub, price, q]);

  const subs = category === "jewellery" ? jewelleryCategories : category === "candles" ? candleCategories : [];

  return (
    <SiteShell>
      {/* Page header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 lg:px-10 py-14 lg:py-20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            {q ? `Search results for "${q}"` : category ? `Shop ${category}` : "Shop all"}
          </p>
          <h1 className="font-serif text-5xl md:text-6xl mt-3">
            {q ? `Search: ${q}` : category === "candles" ? "Candle collection" : category === "jewellery" ? "Jewellery collection" : "Everything Saanjh"}
          </h1>
          <div className="mt-6 flex flex-wrap gap-2">
            <FilterChip active={!category && !q} onClick={() => navigate({ search: { sort } })}>All</FilterChip>
            <FilterChip active={category === "candles"} onClick={() => navigate({ search: { category: "candles", sort } })}>Candles</FilterChip>
            <FilterChip active={category === "jewellery"} onClick={() => navigate({ search: { category: "jewellery", sort } })}>Jewellery</FilterChip>
            <FilterChip active={filter === "new"} onClick={() => navigate({ search: { category, filter: "new", sort } })}>New In</FilterChip>
            <FilterChip active={filter === "sale"} onClick={() => navigate({ search: { category, filter: "sale", sort } })}>Sale</FilterChip>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 lg:px-10 py-12 grid lg:grid-cols-[260px_1fr] gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block sticky top-28 self-start">
          <h3 className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] mb-4">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Refine
          </h3>
          {subs.length > 0 && (
            <div className="border-t border-border py-5">
              <h4 className="font-serif text-base mb-3">Category</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => setSub(null)} className={`text-left ${!sub ? "text-foreground" : "text-muted-foreground"} hover:text-foreground`}>
                    All
                  </button>
                </li>
                {subs.map((s) => (
                  <li key={s}>
                    <button onClick={() => setSub(s)} className={`text-left ${sub === s ? "text-foreground" : "text-muted-foreground"} hover:text-foreground`}>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="border-t border-border py-5">
            <h4 className="font-serif text-base mb-4">Price</h4>
            <Slider value={price} onValueChange={setPrice} min={0} max={4000} step={100} />
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>{formatINR(price[0])}</span>
              <span>{formatINR(price[1])}</span>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-border mb-8">
            <span className="text-sm text-muted-foreground">{list.length} products</span>
            <label className="relative inline-flex items-center gap-2 text-sm">
              Sort:
              <select
                value={sort}
                onChange={(e) => navigate({ search: { category, filter, sort: e.target.value as any } })}
                className="appearance-none bg-transparent border-b border-border pl-1 pr-6 py-1.5 focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
              <ChevronDown className="h-3 w-3 -ml-5 pointer-events-none" />
            </label>
          </div>

          {list.length === 0 ? (
            <div className="py-32 text-center text-muted-foreground">
              <p>No products match these filters.</p>
              <Link to="/shop" className="mt-4 inline-block text-xs uppercase tracking-widest border-b border-foreground/40">Reset</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-12">
              {list.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}

function FilterChip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs uppercase tracking-[0.18em] border rounded-full transition ${
        active ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}
