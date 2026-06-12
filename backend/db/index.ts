import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../../src/lib/firebase";
import { products as mockProducts } from "../../src/lib/products";

export async function initializeDatabase() {
  try {
    const colRef = collection(db, "products");
    const snapshot = await getDocs(colRef);
    const count = snapshot.size;

    if (count === 0) {
      console.log("Firestore database is empty. Seeding mock products...");
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
      console.log("Firestore database seeded successfully.");
    } else {
      // Sync database products to live memory to keep mock list in sync
      const dbProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      mockProducts.length = 0;
      for (const r of dbProducts as any[]) {
        mockProducts.push({
          id: r.id,
          slug: r.slug,
          name: r.name,
          tagline: r.tagline,
          price: r.price,
          compareAt: r.compareAt || undefined,
          image: r.image,
          gallery: r.gallery,
          category: r.category,
          subCategory: r.subCategory,
          rating: r.rating,
          reviews: r.reviews,
          stock: r.stock,
          badge: r.badge || undefined,
          variants: r.variants || undefined,
          description: r.description,
        });
      }
      console.log(`Successfully synced ${mockProducts.length} products from Firestore to live memory.`);
    }
  } catch (error) {
    console.error("Firestore database initialization failed:", error);
  }
}
