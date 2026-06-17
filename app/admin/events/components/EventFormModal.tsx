"use client";

import { useState, useEffect } from "react";
import { X, Calendar, MapPin, Loader2, ImagePlus, Hash, Coins, Tag, ImageIcon, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePhotoboothStore } from "../../../hooks/usePhotoboothStore"; 
import { EventItem } from "../types";
import { toast } from "sonner";

interface EventFormModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  initialData: EventItem | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: Omit<EventItem, "is_active" | "created_at">) => void;
}

const slugify = (text: string) => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
};

export default function EventFormModal({ isOpen, mode, initialData, isSaving, onClose, onSave }: EventFormModalProps) {
  const { config } = usePhotoboothStore();
  
  const [eventId, setEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [pricePerSession, setPricePerSession] = useState(25000);
  const [logoUrl, setLogoUrl] = useState("");
  const [qrisUrl, setQrisUrl] = useState("");

  const [allowedPresets, setAllowedPresets] = useState<string[]>([]);
  const [allowedFilters, setAllowedFilters] = useState<string[]>([]);
  const [allowedStickers, setAllowedStickers] = useState<string[]>([]);
  
  const [modalTab, setModalTab] = useState<"presets" | "filters" | "stickers">("presets");
  const [modalSearch, setModalSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setEventId(initialData.id);
        setEventName(initialData.name);
        setEventDate(initialData.date || "");
        setEventLocation(initialData.location || "");
        setPricePerSession(initialData.price_per_session);
        setLogoUrl(initialData.logo_url || "");
        setQrisUrl(initialData.qris_url || "");
        setAllowedPresets(initialData.allowed_presets || []);
        setAllowedFilters(initialData.allowed_filters || []);
        setAllowedStickers(initialData.allowed_stickers || []);
      } else {
        setEventId("");
        setEventName("");
        setEventDate("");
        setEventLocation("");
        setPricePerSession(25000);
        setLogoUrl("");
        setQrisUrl("");
        setAllowedPresets([]);
        setAllowedFilters([]);
        setAllowedStickers([]);
      }
      setModalTab("presets");
      setModalSearch("");
    }
  }, [isOpen, mode, initialData]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId.trim() || !eventName.trim()) {
      toast.error("ID Event dan Nama Event wajib diisi.");
      return;
    }
    
    onSave({
      id: eventId,
      name: eventName,
      date: eventDate,
      location: eventLocation,
      price_per_session: pricePerSession,
      logo_url: logoUrl,
      qris_url: qrisUrl,
      allowed_presets: allowedPresets,
      allowed_filters: allowedFilters,
      allowed_stickers: allowedStickers,
    });
  };

  const handleSelectAllModalAssets = () => {
    if (modalTab === "presets") setAllowedPresets((config.presetTemplates || []).map(p => p.id));
    else if (modalTab === "filters") setAllowedFilters((config.customFilters || []).map(f => f.id));
    else if (modalTab === "stickers") setAllowedStickers((config.customStickers || []).map(s => s.id));
  };

  const handleClearAllModalAssets = () => {
    if (modalTab === "presets") setAllowedPresets([]);
    else if (modalTab === "filters") setAllowedFilters([]);
    else if (modalTab === "stickers") setAllowedStickers([]);
  };

  const renderModalAssetChecklist = () => {
    if (modalTab === "presets") {
      const list = (config.presetTemplates || []).filter(p => 
        (p.name || "").toLowerCase().includes(modalSearch.toLowerCase()) || 
        (p.id || "").toLowerCase().includes(modalSearch.toLowerCase())
      );
      
      if (list.length === 0) return <div className="col-span-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 py-12 gap-2"><ImageIcon className="w-8 h-8 opacity-50" /><p className="text-sm font-medium">Tidak ada template yang tersedia.</p></div>;
      
      return list.map((preset) => {
        const isChecked = allowedPresets.includes(preset.id);
        return (
          <label key={preset.id} className={`relative group flex flex-col items-center justify-between rounded-xl border bg-white dark:bg-zinc-900 p-3 cursor-pointer select-none transition-all duration-200 ${isChecked ? "border-blue-500 ring-2 bg-blue-50/50 dark:bg-blue-900/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>
            <div className="absolute top-2.5 right-2.5 z-20">
              <input type="checkbox" checked={isChecked} onChange={() => setAllowedPresets(prev => isChecked ? prev.filter(id => id !== preset.id) : [...prev, preset.id])} className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
            </div>
            <div className="w-full aspect-[4/5] rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden flex items-center justify-center p-2 mb-3 relative">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%)', backgroundSize: '10px 10px' }} />
              {preset.imageOverlay ? <img src={preset.imageOverlay} alt="" className="z-10 max-w-full max-h-full object-contain" /> : <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">Layout</span>}
            </div>
            <div className="w-full text-center min-w-0">
              <p className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate px-1">{preset.name}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] uppercase font-medium">{preset.paperSize}</span>
            </div>
          </label>
        );
      });
    }

    if (modalTab === "filters") {
      const list = (config.customFilters || []).filter(f => 
        (f.name || "").toLowerCase().includes(modalSearch.toLowerCase()) || 
        (f.id || "").toLowerCase().includes(modalSearch.toLowerCase())
      );
      
      if (list.length === 0) return <div className="col-span-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 py-12 gap-2"><Sparkles className="w-8 h-8 opacity-50" /><p className="text-sm font-medium">Tidak ada filter yang tersedia.</p></div>;
      
      return list.map((filter) => {
        const isChecked = allowedFilters.includes(filter.id);
        return (
          <label key={filter.id} className={`relative group flex flex-col items-center justify-between rounded-xl border bg-white dark:bg-zinc-900 p-3 cursor-pointer select-none transition-all duration-200 ${isChecked ? "border-blue-500 ring-2 bg-blue-50/50 dark:bg-blue-900/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>
            <div className="absolute top-2.5 right-2.5 z-20">
              <input type="checkbox" checked={isChecked} onChange={() => setAllowedFilters(prev => isChecked ? prev.filter(id => id !== filter.id) : [...prev, filter.id])} className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
            </div>
            <div className="w-full aspect-[4/3] rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden relative mb-3">
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-400 via-purple-500 to-indigo-500" style={{ filter: filter.css || "none" }} />
            </div>
            <div className="w-full text-center min-w-0">
              <p className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate px-1">{filter.name}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] uppercase font-medium">{filter.css ? "Custom CSS" : "Original"}</span>
            </div>
          </label>
        );
      });
    }

    if (modalTab === "stickers") {
      const list = (config.customStickers || []).filter(s => 
        (s.name || "").toLowerCase().includes(modalSearch.toLowerCase()) || 
        (s.id || "").toLowerCase().includes(modalSearch.toLowerCase())
      );
      
      if (list.length === 0) return <div className="col-span-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 py-12 gap-2"><Sparkles className="w-8 h-8 opacity-50" /><p className="text-sm font-medium">Tidak ada stiker yang tersedia.</p></div>;
      
      return list.map((sticker) => {
        const isChecked = allowedStickers.includes(sticker.id);
        const isImg = sticker.imageUrl && (sticker.imageUrl.startsWith("data:") || sticker.imageUrl.includes("/") || sticker.imageUrl.startsWith("http"));
        return (
          <label key={sticker.id} className={`relative group flex flex-col items-center justify-between rounded-xl border bg-white dark:bg-zinc-900 p-3 cursor-pointer select-none transition-all duration-200 ${isChecked ? "border-blue-500 ring-2 bg-blue-50/50 dark:bg-blue-900/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>
            <div className="absolute top-2.5 right-2.5 z-20">
              <input type="checkbox" checked={isChecked} onChange={() => setAllowedStickers(prev => isChecked ? prev.filter(id => id !== sticker.id) : [...prev, sticker.id])} className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
            </div>
            <div className="w-full aspect-[4/3] rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 overflow-hidden flex items-center justify-center p-3 mb-3 relative">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%)', backgroundSize: '10px 10px' }} />
              {isImg ? <img src={sticker.imageUrl} alt="" className="z-10 max-w-full max-h-full object-contain" /> : <span className="z-10 text-3xl select-none">{sticker.imageUrl || "✨"}</span>}
            </div>
            <div className="w-full text-center min-w-0">
              <p className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate px-1">{sticker.name}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] uppercase font-medium">{isImg ? "PNG Image" : "Emoji"}</span>
            </div>
          </label>
        );
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="w-[95vw] sm:max-w-4xl lg:max-w-5xl h-[90vh] p-0 flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/80 dark:bg-zinc-900/30 backdrop-blur-sm z-10">
          <div>
            <DialogTitle className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              {mode === "add" ? "Tambah Event Baru" : "Edit Event"}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Atur detail parameter event dan pilih aset dekorasi yang aktif.
            </DialogDescription>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} className="h-9 w-9 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            <div className="w-full md:w-[45%] flex flex-col gap-6 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-950">
              <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Informasi Umum</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs">Nama Event <span className="text-red-500">*</span></Label>
                  <div className="relative flex items-center">
                    <Tag className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <Input type="text" required value={eventName} onChange={(e) => { const val = e.target.value; setEventName(val); if (mode === "add") setEventId(slugify(val)); }} placeholder="contoh: Wedding Budi & Ani" className="pl-10 h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm font-sans" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs">ID Event (Unique Slug)</Label>
                  <div className="relative flex items-center">
                    <Hash className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <Input type="text" required readOnly value={eventId} placeholder="(Otomatis)" className="pl-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 text-sm font-mono lowercase text-zinc-500 cursor-not-allowed select-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs">Tanggal Event</Label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="pl-10 h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm font-sans" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs">Tarif Sesi (Rp) <span className="text-red-500">*</span></Label>
                  <div className="relative flex items-center">
                    <Coins className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <Input type="number" required min={0} value={pricePerSession} onChange={(e) => setPricePerSession(Number(e.target.value))} placeholder="25000" className="pl-10 h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm font-mono" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs">Lokasi Event</Label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <Input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="contoh: Ballroom Hotel Mulia, Jakarta" className="pl-10 h-10 rounded-xl bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm font-sans" />
                </div>
              </div>

              <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800 mt-2">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Aset Berkas (Opsional)</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs text-center">Logo Event</Label>
                  {logoUrl ? (
                    <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 relative group">
                      <Button type="button" variant="destructive" size="icon" onClick={() => setLogoUrl("")} className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none">
                        <X className="w-3 h-3" />
                      </Button>
                      <div className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center p-2 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 text-center aspect-square group">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <div className="p-2 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group-hover:scale-110 transition-transform">
                        <ImagePlus className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500" />
                      </div>
                      <div><span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-500 transition-colors">Pilih Logo</span><span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Maks. 2MB</span></div>
                    </label>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs text-center">Barcode QRIS</Label>
                  {qrisUrl ? (
                    <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 relative group">
                      <Button type="button" variant="destructive" size="icon" onClick={() => setQrisUrl("")} className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none">
                        <X className="w-3 h-3" />
                      </Button>
                      <div className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center p-2 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800">
                        <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 text-center aspect-square group">
                      <input type="file" accept="image/*" onChange={handleQrisUpload} className="hidden" />
                      <div className="p-2 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group-hover:scale-110 transition-transform">
                        <ImagePlus className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500" />
                      </div>
                      <div><span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-500 transition-colors">Pilih QRIS</span><span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Maks. 2MB</span></div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full md:w-[55%] flex flex-col border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 overflow-hidden">
              <div className="flex flex-col p-6 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 shrink-0 gap-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Aset Dekorasi Spesifik</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Atur template, filter, dan stiker khusus yang tersedia untuk event ini.</p>
                </div>
                <div className="flex bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 w-full shrink-0 select-none">
                  <button type="button" onClick={() => { setModalTab("presets"); setModalSearch(""); }} className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${modalTab === "presets" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>Template ({config.presetTemplates?.length ?? 0})</button>
                  <button type="button" onClick={() => { setModalTab("filters"); setModalSearch(""); }} className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${modalTab === "filters" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>Filter ({config.customFilters?.length ?? 0})</button>
                  <button type="button" onClick={() => { setModalTab("stickers"); setModalSearch(""); }} className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${modalTab === "stickers" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}>Stiker ({config.customStickers?.length ?? 0})</button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                  <div className="relative flex items-center flex-1">
                    <Input type="text" placeholder="Cari aset..." value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} className="px-3 h-9 rounded-lg bg-white dark:bg-zinc-950 border-none ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-400 text-xs w-full" />
                  </div>
                  <div className="flex gap-3 justify-end shrink-0 select-none">
                    <button type="button" onClick={handleSelectAllModalAssets} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Pilih Semua</button>
                    <span className="text-xs text-zinc-300 dark:text-zinc-700">|</span>
                    <button type="button" onClick={handleClearAllModalAssets} className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline cursor-pointer">Hapus Semua</button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderModalAssetChecklist()}
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end items-center gap-3 shrink-0 z-10">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 text-sm font-semibold rounded-xl border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">Batal</Button>
            <Button type="submit" disabled={isSaving} className="h-10 text-sm font-semibold rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all cursor-pointer border-none px-6">
              {isSaving ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</span> : (mode === "add" ? "Tambah Event" : "Simpan Perubahan")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}