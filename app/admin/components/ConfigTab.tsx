"use client";

import { useState, useEffect } from "react";
import { Camera, ImagePlus, X, Wallet, Sparkles, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EventConfig } from "../../hooks/usePhotoboothStore";
import { toast } from "sonner";

interface ConfigTabProps {
  config: EventConfig;
  updateConfig: (newConfigFields: Partial<EventConfig>) => void;
}

export default function ConfigTab({ config, updateConfig }: ConfigTabProps) {
  const [logoUrl, setLogoUrl] = useState("");
  const [eventName, setEventName] = useState("");
  const [pricePerSession, setPricePerSession] = useState(25000);
  const [qrisUrl, setQrisUrl] = useState("");

  // Sync state when config changes
  useEffect(() => {
    if (config) {
      setLogoUrl(config.logoUrl || "");
      setEventName(config.eventName || "");
      setPricePerSession(config.pricePerSession ?? 25000);
      setQrisUrl(config.qrisUrl || "");
    }
  }, [config]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      logoUrl,
      eventName,
      pricePerSession,
      qrisUrl,
    });
    toast.success("Pengaturan booth berhasil disimpan!");
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

        {/* Footer Actions Row */}
        <div className="flex items-center justify-end mt-2">
          <Button
            type="submit"
            className="h-10 text-xs font-medium px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm w-full sm:w-auto"
          >
            Simpan Perubahan Settings
          </Button>
        </div>

      </form>
    </div>
  );
}