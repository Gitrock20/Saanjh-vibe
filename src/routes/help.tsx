import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Package,
  Loader2,
  Send,
  Search,
  Sparkles,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";

type HelpSearch = {
  tab?: "contact" | "shipping" | "track" | "faq" | "care";
};

export const Route = createFileRoute("/help")({
  validateSearch: (search: Record<string, unknown>): HelpSearch => {
    const validTabs = ["contact", "shipping", "track", "faq", "care"];
    const tab = search.tab as string;
    return {
      tab: validTabs.includes(tab) ? (tab as any) : "contact",
    };
  },
  component: HelpPage,
});

function HelpPage() {
  const { tab = "contact" } = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleTabChange = (newTab: string) => {
    navigate({ search: { tab: newTab as any } });
  };

  const tabsList = [
    { id: "contact", label: "Contact" },
    { id: "shipping", label: "Shipping & Returns" },
    { id: "track", label: "Track Order" },
    { id: "faq", label: "FAQ" },
    { id: "care", label: "Care Guide" },
  ];

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-5 lg:px-10 py-12 lg:py-16">
        <div className="border-b border-border pb-8 mb-10">
          <h1 className="font-serif text-4xl md:text-5xl">Customer Care</h1>
          <p className="text-muted-foreground mt-2">Here to assist you in making slow moments beautiful.</p>
        </div>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden mb-8">
          <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">Select Help Section</label>
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
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-12 xl:gap-20">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block sticky top-28 self-start">
            <h2 className="font-serif text-xl mb-6 tracking-wide text-foreground">Help Directory</h2>
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
            {tab === "contact" && <ContactTab />}
            {tab === "shipping" && <ShippingTab />}
            {tab === "track" && <TrackTab />}
            {tab === "faq" && <FAQTab />}
            {tab === "care" && <CareTab />}
          </main>
        </div>
      </div>
    </SiteShell>
  );
}

