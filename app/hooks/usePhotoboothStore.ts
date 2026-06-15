"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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
  frameStyle: string; // 'neon' | 'classic-white' | 'classic-black' | 'pastel' | 'filmstrip'
  frameText: string;
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
  layoutId: string;       // referensi ke LayoutAsset
  frameId?: string;       // referensi ke FrameTemplate (opsional)
  frameStyle: string;    // 'neon' | 'classic-white' | 'classic-black' | 'pastel' | 'filmstrip'
  frameText: string;
  imageOverlay?: string;  // PNG overlay (base64 data URL)
  customSlots?: SlotConfig[];
  overlayX?: number;      // overlay X position (%) — 0 = left edge
  overlayY?: number;      // overlay Y position (%) — 0 = top edge
  overlayW?: number;      // overlay width  (%) — 100 = full canvas width
  overlayH?: number;      // overlay height (%) — 100 = full canvas height
  overlayRotation?: number; // overlay rotation in degrees
  filterId: string;       // referensi ke FilterAsset
  allowedStickers: string[]; // daftar ID StickerAsset yang diizinkan
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
  activeFrameId: string;
  customFrames: FrameTemplate[];
  customLayouts: LayoutAsset[];
  customFilters: FilterAsset[];
  customStickers: StickerAsset[];
  presetTemplates: PresetTemplate[];
  activePresetTemplateId?: string;
}

export interface PhotoStrip {
  id: string;
  timestamp: string;
  dataUrl: string; // base64 image strip
  customerName?: string;
  customerPhone?: string;
  sessionsCount?: number;
  operatorName?: string;
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
  activeFrameId: "",
  customFrames: [],
  customLayouts: [],
  customFilters: [],
  customStickers: [],
  presetTemplates: [],
  activePresetTemplateId: "",
};

// ─── LocalStorage helpers (fallback & cross-tab sync cache) ───────────────────

function lsGetConfig(): EventConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("glow_booth_config");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function lsSetConfig(cfg: EventConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem("glow_booth_config", JSON.stringify(cfg));
  window.dispatchEvent(new StorageEvent("storage", { key: "glow_booth_config", newValue: JSON.stringify(cfg) }));
}

