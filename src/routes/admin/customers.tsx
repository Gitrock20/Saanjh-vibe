import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useState, useEffect } from "react";
import { backfillFromActivities } from "@/lib/activity";

export const Route = createFileRoute("/admin/customers")({ component: Customers });

function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    backfillFromActivities();
    const raw = localStorage.getItem("saanjh_customers_list");
    if (raw) {
      try {
        setCustomers(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl">Customers</h1>
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="rounded-full bg-secondary/50 p-4 mb-4">
            <Users className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-serif text-xl mb-1">No customers registered yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            When users register or complete a checkout on Saanjh Studio, their accounts will appear here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Customers</h1>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.email} className="border-t border-border hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </td>
                <td className="px-4 py-3">{c.city}</td>
                <td className="px-4 py-3">{c.orders}</td>
                <td className="px-4 py-3">₹{c.spent.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

