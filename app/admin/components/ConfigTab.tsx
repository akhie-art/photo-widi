"use client";

import { useState, useEffect, useCallback } from "react";
import { Camera, ImagePlus, X, Wallet, Sparkles, Receipt, Database, RefreshCw, Copy, CheckCircle2, AlertTriangle, Check, ExternalLink, HardDrive, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EventConfig } from "../../hooks/usePhotoboothStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ConfigTabProps {
  config: EventConfig;
  updateConfig: (newConfigFields: Partial<EventConfig>) => Promise<boolean>;
}

export default function ConfigTab({ config, updateConfig }: ConfigTabProps) {
  const [logoUrl, setLogoUrl] = useState("");
  const [eventName, setEventName] = useState("");
  const [pricePerSession, setPricePerSession] = useState(25000);
  const [qrisUrl, setQrisUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // States for Supabase Storage check
  const [bucketStatus, setBucketStatus] = useState<Record<string, boolean>>({
    "photostrips": false,
    "preset-overlays": false,
    "sticker-assets": false,
    "event-assets": false,
  });
  const [bucketSizes, setBucketSizes] = useState<Record<string, number>>({
    "photostrips": 0,
    "preset-overlays": 0,
    "sticker-assets": 0,
    "event-assets": 0,
  });
  const [isRpcActive, setIsRpcActive] = useState(true);
  const [checkingBuckets, setCheckingBuckets] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  // Sync state when config changes
  useEffect(() => {
    if (config) {
      setLogoUrl(config.logoUrl || "");
      setEventName(config.eventName || "");
      setPricePerSession(config.pricePerSession ?? 25000);
      setQrisUrl(config.qrisUrl || "");
    }
  }, [config]);

  // Fallback function to calculate bucket size from client side
  const getBucketSizeFallback = useCallback(async (bucketName: string): Promise<number> => {
    let totalBytes = 0;
    try {
      // 1. List files in the root bucket folder
      const { data: rootFiles, error: rootError } = await supabase.storage.from(bucketName).list("", { limit: 100 });
      if (!rootError && rootFiles) {
        for (const file of rootFiles) {
          if (file.metadata && typeof file.metadata.size === 'number') {
            totalBytes += file.metadata.size;
          }
        }
      }

      // 2. List known subfolders to aggregate sizes
      const subfolders: string[] = [];
      if (bucketName === "photostrips") {
        subfolders.push("raw", "strips");
      } else if (bucketName === "preset-overlays") {
        subfolders.push("overlays");
      } else if (bucketName === "sticker-assets") {
        subfolders.push("stickers");
      }

      for (const folder of subfolders) {
        const { data: folderFiles, error: folderError } = await supabase.storage.from(bucketName).list(folder, { limit: 100 });
        if (!folderError && folderFiles) {
          for (const file of folderFiles) {
            if (file.metadata && typeof file.metadata.size === 'number') {
              totalBytes += file.metadata.size;
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[Storage Fallback] Gagal menghitung ukuran bucket ${bucketName}:`, err);
    }
    return totalBytes;
  }, []);

  // Check storage buckets connectivity & calculate size (RLS-safe queries)
  const checkStorageBuckets = useCallback(async () => {
    setCheckingBuckets(true);
    const buckets = ["photostrips", "preset-overlays", "sticker-assets", "event-assets"];
    
    try {
      // 1. Test RPC get_bucket_size availability
      let rpcSupported = true;
      try {
        const { error: rpcTestError } = await supabase.rpc('get_bucket_size', { p_bucket_id: 'event-assets' });
        if (rpcTestError && (rpcTestError.code === 'PGRST202' || rpcTestError.message?.includes('does not exist'))) {
          rpcSupported = false;
        }
      } catch {
        rpcSupported = false;
      }
      setIsRpcActive(rpcSupported);

      const statusMap: Record<string, boolean> = {};
      const sizesMap: Record<string, number> = {};

      await Promise.all(
        buckets.map(async (bucketName) => {
          // Probe bucket dengan mencoba melist file di dalamnya (limit 1)
          const { data, error } = await supabase.storage.from(bucketName).list("", { limit: 1 });
          
          let exists = true;
          if (error) {
            const msg = error.message?.toLowerCase() || "";
            // Jika error adalah bucket not found (status 404/400 atau pesan "not found")
            if (msg.includes("not found") || msg.includes("does not exist") || error.status === 404 || error.status === 400) {
              exists = false;
            }
          }
          
          statusMap[bucketName] = exists;

          if (!exists) {
            sizesMap[bucketName] = 0;
            return;
          }

          // Fetch size of the bucket
          let bucketSize = 0;
          if (rpcSupported) {
            const { data: sizeData, error: sizeError } = await supabase.rpc('get_bucket_size', { p_bucket_id: bucketName });
            if (!sizeError && sizeData !== null) {
              bucketSize = Number(sizeData);
            } else {
              bucketSize = await getBucketSizeFallback(bucketName);
            }
          } else {
            bucketSize = await getBucketSizeFallback(bucketName);
          }
          sizesMap[bucketName] = bucketSize;
        })
      );

      setBucketStatus(statusMap);
      setBucketSizes(sizesMap);
    } catch (err) {
      console.error("Error checking buckets:", err);
    } finally {
      setCheckingBuckets(false);
    }
  }, [getBucketSizeFallback]);

  useEffect(() => {
    checkStorageBuckets();
  }, [checkStorageBuckets]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const success = await updateConfig({
      logoUrl,
      eventName,
      pricePerSession,
      qrisUrl,
    });
    setIsSaving(false);

    if (success) {
      toast.success("Pengaturan booth berhasil disimpan!");
    }
  };

  const sqlScript = `-- ── SUPABASE STORAGE INITIALIZATION ──
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor

-- 1. Bucket 'photostrips'
insert into storage.buckets (id, name, public) values ('photostrips', 'photostrips', true) on conflict (id) do nothing;
drop policy if exists "Public Access for Photostrips" on storage.objects;
create policy "Public Access for Photostrips" on storage.objects for select using (bucket_id = 'photostrips');
drop policy if exists "Insert Access for Photostrips" on storage.objects;
create policy "Insert Access for Photostrips" on storage.objects for insert with check (bucket_id = 'photostrips');
drop policy if exists "Update Access for Photostrips" on storage.objects;
create policy "Update Access for Photostrips" on storage.objects for update using (bucket_id = 'photostrips');
drop policy if exists "Delete Access for Photostrips" on storage.objects;
create policy "Delete Access for Photostrips" on storage.objects for delete using (bucket_id = 'photostrips');

-- 2. Bucket 'preset-overlays'
insert into storage.buckets (id, name, public) values ('preset-overlays', 'preset-overlays', true) on conflict (id) do nothing;
drop policy if exists "Public Access for Preset Overlays" on storage.objects;
create policy "Public Access for Preset Overlays" on storage.objects for select using (bucket_id = 'preset-overlays');
drop policy if exists "Insert Access for Preset Overlays" on storage.objects;
create policy "Insert Access for Preset Overlays" on storage.objects for insert with check (bucket_id = 'preset-overlays');
drop policy if exists "Update Access for Preset Overlays" on storage.objects;
create policy "Update Access for Preset Overlays" on storage.objects for update using (bucket_id = 'preset-overlays');
drop policy if exists "Delete Access for Preset Overlays" on storage.objects;
create policy "Delete Access for Preset Overlays" on storage.objects for delete using (bucket_id = 'preset-overlays');

-- 3. Bucket 'sticker-assets'
insert into storage.buckets (id, name, public) values ('sticker-assets', 'sticker-assets', true) on conflict (id) do nothing;
drop policy if exists "Public Access for Sticker Assets" on storage.objects;
create policy "Public Access for Sticker Assets" on storage.objects for select using (bucket_id = 'sticker-assets');
drop policy if exists "Insert Access for Sticker Assets" on storage.objects;
create policy "Insert Access for Sticker Assets" on storage.objects for insert with check (bucket_id = 'sticker-assets');
drop policy if exists "Update Access for Sticker Assets" on storage.objects;
create policy "Update Access for Sticker Assets" on storage.objects for update using (bucket_id = 'sticker-assets');
drop policy if exists "Delete Access for Sticker Assets" on storage.objects;
create policy "Delete Access for Sticker Assets" on storage.objects for delete using (bucket_id = 'sticker-assets');

-- 4. Bucket 'event-assets'
insert into storage.buckets (id, name, public) values ('event-assets', 'event-assets', true) on conflict (id) do nothing;
drop policy if exists "Public Access for Event Assets" on storage.objects;
create policy "Public Access for Event Assets" on storage.objects for select using (bucket_id = 'event-assets');
drop policy if exists "Insert Access for Event Assets" on storage.objects;
create policy "Insert Access for Event Assets" on storage.objects for insert with check (bucket_id = 'event-assets');
drop policy if exists "Update Access for Event Assets" on storage.objects;
create policy "Update Access for Event Assets" on storage.objects for update using (bucket_id = 'event-assets');
drop policy if exists "Delete Access for Event Assets" on storage.objects;
create policy "Delete Access for Event Assets" on storage.objects for delete using (bucket_id = 'event-assets');

-- 5. Fungsi RPC untuk menghitung ukuran storage bucket (get_bucket_size)
create or replace function get_bucket_size(p_bucket_id text)
returns bigint
security definer
as $$
declare
  v_size bigint;
begin
  select sum((metadata->>'size')::bigint)
  into v_size
  from storage.objects
  where bucket_id = p_bucket_id;
  
  return coalesce(v_size, 0);
end;
$$ language plpgsql;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setIsCopied(true);
    toast.success("Skrip SQL inisialisasi berhasil disalin ke clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const fileValidation = (file: File | undefined): boolean => {
    if (!file) return false;
    if (!file.type.startsWith("image/")) {
      toast.error("Harap unggah file gambar.");
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB.");
      return false;
    }
    return true;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileValidation(file)) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoUrl(ev.target?.result as string);
    reader.readAsDataURL(file!);
  };

  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileValidation(file)) return;
    const reader = new FileReader();
    reader.onload = (ev) => setQrisUrl(ev.target?.result as string);
    reader.readAsDataURL(file!);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-200">
      
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pengaturan Booth
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kustomisasi identitas visual, tarif layanan, dan integrasi kode pembayaran QRIS Anda.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="w-full max-w-4xl flex flex-col gap-5">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* BAGIAN 1: IDENTITAS VISUAL */}
          <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] flex flex-col">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-500" /> Profil & Branding
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-0.5">
                Atur nama studio dan logo utama photobooth Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-4 flex-1">
              
              {/* Nama Photobooth */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Nama Photobooth</Label>
                <Input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Contoh: Glowbooth Studio"
                  className="h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 focus-visible:ring-2 focus-visible:ring-zinc-400 shadow-sm text-xs"
                />
              </div>

              {/* Logo Photobooth */}
              <div className="flex flex-col gap-1.5 flex-1 justify-end">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Logo Utama</Label>
                {logoUrl ? (
                  <div className="flex items-center gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-900/20 ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-800/40 rounded-xl">
                    <div className="w-14 h-14 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center ring-1 ring-zinc-200/80 dark:ring-zinc-800/80 overflow-hidden shadow-sm p-1.5 shrink-0">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Logo Terpasang</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Akan muncul pada layar utama aplikasi.</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setLogoUrl("")}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="border border-dashed border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-zinc-50/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all text-center h-full min-h-[110px]">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
                      <ImagePlus className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Unggah File Logo</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">PNG atau JPEG (Maks. 2MB)</p>
                    </div>
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BAGIAN 2: TARIF & QRIS */}
          <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] flex flex-col">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-zinc-500" /> Layanan & Pembayaran
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-0.5">
                Konfigurasi harga per sesi dan kode barcode pembayaran.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 flex flex-col gap-4 flex-1">
              
              {/* Harga Per Sesi */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Harga Per Sesi</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs text-zinc-400 dark:text-zinc-500 font-medium font-mono select-none">Rp</span>
                  <Input
                    type="number"
                    required
                    min={0}
                    value={pricePerSession}
                    onChange={(e) => setPricePerSession(Number(e.target.value))}
                    placeholder="25000"
                    className="h-10 pl-9 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 focus-visible:ring-2 focus-visible:ring-zinc-400 shadow-sm text-xs font-mono"
                  />
                </div>
              </div>

              {/* Gambar QRIS */}
              <div className="flex flex-col gap-1.5 flex-1 justify-end">
                <Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Barcode QRIS</Label>
                {qrisUrl ? (
                  <div className="flex items-center gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-900/20 ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-800/40 rounded-xl">
                    <div className="w-14 h-14 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center ring-1 ring-zinc-200/80 dark:ring-zinc-800/80 overflow-hidden shadow-sm p-1 shrink-0">
                      <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">QRIS Aktif</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Dapat langsung dipindai oleh pelanggan di lokasi.</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setQrisUrl("")}
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="border border-dashed border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-zinc-50/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all text-center h-full min-h-[110px]">
                    <input type="file" accept="image/*" onChange={handleQrisUpload} className="hidden" />
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
                      <Wallet className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Unggah Gambar QRIS</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Format Gambar (Maks. 2MB)</p>
                    </div>
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Supabase Storage Status Section */}
        <Card className="bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/60 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] mt-5">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-500" /> Supabase Storage Status
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-0.5">
                Pantau kapasitas dan status bucket penyimpanan media di database Supabase Anda.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={checkingBuckets}
              onClick={checkStorageBuckets}
              className="h-8 text-[10px] font-mono px-3 gap-1.5 border-zinc-200 dark:border-zinc-800 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingBuckets ? 'animate-spin' : ''}`} />
              Perbarui Status
            </Button>
          </CardHeader>
          
          <CardContent className="pt-5 flex flex-col gap-5">
            {/* Total Storage Usage Widget */}
            {(() => {
              const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB Free Tier Limit
              const totalUsedBytes = Object.values(bucketSizes).reduce((acc, curr) => acc + curr, 0);
              const totalUsedPercentage = (totalUsedBytes / STORAGE_LIMIT_BYTES) * 100;

              const formatBytes = (bytes: number, decimals = 2) => {
                if (bytes === 0) return "0 B";
                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ["B", "KB", "MB", "GB", "TB"];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
              };

              const bucketThemes: Record<string, { color: string; border: string; bg: string; dot: string; text: string }> = {
                "photostrips": {
                  color: "bg-emerald-500 dark:bg-emerald-400",
                  border: "border-emerald-500/20 dark:border-emerald-500/10",
                  bg: "bg-emerald-500/5",
                  dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                  text: "text-emerald-600 dark:text-emerald-400",
                },
                "preset-overlays": {
                  color: "bg-sky-500 dark:bg-sky-400",
                  border: "border-sky-500/20 dark:border-sky-500/10",
                  bg: "bg-sky-500/5",
                  dot: "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]",
                  text: "text-sky-600 dark:text-sky-400",
                },
                "sticker-assets": {
                  color: "bg-violet-500 dark:bg-violet-400",
                  border: "border-violet-500/20 dark:border-violet-500/10",
                  bg: "bg-violet-500/5",
                  dot: "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]",
                  text: "text-violet-600 dark:text-violet-400",
                },
                "event-assets": {
                  color: "bg-rose-500 dark:bg-rose-400",
                  border: "border-rose-500/20 dark:border-rose-500/10",
                  bg: "bg-rose-500/5",
                  dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
                  text: "text-rose-600 dark:text-rose-400",
                },
              };

              const fallbackTheme = {
                color: "bg-zinc-400",
                border: "border-amber-500/20 dark:border-amber-500/10",
                bg: "bg-amber-500/5",
                dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
                text: "text-amber-600 dark:text-amber-400",
              };

              const hasMissingBuckets = Object.values(bucketStatus).some(status => !status);
              const showSqlInit = !isRpcActive || hasMissingBuckets;

              return (
                <>
                  <div className="p-5 bg-zinc-50/50 dark:bg-zinc-900/10 ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-800/40 rounded-2xl flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
                          <HardDrive className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Total Penggunaan Storage</h3>
                          <p className="text-[10px] text-zinc-500 mt-0.5">Penyimpanan Supabase Storage (Free Tier)</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                          {formatBytes(totalUsedBytes)} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">/ 1.0 GB</span>
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-500 mt-0.5">
                          Terpakai {totalUsedPercentage < 0.01 && totalUsedBytes > 0 ? "< 0.01%" : `${totalUsedPercentage.toFixed(2)}%`}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar (Stacked / Segmented) */}
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full h-3 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden flex shadow-inner border border-zinc-200/20 dark:border-zinc-800/20">
                        {Object.entries(bucketSizes).map(([bucketName, size]) => {
                          const exists = bucketStatus[bucketName];
                          if (!exists || size === 0) return null;
                          const pct = (size / STORAGE_LIMIT_BYTES) * 100;
                          const theme = bucketThemes[bucketName] || fallbackTheme;
                          
                          return (
                            <div 
                              key={bucketName}
                              className={`${theme.color} h-full transition-all duration-500 ease-out`}
                              style={{ width: `${Math.max(pct, 0.5)}%` }} // Minimum width so tiny sizes are slightly visible
                              title={`${bucketName}: ${formatBytes(size)} (${pct.toFixed(4)}%)`}
                            />
                          );
                        })}
                      </div>
                      
                      {/* Micro legend */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                        {Object.entries(bucketStatus).map(([bucketName, exists]) => {
                          const theme = exists ? (bucketThemes[bucketName] || fallbackTheme) : fallbackTheme;
                          const size = bucketSizes[bucketName] || 0;
                          return (
                            <div key={bucketName} className="flex items-center gap-1.5 select-none">
                              <span className={`w-2 h-2 rounded-full ${exists ? theme.color : 'bg-zinc-300'}`} />
                              <span className="text-[10px] text-zinc-500 font-medium capitalize">{bucketName.replace("-", " ")}</span>
                              <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 font-mono">({formatBytes(size)})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Individual Bucket Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(bucketStatus).map(([bucketName, isReady]) => {
                      const theme = isReady ? (bucketThemes[bucketName] || fallbackTheme) : fallbackTheme;
                      const size = bucketSizes[bucketName] || 0;
                      const pctOfTotal = totalUsedBytes > 0 ? (size / totalUsedBytes) * 100 : 0;
                      
                      return (
                        <div 
                          key={bucketName} 
                          className={`flex flex-col gap-2.5 p-4 rounded-xl border transition-all duration-300 ${theme.bg} ${theme.border}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-mono">{bucketName}</span>
                            <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                          </div>
                          
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-zinc-500">Ukuran</span>
                              <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {formatBytes(size)}
                              </span>
                            </div>
                            
                            {isReady && size > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-500">Porsi</span>
                                <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                                  {pctOfTotal.toFixed(1)}%
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-200/30 dark:border-zinc-800/30">
                              <span className="text-[10px] text-zinc-500">Status</span>
                              <span className={`text-[10px] font-semibold ${theme.text}`}>
                                {isReady ? 'Aktif (Ready)' : 'Belum Dibuat'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Warn user if RPC is not active */}
                  {!isRpcActive && (
                    <div className="flex gap-2.5 p-4 bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/10 rounded-2xl animate-fade-in">
                      <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-400">Fungsi RPC get_bucket_size Belum Aktif</h4>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                          Sistem mendeteksi fungsi kalkulasi storage di database belum terpasang. Perhitungan saat ini menggunakan estimasi fallback client-side (maksimal 100 berkas teratas per folder). 
                          Untuk kalkulasi real-time yang akurat dan hemat kuota API, jalankan skrip SQL di bawah ini pada dashboard Supabase Anda.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning and setup actions if setup is not fully initialized */}
                  {showSqlInit && (
                    <div className="flex flex-col gap-3.5 p-4 bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 rounded-2xl">
                      <div className="flex gap-2.5 items-start">
                        <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                            {hasMissingBuckets ? "Penyimpanan Storage Supabase Belum Siap" : "Fungsi Optimasi Storage Belum Aktif"}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                            {hasMissingBuckets 
                              ? "Beberapa storage bucket belum terdeteksi. Tanpa bucket ini, Anda tidak akan bisa mengunggah overlay template instan, stiker custom, atau mencatat hasil foto booth."
                              : "Semua bucket aktif, tetapi RPC function get_bucket_size belum dipasang di database Supabase Anda."}{" "}
                            Silakan salin skrip SQL di bawah ini, buka dashboard Supabase Anda, masuk ke SQL Editor, lalu jalankan (Run) skrip tersebut.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-amber-500/10 gap-3">
                        <div className="flex items-center gap-2">
                          <a 
                            href="https://supabase.com/dashboard" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            Buka Supabase Dashboard <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <Button 
                          type="button" 
                          onClick={handleCopySql}
                          className="h-8 text-[10px] gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm active:scale-98 transition-all px-4 rounded-lg cursor-pointer animate-pulse hover:animate-none"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {isCopied ? 'Tersalin' : 'Salin SQL Inisialisasi'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Footer Actions Row */}
        <div className="flex items-center justify-end mt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-10 text-xs font-medium px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm w-full sm:w-auto flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Menyimpan...
              </>
            ) : "Simpan Perubahan Settings"}
          </Button>
        </div>

      </form>
    </div>
  );
}