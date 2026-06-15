"use client";

import React, { useState, useEffect } from "react";
import {
  Plus, Palette, Edit2, Trash2, CheckCircle2,
  Eye, ImagePlus, X, Sparkles, Layers, Filter, Smile, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  EventConfig,
  LayoutAsset,
  FilterAsset,
  StickerAsset,
  PresetTemplate,
  SlotConfig,
} from "../../hooks/usePhotoboothStore";
import SlotLayoutEditor, { generateDefaultSlots } from "./SlotLayoutEditor";

// ─── Shared style helpers ─────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { id: "neon",          label: "Neon" },
  { id: "classic-white", label: "Light" },
  { id: "classic-black", label: "Dark" },
  { id: "pastel",        label: "Pastel" },
  { id: "filmstrip",     label: "Film" },
] as const;

const styleBgCSS = (style: string): React.CSSProperties => {
  if (style === "neon")          return { background: "linear-gradient(to bottom,#0b0813,#150e29)" };
  if (style === "classic-white") return { backgroundColor: "#ffffff" };
  if (style === "classic-black") return { backgroundColor: "#0a0a0a" };
  if (style === "pastel")        return { background: "linear-gradient(135deg,#ffdcd9,#fae8ff,#e0e7ff)" };
  if (style === "filmstrip")     return { backgroundColor: "#18181b" };
  return { backgroundColor: "#111" };
};

const slotBgCSS = (style: string, idx: number): React.CSSProperties => {
  if (style === "neon") {
    const c = idx % 2 === 0 ? "#00ffff" : "#ff00ff";
    return { backgroundColor: "#0a0a0a", border: `1px solid ${c}`, boxShadow: `0 0 5px ${c}` };
  }
  if (style === "classic-white") return { backgroundColor: "#f4f4f5", border: "1px solid #d4d4d8" };
  if (style === "classic-black") return { backgroundColor: "#18181b", border: "1px solid #27272a" };
  if (style === "pastel")        return { backgroundColor: "rgba(255,255,255,0.75)", border: "2px solid #fff", borderRadius: 10 };
  if (style === "filmstrip")     return { backgroundColor: "#09090b", border: "1px solid #3f3f46" };
  return { backgroundColor: "#222" };
};

const getDefaultSlots = (style: string, overlay?: string): Array<{ left:string; top:string; width:string; height:string }> => {
  const isFilm    = !!overlay?.includes("film_frame");
  const isVintage = !!overlay?.includes("red_vintage") || !!overlay?.includes("vintage");

  if (isFilm) return [
    { left:"34.77%", width:"30.37%", top:"1.76%",  height:"30.47%" },
    { left:"34.77%", width:"30.37%", top:"34.18%", height:"31.05%" },
    { left:"34.77%", width:"30.37%", top:"67.29%", height:"30.85%" },
  ];
  if (isVintage) return [
    { left:"14.84%", width:"68.07%", top:"13.96%", height:"22.48%" },
    { left:"14.84%", width:"68.07%", top:"37.69%", height:"22.48%" },
    { left:"14.84%", width:"68.07%", top:"61.42%", height:"22.48%" },
  ];
  const L = style === "filmstrip" ? "7%" : "5%";
  const W = style === "filmstrip" ? "86%" : "90%";
  return [
    { left:L, width:W, top:"2.08%",  height:"28.07%" },
    { left:L, width:W, top:"31.39%", height:"28.07%" },
    { left:L, width:W, top:"60.71%", height:"28.07%" },
  ];
};

// ─── StripPreview ─────────────────────────────────────────────────────────────

