"use client";

import { useState } from "react";
import {
  Sparkles, Filter, Layers, ArrowRight, CheckCircle2,
  Camera, Sun, Moon, User, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventConfig, PresetTemplate, FrameTemplate } from "../../hooks/usePhotoboothStore";

// ─── Style helpers ────────────────────────────────────────────────────────────

const STYLE_BG_CSS: Record<string, React.CSSProperties> = {
  neon:            { background: "linear-gradient(to bottom,#0b0813,#150e29)" },
  "classic-white": { backgroundColor: "#ffffff" },
  "classic-black": { backgroundColor: "#0a0a0a" },
  pastel:          { background: "linear-gradient(135deg,#ffdcd9,#fae8ff,#e0e7ff)" },
  filmstrip:       { backgroundColor: "#18181b" },
};

const FILTERS_CSS_MAPPING: Record<string, string> = {
  original: "none",
  bw: "grayscale(1) contrast(1.3) brightness(1.05)",
  vintage: "sepia(0.4) contrast(1.1) saturate(1.1) brightness(0.95)",
  neon: "hue-rotate(240deg) saturate(1.8) brightness(1.1)",
  sepia: "sepia(0.8) hue-rotate(-20deg) saturate(1.3)",
  cyber: "hue-rotate(295deg) saturate(1.7) contrast(1.15)",
  pop: "saturate(2.3) contrast(1.25)",
  noir: "grayscale(1) contrast(1.9) brightness(0.9)"
};

// ─── Strip Mini Preview ───────────────────────────────────────────────────────

function SlotPreviewMini({ preset, slotCount, style = "neon" }: { preset?: PresetTemplate | FrameTemplate; slotCount: number; style?: string }) {
  const bgCSS = STYLE_BG_CSS[style] || { backgroundColor: "#111" };
  const isNeon = style === "neon";

  const autoSlots = Array.from({ length: slotCount }, (_, i) => ({
    top:    `${2 + i * (98 / slotCount)}%`,
    height: `${(98 / slotCount) - 1.5}%`,
    left: "5%", width: "90%",
  }));

  const displaySlots = preset?.customSlots && preset.customSlots.length > 1
    ? preset.customSlots.map(s => ({
        left: `${s.xPct}%`, top: `${s.yPct}%`,
        width: `${s.widthPct}%`, height: `${s.heightPct}%`,
      }))
    : autoSlots;

  const is2R = preset?.paperSize === "2R";
  const aspectRatio = is2R ? "591/1772" : "1205/1795";

  return (
    <div className="relative overflow-hidden rounded-md shrink-0 shadow-xl shadow-black/20 border border-zinc-800/30"
      style={{ width: 64, aspectRatio, borderRadius: preset?.imageOverlay ? "0px" : undefined, ...bgCSS }}>
      {displaySlots.slice(0, 8).map((sl, i) => (
        <div key={i} style={{
          position: "absolute",
          left: sl.left, top: sl.top, width: sl.width, height: sl.height,
          backgroundColor: isNeon ? "#0a0a0a" : "rgba(0,0,0,0.12)",
          border: isNeon ? "1px solid rgba(0,255,255,0.4)" : "1px solid rgba(0,0,0,0.2)",
          borderRadius: preset?.imageOverlay ? 0 : 2, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 6,
          color: "rgba(255,255,255,0.4)", fontWeight: 700,
        }}>
          {i + 1}
        </div>
      ))}
      {preset?.imageOverlay && (
        <img src={preset.imageOverlay} alt="" draggable={false}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
          style={{
            left: `${preset.overlayX ?? 0}%`, top: `${preset.overlayY ?? 0}%`,
            width: `${preset.overlayW ?? 100}%`, height: `${preset.overlayH ?? 100}%`,
          }}
        />
      )}
    </div>
  );
}

// ─── Large Preview Component ──────────────────────────────────────────────────

