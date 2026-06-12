import { createServerFn } from "@tanstack/react-start";
import { db, auth } from "../../src/lib/firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, limit } from "firebase/firestore";
import { z } from "zod";
import { products as mockProducts } from "../../src/lib/products";

// 1. Core query operations (client-safe implementation)
async function getDbProductImpl(slug: string) {
  try {
    const q = query(collection(db, "products"), where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      const mockP = mockProducts.find((p) => p.slug === slug);
      return mockP || null;
    }
    const docSnap = snapshot.docs[0];
    const r = docSnap.data();
    return {
      id: docSnap.id,
      ...r,
    } as any;
  } catch (e) {
    console.error("Failed to query product from database, falling back to mock data:", e);
    const mockP = mockProducts.find((p) => p.slug === slug);
    return mockP || null;
  }
}

async function getDbProductsImpl() {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    if (snapshot.empty) {
      // If we are in the browser and the admin is authenticated, silently seed the empty Firestore database
      if (typeof window !== "undefined" && auth.currentUser) {
        console.log("Firestore database is empty. Silently seeding default products from browser admin session...");
        for (const p of mockProducts) {
          const docRef = doc(db, "products", p.id);
          await setDoc(docRef, {
            slug: p.slug,
            name: p.name,
            tagline: p.tagline,
            price: p.price,
            compareAt: p.compareAt || null,
            image: p.image,
            gallery: p.gallery,
            category: p.category,
            subCategory: p.subCategory,
            rating: p.rating,
            reviews: p.reviews,
            stock: p.stock,
            badge: p.badge || null,
            variants: p.variants || null,
            description: p.description,
            createdAt: Date.now(),
          });
        }
        console.log("Firestore database seeded successfully from browser.");
        const refetched = await getDocs(collection(db, "products"));
        return refetched.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as any[];
      }
      return mockProducts;
    }
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as any[];
  } catch (e) {
    console.error("Failed to query products from database, falling back to mock data:", e);
    return mockProducts;
  }
}

async function updateProductInDbImpl(data: any) {
  try {
    const docRef = doc(db, "products", data.id);
    await updateDoc(docRef, {
      name: data.name,
      tagline: data.tagline,
      price: data.price,
      stock: data.stock,
      category: data.category,
      subCategory: data.subCategory,
      description: data.description,
    });

    const idx = mockProducts.findIndex((p) => p.id === data.id);
    if (idx !== -1) {
      mockProducts[idx] = {
        ...mockProducts[idx],
        name: data.name,
        tagline: data.tagline,
        price: data.price,
        stock: data.stock,
        category: data.category,
        subCategory: data.subCategory,
        description: data.description,
      };
    }
    return { success: true };
  } catch (e) {
    console.error("Failed to update product in database:", e);
    return { success: false, error: String(e) };
  }
}

async function addProductInDbImpl(data: any) {
  try {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const image = "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=300"; // placeholder
    const gallery = [image];

    const docRef = doc(db, "products", data.id);
    const newProductData = {
      slug,
      name: data.name,
      tagline: data.tagline,
      price: data.price,
      compareAt: null,
      image,
      gallery,
      category: data.category,
      subCategory: data.subCategory,
      rating: 5.0,
      reviews: 0,
      stock: data.stock,
      badge: null,
      variants: null,
      description: data.description,
      createdAt: Date.now(),
    };
    await setDoc(docRef, newProductData);

    const newProduct = {
      id: data.id,
      ...newProductData,
      compareAt: undefined,
      badge: undefined,
      variants: undefined,
    };
    mockProducts.unshift(newProduct as any);

    return { success: true, product: newProduct };
  } catch (e) {
    console.error("Failed to insert product in database:", e);
    return { success: false, error: String(e) };
  }
}

async function deleteProductFromDbImpl(id: string) {
  try {
    const docRef = doc(db, "products", id);
    await deleteDoc(docRef);

    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx !== -1) {
      mockProducts.splice(idx, 1);
    }
    return { success: true };
  } catch (e) {
    console.error("Failed to delete product from database:", e);
    return { success: false, error: String(e) };
  }
}

// 2. Server functions (called during SSR / Prerendering)
const getDbProductServer = createServerFn({ method: "GET" })
  .inputValidator(z.string())
  .handler(async ({ data: slug }) => getDbProductImpl(slug));

const getDbProductsServer = createServerFn({ method: "GET" })
  .handler(async () => getDbProductsImpl());

const updateProductInDbServer = createServerFn({ method: "POST" })
  .inputValidator(z.any())
  .handler(async ({ data }) => updateProductInDbImpl(data));

const addProductInDbServer = createServerFn({ method: "POST" })
  .inputValidator(z.any())
  .handler(async ({ data }) => addProductInDbImpl(data));

const deleteProductFromDbServer = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .handler(async ({ data: id }) => deleteProductFromDbImpl(id));

// 3. Isomorphic handlers (runs directly on client if in browser, calls server function if not)
export const getDbProduct = async (arg: { data: string }) => {
  if (typeof window !== "undefined") {
    return getDbProductImpl(arg.data);
  }
  return getDbProductServer(arg);
};

export const getDbProducts = async () => {
  if (typeof window !== "undefined") {
    return getDbProductsImpl();
  }
  return getDbProductsServer();
};

export const updateProductInDb = async (arg: { data: any }) => {
  if (typeof window !== "undefined") {
    return updateProductInDbImpl(arg.data);
  }
  return updateProductInDbServer(arg);
};

export const addProductInDb = async (arg: { data: any }) => {
  if (typeof window !== "undefined") {
    return addProductInDbImpl(arg.data);
  }
  return addProductInDbServer(arg);
};

export const deleteProductFromDb = async (arg: { data: string }) => {
  if (typeof window !== "undefined") {
    return deleteProductFromDbImpl(arg.data);
  }
  return deleteProductFromDbServer(arg);
};
