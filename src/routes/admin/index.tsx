import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/products";
import { TrendingUp, ShoppingBag, Users, Package, Activity, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { getDbProducts } from "@/lib/api/products.functions";
import { useState, useEffect, Fragment } from "react";
import { backfillFromActivities } from "@/lib/activity";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";


export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const products = await getDbProducts();
    return { products };
  },
  component: AdminHome,
});

const revenue = [
  { m: "Jul", v: 0 }, { m: "Aug", v: 0 }, { m: "Sep", v: 0 },
  { m: "Oct", v: 0 }, { m: "Nov", v: 0 }, { m: "Dec", v: 0 },
  { m: "Jan", v: 0 }, { m: "Feb", v: 0 }, { m: "Mar", v: 0 },
  { m: "Apr", v: 0 }, { m: "May", v: 0 },
];

const ordersByDay = [
  { d: "Mon", v: 0 }, { d: "Tue", v: 0 }, { d: "Wed", v: 0 },
  { d: "Thu", v: 0 }, { d: "Fri", v: 0 }, { d: "Sat", v: 0 }, { d: "Sun", v: 0 },
];

const getActionColor = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes("login") || a.includes("signup")) return "bg-blue-50 text-blue-800 border border-blue-200";
  if (a.includes("cart")) return "bg-amber-50 text-amber-800 border border-amber-200";
  if (a.includes("wishlist")) return "bg-pink-50 text-pink-800 border border-pink-200";
  if (a.includes("order")) return "bg-emerald-50 text-emerald-800 border border-emerald-200";
  return "bg-secondary text-secondary-foreground border border-border";
};

