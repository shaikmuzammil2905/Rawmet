"use client";

import React, { useState } from "react";
import { FileUp, Plus, Save, Trash2 } from "lucide-react";
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
  const [subCatId, setSubCatId] = useState<number>(categories[0]?.id || 1);
  const [subName, setSubName] = useState("");

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "category", type, name, description: desc }),
    });
    if (res.ok) {
      showToast("Category added!", "success");
      setName("");
      setDesc("");
      onRefresh();
    }
  }

  async function addSubcategory(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "subcategory", categoryId: subCatId, name: subName }),
    });
    if (res.ok) {
      showToast("Subcategory added!", "success");
      setSubName("");
      onRefresh();
    }
  }

  async function deleteItem(kind: "category" | "subcategory", id: number) {
    await fetch(`/api/admin/categories?kind=${kind}&id=${id}`, { method: "DELETE" });
    showToast("Deleted.", "info");
    onRefresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <h3 className="font-extrabold text-[#0a2458]">Categories ({categories.length})</h3>
        <form onSubmit={addCategory} className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "product" | "machinery" | "service")}
              className="rounded-lg border px-3 py-2 text-xs bg-white"
            >
              <option value="product">Product</option>
              <option value="machinery">Machinery</option>
              <option value="service">Service</option>
            </select>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New category name"
              className="rounded-lg border px-3 py-2 text-xs bg-white"
            />
          </div>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Category description"
            className="w-full rounded-lg border px-3 py-2 text-xs bg-white"
          />
          <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-[#0a2458] text-white px-4 py-1.5 text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> Add Category
          </button>
        </form>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
          {categories.map((c) => (
            <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
              <div>
                <span className="uppercase font-bold text-[#f97316] mr-2">{c.type}</span>
                <strong className="text-[#0a2458]">{c.name}</strong>
              </div>
              <button
                type="button"
                onClick={() => deleteItem("category", c.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
        <h3 className="font-extrabold text-[#0a2458]">Subcategories ({subcategories.length})</h3>
        <form onSubmit={addSubcategory} className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={subCatId}
              onChange={(e) => setSubCatId(Number(e.target.value))}
              className="rounded-lg border px-3 py-2 text-xs bg-white"
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
              placeholder="New subcategory name"
              className="rounded-lg border px-3 py-2 text-xs bg-white"
            />
          </div>
          <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-[#f97316] text-white px-4 py-1.5 text-xs font-bold">
            <Plus className="h-3.5 w-3.5" /> Add Subcategory
          </button>
        </form>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
          {subcategories.map((s) => (
            <div key={s.id} className="py-2.5 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 mr-2">{s.category_name}:</span>
                <strong className="text-[#0a2458]">{s.name}</strong>
              </div>
              <button
                type="button"
                onClick={() => deleteItem("subcategory", s.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
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
  const [edits, setEdits] = useState<Record<number, { price_inr: number; badge_text: string; highlight_text: string }>>(() =>
    Object.fromEntries(
      plans.map((p) => [p.id, { price_inr: p.price_inr, badge_text: p.badge_text, highlight_text: p.highlight_text }])
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
      showToast("Subscription plan updated dynamically!", "success");
      onRefresh();
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {plans.map((p) => {
        const current = edits[p.id] || { price_inr: p.price_inr, badge_text: p.badge_text, highlight_text: p.highlight_text };
        return (
          <div key={p.id} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-[#0a2458]">{p.name}</h3>
              <span className="text-xs font-bold text-[#f97316]">{p.duration_months}M + {p.bonus_months}M Bonus</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500">Price (₹ incl. 18% GST)</label>
              <input
                type="number"
                value={current.price_inr}
                onChange={(e) =>
                  setEdits({ ...edits, [p.id]: { ...current, price_inr: Number(e.target.value) } })
                }
                className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500">Badge Text</label>
              <input
                type="text"
                value={current.badge_text}
                onChange={(e) =>
                  setEdits({ ...edits, [p.id]: { ...current, badge_text: e.target.value } })
                }
                className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500">Highlight Note</label>
              <input
                type="text"
                value={current.highlight_text}
                onChange={(e) =>
                  setEdits({ ...edits, [p.id]: { ...current, highlight_text: e.target.value } })
                }
                className="w-full rounded-xl border px-3 py-2 text-sm mt-1"
              />
            </div>
            <button
              type="button"
              onClick={() => savePlan(p.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0a2458] text-white px-4 py-2 text-xs font-bold"
            >
              <Save className="h-3.5 w-3.5" /> Save Plan Pricing
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

  async function uploadImg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setImageUrl(data.url);
      showToast("Gallery photo uploaded!", "success");
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
      showToast("Gallery item added!", "success");
      setTitle("");
      setCaption("");
      onRefresh();
    }
  }

  async function deleteGallery(id: number) {
    await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
    showToast("Gallery image removed.", "info");
    onRefresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addGallery} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 max-w-2xl">
        <h3 className="font-extrabold text-[#0a2458]">Add Gallery Image</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Image Title *"
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (Rubber, Plastic, Metals...)"
            className="rounded-xl border px-3 py-2 text-sm"
          />
        </div>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption"
          className="w-full rounded-xl border px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-dashed px-3.5 py-2 text-xs font-bold cursor-pointer">
            <FileUp className="h-4 w-4 text-[#f97316]" />
            Upload Image
            <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={uploadImg} className="hidden" />
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1 rounded-xl border px-3 py-2 text-xs"
          />
          <button type="submit" className="rounded-full bg-[#f97316] text-white px-5 py-2 text-xs font-bold">
            Publish to Gallery
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gallery.map((g) => (
          <div key={g.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <img src={g.image_url} alt={g.title} className="h-40 w-full object-cover" />
            <div className="p-4 flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-[#f97316]">{g.category}</span>
                <p className="font-bold text-sm text-[#0a2458]">{g.title}</p>
              </div>
              <button type="button" onClick={() => deleteGallery(g.id)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
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
      <div className="rounded-2xl bg-white border border-slate-200 p-6 max-w-2xl space-y-3">
        <h3 className="text-lg font-extrabold text-[#0a2458]">{title}</h3>
        <input
          type="text"
          value={val.title}
          onChange={(e) => setData({ ...val, title: e.target.value })}
          placeholder="Offer Title"
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <input
          type="text"
          value={val.subtitle}
          onChange={(e) => setData({ ...val, subtitle: e.target.value })}
          placeholder="Offer Subtitle"
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <input
          type="text"
          value={val.fourthYearFreeNote}
          onChange={(e) => setData({ ...val, fourthYearFreeNote: e.target.value })}
          placeholder="4th Year FREE Note"
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <input
          type="text"
          value={val.ctaText}
          onChange={(e) => setData({ ...val, ctaText: e.target.value })}
          placeholder="CTA Button Label"
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#f97316] text-white px-6 py-2.5 text-sm font-bold">
          {saving ? "Saving..." : "Save Launching Offer"}
        </button>
      </div>
    );
  }

  if (cmsKey === "about_content") {
    const val = data as AboutContent;
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6 max-w-3xl space-y-3">
        <h3 className="text-lg font-extrabold text-[#0a2458]">{title}</h3>
        <input
          type="text"
          value={val.headline}
          onChange={(e) => setData({ ...val, headline: e.target.value })}
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <input
          type="text"
          value={val.subheadline}
          onChange={(e) => setData({ ...val, subheadline: e.target.value })}
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <textarea
          rows={2}
          value={val.summary}
          onChange={(e) => setData({ ...val, summary: e.target.value })}
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <textarea
          rows={4}
          value={val.fullStory}
          onChange={(e) => setData({ ...val, fullStory: e.target.value })}
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#0a2458] text-white px-6 py-2.5 text-sm font-bold">
          {saving ? "Saving..." : "Save About Us Content"}
        </button>
      </div>
    );
  }

  if (cmsKey === "contact_settings") {
    const val = data as ContactSettings;
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6 max-w-2xl space-y-3">
        <h3 className="text-lg font-extrabold text-[#0a2458]">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={val.companyName}
            onChange={(e) => setData({ ...val, companyName: e.target.value })}
            placeholder="Company Name"
            className="rounded-xl border px-3.5 py-2 text-sm"
          />
          <input
            type="text"
            value={val.mobile}
            onChange={(e) => setData({ ...val, mobile: e.target.value })}
            placeholder="Support Mobile"
            className="rounded-xl border px-3.5 py-2 text-sm"
          />
          <input
            type="text"
            value={val.whatsapp}
            onChange={(e) => setData({ ...val, whatsapp: e.target.value })}
            placeholder="WhatsApp Number"
            className="rounded-xl border px-3.5 py-2 text-sm"
          />
          <input
            type="email"
            value={val.email}
            onChange={(e) => setData({ ...val, email: e.target.value })}
            placeholder="Support Email"
            className="rounded-xl border px-3.5 py-2 text-sm"
          />
        </div>
        <input
          type="text"
          value={val.address}
          onChange={(e) => setData({ ...val, address: e.target.value })}
          placeholder="Address"
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <textarea
          rows={2}
          value={val.referralRewardRule}
          onChange={(e) => setData({ ...val, referralRewardRule: e.target.value })}
          placeholder="Referral Reward Rule"
          className="w-full rounded-xl border px-3.5 py-2 text-sm"
        />
        <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#0a2458] text-white px-6 py-2.5 text-sm font-bold">
          {saving ? "Saving..." : "Save Portal Settings"}
        </button>
      </div>
    );
  }

  // Hero slides banner manager
  const slides = data as HeroSlide[];
  return (
    <div className="space-y-4 max-w-3xl">
      <h3 className="text-lg font-extrabold text-[#0a2458]">{title}</h3>
      {slides.map((s, idx) => (
        <div key={s.id} className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-bold text-[#f97316]">Slide {idx + 1}</p>
          <input
            type="text"
            value={s.headlinePrefix}
            onChange={(e) => {
              const next = [...slides];
              next[idx] = { ...s, headlinePrefix: e.target.value };
              setData(next);
            }}
            className="w-full rounded-xl border px-3 py-1.5 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={s.headlineHighlight}
              onChange={(e) => {
                const next = [...slides];
                next[idx] = { ...s, headlineHighlight: e.target.value };
                setData(next);
              }}
              className="rounded-xl border px-3 py-1.5 text-sm"
            />
            <input
              type="text"
              value={s.subcategoriesLine}
              onChange={(e) => {
                const next = [...slides];
                next[idx] = { ...s, subcategoriesLine: e.target.value };
                setData(next);
              }}
              className="rounded-xl border px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      ))}
      <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#0a2458] text-white px-6 py-2.5 text-sm font-bold">
        {saving ? "Saving..." : "Save Hero Banners"}
      </button>
    </div>
  );
}

