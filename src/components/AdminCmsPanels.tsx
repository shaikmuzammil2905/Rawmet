"use client";

import React, { useState } from "react";
import { Edit2, FileUp, Plus, Save, Trash2, X } from "lucide-react";
import type {
  AboutContent,
  CategoryRecord,
  ContactSettings,
  HeroSlide,
  LaunchingOfferContent,
  SubcategoryRecord,
  SubscriptionPlanRecord,
} from "@/lib/types";
import { useToast } from "./ToastProvider";

export function AdminCategoriesPanel({
  categories,
  subcategories,
  onRefresh,
}: {
  categories: CategoryRecord[];
  subcategories: Array<SubcategoryRecord & { category_name?: string; category_type?: string }>;
  onRefresh: () => void;
}) {
  const { showToast } = useToast();
  const [type, setType] = useState<"product" | "machinery" | "service">("product");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("/images/cat-products.png");
  const [uploading, setUploading] = useState(false);

  // Subcategory form
  const [subCatId, setSubCatId] = useState<number>(categories[0]?.id || 1);
  const [subName, setSubName] = useState("");

  // Edit category modal
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState("");

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setter(data.url);
        showToast("Category image uploaded successfully!", "success");
      } else {
        showToast(data.error || "Image upload failed.", "error");
      }
    } catch {
      showToast("Network error uploading image.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "category", type, name, description: desc, imageUrl }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok) {
      showToast("Category added live to website!", "success");
      setName("");
      setDesc("");
      setImageUrl("/images/cat-products.png");
      onRefresh();
    } else {
      showToast(out.error || "Failed to add category.", "error");
    }
  }

  async function saveCategoryEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory) return;
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "category",
        id: editingCategory.id,
        name: editName,
        description: editDesc,
        imageUrl: editImage,
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok) {
      showToast("Category updated live on website!", "success");
      setEditingCategory(null);
      onRefresh();
    } else {
      showToast(out.error || "Failed to update category.", "error");
    }
  }

  async function addSubcategory(e: React.FormEvent) {
    e.preventDefault();
    const chosenCatId = Number(subCatId || categories[0]?.id || 0);
    if (!chosenCatId) {
      showToast("Please select a parent category.", "error");
      return;
    }
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "subcategory", categoryId: chosenCatId, name: subName }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.ok) {
      showToast("Subcategory added!", "success");
      setSubName("");
      onRefresh();
    } else {
      showToast(out.error || "Failed to add subcategory.", "error");
    }
  }

  async function deleteItem(kind: "category" | "subcategory", id: number) {
    if (!confirm(`Are you sure you want to delete this ${kind}?`)) return;
    const res = await fetch(`/api/admin/categories?kind=${kind}&id=${id}`, { method: "DELETE" });
    const out = await res.json().catch(() => ({}));
    if (res.ok) {
      showToast(`${kind === "category" ? "Category" : "Subcategory"} deleted.`, "info");
      onRefresh();
    } else {
      showToast(out.error || `Failed to delete ${kind}.`, "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Section */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[#0a2458]">Marketplace Categories ({categories.length})</h3>
            <span className="text-xs text-slate-500 font-semibold">Live in main navigation</span>
          </div>

          {/* Add Category Form */}
          <form onSubmit={addCategory} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-[#0a2458] flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-[#f97316]" /> Add New Category
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "product" | "machinery" | "service")}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800"
              >
                <option value="product">Product Category</option>
                <option value="machinery">Industry Category</option>
                <option value="service">Service Category</option>
              </select>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category Name (e.g. Rubber)"
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800"
              />
            </div>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Category short description"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800"
            />
            {/* Image upload */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-white bg-slate-100 transition-colors">
                <FileUp className="h-3.5 w-3.5 text-[#f97316]" />
                <span>{uploading ? "Uploading to S3..." : "Upload Category Image"}</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(e) => handleImageUpload(e, setImageUrl)}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs bg-white"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2 text-xs font-bold shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save & Publish Category</span>
            </button>
          </form>

          {/* Past Categories List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto divide-y divide-slate-100 text-xs pr-1">
            {categories.map((c) => (
              <div key={c.id} className="pt-2.5 pb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={c.image_url || "/images/cat-products.png"}
                    alt={c.name}
                    className="h-9 w-9 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="uppercase font-bold text-[10px] text-[#f97316] bg-orange-50 px-1.5 py-0.5 rounded">
                        {c.type}
                      </span>
                      <strong className="text-[#0a2458] truncate">{c.name}</strong>
                    </div>
                    {c.description && <p className="text-[11px] text-slate-500 truncate max-w-xs">{c.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(c);
                      setEditName(c.name);
                      setEditDesc(c.description || "");
                      setEditImage(c.image_url || "");
                    }}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem("category", c.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories Section */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[#0a2458]">Subcategories ({subcategories.length})</h3>
            <span className="text-xs text-slate-500 font-semibold">Filters & catalog hierarchy</span>
          </div>

          {/* Add Subcategory Form */}
          <form onSubmit={addSubcategory} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-[#0a2458] flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-[#f97316]" /> Add New Subcategory
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={subCatId}
                onChange={(e) => setSubCatId(Number(e.target.value))}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="Subcategory Name"
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-5 py-2 text-xs font-bold shadow transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Subcategory</span>
            </button>
          </form>

          {/* Past Subcategories List */}
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto divide-y divide-slate-100 text-xs pr-1">
            {subcategories.map((s) => (
              <div key={s.id} className="pt-2 pb-1.5 flex items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400 font-semibold mr-1.5">[{s.category_name}]:</span>
                  <strong className="text-[#0a2458]">{s.name}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => deleteItem("subcategory", s.id)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Subcategory"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-[#0a2458] text-base">Edit Category</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveCategoryEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Image</label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-slate-50 bg-slate-100">
                    <FileUp className="h-3.5 w-3.5 text-[#f97316]" />
                    <span>Upload Image to S3</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={(e) => handleImageUpload(e, setEditImage)}
                      className="hidden"
                    />
                  </label>
                  {editImage && (
                    <img
                      src={editImage}
                      alt="Preview"
                      className="h-8 w-8 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                </div>
                <input
                  type="text"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  placeholder="Image URL"
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2 font-bold text-xs shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminPlansPanel({
  plans,
  onRefresh,
}: {
  plans: SubscriptionPlanRecord[];
  onRefresh: () => void;
}) {
  const { showToast } = useToast();
  const [edits, setEdits] = useState<
    Record<
      number,
      {
        price_inr: number;
        badge_text: string;
        highlight_text: string;
        listing_allowance: number;
      }
    >
  >(() =>
    Object.fromEntries(
      plans.map((p) => [
        p.id,
        {
          price_inr: p.price_inr,
          badge_text: p.badge_text,
          highlight_text: p.highlight_text,
          listing_allowance: p.listing_allowance || 10,
        },
      ])
    )
  );

  async function savePlan(id: number) {
    const e = edits[id];
    const res = await fetch("/api/admin/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...e }),
    });
    if (res.ok) {
      showToast("Subscription plan updated dynamically on live website!", "success");
      onRefresh();
    } else {
      showToast("Failed to save plan changes.", "error");
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((p) => {
        const current = edits[p.id] || {
          price_inr: p.price_inr,
          badge_text: p.badge_text,
          highlight_text: p.highlight_text,
          listing_allowance: p.listing_allowance || 10,
        };
        return (
          <div key={p.id} className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-extrabold text-[#f97316] bg-orange-50 px-2 py-0.5 rounded">
                Plan #{p.id}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">{p.slug}</span>
            </div>
            <h4 className="font-extrabold text-sm text-[#0a2458]">{p.name}</h4>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Price (INR)</label>
                <input
                  type="number"
                  value={current.price_inr}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      [p.id]: { ...current, price_inr: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Listing Allowance</label>
                <input
                  type="number"
                  value={current.listing_allowance}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      [p.id]: { ...current, listing_allowance: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Badge Text</label>
                <input
                  type="text"
                  value={current.badge_text}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      [p.id]: { ...current, badge_text: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Highlight Text</label>
                <input
                  type="text"
                  value={current.highlight_text}
                  onChange={(e) =>
                    setEdits({
                      ...edits,
                      [p.id]: { ...current, highlight_text: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => savePlan(p.id)}
              className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white py-2 text-xs font-bold transition-colors shadow"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Plan</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function AdminGalleryPanel({
  gallery,
  onRefresh,
}: {
  gallery: Array<{ id: number; title: string; category: string; image_url: string; caption: string }>;
  onRefresh: () => void;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Rubber");
  const [imageUrl, setImageUrl] = useState("/images/refinery-plant.png");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  // Edit gallery item
  const [editingItem, setEditingItem] = useState<{
    id: number;
    title: string;
    category: string;
    image_url: string;
    caption: string;
  } | null>(null);

  async function uploadImg(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setter(data.url);
        showToast("Gallery photo uploaded to S3!", "success");
      } else {
        showToast(data.error || "Upload failed.", "error");
      }
    } catch {
      showToast("Error uploading file.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function addGallery(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, imageUrl, caption }),
    });
    if (res.ok) {
      showToast("Gallery item published live!", "success");
      setTitle("");
      setCaption("");
      setImageUrl("/images/refinery-plant.png");
      onRefresh();
    }
  }

  async function deleteGallery(id: number) {
    if (!confirm("Are you sure you want to delete this gallery item?")) return;
    await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
    showToast("Gallery image removed.", "info");
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addGallery} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 max-w-2xl shadow-sm">
        <h3 className="font-extrabold text-[#0a2458] flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#f97316]" /> Add Gallery Image
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Image Title *"
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (Rubber, Plastic, Metals...)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
          />
        </div>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption / Description"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-xs font-bold cursor-pointer hover:bg-slate-50 bg-slate-100">
            <FileUp className="h-4 w-4 text-[#f97316]" />
            <span>{uploading ? "Uploading..." : "Upload Image"}</span>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => uploadImg(e, setImageUrl)}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
          />
          <button
            type="submit"
            className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2 text-xs font-bold shadow transition-colors"
          >
            Publish to Gallery
          </button>
        </div>
      </form>

      {/* Gallery Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gallery.map((g) => (
          <div key={g.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="h-44 bg-slate-100 relative">
                <img src={g.image_url} alt={g.title} className="h-full w-full object-cover" />
                <span className="absolute top-2 left-2 rounded-full bg-[#0a2458]/80 backdrop-blur-sm text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                  {g.category}
                </span>
              </div>
              <div className="p-4">
                <p className="font-extrabold text-sm text-[#0a2458]">{g.title}</p>
                {g.caption && <p className="text-xs text-slate-500 mt-1">{g.caption}</p>}
              </div>
            </div>
            <div className="p-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => deleteGallery(g.id)}
                className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-bold p-1 rounded transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
        {gallery.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No gallery images found. Upload your first gallery photo above.
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminCmsEditor({
  cmsKey,
  initialValue,
  title,
  onSaved,
}: {
  cmsKey: "launching_offer" | "about_content" | "contact_settings" | "hero_slides";
  initialValue: LaunchingOfferContent | AboutContent | ContactSettings | HeroSlide[];
  title: string;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [data, setData] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleS3Upload(
    e: React.ChangeEvent<HTMLInputElement>,
    onUrl: (url: string) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const out = await res.json();
      if (res.ok && out.url) {
        onUrl(out.url);
        showToast("Image uploaded to S3 successfully!", "success");
      } else {
        showToast(out.error || "Upload failed.", "error");
      }
    } catch {
      showToast("Error uploading file.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: cmsKey, value: data }),
      });
      if (res.ok) {
        showToast(`${title} updated live on website!`, "success");
        onSaved();
      } else {
        showToast("Failed to save CMS content.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  if (cmsKey === "launching_offer") {
    const val = data as LaunchingOfferContent;
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6 max-w-2xl space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#0a2458]">{title}</h3>
          <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">Live on /subscriptions</span>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Offer Badge</label>
          <input
            type="text"
            value={val.badge}
            onChange={(e) => setData({ ...val, badge: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Offer Title</label>
          <input
            type="text"
            value={val.title}
            onChange={(e) => setData({ ...val, title: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Offer Subtitle</label>
          <input
            type="text"
            value={val.subtitle}
            onChange={(e) => setData({ ...val, subtitle: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">4th Year FREE Highlight Note</label>
          <input
            type="text"
            value={val.fourthYearFreeNote}
            onChange={(e) => setData({ ...val, fourthYearFreeNote: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Label</label>
          <input
            type="text"
            value={val.ctaText}
            onChange={(e) => setData({ ...val, ctaText: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-2.5 text-xs font-bold shadow transition-all flex items-center gap-1.5"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Publishing to Website..." : "Save & Publish Offer"}</span>
        </button>
      </div>
    );
  }

  if (cmsKey === "about_content") {
    const val = data as AboutContent;
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6 max-w-3xl space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#0a2458]">{title}</h3>
          <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">Live on /about</span>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Headline</label>
          <input
            type="text"
            value={val.headline}
            onChange={(e) => setData({ ...val, headline: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Subheadline</label>
          <input
            type="text"
            value={val.subheadline}
            onChange={(e) => setData({ ...val, subheadline: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Executive Summary</label>
          <textarea
            rows={2}
            value={val.summary}
            onChange={(e) => setData({ ...val, summary: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Company Story</label>
          <textarea
            rows={5}
            value={val.fullStory}
            onChange={(e) => setData({ ...val, fullStory: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-6 py-2.5 text-xs font-bold shadow transition-all flex items-center gap-1.5"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Saving to Website..." : "Save About Us Content"}</span>
        </button>
      </div>
    );
  }

  if (cmsKey === "contact_settings") {
    const val = data as ContactSettings;
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6 max-w-2xl space-y-3.5 shadow-sm">
        <h3 className="text-lg font-extrabold text-[#0a2458]">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              value={val.companyName}
              onChange={(e) => setData({ ...val, companyName: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Support Mobile</label>
            <input
              type="text"
              value={val.mobile}
              onChange={(e) => setData({ ...val, mobile: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Connect</label>
            <input
              type="text"
              value={val.whatsapp}
              onChange={(e) => setData({ ...val, whatsapp: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Support Email</label>
            <input
              type="email"
              value={val.email}
              onChange={(e) => setData({ ...val, email: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
          <input
            type="text"
            value={val.address}
            onChange={(e) => setData({ ...val, address: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">CA & Statutory Filing Conditions Note</label>
          <textarea
            rows={2}
            value={val.conditionsApplyNote}
            onChange={(e) => setData({ ...val, conditionsApplyNote: e.target.value })}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-6 py-2.5 text-xs font-bold shadow transition-all flex items-center gap-1.5"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>
    );
  }

  // Hero slides banner manager
  const slides = data as HeroSlide[];
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-[#0a2458]">{title}</h3>
        <span className="text-xs text-slate-500 font-bold">Homepage Dynamic Carousel</span>
      </div>
      {slides.map((s, idx) => (
        <div key={s.id} className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
          <p className="text-xs font-black uppercase text-[#f97316]">Slide #{idx + 1}</p>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Headline Prefix</label>
            <input
              type="text"
              value={s.headlinePrefix}
              onChange={(e) => {
                const next = [...slides];
                next[idx] = { ...s, headlinePrefix: e.target.value };
                setData(next);
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Headline Highlight</label>
              <input
                type="text"
                value={s.headlineHighlight}
                onChange={(e) => {
                  const next = [...slides];
                  next[idx] = { ...s, headlineHighlight: e.target.value };
                  setData(next);
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Subcategories Ticker Line</label>
              <input
                type="text"
                value={s.subcategoriesLine}
                onChange={(e) => {
                  const next = [...slides];
                  next[idx] = { ...s, subcategoriesLine: e.target.value };
                  setData(next);
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-6 py-2.5 text-xs font-bold shadow transition-all flex items-center gap-1.5"
      >
        <Save className="h-4 w-4" />
        <span>{saving ? "Saving Hero Slides..." : "Save Hero Banners"}</span>
      </button>
    </div>
  );
}
