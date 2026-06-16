"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trash2, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EventConfig, FilterAsset } from "../../../hooks/usePhotoboothStore";
import { toast } from "sonner";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";

interface FiltersTabProps {
  config: EventConfig;
  addFilterAsset: (filter: Omit<FilterAsset, "id">) => void;
  deleteFilterAsset: (id: string) => void;
}

// Preset visual yang mudah dimengerti awam
const PRESETS = [
  { name: "Original", label: "Asli", grayscale: 0, sepia: 0, brightness: 100, contrast: 100, saturate: 100, gradient: "from-zinc-200 to-zinc-400" },
  { name: "Vintage", label: "Klasik", grayscale: 0, sepia: 40, brightness: 100, contrast: 110, saturate: 110, gradient: "from-amber-700/60 to-orange-900/60" },
  { name: "B&W", label: "Hitam Putih", grayscale: 100, sepia: 0, brightness: 100, contrast: 125, saturate: 0, gradient: "from-zinc-500 to-zinc-800" },
  { name: "Warm", label: "Hangat", grayscale: 0, sepia: 15, brightness: 100, contrast: 100, saturate: 135, gradient: "from-orange-400/50 to-rose-400/50" },
  { name: "Faded", label: "Pudar", grayscale: 0, sepia: 10, brightness: 105, contrast: 90, saturate: 70, gradient: "from-slate-400/50 to-zinc-400/50" },
  { name: "Vivid", label: "Cerah", grayscale: 0, sepia: 0, brightness: 100, contrast: 125, saturate: 150, gradient: "from-blue-500/50 to-emerald-500/50" },
];