function StripPreview({
  style, overlay, eventName, frameText,
  customSlots, size = "sm",
  overlayX = 0, overlayY = 0, overlayW = 100, overlayH = 100, overlayRotation = 0,
}: {
  style: string; overlay?: string; eventName: string; frameText: string;
  customSlots?: SlotConfig[]; size?: "sm" | "md" | "lg";
  overlayX?: number; overlayY?: number; overlayW?: number; overlayH?: number; overlayRotation?: number;
}) {
  const widthMap = { sm: 72, md: 130, lg: 195 };
  const W = widthMap[size];
  const textSz = size === "lg" ? 10 : size === "md" ? 7 : 4.5;
  const subSz  = size === "lg" ? 8  : size === "md" ? 5.5 : 3.5;
  const isFilm = !!overlay?.includes("film_frame");

  const displaySlots: Array<{ left:string; top:string; width:string; height:string; rot?: number }> =
    customSlots && customSlots.length > 0
      ? customSlots.map(s => ({ left:`${s.xPct}%`, top:`${s.yPct}%`, width:`${s.widthPct}%`, height:`${s.heightPct}%`, rot: s.rotation }))
      : getDefaultSlots(style, overlay);

  return (
    <div className="relative overflow-hidden rounded-lg shrink-0 select-none"
      style={{ width: W, aspectRatio: "500/1202.5", ...styleBgCSS(style) }}>

      {/* Filmstrip holes */}
      {style === "filmstrip" && !isFilm && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-[5%] flex flex-col justify-around py-[3%] z-10 pointer-events-none">
            {Array.from({length:10}).map((_,i)=><div key={i} className="w-full aspect-square bg-zinc-950 rounded-[1px]" />)}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-[5%] flex flex-col justify-around py-[3%] z-10 pointer-events-none">
            {Array.from({length:10}).map((_,i)=><div key={i} className="w-full aspect-square bg-zinc-950 rounded-[1px]" />)}
          </div>
        </>
      )}

      {/* Photo slots */}
      {displaySlots.slice(0,6).map((sl, idx) => (
        <div key={idx} style={{
          position: "absolute", ...slotBgCSS(style, idx),
          left: sl.left, top: sl.top, width: sl.width, height: sl.height,
          transform: sl.rot ? `rotate(${sl.rot}deg)` : undefined,
          transformOrigin: "center",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: `${textSz}px`, fontFamily: "monospace", fontWeight: 700,
          color: style === "neon" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)",
        }}>
          {idx + 1}
        </div>
      ))}

      {/* Footer text */}
      {!overlay && (
        <div style={{
          position: "absolute", left: "5%", width: "90%", top: "89%", height: "9%",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", pointerEvents: "none", overflow: "hidden",
          textAlign: "center",
        }}>
          <span style={{
            fontSize: textSz, fontWeight: 700, lineHeight: 1.1, display: "block",
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "100%",
            color: style === "neon" ? "#00ffff" : style === "classic-white" ? "#18181b" : style === "pastel" ? "#4c1d95" : "#e4e4e7",
          }}>{eventName || "EVENT"}</span>
          <span style={{
            fontSize: subSz, marginTop: "0.3em", lineHeight: 1.1,
            color: style === "neon" ? "#ff80ff" : "#71717a",
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "100%",
          }}>{frameText || "Caption"}</span>
        </div>
      )}

      {/* PNG overlay on top */}
      {overlay && (
        <img src={overlay} alt="" draggable={false}
          className="absolute pointer-events-none z-20"
          style={{
            left: `${overlayX}%`,
            top: `${overlayY}%`,
            width: `${overlayW}%`,
            height: `${overlayH}%`,
            transform: overlayRotation ? `rotate(${overlayRotation}deg)` : undefined,
            transformOrigin: "center",
            objectFit: "fill",
          }}
        />
      )}
    </div>
  );
}

// ─── StyleBadge ───────────────────────────────────────────────────────────────

