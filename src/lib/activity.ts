import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export type UserActivity = {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
};

export type StorageCustomer = {
  name: string;
  email: string;
  orders: number;
  spent: number;
  city: string;
};

export type StorageOrder = {
  id: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  status: string;
  date: string;
  orderDetails?: {
    id: string;
    slug?: string;
    name: string;
    price: number;
    image?: string;
    qty: number;
    variant?: string;
  }[];
  phone?: string;
  gstin?: string;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    pinCode: string;
  };
};

const LOG_KEY = "saanjh_user_activities";

export const logUserActivity = (action: string, details: string) => {
  if (typeof window === "undefined") return;
  try {
    const sessionRaw = localStorage.getItem("saanjh_user_session");
    let user = "Anonymous Guest";
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      if (session && session.name) {
        user = session.name;
      } else if (session && session.email) {
        user = session.email;
      }
    }

    const newActivity: UserActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      user,
      action,
      details,
      timestamp: new Date().toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }) + `, ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
    };

    const existingRaw = localStorage.getItem(LOG_KEY);
    const existing: UserActivity[] = existingRaw ? JSON.parse(existingRaw) : [];
    
    // Store up to 100 latest actions
    localStorage.setItem(LOG_KEY, JSON.stringify([newActivity, ...existing].slice(0, 100)));
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
};

export const registerCustomer = (name: string, email: string, city = "Online") => {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("saanjh_customers_list");
    const list: StorageCustomer[] = raw ? JSON.parse(raw) : [];
    
    const exists = list.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (!exists) {
      const newCustomer: StorageCustomer = {
        name,
        email,
        orders: 0,
        spent: 0,
        city
      };
      localStorage.setItem("saanjh_customers_list", JSON.stringify([newCustomer, ...list]));
    }
  } catch (e) {
    console.error("Failed to register customer:", e);
  }
};

export const registerOrder = (
  email: string,
  name: string,
  itemsCount: number,
  total: number,
  city = "Online",
  customOrderId?: string,
  orderDetails?: any[],
  shippingDetails?: {
    address: string;
    city: string;
    state: string;
    pinCode: string;
    phone: string;
    gstin?: string;
  }
) => {
  if (typeof window === "undefined") return;
  try {
    // 1. Add Order
    const rawOrders = localStorage.getItem("saanjh_orders_list");
    const ordersList: StorageOrder[] = rawOrders ? JSON.parse(rawOrders) : [];
    
    const orderId = customOrderId || `LUM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: StorageOrder = {
      id: orderId,
      customer: name,
      email: email,
      items: itemsCount,
      total,
      status: "Processing",
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      orderDetails: orderDetails || [],
      phone: shippingDetails?.phone || "",
      gstin: shippingDetails?.gstin || "",
      shippingAddress: shippingDetails ? {
        address: shippingDetails.address,
        city: shippingDetails.city,
        state: shippingDetails.state,
        pinCode: shippingDetails.pinCode
      } : undefined
    };
    
    localStorage.setItem("saanjh_orders_list", JSON.stringify([newOrder, ...ordersList]));

    // 2. Save to Cloud Firestore
    setDoc(doc(db, "orders", orderId), {
      ...newOrder,
      createdAt: Date.now()
    }).catch((fsError) => {
      console.warn("Failed to save order to Firestore:", fsError);
    });
    
    // 2. Update/Add Customer stats
    const rawCustomers = localStorage.getItem("saanjh_customers_list");
    let customersList: StorageCustomer[] = rawCustomers ? JSON.parse(rawCustomers) : [];
    
    const existingIndex = customersList.findIndex((c) => c.email.toLowerCase() === email.toLowerCase());
    if (existingIndex !== -1) {
      customersList[existingIndex] = {
        ...customersList[existingIndex],
        orders: customersList[existingIndex].orders + 1,
        spent: customersList[existingIndex].spent + total,
        city: city !== "Online" ? city : customersList[existingIndex].city
      };
    } else {
      const newCustomer: StorageCustomer = {
        name,
        email,
        orders: 1,
        spent: total,
        city
      };
      customersList = [newCustomer, ...customersList];
    }
    localStorage.setItem("saanjh_customers_list", JSON.stringify(customersList));
  } catch (e) {
    console.error("Failed to register order:", e);
  }
};

export const backfillFromActivities = () => {
  if (typeof window === "undefined") return;
  try {
    const rawAct = localStorage.getItem("saanjh_user_activities");
    if (!rawAct) return;
    const activities: UserActivity[] = JSON.parse(rawAct);

    const rawCust = localStorage.getItem("saanjh_customers_list");
    const customersList: StorageCustomer[] = rawCust ? JSON.parse(rawCust) : [];

    const rawOrders = localStorage.getItem("saanjh_orders_list");
    const ordersList: StorageOrder[] = rawOrders ? JSON.parse(rawOrders) : [];

    // Reverse to process oldest activities first so registration order is correct
    const reversedActivities = [...activities].reverse();

    reversedActivities.forEach((act) => {
      // 1. Backfill Customers
      if (act.action === "User Login" || act.action === "User Signup") {
        const match = act.details.match(/(?:as|for)\s+([^(]+)\s*\(([^)]+)\)/i);
        if (match) {
          const name = match[1].trim();
          const email = match[2].trim();
          const exists = customersList.find((c) => c.email.toLowerCase() === email.toLowerCase());
          if (!exists) {
            customersList.push({
              name,
              email,
              orders: 0,
              spent: 0,
              city: "Online"
            });
          }
        }
      }

      // 2. Backfill Orders
      if (act.action === "Place Order (COD)" || act.action === "Place Order (Razorpay)") {
        const totalMatch = act.details.match(/total\s+₹([\d,]+)/i);
        if (totalMatch) {
          const totalStr = totalMatch[1].replace(/,/g, "");
          const totalVal = parseFloat(totalStr);
          const timestamp = act.timestamp;
          const orderDate = timestamp.split(",")[1]?.trim() || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          
          const exists = ordersList.find((o) => o.total === totalVal && o.date === orderDate);
          if (!exists) {
             const orderId = `LUM-${Math.floor(1000 + Math.random() * 9000)}`;
            ordersList.unshift({
              id: orderId,
              customer: act.user,
              email: `${act.user.toLowerCase().replace(/\s+/g, "")}@example.com`,
              items: 1, // default fallback
              total: totalVal,
              status: "Processing",
              date: orderDate
            });

            // Update customer totals
            const cust = customersList.find((c) => c.name.toLowerCase() === act.user.toLowerCase());
            if (cust) {
              cust.orders += 1;
              cust.spent += totalVal;
            } else {
              // Create guest customer
              customersList.unshift({
                name: act.user,
                email: `${act.user.toLowerCase()}@example.com`,
                orders: 1,
                spent: totalVal,
                city: "Online"
              });
            }
          }
        }
      }
    });

    localStorage.setItem("saanjh_customers_list", JSON.stringify(customersList));
    localStorage.setItem("saanjh_orders_list", JSON.stringify(ordersList));
  } catch (e) {
    console.error("Failed to backfill activities:", e);
  }
};

