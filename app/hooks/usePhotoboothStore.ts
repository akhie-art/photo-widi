"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/** Position and size of a single camera slot on the photo strip (all values in %). */
export interface SlotConfig {
  id: string;
  xPct: number;       // left position  (0–100)
  yPct: number;       // top  position  (0–100)
  widthPct: number;   // width          (0–100)
  heightPct: number;  // height         (0–100)
  rotation: number;   // clockwise degrees
}

export interface FrameTemplate {
  id: string;
  name: string;
  imageOverlay?: string;   // transparent PNG overlay base64 data URL
  customSlots?: SlotConfig[]; // admin-defined slot layout (overrides built-in positions)
  overlayX?: number;
  overlayY?: number;
  overlayW?: number;
  overlayH?: number;
  overlayRotation?: number;
}

export interface LayoutAsset {
  id: string;
  name: string;
  count: number;
  description: string;
}

export interface FilterAsset {
  id: string;
  name: string;
  css: string;
}

export interface StickerAsset {
  id: string;
  name: string;
  imageUrl: string; // emoji or data url/image path
}

export interface PlacedSticker {
  id: string;
  stickerId: string;
  xPct: number;      // posisi X (%) relatif terhadap kanvas
  yPct: number;      // posisi Y (%) relatif terhadap kanvas
  scalePct: number;  // skala (%) relatif terhadap lebar kanvas
  rotation: number;  // rotasi (derajat)
}

export interface PresetTemplate {
  id: string;
  name: string;
  imageOverlay?: string;  // PNG overlay (base64 data URL)
  customSlots?: SlotConfig[];
  overlayX?: number;      // overlay X position (%) — 0 = left edge
  overlayY?: number;      // overlay Y position (%) — 0 = top edge
  overlayW?: number;      // overlay width  (%) — 100 = full canvas width
  overlayH?: number;      // overlay height (%) — 100 = full canvas height
  overlayRotation?: number; // overlay rotation in degrees
  forceLayout: boolean;   // jika true, pilihan layout manual dikunci/diabaikan
}


export interface EventConfig {
  eventName: string;
  date: string;
  time: string;
  location: string;
  frameStyle: string; // fallback
  frameText: string;  // fallback
  countdownDuration: number;
  allowedFilters: string[];
  allowedLayouts: string[];
  mirrorDefault: boolean;
  customFilters: FilterAsset[];
  customStickers: StickerAsset[];
  presetTemplates: PresetTemplate[];
  activePresetTemplateId?: string;
  logoUrl?: string;
  pricePerSession?: number;
  qrisUrl?: string;
}

export interface PhotoStrip {
  id: string;
  timestamp: string;
  dataUrl: string; // base64 image strip
  customerName?: string;
  customerPhone?: string;
  sessionsCount?: number;
  operatorName?: string;
  capturedPhotos?: string[]; // array of base64 individual photos
  paymentMethod?: string;
  amount?: number;
}


const DEFAULT_CONFIG: EventConfig = {
  eventName: "",
  date: "",
  time: "",
  location: "",
  frameStyle: "neon",
  frameText: "",
  countdownDuration: 3,
  allowedFilters: ["original"],
  allowedLayouts: ["strip"],
  mirrorDefault: true,
  customFilters: [],
  customStickers: [],
  presetTemplates: [],
  activePresetTemplateId: "",
  logoUrl: "",
  pricePerSession: 25000,
  qrisUrl: "",
};

// ─── LocalStorage helpers (fallback & cross-tab sync cache) ───────────────────

function lsGetConfig(): EventConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("glow_booth_config");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function lsSetConfig(cfg: EventConfig) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("glow_booth_config", JSON.stringify(cfg));
  } catch (err) {
    console.warn("[Storage] Failed to save config to sessionStorage:", err);
  }
  try {
    window.dispatchEvent(new StorageEvent("storage", { key: "glow_booth_config", newValue: JSON.stringify(cfg) }));
  } catch {}
}

