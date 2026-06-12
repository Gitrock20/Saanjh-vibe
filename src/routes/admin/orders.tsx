import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { backfillFromActivities } from "@/lib/activity";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/products";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";

export const Route = createFileRoute("/admin/orders")({ component: Orders });

const statusClass: Record<string, string> = {
  Shipped: "bg-blue-100 text-blue-900",
  Processing: "bg-amber-100 text-amber-900",
  Delivered: "bg-green-100 text-green-900",
  Cancelled: "bg-rose-100 text-rose-900",
};

function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleOrder = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      backfillFromActivities();
      // 1. Fetch from Firestore
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      let list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 2. Fallback to localStorage if Firestore returns nothing
      if (list.length === 0) {
        const raw = localStorage.getItem("saanjh_orders_list");
        list = raw ? JSON.parse(raw) : [];
      }

      setOrders(list);
    } catch (e) {
      console.error("Failed to load orders from Firestore:", e);
      const raw = localStorage.getItem("saanjh_orders_list");
      if (raw) {
        try {
          setOrders(JSON.parse(raw));
        } catch (localErr) {
          console.error(localErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const toastId = toast.loading(`Updating order ${orderId} status to ${newStatus}...`);
    try {
      // 1. Update Firestore
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      });

      // 2. Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      // 3. Update localStorage fallback
      const raw = localStorage.getItem("saanjh_orders_list");
      if (raw) {
        const list = JSON.parse(raw);
        const updatedList = list.map((o: any) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        );
        localStorage.setItem("saanjh_orders_list", JSON.stringify(updatedList));
      }

      toast.dismiss(toastId);
      toast.success(`Order ${orderId} updated to ${newStatus}`);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`Failed to update status: ${err.message || err}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl">Orders</h1>
        <div className="text-center py-12 text-sm text-muted-foreground animate-pulse">
          Loading orders database...
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl">Orders</h1>
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="rounded-full bg-secondary/50 p-4 mb-4">
            <ShoppingBag className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-serif text-xl mb-1">No orders received yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            When customers purchase products from Saanjh Studio, their orders will appear here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Orders</h1>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 hidden md:table-cell">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const isExpanded = expandedOrderId === o.id;
              return (
                <React.Fragment key={o.id}>
                  <tr
                    onClick={() => toggleOrder(o.id)}
                    className="border-t border-border hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        <span>{o.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{o.customer}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{o.items}</td>
                    <td className="px-4 py-3">{formatINR(o.total)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        className={`px-2 py-1 text-[11px] font-medium rounded border border-border bg-card text-foreground cursor-pointer focus:outline-none ${statusClass[o.status] || "bg-secondary text-foreground"}`}
                      >
                        <option value="Processing" className="bg-card text-foreground">Processing</option>
                        <option value="Shipped" className="bg-card text-foreground">Shipped</option>
                        <option value="Delivered" className="bg-card text-foreground">Delivered</option>
                        <option value="Cancelled" className="bg-card text-foreground">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{o.date}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-secondary/5 animate-in fade-in duration-300">
                      <td colSpan={6} className="px-6 py-4 border-t border-b border-border/50">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Left Side: Customer & Shipping Details */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Customer & Shipping Details
                            </h4>
                            <div className="bg-card/50 p-4 rounded-lg border border-border/60 text-sm space-y-2.5">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Customer Name</span>
                                <span className="font-medium text-foreground">{o.customer || o.name || "Guest"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Email Address</span>
                                <span className="font-medium text-foreground">{o.email || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Contact Number</span>
                                <span className="font-medium text-foreground">{o.phone || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Shipping Address</span>
                                <span className="font-medium text-foreground whitespace-pre-wrap">
                                  {o.shippingAddress ? (
                                    `${o.shippingAddress.address}, ${o.shippingAddress.city}, ${o.shippingAddress.state} - ${o.shippingAddress.pinCode}`
                                  ) : (
                                    o.city || "N/A"
                                  )}
                                </span>
                              </div>
                              {o.gstin && (
                                <div>
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">GSTIN</span>
                                  <span className="font-medium text-foreground font-mono">{o.gstin}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Side: Order Items Summary */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Order Items Summary
                            </h4>
                            {o.orderDetails && o.orderDetails.length > 0 ? (
                              <div className="divide-y divide-border/40 bg-card/50 p-4 rounded-lg border border-border/60 max-h-[300px] overflow-y-auto">
                                {o.orderDetails.map((item: any, idx: number) => (
                                  <div key={idx} className="py-2.5 flex items-center justify-between text-sm first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                      {item.image && (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="h-10 w-8 object-cover rounded bg-muted border border-border/50"
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
                              <div className="text-xs text-muted-foreground py-4 bg-secondary/10 px-3 rounded text-center">
                                This order contains {o.items} {o.items === 1 ? "item" : "items"}. Item details are not available for older orders.
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

