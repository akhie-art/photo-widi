"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { addToQueue, getQueue, removeFromQueue } from "@/lib/offlineQueue";

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
  bgTheme?: string;
  fontStyle?: string;
  welcomeText?: string;
  footerText?: string;
  showPayment?: boolean;
  showSetup?: boolean;
  printerName?: string;
  printerPaperLimit?: number;
  autoPrintEnabled?: boolean;
  cameraDeviceId?: string;
  cameraResolution?: string;
  printerConnectionType?: "usb" | "bluetooth" | "browser";
  bluetoothDeviceName?: string;
}

export interface UiTemplate {
  id: string;
  name: string;
  bgTheme: string;
  fontStyle: string;
  welcomeText: string;
  footerText: string;
  showPayment: boolean;
  showSetup: boolean;
  mirrorDefault: boolean;
  countdownDuration: number;
  allowedLayouts: string[];
  logoUrl?: string;
  qrisUrl?: string;
  created_at?: string;
  customization?: any;
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

export const GLOBAL_BOOTH_ID = "00000000-0000-0000-0000-000000000000";
export const ORIGINAL_FILTER_ID = "00000000-0000-0000-0000-000000000001";

export function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_CONFIG: EventConfig = {
  eventName: "",
  date: "",
  time: "",
  location: "",
  frameStyle: "neon",
  frameText: "",
  countdownDuration: 3,
  allowedFilters: [ORIGINAL_FILTER_ID],
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
  bgTheme: "sunset",
  fontStyle: "inter",
  welcomeText: "Silakan pilih salah satu opsi pembayaran di bawah ini untuk memulai sesi foto Anda.",
  footerText: "© 2026 Glowbooth Studio. All rights reserved.",
  showPayment: true,
  showSetup: true,
  printerName: "Default USB Printer",
  printerPaperLimit: 100,
  autoPrintEnabled: false,
  cameraDeviceId: "default",
  cameraResolution: "1080p",
  printerConnectionType: "browser",
  bluetoothDeviceName: "",
};

// ─── LocalStorage helpers (fallback & cross-tab sync cache) ───────────────────

function lsGetConfig(): EventConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const isOperator = window.location.pathname.startsWith("/operator");
    const key = isOperator ? "glow_operator_config" : "glow_global_config";
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function lsSetConfig(cfg: EventConfig) {
  if (typeof window === "undefined") return;
  try {
    const isOperator = window.location.pathname.startsWith("/operator");
    const key = isOperator ? "glow_operator_config" : "glow_global_config";
    // imageOverlay dan sticker imageUrl kini menyimpan URL pendek dari bucket — tidak perlu strip.
    sessionStorage.setItem(key, JSON.stringify(cfg));
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
        dataUrl: !isBase64 ? p.dataUrl : (idx < 2 ? p.dataUrl : ""),
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
  if (parsed.allowedFilters === undefined) { parsed.allowedFilters = [ORIGINAL_FILTER_ID]; changed = true; }
  if (parsed.allowedLayouts === undefined) { parsed.allowedLayouts = ["strip"]; changed = true; }
  if (parsed.allowedPresets === undefined) { parsed.allowedPresets = []; changed = true; }
  if (parsed.allowedStickers === undefined) { parsed.allowedStickers = []; changed = true; }
  if (parsed.bgTheme === undefined) { parsed.bgTheme = "sunset"; changed = true; }
  if (parsed.fontStyle === undefined) { parsed.fontStyle = "inter"; changed = true; }
  if (parsed.welcomeText === undefined) { parsed.welcomeText = "Silakan pilih salah satu opsi pembayaran di bawah ini untuk memulai sesi foto Anda."; changed = true; }
  if (parsed.footerText === undefined) { parsed.footerText = "© 2026 Glowbooth Studio. All rights reserved."; changed = true; }
  if (parsed.showPayment === undefined) { parsed.showPayment = true; changed = true; }
  if (parsed.showSetup === undefined) { parsed.showSetup = true; changed = true; }
  if (parsed.printerName === undefined) { parsed.printerName = "Default USB Printer"; changed = true; }
  if (parsed.printerPaperLimit === undefined) { parsed.printerPaperLimit = 100; changed = true; }
  if (parsed.autoPrintEnabled === undefined) { parsed.autoPrintEnabled = false; changed = true; }
  if (parsed.cameraDeviceId === undefined) { parsed.cameraDeviceId = "default"; changed = true; }
  if (parsed.cameraResolution === undefined) { parsed.cameraResolution = "1080p"; changed = true; }
  if (parsed.printerConnectionType === undefined) { parsed.printerConnectionType = "browser"; changed = true; }
  if (parsed.bluetoothDeviceName === undefined) { parsed.bluetoothDeviceName = ""; changed = true; }

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
 * Dipakai oleh konfigurasi utama booth (booth_config), terpisah dari per-event.
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

/**
 * Upload logo atau QRIS template UI/UX ke subfolder templates/ di bucket 'booth-config'.
 */
async function uploadUiTemplateAssetToStorage(templateId: string, imageData: string, prefix: "logo" | "qris" | "groom" | "bride"): Promise<string> {
  if (!imageData.startsWith("data:")) return imageData;
  
  // Hapus aset lama sejenis jika ada untuk template ini
  try {
    const { data } = await supabase.storage.from("booth-config").list(`templates/${templateId}`);
    if (data && data.length > 0) {
      const filesToDelete = data
        .filter(f => f.name.startsWith(prefix))
        .map(f => `templates/${templateId}/${f.name}`);
      if (filesToDelete.length > 0) {
        await supabase.storage.from("booth-config").remove(filesToDelete);
      }
    }
  } catch (err) {
    console.warn("Gagal membersihkan aset lama UI template:", err);
  }

  const blob = await base64ToBlob(imageData);
  const ext = blob.type === "image/jpeg" ? "jpg" : "png";
  const path = `templates/${templateId}/${prefix}_${Date.now()}.${ext}`;

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

async function saveUiComponents(templateId: string, customization: any) {
  if (!customization) return;

  const componentGroups = [
    {
      component_id: "logo",
      properties: {
        hideLogo: customization.hideLogo,
        logoSize: customization.logoSize,
        logoScale: customization.logoScale,
        logoRotate: customization.logoRotate,
        logoX: customization.logoX,
        logoY: customization.logoY,
      }
    },
    {
      component_id: "welcomeText",
      properties: {
        hideWelcomeText: customization.hideWelcomeText,
        welcomeTextSize: customization.welcomeTextSize,
        welcomeTextAlignment: customization.welcomeTextAlignment,
        customWelcomeTextColor: customization.customWelcomeTextColor,
        couplePhotoUrl: customization.couplePhotoUrl,
        couplePhotoScale: customization.couplePhotoScale,
        couplePhotoRotate: customization.couplePhotoRotate,
        couplePhotoX: customization.couplePhotoX,
        couplePhotoY: customization.couplePhotoY,
        welcomeTextScale: customization.welcomeTextScale,
        welcomeTextRotate: customization.welcomeTextRotate,
        welcomeTextX: customization.welcomeTextX,
        welcomeTextY: customization.welcomeTextY,
        groomLabel: customization.groomLabel,
        groomSubLabel: customization.groomSubLabel,
        groomPhotoUrl: customization.groomPhotoUrl,
        brideLabel: customization.brideLabel,
        brideSubLabel: customization.brideSubLabel,
        bridePhotoUrl: customization.bridePhotoUrl,
        groomScale: customization.groomScale,
        groomRotate: customization.groomRotate,
        groomX: customization.groomX,
        groomY: customization.groomY,
        brideScale: customization.brideScale,
        brideRotate: customization.brideRotate,
        brideX: customization.brideX,
        brideY: customization.brideY,
      }
    },
    {
      component_id: "formRegistrasi",
      properties: {
        hideFormRegistrasi: customization.hideFormRegistrasi,
        visitorFormLabel: customization.visitorFormLabel,
        customerNameLabel: customization.customerNameLabel,
        customerPhoneLabel: customization.customerPhoneLabel,
        sessionsCountLabel: customization.sessionsCountLabel,
        formCardPadding: customization.formCardPadding,
        inputBgStyle: customization.inputBgStyle,
        cardBorderRadius: customization.cardBorderRadius,
        cardShadow: customization.cardShadow,
        cardStyle: customization.cardStyle,
        formScale: customization.formScale,
        formRotate: customization.formRotate,
        formX: customization.formX,
        formY: customization.formY,
      }
    },
    {
      component_id: "startBtn",
      properties: {
        hideStartBtn: customization.hideStartBtn,
        startButtonText: customization.startButtonText,
        startButtonSize: customization.startButtonSize,
        primaryColor: customization.primaryColor,
        buttonStyle: customization.buttonStyle,
        customButtonTextColor: customization.customButtonTextColor,
        startBtnScale: customization.startBtnScale,
        startBtnRotate: customization.startBtnRotate,
        startBtnX: customization.startBtnX,
        startBtnY: customization.startBtnY,
      }
    },
    {
      component_id: "footerText",
      properties: {
        hideFooterText: customization.hideFooterText,
        footerScale: customization.footerScale,
        footerRotate: customization.footerRotate,
        footerX: customization.footerX,
        footerY: customization.footerY,
      }
    },
    {
      component_id: "qrisUpload",
      properties: {}
    },
    {
      component_id: "customCard",
      properties: {
        showCustomCard: customization.showCustomCard,
        customCardTitle: customization.customCardTitle,
        customCardContent: customization.customCardContent,
        customCardScale: customization.customCardScale,
        customCardRotate: customization.customCardRotate,
        customCardX: customization.customCardX,
        customCardY: customization.customCardY,
      }
    }
  ];

  const upsertPromises = componentGroups.map(comp => {
    return supabase
      .from("ui_components")
      .upsert({
        ui_template_id: templateId,
        component_id: comp.component_id,
        properties: comp.properties,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "ui_template_id,component_id"
      });
  });

  await Promise.all(upsertPromises);
}

// ─── Main Hook ────────────────────────────────────────────────────────────────

export function usePhotoboothStore() {
  const [config, setConfig] = useState<EventConfig>(() => {
    return lsGetConfig() || DEFAULT_CONFIG;
  });
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [photos, setPhotos] = useState<PhotoStrip[]>([]);
  const [uiTemplates, setUiTemplates] = useState<UiTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // ── Offline Queue Sync Mechanism ───────────────────────────────────────────
  const syncOfflineQueue = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine || isSyncing) return;

    const queue = await getQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    const syncToastId = toast.loading(`Menyinkronkan ${queue.length} foto dari antrean lokal...`);

    let successCount = 0;
    for (const job of queue) {
      try {
        let finalDataUrl = job.dataUrl;
        let finalCapturedPhotos = job.metadata.capturedPhotos || [];

        // Upload main strip image
        try {
          finalDataUrl = await uploadImageToStorage(job.dataUrl, `strips/${job.id}.png`);
        } catch (err) {
          console.warn(`[Sync] Failed to upload photo strip for ${job.id}:`, err);
        }

        // Upload raw captured photos
        if (job.metadata.capturedPhotos && job.metadata.capturedPhotos.length > 0) {
          try {
            const uploadPromises = job.metadata.capturedPhotos.map((p, idx) =>
              uploadImageToStorage(p, `raw/${job.id}_raw_${idx}.png`)
            );
            finalCapturedPhotos = await Promise.all(uploadPromises);
          } catch (err) {
            console.warn(`[Sync] Failed to upload raw photos for ${job.id}:`, err);
          }
        }

        const payload: any = {
          id: job.id,
          data_url: finalDataUrl,
          customer_name: job.metadata.customerName ?? null,
          customer_phone: job.metadata.customerPhone ?? null,
          sessions_count: job.metadata.sessionsCount ?? 1,
          operator_name: job.metadata.operatorName ?? null,
          timestamp: job.timestamp,
          payment_method: job.metadata.paymentMethod ?? null,
          amount: job.metadata.amount ?? null,
          event_name: job.eventName || null,
        };

        if (finalCapturedPhotos.length > 0) {
          payload.captured_photos = finalCapturedPhotos;
        }

        const { error } = await supabase.from("photo_strips").insert(payload);
        if (error) {
          if (error.message?.includes("captured_photos") || error.code === "P0002" || error.code === "42703") {
            delete payload.captured_photos;
            const { error: fallbackErr } = await supabase.from("photo_strips").insert(payload);
            if (fallbackErr) throw fallbackErr;
          } else {
            throw error;
          }
        }

        // Remove from IndexedDB queue
        await removeFromQueue(job.id);
        successCount++;

        // Update local state with the uploaded storage URLs
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === job.id
              ? { ...p, dataUrl: finalDataUrl, capturedPhotos: finalCapturedPhotos }
              : p
          )
        );
      } catch (err) {
        console.error(`[Sync] Failed to sync job ${job.id}:`, err);
      }
    }

    setIsSyncing(false);
    toast.dismiss(syncToastId);
    if (successCount > 0) {
      toast.success(`Berhasil menyinkronkan ${successCount} foto ke server!`);
    }
  }, [isSyncing]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check/sync on mount
    syncOfflineQueue();