/* 1. CONTACT TAB */
function ContactTab() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "General Enquiry", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent! We will reply to your email within 24 hours.");
      setFormData({ name: "", email: "", subject: "General Enquiry", message: "" });
    }, 1200);
  };

  return (
    <div className="fade-up space-y-8">
      <div>
        <h2 className="font-serif text-3xl mb-3">Get in Touch</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Have a question about our candles, gold-plated jewellery, or custom corporate orders? Send us a message and our team will get back to you shortly.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Your Name</span>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5 block w-full bg-transparent border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</span>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1.5 block w-full bg-transparent border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Subject</span>
            <div className="relative mt-1.5">
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="block w-full bg-transparent border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground appearance-none"
              >
                <option value="General Enquiry">General Enquiry</option>
                <option value="Order Status">Order Status & Tracking</option>
                <option value="Custom Gifting">Corporate & Bulk Gifting</option>
                <option value="Damaged Item">Damaged or Defective Item</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
            </div>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Message</span>
            <textarea
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="mt-1.5 block w-full bg-transparent border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground transition resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background py-4 px-8 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 disabled:opacity-50 transition w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              <>
                Send Message <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="space-y-6 self-start bg-secondary/30 border border-border p-6 rounded-lg">
          <h3 className="font-serif text-lg border-b border-border pb-3">Head Office</h3>
          <ul className="space-y-4 text-xs">
            <li className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">Email Support</div>
                <a
                  href={`mailto:saanjhvibe@gmail.com?subject=${encodeURIComponent('Help with Order #[Insert Order Number]')}&body=${encodeURIComponent('Hi Saanjh Support,\n\nI am reaching out regarding my recent jewelry order.\n\nMy order number is: [Insert Order Number]\n\nMy question is:\n')}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  saanjhvibe@gmail.com
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">WhatsApp Care</div>
                <a href="https://wa.me/918349206021" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  +91 83492 06021
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">Response Hours</div>
                <div className="text-muted-foreground mt-0.5">Mon - Sat: 10 AM - 7 PM</div>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground">Head Office</div>
                <div className="text-muted-foreground mt-0.5">Indore, MP, India</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* 2. SHIPPING & RETURNS TAB */
function ShippingTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = [
    {
      q: "How long does delivery take?",
      a: "Orders are processed within 1-2 business days. Delivery across India typically takes 3-7 business days depending on your location. You will receive updates on WhatsApp once your order ships.",
    },
    {
      q: "Free shipping",
      a: "Enjoy free shipping on all orders above ₹999. For orders below that amount, a small delivery fee may apply at checkout — we will confirm the total before dispatch.",
    },
    {
      q: "Returns & exchanges",
      a: "Due to the handcrafted nature of our candles and jewellery, we accept returns only for damaged or defective items reported within 48 hours of delivery. Please share photos on WhatsApp and we will make it right.",
    },
  ];

  return (
    <div className="fade-up space-y-8">
      <div>
        <h2 className="font-serif text-3xl mb-3">Shipping & Returns Policy</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Everything is packed in-house with exceptional care. Here are the core shipping and replacement policies for Saanjh.
        </p>
      </div>

      <div className="border border-border rounded divide-y divide-border bg-card">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-serif text-lg hover:bg-foreground/[0.01] transition-colors"
              >
                <span>{item.q}</span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-gold" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-40 border-t border-border p-5 bg-secondary/10" : "max-h-0 opacity-0 pointer-events-none"
                }`}
              >
                <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 3. TRACK ORDER TAB */
function TrackTab() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");

  // Build a dynamic timeline from the order status
  const buildTimeline = (status: string, date: string) => {
    const steps = [
      { label: "Order Placed", done: true, date },
      { label: "Processed & Packed", done: ["Shipped", "Delivered"].includes(status) },
      { label: "Shipped", done: ["Shipped", "Delivered"].includes(status), active: status === "Shipped" },
      { label: "Out for Delivery", done: status === "Delivered" },
      { label: "Delivered", done: status === "Delivered", active: status === "Delivered" },
    ];
    if (status === "Cancelled") {
      return [
        { label: "Order Placed", done: true, date },
        { label: "Cancelled", done: true, active: true },
      ];
    }
    return steps;
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const trimId = orderId.trim();
      const trimPhone = phone.trim().replace(/\s+/g, "");

      // Fetch from Firestore by order ID
      const snap = await getDoc(doc(db, "orders", trimId));

      if (!snap.exists()) {
        setError("No order found with this Order ID. Please check and try again.");
        setLoading(false);
        return;
      }

      const data = snap.data();

      // Verify phone number matches
      const storedPhone = (data.phone || "").replace(/\s+/g, "");
      if (storedPhone && !storedPhone.includes(trimPhone) && !trimPhone.includes(storedPhone)) {
        setError("Phone number does not match this order. Please verify your details.");
        setLoading(false);
        return;
      }

      setResult({
        id: snap.id,
        status: data.status || "Processing",
        consignmentNo: data.consignmentNo || null,
        customer: data.customer || "",
        date: data.date || "",
        total: data.total || 0,
        steps: buildTimeline(data.status || "Processing", data.date || ""),
      });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    Processing: "text-amber-600",
    Shipped: "text-blue-600",
    Delivered: "text-emerald-600",
    Cancelled: "text-rose-600",
  };

  return (
    <div className="fade-up space-y-8">
      <div>
        <h2 className="font-serif text-3xl mb-3">Track Your Order</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Enter your Order ID and billing phone number below to view the live tracking status.
        </p>
      </div>

      <div className="bg-secondary/20 border border-border rounded-lg p-6 max-w-xl">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Order ID</span>
              <input
                type="text"
                required
                placeholder="e.g. pay_AbcXyz123"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="mt-1.5 block w-full bg-transparent border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</span>
              <input
                type="tel"
                required
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 block w-full bg-transparent border border-border rounded px-4 py-3 text-sm focus:outline-none focus:border-foreground transition"
              />
            </label>
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background py-4 px-8 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 disabled:opacity-50 transition w-full"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Retrieving details...</>
            ) : (
              <>Track Package <Search className="h-3.5 w-3.5" /></>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="border border-border rounded-lg bg-card overflow-hidden fade-up max-w-xl">
          {/* Header */}
          <div className="bg-secondary/40 border-b border-border px-6 py-4 flex flex-wrap justify-between items-center gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Order Ref</span>
              <div className="font-serif text-lg font-medium">{result.id}</div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Current Status</span>
              <div className={`text-sm font-semibold ${statusColor[result.status] || "text-foreground"}`}>
                {result.status}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Consignment Info */}
            <div className="rounded-lg border border-border bg-secondary/10 px-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Customer</span>
                  <span className="font-medium">{result.customer || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Order Date</span>
                  <span className="font-medium">{result.date || "—"}</span>
                </div>
              </div>
              {result.consignmentNo && (
                <div className="mt-3 pt-3 border-t border-border/60">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Consignment / AWB Tracking No.</span>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 text-base tracking-widest">
                      {result.consignmentNo}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Use this number on the courier's website for detailed tracking.</p>
                </div>
              )}
              {!result.consignmentNo && result.status === "Shipped" && (
                <div className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  Consignment number will be updated shortly. Check back later.
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
              {result.steps.map((step: any, sIdx: number) => (
                <div key={sIdx} className="relative flex flex-col sm:flex-row sm:justify-between gap-1">
                  <div className="absolute -left-[20px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background flex items-center justify-center">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        step.active ? "bg-gold animate-pulse" : step.done ? "bg-foreground" : "bg-muted"
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${step.done || step.active ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </h4>
                    {step.date && <p className="text-xs text-muted-foreground mt-0.5">{step.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* 4. FAQ TAB */
function FAQTab() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    {
      q: "Where are your products made?",
      a: "All our products are proudly handcrafted in small batches at our studio in Indore, MP, India.",
    },
    {
      q: "Are the candles made with natural ingredients?",
      a: "Yes, our candles are hand-poured using 100% natural soy wax, lead-free cotton wicks, and IFRA-compliant premium fragrance oils. They are clean-burning, vegan, and cruelty-free.",
    },
    {
      q: "Do your gold-plated jewellery items tarnish?",
      a: "We use thick 18k gold plating over premium stainless steel or brass, designed to resist tarnishing. By following our care guide, your pieces will retain their shine for years.",
    },
    {
      q: "Do you offer gift wrapping?",
      a: "Every Saanjh order arrives beautifully packed in our signature rigid boxes with tissue paper, dried flowers, and a handwritten note — ready to gift.",
    },
  ];

  return (
    <div className="fade-up space-y-8">
      <div>
        <h2 className="font-serif text-3xl mb-3">Frequently Asked Questions</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Quick answers to the questions we get asked most frequently. Feel free to reach out if you have another query.
        </p>
      </div>

      <div className="border border-border rounded divide-y divide-border bg-card">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="overflow-hidden">
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-serif text-lg hover:bg-foreground/[0.01] transition-colors"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="h-4 w-4 text-gold" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-40 border-t border-border p-5 bg-secondary/10" : "max-h-0 opacity-0 pointer-events-none"
                }`}
              >
                <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 5. CARE GUIDE TAB */
function CareTab() {
  return (
    <div className="fade-up space-y-8">
      <div>
        <h2 className="font-serif text-3xl mb-3">Care & Preservation Guide</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          Saanjh candles and jewellery are crafted with artisan care. Follow these simple practices to preserve their beauty.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Candle Care */}
        <div className="border border-border bg-card p-6 rounded-lg space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/5 border border-gold/15">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <h3 className="font-serif text-2xl">Candle care</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Trim the wick to ¼ inch before each burn. Allow the wax to melt edge-to-edge on the first use. Never leave a burning candle unattended. Keep away from drafts and flammable materials.
          </p>
        </div>

        {/* Jewellery Care */}
        <div className="border border-border bg-card p-6 rounded-lg space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/5 border border-gold/15">
            <Award className="h-5 w-5 text-gold" />
          </div>
          <h3 className="font-serif text-2xl">Jewellery care</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Store pieces in a dry pouch, avoid water and perfume contact, and polish gently with a soft cloth. Remove before sleeping or exercising to maintain the finish.
          </p>
        </div>
      </div>
    </div>
  );
}