export default function FiltersTab({ config, addFilterAsset, deleteFilterAsset }: FiltersTabProps) {
  const [filterFormName, setFilterFormName] = useState("");
  const [filterFormCss, setFilterFormCss] = useState("");

  // Sliders State
  const [sliderGrayscale, setSliderGrayscale] = useState(0);
  const [sliderSepia, setSliderSepia] = useState(0);
  const [sliderBrightness, setSliderBrightness] = useState(100);
  const [sliderContrast, setSliderContrast] = useState(100);
  const [sliderSaturate, setSliderSaturate] = useState(100);
  
  // UX States
  const [activePreset, setActivePreset] = useState("Original");
  const [showManualSliders, setShowManualSliders] = useState(false);

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterToDelete, setFilterToDelete] = useState<{ id: string; name: string } | null>(null);

  // Akses Webcam untuk Live Preview
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera for preview:", err);
        setCameraError(true);
      }
    };

    startCamera();

    // Cleanup: Matikan kamera saat komponen unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Kompilasi nilai slider menjadi kode CSS
  useEffect(() => {
    const parts = [];
    if (sliderGrayscale > 0) parts.push(`grayscale(${sliderGrayscale}%)`);
    if (sliderSepia > 0) parts.push(`sepia(${sliderSepia}%)`);
    if (sliderBrightness !== 100) parts.push(`brightness(${sliderBrightness}%)`);
    if (sliderContrast !== 100) parts.push(`contrast(${sliderContrast}%)`);
    if (sliderSaturate !== 100) parts.push(`saturate(${sliderSaturate}%)`);
    
    setFilterFormCss(parts.join(" "));
  }, [sliderGrayscale, sliderSepia, sliderBrightness, sliderContrast, sliderSaturate]);

  // Handler saat preset dipilih
  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setSliderGrayscale(preset.grayscale);
    setSliderSepia(preset.sepia);
    setSliderBrightness(preset.brightness);
    setSliderContrast(preset.contrast);
    setSliderSaturate(preset.saturate);
    setActivePreset(preset.name);

    // Auto-fill nama jika masih kosong atau berisi nama preset lain
    const isCurrentNameAPreset = PRESETS.some(p => p.label === filterFormName || p.label === "Asli");
    if (!filterFormName.trim() || isCurrentNameAPreset || filterFormName === "Custom") {
      setFilterFormName(preset.name === "Original" ? "" : preset.label);
    }
  };

  // Handler saat slider digeser manual
  const handleSliderChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    setter(value);
    setActivePreset("Custom");
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterFormName.trim()) return;
    
    addFilterAsset({ name: filterFormName.trim(), css: filterFormCss.trim() });
    
    // Reset form states
    setFilterFormName("");
    handlePresetSelect(PRESETS[0]); // Reset ke Original
    setShowManualSliders(false);
    toast.success("Filter berhasil ditambahkan!");
  };

  const customFilters = config.customFilters ?? [];

  return (
    <>
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setFilterToDelete(null);
        }}
        onConfirm={() => {
          if (filterToDelete) {
            deleteFilterAsset(filterToDelete.id);
            toast.success(`Filter "${filterToDelete.name}" berhasil dihapus.`);
            setDeleteDialogOpen(false);
            setFilterToDelete(null);
          }
        }}
        title="Hapus Filter"
        description={`Apakah Anda yakin ingin menghapus filter "${filterToDelete?.name || ""}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Daftar Filter */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
            Filter Tersedia ({customFilters.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customFilters.length === 0 ? (
              <div className="col-span-full text-center py-10 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Belum ada filter kustom. Silakan buat filter baru di samping.</p>
              </div>
            ) : (
              customFilters.map(filter => {
                const isOriginal = filter.id === "filter_original";
                
                return (
                  <div key={filter.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-rose-400 via-purple-500 to-indigo-500 transition-all duration-300" style={{ filter: filter.css }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-zinc-900 dark:text-white truncate">{filter.name}</h4>
                          {isOriginal && (
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800 shrink-0">
                              Bawaan
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                          {filter.css ? "Custom CSS aktif" : "Tanpa efek"}
                        </p>
                      </div>
                    </div>
                    
                    {!isOriginal && (
                      <button 
                        type="button"
                        onClick={() => {
                          setFilterToDelete({ id: filter.id, name: filter.name });
                          setDeleteDialogOpen(true);
                        }} 
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Hapus Filter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pembuatan Filter Visual-First */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col gap-5 sticky top-4 shadow-sm">
          <div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Buat Filter Kamera
            </h4>
            <p className="text-zinc-500 text-xs mt-1">Pilih gaya visual, lihat hasilnya langsung di kamera, lalu simpan.</p>
          </div>
          
          <form onSubmit={handleFilterSubmit} className="space-y-5">
            
            {/* 1. Live Preview Camera */}
            <div className="space-y-2">
              <div className="w-full aspect-video rounded-lg bg-zinc-900 overflow-hidden relative border border-zinc-200 dark:border-zinc-800 shadow-inner flex items-center justify-center">
                {cameraError ? (
                  <span className="text-xs text-zinc-500 text-center px-4">
                    Kamera tidak terdeteksi. Izinkan akses kamera di browser Anda.
                  </span>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transition-all duration-200"
                    style={{ filter: filterFormCss || "none", transform: "scaleX(-1)" }} // scaleX(-1) agar seperti cermin
                  />
                )}
                
                {/* Indikator Mode Custom */}
                {activePreset === "Custom" && (
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded border border-white/10">
                    Penyesuaian Manual
                  </div>
                )}
              </div>
            </div>

            {/* 2. Visual Template Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Pilih Gaya Preset</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all cursor-pointer bg-white dark:bg-zinc-950
                      ${activePreset === preset.name 
                        ? 'border-blue-500 ring-1 ring-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                  >
                    <div className={`w-full h-8 rounded bg-gradient-to-tr ${preset.gradient} border border-zinc-200 dark:border-zinc-800/60 shadow-sm`}></div>
                    <span className={`text-[10px] font-semibold ${activePreset === preset.name ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Progressive Disclosure (Pengaturan Lanjutan/Manual) */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setShowManualSliders(!showManualSliders)}
                className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer w-full py-2"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {showManualSliders ? "Sembunyikan Pengaturan Manual" : "Sesuaikan Manual (Lanjutan)"}
              </button>

              {/* Sliders (Hidden by default) */}
              {showManualSliders && (
                <div className="space-y-4 pt-3 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Hitam & Putih</span>
                      <span className="tabular-nums">{sliderGrayscale}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={sliderGrayscale} onChange={e => handleSliderChange(setSliderGrayscale, Number(e.target.value))} className="w-full accent-blue-500 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer appearance-none" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Kesan Klasik (Sepia)</span>
                      <span className="tabular-nums">{sliderSepia}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={sliderSepia} onChange={e => handleSliderChange(setSliderSepia, Number(e.target.value))} className="w-full accent-blue-500 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer appearance-none" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Kecerahan</span>
                      <span className="tabular-nums">{sliderBrightness}%</span>
                    </div>
                    <input type="range" min="50" max="150" value={sliderBrightness} onChange={e => handleSliderChange(setSliderBrightness, Number(e.target.value))} className="w-full accent-blue-500 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer appearance-none" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Kontras (Tajam/Lembut)</span>
                      <span className="tabular-nums">{sliderContrast}%</span>
                    </div>
                    <input type="range" min="50" max="150" value={sliderContrast} onChange={e => handleSliderChange(setSliderContrast, Number(e.target.value))} className="w-full accent-blue-500 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer appearance-none" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Warna (Saturasi)</span>
                      <span className="tabular-nums">{sliderSaturate}%</span>
                    </div>
                    <input type="range" min="0" max="200" value={sliderSaturate} onChange={e => handleSliderChange(setSliderSaturate, Number(e.target.value))} className="w-full accent-blue-500 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer appearance-none" />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Name Input & Submit */}
            <div className="pt-2 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Nama Filter Ini</Label>
                <Input 
                  required 
                  value={filterFormName} 
                  onChange={e => setFilterFormName(e.target.value)} 
                  placeholder="Contoh: Filter Nostalgia" 
                  className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800 focus-visible:ring-blue-500 text-xs font-medium" 
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 rounded-lg shadow-sm text-xs font-semibold transition-all cursor-pointer"
              >
                Simpan Sebagai Filter Baru
              </Button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}