import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import {
  Sparkles,
  Leaf,
  FileText,
  Gift,
  ChevronRight,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import catCandles from "@/assets/cat-candles.jpg";
import { formatINR } from "@/lib/products";

type BrandSearch = {
  tab?: "story" | "sustainability" | "gifts";
};

export const Route = createFileRoute("/brand")({
  validateSearch: (search: Record<string, unknown>): BrandSearch => {
    const validTabs = ["story", "sustainability", "gifts"];
    const tab = search.tab as string;
    return {
      tab: validTabs.includes(tab) ? (tab as any) : "story",
    };
  },
  component: BrandPage,
});

function BrandPage() {
  const { tab = "story" } = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleTabChange = (newTab: string) => {
    navigate({ search: { tab: newTab as any } });
  };

  const tabsList = [
    { id: "story", label: "Our Story" },
    { id: "sustainability", label: "Sustainability" },
    { id: "gifts", label: "Gift Cards" },
  ];

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-5 lg:px-10 py-12 lg:py-16">
        <div className="border-b border-border pb-8 mb-10">
          <h1 className="font-serif text-4xl md:text-5xl">The Brand</h1>
          <p className="text-muted-foreground mt-2">Explore the philosophy, craftsmanship, and stories behind Saanjh.</p>
        </div>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden mb-8">
          <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Select Section</label>
          <div className="relative">
            <select
              value={tab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground appearance-none"
            >
              {tabsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground rotate-90" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-12 xl:gap-20">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-28 self-start">
            <h2 className="font-serif text-xl mb-6 tracking-wide text-foreground">Brand Directory</h2>
            <nav className="flex flex-col gap-1.5">
              {tabsList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`text-left py-3 px-4 rounded text-sm transition-all duration-200 border-l-2 ${
                    tab === t.id
                      ? "bg-foreground/5 font-medium text-foreground border-gold"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-foreground/[0.02]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Tab Content Window */}
          <main className="min-h-[500px]">
            {tab === "story" && <StoryTab />}
            {tab === "sustainability" && <SustainabilityTab />}
            {tab === "gifts" && <GiftsTab />}
          </main>
        </div>
      </div>
    </SiteShell>
  );
}

/* 1. OUR STORY TAB */
function StoryTab() {
  return (
    <div className="fade-up grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
      <div className="md:col-span-7 space-y-6">
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium">About Saanjh</span>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight">Crafted for calm,<br />designed for you</h2>
        <div className="space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed">
          <p>
            Saanjh is a luxury candle and jewellery brand born from the belief that everyday rituals deserve beauty. Each piece is thoughtfully made to bring warmth, fragrance, and elegance into your home and style.
          </p>
          <p>
            From hand-poured candles with curated scents to delicate jewellery that complements mindful living, we create products that feel personal, premium, and deeply soothing.
          </p>
          <p>
            Our aesthetic blends soft neutrals, golden accents, and timeless design — because luxury should feel gentle, not loud.
          </p>
        </div>
      </div>

      <div className="md:col-span-5 relative">
        <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted shadow-lg border border-border/20">
          <img
            src={catCandles}
            alt="Saanjh Coffee Candles"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute -bottom-4 -left-4 glass rounded px-4 py-3 border border-border/50 text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:block">
          Handcrafted in Indore, MP
        </div>
      </div>
    </div>
  );
}

/* 2. SUSTAINABILITY TAB */
function SustainabilityTab() {
  const points = [
    {
      title: "100% Soy Wax",
      desc: "Our candles are hand-poured using premium, plant-based soy wax which burns longer, cleaner, and releases fragrances with pure clarity.",
    },
    {
      title: "Lead-Free Wicks",
      desc: "We use wicks woven from organic cotton flat threads, ensuring completely lead-free, non-toxic, and soot-free combustion.",
    },
    {
      title: "Recyclable Glassware",
      desc: "Our candle containers are designed to be thoroughly cleaned and reused as storage jars, flower vases, or decorative organizers.",
    },
    {
      title: "Ethical Batches",
      desc: "Producing exclusively in highly controlled small batches in our Indore studio allows us to reduce energy waste and prevent leftover inventory.",
    },
  ];

  return (
    <div className="fade-up space-y-8">
      <div className="max-w-2xl space-y-3">
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium">Eco-Conscious Philosophy</span>
        <h2 className="font-serif text-3xl md:text-4xl">Mindful creation, gentle footprint</h2>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          At Saanjh, sustainable luxury isn't an afterthought — it guides how we select, craft, and pack every single product.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 pt-4">
        {points.map((p, idx) => (
          <div key={idx} className="border border-border p-6 rounded-lg bg-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/5 border border-gold/15">
              <Leaf className="h-4.5 w-4.5 text-gold" />
            </div>
            <h3 className="font-serif text-xl">{p.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 4. GIFT CARDS TAB */
function GiftsTab() {
  const [val, setVal] = useState(2500);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ toName: "", toEmail: "", note: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`₹${val.toLocaleString("en-IN")} Digital Gift Card added to bag`);
      setForm({ toName: "", toEmail: "", note: "" });
    }, 1200);
  };

  const values = [1000, 2500, 5000, 10000];

  return (
    <div className="fade-up space-y-8">
      <div className="space-y-3">
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium">Share the Calm</span>
        <h2 className="font-serif text-3xl md:text-4xl">Digital Gift Cards</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Give the gift of choice. Saanjh digital gift cards are emailed directly to your loved one with a personalized note, ready for slow shopping.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-8 pt-4 items-start">
        {/* Builder Form */}
        <form onSubmit={handleAdd} className="space-y-5">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2.5">Select Value</span>
            <div className="grid grid-cols-4 gap-2.5">
              {values.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVal(v)}
                  className={`py-3 text-sm border rounded transition ${
                    val === v
                      ? "border-foreground bg-foreground text-background font-semibold"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {formatINR(v)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Recipient Name</span>
              <input
                type="text"
                required
                value={form.toName}
                onChange={(e) => setForm({ ...form, toName: e.target.value })}
                className="mt-1.5 block w-full bg-transparent border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Recipient Email</span>
              <input
                type="email"
                required
                value={form.toEmail}
                onChange={(e) => setForm({ ...form, toEmail: e.target.value })}
                className="mt-1.5 block w-full bg-transparent border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Gift Message (Optional)</span>
            <textarea
              rows={4}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="mt-1.5 block w-full bg-transparent border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground transition resize-none"
              placeholder="Sending you light, warmth, and beautiful slow moments..."
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              <>
                Add to Bag <Gift className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Gift Card Card Preview */}
        <div className="bg-secondary/40 border border-border p-6 rounded-xl space-y-6 sticky top-28">
          <h3 className="font-serif text-sm uppercase tracking-widest text-muted-foreground text-center">Card Preview</h3>
          
          <div className="aspect-[1.58/1] rounded-lg bg-foreground text-background p-6 flex flex-col justify-between relative overflow-hidden shadow-md">
            <div className="absolute right-[-10px] top-[-10px] h-20 w-20 rounded-full bg-gold/10 blur-xl" />
            
            <div className="flex justify-between items-start">
              <div>
                <span className="font-serif text-lg tracking-[0.2em] uppercase">Saanjh</span>
                <span className="block text-[8px] uppercase tracking-widest text-muted-foreground">Digital Gift Card</span>
              </div>
              <Sparkles className="h-4 w-4 text-gold" />
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground block">Gift Value</span>
              <span className="font-serif text-2xl tracking-wide text-gold-gradient">{formatINR(val)}</span>
            </div>
          </div>
          
          <div className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Delivered instantly to their inbox upon checkout payment. No expiry date.
          </div>
        </div>
      </div>
    </div>
  );
}


