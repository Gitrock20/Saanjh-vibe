import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { cart, useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/products";
import { ShieldCheck, Banknote } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { logUserActivity, registerOrder } from "@/lib/activity";
import { createRazorpayOrder, verifyRazorpayPayment, sendOrderEmail } from "@/lib/api/payment.functions";
import { collection, getDocs, query, where, limit, doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  const { items } = useCart();
  const navigate = useNavigate();
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  // Coupon states
  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

  const shipping = (subtotal > 999 || (appliedCoupon && (appliedCoupon.type === "free_delivery" || appliedCoupon.code === "FREESHIPPING"))) ? 0 : 99;
  const total = Math.max(0, subtotal - discount) + shipping;
  const [pay, setPay] = useState("razorpay");
  const [billingOption, setBillingOption] = useState<"same" | "different">("same");
  const [billingForm, setBillingForm] = useState({ address: "", city: "", state: "", pinCode: "" });
  const [saveInfo, setSaveInfo] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    phone: "",
    gstin: "",
  });

  const [loading, setLoading] = useState(false);

  // Auto-load saved address for logged-in users
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "savedAddress", "default"));
        if (snap.exists()) {
          const data = snap.data();
          setForm(prev => ({
            ...prev,
            email: data.email || user.email || prev.email,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            address: data.address || prev.address,
            city: data.city || prev.city,
            state: data.state || prev.state,
            pinCode: data.pinCode || prev.pinCode,
            phone: data.phone || prev.phone,
            gstin: data.gstin || prev.gstin,
          }));
          setSaveInfo(true); // keep it checked so they know it's saved
        } else if (user.email) {
          setForm(prev => ({ ...prev, email: user.email! }));
        }
      } catch (e) {
        console.warn("Could not load saved address:", e);
      }
    })();
  }, []);

  useEffect(() => {
    // Pre-load Razorpay checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (items.length === 0) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl text-center py-32 px-5">
          <h1 className="font-serif text-3xl">Your bag is empty.</h1>
          <Link to="/shop" className="mt-6 inline-block bg-foreground text-background px-7 py-4 text-xs uppercase tracking-[0.24em]">
            Shop now
          </Link>
        </div>
      </SiteShell>
    );
  }

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;
    const toastId = toast.loading("Checking promo code...");
    const upperCode = promoCode.trim().toUpperCase();

    try {
      const q = query(collection(db, "coupons"), where("code", "==", upperCode), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.dismiss(toastId);
        toast.error("Invalid promo code.");
        return;
      }

      const couponData = snapshot.docs[0].data() as {
        code: string;
        type: "percentage" | "fixed" | "free_delivery";
        value: number;
        minPurchase?: number;
        expiresAt?: string;
      };

      if (couponData.minPurchase && subtotal < couponData.minPurchase) {
        toast.dismiss(toastId);
        toast.error(`This coupon requires a minimum purchase of ₹${couponData.minPurchase}.`);
        return;
      }

      if (couponData.expiresAt) {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (couponData.expiresAt < todayStr) {
          toast.dismiss(toastId);
          toast.error("This promo code has expired.");
          return;
        }
      }

      let discountAmt = 0;
      if (couponData.code === "FREESHIPPING" || couponData.type === "free_delivery") {
        discountAmt = 0;
      } else if (couponData.type === "percentage") {
        discountAmt = Math.round((subtotal * couponData.value) / 100);
      } else if (couponData.type === "fixed") {
        discountAmt = couponData.value;
      }

      if (discountAmt > subtotal) {
        discountAmt = subtotal;
      }

      setAppliedCoupon(couponData);
      setDiscount(discountAmt);
      toast.dismiss(toastId);
      toast.success(`Promo code "${upperCode}" applied successfully!`);
    } catch (e) {
      console.error("Failed to verify coupon:", e);
      toast.dismiss(toastId);
      toast.error("An error occurred while checking promo code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setPromoCode("");
    toast.success("Promo code removed.");
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const customerName = `${form.firstName} ${form.lastName}`.trim();
    const itemsCount = items.reduce((sum, item) => sum + item.qty, 0);

    // Save address to Firestore if user is logged in and opted in
    const saveAddressIfRequested = async () => {
      if (!saveInfo) return;
      const user = auth.currentUser;
      if (!user) return;
      try {
        await setDoc(doc(db, "users", user.uid, "savedAddress", "default"), {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          address: form.address,
          city: form.city,
          state: form.state,
          pinCode: form.pinCode,
          phone: form.phone,
          gstin: form.gstin,
          savedAt: Date.now(),
        });
      } catch (e) {
        console.warn("Could not save address:", e);
      }
    };

    if (pay === "cod") {
      setLoading(true);
      await saveAddressIfRequested();
      const customOrderId = `COD-${Date.now().toString().slice(-6)}`;
      registerOrder(form.email, customerName, itemsCount, total, form.city, customOrderId, items, {
        address: form.address,
        city: form.city,
        state: form.state,
        pinCode: form.pinCode,
        phone: form.phone,
        gstin: form.gstin
      }, orderNote);
      logUserActivity("Place Order (COD)", `Placed order ${customOrderId} for total ${formatINR(total)} via Cash on Delivery`);
      toast.success("Order placed successfully!");

      // Send Order Confirmation Email
      sendOrderEmail({
        data: {
          email: form.email,
          name: customerName,
          orderId: customOrderId,
          amount: total,
          itemsCount: itemsCount,
          status: "success"
        }
      }).catch(err => console.warn("Failed to send COD order confirmation email:", err));

      cart.clear();
      setTimeout(() => {
        setLoading(false);
        navigate({ 
          to: "/order-success", 
          search: { 
            paymentMethod: "cod", 
            amount: total,
            orderId: customOrderId
          } 
        });
      }, 1000);
      return;
    }

    if (pay === "paylink") {
      setLoading(true);
      const paymentLink = (import.meta.env.VITE_RAZORPAY_PAYMENT_LINK as string) || "https://rzp.io/l/saanjh-payment";
      toast.success("Redirecting to Razorpay payment page...");
      registerOrder(form.email, customerName, itemsCount, total, form.city, undefined, items, {
        address: form.address,
        city: form.city,
        state: form.state,
        pinCode: form.pinCode,
        phone: form.phone,
        gstin: form.gstin
      });
      logUserActivity("Place Order (Payment Link Redirect)", `Redirecting to payment link for total ${formatINR(total)}`);
      setTimeout(() => {
        cart.clear();
        setLoading(false);
        window.location.href = paymentLink;
      }, 1500);
      return;
    }

    if (!(window as any).Razorpay) {
      toast.error("Payment gateway is still loading. Please try again in a moment.");
      return;
    }

    setLoading(true);
    await saveAddressIfRequested();
    const toastId = toast.loading("Initiating secure payment order...");

    try {
      const amountInPaise = Math.round(total * 100);
      if (amountInPaise < 100) {
        toast.dismiss(toastId);
        toast.error("Minimum order amount must be at least ₹1.");
        setLoading(false);
        return;
      }

      // 1. Try to create order on the backend
      let orderRes = null;
      try {
        orderRes = await createRazorpayOrder({
          data: {
            amount: amountInPaise,
            currency: "INR",
          },
        });
      } catch (err) {
        console.warn("Backend order creation failed, falling back to client-side checkout:", err);
      }

      const isStaticFallback = !orderRes || !orderRes.success;

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.dismiss(toastId);
        toast.error("Razorpay Key ID is not configured in the client environment.");
        setLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout modal
      const options: any = {
        key: razorpayKey,
        amount: isStaticFallback ? amountInPaise : orderRes?.amount,
        currency: isStaticFallback ? "INR" : orderRes?.currency,
        name: "Saanjh",
        description: "Luxury Candles & Jewellery",
        image: logo,
        handler: async function (response: any) {
          if (isStaticFallback) {
            // Client-side fallback flow (no backend signature verification)
            const paymentId = response.razorpay_payment_id;
            registerOrder(form.email, customerName, itemsCount, total, form.city, paymentId, items, {
              address: form.address,
              city: form.city,
              state: form.state,
              pinCode: form.pinCode,
              phone: form.phone,
              gstin: form.gstin
            }, orderNote);
            logUserActivity(
              "Place Order (Razorpay - Client Fallback)",
              `Placed order ${paymentId} for total ${formatINR(total)} via Razorpay Client Fallback`
            );
            toast.success("Payment successful!");

            // Send Order Confirmation Email
            sendOrderEmail({
              data: {
                email: form.email,
                name: customerName,
                orderId: paymentId,
                amount: total,
                itemsCount: itemsCount,
                status: "success"
              }
            }).catch(err => console.warn("Failed to send Razorpay fallback confirmation email:", err));

            cart.clear();
            setTimeout(() => {
              navigate({ 
                to: "/order-success", 
                search: { 
                  paymentMethod: "razorpay", 
                  amount: total,
                  orderId: paymentId
                } 
              });
            }, 1000);
            setLoading(false);
            return;
          }

          // Secure Backend flow with signature verification
          const verifyToastId = toast.loading("Verifying payment signature...");
          try {
            const verifyRes = await verifyRazorpayPayment({
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            toast.dismiss(verifyToastId);
            if (verifyRes && verifyRes.success) {
              const paymentId = response.razorpay_payment_id;
              registerOrder(form.email, customerName, itemsCount, total, form.city, paymentId, items, {
                address: form.address,
                city: form.city,
                state: form.state,
                pinCode: form.pinCode,
                phone: form.phone,
                gstin: form.gstin
              }, orderNote);
              logUserActivity(
                "Place Order (Razorpay)",
                `Placed order ${paymentId} for total ${formatINR(total)} via Razorpay`
              );
              toast.success("Payment successful!");

              // Send Order Confirmation Email
              sendOrderEmail({
                data: {
                  email: form.email,
                  name: customerName,
                  orderId: paymentId,
                  amount: total,
                  itemsCount: itemsCount,
                  status: "success"
                }
              }).catch(err => console.warn("Failed to send Razorpay confirmation email:", err));

              cart.clear();
              setTimeout(() => {
                navigate({ 
                  to: "/order-success", 
                  search: { 
                    paymentMethod: "razorpay", 
                    amount: total,
                    orderId: paymentId
                  } 
                });
              }, 1000);
            } else {
              toast.error(verifyRes?.error || "Payment signature verification failed. Please contact support.");
            }
          } catch (verifyError: any) {
            toast.dismiss(verifyToastId);
            console.error("Payment verification request failed:", verifyError);
            toast.error("Failed to complete signature verification. Please verify your connection.");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          address: `${form.address}, ${form.city}, ${form.state} - ${form.pinCode}`,
        },
        theme: {
          color: "#b0925a",
        },
        modal: {
          ondismiss: function () {
            toast.warning("Payment cancelled by customer.");
            sendOrderEmail({
              data: {
                email: form.email,
                name: customerName,
                orderId: isStaticFallback ? `FAIL-${Date.now().toString().slice(-6)}` : (orderRes?.order_id || `FAIL-${Date.now().toString().slice(-6)}`),
                amount: total,
                itemsCount: itemsCount,
                status: "failed",
                details: "Payment checkout session was closed by the customer."
              }
            }).catch(err => console.warn("Failed to send payment cancellation email:", err));
            setLoading(false);
          },
        },
      };

      if (!isStaticFallback) {
        options.order_id = orderRes?.order_id;
      }

      toast.dismiss(toastId);
      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        console.error("Razorpay Payment Failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        sendOrderEmail({
          data: {
            email: form.email,
            name: customerName,
            orderId: (response.error.metadata && response.error.metadata.order_id) || `FAIL-${Date.now().toString().slice(-6)}`,
            amount: total,
            itemsCount: itemsCount,
            status: "failed",
            details: response.error.description || "Payment failed or declined by card provider."
          }
        }).catch(err => console.warn("Failed to send payment failure email:", err));
        setLoading(false);
      });

      rzp.open();
    } catch (orderError: any) {
      toast.dismiss(toastId);
      console.error("Order creation request failed:", orderError);
      toast.error("Failed to initiate payment. Please verify your connection or try again.");
      setLoading(false);
    }
  };



  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 lg:px-10 py-12 lg:py-16">
        <h1 className="font-serif text-4xl md:text-5xl mb-10">Checkout</h1>
        <form onSubmit={handlePay} className="grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-12">
            <section>
              <h2 className="font-serif text-xl mb-5">Shipping address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={loading}
                  className="sm:col-span-2"
                />
                <Field
                  label="First name"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  disabled={loading}
                />
                <Field
                  label="Last name"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  disabled={loading}
                />
                <Field
                  label="Address"
                  className="sm:col-span-2"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={loading}
                />
                <Field
                  label="City"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  disabled={loading}
                />
                <Field
                  label="State"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  disabled={loading}
                />
                <Field
                  label="PIN code"
                  required
                  value={form.pinCode}
                  onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                  disabled={loading}
                />
                <Field
                  label="Phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={loading}
                />
                <Field
                  label="GSTIN (optional)"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  disabled={loading}
                />
              </div>

              {/* Save address checkbox */}
              <label className="flex items-center gap-3 mt-5 cursor-pointer select-none group">
                <span className={`relative w-5 h-5 shrink-0 rounded border-2 transition-all flex items-center justify-center ${
                  saveInfo
                    ? "bg-foreground border-foreground"
                    : "border-border group-hover:border-foreground/60 bg-transparent"
                }`}>
                  {saveInfo && (
                    <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    disabled={loading}
                  />
                </span>
                <span className="text-sm">
                  Save this{" "}
                  <span className="text-blue-600 dark:text-blue-400 font-medium">information</span>
                  {" "}for next time
                </span>
                {!auth.currentUser && saveInfo && (
                  <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    ⚠ Log in to save
                  </span>
                )}
              </label>
            </section>

            {/* Order Note section */}
            <section>
              <p className="text-sm font-medium mb-2" style={{ color: "#7a4f2e" }}>Add a note to your order</p>
              <textarea
                rows={3}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                disabled={loading}
                placeholder="Special instructions, gift messages, delivery notes…"
                className="w-full bg-background border border-[#c89b6e] rounded px-4 py-3 text-sm resize-y focus:outline-none focus:border-[#a0723e] transition placeholder:text-muted-foreground/60 disabled:opacity-50"
              />
            </section>
            <section>
              {/* Payment Section Header */}
              <div className="mb-4">
                <h2 className="font-serif text-2xl font-semibold">Payment</h2>
                <p className="text-sm text-emerald-600 flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="h-4 w-4" />
                  All transactions are secure and encrypted.
                </p>
              </div>

              <div className={`space-y-0 rounded-lg border border-border overflow-hidden ${loading ? "opacity-50 pointer-events-none" : ""}`}>

                {/* Razorpay Option */}
                <label
                  className={`flex items-center gap-4 px-4 py-4 cursor-pointer transition ${
                    pay === "razorpay" ? "bg-blue-50/60 dark:bg-blue-950/20 border-b border-border" : "bg-background hover:bg-secondary/30 border-b border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    value="razorpay"
                    checked={pay === "razorpay"}
                    onChange={() => setPay("razorpay")}
                    className="sr-only"
                    disabled={loading}
                  />
                  {/* Custom Radio */}
                  <span className={`w-4.5 h-4.5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    pay === "razorpay" ? "border-foreground" : "border-muted-foreground/50"
                  }`}>
                    {pay === "razorpay" && <span className="w-2 h-2 rounded-full bg-foreground" />}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      Razorpay Secure (UPI, Cards, Int'l Cards, Wallets)
                    </span>
                  </div>
                  {/* Payment brand icons */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {/* UPI */}
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide bg-[#097939] text-white" style={{fontFamily: 'sans-serif'}}>UPI</span>
                    {/* VISA */}
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1a1f71] text-white" style={{fontFamily: 'serif', letterSpacing: '0.05em'}}>VISA</span>
                    {/* Mastercard */}
                    <span className="inline-flex items-center justify-center rounded overflow-hidden">
                      <svg width="28" height="18" viewBox="0 0 38 24">
                        <circle cx="15" cy="12" r="10" fill="#EB001B" />
                        <circle cx="23" cy="12" r="10" fill="#F79E1B" />
                        <path d="M19 5.5a10 10 0 010 13A10 10 0 0119 5.5z" fill="#FF5F00" />
                      </svg>
                    </span>
                    {/* +17 badge */}
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-semibold">+17</span>
                  </div>
                </label>

                {/* Info banner when Razorpay selected */}
                {pay === "razorpay" && (
                  <div className="px-4 py-4 bg-muted/50 text-sm text-muted-foreground text-center">
                    You'll be redirected to Razorpay Secure (UPI, Cards, Int'l Cards, Wallets) to complete your purchase.
                  </div>
                )}

                {/* Cash on Delivery Option */}
                <label
                  className={`flex items-center gap-4 px-4 py-4 cursor-pointer transition ${
                    pay === "cod" ? "bg-amber-50/60 dark:bg-amber-950/20" : "bg-background hover:bg-secondary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    value="cod"
                    checked={pay === "cod"}
                    onChange={() => setPay("cod")}
                    className="sr-only"
                    disabled={loading}
                  />
                  <span className={`w-4.5 h-4.5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    pay === "cod" ? "border-foreground" : "border-muted-foreground/50"
                  }`}>
                    {pay === "cod" && <span className="w-2 h-2 rounded-full bg-foreground" />}
                  </span>
                  <Banknote className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                  <span className="text-sm font-medium">Cash on Delivery</span>
                  <span className="ml-auto text-xs text-muted-foreground">Pay when it arrives</span>
                </label>

              </div>

              {pay === "cod" && (
                <div className="mt-3 px-4 py-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-lg text-sm text-amber-800 dark:text-amber-300 text-center">
                  Your order will be shipped and payment collected at the time of delivery.
                </div>
              )}
            </section>

            {/* Billing address section */}
            <section>
              <h2 className="font-serif text-2xl font-semibold mb-4">Billing address</h2>
              <div className={`rounded-lg border border-border overflow-hidden ${loading ? "opacity-50 pointer-events-none" : ""}`}>

                {/* Same as shipping */}
                <label
                  className={`flex items-center gap-4 px-4 py-4 cursor-pointer transition border-b border-border ${
                    billingOption === "same" ? "bg-blue-50/60 dark:bg-blue-950/20" : "bg-background hover:bg-secondary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="billing"
                    value="same"
                    checked={billingOption === "same"}
                    onChange={() => setBillingOption("same")}
                    className="sr-only"
                    disabled={loading}
                  />
                  <span className={`w-4.5 h-4.5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    billingOption === "same" ? "border-foreground" : "border-muted-foreground/50"
                  }`}>
                    {billingOption === "same" && <span className="w-2 h-2 rounded-full bg-foreground" />}
                  </span>
                  <span className="text-sm font-medium">
                    Same as{" "}
                    <span className="text-blue-600 dark:text-blue-400">shipping address</span>
                  </span>
                </label>

                {/* Different billing address */}
                <label
                  className={`flex items-center gap-4 px-4 py-4 cursor-pointer transition ${
                    billingOption === "different" ? "bg-blue-50/60 dark:bg-blue-950/20" : "bg-background hover:bg-secondary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="billing"
                    value="different"
                    checked={billingOption === "different"}
                    onChange={() => setBillingOption("different")}
                    className="sr-only"
                    disabled={loading}
                  />
                  <span className={`w-4.5 h-4.5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    billingOption === "different" ? "border-foreground" : "border-muted-foreground/50"
                  }`}>
                    {billingOption === "different" && <span className="w-2 h-2 rounded-full bg-foreground" />}
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Use a different billing address</span>
                </label>

              </div>

              {/* Expanded billing address fields */}
              {billingOption === "different" && (
                <div className="mt-4 grid sm:grid-cols-2 gap-4 border border-border rounded-lg p-4 bg-muted/20">
                  <Field
                    label="Billing Address"
                    className="sm:col-span-2"
                    required
                    value={billingForm.address}
                    onChange={(e) => setBillingForm({ ...billingForm, address: e.target.value })}
                    disabled={loading}
                  />
                  <Field
                    label="City"
                    required
                    value={billingForm.city}
                    onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                    disabled={loading}
                  />
                  <Field
                    label="State"
                    required
                    value={billingForm.state}
                    onChange={(e) => setBillingForm({ ...billingForm, state: e.target.value })}
                    disabled={loading}
                  />
                  <Field
                    label="PIN Code"
                    required
                    value={billingForm.pinCode}
                    onChange={(e) => setBillingForm({ ...billingForm, pinCode: e.target.value })}
                    disabled={loading}
                  />
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 self-start">
            <div className="bg-secondary/50 border border-border rounded-lg p-6">
              <h2 className="font-serif text-xl mb-4">Your order</h2>
              <ul className="divide-y divide-border max-h-[280px] overflow-auto -mx-2 px-2">
                {items.map((i) => (
                  <li key={i.id + (i.variant ?? "")} className="py-3 flex gap-3 items-center">
                    <div className="relative h-16 w-14 shrink-0 bg-muted rounded overflow-hidden">
                      <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px]">
                        {i.qty}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{i.name}</div>
                      {i.variant && <div className="text-xs text-muted-foreground">{i.variant}</div>}
                    </div>
                    <div className="text-sm font-medium">{formatINR(i.price * i.qty)}</div>
                  </li>
                ))}
              </ul>

              {/* Promo Code Input */}
              <div className="mt-6 pt-6 border-t border-border flex gap-3">
                <input
                  type="text"
                  placeholder="Promo or discount code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={loading || !!appliedCoupon}
                  className="flex-1 bg-transparent border border-border rounded px-3.5 py-3 text-sm uppercase placeholder:normal-case placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
                />
                <button
                  type="button"
                  onClick={appliedCoupon ? handleRemoveCoupon : handleApplyCoupon}
                  disabled={loading || (!promoCode.trim() && !appliedCoupon)}
                  className="bg-foreground text-background px-5 py-3 text-xs uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 transition cursor-pointer"
                >
                  {appliedCoupon ? "Remove" : "Apply"}
                </button>
              </div>

              <dl className="mt-4 space-y-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <dt>Discount ({appliedCoupon?.code})</dt>
                    <dd>-{formatINR(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd></div>
                <div className="flex justify-between font-serif text-lg pt-2 border-t border-border">
                  <dt>Total</dt><dd>{formatINR(total)}</dd>
                </div>
              </dl>
              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-foreground text-background py-4 text-xs uppercase tracking-[0.24em] hover:bg-foreground/90 disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? "Processing..." : `Pay ${formatINR(total)}`}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </SiteShell>
  );
}

function Field({ label, className = "", ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-3 text-sm focus:outline-none focus:border-foreground transition"
      />
    </label>
  );
}