function StyleBadge({ style }: { style: string }) {
  const map: Record<string,string> = {
    neon:           "bg-cyan-950/50 text-cyan-400 border-cyan-900/60",
    "classic-white":"bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    "classic-black":"bg-zinc-950 text-zinc-300 border-zinc-800",
    pastel:         "bg-pink-100/80 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-900",
    filmstrip:      "bg-amber-950/40 text-amber-500 border-amber-900/50",
  };
  const label = STYLE_OPTIONS.find(s => s.id === style)?.label ?? style;
  return (
    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${map[style] ?? "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
      {label}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FramesTabProps {
  config: EventConfig;
  addLayoutAsset: (layout: Omit<LayoutAsset, "id">) => void;
  deleteLayoutAsset: (id: string) => void;
  addFilterAsset: (filter: Omit<FilterAsset, "id">) => void;
  deleteFilterAsset: (id: string) => void;
  addStickerAsset: (sticker: Omit<StickerAsset, "id">) => void;
  deleteStickerAsset: (id: string) => void;
  addPresetTemplate: (preset: Omit<PresetTemplate, "id">) => void;
  updatePresetTemplate: (id: string, fields: Partial<PresetTemplate>) => void;
  deletePresetTemplate: (id: string) => void;
  setActivePresetTemplate: (id: string) => void;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FramesTab({
  config,
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
}: FramesTabProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"presets" | "layouts" | "filters" | "stickers" >("presets");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  // Preset CRUD States
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetEditingId, setPresetEditingId] = useState<string | null>(null);

  // Unified Preset form states (combining presets settings and slot/PNG frame overlays editor!)
  const [presetFormName, setPresetFormName] = useState("");
  const [presetFormLayoutId, setPresetFormLayoutId] = useState("");
  const [presetFormFilterId, setPresetFormFilterId] = useState("");
  const [presetFormAllowedStickers, setPresetFormAllowedStickers] = useState<string[]>([]);
  const [presetFormForceLayout, setPresetFormForceLayout] = useState(true);

  // Frames & Slot Overlay properties inside preset
  const [presetFormFrameStyle, setPresetFormFrameStyle] = useState("neon");
  const [presetFormFrameText, setPresetFormFrameText] = useState("");
  const [presetFormOverlay, setPresetFormOverlay] = useState<string | undefined>(undefined);
  const [presetFormSlots, setPresetFormSlots] = useState<SlotConfig[]>(generateDefaultSlots(4));
  const [presetFormOverlayX, setPresetFormOverlayX] = useState(0);
  const [presetFormOverlayY, setPresetFormOverlayY] = useState(0);
  const [presetFormOverlayW, setPresetFormOverlayW] = useState(100);
  const [presetFormOverlayH, setPresetFormOverlayH] = useState(100);
  const [presetFormOverlayRotation, setPresetFormOverlayRotation] = useState(0);

  // Layouts Local Form States
  const [layoutFormName, setLayoutFormName] = useState("");
  const [layoutFormCount, setLayoutFormCount] = useState(4);
  const [layoutFormDescription, setLayoutFormDescription] = useState("");

  // Filters Local Form States
  const [filterFormName, setFilterFormName] = useState("");
  const [filterFormCss, setFilterFormCss] = useState("");

  // Stickers Local Form States
  const [stickerFormName, setStickerFormName] = useState("");
  const [stickerFormEmoji, setStickerFormEmoji] = useState("");
  const [stickerFormOverlay, setStickerFormOverlay] = useState<string | undefined>(undefined);

  // Sync selected Preset ID
  useEffect(() => {
    if (config.activePresetTemplateId) {
      setSelectedPresetId(config.activePresetTemplateId);
    } else if (config.presetTemplates && config.presetTemplates.length > 0) {
      setSelectedPresetId(config.presetTemplates[0].id);
    }
  }, [config.activePresetTemplateId, config.presetTemplates]);

  const selectedPreset = config.presetTemplates?.find(p => p.id === selectedPresetId) ?? config.presetTemplates?.[0];

  // ── Preset Dialog helpers ──
  const openAddPreset = () => {
    setPresetEditingId(null);
    setPresetFormName("");
    setPresetFormLayoutId(config.customLayouts?.[0]?.id || "layout_strip");
    setPresetFormFilterId(config.customFilters?.[0]?.id || "filter_original");
    setPresetFormAllowedStickers(config.customStickers?.map(s => s.id) || []);
    setPresetFormForceLayout(true);
    setPresetFormFrameStyle("neon");
    setPresetFormFrameText("");
    setPresetFormOverlay(undefined);
    setPresetFormSlots(generateDefaultSlots(4));
    setPresetFormOverlayX(0); setPresetFormOverlayY(0);
    setPresetFormOverlayW(100); setPresetFormOverlayH(100);
    setPresetFormOverlayRotation(0);
    setPresetModalOpen(true);
  };

  const openEditPreset = (preset: PresetTemplate) => {
    setPresetEditingId(preset.id);
    setPresetFormName(preset.name);
    setPresetFormLayoutId(preset.layoutId);
    setPresetFormFilterId(preset.filterId);
    setPresetFormAllowedStickers(preset.allowedStickers || []);
    setPresetFormForceLayout(preset.forceLayout);
    setPresetFormFrameStyle(preset.frameStyle || "neon");
    setPresetFormFrameText(preset.frameText || "");
    setPresetFormOverlay(preset.imageOverlay);
    setPresetFormSlots(preset.customSlots ?? generateDefaultSlots(4));
    // Restore saved overlay coordinates (or use defaults if never set)
    setPresetFormOverlayX(preset.overlayX ?? 0);
    setPresetFormOverlayY(preset.overlayY ?? 0);
    setPresetFormOverlayW(preset.overlayW ?? 100);
    setPresetFormOverlayH(preset.overlayH ?? 100);
    setPresetFormOverlayRotation(preset.overlayRotation ?? 0);
    setPresetModalOpen(true);
  };

  const closePresetModal = () => { setPresetModalOpen(false); setPresetEditingId(null); };

  const handlePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetFormName.trim()) { alert("Nama preset wajib diisi."); return; }

    if (presetEditingId) {
      // Edit: save all form fields including slots & overlay coords
      const payload: Omit<PresetTemplate, "id"> = {
        name: presetFormName.trim(),
        layoutId: presetFormLayoutId,
        filterId: presetFormFilterId,
        allowedStickers: presetFormAllowedStickers,
        forceLayout: presetFormForceLayout,
        frameStyle: presetFormFrameStyle,
        frameText: presetFormFrameText.trim() || presetFormName.trim(),
        imageOverlay: presetFormOverlay,
        customSlots: presetFormSlots,
        overlayX: presetFormOverlayX,
        overlayY: presetFormOverlayY,
        overlayW: presetFormOverlayW,
        overlayH: presetFormOverlayH,
        overlayRotation: presetFormOverlayRotation,
      };
      updatePresetTemplate(presetEditingId, payload);
    } else {
      // Create: save name + overlay + whatever user configured in SlotLayoutEditor
      const payload: Omit<PresetTemplate, "id"> = {
        name: presetFormName.trim(),
        layoutId: config.customLayouts?.[0]?.id || "layout_strip",
        filterId: config.customFilters?.[0]?.id || "filter_original",
        allowedStickers: (config.customStickers || []).map(s => s.id),
        forceLayout: true,
        frameStyle: "neon",
        frameText: presetFormName.trim(),
        imageOverlay: presetFormOverlay,
        customSlots: presetFormSlots,          // ← use what user configured in SlotLayoutEditor
        overlayX: presetFormOverlayX,          // ← use what user configured
        overlayY: presetFormOverlayY,
        overlayW: presetFormOverlayW,
        overlayH: presetFormOverlayH,
        overlayRotation: presetFormOverlayRotation,
      };
      addPresetTemplate(payload);
    }
    closePresetModal();
  };


  // Adjust camera slot lines when selected layout changes
  const handlePresetLayoutChange = (layoutId: string) => {
    setPresetFormLayoutId(layoutId);
    const layout = config.customLayouts?.find(l => l.id === layoutId);
    const count = layout ? layout.count : 4;
    setPresetFormSlots(generateDefaultSlots(count));
  };

  const togglePresetSticker = (stickerId: string) => {
    setPresetFormAllowedStickers(prev =>
      prev.includes(stickerId) ? prev.filter(id => id !== stickerId) : [...prev, stickerId]
    );
  };

  const handlePresetOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") { alert("Harap unggah file PNG transparan."); return; }
    if (file.size > 6 * 1024 * 1024) { alert("Ukuran file maksimal 6MB."); return; }
    const reader = new FileReader();
    reader.onload = ev => setPresetFormOverlay(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Layout Form helpers ──
  const handleLayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!layoutFormName.trim()) return;
    addLayoutAsset({
      name: layoutFormName.trim(),
      count: layoutFormCount,
      description: layoutFormDescription.trim() || `${layoutFormCount} slots camera layout`,
    });
    setLayoutFormName("");
    setLayoutFormDescription("");
  };

  // ── Filter Form helpers ──
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterFormName.trim()) return;
    addFilterAsset({
      name: filterFormName.trim(),
      css: filterFormCss.trim(),
    });
    setFilterFormName("");
    setFilterFormCss("");
  };

  // ── Sticker Form helpers ──
  const handleStickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stickerFormName.trim()) return;
    const imageUrl = stickerFormOverlay || stickerFormEmoji.trim();
    if (!imageUrl) { alert("Isi Emoji atau Unggah file PNG transparan."); return; }

    addStickerAsset({
      name: stickerFormName.trim(),
      imageUrl,
    });
    setStickerFormName("");
    setStickerFormEmoji("");
    setStickerFormOverlay(undefined);
  };

  const handleStickerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") { alert("Harap unggah file PNG transparan."); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Ukuran file maksimal 2MB."); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setStickerFormOverlay(ev.target?.result as string);
      setStickerFormEmoji("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-200 text-zinc-100">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
            Template Builder &amp; Aset Dekorasi
          </h2>
          <p className="text-zinc-400 text-xs mt-1 max-w-lg leading-relaxed">
            Kelola template instan (Layout, Frame Overlay, Slots, &amp; Filter) serta aset dekoratif stiker kustom.
          </p>
        </div>
      </div>

      {/* Premium Tab Selection Navigation Pills */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl w-full max-w-3xl">
        {[
          { id: "presets", label: "Template Instan", icon: Sparkles },
          { id: "layouts", label: "Tata Letak (Layouts)", icon: Layers },
          { id: "filters", label: "Filter Kamera", icon: Filter },
          { id: "stickers", label: "Stiker &amp; Emoji", icon: Smile },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span dangerouslySetInnerHTML={{ __html: tab.label }} />
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-2 min-h-[500px]">

        {/* ── Tab: Presets ── */}
        {activeTab === "presets" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Presets List */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                  Daftar Template Instan ({config.presetTemplates?.length ?? 0})
                </span>
                <Button onClick={openAddPreset} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 font-semibold">
                  <Plus className="w-4 h-4" /> Tambah Template Instan
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {(config.presetTemplates || []).map(preset => {
                  const isActive = config.activePresetTemplateId === preset.id;
                  const isSelected = selectedPresetId === preset.id;
                  const layout = config.customLayouts?.find(l => l.id === preset.layoutId);
                  const filter = config.customFilters?.find(fi => fi.id === preset.filterId);

                  return (
                    <div key={preset.id} onClick={() => setSelectedPresetId(preset.id)}
                      className={`group relative flex gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/[0.04] shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                          : "border-zinc-800 bg-zinc-950/20 hover:border-zinc-700 hover:shadow-sm"
                      }`}
                    >
                      <StripPreview
                        style={preset.frameStyle || "neon"}
                        overlay={preset.imageOverlay}
                        eventName={config.eventName}
                        frameText={preset.frameText || preset.name}
                        customSlots={preset.customSlots}
                        size="sm"
                      />

                      <div className="flex flex-col justify-between flex-1 min-w-0">
                        <div>
                          <p className="text-sm font-semibold text-white truncate leading-tight">{preset.name}</p>
                          <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center gap-1">
                              <StyleBadge style={preset.frameStyle || "neon"} />
                              {preset.imageOverlay && (
                                <span className="text-[7px] font-bold bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 px-1 py-0.2 rounded font-mono uppercase">Overlay</span>
                              )}
                            </div>
                            <span className="text-[9px] text-zinc-400 mt-1 block">Layout: {layout?.name || "Bawaan"}</span>
                            <span className="text-[9px] text-zinc-400 block">Filter: {filter?.name || "Original"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 mt-3">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono uppercase">
                              <CheckCircle2 className="w-2.5 h-2.5" />Aktif
                            </span>
                          ) : (
                            <Button size="xs" onClick={e => { e.stopPropagation(); setActivePresetTemplate(preset.id); setSelectedPresetId(preset.id); }}
                              className="text-[9px] h-6 px-2 bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer shadow-none transition-all rounded-md">
                              Aktifkan
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); openEditPreset(preset); }}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deletePresetTemplate(preset.id); }}
                          disabled={isActive}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${isActive ? "opacity-20 cursor-not-allowed text-zinc-655" : "hover:bg-red-500/10 text-red-500 hover:text-red-400"}`} title="Hapus">
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Preset Preview Details */}
            <div className="lg:col-span-4 sticky top-24 flex flex-col gap-3">
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Pratinjau Detail</span>
              {selectedPreset ? (
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex justify-center">
                    <StripPreview
                      style={selectedPreset.frameStyle || "neon"}
                      overlay={selectedPreset.imageOverlay}
                      eventName={config.eventName}
                      frameText={selectedPreset.frameText || selectedPreset.name}
                      customSlots={selectedPreset.customSlots}
                      size="lg"
                      overlayX={selectedPreset.overlayX}
                      overlayY={selectedPreset.overlayY}
                      overlayW={selectedPreset.overlayW}
                      overlayH={selectedPreset.overlayH}
                      overlayRotation={selectedPreset.overlayRotation}
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white truncate">{selectedPreset.name}</span>
                      <StyleBadge style={selectedPreset.frameStyle || "neon"} />
                    </div>

                    <div className="flex gap-2 mt-1">
                      {config.activePresetTemplateId !== selectedPreset.id && (
                        <Button onClick={() => setActivePresetTemplate(selectedPreset.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2.5 rounded-xl cursor-pointer">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />Aktifkan Preset
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => openEditPreset(selectedPreset)}
                        className="flex-1 border-zinc-800 text-zinc-400 hover:text-white text-xs py-2.5 rounded-xl cursor-pointer hover:bg-zinc-900/50">
                        <Edit2 className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />Ubah / Atur Slot
                      </Button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-2xl p-10 flex flex-col items-center gap-2 text-zinc-500 text-xs text-center">
                  <Eye className="w-5 h-5 mb-1 text-zinc-600" />
                  <p>Pilih preset untuk pratinjau detail.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Tab: Layouts ── */}
        {activeTab === "layouts" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Layout List */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Tata Letak Kamera ({config.customLayouts?.length ?? 0})</span>
              <div className="flex flex-col gap-3">
                {config.customLayouts?.map(layout => {
                  const isSystemSeed = ["layout_strip", "layout_grid", "layout_polaroid"].includes(layout.id);
                  return (
                    <div key={layout.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                          {layout.name}
                          {isSystemSeed && <span className="text-[7.5px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest border border-amber-500/15">System</span>}
                        </h4>
                        <p className="text-zinc-400 text-xs mt-1">{layout.description}</p>
                        <span className="text-[10px] font-bold text-blue-400 mt-2 block font-mono uppercase">{layout.count} jepretan foto</span>
                      </div>
                      {!isSystemSeed && (
                        <button onClick={() => deleteLayoutAsset(layout.id)} className="p-2.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Layout Form */}
            <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h4 className="font-bold text-sm text-white">Tambah Tata Letak Baru</h4>
                <p className="text-zinc-550 text-[11px] mt-0.5">Tentukan nama dan total slot jepretan kamera.</p>
              </div>

              <form onSubmit={handleLayoutSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-mono text-zinc-400">Nama Layout</Label>
                  <Input required value={layoutFormName} onChange={e => setLayoutFormName(e.target.value)} placeholder="Contoh: Triple Landscape" className="bg-zinc-950 border-zinc-800 text-white text-xs p-3 rounded-xl focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-mono text-zinc-400">Jumlah Jepretan / Slot</Label>
                  <Input required type="number" min={1} max={10} value={layoutFormCount} onChange={e => setLayoutFormCount(parseInt(e.target.value) || 4)} className="bg-zinc-950 border-zinc-800 text-white text-xs p-3 rounded-xl focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-mono text-zinc-400">Keterangan / Deskripsi</Label>
                  <Input value={layoutFormDescription} onChange={e => setLayoutFormDescription(e.target.value)} placeholder="Contoh: Tata letak 3 foto melebar secara vertikal" className="bg-zinc-950 border-zinc-800 text-white text-xs p-3 rounded-xl focus:ring-1 focus:ring-blue-500" />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl mt-2 cursor-pointer">
                  Tambah Tata Letak
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ── Tab: Filters ── */}
        {activeTab === "filters" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Filter List */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">Filter CSS Aktif ({config.customFilters?.length ?? 0})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {config.customFilters?.map(filter => {
                  const isOriginal = filter.id === "filter_original";
                  return (
                    <div key={filter.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                          <div
                            className="w-8 h-8 rounded-md bg-gradient-to-tr from-pink-500 to-indigo-500 shadow-md"
                            style={{ filter: filter.css }}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{filter.name}</h4>
                          <code className="text-[9px] text-zinc-500 block max-w-[150px] truncate mt-1 leading-relaxed bg-zinc-950/60 px-1 py-0.5 rounded border border-zinc-900">{filter.css || "none"}</code>
                        </div>
                      </div>
                      {!isOriginal && (
                        <button onClick={() => deleteFilterAsset(filter.id)} className="p-2.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Filter Form */}
            <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h4 className="font-bold text-sm text-white">Tambah Filter CSS Kustom</h4>
                <p className="text-zinc-550 text-[11px] mt-0.5">Definisikan filter CSS standar seperti grayscale atau sepia.</p>
              </div>

              <form onSubmit={handleFilterSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-mono text-zinc-400">Nama Filter</Label>
                  <Input required value={filterFormName} onChange={e => setFilterFormName(e.target.value)} placeholder="Contoh: Warm Vintage" className="bg-zinc-950 border-zinc-800 text-white text-xs p-3 rounded-xl focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-mono text-zinc-400">Aturan CSS Filter</Label>
                  <Input required value={filterFormCss} onChange={e => setFilterFormCss(e.target.value)} placeholder="Contoh: sepia(40%) contrast(110%)" className="bg-zinc-950 border-zinc-800 text-white text-xs p-3 rounded-xl focus:ring-1 focus:ring-blue-500" />
                  <span className="text-[9px] text-zinc-550 leading-normal flex items-start gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-650 shrink-0 mt-0.5" />
                    Masukkan string filter CSS murni (cth: brightness(95%) saturate(140%)). Kosongkan untuk filter original.
                  </span>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl mt-2 cursor-pointer">
                  Tambah Filter
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ── Tab: Stickers ── */}
        {activeTab === "stickers" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sticker Grid List */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <span className="text-[10px] text-zinc-550 font-mono tracking-wider uppercase">Koleksi Stiker &amp; Emoji ({config.customStickers?.length ?? 0})</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {config.customStickers?.map(sticker => {
                  const isImg = sticker.imageUrl.startsWith("data:") || sticker.imageUrl.includes("/") || sticker.imageUrl.startsWith("http");
                  return (
                    <div key={sticker.id} className="group relative aspect-square bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:border-zinc-700 transition-all">
                      <div className="flex-1 flex items-center justify-center min-h-0 select-none">
                        {isImg ? (
                          <img src={sticker.imageUrl} alt={sticker.name} className="max-w-full max-h-full object-contain pointer-events-none" />
                        ) : (
                          <span className="text-3xl pointer-events-none">{sticker.imageUrl}</span>
                        )}
                      </div>
                      <span className="text-[9px] text-zinc-400 font-medium truncate max-w-full leading-tight">{sticker.name}</span>
                      <button onClick={() => deleteStickerAsset(sticker.id)} className="absolute top-1.5 right-1.5 p-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Sticker Form */}
            <div className="lg:col-span-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h4 className="font-bold text-sm text-white">Tambah Stiker Baru</h4>
                <p className="text-zinc-550 text-[11px] mt-0.5">Ketik sebuah emoji atau unggah file PNG transparan.</p>
              </div>

              <form onSubmit={handleStickerSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-mono text-zinc-400">Nama Stiker</Label>
                  <Input required value={stickerFormName} onChange={e => setStickerFormName(e.target.value)} placeholder="Contoh: Cool Sunglasses" className="bg-zinc-950 border-zinc-800 text-white text-xs p-3 rounded-xl focus:ring-1 focus:ring-blue-500" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-mono text-zinc-400">Ketik Karakter Emoji</Label>
                  <Input disabled={!!stickerFormOverlay} value={stickerFormEmoji} onChange={e => { setStickerFormEmoji(e.target.value); setStickerFormOverlay(undefined); }} placeholder="Contoh: 😎 atau 👑" className="bg-zinc-950 border-zinc-800 text-white text-xs p-3 rounded-xl focus:ring-1 focus:ring-blue-500" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-mono text-zinc-400">Atau Unggah PNG Transparan</Label>
                  {stickerFormOverlay ? (
                    <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <div className="w-10 h-10 bg-zinc-900 rounded overflow-hidden shrink-0 flex items-center justify-center p-1 border border-zinc-800">
                        <img src={stickerFormOverlay} alt="sticker upload preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-white">PNG Terpilih</p>
                        <p className="text-[9px] text-zinc-550 mt-0.5">Menggantikan emoji.</p>
                      </div>
                      <button type="button" onClick={() => setStickerFormOverlay(undefined)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="relative border border-dashed border-zinc-800 hover:border-blue-500/50 rounded-xl p-4 text-center cursor-pointer transition-all bg-zinc-950/20 hover:bg-blue-500/[0.02] block">
                      <input type="file" accept="image/png" onChange={handleStickerFile} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                        <ImagePlus className="w-4 h-4 text-zinc-500" />
                        <p className="text-[11px] font-semibold text-zinc-350">Pilih file PNG transparan</p>
                        <p className="text-[9px] text-zinc-550">Maks 2MB</p>
                      </div>
                    </label>
                  )}
                </div>

                <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-xl mt-2 cursor-pointer">
                  Tambah Stiker
                </Button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* ── Modal Dialog: CREATE ── name + overlay + slot editor ── */}
      <Dialog open={presetModalOpen && !presetEditingId} onOpenChange={open => { if (!open) closePresetModal(); }}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-[940px] rounded-2xl p-0 shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] h-full">

            {/* Left: name + overlay */}
            <div className="p-6 flex flex-col gap-5 min-w-0">
              <DialogHeader className="gap-1.5">
                <DialogTitle className="text-sm font-bold flex items-center gap-2 font-mono tracking-tight text-white">
                  <Sparkles className="w-4.5 h-4.5 text-blue-500" />
                  BUAT TEMPLATE INSTAN BARU
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 font-light leading-relaxed">
                  Beri nama, unggah PNG bingkai overlay (opsional), lalu atur posisi slot kamera di panel kanan.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePresetSubmit} className="flex flex-col gap-5 flex-1" id="create-preset-form">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Nama Template</Label>
                  <Input
                    required
                    autoFocus
                    value={presetFormName}
                    onChange={e => setPresetFormName(e.target.value)}
                    placeholder="Contoh: Retro Romantic, Neon Party..."
                    className="bg-zinc-900 border-zinc-800 text-white text-sm p-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600"
                  />
                </div>

                {/* Overlay PNG */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Overlay PNG Transparan <span className="text-zinc-600 normal-case font-normal">(opsional)</span>
                  </Label>
                  {presetFormOverlay ? (
                    <div className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <div className="w-16 h-20 bg-zinc-950 rounded-lg overflow-hidden shrink-0 border border-zinc-800 flex items-center justify-center">
                        <img src={presetFormOverlay} alt="overlay preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">PNG terunggah ✓</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">Overlay aktif. Atur posisi slot kamera di panel kanan.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPresetFormOverlay(undefined)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer shrink-0"
                        title="Hapus overlay"
                      >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ) : (
                    <label className="relative border-2 border-dashed border-zinc-800 hover:border-blue-500/50 rounded-xl p-7 text-center cursor-pointer transition-all bg-zinc-900/20 hover:bg-blue-500/[0.03] block group">
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handlePresetOverlayUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-3 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
                          <ImagePlus className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-300">Pilih file PNG transparan</p>
                          <p className="text-[11px] text-zinc-500 mt-1">Drag & drop atau klik · Maks 6 MB</p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 mt-auto pt-4 border-t border-zinc-800/80">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={closePresetModal}
                    className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 px-4 py-2.5 rounded-xl h-auto cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-sm h-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Buat Template
                  </Button>
                </div>
              </form>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-zinc-800 self-stretch" />

            {/* Right: slot layout editor + live preview */}
            <div className="p-6 flex flex-col gap-4 bg-zinc-900/10 min-w-0">
              <div>
                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase mb-1">
                  Atur Posisi Slot Kamera
                </p>
                <p className="text-[10px] text-zinc-555 leading-relaxed">
                  Tentukan posisi, ukuran, dan rotasi jepretan kamera pada strip foto.
                </p>
              </div>

              <SlotLayoutEditor
                slots={presetFormSlots}
                onChange={setPresetFormSlots}
                frameStyle={presetFormFrameStyle}
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
              />

              {/* Mini live preview */}
              <div className="flex flex-col items-center gap-2 pt-2 border-t border-zinc-800">
                <p className="text-[9px] text-zinc-450 font-mono uppercase tracking-wider">Pratinjau Hasil</p>
                <StripPreview
                  style={presetFormFrameStyle}
                  overlay={presetFormOverlay}
                  eventName={config.eventName || "EVENT NAME"}
                  frameText={presetFormName || "Caption"}
                  customSlots={presetFormSlots}
                  size="md"
                  overlayX={presetFormOverlayX}
                  overlayY={presetFormOverlayY}
                  overlayW={presetFormOverlayW}
                  overlayH={presetFormOverlayH}
                  overlayRotation={presetFormOverlayRotation}
                />
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Dialog: EDIT ── name + overlay + slot editor ── */}
      <Dialog open={presetModalOpen && !!presetEditingId} onOpenChange={open => { if (!open) closePresetModal(); }}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-[940px] rounded-2xl p-0 shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] h-full">

            {/* Left: name + overlay */}
            <div className="p-6 flex flex-col gap-5 min-w-0">
              <DialogHeader className="gap-1.5">
                <DialogTitle className="text-sm font-bold flex items-center gap-2 font-mono tracking-tight text-white">
                  <Edit2 className="w-4.5 h-4.5 text-blue-500" />
                  EDIT TEMPLATE INSTAN
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 font-light leading-relaxed">
                  Ubah nama template, ganti overlay PNG bingkai, dan atur posisi slot kamera di panel kanan.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePresetSubmit} className="flex flex-col gap-5 flex-1" id="preset-form">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Nama Template</Label>
                  <Input
                    required
                    autoFocus
                    value={presetFormName}
                    onChange={e => setPresetFormName(e.target.value)}
                    placeholder="Contoh: Retro Romantic, Neon Party..."
                    className="bg-zinc-900 border-zinc-800 text-white text-sm p-3.5 rounded-xl focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600"
                  />
                </div>

                {/* Overlay PNG */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Overlay PNG Transparan <span className="text-zinc-600 normal-case font-normal">(opsional)</span>
                  </Label>
                  {presetFormOverlay ? (
                    <div className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <div className="w-16 h-20 bg-zinc-950 rounded-lg overflow-hidden shrink-0 border border-zinc-800 flex items-center justify-center">
                        <img src={presetFormOverlay} alt="overlay preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">PNG terunggah ✓</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">Overlay aktif. Atur posisi slot kamera di panel kanan.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPresetFormOverlay(undefined)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer shrink-0"
                        title="Hapus overlay"
                      >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ) : (
                    <label className="relative border-2 border-dashed border-zinc-800 hover:border-blue-500/50 rounded-xl p-7 text-center cursor-pointer transition-all bg-zinc-900/20 hover:bg-blue-500/[0.03] block group">
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handlePresetOverlayUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-3 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
                          <ImagePlus className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-300">Pilih file PNG transparan</p>
                          <p className="text-[11px] text-zinc-500 mt-1">Drag & drop atau klik · Maks 6 MB</p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 mt-auto pt-4 border-t border-zinc-800/80">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={closePresetModal}
                    className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 px-4 py-2.5 rounded-xl h-auto cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-sm h-auto cursor-pointer"
                  >
                    Simpan Template
                  </Button>
                </div>
              </form>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-zinc-800 self-stretch" />

            {/* Right: slot layout editor + live preview */}
            <div className="p-6 flex flex-col gap-4 bg-zinc-900/10 min-w-0">
              <div>
                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase mb-1">
                  Atur Posisi Slot Kamera
                </p>
                <p className="text-[10px] text-zinc-555 leading-relaxed">
                  Tentukan posisi, ukuran, dan rotasi jepretan kamera untuk layout terpilih.
                </p>
              </div>

              <SlotLayoutEditor
                slots={presetFormSlots}
                onChange={setPresetFormSlots}
                frameStyle={presetFormFrameStyle}
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
              />

              {/* Mini live preview */}
              <div className="flex flex-col items-center gap-2 pt-2 border-t border-zinc-800">
                <p className="text-[9px] text-zinc-450 font-mono uppercase tracking-wider">Pratinjau Hasil</p>
                <StripPreview
                  style={presetFormFrameStyle}
                  overlay={presetFormOverlay}
                  eventName={config.eventName || "EVENT NAME"}
                  frameText={presetFormName || "Caption"}
                  customSlots={presetFormSlots}
                  size="md"
                  overlayX={presetFormOverlayX}
                  overlayY={presetFormOverlayY}
                  overlayW={presetFormOverlayW}
                  overlayH={presetFormOverlayH}
                  overlayRotation={presetFormOverlayRotation}
                />
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}
