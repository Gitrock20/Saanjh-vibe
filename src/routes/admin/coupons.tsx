import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Plus, Tag, Trash2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { collection, getDocs, addDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export const Route = createFileRoute("/admin/coupons")({ component: Coupons });

type Coupon = {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_delivery";
  value: number;
  minPurchase: number;
  expiresAt: string;
};

function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed" | "free_delivery">("percentage");
  const [value, setValue] = useState(10);
  const [minPurchase, setMinPurchase] = useState(0);
  const [expiresAt, setExpiresAt] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Coupon[];
      setCoupons(list);
    } catch (e) {
      console.error("Failed to load coupons:", e);
      toast.error("Failed to load coupons from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Coupon code is required.");
      return;
    }
    if (type !== "free_delivery" && value <= 0) {
      toast.error("Discount value must be greater than 0.");
      return;
    }
    if (type === "percentage" && value > 100) {
      toast.error("Discount percentage cannot exceed 100%.");
      return;
    }

    const toastId = toast.loading("Adding coupon to database...");
    const upperCode = code.trim().toUpperCase();

    // Check if code already exists locally
    if (coupons.some((c) => c.code === upperCode)) {
      toast.dismiss(toastId);
      toast.error(`Coupon "${upperCode}" already exists.`);
      return;
    }

    try {
      const couponData = {
        code: upperCode,
        type,
        value: type === "free_delivery" ? 0 : value,
        minPurchase,
        expiresAt: expiresAt || "",
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "coupons"), couponData);
      setCoupons((prev) =>
        [
          {
            id: docRef.id,
            ...couponData,
          },
          ...prev,
        ]
      );

      toast.dismiss(toastId);
      toast.success(`Coupon "${upperCode}" added successfully.`);
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      toast.dismiss(toastId);
      const isAuthed = !!auth.currentUser;
      const authEmail = auth.currentUser?.email || "N/A";
      toast.error(
        `${err.message || "Failed to add coupon."} (Authenticated: ${isAuthed}, User: ${authEmail})`
      );
    }
  };

  const handleDeleteCoupon = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the coupon "${name}"?`)) return;

    const toastId = toast.loading("Deleting coupon from database...");
    try {
      await deleteDoc(doc(db, "coupons", id));
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.dismiss(toastId);
      toast.success(`Coupon "${name}" deleted successfully.`);
    } catch (err: any) {
      toast.dismiss(toastId);
      const isAuthed = !!auth.currentUser;
      const authEmail = auth.currentUser?.email || "N/A";
      toast.error(
        `${err.message || "Failed to delete coupon."} (Authenticated: ${isAuthed}, User: ${authEmail})`
      );
    }
  };

  const resetForm = () => {
    setCode("");
    setType("percentage");
    setValue(10);
    setMinPurchase(0);
    setExpiresAt("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Coupons</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-widest cursor-pointer hover:bg-foreground/90 transition"
        >
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground animate-pulse">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="rounded-full bg-secondary/50 p-4 mb-4">
            <Tag className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-serif text-xl mb-1">No coupons available</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Create discount codes and promotional campaigns to drive sales and customer loyalty.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((c) => (
            <Card key={c.id} className="p-6 border border-border relative group">
              <button
                onClick={() => handleDeleteCoupon(c.id, c.code)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-rose-600 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                title="Delete Coupon"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="font-serif text-2xl text-gold tracking-wide">{c.code}</div>
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                {c.type === "percentage"
                  ? `${c.value}% off`
                  : c.type === "free_delivery"
                    ? "Free Delivery"
                    : `₹${c.value} off`}
              </p>
              {c.minPurchase > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Min Purchase: ₹{c.minPurchase}
                </p>
              )}
              <div className="mt-6 flex justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                <span className="text-emerald-600 font-medium">Active</span>
                <span>{c.expiresAt ? `Expires ${c.expiresAt}` : "No expiry"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-background border border-border w-full max-w-md rounded-lg shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl">New Coupon</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:text-gold transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <Field
                label="Coupon Code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="E.G. FESTIVAL50"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground text-[10px]">Discount Type</span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="mt-1.5 block w-full bg-transparent border border-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                </div>
                {type !== "free_delivery" ? (
                  <Field
                    label={type === "percentage" ? "Discount Percentage" : "Discount Value (INR)"}
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    min={1}
                    required
                  />
                ) : (
                  <Field
                    label="Discount Value"
                    type="text"
                    value="Waived Shipping"
                    disabled
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Min Purchase (INR)"
                  type="number"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(Number(e.target.value))}
                  min={0}
                />
                <Field
                  label="Expiry Date"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="border border-border px-5 py-2.5 text-xs uppercase tracking-widest hover:border-foreground transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-foreground/90 transition cursor-pointer"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground text-[10px]">{label}</span>
      <input
        {...props}
        className="mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-2.5 text-sm focus:outline-none focus:border-foreground"
      />
    </label>
  );
}