function lsGetPhotos(): PhotoStrip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("glow_booth_photos");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsSetPhotos(photos: PhotoStrip[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("glow_booth_photos", JSON.stringify(photos));
  window.dispatchEvent(new StorageEvent("storage", { key: "glow_booth_photos", newValue: JSON.stringify(photos) }));
}

// ─── Migration helper ─────────────────────────────────────────────────────────

function migrateConfig(parsed: EventConfig): { config: EventConfig; changed: boolean } {
  let changed = false;

  // Ensure all array fields exist (initialize to empty if missing)
  if (!parsed.customFrames) { parsed.customFrames = []; changed = true; }
  if (!parsed.customLayouts) { parsed.customLayouts = []; changed = true; }
  if (!parsed.customFilters) { parsed.customFilters = []; changed = true; }
  if (!parsed.customStickers) { parsed.customStickers = []; changed = true; }
  if (!parsed.presetTemplates) { parsed.presetTemplates = []; changed = true; }
  if (parsed.activePresetTemplateId === undefined) { parsed.activePresetTemplateId = ""; changed = true; }

  // Deduplicate frames by ID
  const uniqueFrames = parsed.customFrames.filter(
    (f, idx, self) => self.findIndex((x) => x.id === f.id) === idx
  );
  if (uniqueFrames.length !== parsed.customFrames.length) {
    parsed.customFrames = uniqueFrames;
    changed = true;
  }

  return { config: parsed, changed };
}


// ─── Main Hook ────────────────────────────────────────────────────────────────

export function usePhotoboothStore() {
  const [config, setConfig] = useState<EventConfig>(DEFAULT_CONFIG);
  const [photos, setPhotos] = useState<PhotoStrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load initial data (Supabase first, fallback to localStorage) ──────────
  useEffect(() => {
    if (typeof window === "undefined") return;

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
          { data: layoutsRows },
          { data: filtersRows },
          { data: stickersRows },
          { data: presetsRows }
        ] = await Promise.all([
          supabase.from("layout_assets").select("*").order("created_at", { ascending: true }),
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
        if (layoutsRows) {
          migrated.customLayouts = layoutsRows.map(r => ({
            id: r.id,
            name: r.name,
            count: r.count,
            description: r.description || "",
          }));
        }
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
            layoutId: r.layout_id,
            frameStyle: r.frame_style,
            frameText: r.frame_text || "",
            imageOverlay: r.image_overlay || undefined,
            customSlots: r.custom_slots || undefined,
            overlayX: r.overlay_x !== null && r.overlay_x !== undefined ? Number(r.overlay_x) : undefined,
            overlayY: r.overlay_y !== null && r.overlay_y !== undefined ? Number(r.overlay_y) : undefined,
            overlayW: r.overlay_w !== null && r.overlay_w !== undefined ? Number(r.overlay_w) : undefined,
            overlayH: r.overlay_h !== null && r.overlay_h !== undefined ? Number(r.overlay_h) : undefined,
            overlayRotation: r.overlay_rotation !== null && r.overlay_rotation !== undefined ? Number(r.overlay_rotation) : undefined,
            filterId: r.filter_id,
            allowedStickers: r.allowed_stickers || [],
            forceLayout: r.force_layout ?? true,
          }));
        }

        setConfig(migrated);
        lsSetConfig(migrated);

        // Ensure default row exists in event_config
        if (!cfgRow) {
          const metadataOnly = {
            ...migrated,
            customLayouts: [],
            customFilters: [],
            customStickers: [],
            presetTemplates: [],
          };
          await supabase.from("event_config").upsert({ id: "default", config_json: metadataOnly });
        }

        // ── Photos ───────────────────────────────────────────────────────────
        const { data: photoRows, error: photoErr } = await supabase
          .from("photo_strips")
          .select("id, data_url, customer_name, customer_phone, sessions_count, timestamp")
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
        customLayouts: [],
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

  const addFrame = useCallback((frame: Omit<FrameTemplate, "id">) => {
    const newFrame: FrameTemplate = { ...frame, id: "frame_" + Date.now() };
    setConfig((prev) => {
      const updated = { ...prev, customFrames: [...prev.customFrames, newFrame] };
      setTimeout(() => saveConfig(updated), 0);
      return updated;
    });
  }, [saveConfig]);

  const updateFrame = useCallback((id: string, fields: Partial<FrameTemplate>) => {
    setConfig((prev) => {
      const updatedFrames = prev.customFrames.map((f) => f.id === id ? { ...f, ...fields } : f);
      const updated = { ...prev, customFrames: updatedFrames };
      setTimeout(() => saveConfig(updated), 0);
      return updated;
    });
  }, [saveConfig]);

  const deleteFrame = useCallback((id: string) => {
    setConfig((prev) => {
      if (prev.activeFrameId === id) {
        alert("Tidak bisa menghapus bingkai yang sedang aktif digunakan!");
        return prev;
      }
      const updatedFrames = prev.customFrames.filter((f) => f.id !== id);
      const updated = { ...prev, customFrames: updatedFrames };
      setTimeout(() => saveConfig(updated), 0);
      return updated;
    });
  }, [saveConfig]);

  const setActiveFrame = useCallback((id: string) => {
    setConfig((prev) => {
      const selectedTemplate = prev.customFrames.find((f) => f.id === id);
      if (!selectedTemplate) return prev;
      const updated = {
        ...prev,
        activeFrameId: id,
        frameStyle: selectedTemplate.frameStyle,
        frameText: selectedTemplate.frameText,
      };
      setTimeout(() => saveConfig(updated), 0);
      return updated;
    });
  }, [saveConfig]);

  // ── Photo CRUD ────────────────────────────────────────────────────────────

  const addPhoto = useCallback(async (
    dataUrl: string,
    metadata?: { customerName: string; customerPhone: string; sessionsCount: number; operatorName?: string }
  ) => {
    const newPhoto: PhotoStrip = {
      id: "strip_" + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      dataUrl,
      ...metadata,
    };

    setPhotos((prev) => {
      const updated = [newPhoto, ...prev];
      lsSetPhotos(updated);
      return updated;
    });

    try {
      await supabase.from("photo_strips").insert({
        id: newPhoto.id,
        data_url: newPhoto.dataUrl,
        customer_name: metadata?.customerName ?? null,
        customer_phone: metadata?.customerPhone ?? null,
        sessions_count: metadata?.sessionsCount ?? 1,
        operator_name: metadata?.operatorName ?? null,
        timestamp: newPhoto.timestamp,
      });
    } catch (err) {
      console.error("[Supabase] addPhoto error:", err);
    }
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      lsSetPhotos(updated);
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

  const addLayoutAsset = useCallback(async (layout: Omit<LayoutAsset, "id">) => {
    const newLayout: LayoutAsset = { ...layout, id: "layout_" + Date.now() };
    setConfig((prev) => {
      const updated = { ...prev, customLayouts: [...(prev.customLayouts || []), newLayout] };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      await supabase.from("layout_assets").insert({
        id: newLayout.id,
        name: newLayout.name,
        count: newLayout.count,
        description: newLayout.description,
      });
    } catch (err) {
      console.error("[Supabase] addLayoutAsset error:", err);
    }
  }, []);

  const deleteLayoutAsset = useCallback(async (id: string) => {
    setConfig((prev) => {
      const updated = { ...prev, customLayouts: (prev.customLayouts || []).filter((l) => l.id !== id) };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      await supabase.from("layout_assets").delete().eq("id", id);
    } catch (err) {
      console.error("[Supabase] deleteLayoutAsset error:", err);
    }
  }, []);

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
        layout_id: newPreset.layoutId,
        frame_style: newPreset.frameStyle,
        frame_text: newPreset.frameText,
        image_overlay: newPreset.imageOverlay,
        custom_slots: newPreset.customSlots,
        overlay_x: newPreset.overlayX,
        overlay_y: newPreset.overlayY,
        overlay_w: newPreset.overlayW,
        overlay_h: newPreset.overlayH,
        overlay_rotation: newPreset.overlayRotation,
        filter_id: newPreset.filterId,
        allowed_stickers: newPreset.allowedStickers,
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
        layout_id: fields.layoutId,
        frame_style: fields.frameStyle,
        frame_text: fields.frameText,
        image_overlay: fields.imageOverlay,
        custom_slots: fields.customSlots,
        overlay_x: fields.overlayX,
        overlay_y: fields.overlayY,
        overlay_w: fields.overlayW,
        overlay_h: fields.overlayH,
        overlay_rotation: fields.overlayRotation,
        filter_id: fields.filterId,
        allowed_stickers: fields.allowedStickers,
        force_layout: fields.forceLayout,
      }).eq("id", id);
    } catch (err) {
      console.error("[Supabase] updatePresetTemplate error:", err);
    }
  }, []);

  const deletePresetTemplate = useCallback(async (id: string) => {
    setConfig((prev) => {
      if (prev.activePresetTemplateId === id) {
        alert("Tidak bisa menghapus preset yang sedang aktif!");
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

      if (preset) {
        updated.frameStyle = preset.frameStyle;
        updated.frameText = preset.frameText;
      }
      setTimeout(() => saveConfig(updated), 0);
      return updated;
    });
  }, [saveConfig]);

  return {
    config,
    photos,
    isLoading,
    updateConfig,
    addFrame,
    updateFrame,
    deleteFrame,
    setActiveFrame,
    addPhoto,
    deletePhoto,
    clearPhotos,
    addLayoutAsset,
    deleteLayoutAsset,
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
