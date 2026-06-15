import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Plus, Tag, Trash2, X, Edit2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
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

const emptyForm = {
  code: "",
  type: "percentage" as Coupon["type"],
  value: 10,
  minPurchase: 0,
  expiresAt: "",
};

function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state: null = closed, "add" = adding, Coupon = editing
  const [modal, setModal] = useState<null | "add" | Coupon>(null);

  // Form states
  const [form, setForm] = useState(emptyForm);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Coupon[];
      setCoupons(list);
    } catch (e) {
      console.error("Failed to load coupons:", e);
      toast.error("Failed to load coupons from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setModal("add");
  };

  const openEdit = (c: Coupon) => {
    setForm({ code: c.code, type: c.type, value: c.value, minPurchase: c.minPurchase, expiresAt: c.expiresAt });
    setModal(c);
  };

  const closeModal = () => setModal(null);

  /* ---- CREATE ---- */
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { toast.error("Coupon code is required."); return; }
    if (form.type !== "free_delivery" && form.value <= 0) { toast.error("Discount value must be > 0."); return; }
    if (form.type === "percentage" && form.value > 100) { toast.error("Percentage cannot exceed 100%."); return; }

    const upperCode = form.code.trim().toUpperCase();
    if (coupons.some((c) => c.code === upperCode)) { toast.error(`Coupon "${upperCode}" already exists.`); return; }

    const toastId = toast.loading("Adding coupon…");
    try {
      const data = {
        code: upperCode,
        type: form.type,
        value: form.type === "free_delivery" ? 0 : form.value,
        minPurchase: form.minPurchase,
        expiresAt: form.expiresAt || "",
        createdAt: Date.now(),
      };
      const docRef = await addDoc(collection(db, "coupons"), data);
      setCoupons((prev) => [{ id: docRef.id, ...data }, ...prev]);
      toast.dismiss(toastId);
      toast.success(`Coupon "${upperCode}" created.`);
      closeModal();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`${err.message || "Failed to add coupon."} (Auth: ${!!auth.currentUser})`);
    }
  };

  /* ---- UPDATE ---- */
  const handleEditCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === null || modal === "add") return;
    const editing = modal as Coupon;

    if (form.type !== "free_delivery" && form.value <= 0) { toast.error("Discount value must be > 0."); return; }
    if (form.type === "percentage" && form.value > 100) { toast.error("Percentage cannot exceed 100%."); return; }

    const toastId = toast.loading("Saving changes…");
    try {
      const updates = {
        type: form.type,
        value: form.type === "free_delivery" ? 0 : form.value,
        minPurchase: form.minPurchase,
        expiresAt: form.expiresAt || "",
      };
      await updateDoc(doc(db, "coupons", editing.id), updates);
      setCoupons((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...updates } : c))
      );
      toast.dismiss(toastId);
      toast.success(`Coupon "${editing.code}" updated.`);
      closeModal();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`${err.message || "Failed to update coupon."} (Auth: ${!!auth.currentUser})`);
    }
  };

  /* ---- DELETE ---- */
  const handleDeleteCoupon = async (id: string, name: string) => {
    if (!confirm(`Delete coupon "${name}"?`)) return;
    const toastId = toast.loading("Deleting coupon…");
    try {
      await deleteDoc(doc(db, "coupons", id));
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.dismiss(toastId);
      toast.success(`Coupon "${name}" deleted.`);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(`${err.message || "Failed to delete coupon."} (Auth: ${!!auth.currentUser})`);
    }
  };

  const discountLabel = (c: Coupon) =>
    c.type === "percentage" ? `${c.value}% off`
    : c.type === "free_delivery" ? "Free Delivery"
    : `₹${c.value} off`;

  const isEditing = modal !== null && modal !== "add";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Coupons</h1>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-widest cursor-pointer hover:bg-foreground/90 transition"
        >
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground animate-pulse">Loading coupons…</div>
      ) : coupons.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="rounded-full bg-secondary/50 p-4 mb-4">
            <Tag className="h-8 w-8 text-gold" />
          </div>
          <h3 className="font-serif text-xl mb-1">No coupons available</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Create discount codes and promotional campaigns to drive sales and loyalty.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {coupons.map((c) => (
            <Card key={c.id} className="p-6 border border-border relative group hover:border-foreground/30 transition-colors">
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-gold transition cursor-pointer"
                  title="Edit Coupon"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCoupon(c.id, c.code)}
                  className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-destructive transition cursor-pointer"
                  title="Delete Coupon"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Coupon code */}
              <div className="font-serif text-2xl text-gold tracking-wide pr-16">{c.code}</div>

              {/* Discount value */}
              <p className="mt-2 text-sm text-foreground font-medium">{discountLabel(c)}</p>

              {/* Type badge */}
              <div className="mt-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-0.5">
                  {c.type === "percentage" ? "% Discount"
                    : c.type === "fixed" ? "Fixed ₹ Off"
                    : "Free Delivery"}
                </span>
              </div>

              {c.minPurchase > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Min. purchase: ₹{c.minPurchase}
                </p>
              )}

              <div className="mt-5 flex justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" /> Active
                </span>
                <span>{c.expiresAt ? `Expires ${c.expiresAt}` : "No expiry"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Coupon Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-background border border-border w-full max-w-md rounded-lg shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl">
                {isEditing ? `Edit — ${(modal as Coupon).code}` : "New Coupon"}
              </h2>
              <button onClick={closeModal} className="p-1 hover:text-gold transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={isEditing ? handleEditCoupon : handleAddCoupon} className="space-y-4">

              {/* Code (editable only when creating) */}
              <Field
                label="Coupon Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                placeholder="E.G. FESTIVAL50"
                required
                disabled={isEditing}
              />
              {isEditing && (
                <p className="text-xs text-muted-foreground -mt-2">Coupon code cannot be changed after creation.</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Discount Type */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Discount Type</span>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}
                    className="mt-1.5 block w-full bg-transparent border border-border rounded px-3 py-2.5 text-sm focus:outline-none focus:border-foreground"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                </div>

                {/* Discount Value */}
                {form.type !== "free_delivery" ? (
                  <Field
                    label={form.type === "percentage" ? "Discount %" : "Amount (₹)"}
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    min={1}
                    max={form.type === "percentage" ? 100 : undefined}
                    required
                  />
                ) : (
                  <Field label="Discount Value" type="text" value="Waived Shipping" disabled />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Min Purchase (₹)"
                  type="number"
                  value={form.minPurchase}
                  onChange={(e) => setForm({ ...form, minPurchase: Number(e.target.value) })}
                  min={0}
                />
                <Field
                  label="Expiry Date"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>

              {/* Preview */}
              <div className="bg-secondary/40 rounded-lg p-4 border border-border text-sm space-y-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Preview</p>
                <div className="font-serif text-gold text-lg">{form.code || "CODE"}</div>
                <div className="font-medium">
                  {form.type === "free_delivery" ? "Free Delivery"
                    : form.type === "percentage" ? `${form.value || 0}% off`
                    : `₹${form.value || 0} off`}
                </div>
                {form.minPurchase > 0 && (
                  <div className="text-xs text-muted-foreground">Min. ₹{form.minPurchase} purchase</div>
                )}
                <div className="text-xs text-muted-foreground">
                  {form.expiresAt ? `Expires ${form.expiresAt}` : "No expiry"}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="border border-border px-5 py-2.5 text-xs uppercase tracking-widest hover:border-foreground transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-foreground/90 transition cursor-pointer"
                >
                  {isEditing ? "Save Changes" : "Create Coupon"}
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
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-2.5 text-sm focus:outline-none focus:border-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </label>
  );
}