function lsGetPhotos(): PhotoStrip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem("glow_booth_photos");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsSetPhotos(photos: PhotoStrip[]) {
  if (typeof window === "undefined") return;
  try {
    // Hanya simpan 10 foto terbaru di sessionStorage untuk mencegah QuotaExceededError
    const cleanPhotos = photos.slice(0, 10).map((p, idx) => ({
      id: p.id,
      timestamp: p.timestamp,
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      sessionsCount: p.sessionsCount,
      operatorName: p.operatorName,
      paymentMethod: p.paymentMethod,
      amount: p.amount,
      dataUrl: idx < 2 ? p.dataUrl : "",
    }));

    sessionStorage.setItem("glow_booth_photos", JSON.stringify(cleanPhotos));
  } catch (err) {
    console.warn("[Storage] Failed to save photos to sessionStorage:", err);
    try {
      sessionStorage.removeItem("glow_booth_photos");
    } catch {}
  }
  try {
    window.dispatchEvent(new StorageEvent("storage", { key: "glow_booth_photos", newValue: JSON.stringify(photos) }));
  } catch (err) {}
}

// ─── Migration helper ─────────────────────────────────────────────────────────

function migrateConfig(parsed: EventConfig): { config: EventConfig; changed: boolean } {
  let changed = false;

  // Ensure all array fields exist (initialize to empty if missing)
  if (!parsed.customFilters) { parsed.customFilters = []; changed = true; }
  if (!parsed.customStickers) { parsed.customStickers = []; changed = true; }
  if (!parsed.presetTemplates) { parsed.presetTemplates = []; changed = true; }
  if (parsed.activePresetTemplateId === undefined) { parsed.activePresetTemplateId = ""; changed = true; }

  return { config: parsed, changed };
}


// ─── Storage helpers (base64 to storage bucket) ─────────────────────────────

async function base64ToBlob(base64: string, defaultContentType = "image/png"): Promise<Blob> {
  try {
    const res = await fetch(base64);
    return await res.blob();
  } catch (err) {
    const parts = base64.split(";base64,");
    const contentType = parts[0].split(":")[1] || defaultContentType;
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }
}

