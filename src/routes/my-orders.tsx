import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import React, { useEffect, useState } from "react";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/products";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export const Route = createFileRoute("/my-orders")({
  component: MyOrders,
});

const statusClass: Record<string, string> = {
  Shipped: "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  Processing: "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  Delivered: "bg-green-100 text-green-900 dark:bg-green-950/40 dark:text-green-300",
  Cancelled: "bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
};

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleOrder = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  useEffect(() => {
    // Enforce login check
    const rawSession = localStorage.getItem("saanjh_user_session");
    if (!rawSession) {
      toast.error("Please sign in to view your orders.");
      navigate({ to: "/auth/login" });
      return;
    }

    const loadOrders = async () => {
      try {
        const session = JSON.parse(rawSession);

        // 1. Fetch from Cloud Firestore (ordered by creation date desc)
        const q = query(
          collection(db, "orders"),
          where("email", "==", session.email),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        let list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 2. Fallback to localStorage if Firestore returns nothing (for compatibility or offline)
        if (list.length === 0) {
          const rawOrders = localStorage.getItem("saanjh_orders_list");
          const localList = rawOrders ? JSON.parse(rawOrders) : [];
          list = localList.filter((o: any) => {
            const matchesEmail = o.email && o.email.toLowerCase() === session.email.toLowerCase();
            const matchesName = o.customer && o.customer.toLowerCase() === session.name.toLowerCase();
            return matchesEmail || matchesName;
          });
        }

        setOrders(list);
      } catch (e) {
        console.error("Failed to fetch user orders from Firestore:", e);
        // Fallback to localStorage on error
        try {
          const session = JSON.parse(rawSession);
          const rawOrders = localStorage.getItem("saanjh_orders_list");
          const localList = rawOrders ? JSON.parse(rawOrders) : [];
          const filtered = localList.filter((o: any) => {
            const matchesEmail = o.email && o.email.toLowerCase() === session.email.toLowerCase();
            const matchesName = o.customer && o.customer.toLowerCase() === session.name.toLowerCase();
            return matchesEmail || matchesName;
          });
          setOrders(filtered);
        } catch (localErr) {
          console.error("Local storage fallback failed:", localErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-6xl px-5 lg:px-10 py-20 text-center animate-pulse text-muted-foreground text-sm">
          Loading your orders...
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 lg:px-10 py-12 lg:py-20">
        <h1 className="font-serif text-4xl md:text-5xl">My Orders</h1>
        <p className="text-muted-foreground mt-2">Track the status of your slow-crafted purchases.</p>

        {orders.length === 0 ? (
          <div className="mt-20 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <p className="font-serif text-2xl">No orders placed yet</p>
            <p className="text-muted-foreground mt-2">When you place an order, it will appear here.</p>
            <Link
              to="/shop"
              className="mt-6 inline-block bg-foreground text-background px-7 py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 transition"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-10 overflow-hidden border border-border rounded-lg bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 border-b border-border">
                  <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => {
                    const isExpanded = expandedOrderId === o.id;
                    return (
                      <React.Fragment key={o.id}>
                        <tr
                          onClick={() => toggleOrder(o.id)}
                          className="hover:bg-secondary/20 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground select-all">
                            <div className="flex items-center gap-2">
                              <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                              <span>{o.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {o.date}
                          </td>
                          <td className="px-6 py-4">
                            {o.items} {o.items === 1 ? "item" : "items"}
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">
                            {formatINR(o.total)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-full ${
                                statusClass[o.status] || "bg-secondary text-foreground"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                o.status === "Delivered" ? "bg-green-600" : o.status === "Shipped" ? "bg-blue-600" : o.status === "Cancelled" ? "bg-rose-600" : "bg-amber-600"
                              }`} />
                              {o.status}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-secondary/5">
                            <td colSpan={5} className="px-6 py-4 border-t border-b border-border/50">
                              <div className="space-y-4">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Items Summary
                                </h4>
                                {o.orderDetails && o.orderDetails.length > 0 ? (
                                  <div className="divide-y divide-border/40">
                                    {o.orderDetails.map((item: any, idx: number) => (
                                      <div key={idx} className="py-3 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                          {item.image && (
                                            <img
                                              src={item.image}
                                              alt={item.name}
                                              className="h-12 w-10 object-cover rounded bg-muted border border-border/50"
                                            />
                                          )}
                                          <div>
                                            <div className="font-medium text-foreground">{item.name}</div>
                                            {item.variant && (
                                              <div className="text-xs text-muted-foreground mt-0.5">{item.variant}</div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-xs text-muted-foreground">Qty: {item.qty}</div>
                                          <div className="font-medium text-foreground">{formatINR(item.price * item.qty)}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground py-2 bg-secondary/10 px-3 rounded">
                                    This order contains {o.items} {o.items === 1 ? "item" : "items"}. Item details are not available for older orders.
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
