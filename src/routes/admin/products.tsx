import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { formatINR, type Product } from "@/lib/products";
import { Plus, Search, Edit2, Trash2, X, Upload, ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { updateProductInDb, addProductInDb, deleteProductFromDb, getDbProducts } from "@/lib/api/products.functions";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/admin/products")({
  loader: async () => {
    const products = await getDbProducts();
    return { products };
  },
  component: AdminProducts,
});

function AdminProducts() {
  const { products } = Route.useLoaderData();
  const [list, setList] = useState<Product[]>(products);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);

  // Form states for adding/editing
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [category, setCategory] = useState<"candles" | "jewellery">("candles");
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredList = list.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setTagline(p.tagline);
    setPrice(p.price);
    setStock(p.stock);
    setCategory(p.category);
    setSubCategory(p.subCategory);
    setDescription(p.description);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const toastId = toast.loading("Saving changes to database...");
    const res = await updateProductInDb({
      data: {
        id: editingProduct.id,
        name,
        tagline,
        price,
        stock,
        category,
        subCategory,
        description,
      },
    });

    toast.dismiss(toastId);
    if (res.success) {
      setList((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
              ...p,
              name,
              tagline,
              price,
              stock,
              category,
              subCategory,
              description,
            }
            : p
        )
      );
      toast.success(`Product "${name}" updated successfully.`);
      setEditingProduct(null);
    } else {
      const isAuthed = !!auth.currentUser;
      const authEmail = auth.currentUser?.email || "N/A";
      toast.error(`${res.error || "Failed to update product details."} (Authenticated: ${isAuthed}, User: ${authEmail})`);
    }
  };

  const startAdd = () => {
    setAddingProduct(true);
    setName("");
    setTagline("");
    setPrice(1000);
    setStock(10);
    setCategory("candles");
    setSubCategory("Soy Candles");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = imagePreview || "";

    // If no image selected, use a default placeholder
    if (!imageUrl) {
      imageUrl = "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=600";
    }

    const toastId = toast.loading("Adding product to database...");
    const newId = `custom_${Date.now()}`;
    const res = await addProductInDb({
      data: {
        id: newId,
        name,
        tagline,
        price,
        stock,
        category,
        subCategory,
        description,
        imageUrl,
      },
    });

    toast.dismiss(toastId);
    if (res.success && res.product) {
      setList((prev) => [res.product as any, ...prev]);
      toast.success(`Product "${name}" added successfully! It now appears on the home page.`);
      setAddingProduct(false);
      setImageFile(null);
      setImagePreview("");
    } else {
      const isAuthed = !!auth.currentUser;
      const authEmail = auth.currentUser?.email || "N/A";
      toast.error(`${res.error || "Failed to create new product."} (Authenticated: ${isAuthed}, User: ${authEmail})`);
    }
  };

  const handleDelete = async (id: string, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      const toastId = toast.loading("Deleting product from database...");
      const res = await deleteProductFromDb({ data: id });

      toast.dismiss(toastId);
      if (res.success) {
        setList((prev) => prev.filter((p) => p.id !== id));
        toast.success(`Product "${productName}" removed.`);
      } else {
        const isAuthed = !!auth.currentUser;
        const authEmail = auth.currentUser?.email || "N/A";
        toast.error(`${res.error || "Failed to delete product."} (Authenticated: ${isAuthed}, User: ${authEmail})`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{filteredList.length} items</p>
        </div>
        <button
          onClick={startAdd}
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-foreground/90 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 border border-border rounded px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 hidden md:table-cell">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3 hidden md:table-cell">Stock</th>
              <th className="px-4 py-3 hidden lg:table-cell">Rating</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filteredList.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="h-12 w-10 rounded object-cover" />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.tagline}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell capitalize">{p.category}</td>
                <td className="px-4 py-3">{formatINR(p.price)}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={p.stock < 10 ? "text-destructive" : ""}>{p.stock}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">{p.rating} ★</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEdit(p)} className="p-2 hover:text-gold cursor-pointer" aria-label="Edit">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="p-2 hover:text-destructive cursor-pointer" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingProduct(null)} />
          <div className="relative bg-background border border-border w-full max-w-lg rounded-lg shadow-2xl p-6 overflow-y-auto max-h-[90vh] fade-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl">Edit Product</h2>
              <button onClick={() => setEditingProduct(null)} className="p-1 hover:text-gold transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <Field label="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Field label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (INR)" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
                <Field label="Stock" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground text-[10px]">Category</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="mt-1.5 block w-full bg-transparent border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                  >
                    <option value="candles">Candles</option>
                    <option value="jewellery">Jewellery</option>
                  </select>
                </div>
                <Field label="Subcategory" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} required />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground text-[10px]">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-3 text-sm focus:outline-none focus:border-foreground"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="border border-border px-5 py-2.5 text-xs uppercase tracking-widest hover:border-foreground transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-foreground/90 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {addingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddingProduct(false)} />
          <div className="relative bg-background border border-border w-full max-w-lg rounded-lg shadow-2xl p-6 overflow-y-auto max-h-[90vh] fade-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl">Add Product</h2>
              <button onClick={() => setAddingProduct(false)} className="p-1 hover:text-gold transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Image Upload Section */}
              <div>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Product Image</span>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-1.5 relative border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                    imagePreview
                      ? "border-foreground/40 bg-transparent"
                      : "border-border hover:border-foreground/40 hover:bg-secondary/20"
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="text-white text-center">
                          <Upload className="h-6 w-6 mx-auto mb-1" />
                          <p className="text-xs font-medium">Click to change image</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(ev) => { ev.stopPropagation(); setImageFile(null); setImagePreview(""); }}
                        className="absolute top-2 right-2 bg-background/80 hover:bg-background text-foreground rounded-full p-1 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="rounded-full bg-secondary/60 p-3">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">Click to upload product image</p>
                      <p className="text-xs">JPG, PNG, WebP — max 5MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <Field label="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Field label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (INR)" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
                <Field label="Stock" type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground text-[10px]">Category</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="mt-1.5 block w-full bg-transparent border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                  >
                    <option value="candles">Candles</option>
                    <option value="jewellery">Jewellery</option>
                  </select>
                </div>
                <Field label="Subcategory" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} required />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground text-[10px]">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-3 text-sm focus:outline-none focus:border-foreground"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddingProduct(false)}
                  className="border border-border px-5 py-2.5 text-xs uppercase tracking-widest hover:border-foreground transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-foreground/90 transition cursor-pointer"
                >
                  Create Product
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
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1.5 block w-full bg-transparent border border-border rounded px-3.5 py-3 text-sm focus:outline-none focus:border-foreground"
      />
    </label>
  );
}
