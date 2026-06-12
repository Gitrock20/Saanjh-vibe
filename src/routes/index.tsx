import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Gift } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/shop/ProductCard";
import { products } from "@/lib/products";
import hero from "@/assets/hero.jpg";
import catCandles from "@/assets/cat-candles.jpg";
import catJewellery from "@/assets/cat-jewellery.jpg";
import { getDbProducts } from "@/lib/api/products.functions";
import { subscribeToNewsletter } from "@/lib/api/newsletter.functions";
import { toast } from "sonner";
import { TransparentLogo } from "@/components/layout/TransparentLogo";

export const Route = createFileRoute("/")({
  loader: async () => {
    const products = await getDbProducts();
    return { products };
  },
  component: Home,
});

function Home() {
  const { products } = Route.useLoaderData();
  const candles = products.filter((p) => p.category === "candles");
  const jewellery = products.filter((p) => p.category === "jewellery");
  const trending = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 4);

  return (
    <SiteShell>
      <Hero />
      <Marquee />
      <Categories />
      <Featured title="Candle Collection" subtitle="Hand-poured, slow burning" items={candles} />
      <Featured title="Jewellery Collection" subtitle="Made to be layered" items={jewellery} />
      <Trending items={trending} />
      <Trust />
      <Gallery />
      <Newsletter />
    </SiteShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid lg:grid-cols-12 gap-0 min-h-[88vh] lg:min-h-[640px]">
        <div className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 lg:py-0 order-2 lg:order-1">
          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground fade-up">
            <Sparkles className="h-3 w-3" /> Festival Edit 2026
          </span>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight mt-6 text-balance fade-up">
            Quiet luxury,
            <br />
            <em className="text-gold-gradient not-italic">softly lit.</em>
          </h1>
          <p className="mt-7 max-w-md text-base lg:text-lg leading-relaxed text-muted-foreground fade-up">
            Hand-poured candles and gold-plated jewellery crafted in small batches — for women who notice the details.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4 fade-up">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 transition"
            >
              Shop the edit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6 relative order-1 lg:order-2 min-h-[420px] lg:min-h-0">
          <img
            src={hero}
            alt="Cream pillar candle with delicate gold jewellery"
            width={1600}
            height={1100}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-background/30 via-transparent to-transparent lg:bg-gradient-to-r lg:from-background lg:via-background/20 lg:to-transparent" />
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Free shipping over ₹999", "COD available", "Razorpay secure checkout", "Made in India", "Cruelty free", "Recyclable packaging"];
  return (
    <div className="border-y border-border bg-background overflow-hidden py-3">
      <div className="flex w-max animate-marquee gap-12 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-12">
            {t} <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Categories() {
  const cats = [
    { title: "Candles", subtitle: "Soy · Scented · Aromatherapy", to: "/shop", search: { category: "candles" }, img: catCandles },
    { title: "Jewellery", subtitle: "Gold-plated · Pearl · Pavé", to: "/shop", search: { category: "jewellery" }, img: catJewellery },
  ];
  return (
    <section className="mx-auto max-w-5xl px-5 lg:px-10 py-12">
      <div className="grid gap-5 md:grid-cols-2">
        {cats.map((c) => (
          <Link
            key={c.title}
            to={c.to as any}
            search={c.search as any}
            className="group relative aspect-[4/3] md:aspect-[3/2] overflow-hidden rounded-md bg-muted"
          >
            <img
              src={c.img}
              alt={c.title}
              width={1200}
              height={1400}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
              <p className="text-[11px] uppercase tracking-[0.28em] opacity-80">{c.subtitle}</p>
              <h3 className="font-serif text-3xl md:text-4xl mt-2">{c.title}</h3>
              <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] opacity-90 group-hover:opacity-100 group-hover:gap-3 transition-all">
                Explore <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Featured({ title, subtitle, items }: { title: string; subtitle: string; items: typeof products }) {
  return (
    <section className="mx-auto max-w-7xl px-5 lg:px-10 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{subtitle}</p>
          <h2 className="font-serif text-4xl md:text-5xl mt-2">{title}</h2>
        </div>
        <Link to="/shop" className="hidden sm:inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] border-b border-foreground/40 hover:border-foreground pb-1">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function Trending({ items }: { items: typeof products }) {
  return (
    <section className="mx-auto max-w-7xl px-5 lg:px-10 py-24">
      <div className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">This week</p>
        <h2 className="font-serif text-4xl md:text-5xl mt-2">Trending now</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-12">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    { Icon: Truck, t: "Free shipping", s: "On orders over ₹999" },
    { Icon: ShieldCheck, t: "Secure checkout", s: "Razorpay, UPI, COD" },
    { Icon: Gift, t: "Luxury packaging", s: "Ready to gift" },
    { Icon: Sparkles, t: "Made in small batches", s: "Hand-poured" },
  ];
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 lg:px-10 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map(({ Icon, t, s }) => (
          <div key={t} className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background border border-border">
              <Icon className="h-5 w-5 text-gold" />
            </div>
            <div>
              <div className="font-serif text-lg">{t}</div>
              <div className="text-sm text-muted-foreground">{s}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Gallery() {
  const imgs = [catCandles, catJewellery, hero, catJewellery, catCandles, hero];
  return (
    <section className="py-16">
      <div className="text-center px-5 mb-10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">@saanjh.studio</p>
        <h2 className="font-serif text-4xl md:text-5xl mt-2">From our world</h2>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1">
        {imgs.map((src, i) => (
          <a key={i} href="#" className="aspect-square overflow-hidden group">
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          </a>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const toastId = toast.loading("Sending your 10% discount code...");

    try {
      const res = await subscribeToNewsletter({ data: { email } });

      if (res.success) {
        if (res.warning) {
          // If Resend warning is present, show warning toast with longer duration
          toast.info("Subscribed! Checking Resend config...", { id: toastId });
          setTimeout(() => {
            toast.warning(res.warning, { duration: 8000 });
          }, 1000);
        } else {
          toast.success("Subscribed! Your 10% discount code has been sent.", { id: toastId });
        }
        setEmail("");
      } else {
        toast.error(res.error || "Failed to subscribe. Please try again.", { id: toastId });
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast.error("Failed to process your request. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-t border-border w-full py-24 bg-background">
      {/* Background blurred logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-25 origin-center">
        <TransparentLogo sizeClassName="h-[260px] w-[260px] sm:h-[320px] sm:w-[320px]" />
      </div>

      {/* Content container */}
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Join the list</p>
        <h2 className="font-serif text-4xl md:text-5xl mt-3 text-balance">
          First access. Quiet stories. <em className="text-gold-gradient not-italic">10% off</em> your first order.
        </h2>
        <form className="mt-9 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent border-b border-foreground/30 px-1 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-foreground text-background px-7 py-3 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? "Sending..." : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}
