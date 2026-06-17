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
  paperSize?: "2R" | "4R";
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
  imageUrl: string; // emoji teks, atau public URL dari bucket 'sticker-assets'
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
  imageOverlay?: string;  // PNG overlay — public URL from 'preset-overlays' storage bucket
  customSlots?: SlotConfig[];
  overlayX?: number;      // overlay X position (%) — 0 = left edge
  overlayY?: number;      // overlay Y position (%) — 0 = top edge
  overlayW?: number;      // overlay width  (%) — 100 = full canvas width
  overlayH?: number;      // overlay height (%) — 100 = full canvas height
  overlayRotation?: number; // overlay rotation in degrees
  forceLayout: boolean;   // jika true, pilihan layout manual dikunci/diabaikan
  paperSize?: "2R" | "4R"; // ukuran kertas: "2R" (591x1772) atau "4R" (1205x1795)
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
  allowedPresets?: string[];
  allowedStickers?: string[];
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
  allowedPresets: [],
  allowedStickers: [],
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
    // imageOverlay dan sticker imageUrl kini menyimpan URL pendek dari bucket — tidak perlu strip.
    sessionStorage.setItem("glow_booth_config", JSON.stringify(cfg));
  } catch (err) {
    console.warn("[Storage] Failed to save config to sessionStorage:", err);
  }
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
    const cleanPhotos = photos.slice(0, 10).map((p, idx) => {
      // Hindari menyimpan string base64 yang sangat besar di sessionStorage
      const isBase64 = p.dataUrl?.startsWith("data:");
      return {
        id: p.id,
        timestamp: p.timestamp,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        sessionsCount: p.sessionsCount,
        operatorName: p.operatorName,
        paymentMethod: p.paymentMethod,
        amount: p.amount,
        dataUrl: idx < 2 && !isBase64 ? p.dataUrl : "",
      };
    });

    sessionStorage.setItem("glow_booth_photos", JSON.stringify(cleanPhotos));
  } catch (err) {
    console.warn("[Storage] Failed to save photos to sessionStorage:", err);
    try {
      sessionStorage.removeItem("glow_booth_photos");
    } catch {}
  }
}

// ─── Migration helper ─────────────────────────────────────────────────────────

function migrateConfig(parsed: EventConfig): { config: EventConfig; changed: boolean } {
  let changed = false;

  // Pastikan field inisialisasi lokal terisi lengkap meskipun absen dari JSON database
  if (!parsed.customFilters) { parsed.customFilters = []; changed = true; }
  if (!parsed.customStickers) { parsed.customStickers = []; changed = true; }
  if (!parsed.presetTemplates) { parsed.presetTemplates = []; changed = true; }
  if (parsed.activePresetTemplateId === undefined) { parsed.activePresetTemplateId = ""; changed = true; }
  if (parsed.countdownDuration === undefined) { parsed.countdownDuration = 3; changed = true; }
  if (parsed.mirrorDefault === undefined) { parsed.mirrorDefault = true; changed = true; }
  if (parsed.allowedFilters === undefined) { parsed.allowedFilters = ["original"]; changed = true; }
  if (parsed.allowedLayouts === undefined) { parsed.allowedLayouts = ["strip"]; changed = true; }
  if (parsed.allowedPresets === undefined) { parsed.allowedPresets = []; changed = true; }
  if (parsed.allowedStickers === undefined) { parsed.allowedStickers = []; changed = true; }

  return { config: parsed, changed };
}


// ─── Storage helpers (base64 to storage bucket) ─────────────────────────────

