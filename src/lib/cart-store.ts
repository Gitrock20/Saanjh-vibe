import { useSyncExternalStore } from "react";
import { logUserActivity } from "./activity";
import { products } from "./products";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  variant?: string;
};

type State = {
  items: CartItem[];
  wishlist: string[];
};

const KEY = "saanjh_cart_v1";

const read = (): State => {
  if (typeof window === "undefined") return { items: [], wishlist: [] };
  try {
    if (!localStorage.getItem("saanjh_user_session")) {
      localStorage.removeItem(KEY);
      return { items: [], wishlist: [] };
    }
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { items: [], wishlist: [] };
  } catch {
    return { items: [], wishlist: [] };
  }
};

let state: State = read();
const listeners = new Set<() => void>();

const persist = () => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const getSnapshot = () => state;
const getServerSnapshot = () => ({ items: [], wishlist: [] });

export const useCart = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export const cart = {
  add(item: Omit<CartItem, "qty">, qty = 1) {
    if (typeof window !== "undefined" && !localStorage.getItem("saanjh_user_session")) {
      toast.error("Please sign in to add items to your cart.");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 800);
      return;
    }
    const existing = state.items.find((i) => i.id === item.id && i.variant === item.variant);
    state = {
      ...state,
      items: existing
        ? state.items.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i))
        : [...state.items, { ...item, qty }],
    };
    persist();
    logUserActivity("Add to Cart", `Added ${qty}x ${item.name} to cart`);
  },
  remove(id: string, variant?: string) {
    const item = state.items.find((i) => i.id === id && i.variant === variant);
    state = { ...state, items: state.items.filter((i) => !(i.id === id && i.variant === variant)) };
    persist();
    if (item) {
      logUserActivity("Remove from Cart", `Removed ${item.name} from cart`);
    }
  },
  setQty(id: string, qty: number, variant?: string) {
    const item = state.items.find((i) => i.id === id && i.variant === variant);
    state = {
      ...state,
      items: state.items
        .map((i) => (i.id === id && i.variant === variant ? { ...i, qty: Math.max(1, qty) } : i))
        .filter((i) => i.qty > 0),
    };
    persist();
    if (item) {
      logUserActivity("Update Cart Qty", `Set quantity of ${item.name} to ${qty}`);
    }
  },
  clear() {
    state = { ...state, items: [] };
    persist();
    logUserActivity("Clear Cart", "Cleared all items from cart");
  },
  toggleWish(id: string) {
    if (typeof window !== "undefined" && !localStorage.getItem("saanjh_user_session")) {
      toast.error("Please sign in to add items to your wishlist.");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 800);
      return;
    }
    const p = products.find((x) => x.id === id);
    const name = p ? p.name : id;
    const isAdding = !state.wishlist.includes(id);

    state = {
      ...state,
      wishlist: state.wishlist.includes(id)
        ? state.wishlist.filter((x) => x !== id)
        : [...state.wishlist, id],
    };
    persist();
    logUserActivity(
      isAdding ? "Add to Wishlist" : "Remove from Wishlist",
      `${isAdding ? "Added" : "Removed"} ${name} ${isAdding ? "to" : "from"} wishlist`
    );
  },
};