function AdminHome() {
  const { products } = Route.useLoaderData();
  const lowStockCount = products.filter((p) => p.stock < 10).length;
  const top = [...products].slice(0, 5);
  const [activities, setActivities] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showOrdersDetail, setShowOrdersDetail] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    backfillFromActivities();
    const rawAct = localStorage.getItem("saanjh_user_activities");
    if (rawAct) {
      try {
        setActivities(JSON.parse(rawAct));
      } catch (e) {
        console.error(e);
      }
    }

    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        let list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (list.length === 0) {
          const raw = localStorage.getItem("saanjh_orders_list");
          list = raw ? JSON.parse(raw) : [];
        }
        setOrders(list);
      } catch (e) {
        console.error("Failed to load orders from Firestore:", e);
        const rawOrd = localStorage.getItem("saanjh_orders_list");
        if (rawOrd) {
          try {
            setOrders(JSON.parse(rawOrd));
          } catch (err) {
            console.error(err);
          }
        }
      }
    };
    fetchOrders();

    const rawCust = localStorage.getItem("saanjh_customers_list");
    if (rawCust) {
      try {
        setCustomers(JSON.parse(rawCust));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const totalCustomers = customers.length;

  const dynamicRevenue = [
    { m: "Jul", v: 0 }, { m: "Aug", v: 0 }, { m: "Sep", v: 0 },
    { m: "Oct", v: 0 }, { m: "Nov", v: 0 }, { m: "Dec", v: 0 },
    { m: "Jan", v: 0 }, { m: "Feb", v: 0 }, { m: "Mar", v: 0 },
    { m: "Apr", v: 0 }, { m: "May", v: 0 },
  ];

  orders.forEach((o) => {
    if (o.date) {
      const parts = o.date.split(" ");
      const monthWord = parts.length > 1 ? parts[1] : "";
      const match = dynamicRevenue.find((r) => r.m.toLowerCase() === monthWord.toLowerCase());
      if (match) {
        match.v += o.total;
      } else {
        dynamicRevenue[dynamicRevenue.length - 1].v += o.total;
      }
    }
  });

  const dynamicOrdersByDay = [
    { d: "Mon", v: 0 }, { d: "Tue", v: 0 }, { d: "Wed", v: 0 },
    { d: "Thu", v: 0 }, { d: "Fri", v: 0 }, { d: "Sat", v: 0 }, { d: "Sun", v: 0 },
  ];

  orders.forEach((o) => {
    if (o.date) {
      try {
        const currentYear = new Date().getFullYear();
        const dateObj = new Date(`${o.date} ${currentYear}`);
        const dayIndex = dateObj.getDay();
        const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayName = daysMap[dayIndex];
        const match = dynamicOrdersByDay.find((d) => d.d === dayName);
        if (match) {
          match.v += 1;
        } else {
          dynamicOrdersByDay[5].v += 1;
        }
      } catch (e) {
        dynamicOrdersByDay[5].v += 1;
      }
    }
  });
  
  const stats = [
    { Icon: TrendingUp, l: "Revenue (mo)", v: formatINR(totalRevenue), d: totalRevenue > 0 ? "+100% growth" : "0% growth" },
    { Icon: ShoppingBag, l: "Orders", v: String(totalOrders), d: totalOrders > 0 ? "Active storefront" : "No orders yet" },
    { Icon: Users, l: "Customers", v: String(totalCustomers), d: totalCustomers > 0 ? "Registered users" : "No customers yet" },
    { Icon: Package, l: "Low stock", v: String(lowStockCount), d: lowStockCount > 0 ? "Needs attention" : "All stock healthy" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Good morning, Admin</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening at Saanjh today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ Icon, l, v, d }) => {
          const isOrders = l === "Orders";
          return (
            <Card 
              key={l} 
              onClick={() => isOrders && setShowOrdersDetail(!showOrdersDetail)}
              className={`p-5 transition-all duration-300 ${
                isOrders 
                  ? "cursor-pointer hover:shadow-md hover:border-gold/40 hover:bg-secondary/10" 
                  : ""
              }`}
            >
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs uppercase tracking-widest flex items-center gap-1.5">
                  {l}
                  {isOrders && (
                    <span className="text-[9px] bg-gold/10 text-gold px-1.5 py-0.5 rounded font-sans normal-case tracking-normal font-semibold">
                      {showOrdersDetail ? "Click to collapse" : "Click to view"}
                    </span>
                  )}
                </span>
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div className="mt-3 font-serif text-3xl flex items-baseline justify-between">
                <span>{v}</span>
                {isOrders && (
                  showOrdersDetail ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground/60 animate-bounce" />
                  )
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{d}</div>
            </Card>
          );
        })}
      </div>

      {showOrdersDetail && (
        <Card className="p-6 border border-gold/20 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-gold" />
              <h3 className="font-serif text-2xl">All Storefront Orders Detailed View</h3>
            </div>
            <button 
              onClick={() => setShowOrdersDetail(false)}
              className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition underline cursor-pointer font-medium"
            >
              Close Section
            </button>
          </div>
          {orders.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No orders found in the database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 font-medium">Order ID</th>
                    <th className="py-3 font-medium">Customer</th>
                    <th className="py-3 font-medium">Items</th>
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Method</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o: any) => {
                    const isExpanded = expandedOrderId === o.id;
                    return (
                      <Fragment key={o.id}>
                        <tr 
                          onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                          className="hover:bg-secondary/10 cursor-pointer transition animate-in fade-in duration-200"
                        >
                          <td className="py-3 font-medium font-mono text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <ChevronRight className={`h-4 w-4 text-muted-foreground/60 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                              <span>{o.id}</span>
                            </div>
                          </td>
                          <td className="py-3">{o.customer || o.name || "Guest"}</td>
                          <td className="py-3 text-muted-foreground">{o.items || 1} {o.items === 1 ? "item" : "items"}</td>
                          <td className="py-3 text-xs text-muted-foreground">{o.date || "N/A"}</td>
                          <td className="py-3 uppercase text-xs text-muted-foreground font-semibold">{o.paymentMethod || "cod"}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              o.status === "Delivered" 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                : o.status === "Shipped" 
                                ? "bg-blue-50 text-blue-800 border-blue-200" 
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}>
                              {o.status || "Processing"}
                            </span>
                          </td>
                          <td className="py-3 font-medium text-right">{formatINR(o.total || o.amount || 0)}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-secondary/5">
                            <td colSpan={7} className="px-6 py-4 border-t border-b border-border/50">
                              <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-300">
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
                                      This order contains {o.items || 1} {o.items === 1 ? "item" : "items"}. Item details are not available for older orders.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl">Revenue</h3>
            <span className="text-xs text-muted-foreground">Last 11 months</span>
          </div>
          <div className="h-64">
            {products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No revenue data available
              </div>
            ) : (
              <ResponsiveContainer>
                <AreaChart data={dynamicRevenue}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.13 80)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.78 0.13 80)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                    formatter={(v: number) => formatINR(v)}
                  />
                  <Area dataKey="v" type="monotone" stroke="oklch(0.55 0.09 70)" strokeWidth={2} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-serif text-xl mb-4">Orders this week</h3>
          <div className="h-64">
            {products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No orders data available
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={dynamicOrdersByDay}>
                  <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="v" radius={[6, 6, 0, 0]} fill="oklch(0.55 0.09 70)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-6 flex flex-col h-[480px]">
          <h3 className="font-serif text-xl mb-5 shrink-0">Top selling products</h3>
          {top.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center flex-1 flex items-center justify-center">
              No products found in the catalog database
            </div>
          ) : (
            <div className="divide-y divide-border overflow-y-auto pr-1 flex-1">
              {top.map((p, i) => (
                <div key={p.id} className="py-3.5 flex items-center gap-4 first:pt-0 last:pb-0">
                  <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                  <img src={p.image} alt={p.name} className="h-12 w-12 rounded object-cover" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.subCategory}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">0 sold</div>
                  <div className="font-medium text-sm w-24 text-right">{formatINR(p.price)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-5 shrink-0">
            <h3 className="font-serif text-xl">Recent User Activities</h3>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {activities.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
              <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <div className="text-sm font-medium mb-1">No activities logged yet</div>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                User interactions on the storefront will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border overflow-y-auto pr-1 flex-1">
              {activities.map((a: any) => (
                <div key={a.id} className="py-3 flex flex-col gap-1.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif font-semibold text-foreground text-sm">{a.user}</span>
                    <span className="text-muted-foreground text-[10px]">{a.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 text-[9px] rounded uppercase tracking-wider font-semibold border ${getActionColor(a.action)}`}>
                      {a.action}
                    </span>
                    <span className="text-xs text-muted-foreground truncate flex-1 font-medium">{a.details}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}