async function base64ToBlob(base64: string, defaultContentType = "image/png"): Promise<Blob> {
  try {
    const res = await fetch(base64);
    return await res.blob();
  } catch {
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

/** Upload foto strip / raw photo ke bucket 'photostrips' */
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

/**
 * Hapus file overlay dari bucket 'preset-overlays' berdasarkan presetId.
 * Dipanggil saat overlay dihapus, preset dihapus, atau sebelum diganti dengan overlay baru.
 */
async function deleteOverlayFromStorage(presetId: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from("preset-overlays")
      .list("overlays");
      
    if (error || !data) return;
    
    // Cari semua file yang diawali dengan presetId (misal preset_123_1718.png atau preset_123.png)
    const filesToDelete = data
      .filter(f => f.name.startsWith(presetId))
      .map(f => `overlays/${f.name}`);
      
    if (filesToDelete.length > 0) {
      await supabase.storage.from("preset-overlays").remove(filesToDelete);
    }
  } catch (err) {
    console.error("Gagal menghapus overlay lama dari storage:", err);
  }
}

/**
 * Upload gambar overlay preset ke bucket 'preset-overlays'.
 * Menerima base64 data URL atau URL publik yang sudah ada.
 * Mengembalikan public URL dari bucket.
 */
async function uploadOverlayToStorage(imageData: string, presetId: string): Promise<string> {
  // Jika sudah berupa URL (bukan base64), kembalikan langsung — tidak perlu re-upload
  if (!imageData.startsWith("data:")) return imageData;

  // Hapus overlay lama terlebih dahulu agar storage bersih dan cache ter-bust
  await deleteOverlayFromStorage(presetId).catch(() => {});

  const blob = await base64ToBlob(imageData);
  const ext = blob.type === "image/jpeg" ? "jpg" : "png";
  // Gunakan timestamp untuk cache busting di level browser
  const path = `overlays/${presetId}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("preset-overlays")
    .upload(path, blob, {
      contentType: blob.type || "image/png",
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("preset-overlays")
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Hapus file stiker dari bucket 'sticker-assets' berdasarkan stickerId.
 * Dipanggil saat stiker dihapus atau sebelum diganti dengan stiker baru.
 */
async function deleteStickerFromStorage(stickerId: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from("sticker-assets")
      .list("stickers");
      
    if (error || !data) return;
    
    // Cari semua file yang diawali dengan stickerId
    const filesToDelete = data
      .filter(f => f.name.startsWith(stickerId))
      .map(f => `stickers/${f.name}`);
      
    if (filesToDelete.length > 0) {
      await supabase.storage.from("sticker-assets").remove(filesToDelete);
    }
  } catch (err) {
    console.error("Gagal menghapus stiker lama dari storage:", err);
  }
}

/**
 * Upload gambar stiker PNG ke bucket 'sticker-assets'.
 * Hanya dipakai jika imageUrl adalah base64 (bukan teks emoji).
 * Mengembalikan public URL dari bucket.
 */
async function uploadStickerToStorage(imageData: string, stickerId: string): Promise<string> {
  // Jika sudah berupa URL atau teks emoji (bukan base64), kembalikan langsung
  if (!imageData.startsWith("data:")) return imageData;

  // Hapus stiker lama terlebih dahulu jika ada
  await deleteStickerFromStorage(stickerId).catch(() => {});

  const blob = await base64ToBlob(imageData, "image/png");
  // Gunakan timestamp untuk cache busting di level browser
  const path = `stickers/${stickerId}_${Date.now()}.png`;

  const { error } = await supabase.storage
    .from("sticker-assets")
    .upload(path, blob, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("sticker-assets")
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Hapus aset konfigurasi booth (logo / qris) dari storage bucket 'booth-config' berdasarkan jenis aset.
 */
async function deleteEventAssetFromStorage(prefix: "logo" | "qris"): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from("booth-config")
      .list("");
      
    if (error || !data) return;
    
    // Cari semua file yang diawali dengan prefix (misal logo_123.png)
    const filesToDelete = data
      .filter(f => f.name.startsWith(prefix))
      .map(f => f.name);
      
    if (filesToDelete.length > 0) {
      await supabase.storage.from("booth-config").remove(filesToDelete);
    }
  } catch (err) {
    console.error(`Gagal menghapus ${prefix} lama dari storage:`, err);
  }
}

/**
 * Upload logo atau QRIS ke bucket 'booth-config'.
 * Dipakai oleh konfigurasi utama booth (event_config), terpisah dari per-event.
 * Menerima base64 data URL.
 * Mengembalikan public URL dari bucket.
 */
async function uploadEventAssetToStorage(imageData: string, prefix: "logo" | "qris"): Promise<string> {
  if (!imageData.startsWith("data:")) return imageData;

  // Hapus aset lama sejenis agar storage bersih dan cache ter-bust
  await deleteEventAssetFromStorage(prefix).catch(() => {});

  const blob = await base64ToBlob(imageData);
  const ext = blob.type === "image/jpeg" ? "jpg" : "png";
  const path = `${prefix}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("booth-config")
    .upload(path, blob, {
      contentType: blob.type || "image/png",
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("booth-config")
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
      // Only show loading spinner if there's no cached data yet (first ever load)
      if (!cachedCfg) setIsLoading(true);
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
          // Jika database kosong (data dihapus/belum diinisialisasi), jangan gunakan data cache lokal
          // agar data lama tidak ter-restore secara otomatis ke database. Gunakan DEFAULT_CONFIG.
          baseConfig = DEFAULT_CONFIG;
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
          migrated.presetTemplates = presetsRows.map((r, index) => ({
            id: r.id,
            name: (r as any).name || "",
            imageOverlay: r.image_overlay || undefined,
            customSlots: r.custom_slots || undefined,
            overlayX: r.overlay_x !== null && r.overlay_x !== undefined ? Number(r.overlay_x) : undefined,
            overlayY: r.overlay_y !== null && r.overlay_y !== undefined ? Number(r.overlay_y) : undefined,
            overlayW: r.overlay_w !== null && r.overlay_w !== undefined ? Number(r.overlay_w) : undefined,
            overlayH: r.overlay_h !== null && r.overlay_h !== undefined ? Number(r.overlay_h) : undefined,
            overlayRotation: r.overlay_rotation !== null && r.overlay_rotation !== undefined ? Number(r.overlay_rotation) : undefined,
            forceLayout: r.force_layout ?? true,
            paperSize: r.paper_size || "2R",
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

  // ── Supabase Realtime: sync changes instantly across all components ────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Unique name per hook instance — prevents collision when multiple
    // components call usePhotoboothStore() at the same time.
    const channelName = `admin-realtime-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)

      // ── preset_templates ──
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "preset_templates" }, (payload) => {
        const r = payload.new as any;
        const newPreset: PresetTemplate = {
          id: r.id, name: r.name,
          imageOverlay: r.image_overlay || undefined,
          customSlots: r.custom_slots || undefined,
          overlayX: r.overlay_x != null ? Number(r.overlay_x) : undefined,
          overlayY: r.overlay_y != null ? Number(r.overlay_y) : undefined,
          overlayW: r.overlay_w != null ? Number(r.overlay_w) : undefined,
          overlayH: r.overlay_h != null ? Number(r.overlay_h) : undefined,
          overlayRotation: r.overlay_rotation != null ? Number(r.overlay_rotation) : undefined,
          forceLayout: r.force_layout ?? true,
          paperSize: r.paper_size || "2R",
        };
        setConfig((prev) => {
          if (prev.presetTemplates?.find(p => p.id === newPreset.id)) return prev;
          const updated = { ...prev, presetTemplates: [...(prev.presetTemplates || []), newPreset] };
          setTimeout(() => lsSetConfig(updated), 0);
          return updated;
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "preset_templates" }, (payload) => {
        const r = payload.new as any;
        setConfig((prev) => {
          const updated = {
            ...prev,
            presetTemplates: (prev.presetTemplates || []).map(p =>
              p.id === r.id ? {
                ...p,
                name: r.name,
                imageOverlay: r.image_overlay || undefined,
                customSlots: r.custom_slots || undefined,
                overlayX: r.overlay_x != null ? Number(r.overlay_x) : undefined,
                overlayY: r.overlay_y != null ? Number(r.overlay_y) : undefined,
                overlayW: r.overlay_w != null ? Number(r.overlay_w) : undefined,
                overlayH: r.overlay_h != null ? Number(r.overlay_h) : undefined,
                overlayRotation: r.overlay_rotation != null ? Number(r.overlay_rotation) : undefined,
                forceLayout: r.force_layout ?? true,
                paperSize: r.paper_size || "2R",
              } : p
            ),
          };
          setTimeout(() => lsSetConfig(updated), 0);
          return updated;
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "preset_templates" }, (payload) => {
        const deletedId = (payload.old as any).id;
        setConfig((prev) => {
          const updated = { ...prev, presetTemplates: (prev.presetTemplates || []).filter(p => p.id !== deletedId) };
          setTimeout(() => lsSetConfig(updated), 0);
          return updated;
        });
      })

      // ── filter_assets ──
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "filter_assets" }, (payload) => {
        const r = payload.new as any;
        const newFilter: FilterAsset = { id: r.id, name: r.name, css: r.css };
        setConfig((prev) => {
          if (prev.customFilters?.find(f => f.id === newFilter.id)) return prev;
          const updated = { ...prev, customFilters: [...(prev.customFilters || []), newFilter] };
          setTimeout(() => lsSetConfig(updated), 0);
          return updated;
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "filter_assets" }, (payload) => {
        const deletedId = (payload.old as any).id;
        setConfig((prev) => {
          const updated = { ...prev, customFilters: (prev.customFilters || []).filter(f => f.id !== deletedId) };
          setTimeout(() => lsSetConfig(updated), 0);
          return updated;
        });
      })

      // ── sticker_assets ──
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sticker_assets" }, (payload) => {
        const r = payload.new as any;
        const newSticker: StickerAsset = { id: r.id, name: r.name, imageUrl: r.image_url };
        setConfig((prev) => {
          if (prev.customStickers?.find(s => s.id === newSticker.id)) return prev;
          const updated = { ...prev, customStickers: [...(prev.customStickers || []), newSticker] };
          setTimeout(() => lsSetConfig(updated), 0);
          return updated;
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "sticker_assets" }, (payload) => {
        const deletedId = (payload.old as any).id;
        setConfig((prev) => {
          const updated = { ...prev, customStickers: (prev.customStickers || []).filter(s => s.id !== deletedId) };
          setTimeout(() => lsSetConfig(updated), 0);
          return updated;
        });
      })

      // ── photo_strips ──
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "photo_strips" }, (payload) => {
        const r = payload.new as any;
        const newPhoto: PhotoStrip = {
          id: r.id,
          dataUrl: r.data_url,
          customerName: r.customer_name ?? undefined,
          customerPhone: r.customer_phone ?? undefined,
          sessionsCount: r.sessions_count ?? undefined,
          timestamp: r.timestamp ?? new Date().toLocaleTimeString(),
          capturedPhotos: r.captured_photos ?? undefined,
          operatorName: r.operator_name ?? undefined,
          paymentMethod: r.payment_method ?? undefined,
          amount: r.amount ?? undefined,
        };
        setPhotos((prev) => {
          if (prev.find(p => p.id === newPhoto.id)) return prev;
          const updated = [newPhoto, ...prev];
          setTimeout(() => lsSetPhotos(updated), 0);
          return updated;
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "photo_strips" }, (payload) => {
        const deletedId = (payload.old as any).id;
        setPhotos((prev) => {
          const updated = prev.filter(p => p.id !== deletedId);
          setTimeout(() => lsSetPhotos(updated), 0);
          return updated;
        });
      })

      // ── event_config ──
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "event_config" }, (payload) => {
        const newCfgJson = (payload.new as any).config_json;
        if (newCfgJson) {
          setConfig((prev) => {
            const merged: EventConfig = {
              ...prev,
              ...newCfgJson,
              customFilters: prev.customFilters,
              customStickers: prev.customStickers,
              presetTemplates: prev.presetTemplates,
            };
            setTimeout(() => lsSetConfig(merged), 0);
            return merged;
          });
        }
      })

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveConfig = useCallback(async (newConfig: EventConfig): Promise<boolean> => {
    let finalLogoUrl = newConfig.logoUrl;
    let finalQrisUrl = newConfig.qrisUrl;
    let hasChanges = false;

    // 1. Upload logo jika base64
    if (newConfig.logoUrl && newConfig.logoUrl.startsWith("data:")) {
      try {
        finalLogoUrl = await uploadEventAssetToStorage(newConfig.logoUrl, "logo");
        hasChanges = true;
      } catch (err) {
        console.error("[Storage] Gagal mengunggah logo:", err);
        toast.error("Gagal mengunggah logo ke storage bucket 'booth-config'.");
        return false;
      }
    } else if (newConfig.logoUrl === "" || newConfig.logoUrl === undefined || newConfig.logoUrl === null) {
      // Hapus jika dikosongkan
      await deleteEventAssetFromStorage("logo").catch(() => {});
    }

    // 2. Upload QRIS jika base64
    if (newConfig.qrisUrl && newConfig.qrisUrl.startsWith("data:")) {
      try {
        finalQrisUrl = await uploadEventAssetToStorage(newConfig.qrisUrl, "qris");
        hasChanges = true;
      } catch (err) {
        console.error("[Storage] Gagal mengunggah QRIS:", err);
        toast.error("Gagal mengunggah barcode QRIS ke storage bucket 'booth-config'.");
        return false;
      }
    } else if (newConfig.qrisUrl === "" || newConfig.qrisUrl === undefined || newConfig.qrisUrl === null) {
      // Hapus jika dikosongkan
      await deleteEventAssetFromStorage("qris").catch(() => {});
    }

    const updatedConfig = {
      ...newConfig,
      logoUrl: finalLogoUrl,
      qrisUrl: finalQrisUrl,
    };

    if (hasChanges) {
      setConfig(updatedConfig);
      lsSetConfig(updatedConfig);
    }

    try {
      // Hanya simpan field-field penting ke config_json di database Supabase
      // agar kolom database tetap bersih dari key-key tidak terpakai
      const metadataOnly = {
        eventName: updatedConfig.eventName,
        pricePerSession: updatedConfig.pricePerSession,
        logoUrl: updatedConfig.logoUrl,
        qrisUrl: updatedConfig.qrisUrl,
        date: updatedConfig.date,
        time: updatedConfig.time,
      };
      const { error } = await supabase
        .from("event_config")
        .upsert({ id: "default", config_json: metadataOnly, updated_at: new Date().toISOString() });
      
      if (error) {
        console.error("[Supabase] saveConfig DB error:", error);
        toast.error(`Gagal menyimpan konfigurasi ke database: ${error.message}`);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error("[Supabase] saveConfig error:", err);
      toast.error(`Terjadi kesalahan saat menyimpan pengaturan: ${err.message || err}`);
      return false;
    }
  }, []);

  const updateConfig = useCallback(async (fields: Partial<EventConfig>): Promise<boolean> => {
    try {
      let updatedConfig: EventConfig = DEFAULT_CONFIG;
      setConfig((prev) => {
        updatedConfig = { ...prev, ...fields };
        return updatedConfig;
      });
      
      // Tunggu hingga penyimpanan Supabase dan upload storage selesai
      const success = await saveConfig(updatedConfig);
      return success;
    } catch (err) {
      console.error(err);
      return false;
    }
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
        event_name: config.eventName || null,
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

      // Update state lokal dan storage dengan URL final dari Supabase Storage
      setPhotos((prev) => {
        const updated = prev.map((p) =>
          p.id === newId
            ? { ...p, dataUrl: finalDataUrl, capturedPhotos: finalCapturedPhotos }
            : p
        );
        setTimeout(() => lsSetPhotos(updated), 0);
        return updated;
      });

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

  const addStickerAsset = useCallback(async (sticker: Omit<StickerAsset, "id">): Promise<boolean> => {
    const newStickerId = "sticker_" + Date.now();
    let finalImageUrl = sticker.imageUrl;

    try {
      // 1. Upload ke bucket terlebih dahulu jika base64
      if (sticker.imageUrl.startsWith("data:")) {
        try {
          finalImageUrl = await uploadStickerToStorage(sticker.imageUrl, newStickerId);
        } catch (uploadErr: any) {
          console.error("[Storage] Gagal upload stiker:", uploadErr);
          toast.error("Gagal mengunggah stiker. Harap pastikan storage bucket 'sticker-assets' sudah dibuat di Supabase Dashboard (SQL Editor) dengan RLS policy yang sesuai.");
          return false;
        }
      }

      // 2. Insert ke database
      const { error: dbErr } = await supabase.from("sticker_assets").insert({
        id: newStickerId,
        name: sticker.name,
        image_url: finalImageUrl,
      });

      if (dbErr) {
        console.error("[Supabase] Gagal menyimpan stiker ke database:", dbErr);
        toast.error(`Gagal menyimpan stiker: ${dbErr.message}`);
        return false;
      }

      // 3. Update state lokal setelah sukses
      const newSticker: StickerAsset = {
        id: newStickerId,
        name: sticker.name,
        imageUrl: finalImageUrl,
      };

      setConfig((prev) => {
        if (prev.customStickers?.find(s => s.id === newSticker.id)) return prev;
        const updated = { ...prev, customStickers: [...(prev.customStickers || []), newSticker] };
        setTimeout(() => lsSetConfig(updated), 0);
        return updated;
      });

      return true;
    } catch (err: any) {
      console.error("[Supabase] addStickerAsset error:", err);
      toast.error(`Terjadi kesalahan: ${err.message || err}`);
      return false;
    }
  }, []);

  const deleteStickerAsset = useCallback(async (id: string) => {
    setConfig((prev) => {
      const updated = { ...prev, customStickers: (prev.customStickers || []).filter((s) => s.id !== id) };
      setTimeout(() => lsSetConfig(updated), 0);
      return updated;
    });
    try {
      // Hapus file dari bucket jika ada (emoji teks tidak punya file di bucket)
      deleteStickerFromStorage(id).catch(() => {});
      await supabase.from("sticker_assets").delete().eq("id", id);
    } catch (err) {
      console.error("[Supabase] deleteStickerAsset error:", err);
    }
  }, []);

  const addPresetTemplate = useCallback(async (preset: Omit<PresetTemplate, "id">): Promise<boolean> => {
    const newPresetId = "preset_" + Date.now();
    let overlayUrl: string | null = null;

    try {
      // 1. Upload ke bucket terlebih dahulu jika ada overlay base64
      if (preset.imageOverlay && preset.imageOverlay.startsWith("data:")) {
        try {
          overlayUrl = await uploadOverlayToStorage(preset.imageOverlay, newPresetId);
        } catch (uploadErr: any) {
          console.error("[Storage] Gagal upload overlay:", uploadErr);
          toast.error("Gagal mengunggah gambar overlay. Harap pastikan storage bucket 'preset-overlays' sudah dibuat di Supabase Dashboard (SQL Editor) dengan RLS policy yang sesuai.");
          return false;
        }
      } else if (preset.imageOverlay) {
        overlayUrl = preset.imageOverlay;
      }

      // 2. Insert ke database
      const { error: dbErr } = await supabase.from("preset_templates").insert({
        id: newPresetId,
        image_overlay: overlayUrl,
        custom_slots: preset.customSlots || null,
        overlay_x: preset.overlayX ?? 0,
        overlay_y: preset.overlayY ?? 0,
        overlay_w: preset.overlayW ?? 100,
        overlay_h: preset.overlayH ?? 100,
        overlay_rotation: preset.overlayRotation ?? 0,
        force_layout: preset.forceLayout,
        paper_size: preset.paperSize || "2R",
      });

      if (dbErr) {
        console.error("[Supabase] Gagal menyimpan preset template ke database:", dbErr);
        toast.error(`Gagal menyimpan template: ${dbErr.message}`);
        return false;
      }

      // 3. Update state lokal setelah sukses
      const newPreset: PresetTemplate = {
        id: newPresetId,
        name: preset.name,
        imageOverlay: overlayUrl ?? undefined,
        customSlots: preset.customSlots,
        overlayX: preset.overlayX,
        overlayY: preset.overlayY,
        overlayW: preset.overlayW,
        overlayH: preset.overlayH,
        overlayRotation: preset.overlayRotation,
        forceLayout: preset.forceLayout,
        paperSize: preset.paperSize || "2R",
      };

      setConfig((prev) => {
        if (prev.presetTemplates?.find(p => p.id === newPreset.id)) return prev;
        const updated = { ...prev, presetTemplates: [...(prev.presetTemplates || []), newPreset] };
        setTimeout(() => lsSetConfig(updated), 0);
        return updated;
      });

      return true;
    } catch (err: any) {
      console.error("[Supabase] addPresetTemplate error:", err);
      toast.error(`Terjadi kesalahan: ${err.message || err}`);
      return false;
    }
  }, []);

  const updatePresetTemplate = useCallback(async (id: string, fields: Partial<PresetTemplate>): Promise<boolean> => {
    try {
      let overlayUrl: string | null | undefined = fields.imageOverlay;

      // 1. Upload ke bucket terlebih dahulu jika overlay baru berupa base64
      if (fields.imageOverlay && fields.imageOverlay.startsWith("data:")) {
        try {
          overlayUrl = await uploadOverlayToStorage(fields.imageOverlay, id);
        } catch (uploadErr: any) {
          console.error("[Storage] Gagal upload overlay saat update:", uploadErr);
          toast.error("Gagal mengunggah gambar overlay baru. Harap pastikan storage bucket 'preset-overlays' sudah dibuat di Supabase Dashboard (SQL Editor) dengan RLS policy yang sesuai.");
          return false;
        }
      } else if (fields.imageOverlay === undefined || fields.imageOverlay === null || fields.imageOverlay === "") {
        // Overlay dihapus — bersihkan file lama dari bucket
        overlayUrl = null;
        deleteOverlayFromStorage(id).catch(() => {});
      }

      // 2. Siapkan fields database
      const dbFields: Record<string, unknown> = {
        custom_slots: fields.customSlots,
        overlay_x: fields.overlayX,
        overlay_y: fields.overlayY,
        overlay_w: fields.overlayW,
        overlay_h: fields.overlayH,
        overlay_rotation: fields.overlayRotation,
        force_layout: fields.forceLayout,
        paper_size: fields.paperSize,
      };

      // Hanya sertakan image_overlay jika ada perubahan pada field overlay
      if ("imageOverlay" in fields) {
        dbFields.image_overlay = overlayUrl ?? null;
      }

      // 3. Update ke database
      const { error: dbErr } = await supabase.from("preset_templates").update(dbFields).eq("id", id);

      if (dbErr) {
        console.error("[Supabase] Gagal mengupdate preset template di database:", dbErr);
        toast.error(`Gagal memperbarui template: ${dbErr.message}`);
        return false;
      }

      // 4. Update state lokal setelah sukses
      setConfig((prev) => {
        const updatedPresets = (prev.presetTemplates || []).map((p) => {
          if (p.id === id) {
            const updatedPreset = { ...p, ...fields };
            if ("imageOverlay" in fields) {
              updatedPreset.imageOverlay = overlayUrl ?? undefined;
            }
            return updatedPreset;
          }
          return p;
        });
        const updated = { ...prev, presetTemplates: updatedPresets };
        setTimeout(() => lsSetConfig(updated), 0);
        return updated;
      });

      return true;
    } catch (err: any) {
      console.error("[Supabase] updatePresetTemplate error:", err);
      toast.error(`Terjadi kesalahan: ${err.message || err}`);
      return false;
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
      // Hapus file overlay dari bucket jika ada
      deleteOverlayFromStorage(id).catch(() => {});
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