function SlotPreviewLarge({
  preset,
  filterId,
  config
}: {
  preset?: PresetTemplate;
  filterId: string;
  config: EventConfig;
}) {
  let layoutId = "strip";
  if (preset) {
    if (preset.id.includes("grid")) {
      layoutId = "grid";
    } else if (preset.id.includes("polaroid") || preset.customSlots) {
      layoutId = "polaroid";
    }
  }

  const style = config.frameStyle || "neon";
  const bgCSS = STYLE_BG_CSS[style] || { backgroundColor: "#111" };
  const isNeon = style === "neon";

  // Hitung jumlah slot foto
  const layoutCount = layoutId === "polaroid" ? 1 : (layoutId === "grid" ? 4 : 4);

  const isCustomFrame = !!(preset && (!preset.customSlots || preset.customSlots.length <= 1));

  let displaySlots: Array<{ left: string; top: string; width: string; height: string; rotation: number }> = [];
  let displayOverlays: Array<{ left: string; top: string; width: string; height: string; rotation: number }> = [];
  let w = 500;
  let h = 1202.5;

  if (layoutId === "strip") {
    w = 500;
    const padding = 25;
    const photoW = w - padding * 2; // 450px
    const photoH = Math.round(photoW * (3 / 4)); // 337.5px
    const gap = 15;
    const footerH = 110;

    const overlayH = preset?.overlayH ?? 100;
    const isDesignedForTile = isCustomFrame && overlayH <= 50;

    if (isCustomFrame && isDesignedForTile) {
      const tileH = (overlayH / 100) * 1202.5;
      h = padding + layoutCount * tileH + padding;
    } else {
      h = padding + (layoutCount * photoH) + ((layoutCount - 1) * gap) + footerH + padding;
    }

    if (isCustomFrame) {
      const slot = (preset?.customSlots && preset.customSlots.length > 0)
        ? preset.customSlots[0]
        : { xPct: 5, yPct: 5, widthPct: 90, heightPct: 90, rotation: 0 };

      const overlayX = preset?.overlayX ?? 0;
      const overlayY = preset?.overlayY ?? 0;
      const overlayW = preset?.overlayW ?? 100;

      const scaleX = w / 500; // 1

      displaySlots = Array.from({ length: layoutCount }, (_, i) => {
        let sy = 0, sh = 0;
        if (isDesignedForTile) {
          const scaleY = scaleX;
          const tileH = (overlayH / 100) * 1202.5 * scaleY;
          const tileY = padding + i * tileH;
          sh = (slot.heightPct / 100) * 1202.5 * scaleY;
          sy = tileY + (slot.yPct / 100) * 1202.5 * scaleY;
        } else {
          const th = h / layoutCount;
          const scaleY = th / 1202.5;
          sh = (slot.heightPct / 100) * 1202.5 * scaleY;
          sy = (i * th) + (slot.yPct / 100) * 1202.5 * scaleY;
        }
        const sw = (slot.widthPct / 100) * 500 * scaleX;
        const sx = (slot.xPct / 100) * 500 * scaleX;

        return {
          left: `${(sx / w) * 100}%`,
          top: `${(sy / h) * 100}%`,
          width: `${(sw / w) * 100}%`,
          height: `${(sh / h) * 100}%`,
          rotation: slot.rotation || 0,
        };
      });

      if (preset?.imageOverlay) {
        displayOverlays = Array.from({ length: layoutCount }, (_, i) => {
          let oy = 0, oh = 0;
          if (isDesignedForTile) {
            const scaleY = scaleX;
            const tileH = (overlayH / 100) * 1202.5 * scaleY;
            const tileY = padding + i * tileH;
            oh = tileH;
            oy = tileY + (overlayY / 100) * 1202.5 * scaleY;
          } else {
            const th = h / layoutCount;
            const scaleY = th / 1202.5;
            oh = (overlayH / 100) * 1202.5 * scaleY;
            oy = (i * th) + (overlayY / 100) * 1202.5 * scaleY;
          }
          const ow = (overlayW / 100) * 500 * scaleX;
          const ox = (overlayX / 100) * 500 * scaleX;

          return {
            left: `${(ox / w) * 100}%`,
            top: `${(oy / h) * 100}%`,
            width: `${(ow / w) * 100}%`,
            height: `${(oh / h) * 100}%`,
            rotation: preset.overlayRotation ?? 0,
          };
        });
      }
    } else {
      // standard non-custom frame
      const isFilmFrame = preset?.id === "preset_retro_scrapbook" || !!preset?.imageOverlay?.includes("film_frame");
      const isRedVintage = !!preset?.imageOverlay?.includes("red_vintage");

      if (preset?.customSlots && preset.customSlots.length > 1) {
        displaySlots = preset.customSlots.map(s => ({
          left: `${s.xPct}%`, top: `${s.yPct}%`,
          width: `${s.widthPct}%`, height: `${s.heightPct}%`,
          rotation: s.rotation || 0,
        }));
      } else if (isFilmFrame) {
        displaySlots = [
          { left: "13%", width: "74%", top: "4%",    height: "29%", rotation: 0 },
          { left: "13%", width: "74%", top: "35.5%", height: "29%", rotation: 0 },
          { left: "13%", width: "74%", top: "67%",   height: "29%", rotation: 0 },
        ];
      } else if (isRedVintage) {
        const slotLeftPct = 0.1484;
        const slotWidthPct = 0.6807;
        const slotTopPct = 0.1396;
        const slotHeightPct = 0.6993;

        const slotX = slotLeftPct * w;
        const slotW = slotWidthPct * w;
        const slotTop = slotTopPct * h;
        const slotH = slotHeightPct * h;

        const photoHeight = (slotH - (layoutCount - 1) * gap) / layoutCount;

        displaySlots = Array.from({ length: layoutCount }, (_, i) => {
          const drawY = slotTop + i * (photoHeight + gap);
          return {
            left: `${(slotX / w) * 100}%`,
            top: `${(drawY / h) * 100}%`,
            width: `${(slotW / w) * 100}%`,
            height: `${(photoHeight / h) * 100}%`,
            rotation: 0,
          };
        });
      } else {
        const isFilmstripStyle = style === "filmstrip" || preset?.id === "frame_filmstrip";
        const left = isFilmstripStyle ? "7%" : "5%";
        const width = isFilmstripStyle ? "86%" : "90%";
        displaySlots = Array.from({ length: layoutCount }, (_, i) => {
          const y = padding + i * (photoH + gap);
          return {
            left,
            top: `${(y / h) * 100}%`,
            width,
            height: `${(photoH / h) * 100}%`,
            rotation: 0,
          };
        });
      }

      displayOverlays = preset?.imageOverlay ? [{
        left: `${preset.overlayX ?? 0}%`,
        top: `${preset.overlayY ?? 0}%`,
        width: `${preset.overlayW ?? 100}%`,
        height: `${preset.overlayH ?? 100}%`,
        rotation: preset.overlayRotation ?? 0,
      }] : [];
    }
  } else if (layoutId === "grid") {
    w = 800;
    const padding = 40;
    const gap = 25;
    const photoW = (w - padding * 2 - gap) / 2; // 347.5px
    const photoH = photoW;
    const footerH = 130;

    const overlayH = preset?.overlayH ?? 100;

    if (isCustomFrame) {
      const scaleX = photoW / 500; // 0.695
      const tileH = (overlayH / 100) * 1202.5 * scaleX;
      h = padding + 2 * tileH + gap + padding;
    } else {
      h = padding + (2 * photoH) + gap + footerH + padding;
    }

    if (isCustomFrame) {
      const slot = (preset?.customSlots && preset.customSlots.length > 0)
        ? preset.customSlots[0]
        : { xPct: 5, yPct: 5, widthPct: 90, heightPct: 90, rotation: 0 };

      const overlayX = preset?.overlayX ?? 0;
      const overlayY = preset?.overlayY ?? 0;
      const overlayW = preset?.overlayW ?? 100;

      const cols = 2;
      const scaleX = photoW / 500;
      const scaleY = scaleX;

      const tileH = (overlayH / 100) * 1202.5 * scaleY;
      const tw = photoW;

      displaySlots = Array.from({ length: layoutCount }, (_, i) => {
        const gridCol = i % cols;
        const gridRow = Math.floor(i / cols);

        const sw = (slot.widthPct / 100) * 500 * scaleX;
        const sh = (slot.heightPct / 100) * 1202.5 * scaleY;

        const sx = padding + gridCol * (tw + gap) + (slot.xPct / 100) * 500 * scaleX;
        const sy = padding + gridRow * (tileH + gap) + (slot.yPct / 100) * 1202.5 * scaleY;

        return {
          left: `${(sx / w) * 100}%`,
          top: `${(sy / h) * 100}%`,
          width: `${(sw / w) * 100}%`,
          height: `${(sh / h) * 100}%`,
          rotation: slot.rotation || 0,
        };
      });

      if (preset?.imageOverlay) {
        displayOverlays = Array.from({ length: layoutCount }, (_, i) => {
          const gridCol = i % cols;
          const gridRow = Math.floor(i / cols);

          const ow = (overlayW / 100) * 500 * scaleX;
          const oh = tileH;

          const ox = padding + gridCol * (tw + gap) + (overlayX / 100) * 500 * scaleX;
          const oy = padding + gridRow * (tileH + gap) + (overlayY / 100) * 1202.5 * scaleY;

          return {
            left: `${(ox / w) * 100}%`,
            top: `${(oy / h) * 100}%`,
            width: `${(ow / w) * 100}%`,
            height: `${(oh / h) * 100}%`,
            rotation: preset.overlayRotation ?? 0,
          };
        });
      }
    } else {
      const positions = [
        { x: padding, y: padding },
        { x: padding + photoW + gap, y: padding },
        { x: padding, y: padding + photoH + gap },
        { x: padding + photoW + gap, y: padding + photoH + gap },
      ];
      displaySlots = Array.from({ length: layoutCount }, (_, i) => {
        const pos = positions[i % positions.length];
        return {
          left: `${(pos.x / w) * 100}%`,
          top: `${(pos.y / h) * 100}%`,
          width: `${(photoW / w) * 100}%`,
          height: `${(photoH / h) * 100}%`,
          rotation: 0,
        };
      });

      displayOverlays = preset?.imageOverlay ? [{
        left: `${preset.overlayX ?? 0}%`,
        top: `${preset.overlayY ?? 0}%`,
        width: `${preset.overlayW ?? 100}%`,
        height: `${preset.overlayH ?? 100}%`,
        rotation: preset.overlayRotation ?? 0,
      }] : [];
    }
  } else {
    // polaroid/custom layouts
    if (preset) {
      const is2R = preset.paperSize === "2R";
      w = is2R ? 591 : 1205;
      h = is2R ? 1772 : 1795;
      const scaleX = w / 500;
      const scaleY = h / 1202.5;

      const slots = (preset.customSlots && preset.customSlots.length > 0)
        ? preset.customSlots
        : [{ id: "default_0", xPct: 5, yPct: 5, widthPct: 90, heightPct: 90, rotation: 0 }];

      const overlayX = preset.overlayX ?? 0;
      const overlayY = preset.overlayY ?? 0;
      const overlayW = preset.overlayW ?? 100;
      const overlayH = preset.overlayH ?? 100;

      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
      const sortedSlots = [...slots].sort((a, b) => collator.compare(a.id, b.id));

      displaySlots = sortedSlots.map(s => {
        const sw = (s.widthPct / 100) * 500 * scaleX;
        const sh = (s.heightPct / 100) * 1202.5 * scaleY;
        const sx = (s.xPct / 100) * 500 * scaleX;
        const sy = (s.yPct / 100) * 1202.5 * scaleY;

        return {
          left: `${(sx / w) * 100}%`,
          top: `${(sy / h) * 100}%`,
          width: `${(sw / w) * 100}%`,
          height: `${(sh / h) * 100}%`,
          rotation: s.rotation || 0,
        };
      });

      if (preset.imageOverlay) {
        const ow = (overlayW / 100) * 500 * scaleX;
        const oh = (overlayH / 100) * 1202.5 * scaleY;
        const ox = (overlayX / 100) * 500 * scaleX;
        const oy = (overlayY / 100) * 1202.5 * scaleY;

        displayOverlays = [{
          left: `${(ox / w) * 100}%`,
          top: `${(oy / h) * 100}%`,
          width: `${(ow / w) * 100}%`,
          height: `${(oh / h) * 100}%`,
          rotation: preset.overlayRotation ?? 0,
        }];
      }
    } else {
      w = 600;
      const padding = 35;
      const photoW = w - padding * 2;
      const photoH = photoW;
      const footerH = 140;
      h = padding + photoH + footerH + padding;

      displaySlots = [{
        left: `${(padding / w) * 100}%`,
        top: `${(padding / h) * 100}%`,
        width: `${(photoW / w) * 100}%`,
        height: `${(photoH / h) * 100}%`,
        rotation: 0,
      }];
      displayOverlays = [];
    }
  }

  const aspectRatio = `${w}/${h}`;

  // Dapatkan CSS filter warna kustom atau standar
  const customFilter = config.customFilters?.find(f => f.id === filterId);
  const filterCss = customFilter ? customFilter.css : (FILTERS_CSS_MAPPING[filterId] || "none");

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-slate-900/30 backdrop-blur-md rounded-[32px] border border-rose-100/40 dark:border-slate-800/80 w-full h-full min-h-[500px] shadow-sm relative overflow-hidden">
      
      {/* Background glow hiasan */}
      <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tr from-rose-300/20 to-amber-200/20 rounded-full blur-3xl" />

      {/* Render fisik strip */}
      <div className="relative overflow-hidden rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.25)] border border-slate-100 dark:border-slate-800/60 transition-all duration-500 scale-95 md:scale-100 z-10 my-6"
        style={{ width: layoutId === "polaroid" ? 220 : (layoutId === "grid" ? 235 : 170), aspectRatio, borderRadius: preset ? "0px" : undefined, ...(preset ? { backgroundColor: "transparent", background: "transparent" } : bgCSS) }}>
        
        {/* Lubang filmstrip jika temanya filmstrip */}
        {style === "filmstrip" && (
          <div className="absolute inset-y-0 left-1 right-1 flex flex-col justify-between pointer-events-none">
            <div className="flex flex-col gap-2.5 pt-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="flex justify-between w-full px-1">
                  <div className="w-1.5 h-2.5 rounded bg-zinc-950" />
                  <div className="w-1.5 h-2.5 rounded bg-zinc-950" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display slots kamera preview */}
        {displaySlots.map((sl, i) => (
          <div key={i} style={{
            position: "absolute",
            left: sl.left, top: sl.top, width: sl.width, height: sl.height,
            transform: `rotate(${sl.rotation}deg)`,
            backgroundColor: isNeon ? "#0b0b0f" : "rgba(0,0,0,0.06)",
            border: isNeon ? "1.5px dashed rgba(0,255,255,0.4)" : "1.5px dashed rgba(0,0,0,0.15)",
            borderRadius: isCustomFrame ? 0 : (style === "pastel" ? 12 : 6),
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 6,
            color: isNeon ? "rgba(0,255,255,0.5)" : "rgba(0,0,0,0.4)",
          }}
          className="transition-all duration-300">
            <div className="w-full h-full flex flex-col items-center justify-center p-3 relative overflow-hidden">
              {/* Filter background mock */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-100/40 via-purple-100/40 to-sky-100/40 opacity-70 mix-blend-multiply" 
                style={{ filter: filterCss }}
              />
              <Camera className="w-6 h-6 opacity-30 text-rose-500 animate-pulse relative z-10" />
              <span className="text-[9px] font-bold opacity-30 relative z-10 uppercase tracking-widest mt-1">Slot {i + 1}</span>
            </div>
          </div>
        ))}

        {/* Custom Image Overlays */}
        {displayOverlays.map((ov, i) => (
          <img key={i} src={preset?.imageOverlay} alt="" draggable={false}
            className="absolute object-fill pointer-events-none z-10"
            style={{
              left: ov.left, top: ov.top,
              width: ov.width, height: ov.height,
              transform: `rotate(${ov.rotation}deg)`
            }}
          />
        ))}

        {/* Teks Event Footer removed as requested */}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SessionSetupScreenProps {
  config: EventConfig;
  sessionNum: number;
  totalSessions: number;
  customerName: string;
  customerPhone: string;
  eventName: string;
  theme: "dark" | "light";
  toggleTheme: () => void;
  selectedPresetId: string;
  selectedFilterId: string;
  onSelectPreset: (preset: PresetTemplate) => void;
  onSelectFilter: (filter: { id: string; name: string; css: string }) => void;
  availableFilters: { id: string; name: string; css: string }[];
  onContinue: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SessionSetupScreen({
  config,
  sessionNum,
  totalSessions,
  customerName,
  customerPhone,
  eventName,
  theme,
  toggleTheme,
  selectedPresetId,
  selectedFilterId,
  onSelectPreset,
  onSelectFilter,
  availableFilters,
  onContinue,
}: SessionSetupScreenProps) {
  const [activeTab, setActiveTab] = useState<"preset" | "filter">("preset");

  const presets = (config.presetTemplates || []).filter((p) => {
    if (!config.allowedPresets || config.allowedPresets.length === 0) {
      return true;
    }
    return config.allowedPresets.includes(p.id);
  });
  const selectedPreset   = presets.find(p => p.id === selectedPresetId);
  const selectedFilter   = availableFilters.find(f => f.id === selectedFilterId);

  const TABS = [
    { id: "preset",  label: "Template",   icon: Sparkles, count: presets.length, disabled: false },
    { id: "filter",  label: "Filter",     icon: Filter,   count: availableFilters.length, disabled: false },
  ] as const;

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 md:p-8 select-none relative overflow-hidden transition-colors duration-300 z-10">
      {/* Visual Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[30%] aspect-square rounded-full bg-amber-400/5 dark:bg-amber-500/3 blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] aspect-square rounded-full bg-pink-400/5 dark:bg-pink-500/3 blur-[80px] pointer-events-none z-0" />
      
      <div className="w-[95%] lg:w-[80%] max-w-7xl h-[95%] lg:h-[85%] bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 rounded-[32px] p-5 md:p-8 flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300 z-10 text-zinc-800 dark:text-[#e3e3e3] font-sans">
        
        {/* ── HEADER ── */}
        <header className="flex items-center justify-between pb-6 border-b border-rose-100/60 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-4">
            {config.logoUrl && (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-rose-100/30 dark:border-slate-800 shrink-0">
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">{config.eventName || eventName || "Glowbooth Event"}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 mt-1">
                <User className="w-3.5 h-3.5 text-rose-400" />
                {customerName} • {customerPhone}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50/80 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-mono font-medium">
              <Camera className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              Sesi {sessionNum} / {totalSessions}
            </div>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-rose-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-600 dark:text-slate-300 cursor-pointer shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-indigo-500" />}
            </button>
          </div>
        </header>

        {/* ── 2-COLUMN BODY ── */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start overflow-y-auto pr-1">
          
          {/* LEFT COLUMN: Selection (Span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            {/* Title & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 shrink-0">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">Pengaturan Sesi</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">Pilih template, filter, dan tata letak untuk jepretan terbaik Anda.</p>
              </div>

              {/* Segmented Control (Tabs) */}
              <div className="inline-flex h-11 items-center justify-center rounded-xl bg-rose-50/50 dark:bg-slate-900/60 p-1 border border-rose-100/40 dark:border-slate-800/50 text-slate-500 dark:text-slate-400 shrink-0 overflow-x-auto shadow-inner">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isDisabled = tab.disabled;
                  return (
                    <button
                      key={tab.id}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setActiveTab(tab.id)}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
                        isDisabled
                          ? "opacity-45 cursor-not-allowed text-slate-400 dark:text-slate-600"
                          : isActive 
                            ? "bg-gradient-to-tr from-rose-400 to-orange-300 text-white shadow-sm scale-102 cursor-pointer" 
                            : "hover:bg-rose-100/30 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                      }`}
                      title={isDisabled ? "Tata letak dikunci oleh template" : undefined}
                    >
                      <Icon className={`w-4.5 h-4.5 mr-2 ${isActive ? "text-white" : "opacity-70"}`} />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-mono leading-none ${
                          isDisabled
                            ? "bg-slate-200/50 dark:bg-slate-800/50 text-slate-400"
                            : isActive ? "bg-white/20 text-white" : "bg-rose-100/50 dark:bg-slate-800 text-rose-500 dark:text-slate-400"
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1">
              
              {/* ── Tab: Template Preset ── */}
              {activeTab === "preset" && (
                <div className="animate-fade-in duration-200">
                  {presets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed border-rose-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/10 backdrop-blur-sm">
                      <Sparkles className="w-7 h-7 text-rose-300 animate-pulse" />
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tidak ada template tersedia</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {presets.map(preset => {
                        const slotCount = preset.customSlots?.length || 4;
                        const isSelected = selectedPresetId === preset.id;

                        return (
                          <button
                            key={preset.id}
                            onClick={() => onSelectPreset(preset)}
                            className={`group relative flex flex-col gap-3 p-4 rounded-[28px] text-left transition-all cursor-pointer bg-white/70 dark:bg-slate-900/60 backdrop-blur-md ${
                              isSelected
                                ? "border-2 border-rose-400 dark:border-rose-400 shadow-md shadow-rose-100/50 dark:shadow-none scale-[1.02]"
                                : "border border-rose-100/60 dark:border-slate-800/80 hover:border-rose-200/80 dark:hover:border-slate-700 hover:bg-rose-50/20 dark:hover:bg-slate-800/30"
                            }`}
                          >
                            <div className="w-full flex justify-center py-2">
                              <SlotPreviewMini preset={preset} slotCount={slotCount} style={config.frameStyle} />
                            </div>
                            <div className="w-full mt-auto">
                              <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-100">{preset.name}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                  {config.frameStyle || "Neon"}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-medium">{slotCount} Shot</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute top-3 right-3 bg-gradient-to-tr from-rose-400 to-orange-300 text-white rounded-full p-0.5 shadow-sm">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: Filter ── */}
              {activeTab === "filter" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in duration-200">
                  {availableFilters.map(filter => {
                    const isSelected = selectedFilterId === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => onSelectFilter(filter)}
                        className={`group relative flex flex-col gap-3 p-4 rounded-[28px] text-left transition-all cursor-pointer bg-white/70 dark:bg-slate-900/60 backdrop-blur-md ${
                          isSelected
                            ? "border-2 border-rose-400 dark:border-rose-400 shadow-md shadow-rose-100/50 dark:shadow-none scale-[1.02]"
                            : "border border-rose-100/60 dark:border-slate-800/80 hover:border-rose-200/80 dark:hover:border-slate-700 hover:bg-rose-50/20 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        <div className="w-full aspect-video rounded-2xl overflow-hidden border border-rose-100/40 dark:border-slate-800/80 mb-1 shadow-sm">
                           <div
                             className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-90"
                             style={{ filter: filter.css === "none" || !filter.css ? undefined : filter.css }}
                           />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{filter.name}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-gradient-to-tr from-rose-400 to-orange-300 text-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Live Interactive Preview (Span 4) */}
          <div className="lg:col-span-4 w-full flex flex-col lg:sticky lg:top-24 z-20">
            <SlotPreviewLarge
              preset={selectedPreset}
              filterId={selectedFilterId}
              config={config}
            />
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="mt-auto pt-6 pb-2 border-t border-rose-100/60 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 hidden sm:block">Terpilih:</span>
            {selectedPreset && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50/80 dark:bg-rose-950/20 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 shadow-sm animate-fade-in">
                <Sparkles className="w-3.5 h-3.5 opacity-80" /> {selectedPreset.name}
              </span>
            )}
            {selectedFilter && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50/80 dark:bg-amber-950/20 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 shadow-sm animate-fade-in">
                <Filter className="w-3.5 h-3.5 opacity-80" /> {selectedFilter.name}
              </span>
            )}
          </div>

          <Button
            onClick={onContinue}
            disabled={!selectedPreset}
            className="w-full sm:w-auto h-12 px-10 rounded-2xl bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 hover:opacity-95 text-white text-sm font-bold tracking-wide shadow-md shadow-rose-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mulai Kamera
            <ArrowRight className="w-4.5 h-4.5 ml-2 text-white" />
          </Button>
        </footer>
      </div>
    </div>
  );
}