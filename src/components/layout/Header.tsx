import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cart, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { TransparentLogo } from "@/components/layout/TransparentLogo";
import { toast } from "sonner";


const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop All" },
  { to: "/shop?category=candles", label: "Candles" },
  { to: "/shop?category=jewellery", label: "Jewellery" },
];

export function Header() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userSession, setUserSession] = useState<{ email: string; name: string } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("saanjh_user_session");
    if (raw) {
      try {
        setUserSession(JSON.parse(raw));
      } catch {
        setUserSession(null);
      }
    } else {
      setUserSession(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("saanjh_user_session");
    cart.clear();
    setUserSession(null);
    setUserMenuOpen(false);
    toast.success("Logged out successfully. See you soon!");
    navigate({ to: "/" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all",
          scrolled ? "glass shadow-[0_1px_0_var(--border)]" : "bg-background/60 backdrop-blur-sm",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-10">
          <button
            className="lg:hidden -ml-2 p-2 shrink-0"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            to="/"
            onClick={() => {
              if (pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="flex items-center gap-1.5 sm:gap-3 font-serif text-lg sm:text-xl lg:text-2xl tracking-[0.18em] uppercase shrink-0"
          >
            <TransparentLogo sizeClassName="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16" />
            <span>Saanjh</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-base">
            {nav.map((n) => {
              const targetPath = n.to.split("?")[0];
              const isCurrentPage = pathname === targetPath;
              return (
                <Link
                  key={n.label}
                  to={n.to as any}
                  onClick={() => {
                    if (isCurrentPage) {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="relative py-1 text-foreground/80 hover:text-foreground transition-colors group"
                >
                  {n.label}
                  <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-foreground transition-all group-hover:w-full" />
                </Link>
              );
            })}
            <a
              href="https://drive.google.com/file/d/1Lj7d3K7KfkOWU1M8n9PthbelknK98eAu/view?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="relative py-1 text-foreground/80 hover:text-foreground transition-colors group"
            >
              Get the App
              <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-foreground transition-all group-hover:w-full" />
            </a>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              className={cn("p-2 hover:text-gold transition shrink-0", searchOpen && "text-gold")}
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search className="h-[23px] w-[23px]" />
            </button>

            {userSession ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn("p-2 hover:text-gold transition shrink-0", userMenuOpen && "text-gold")}
                  aria-label="Account Menu"
                >
                  <User className="h-[23px] w-[23px]" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2.5 z-40 w-60 bg-background border border-border rounded shadow-xl p-5 text-left animate-in fade-in slide-in-from-top-1.5 duration-200">
                      <div className="font-serif text-base tracking-wide text-foreground">
                        Hello, {userSession.name.split(" ")[0]} ✦
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5 mb-4">
                        {userSession.email}
                      </div>
                      <div className="border-t border-border pt-4 flex flex-col gap-3">
                        <Link
                          to="/wishlist"
                          onClick={() => setUserMenuOpen(false)}
                          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                        >
                          <Heart className="h-3.5 w-3.5 text-gold" /> Wishlist
                        </Link>
                        <Link
                          to="/my-orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                        >
                          <ShoppingBag className="h-3.5 w-3.5 text-gold" /> My Orders
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="text-[10px] uppercase tracking-widest text-rose-600 hover:text-rose-500 transition-colors flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 text-left w-full"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/auth/login" className="p-2 hover:text-gold transition" aria-label="Account">
                <User className="h-[23px] w-[23px]" />
              </Link>
            )}
            <Link to="/wishlist" className="p-2 hover:text-gold transition hidden sm:block" aria-label="Wishlist">
              <Heart className="h-[23px] w-[23px]" />
            </Link>
            <Link to="/cart" className="p-2 hover:text-gold transition relative" aria-label="Cart">
              <ShoppingBag className="h-[23px] w-[23px]" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-medium text-background">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Slide-down search overlay */}
        {searchOpen && (
          <div className="border-t border-border bg-background/95 backdrop-blur-md py-4 px-5 shadow-sm">
            <div className="mx-auto max-w-md flex flex-col gap-3 py-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate({ to: "/shop", search: { q: searchQuery.trim() } as any });
                    setSearchOpen(false);
                  }
                }}
                className="flex items-center gap-2.5"
              >
                <input
                  type="search"
                  placeholder="Search product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 border border-[#D5A77B]/40 rounded-full px-6 py-2 focus:border-[#D5A77B] focus:outline-none transition-colors text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-full h-9 w-9 flex items-center justify-center bg-[#D5A77B] text-white hover:bg-[#c6966a] transition-colors shrink-0 shadow-sm"
                  aria-label="Submit search"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>
              </form>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close Search
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-sm bg-background shadow-2xl p-6 fade-up">
            <div className="flex items-center justify-between mb-8">
              <span className="font-serif text-xl tracking-widest uppercase">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {nav.map((n) => {
                const targetPath = n.to.split("?")[0];
                const isCurrentPage = pathname === targetPath;
                return (
                  <Link
                    key={n.label}
                    to={n.to as any}
                    onClick={() => {
                      setOpen(false);
                      if (isCurrentPage) {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="border-b border-border py-4 text-lg font-serif"
                  >
                    {n.label}
                  </Link>
                );
              })}
              <a
                href="https://drive.google.com/file/d/1Lj7d3K7KfkOWU1M8n9PthbelknK98eAu/view?usp=drive_link"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="border-b border-border py-4 text-lg font-serif"
              >
                Get the App
              </a>
              {userSession && (
                <>
                  <Link
                    to="/wishlist"
                    onClick={() => setOpen(false)}
                    className="border-b border-border py-4 text-lg font-serif"
                  >
                    Wishlist
                  </Link>
                  <Link
                    to="/my-orders"
                    onClick={() => setOpen(false)}
                    className="border-b border-border py-4 text-lg font-serif"
                  >
                    My Orders
                  </Link>
                </>
              )}
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="mt-8 text-xs uppercase tracking-widest text-muted-foreground"
              >
                Admin dashboard →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
