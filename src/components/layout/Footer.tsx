import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="font-serif text-3xl tracking-[0.18em] uppercase">
              Saanjh
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Hand-poured candles and gold-plated jewellery, designed in studio and made in small batches.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/__saanjh.jewels?igsh=MTN6NHpkZ3FtNXRj", label: "Instagram" }
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href !== "#" ? "_blank" : undefined}
                  rel={href !== "#" ? "noopener noreferrer" : undefined}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-foreground hover:text-background transition"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Shop", links: ["All Candles", "All Jewellery", "New Arrivals", "Bestsellers", "Sale"] },
            { title: "Help", links: ["Contact", "Shipping & Returns", "Track Order", "FAQ", "Care Guide"] },
            { title: "Brand", links: ["Our Story", "Sustainability", "Gift Cards"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-serif text-base mb-4 tracking-wider">{col.title}</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {col.links.map((l) => {
                  let to: string | null = null;
                  let search: any = null;

                  if (col.title === "Help") {
                    const tabMap: Record<string, string> = {
                      "Contact": "contact",
                      "Shipping & Returns": "shipping",
                      "Track Order": "track",
                      "FAQ": "faq",
                      "Care Guide": "care",
                    };
                    to = "/help";
                    search = { tab: tabMap[l] };
                  } else if (col.title === "Shop") {
                    to = "/shop";
                    if (l === "All Candles") search = { category: "candles" };
                    else if (l === "All Jewellery") search = { category: "jewellery" };
                    else if (l === "New Arrivals") search = { filter: "new" };
                    else if (l === "Sale") search = { filter: "sale" };
                  } else if (col.title === "Brand") {
                    const tabMap: Record<string, string> = {
                      "Our Story": "story",
                      "Sustainability": "sustainability",
                      "Gift Cards": "gifts",
                    };
                    to = "/brand";
                    search = { tab: tabMap[l] };
                  }

                  return (
                    <li key={l}>
                      {to ? (
                        <Link to={to as any} search={search} className="hover:text-foreground transition">
                          {l}
                        </Link>
                      ) : (
                        <a href="#" className="hover:text-foreground transition">
                          {l}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Saanjh. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <Link to="/admin" className="hover:text-foreground">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