    // Listen to network changes
    window.addEventListener("online", syncOfflineQueue);
    return () => {
      window.removeEventListener("online", syncOfflineQueue);
    };
  }, [syncOfflineQueue]);

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
          .from("booth_config")
          .select("config_json")
          .eq("id", GLOBAL_BOOTH_ID)
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
            imageUrl: r.image_url,
          }));
        }
        let dbPresets: PresetTemplate[] = [];
        if (presetsRows && presetsRows.length > 0) {
          dbPresets = presetsRows.map((r) => ({
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

        const defaultPresets = [
          {
            id: "8b1d3d63-b8e7-4f67-8e68-e4b78fa7b2a1",
            name: "Sekolah",
            customSlots: [
              { id: "slot_sekolah_1", xPct: 5, yPct: 2, widthPct: 90, heightPct: 20.8, rotation: 0 },
              { id: "slot_sekolah_2", xPct: 5, yPct: 24.3, widthPct: 90, heightPct: 20.8, rotation: 0 },
              { id: "slot_sekolah_3", xPct: 5, yPct: 46.6, widthPct: 90, heightPct: 20.8, rotation: 0 },
              { id: "slot_sekolah_4", xPct: 5, yPct: 68.9, widthPct: 90, heightPct: 20.8, rotation: 0 }
            ],
            forceLayout: true,
            paperSize: "2R" as const
          },
          {
            id: "9c2e4e74-c9f8-5a78-9f79-f5c89fb8c3b2",
            name: "Wisuda",
            customSlots: [
              { id: "slot_wisuda_1", xPct: 5, yPct: 5, widthPct: 43, heightPct: 38, rotation: 0 },
              { id: "slot_wisuda_2", xPct: 52, yPct: 5, widthPct: 43, heightPct: 38, rotation: 0 },
              { id: "slot_wisuda_3", xPct: 5, yPct: 47, widthPct: 43, heightPct: 38, rotation: 0 },
              { id: "slot_wisuda_4", xPct: 52, yPct: 47, widthPct: 43, heightPct: 38, rotation: 0 }
            ],
            forceLayout: true,
            paperSize: "4R" as const
          },
          {
            id: "0d3f5f85-da09-6b89-0fa0-06d9afc9d4c3",
            name: "Wedding",
            customSlots: [
              { id: "slot_wedding_1", xPct: 5, yPct: 3, widthPct: 90, heightPct: 23.6, rotation: 0 },
              { id: "slot_wedding_2", xPct: 5, yPct: 28.6, widthPct: 90, heightPct: 23.6, rotation: 0 },
              { id: "slot_wedding_3", xPct: 5, yPct: 54.2, widthPct: 90, heightPct: 23.6, rotation: 0 }
            ],
            forceLayout: true,
            paperSize: "2R" as const
          }
        ];

        const missingDefaults = defaultPresets.filter(
          def => !dbPresets.some(db => db.id === def.id || db.name.toLowerCase() === def.name.toLowerCase())
        );

        if (missingDefaults.length > 0) {
          dbPresets = [...dbPresets, ...missingDefaults];
          try {
            const dbInsertData = missingDefaults.map(p => ({
              id: p.id,
              name: p.name,
              custom_slots: p.customSlots,
              force_layout: p.forceLayout,
              paper_size: p.paperSize
            }));
            supabase.from("preset_templates").insert(dbInsertData).then(({ error }) => {
              if (error) console.error("Failed to seed missing default presets into database:", error);
            });
          } catch (err) {
            console.error("Failed to seed missing default presets:", err);
          }
        }

        migrated.presetTemplates = dbPresets;

        setConfig(migrated);
        lsSetConfig(migrated);

        // ── 2b. Fetch UI Templates & Components ──
        let uiTemplatesRows: any[] | null = null;
        let uiComponentsRows: any[] | null = null;
        try {
          const [tplRes, compRes] = await Promise.all([
            supabase.from("ui_templates").select("*").order("created_at", { ascending: true }),
            supabase.from("ui_components").select("*")
          ]);
          if (!tplRes.error) uiTemplatesRows = tplRes.data;
          if (!compRes.error) uiComponentsRows = compRes.data;
        } catch (err) {
          console.warn("Table ui_templates or ui_components might not exist yet:", err);
        }

        if (uiTemplatesRows) {
          const mappedTemplates = uiTemplatesRows.map(row => {
            const customizationData: any = {};
            if (uiComponentsRows) {
              const comps = uiComponentsRows.filter(c => c.ui_template_id === row.id);
              comps.forEach(c => {
                Object.assign(customizationData, c.properties);
              });
            }
            return {
              id: row.id,
              name: row.name,
              bgTheme: row.bg_theme || "sunset",
              fontStyle: row.font_style || "inter",
              welcomeText: row.welcome_text || "",
              footerText: row.footer_text || "",
              showPayment: row.show_payment !== false,
              showSetup: row.show_setup !== false,
              mirrorDefault: row.mirror_default !== false,
              countdownDuration: row.countdown_duration ?? 3,
              allowedLayouts: row.allowed_layouts || ["strip"],
              logoUrl: row.logo_url || "",
              qrisUrl: row.qris_url || "",
              customization: Object.keys(customizationData).length > 0 ? customizationData : undefined,
            };
          });

          // Seed default UI templates (Wedding, Sekolah, Wisuda) if they don't exist or lack cardStyle styling
          const finalTemplates = [...mappedTemplates];
          let seededAny = false;

          // 1. Seed Wedding Template
          const weddingId = "8a3b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d";
          const weddingTemplate = mappedTemplates.find(t => t.id === weddingId);
          const needsWeddingUpdate = !weddingTemplate || !weddingTemplate.customization || !weddingTemplate.customization.cardStyle;
          if (needsWeddingUpdate) {
            seededAny = true;
            const weddingData = {
              id: weddingId,
              name: "Royal Wedding (Dekorasi Full)",
              bg_theme: "romantic",
              font_style: "playfair",
              welcome_text: "Silakan isi data kunjungan Anda untuk memasuki resepsi pernikahan kami dan mengabadikan momen bahagia ini.",
              footer_text: "Happy Wedding • Powered by Glowbooth",
              show_payment: true,
              show_setup: true,
              mirror_default: true,
              countdown_duration: 3,
              allowed_layouts: ["Wedding"],
              logo_url: "",
              qris_url: ""
            };
            const weddingComps = [
              { ui_template_id: weddingId, component_id: "logo", properties: { hideLogo: true, logoSize: "md" } },
              { ui_template_id: weddingId, component_id: "welcomeText", properties: { hideWelcomeText: false, welcomeTextSize: "lg", welcomeTextAlignment: "center", customWelcomeTextColor: "#e11d48", couplePhotoUrl: "/wedding-couple.png" } },
              { ui_template_id: weddingId, component_id: "formRegistrasi", properties: { hideFormRegistrasi: false, visitorFormLabel: "DATA TAMU UNDANGAN", customerNameLabel: "Nama Undangan", customerPhoneLabel: "Nomor WhatsApp", sessionsCountLabel: "Jumlah Cetak", formCardPadding: "lg", inputBgStyle: "white", cardBorderRadius: "2xl", cardShadow: "2xl", cardStyle: "frameless" } },
              { ui_template_id: weddingId, component_id: "startBtn", properties: { hideStartBtn: false, startButtonText: "Masuk & Mulai Sesi Foto ✨", startButtonSize: "lg", primaryColor: "#e11d48", buttonStyle: "gradient", customButtonTextColor: "#ffffff" } },
              { ui_template_id: weddingId, component_id: "footerText", properties: { hideFooterText: false } },
              { ui_template_id: weddingId, component_id: "qrisUpload", properties: {} },
              { ui_template_id: weddingId, component_id: "customCard", properties: { showCustomCard: false, customCardTitle: "Info Kustom", customCardContent: "Silakan ketik petunjuk atau informasi tambahan di sini." } }
            ];

            const newTemplateObj = {
              id: weddingId,
              name: weddingData.name,
              bgTheme: weddingData.bg_theme,
              fontStyle: weddingData.font_style,
              welcomeText: weddingData.welcome_text,
              footerText: weddingData.footer_text,
              showPayment: weddingData.show_payment,
              showSetup: weddingData.show_setup,
              mirrorDefault: weddingData.mirror_default,
              countdownDuration: weddingData.countdown_duration,
              allowedLayouts: weddingData.allowed_layouts,
              logoUrl: weddingData.logo_url,
              qrisUrl: weddingData.qris_url,
              customization: {
                hideLogo: true,
                logoSize: "md",
                hideWelcomeText: false,
                welcomeTextSize: "lg",
                welcomeTextAlignment: "center",
                customWelcomeTextColor: "#e11d48",
                couplePhotoUrl: "/wedding-couple.png",
                hideFormRegistrasi: false,
                visitorFormLabel: "DATA TAMU UNDANGAN",
                customerNameLabel: "Nama Undangan",
                customerPhoneLabel: "Nomor WhatsApp",
                sessionsCountLabel: "Jumlah Cetak",
                formCardPadding: "lg",
                inputBgStyle: "white",
                cardBorderRadius: "2xl",
                cardShadow: "2xl",
                cardStyle: "frameless",
                hideStartBtn: false,
                startButtonText: "Masuk & Mulai Sesi Foto ✨",
                startButtonSize: "lg",
                primaryColor: "#e11d48",
                buttonStyle: "gradient",
                customButtonTextColor: "#ffffff",
                hideFooterText: false,
                showCustomCard: false,
                customCardTitle: "Info Kustom",
                customCardContent: "Silakan ketik petunjuk atau informasi tambahan di sini."
              }
            };

            const idx = finalTemplates.findIndex(t => t.id === weddingId);
            if (idx !== -1) {
              finalTemplates[idx] = newTemplateObj;
            } else {
              finalTemplates.push(newTemplateObj);
            }

            supabase.from("ui_templates").upsert(weddingData, { onConflict: "id" }).then(({ error }) => {
              if (!error) {
                supabase.from("ui_components").upsert(weddingComps, { onConflict: "ui_template_id,component_id" }).then(() => {
                  console.log("Successfully seeded/updated Wedding template in DB.");
                });
              }
            });
          }

          // 2. Seed Sekolah Template
          const sekolahId = "7b2c8d9e-1f2a-3b4c-5d6e-7f8a9b0c1d2e";
          const sekolahTemplate = mappedTemplates.find(t => t.id === sekolahId);
          const needsSekolahUpdate = !sekolahTemplate || !sekolahTemplate.customization || !sekolahTemplate.customization.cardStyle;
          if (needsSekolahUpdate) {
            seededAny = true;
            const sekolahData = {
              id: sekolahId,
              name: "Sekolah Ceria (Fun & Colorful)",
              bg_theme: "sunset",
              font_style: "outfit",
              welcome_text: "Halo Teman-Teman! Selamat datang di Photobooth Sekolah. Masukkan nama dan kelasmu untuk mencetak foto keseruan hari ini!",
              footer_text: "Pesta Sekolah • Powered by Glowbooth",
              show_payment: false,
              show_setup: true,
              mirror_default: true,
              countdown_duration: 3,
              allowed_layouts: ["Sekolah"],
              logo_url: "",
              qris_url: ""
            };
            const sekolahComps = [
              { ui_template_id: sekolahId, component_id: "logo", properties: { hideLogo: false, logoSize: "md" } },
              { ui_template_id: sekolahId, component_id: "welcomeText", properties: { hideWelcomeText: false, welcomeTextSize: "md", welcomeTextAlignment: "center", customWelcomeTextColor: "#ea580c" } },
              { ui_template_id: sekolahId, component_id: "formRegistrasi", properties: { hideFormRegistrasi: false, visitorFormLabel: "DATA SISWA / GURU", customerNameLabel: "Nama Lengkap / Panggilan", customerPhoneLabel: "Kelas / NISN", sessionsCountLabel: "Jumlah Cetak", formCardPadding: "md", inputBgStyle: "tinted", cardBorderRadius: "lg", cardShadow: "md", cardStyle: "neobrutalist" } },
              { ui_template_id: sekolahId, component_id: "startBtn", properties: { hideStartBtn: false, startButtonText: "Mulai Foto Seru! 🚀", startButtonSize: "md", primaryColor: "#ea580c", buttonStyle: "solid", customButtonTextColor: "#ffffff" } },
              { ui_template_id: sekolahId, component_id: "footerText", properties: { hideFooterText: false } },
              { ui_template_id: sekolahId, component_id: "qrisUpload", properties: {} },
              { ui_template_id: sekolahId, component_id: "customCard", properties: { showCustomCard: false, customCardTitle: "Info Kustom", customCardContent: "Silakan ketik petunjuk atau informasi tambahan di sini." } }
            ];

            const newTemplateObj = {
              id: sekolahId,
              name: sekolahData.name,
              bgTheme: sekolahData.bg_theme,
              fontStyle: sekolahData.font_style,
              welcomeText: sekolahData.welcome_text,
              footerText: sekolahData.footer_text,
              showPayment: sekolahData.show_payment,
              showSetup: sekolahData.show_setup,
              mirrorDefault: sekolahData.mirror_default,
              countdownDuration: sekolahData.countdown_duration,
              allowedLayouts: sekolahData.allowed_layouts,
              logoUrl: sekolahData.logo_url,
              qrisUrl: sekolahData.qris_url,
              customization: {
                hideLogo: false,
                logoSize: "md",
                hideWelcomeText: false,
                welcomeTextSize: "md",
                welcomeTextAlignment: "center",
                customWelcomeTextColor: "#ea580c",
                hideFormRegistrasi: false,
                visitorFormLabel: "DATA SISWA / GURU",
                customerNameLabel: "Nama Lengkap / Panggilan",
                customerPhoneLabel: "Kelas / NISN",
                sessionsCountLabel: "Jumlah Cetak",
                formCardPadding: "md",
                inputBgStyle: "tinted",
                cardBorderRadius: "lg",
                cardShadow: "md",
                cardStyle: "neobrutalist",
                hideStartBtn: false,
                startButtonText: "Mulai Foto Seru! 🚀",
                startButtonSize: "md",
                primaryColor: "#ea580c",
                buttonStyle: "solid",
                customButtonTextColor: "#ffffff",
                hideFooterText: false,
                showCustomCard: false,
                customCardTitle: "Info Kustom",
                customCardContent: "Silakan ketik petunjuk atau informasi tambahan di sini."
              }
            };

            const idx = finalTemplates.findIndex(t => t.id === sekolahId);
            if (idx !== -1) {
              finalTemplates[idx] = newTemplateObj;
            } else {
              finalTemplates.push(newTemplateObj);
            }

            supabase.from("ui_templates").upsert(sekolahData, { onConflict: "id" }).then(({ error }) => {
              if (!error) {
                supabase.from("ui_components").upsert(sekolahComps, { onConflict: "ui_template_id,component_id" }).then(() => {
                  console.log("Successfully seeded/updated Sekolah template in DB.");
                });
              }
            });
          }

          // 3. Seed Wisuda Template
          const wisudaId = "9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d";
          const wisudaTemplate = mappedTemplates.find(t => t.id === wisudaId);
          const needsWisudaUpdate = !wisudaTemplate || !wisudaTemplate.customization || !wisudaTemplate.customization.cardStyle;
          if (needsWisudaUpdate) {
            seededAny = true;
            const wisudaData = {
              id: wisudaId,
              name: "Wisuda Akbar (Classic & Elegant)",
              bg_theme: "luxury",
              font_style: "cabinet",
              welcome_text: "Selamat atas kelulusan Anda! Silakan masukkan nama dan gelar lengkap untuk mencetak foto kenangan kelulusan resmi.",
              footer_text: "Graduation Day • Powered by Glowbooth",
              show_payment: true,
              show_setup: true,
              mirror_default: true,
              countdown_duration: 5,
              allowed_layouts: ["Wisuda"],
              logo_url: "",
              qris_url: ""
            };
            const wisudaComps = [
              { ui_template_id: wisudaId, component_id: "logo", properties: { hideLogo: false, logoSize: "lg" } },
              { ui_template_id: wisudaId, component_id: "welcomeText", properties: { hideWelcomeText: false, welcomeTextSize: "lg", welcomeTextAlignment: "center", customWelcomeTextColor: "#d97706" } },
              { ui_template_id: wisudaId, component_id: "formRegistrasi", properties: { hideFormRegistrasi: false, visitorFormLabel: "REGISTRASI WISUDAWAN", customerNameLabel: "Nama Lengkap & Gelar", customerPhoneLabel: "Nomor WhatsApp", sessionsCountLabel: "Jumlah Cetak", formCardPadding: "lg", inputBgStyle: "white", cardBorderRadius: "xl", cardShadow: "xl", cardStyle: "glass" } },
              { ui_template_id: wisudaId, component_id: "startBtn", properties: { hideStartBtn: false, startButtonText: "Mulai Foto Wisuda 🎓", startButtonSize: "lg", primaryColor: "#d97706", buttonStyle: "gradient", customButtonTextColor: "#ffffff" } },
              { ui_template_id: wisudaId, component_id: "footerText", properties: { hideFooterText: false } },
              { ui_template_id: wisudaId, component_id: "qrisUpload", properties: {} },
              { ui_template_id: wisudaId, component_id: "customCard", properties: { showCustomCard: true, customCardTitle: "Pengambilan Foto", customCardContent: "Setelah berfoto selesai, silakan ambil cetakan foto di meja penyerahan souvenir luar aula.", cardStyle: "glass" } }
            ];

            const newTemplateObj = {
              id: wisudaId,
              name: wisudaData.name,
              bgTheme: wisudaData.bg_theme,
              fontStyle: wisudaData.font_style,
              welcomeText: wisudaData.welcome_text,
              footerText: wisudaData.footer_text,
              showPayment: wisudaData.show_payment,
              showSetup: wisudaData.show_setup,
              mirrorDefault: wisudaData.mirror_default,
              countdownDuration: wisudaData.countdown_duration,
              allowedLayouts: wisudaData.allowed_layouts,
              logoUrl: wisudaData.logo_url,
              qrisUrl: wisudaData.qris_url,
              customization: {
                hideLogo: false,
                logoSize: "lg",
                hideWelcomeText: false,
                welcomeTextSize: "lg",
                welcomeTextAlignment: "center",
                customWelcomeTextColor: "#d97706",
                hideFormRegistrasi: false,
                visitorFormLabel: "REGISTRASI WISUDAWAN",
                customerNameLabel: "Nama Lengkap & Gelar",
                customerPhoneLabel: "Nomor WhatsApp",
                sessionsCountLabel: "Jumlah Cetak",
                formCardPadding: "lg",
                inputBgStyle: "white",
                cardBorderRadius: "xl",
                cardShadow: "xl",
                cardStyle: "glass",
                hideStartBtn: false,
                startButtonText: "Mulai Foto Wisuda 🎓",
                startButtonSize: "lg",
                primaryColor: "#d97706",
                buttonStyle: "gradient",
                customButtonTextColor: "#ffffff",
                hideFooterText: false,
                showCustomCard: true,
                customCardTitle: "Pengambilan Foto",
                customCardContent: "Setelah berfoto selesai, silakan ambil cetakan foto di meja penyerahan souvenir luar aula."
              }
            };

            const idx = finalTemplates.findIndex(t => t.id === wisudaId);
            if (idx !== -1) {
              finalTemplates[idx] = newTemplateObj;
            } else {
              finalTemplates.push(newTemplateObj);
            }

            supabase.from("ui_templates").upsert(wisudaData, { onConflict: "id" }).then(({ error }) => {
              if (!error) {
                supabase.from("ui_components").upsert(wisudaComps, { onConflict: "ui_template_id,component_id" }).then(() => {
                  console.log("Successfully seeded/updated Wisuda template in DB.");
                });
              }
            });
          }

          setUiTemplates(finalTemplates);
        }

        // Ensure default row exists in booth_config
        if (!cfgRow) {
          const metadataOnly = {
            ...migrated,
            customFilters: [],
            customStickers: [],
            presetTemplates: [],
          };
          await supabase.from("booth_config").upsert({ id: GLOBAL_BOOTH_ID, config_json: metadataOnly });
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
          id: r.id, name: r.name || "",
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
                name: r.name || p.name || "",
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
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "filter_assets" }, (payload) => {
        const r = payload.new as any;
        setConfig((prev) => {
          const updated = {
            ...prev,
            customFilters: (prev.customFilters || []).map(f =>
              f.id === r.id ? { id: r.id, name: r.name, css: r.css } : f
            ),
          };
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
        const newSticker: StickerAsset = { id: r.id, imageUrl: r.image_url };
        setConfig((prev) => {
          if (prev.customStickers?.find(s => s.id === newSticker.id)) return prev;
          const updated = { ...prev, customStickers: [...(prev.customStickers || []), newSticker] };
          setTimeout(() => lsSetConfig(updated), 0);
          return updated;
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sticker_assets" }, (payload) => {
        const r = payload.new as any;
        setConfig((prev) => {
          const updated = {
            ...prev,
            customStickers: (prev.customStickers || []).map(s =>
              s.id === r.id ? { id: r.id, imageUrl: r.image_url } : s
            ),
          };
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

      // ── booth_config ──
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "booth_config" }, (payload) => {
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
        location: updatedConfig.location,
        countdownDuration: updatedConfig.countdownDuration,
        allowedFilters: updatedConfig.allowedFilters,
        allowedLayouts: updatedConfig.allowedLayouts,
        allowedPresets: updatedConfig.allowedPresets,
        allowedStickers: updatedConfig.allowedStickers,
        mirrorDefault: updatedConfig.mirrorDefault,
        activePresetTemplateId: updatedConfig.activePresetTemplateId,
        frameStyle: updatedConfig.frameStyle,
        frameText: updatedConfig.frameText,
        bgTheme: updatedConfig.bgTheme || "sunset",
        fontStyle: updatedConfig.fontStyle || "inter",
        welcomeText: updatedConfig.welcomeText || "Silakan pilih salah satu opsi pembayaran di bawah ini untuk memulai sesi foto Anda.",
        footerText: updatedConfig.footerText || "© 2026 Glowbooth Studio. All rights reserved.",
        showPayment: updatedConfig.showPayment !== false,
        showSetup: updatedConfig.showSetup !== false,
        printerName: updatedConfig.printerName || "Default USB Printer",
        printerPaperLimit: updatedConfig.printerPaperLimit ?? 100,
        autoPrintEnabled: updatedConfig.autoPrintEnabled === true,
        cameraDeviceId: updatedConfig.cameraDeviceId || "default",
        cameraResolution: updatedConfig.cameraResolution || "1080p",
        printerConnectionType: updatedConfig.printerConnectionType || "browser",
        bluetoothDeviceName: updatedConfig.bluetoothDeviceName || "",
      };
      const { error } = await supabase
        .from("booth_config")
        .upsert({ id: GLOBAL_BOOTH_ID, config_json: metadataOnly, updated_at: new Date().toISOString() });
      
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

  const updateConfig = useCallback(async (fields: Partial<EventConfig>, persist = true): Promise<boolean> => {
    try {
      const updatedConfig = { ...configRef.current, ...fields };
      setConfig(updatedConfig);
      
      if (persist) {
        // Tunggu hingga penyimpanan Supabase dan upload storage selesai
        const success = await saveConfig(updatedConfig);
        return success;
      }
      
      lsSetConfig(updatedConfig);
      return true;
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
    const newId = generateUUID();
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
          if (fallbackErr) throw fallbackErr;
        } else {
          throw error;
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
      console.error("[Supabase] addPhoto error, queueing offline:", err);
      await addToQueue({
        id: newId,
        dataUrl,
        metadata: {
          customerName: metadata?.customerName,
          customerPhone: metadata?.customerPhone,
          sessionsCount: metadata?.sessionsCount,
          operatorName: metadata?.operatorName,
          capturedPhotos: metadata?.capturedPhotos,
          paymentMethod: metadata?.paymentMethod,
          amount: metadata?.amount,
        },
        timestamp: newPhoto.timestamp,
        eventName: config.eventName || null,
      });
      toast.info("Koneksi terputus. Foto disimpan di antrean lokal untuk disinkronkan nanti.");
    }
    return newId;
  }, [config.eventName]);

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
      await supabase.from("photo_strips").delete().neq("id", GLOBAL_BOOTH_ID);
    } catch (err) {
      console.error("[Supabase] clearPhotos error:", err);
    }
  }, []);

  // ── Modular CRUD ──────────────────────────────────────────────────────────



  const addFilterAsset = useCallback(async (filter: Omit<FilterAsset, "id">) => {
    const newFilter: FilterAsset = { ...filter, id: generateUUID() };
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
    const newStickerId = generateUUID();
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
    const newPresetId = generateUUID();
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
        name: preset.name,
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

      if ("name" in fields) {
        dbFields.name = fields.name;
      }

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
    const preset = (configRef.current.presetTemplates || []).find((p) => p.id === id);
    if (!preset && id !== "") return;
    
    const updated: EventConfig = {
      ...configRef.current,
      activePresetTemplateId: id,
    };
    setConfig(updated);
    saveConfig(updated);
  }, [saveConfig]);

  const addUiTemplate = useCallback(async (template: Omit<UiTemplate, "id">): Promise<UiTemplate | null> => {
    try {
      const tempId = generateUUID();
      let finalLogoUrl = template.logoUrl;
      let finalQrisUrl = template.qrisUrl;

      if (template.logoUrl && template.logoUrl.startsWith("data:")) {
        finalLogoUrl = await uploadUiTemplateAssetToStorage(tempId, template.logoUrl, "logo");
      }
      if (template.qrisUrl && template.qrisUrl.startsWith("data:")) {
        finalQrisUrl = await uploadUiTemplateAssetToStorage(tempId, template.qrisUrl, "qris");
      }

      const payload = {
        id: tempId,
        name: template.name,
        bg_theme: template.bgTheme || "sunset",
        font_style: template.fontStyle || "inter",
        welcome_text: template.welcomeText || "",
        footer_text: template.footerText || "",
        show_payment: template.showPayment !== false,
        show_setup: template.showSetup !== false,
        mirror_default: template.mirrorDefault !== false,
        countdown_duration: template.countdownDuration ?? 3,
        allowed_layouts: template.allowedLayouts || ["strip"],
        logo_url: finalLogoUrl || null,
        qris_url: finalQrisUrl || null,
      };

      const { data, error } = await supabase.from("ui_templates").insert(payload).select().single();
      if (error) throw error;

      let finalCustomization = template.customization ? { ...template.customization } : null;
      if (finalCustomization) {
        if (finalCustomization.groomPhotoUrl && finalCustomization.groomPhotoUrl.startsWith("data:")) {
          finalCustomization.groomPhotoUrl = await uploadUiTemplateAssetToStorage(data.id, finalCustomization.groomPhotoUrl, "groom");
        }
        if (finalCustomization.bridePhotoUrl && finalCustomization.bridePhotoUrl.startsWith("data:")) {
          finalCustomization.bridePhotoUrl = await uploadUiTemplateAssetToStorage(data.id, finalCustomization.bridePhotoUrl, "bride");
        }
        await saveUiComponents(data.id, finalCustomization);
      }
      
      const newTemplate = {
        id: data.id,
        name: data.name,
        bgTheme: data.bg_theme || "sunset",
        fontStyle: data.font_style || "inter",
        welcomeText: data.welcome_text || "",
        footerText: data.footer_text || "",
        showPayment: data.show_payment !== false,
        showSetup: data.show_setup !== false,
        mirrorDefault: data.mirror_default !== false,
        countdownDuration: data.countdown_duration ?? 3,
        allowedLayouts: data.allowed_layouts || ["strip"],
        logoUrl: data.logo_url || "",
        qrisUrl: data.qris_url || "",
        customization: finalCustomization || template.customization,
      };

      if (typeof window !== "undefined" && finalCustomization) {
        localStorage.setItem(`glowbooth_customization_${data.id}`, JSON.stringify(finalCustomization));
      }

      setUiTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      console.error("[Store] addUiTemplate error:", err);
      toast.error("Gagal menambahkan template UI/UX.");
      return null;
    }
  }, []);

  const updateUiTemplate = useCallback(async (id: string, fields: Partial<UiTemplate>): Promise<boolean> => {
    try {
      let finalLogoUrl = fields.logoUrl;
      let finalQrisUrl = fields.qrisUrl;

      if (fields.logoUrl && fields.logoUrl.startsWith("data:")) {
        finalLogoUrl = await uploadUiTemplateAssetToStorage(id, fields.logoUrl, "logo");
      }
      if (fields.qrisUrl && fields.qrisUrl.startsWith("data:")) {
        finalQrisUrl = await uploadUiTemplateAssetToStorage(id, fields.qrisUrl, "qris");
      }

      const payload: any = {};
      if (fields.name !== undefined) payload.name = fields.name;
      if (fields.bgTheme !== undefined) payload.bg_theme = fields.bgTheme;
      if (fields.fontStyle !== undefined) payload.font_style = fields.fontStyle;
      if (fields.welcomeText !== undefined) payload.welcome_text = fields.welcomeText;
      if (fields.footerText !== undefined) payload.footer_text = fields.footerText;
      if (fields.showPayment !== undefined) payload.show_payment = fields.showPayment;
      if (fields.showSetup !== undefined) payload.show_setup = fields.showSetup;
      if (fields.mirrorDefault !== undefined) payload.mirror_default = fields.mirrorDefault;
      if (fields.countdownDuration !== undefined) payload.countdown_duration = fields.countdownDuration;
      if (fields.allowedLayouts !== undefined) payload.allowed_layouts = fields.allowedLayouts;
      if (finalLogoUrl !== undefined) payload.logo_url = finalLogoUrl;
      if (finalQrisUrl !== undefined) payload.qris_url = finalQrisUrl;

      const { error } = await supabase.from("ui_templates").update(payload).eq("id", id);
      if (error) throw error;

      let finalCustomization = fields.customization ? { ...fields.customization } : undefined;
      if (finalCustomization) {
        if (finalCustomization.groomPhotoUrl && finalCustomization.groomPhotoUrl.startsWith("data:")) {
          finalCustomization.groomPhotoUrl = await uploadUiTemplateAssetToStorage(id, finalCustomization.groomPhotoUrl, "groom");
        }
        if (finalCustomization.bridePhotoUrl && finalCustomization.bridePhotoUrl.startsWith("data:")) {
          finalCustomization.bridePhotoUrl = await uploadUiTemplateAssetToStorage(id, finalCustomization.bridePhotoUrl, "bride");
        }
        await saveUiComponents(id, finalCustomization);
      }

      if (typeof window !== "undefined" && finalCustomization) {
        const currentT = uiTemplates.find(t => t.id === id);
        const mergedCustomization = { ...(currentT?.customization || {}), ...finalCustomization };
        localStorage.setItem(`glowbooth_customization_${id}`, JSON.stringify(mergedCustomization));
      }

      setUiTemplates(prev => prev.map(t => t.id === id ? { 
        ...t, 
        ...fields, 
        logoUrl: finalLogoUrl ?? t.logoUrl, 
        qrisUrl: finalQrisUrl ?? t.qrisUrl,
        customization: finalCustomization ? { ...t.customization, ...finalCustomization } : t.customization
      } : t));
      return true;
    } catch (err) {
      console.error("[Store] updateUiTemplate error:", err);
      toast.error("Gagal memperbarui template UI/UX.");
      return false;
    }
  }, []);

  const deleteUiTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      try {
        const { data } = await supabase.storage.from("booth-config").list(`templates/${id}`);
        if (data && data.length > 0) {
          const filesToDelete = data.map(f => `templates/${id}/${f.name}`);
          await supabase.storage.from("booth-config").remove(filesToDelete);
        }
      } catch {}

      const { error } = await supabase.from("ui_templates").delete().eq("id", id);
      if (error) throw error;

      setUiTemplates(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      console.error("[Store] deleteUiTemplate error:", err);
      toast.error("Gagal menghapus template UI/UX.");
      return false;
    }
  }, []);

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
    uiTemplates,
    addUiTemplate,
    updateUiTemplate,
    deleteUiTemplate,
  };
}
