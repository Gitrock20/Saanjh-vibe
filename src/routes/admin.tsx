import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, ArrowLeft, LogOut, ShieldAlert, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { TransparentLogo } from "@/components/layout/TransparentLogo";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const nav = [
  { to: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/orders", label: "Orders", Icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", Icon: Users },
  { to: "/admin/coupons", label: "Coupons", Icon: Tag },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("saanjh_admin_logged_in") === "true";
    setIsAuthenticated(adminLoggedIn);
    setMounted(true);

    if (adminLoggedIn) {
      // If client session is active but Firebase Auth is unauthenticated, perform silent background login
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          console.log("Admin localStorage is active, but Firebase Auth session is missing. Autologging in...");
          signInWithEmailAndPassword(auth, "admin@saanjh.com", "admin123")
            .then(() => console.log("Admin background auto-login successful."))
            .catch((err) => {
              if (
                err.code === "auth/user-not-found" || 
                err.code === "auth/invalid-credential" || 
                err.code === "auth/invalid-email"
              ) {
                console.log("Admin account not found in Firebase. Creating account in background...");
                createUserWithEmailAndPassword(auth, "admin@saanjh.com", "admin123")
                  .then(() => console.log("Admin background account creation and sign-in successful."))
                  .catch((createErr) => console.error("Admin background account creation failed:", createErr));
              } else {
                console.warn("Admin background auto-login failed:", err);
              }
            });
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Authenticating credentials...");

    // Sign in the admin via Firebase Auth so that the database security rules recognize the session
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        localStorage.setItem("saanjh_admin_logged_in", "true");
        setIsAuthenticated(true);
        setLoading(false);
        toast.dismiss(toastId);
        toast.success("Access granted. Welcome back!");
      })
      .catch((err) => {
        // If the admin user isn't registered in Firebase Auth yet, automatically register them
        if (
          err.code === "auth/user-not-found" || 
          err.code === "auth/invalid-credential" || 
          err.code === "auth/invalid-email"
        ) {
          if (email.trim().toLowerCase() === "admin@saanjh.com" && password === "admin123") {
            createUserWithEmailAndPassword(auth, email, password)
              .then(() => {
                localStorage.setItem("saanjh_admin_logged_in", "true");
                setIsAuthenticated(true);
                setLoading(false);
                toast.dismiss(toastId);
                toast.success("Admin account created and authenticated! Welcome!");
              })
              .catch((createErr) => {
                toast.dismiss(toastId);
                toast.error(createErr.message || "Failed to create administrator account.");
                setLoading(false);
              });
            return;
          }
        }
        toast.dismiss(toastId);
        toast.error("Access denied. Invalid administrator credentials.");
        setLoading(false);
      });
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        localStorage.removeItem("saanjh_admin_logged_in");
        setIsAuthenticated(false);
        toast.success("Logged out successfully.");
      })
      .catch((err) => {
        console.error("Firebase sign out failed:", err);
        // Fallback log out anyway
        localStorage.removeItem("saanjh_admin_logged_in");
        setIsAuthenticated(false);
        toast.success("Logged out successfully.");
      });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="font-serif text-xl tracking-[0.18em] uppercase text-muted-foreground animate-pulse">
          Saanjh
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-secondary/30 p-4">
        <Card className="w-full max-w-md bg-background/80 backdrop-blur-md border border-border p-8 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center mb-8 flex flex-col items-center">
            <Link to="/" className="font-serif text-3xl tracking-[0.18em] uppercase text-foreground hover:opacity-80 transition flex items-center gap-2 justify-center">
              <TransparentLogo sizeClassName="h-10 w-10" />
              <span>Saanjh</span>
            </Link>
            <div className="text-[11px] uppercase tracking-[0.24em] text-gold mt-1.5 font-medium flex items-center justify-center gap-1.5">
              <ShieldAlert className="h-3 w-3 text-gold" /> Administrator Portal
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-3 text-sm focus:outline-none focus:border-gold transition disabled:opacity-50"
                placeholder="admin@saanjh.com"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-3 text-sm focus:outline-none focus:border-gold transition disabled:opacity-50"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 disabled:opacity-50 transition cursor-pointer mt-2 font-medium"
            >
              {loading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-6 text-center">
            <Link to="/" className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition underline underline-offset-4">
              ← Return to Storefront
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col lg:flex-row">
      {/* Mobile Top Navigation Header */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-background border-b border-border sticky top-0 z-40">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 text-foreground hover:text-gold transition-colors cursor-pointer"
          aria-label="Open Admin Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link to="/" className="font-serif text-lg tracking-[0.18em] uppercase flex items-center gap-1.5">
          <TransparentLogo sizeClassName="h-7 w-7" />
          <span>Saanjh</span>
        </Link>

        <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-medium bg-gold/10 px-2.5 py-1 rounded">
          Admin
        </span>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-background p-6 hidden lg:flex flex-col">
        <Link to="/" className="font-serif text-xl tracking-[0.18em] uppercase flex items-center gap-2">
          <TransparentLogo sizeClassName="h-8 w-8" />
          <span>Saanjh</span>
        </Link>
        <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mt-1">Admin</span>

        <nav className="mt-10 flex flex-col gap-0.5">
          {nav.map(({ to, label, Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to as any}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition ${
                  active ? "bg-foreground text-background" : "hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-rose-600 transition cursor-pointer bg-transparent border-none p-0 text-left w-full"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to storefront
          </Link>
        </div>
      </aside>

      {/* Mobile Navigation Drawer Overlay & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar Drawer */}
          <div className="absolute left-0 top-0 h-full w-[80%] max-w-sm bg-background shadow-2xl p-6 flex flex-col fade-up">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
              <div className="flex flex-col">
                <span className="font-serif text-lg tracking-[0.18em] uppercase flex items-center gap-1.5">
                  <TransparentLogo sizeClassName="h-6 w-6" />
                  <span>Saanjh</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                  Admin Control Panel
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:text-gold transition cursor-pointer"
                aria-label="Close Admin Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {nav.map(({ to, label, Icon, exact }) => {
                const active = exact ? pathname === to : pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to as any}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded text-sm transition ${
                      active ? "bg-foreground text-background font-medium" : "hover:bg-secondary"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-border flex flex-col gap-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-rose-600 transition cursor-pointer bg-transparent border-none p-0 text-left w-full"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to storefront
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}