async function uploadImageToStorage(base64: string, path: string): Promise<string> {
  const blob = await base64ToBlob(base64);
  const { error } = await supabase.storage
    .from("photostrips")
    .upload(path, blob, {
      contentType: blob.type || "image/png",
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("photostrips")
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export function usePhotoboothStore() {
  const [config, setConfig] = useState<EventConfig>(() => {
    return lsGetConfig() || DEFAULT_CONFIG;
  });
  const [photos, setPhotos] = useState<PhotoStrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load initial data (Supabase first, fallback to localStorage) ──────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load from sessionStorage immediately to avoid waiting for network
    const cachedCfg = lsGetConfig();
    if (cachedCfg) {
      setConfig(cachedCfg);
    }
    const cachedPhotos = lsGetPhotos();
    if (cachedPhotos && cachedPhotos.length > 0) {
      setPhotos(cachedPhotos);
    }

    const init = async () => {
      setIsLoading(true);
      try {
        // ── 1. Fetch Event Config ──
        const { data: cfgRow, error: cfgErr } = await supabase
          .from("event_config")
          .select("config_json")
          .eq("id", "default")
          .single();

        // ── 2. Fetch all normalized table assets ──
        const [
          { data: filtersRows },
          { data: stickersRows },
          { data: presetsRows }
        ] = await Promise.all([
          supabase.from("filter_assets").select("*").order("created_at", { ascending: true }),
          supabase.from("sticker_assets").select("*").order("created_at", { ascending: true }),
          supabase.from("preset_templates").select("*").order("created_at", { ascending: true }),
        ]);

        let baseConfig: EventConfig = DEFAULT_CONFIG;
        if (cfgRow && cfgRow.config_json) {
          baseConfig = cfgRow.config_json as EventConfig;
        } else {
          const localCfg = lsGetConfig();
          if (localCfg) {
            baseConfig = localCfg;
          }
        }

        const { config: migrated } = migrateConfig(baseConfig);

        // Merge normalized table rows into the baseConfig
        if (filtersRows) {
          migrated.customFilters = filtersRows.map(r => ({
            id: r.id,
            name: r.name,
            css: r.css,
          }));
        }
        if (stickersRows) {
          migrated.customStickers = stickersRows.map(r => ({
            id: r.id,
            name: r.name,
            imageUrl: r.image_url,
          }));
        }
        if (presetsRows) {
          migrated.presetTemplates = presetsRows.map(r => ({
            id: r.id,
            name: r.name,
            imageOverlay: r.image_overlay || undefined,
            customSlots: r.custom_slots || undefined,
            overlayX: r.overlay_x !== null && r.overlay_x !== undefined ? Number(r.overlay_x) : undefined,
            overlayY: r.overlay_y !== null && r.overlay_y !== undefined ? Number(r.overlay_y) : undefined,
            overlayW: r.overlay_w !== null && r.overlay_w !== undefined ? Number(r.overlay_w) : undefined,
            overlayH: r.overlay_h !== null && r.overlay_h !== undefined ? Number(r.overlay_h) : undefined,
            overlayRotation: r.overlay_rotation !== null && r.overlay_rotation !== undefined ? Number(r.overlay_rotation) : undefined,
            forceLayout: r.force_layout ?? true,
          }));
        }

        setConfig(migrated);
        lsSetConfig(migrated);

        // Ensure default row exists in event_config
        if (!cfgRow) {
          const metadataOnly = {
            ...migrated,
            customFilters: [],
            customStickers: [],
            presetTemplates: [],
          };
          await supabase.from("event_config").upsert({ id: "default", config_json: metadataOnly });
        }

        // ── Photos ───────────────────────────────────────────────────────────
        const { data: photoRows, error: photoErr } = await supabase
          .from("photo_strips")
          .select("id, data_url, customer_name, customer_phone, sessions_count, timestamp, operator_name, captured_photos, payment_method, amount")
          .order("created_at", { ascending: false });

        if (photoErr || !photoRows) {
          setPhotos(lsGetPhotos());
        } else {
          const mapped: PhotoStrip[] = photoRows.map((row) => ({
            id: row.id,
            dataUrl: row.data_url,
            customerName: row.customer_name ?? undefined,
            customerPhone: row.customer_phone ?? undefined,
            sessionsCount: row.sessions_count ?? undefined,
            timestamp: row.timestamp ?? new Date().toLocaleTimeString(),
            capturedPhotos: (row as any).captured_photos ?? undefined,
            operatorName: (row as any).operator_name ?? undefined,
            paymentMethod: (row as any).payment_method ?? undefined,
            amount: (row as any).amount ?? undefined,
          }));
          setPhotos(mapped);
          lsSetPhotos(mapped);
        }
      } catch (err) {
        console.error("[Supabase] init error, falling back to localStorage:", err);
        const localCfg = lsGetConfig();
        if (localCfg) setConfig(migrateConfig(localCfg).config);
        setPhotos(lsGetPhotos());
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // ── Cross-tab sync via localStorage StorageEvent ──────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "glow_booth_config" && e.newValue) {
        try { setConfig(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === "glow_booth_photos" && e.newValue) {
        try { setPhotos(JSON.parse(e.newValue)); } catch {}
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ── Update Config (Supabase + localStorage) ───────────────────────────────
  const saveConfig = useCallback(async (newConfig: EventConfig) => {
    setConfig(newConfig);
    lsSetConfig(newConfig);
    try {
      const metadataOnly = {
        ...newConfig,
        customFilters: [],
        customStickers: [],
        presetTemplates: [],
      };
      await supabase
        .from("event_config")
        .upsert({ id: "default", config_json: metadataOnly, updated_at: new Date().toISOString() });
    } catch (err) {
      console.error("[Supabase] saveConfig error:", err);
    }
  }, []);

  const updateConfig = useCallback((fields: Partial<EventConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...fields };
      setTimeout(() => saveConfig(updated), 0);
      return updated;
    });
  }, [saveConfig]);

  // ── Frame CRUD ────────────────────────────────────────────────────────────



  // ── Photo CRUD ────────────────────────────────────────────────────────────

  const addPhoto = useCallback(async (
    dataUrl: string,
    metadata?: { customerName: string; customerPhone: string; sessionsCount: number; operatorName?: string; capturedPhotos?: string[]; paymentMethod?: string; amount?: number }
  ) => {
    const newId = "strip_" + Date.now();
    const newPhoto: PhotoStrip = {
      id: newId,
      timestamp: new Date().toLocaleTimeString(),
      dataUrl,
      ...metadata,
    };

    setPhotos((prev) => {
      const updated = [newPhoto, ...prev];
      setTimeout(() => lsSetPhotos(updated), 0);
      return updated;
    });

    try {
      let finalDataUrl = dataUrl;
      let finalCapturedPhotos = metadata?.capturedPhotos || [];

      // Try uploading the main strip to Supabase Storage
      try {
        finalDataUrl = await uploadImageToStorage(dataUrl, `strips/${newId}.png`);
      } catch (err) {
        console.warn("[Storage] Failed to upload photo strip, falling back to base64:", err);
      }

      // Try uploading individual captured photos to Supabase Storage
      if (metadata?.capturedPhotos && metadata.capturedPhotos.length > 0) {
        try {
          const uploadPromises = metadata.capturedPhotos.map((p, idx) =>
            uploadImageToStorage(p, `raw/${newId}_raw_${idx}.png`)
          );
          finalCapturedPhotos = await Promise.all(uploadPromises);
        } catch (err) {
          console.warn("[Storage] Failed to upload captured photos, falling back to base64:", err);
        }
      }

      const payload: any = {
        id: newPhoto.id,
        data_url: finalDataUrl,
        customer_name: metadata?.customerName ?? null,
        customer_phone: metadata?.customerPhone ?? null,
        sessions_count: metadata?.sessionsCount ?? 1,
        operator_name: metadata?.operatorName ?? null,
        timestamp: newPhoto.timestamp,
        payment_method: metadata?.paymentMethod ?? null,
        amount: metadata?.amount ?? null,
      };

      if (finalCapturedPhotos.length > 0) {
        payload.captured_photos = finalCapturedPhotos;
      }

      const { error } = await supabase.from("photo_strips").insert(payload);
      if (error) {
        // Fallback jika kolom captured_photos belum ada di Supabase
        if (error.message?.includes("captured_photos") || error.code === "P0002" || error.code === "42703") {
          console.warn("Kolom captured_photos tidak ditemukan, melakukan fallback tanpa kolom tersebut...");
          delete payload.captured_photos;
          const { error: fallbackErr } = await supabase.from("photo_strips").insert(payload);
          if (fallbackErr) {
            console.error("[Supabase] addPhoto fallback error:", fallbackErr);
          }
        } else {
          console.error("[Supabase] addPhoto error:", error);
        }
      }
    } catch (err) {
      console.error("[Supabase] addPhoto error:", err);
    }
    return newId;
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      setTimeout(() => lsSetPhotos(updated), 0);
      return updated;
    });

    try {
      await supabase.from("photo_strips").delete().eq("id", id);
    } catch (err) {
      console.error("[Supabase] deletePhoto error:", err);
    }
  }, []);

  const clearPhotos = useCallback(async () => {
    setPhotos([]);
    lsSetPhotos([]);

    try {
      await supabase.from("photo_strips").delete().neq("id", "");
    } catch (err) {
      console.error("[Supabase] clearPhotos error:", err);
    }
  }, []);

  // ── Modular CRUD ──────────────────────────────────────────────────────────



  const addFilterAsset = useCallback(async (filter: Omit<FilterAsset, "id">) => {
    const newFilter: FilterAsset = { ...filter, id: "filter_" + Date.now() };
    setConfig((prev) => {
      const updated = { ...prev, customFilters: [...(prev.customFilters || []), newFilter] };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      await supabase.from("filter_assets").insert({
        id: newFilter.id,
        name: newFilter.name,
        css: newFilter.css,
      });
    } catch (err) {
      console.error("[Supabase] addFilterAsset error:", err);
    }
  }, []);

  const deleteFilterAsset = useCallback(async (id: string) => {
    setConfig((prev) => {
      const updated = { ...prev, customFilters: (prev.customFilters || []).filter((f) => f.id !== id) };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      await supabase.from("filter_assets").delete().eq("id", id);
    } catch (err) {
      console.error("[Supabase] deleteFilterAsset error:", err);
    }
  }, []);

  const addStickerAsset = useCallback(async (sticker: Omit<StickerAsset, "id">) => {
    const newSticker: StickerAsset = { ...sticker, id: "sticker_" + Date.now() };
    setConfig((prev) => {
      const updated = { ...prev, customStickers: [...(prev.customStickers || []), newSticker] };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      await supabase.from("sticker_assets").insert({
        id: newSticker.id,
        name: newSticker.name,
        image_url: newSticker.imageUrl,
      });
    } catch (err) {
      console.error("[Supabase] addStickerAsset error:", err);
    }
  }, []);

  const deleteStickerAsset = useCallback(async (id: string) => {
    setConfig((prev) => {
      const updated = { ...prev, customStickers: (prev.customStickers || []).filter((s) => s.id !== id) };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      await supabase.from("sticker_assets").delete().eq("id", id);
    } catch (err) {
      console.error("[Supabase] deleteStickerAsset error:", err);
    }
  }, []);

  const addPresetTemplate = useCallback(async (preset: Omit<PresetTemplate, "id">) => {
    const newPreset: PresetTemplate = { ...preset, id: "preset_" + Date.now() };
    setConfig((prev) => {
      const updated = { ...prev, presetTemplates: [...(prev.presetTemplates || []), newPreset] };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      await supabase.from("preset_templates").insert({
        id: newPreset.id,
        name: newPreset.name,
        image_overlay: newPreset.imageOverlay || null,
        custom_slots: newPreset.customSlots || null,
        overlay_x: newPreset.overlayX ?? 0,
        overlay_y: newPreset.overlayY ?? 0,
        overlay_w: newPreset.overlayW ?? 100,
        overlay_h: newPreset.overlayH ?? 100,
        overlay_rotation: newPreset.overlayRotation ?? 0,
        force_layout: newPreset.forceLayout,
      });
    } catch (err) {
      console.error("[Supabase] addPresetTemplate error:", err);
    }
  }, []);

  const updatePresetTemplate = useCallback(async (id: string, fields: Partial<PresetTemplate>) => {
    setConfig((prev) => {
      const updatedPresets = (prev.presetTemplates || []).map((p) => p.id === id ? { ...p, ...fields } : p);
      const updated = { ...prev, presetTemplates: updatedPresets };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      await supabase.from("preset_templates").update({
        name: fields.name,
        image_overlay: fields.imageOverlay,
        custom_slots: fields.customSlots,
        overlay_x: fields.overlayX,
        overlay_y: fields.overlayY,
        overlay_w: fields.overlayW,
        overlay_h: fields.overlayH,
        overlay_rotation: fields.overlayRotation,
        force_layout: fields.forceLayout,
      }).eq("id", id);
    } catch (err) {
      console.error("[Supabase] updatePresetTemplate error:", err);
    }
  }, []);

  const deletePresetTemplate = useCallback(async (id: string) => {
    setConfig((prev) => {
      if (prev.activePresetTemplateId === id) {
        toast.error("Tidak bisa menghapus preset yang sedang aktif!");
        return prev;
      }
      const updatedPresets = (prev.presetTemplates || []).filter((p) => p.id !== id);
      const updated = { ...prev, presetTemplates: updatedPresets };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      await supabase.from("preset_templates").delete().eq("id", id);
    } catch (err) {
      console.error("[Supabase] deletePresetTemplate error:", err);
    }
  }, []);

  const setActivePresetTemplate = useCallback((id: string) => {
    setConfig((prev) => {
      const preset = (prev.presetTemplates || []).find((p) => p.id === id);
      if (!preset && id !== "") return prev;
      
      const updated: EventConfig = {
        ...prev,
        activePresetTemplateId: id,
      };

      setTimeout(() => saveConfig(updated), 0);
      return updated;
    });
  }, [saveConfig]);

  return {
    config,
    photos,
    isLoading,
    updateConfig,
    addPhoto,
    deletePhoto,
    clearPhotos,
    addFilterAsset,
    deleteFilterAsset,
    addStickerAsset,
    deleteStickerAsset,
    addPresetTemplate,
    updatePresetTemplate,
    deletePresetTemplate,
    setActivePresetTemplate,
  };
}
