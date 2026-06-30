"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Tag, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiFetch, apiGet } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface Listing {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  condition: string;
  images: string;
  shippingInfo?: string;
  seller: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
    location?: string;
  };
}

const CATEGORIES = [
  "all",
  "Electronics",
  "Home",
  "Clothing",
  "Vehicles",
  "Toys",
  "Sports",
  "Books",
  "Other",
];
const SORTS = [
  { id: "recent", label: "Newest" },
  { id: "price_low", label: "Price ↑" },
  { id: "price_high", label: "Price ↓" },
];

function firstImage(images: string): string | undefined {
  try {
    const a = JSON.parse(images);
    return Array.isArray(a) ? a[0] : undefined;
  } catch {
    return undefined;
  }
}

export default function MarketplacePage() {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [q, setQ] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ category, sort });
    if (q.trim()) params.set("q", q.trim());
    setListings(await apiGet<Listing[]>(`/api/marketplace?${params}`, []));
    setLoading(false);
  }, [category, sort, q]);

  useEffect(() => {
    load();
  }, [category, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Marketplace</h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Sell
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search marketplace"
              value={q}
              className="pl-9"
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && (
          <p className="col-span-full text-center text-muted-foreground py-12">
            Loading…
          </p>
        )}
        {!loading && listings.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 text-center">
            <Tag className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No listings yet. Be the first to sell something.
            </p>
          </div>
        )}
        {listings.map((l) => {
          const img = firstImage(l.images);
          return (
            <Card key={l.id} padding="none" hover className="overflow-hidden">
              <div className="aspect-square bg-muted">
                {img ? (
                  <img
                    src={img}
                    alt={l.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Tag className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="font-bold">${l.price.toLocaleString()}</p>
                <p className="text-sm truncate">{l.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{" "}
                  {l.seller.location || l.condition}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <CreateListingModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          load();
        }}
      />
    </div>
  );
}

function CreateListingModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Other",
    condition: "USED",
    description: "",
    images: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const images = form.images
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await apiFetch("/api/marketplace", {
      method: "POST",
      body: JSON.stringify({ ...form, images }),
    });
    setSaving(false);
    if (res.ok) {
      setForm({
        name: "",
        price: "",
        category: "Other",
        condition: "USED",
        description: "",
        images: "",
      });
      onCreated();
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="List an item">
      <div className="space-y-3">
        <Input
          placeholder="What are you selling?"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          type="number"
          placeholder="Price (USD)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <div className="flex gap-2">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {CATEGORIES.filter((c) => c !== "all").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {["NEW", "USED", "REFURBISHED"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[70px] resize-none"
        />
        <Input
          placeholder="Image URLs (comma separated)"
          value={form.images}
          onChange={(e) => setForm({ ...form, images: e.target.value })}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button
            onClick={submit}
            isLoading={saving}
            disabled={!form.name || !form.price}
          >
            Post Listing
          </Button>
        </div>
      </div>
    </Modal>
  );
}
