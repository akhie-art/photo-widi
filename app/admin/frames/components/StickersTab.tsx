"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Trash2, ImagePlus, X, Smile, FileImage, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EventConfig, StickerAsset } from "../../../hooks/usePhotoboothStore";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";

interface StickersTabProps {
  config: EventConfig;
  addStickerAsset: (sticker: Omit<StickerAsset, "id">) => Promise<boolean>;
  deleteStickerAsset: (id: string) => void;
}

export default function StickersTab({ config, addStickerAsset, deleteStickerAsset }: StickersTabProps) {
  const [stickerFormName, setStickerFormName] = useState("");
  const [stickerType, setStickerType] = useState<"emoji" | "image">("emoji");
  const [stickerFormEmoji, setStickerFormEmoji] = useState("");
  const [stickerFormOverlay, setStickerFormOverlay] = useState<string | undefined>(undefined);
  const [overlayUploading, setOverlayUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stickerToDelete, setStickerToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleTypeChange = (type: "emoji" | "image") => {
    setStickerType(type);
    // Clear opposite type inputs
    if (type === "emoji") {
      setStickerFormOverlay(undefined);
    } else {
      setStickerFormEmoji("");
    }
  };

  const handleStickerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stickerFormName.trim()) {
      toast.error("Nama stiker wajib diisi.");
      return;
    }
    if (isSaving) return;
    
    const imageUrl = stickerType === "image" ? stickerFormOverlay : stickerFormEmoji.trim();
    if (!imageUrl) {
      toast.error(
        stickerType === "image"
          ? "Harap unggah berkas gambar PNG transparan terlebih dahulu."
          : "Harap isi karakter emoji terlebih dahulu."
      );
      return;
    }
    
    setIsSaving(true);
    const success = await addStickerAsset({ name: stickerFormName.trim(), imageUrl });
    setIsSaving(false);

    if (success) {
      setStickerFormName("");
      setStickerFormEmoji("");
      setStickerFormOverlay(undefined);
      setOverlayUploading(false);
      toast.success("Aset stiker berhasil ditambahkan!");
    }
  };

  const handleStickerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") {
      toast.error("Harap unggah file PNG transparan.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB.");
      return;
    }
    setOverlayUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      setStickerFormOverlay(ev.target?.result as string);
      setTimeout(() => setOverlayUploading(false), 500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setStickerToDelete(null);
        }}
        onConfirm={() => {
          if (stickerToDelete) {
            deleteStickerAsset(stickerToDelete.id);
            toast.success(`Stiker "${stickerToDelete.name}" berhasil dihapus.`);
          }
        }}
        title="Hapus Stiker"
        description={`Apakah Anda yakin ingin menghapus stiker "${stickerToDelete?.name || ""}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in duration-300">
      
      {/* Left Column: Stickers Grid Collection */}
      <div className="lg:col-span-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Koleksi Stiker & Emoji
            <span className="text-xs font-mono font-normal bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 px-2.5 py-0.5 rounded-full border border-zinc-200/50 dark:border-zinc-800">
              {config.customStickers?.length ?? 0}
            </span>
          </h3>
        </div>

        {config.customStickers && config.customStickers.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {config.customStickers.map(sticker => {
              const isImg = sticker.imageUrl.startsWith("data:") || sticker.imageUrl.includes("/") || sticker.imageUrl.startsWith("http");
              return (
                <div 
                  key={sticker.id} 
                  className="group relative aspect-square bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 cursor-default"
                >
                  {/* Image/Emoji wrapper */}
                  <div className="flex-1 flex items-center justify-center min-h-0 w-full transform group-hover:scale-110 transition-transform duration-300">
                    {isImg ? (
                      <img 
                        src={sticker.imageUrl} 
                        alt={sticker.name} 
                        className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-sm" 
                      />
                    ) : (
                      <span className="text-4xl pointer-events-none select-none drop-shadow-sm">{sticker.imageUrl}</span>
                    )}
                  </div>
                  
                  {/* Sticker Name */}
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate w-full text-center px-1">
                    {sticker.name}
                  </span>
                  
                  {/* Touch-friendly float delete button */}
                  <button 
                    onClick={() => {
                      setStickerToDelete({ id: sticker.id, name: sticker.name });
                      setDeleteDialogOpen(true);
                    }} 
                    className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-lg cursor-pointer"
                    title="Hapus Stiker"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-zinc-950/20">
            <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-3 text-zinc-400">
              <Smile className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Belum ada stiker.</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Koleksi stiker yang dibuat akan muncul di sini dan dapat digunakan oleh pengunjung pada layar pratinjau booth.
            </p>
          </div>
        )}
      </div>

      {/* Right Column: Add Sticker Form */}
      <div className="lg:col-span-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="mb-5">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" /> Tambah Stiker
          </h4>
          <p className="text-zinc-500 dark:text-zinc-500 text-xs mt-1 leading-relaxed">
            Daftarkan stiker baru ke koleksi menggunakan teks emoji atau gambar PNG.
          </p>
        </div>

        <form onSubmit={handleStickerSubmit} className="space-y-4">
          {/* Form input: Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-650 dark:text-zinc-400">Nama Stiker</Label>
            <Input 
              required 
              value={stickerFormName} 
              onChange={e => setStickerFormName(e.target.value)} 
              placeholder="Contoh: Kacamata Keren" 
              className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-card text-xs focus-visible:ring-zinc-900 dark:focus-visible:ring-white" 
            />
          </div>

          {/* Type Toggle Tabs */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-650 dark:text-zinc-400">Pilih Tipe Stiker</Label>
            <div className="grid grid-cols-2 p-1 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleTypeChange("emoji")}
                className={`py-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  stickerType === "emoji"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/30 dark:border-zinc-700/50"
                    : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white"
                }`}
              >
                <Smile className="w-3.5 h-3.5" /> Teks Emoji
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("image")}
                className={`py-1.5 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  stickerType === "image"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/30 dark:border-zinc-700/50"
                    : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white"
                }`}
              >
                <FileImage className="w-3.5 h-3.5" /> Unggah PNG
              </button>
            </div>
          </div>
          
          {/* Toggleable input: Emoji character */}
          {stickerType === "emoji" ? (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <Label className="text-xs font-semibold text-zinc-650 dark:text-zinc-400">Emoji (Teks)</Label>
              <Input 
                value={stickerFormEmoji} 
                onChange={e => setStickerFormEmoji(e.target.value)} 
                placeholder="Tempel emoji di sini, contoh: 😎" 
                className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 bg-card text-xs focus-visible:ring-zinc-900 dark:focus-visible:ring-white" 
              />
            </div>
          ) : (
            /* Toggleable input: PNG Upload */
            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <Label className="text-xs font-semibold text-zinc-650 dark:text-zinc-400">Berkas Gambar PNG</Label>
              {stickerFormOverlay ? (
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <div className="w-12 h-12 rounded bg-white flex items-center justify-center border border-zinc-200/80 overflow-hidden shrink-0 relative">
                    {overlayUploading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                        <svg className="animate-spin w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                      </div>
                    ) : (
                      <img src={stickerFormOverlay} alt="preview" className="w-full h-full object-contain p-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {overlayUploading ? (
                      <p className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 truncate">Membaca gambar...</p>
                    ) : (
                      <p className="text-[11px] font-semibold text-green-600 dark:text-green-400 truncate">Berkas terpilih ✓</p>
                    )}
                    <p className="text-[9px] text-zinc-450 dark:text-zinc-500 font-mono mt-0.5">
                      {overlayUploading ? "Memproses..." : "Upload ke bucket otomatis saat Simpan"}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setStickerFormOverlay(undefined); setOverlayUploading(false); }} 
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Hapus berkas"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300">
                  <input type="file" accept="image/png" onChange={handleStickerFile} className="hidden" />
                  <ImagePlus className="w-5 h-5 text-zinc-400 group-hover:scale-105 transition-transform" />
                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-zinc-750 dark:text-zinc-300">Pilih berkas PNG</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">Transparan. Maks. 2MB. Disimpan ke bucket.</p>
                  </div>
                </label>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isSaving || overlayUploading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 h-10 rounded-lg mt-3 font-semibold text-xs tracking-wider uppercase border-none cursor-pointer active:scale-98 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Menyimpan...
              </>
            ) : "Simpan Stiker"}
          </Button>
        </form>
      </div>
    </div>
  </>
  );
}