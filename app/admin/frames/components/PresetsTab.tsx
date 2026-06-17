"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, CheckCircle2, Eye, ImagePlus, X, Pipette, Crop, Palette, RotateCcw, Check, Pointer, Sidebar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { EventConfig, PresetTemplate, SlotConfig } from "../../../hooks/usePhotoboothStore";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import SlotLayoutEditor, { generateDefaultSlots } from "../../components/SlotLayoutEditor";
import StripPreview from "./StripPreview";

interface PresetsTabProps {
  config: EventConfig;
  addPresetTemplate: (preset: Omit<PresetTemplate, "id">) => Promise<boolean>;
  updatePresetTemplate: (id: string, fields: Partial<PresetTemplate>) => Promise<boolean>;
  deletePresetTemplate: (id: string) => void;
  setActivePresetTemplate: (id: string) => void;
}

export default function PresetsTab({ config, addPresetTemplate, updatePresetTemplate, deletePresetTemplate, setActivePresetTemplate }: PresetsTabProps) {
  // ─── STATE UTAMA ────────────────────────────────────────────────────────────
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetEditingId, setPresetEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // ─── STATE FORM ─────────────────────────────────────────────────────────────
  const [presetFormName, setPresetFormName] = useState("");
  const [presetFormOverlay, setPresetFormOverlay] = useState<string | undefined>(undefined);
  const [presetFormSlots, setPresetFormSlots] = useState<SlotConfig[]>(generateDefaultSlots(4));
  const [presetFormPaperSize, setPresetFormPaperSize] = useState<"2R" | "4R">("2R");
  const [overlayUploading, setOverlayUploading] = useState(false);
  const [presetFormOverlayX, setPresetFormOverlayX] = useState(0);
  const [presetFormOverlayY, setPresetFormOverlayY] = useState(0);
  const [presetFormOverlayW, setPresetFormOverlayW] = useState(100);
  const [presetFormOverlayH, setPresetFormOverlayH] = useState(100);
  const [presetFormOverlayRotation, setPresetFormOverlayRotation] = useState(0);

  // ─── STATE DELETE ───────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<{ id: string; name: string } | null>(null);

  // ─── STATE IMAGE EDITOR (CHROMA KEY & CROP) ─────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>(""); 
  const [workingImage, setWorkingImage] = useState<string>(""); 
  const [activeMode, setActiveMode] = useState<'none' | 'crop' | 'chroma'>('none');
  
  // Chroma State
  const [chromaPreviewImage, setChromaPreviewImage] = useState<string | null>(null);
  const [chromaColor, setChromaColor] = useState<{r:number, g:number, b:number} | null>(null);
  const [chromaTolerance, setChromaTolerance] = useState(60);
  const [isPickingColor, setIsPickingColor] = useState(false);
  
  // Crop State
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState({ top: 0, left: 0, width: 100, height: 100 });
  const cropDrag = useRef<{ startX: number, startY: number, startCrop: typeof crop, handle: string } | null>(null);

  useEffect(() => {
    if (config.activePresetTemplateId) {
      setSelectedPresetId(config.activePresetTemplateId);
    } else if (config.presetTemplates && config.presetTemplates.length > 0) {
      setSelectedPresetId(config.presetTemplates[0].id);
    }
  }, [config.activePresetTemplateId, config.presetTemplates]);

  // ─── FUNGSI UTAMA PRESET ────────────────────────────────────────────────────

  const openAddPreset = () => {
    setPresetEditingId(null); setPresetFormName(""); setPresetFormOverlay(undefined);
    setPresetFormSlots(generateDefaultSlots(4));
    setPresetFormPaperSize("2R");
    setPresetFormOverlayX(0); setPresetFormOverlayY(0); setPresetFormOverlayW(100);
    setPresetFormOverlayH(100); setPresetFormOverlayRotation(0); setPresetModalOpen(true);
  };

  const openEditPreset = (preset: PresetTemplate) => {
    setPresetEditingId(preset.id); setPresetFormName(preset.name); setPresetFormOverlay(preset.imageOverlay);
    setPresetFormSlots(preset.customSlots ?? generateDefaultSlots(4));
    setPresetFormPaperSize(preset.paperSize || "2R");
    setPresetFormOverlayX(preset.overlayX ?? 0); setPresetFormOverlayY(preset.overlayY ?? 0);
    setPresetFormOverlayW(preset.overlayW ?? 100); setPresetFormOverlayH(preset.overlayH ?? 100);
    setPresetFormOverlayRotation(preset.overlayRotation ?? 0);
    setOverlayUploading(false);
    setPresetModalOpen(true);
  };

  const closePresetModal = () => { setPresetModalOpen(false); setPresetEditingId(null); setIsSaving(false); setSidebarOpen(true); };

  const handlePresetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    let nameToSubmit = presetFormName.trim();
    if (!presetEditingId) {
      const activeNumber = (config.presetTemplates?.length ?? 0) + 1;
      nameToSubmit = `Template ${presetFormPaperSize} #${activeNumber}`;
    } else if (!nameToSubmit) {
      const existing = config.presetTemplates?.find(p => p.id === presetEditingId);
      nameToSubmit = existing?.name ?? `Template #${presetEditingId}`;
    }

    setIsSaving(true);
    const payload: Omit<PresetTemplate, "id"> = {
      name: nameToSubmit,
      imageOverlay: presetFormOverlay, customSlots: presetFormSlots,
      overlayX: presetFormOverlayX, overlayY: presetFormOverlayY,
      overlayW: presetFormOverlayW, overlayH: presetFormOverlayH, overlayRotation: presetFormOverlayRotation,
      forceLayout: false,
      paperSize: presetFormPaperSize,
    };

    let success = false;
    if (presetEditingId) {
      success = await updatePresetTemplate(presetEditingId, payload);
    } else {
      success = await addPresetTemplate(payload);
    }

    setIsSaving(false);

    if (success) {
      toast.success(presetEditingId ? "Template berhasil diperbarui!" : "Template berhasil dibuat!");
      closePresetModal();
    }
  };

  const handlePresetOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png" && file.type !== "image/jpeg") { toast.error("Harap unggah file PNG atau JPG."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Ukuran file maksimal 8MB."); return; }
    setOverlayUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      setPresetFormOverlay(ev.target?.result as string);
      setTimeout(() => setOverlayUploading(false), 600);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset
  };

  // ─── FUNGSI IMAGE EDITOR ────────────────────────────────────────────────────

  const openImageEditor = () => {
    if (!presetFormOverlay) return;
    setOriginalImage(presetFormOverlay);
    setWorkingImage(presetFormOverlay);
    setActiveMode('none');
    setEditorOpen(true);
  };

  const resetToOriginal = () => {
    setWorkingImage(originalImage);
    setActiveMode('none');
  };

  // --- LOGIKA CROP ---
  const startCropMode = () => {
    setActiveMode('crop');
    setCrop({ top: 0, left: 0, width: 100, height: 100 });
  };

  const onCropStart = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation(); e.preventDefault();
    cropDrag.current = { startX: e.clientX, startY: e.clientY, startCrop: { ...crop }, handle };
    window.addEventListener('pointermove', onCropMove);
    window.addEventListener('pointerup', onCropEnd);
    window.addEventListener('pointercancel', onCropEnd);
  };

  const onCropMove = (e: PointerEvent) => {
    if (!cropDrag.current || !imgRef.current) return;
    const { startX, startY, startCrop, handle } = cropDrag.current;
    const rect = imgRef.current.getBoundingClientRect();

    const dxPct = ((e.clientX - startX) / rect.width) * 100;
    const dyPct = ((e.clientY - startY) / rect.height) * 100;

    let { top, left, width, height } = startCrop;

    if (handle === 'move') {
      left = Math.max(0, Math.min(100 - width, startCrop.left + dxPct));
      top = Math.max(0, Math.min(100 - height, startCrop.top + dyPct));
    } else {
      if (handle.includes('e')) width = Math.min(100 - left, Math.max(5, startCrop.width + dxPct));
      if (handle.includes('s')) height = Math.min(100 - top, Math.max(5, startCrop.height + dyPct));
      if (handle.includes('w')) {
        const maxDx = startCrop.width - 5;
        const boundedDx = Math.max(-startCrop.left, Math.min(maxDx, dxPct)); 
        left = startCrop.left + boundedDx; width = startCrop.width - boundedDx;
      }
      if (handle.includes('n')) {
        const maxDx = startCrop.height - 5;
        const boundedDy = Math.max(-startCrop.top, Math.min(maxDx, dyPct));
        top = startCrop.top + boundedDy; height = startCrop.height - boundedDy;
      }
    }
    setCrop({ top, left, width, height });
  };

  const onCropEnd = () => {
    cropDrag.current = null;
    window.removeEventListener('pointermove', onCropMove);
    window.removeEventListener('pointerup', onCropEnd);
    window.removeEventListener('pointercancel', onCropEnd);
  };

  const applyCrop = () => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const sw = img.width * (crop.width / 100); const sh = img.height * (crop.height / 100);
      const sx = img.width * (crop.left / 100); const sy = img.height * (crop.top / 100);
      canvas.width = sw; canvas.height = sh;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      setWorkingImage(canvas.toDataURL("image/png"));
      setActiveMode('none');
    };
    img.src = workingImage;
  };

  // --- LOGIKA CHROMA KEY ---
  const startChromaMode = () => {
    setActiveMode('chroma');
    setChromaColor(null); setChromaTolerance(60); setIsPickingColor(false);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeMode !== 'chroma' || !isPickingColor) return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width; const scaleY = img.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX; const y = (e.clientY - rect.top) * scaleY;

    const canvas = document.createElement('canvas');
    canvas.width = 1; canvas.height = 1;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      if (a > 0) setChromaColor({ r, g, b });
    }
    setIsPickingColor(false);
  };

  useEffect(() => {
    if (activeMode !== 'chroma' || !chromaColor) { setChromaPreviewImage(null); return; }
    
    const timer = setTimeout(() => {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const distance = Math.sqrt(Math.pow(r - chromaColor.r, 2) + Math.pow(g - chromaColor.g, 2) + Math.pow(b - chromaColor.b, 2));
          if (distance <= chromaTolerance) data[i + 3] = 0; 
        }
        ctx.putImageData(imageData, 0, 0);
        setChromaPreviewImage(canvas.toDataURL("image/png"));
      };
      img.src = workingImage;
    }, 50);
    return () => clearTimeout(timer);
  }, [workingImage, chromaColor, chromaTolerance, activeMode]);

  const applyChroma = () => {
    if (chromaPreviewImage) setWorkingImage(chromaPreviewImage);
    setActiveMode('none');
  };

  const applyAllImageEdits = () => {
    setPresetFormOverlay(workingImage); 
    setEditorOpen(false);
  };

  const selectedPreset = config.presetTemplates?.find(p => p.id === selectedPresetId) ?? config.presetTemplates?.[0];

  return (
    <>
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setPresetToDelete(null);
        }}
        onConfirm={() => {
          if (presetToDelete) {
            deletePresetTemplate(presetToDelete.id);
            toast.success(`Template "${presetToDelete.name}" berhasil dihapus.`);
            setDeleteDialogOpen(false);
            setPresetToDelete(null);
          }
        }}
        title="Hapus Template"
        description={`Apakah Anda yakin ingin menghapus template "${presetToDelete?.name || ""}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      {/* TAMPILAN UTAMA TAB PRESET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Semua Template ({config.presetTemplates?.length ?? 0})</h3>
            <Button onClick={openAddPreset} className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-sm h-9 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-all">
              <Plus className="w-4 h-4" /> Buat Template
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {(config.presetTemplates || []).map(preset => {
              const isActive = config.activePresetTemplateId === preset.id;
              const isSelected = selectedPresetId === preset.id;

              return (
                <div 
                  key={preset.id} 
                  onClick={() => setSelectedPresetId(preset.id)} 
                  className={`group flex flex-col rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {/* PREVIEW IMAGE AREA */}
                  <div className="relative h-48 w-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center overflow-hidden border-b border-zinc-200 dark:border-zinc-800/50 p-4">
                    <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]" style={{ backgroundImage: 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%)', backgroundSize: '16px 16px' }} />
                    <div className="z-10 relative w-full h-full flex items-center justify-center drop-shadow-md transition-transform duration-300 group-hover:scale-[1.03]">
                      <StripPreview 
                        overlay={preset.imageOverlay} 
                        customSlots={preset.customSlots} 
                        size="sm" 
                        overlayX={preset.overlayX} 
                        overlayY={preset.overlayY} 
                        overlayW={preset.overlayW} 
                        overlayH={preset.overlayH} 
                        overlayRotation={preset.overlayRotation} 
                        paperSize={preset.paperSize}
                      />
                    </div>
                    
                    <div className="absolute top-2 right-2 flex gap-1.5 z-20">
                      <button 
                        onClick={e => { e.stopPropagation(); openEditPreset(preset); }} 
                        className="p-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-md text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={e => { e.stopPropagation(); setPresetToDelete({ id: preset.id, name: preset.name }); setDeleteDialogOpen(true); }} 
                        disabled={isActive} 
                        className={`p-1.5 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-md shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 ${isActive ? "text-zinc-300 cursor-not-allowed" : "text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400"}`}
                        title="Hapus Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* INFO AREA */}
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      {isActive && (
                        <span className="text-[9px] font-semibold tracking-wide px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Aktif
                        </span>
                      )}
                      {preset.imageOverlay && (
                        <span className="text-[9px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase">
                          Overlay
                        </span>
                      )}
                      <span className="text-[9px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase">
                        {preset.customSlots?.length || 4} Slot
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 sticky top-6">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white mb-4">Pratinjau</h3>
          {selectedPreset ? (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col gap-6 shadow-sm">
              <div className="flex justify-center bg-zinc-50 dark:bg-zinc-900/50 py-6 rounded-lg border border-zinc-100 dark:border-zinc-800/50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]" style={{ backgroundImage: 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%)', backgroundSize: '16px 16px' }} />
                <div className="z-10">
                  <StripPreview overlay={selectedPreset.imageOverlay} customSlots={selectedPreset.customSlots} size="lg" overlayX={selectedPreset.overlayX} overlayY={selectedPreset.overlayY} overlayW={selectedPreset.overlayW} overlayH={selectedPreset.overlayH} overlayRotation={selectedPreset.overlayRotation} paperSize={selectedPreset.paperSize} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-zinc-900 dark:text-white truncate">{selectedPreset.name}</h4>
                  {selectedPreset.imageOverlay && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500">Overlay Aktif</span>}
                </div>
                <div className="flex gap-2">
                  {config.activePresetTemplateId !== selectedPreset.id && (
                    <Button onClick={() => setActivePresetTemplate(selectedPreset.id)} className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm">Aktifkan</Button>
                  )}
                  <Button variant="outline" onClick={() => openEditPreset(selectedPreset)} className="flex-1 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">Edit Slot & Overlay</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
              <Eye className="w-6 h-6 text-zinc-400" />
              <p className="text-sm text-zinc-500">Pilih template untuk melihat detail pratinjau.</p>
            </div>
          )}
        </div>
      </div>

      {/* DIALOG EDITOR PRESET UTAMA */}
      <Dialog open={presetModalOpen} onOpenChange={open => { if (!open) closePresetModal(); }}>
        {/* Perubahan utama: h-screen menjadi h-[100dvh] agar menyesuaikan dinamis dengan height browser mobile/tablet */}
        <DialogContent 
          showCloseButton={false}
          className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white w-screen h-[100dvh] !max-w-none !max-h-none !rounded-none border-none p-0 !m-0 overflow-hidden flex flex-col shadow-none outline-none z-50"
        >
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950 z-10">
            <div className="flex items-center gap-3.5">
              <div>
                <DialogTitle className="text-lg font-semibold">{presetEditingId ? "Edit Template Instan" : "Buat Template Instan"}</DialogTitle>
                <DialogDescription className="sr-only">Atur ukuran kertas, overlay PNG, dan posisi letak jepretan kamera.</DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={closePresetModal}
              className="h-9 w-9 p-0 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <SlotLayoutEditor
              slots={presetFormSlots}
              onChange={setPresetFormSlots}
              overlay={presetFormOverlay}
              overlayX={presetFormOverlayX}
              overlayY={presetFormOverlayY}
              overlayW={presetFormOverlayW}
              overlayH={presetFormOverlayH}
              overlayRotation={presetFormOverlayRotation}
              onChangeOverlay={(x, y, w, h, rot) => {
                setPresetFormOverlayX(x);
                setPresetFormOverlayY(y);
                setPresetFormOverlayW(w);
                setPresetFormOverlayH(h);
                setPresetFormOverlayRotation(rot);
              }}
              paperSize={presetFormPaperSize}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              sidebarContent={
                <form id="preset-form" onSubmit={handlePresetSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ukuran Kertas</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* 2R Card */}
                      <div 
                        onClick={() => setPresetFormPaperSize("2R")}
                        className={`flex flex-col p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                          presetFormPaperSize === "2R" 
                            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" 
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">Ukuran 2R</span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            presetFormPaperSize === "2R" ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100" : "border-zinc-300 dark:border-zinc-750 bg-transparent"
                          }`}>
                            {presetFormPaperSize === "2R" && <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-950" />}
                          </div>
                        </div>
                        <div className="mt-2 h-10 w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800/80 p-1 shrink-0">
                          <div className={`h-full aspect-[1/3] border rounded ${
                            presetFormPaperSize === "2R" ? "border-zinc-400 bg-zinc-400/20" : "border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800"
                          }`} />
                        </div>
                      </div>

                      {/* 4R Card */}
                      <div 
                        onClick={() => setPresetFormPaperSize("4R")}
                        className={`flex flex-col p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                          presetFormPaperSize === "4R" 
                            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" 
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">Ukuran 4R</span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            presetFormPaperSize === "4R" ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100" : "border-zinc-300 dark:border-zinc-750 bg-transparent"
                          }`}>
                            {presetFormPaperSize === "4R" && <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-950" />}
                          </div>
                        </div>
                        <div className="mt-2 h-10 w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800/80 p-1 shrink-0">
                          <div className={`h-full aspect-[2/3] border rounded ${
                            presetFormPaperSize === "4R" ? "border-zinc-400 bg-zinc-400/20" : "border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800"
                          }`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex justify-between">Gambar Overlay <span className="text-zinc-400 font-normal">Opsional</span></Label>
                    {presetFormOverlay ? (
                      <div className="flex flex-col gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <div className="w-full h-64 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800 overflow-hidden relative bg-white dark:bg-zinc-950 shadow-inner"
                             style={{ backgroundImage: 'repeating-conic-gradient(#cbd5e1 0% 25%, transparent 0% 50%)', backgroundSize: '16px 16px' }}>
                          <div className="absolute inset-0 opacity-[0.12] dark:opacity-[0.04]" style={{ backgroundImage: 'repeating-conic-gradient(#000000 0% 25%, transparent 0% 50%)', backgroundSize: '16px 16px' }} />
                          {overlayUploading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10">
                              <svg className="animate-spin w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                              </svg>
                            </div>
                          ) : (
                            <img src={presetFormOverlay} alt="overlay" className="max-w-full max-h-full object-contain p-4 relative z-10 drop-shadow-md" />
                          )}
                        </div>
                        <div className="w-full">
                          {overlayUploading ? (
                            <div className="text-xs font-semibold text-center text-blue-500 dark:text-blue-400 py-1 select-none animate-pulse">
                              Memproses gambar...
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <Button type="button" onClick={openImageEditor} variant="outline" className="h-9 text-xs gap-1.5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                                <Palette className="w-3.5 h-3.5" /> Editor
                              </Button>
                              <Button type="button" onClick={() => { setPresetFormOverlay(undefined); setOverlayUploading(false); }} variant="destructive" className="h-9 text-xs gap-1.5 bg-red-50 text-red-650 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-center group">
                        <input type="file" accept="image/png, image/jpeg" onChange={handlePresetOverlayUpload} className="hidden" />
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:scale-105 transition-transform flex items-center justify-center">
                          <ImagePlus className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pilih Gambar</p>
                          <p className="text-[10px] text-zinc-500 mt-1">Maksimal 8MB (PNG/JPG).</p>
                        </div>
                      </label>
                    )}
                  </div>
                </form>
              }
            />
          </div>
          
          {/* Perubahan: Menambahkan pb-safe area menggunakan inline style environment variable */}
          <div 
            className="px-6 pt-4 pb-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0 bg-white dark:bg-zinc-950 z-10"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <Button type="button" variant="ghost" onClick={closePresetModal} disabled={isSaving} className="h-10 px-6 text-zinc-600 hover:bg-zinc-100">Batal</Button>
            <Button type="submit" form="preset-form" disabled={isSaving || overlayUploading} className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 h-10 px-8 text-sm flex items-center gap-2">
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Menyimpan...
                </>
              ) : "Simpan Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG SECONDARY: IMAGE EDITOR (CROP & CHROMA KEY) */}
      <Dialog open={editorOpen} onOpenChange={open => { if (!open) setEditorOpen(false); }}>
        {/* Perubahan: height constraint menggunakan max-h-[100dvh] dan overflow-hidden */}
        <DialogContent className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white !max-w-[900px] w-[95vw] max-h-[100dvh] sm:rounded-2xl p-0 shadow-2xl flex flex-col z-[60] overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
            <div>
              <h3 className="text-base font-semibold">Editor Gambar</h3>
              <p className="text-xs text-zinc-500">Edit lapisan overlay sebelum dimasukkan ke kanvas.</p>
            </div>
            <button onClick={() => setEditorOpen(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-200/50 dark:bg-zinc-800 p-1.5 rounded-md"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
            {/* Kiri: Preview Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px] md:min-h-0" 
                 style={{ 
                   backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%)', 
                   backgroundSize: '20px 20px',
                   backgroundColor: '#f9fafb'
                 }}>
              
              <div className="relative inline-block shadow-lg">
                <img 
                  ref={imgRef}
                  src={activeMode === 'chroma' && chromaPreviewImage ? chromaPreviewImage : workingImage} 
                  alt="Editor Workspace" 
                  onClick={handleImageClick}
                  className={`max-w-full max-h-[50vh] object-contain block ${activeMode === 'chroma' && isPickingColor ? 'cursor-crosshair ring-2 ring-blue-500' : ''}`}
                  draggable={false}
                />
                
                {activeMode === 'crop' && (
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-[1px]" style={{ height: `${crop.top}%` }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[1px]" style={{ height: `${100 - crop.top - crop.height}%` }} />
                    <div className="absolute bg-black/60 backdrop-blur-[1px]" style={{ top: `${crop.top}%`, height: `${crop.height}%`, left: 0, width: `${crop.left}%` }} />
                    <div className="absolute bg-black/60 backdrop-blur-[1px]" style={{ top: `${crop.top}%`, height: `${crop.height}%`, right: 0, width: `${100 - crop.left - crop.width}%` }} />

                    <div
                      className="absolute border-[1.5px] border-blue-500 pointer-events-auto cursor-move flex items-center justify-center group select-none touch-none"
                      style={{ top: `${crop.top}%`, left: `${crop.left}%`, width: `${crop.width}%`, height: `${crop.height}%` }}
                      onPointerDown={(e) => onCropStart(e, 'move')}
                    >
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                         <div className="border-r border-b border-white/40"></div><div className="border-r border-b border-white/40"></div><div className="border-b border-white/40"></div>
                         <div className="border-r border-b border-white/40"></div><div className="border-r border-b border-white/40"></div><div className="border-b border-white/40"></div>
                         <div className="border-r border-white/40"></div><div className="border-r border-white/40"></div><div></div>
                      </div>

                      <div className="absolute w-8 h-8 -top-4 -left-4 flex items-center justify-center cursor-nwse-resize select-none touch-none active:scale-110 transition-transform" onPointerDown={(e) => onCropStart(e, 'nw')}>
                        <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm pointer-events-none" />
                      </div>
                      <div className="absolute w-8 h-8 -top-4 -right-4 flex items-center justify-center cursor-nesw-resize select-none touch-none active:scale-110 transition-transform" onPointerDown={(e) => onCropStart(e, 'ne')}>
                        <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm pointer-events-none" />
                      </div>
                      <div className="absolute w-8 h-8 -bottom-4 -left-4 flex items-center justify-center cursor-nesw-resize select-none touch-none active:scale-110 transition-transform" onPointerDown={(e) => onCropStart(e, 'sw')}>
                        <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm pointer-events-none" />
                      </div>
                      <div className="absolute w-8 h-8 -bottom-4 -right-4 flex items-center justify-center cursor-nwse-resize select-none touch-none active:scale-110 transition-transform" onPointerDown={(e) => onCropStart(e, 'se')}>
                        <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {activeMode === 'chroma' && isPickingColor && (
                <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
                  <div className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                    <Pointer className="w-3.5 h-3.5" /> Klik pada warna di gambar untuk menghapusnya
                  </div>
                </div>
              )}
            </div>

            {/* Kanan: Sidebar Tools */}
            <div className="w-full md:w-[300px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0">
              {activeMode === 'none' && (
                <div className="p-5 space-y-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pilih Alat Editor</p>
                  <button onClick={startCropMode} className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                    <Crop className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 mb-2" />
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Potong (Crop)</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Buang area gambar yang tidak diinginkan.</p>
                  </button>
                  <button onClick={startChromaMode} className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
                    <Palette className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500 mb-2" />
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Hapus Warna</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Otomatis buat transparan background hijau/polos.</p>
                  </button>

                  <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <Button onClick={resetToOriginal} variant="ghost" className="w-full text-xs text-zinc-500 hover:text-zinc-900">
                      <RotateCcw className="w-3.5 h-3.5 mr-2" /> Kembalikan ke Asli
                    </Button>
                  </div>
                </div>
              )}

              {activeMode === 'crop' && (
                <div className="flex flex-col h-full">
                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white mb-4">
                      <Crop className="w-4 h-4 text-blue-500" />
                      <h4 className="font-semibold text-sm">Mode Crop</h4>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                      Tarik titik biru pada sudut kotak di gambar kiri untuk menyesuaikan area potongan.
                    </p>
                  </div>
                  <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
                    <Button onClick={applyCrop} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Check className="w-4 h-4 mr-2" /> Terapkan Crop
                    </Button>
                    <Button onClick={() => setActiveMode('none')} variant="ghost" className="w-full">Batal</Button>
                  </div>
                </div>
              )}

              {activeMode === 'chroma' && (
                <div className="flex flex-col h-full">
                  <div className="p-5 flex-1 space-y-5">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                      <Palette className="w-4 h-4 text-emerald-500" />
                      <h4 className="font-semibold text-sm">Mode Hapus Warna</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        variant={isPickingColor ? "default" : "outline"} 
                        onClick={() => setIsPickingColor(!isPickingColor)}
                        className={`w-full justify-start text-xs h-9 ${isPickingColor ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500' : 'border-zinc-300 dark:border-zinc-700'}`}
                      >
                        <Pipette className="w-4 h-4 mr-2" /> 
                        {isPickingColor ? 'Sedang Membaca...' : '1. Pilih Warna (Klik)'}
                      </Button>

                      {chromaColor ? (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: `rgb(${chromaColor.r}, ${chromaColor.g}, ${chromaColor.b})` }} />
                            <div>
                              <span className="block text-xs font-semibold text-emerald-800 dark:text-emerald-400">Warna Aktif</span>
                              <button onClick={() => setChromaColor(null)} className="text-[10px] text-zinc-500 hover:text-red-500 hover:underline">Hapus / Ulangi</button>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                            <div className="flex justify-between text-[10px] font-medium text-emerald-800 dark:text-emerald-400">
                              <span>2. Atur Sensitivitas</span>
                              <span>{chromaTolerance}</span>
                            </div>
                            <input 
                              type="range" min="0" max="200" value={chromaTolerance} 
                              onChange={e => setChromaTolerance(Number(e.target.value))}
                              className="w-full accent-emerald-500 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-500 italic text-center px-2">Klik tombol di atas lalu klik pada background gambar untuk menghapus warnanya.</p>
                      )}
                    </div>
                  </div>
                  <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
                    <Button onClick={applyChroma} disabled={!chromaColor} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Check className="w-4 h-4 mr-2" /> Terapkan Penghapusan
                    </Button>
                    <Button onClick={() => setActiveMode('none')} variant="ghost" className="w-full">Batal</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div 
            className="px-5 pt-4 pb-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-end shrink-0"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <Button onClick={applyAllImageEdits} className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 px-8">
              Selesai & Tutup Editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}