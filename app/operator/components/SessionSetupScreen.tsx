"use client";

import { useState } from "react";
import {
  Sparkles, Filter, Layers, ArrowRight, CheckCircle2,
  Camera, Sun, Moon, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventConfig, PresetTemplate } from "../../hooks/usePhotoboothStore";

// ─── Style helpers ────────────────────────────────────────────────────────────

const STYLE_BG_CSS: Record<string, React.CSSProperties> = {
  neon:            { background: "linear-gradient(to bottom,#0b0813,#150e29)" },
  "classic-white": { backgroundColor: "#ffffff" },
  "classic-black": { backgroundColor: "#0a0a0a" },
  pastel:          { background: "linear-gradient(135deg,#ffdcd9,#fae8ff,#e0e7ff)" },
  filmstrip:       { backgroundColor: "#18181b" },
};

// ─── Strip Mini Preview ───────────────────────────────────────────────────────

function SlotPreviewMini({ preset, slotCount }: { preset?: PresetTemplate; slotCount: number }) {
  const style = preset?.frameStyle || "neon";
  const bgCSS = STYLE_BG_CSS[style] || { backgroundColor: "#111" };
  const isNeon = style === "neon";

  const autoSlots = Array.from({ length: slotCount }, (_, i) => ({
    top:    `${2 + i * (98 / slotCount)}%`,
    height: `${(98 / slotCount) - 1.5}%`,
    left: "5%", width: "90%",
  }));

  const displaySlots = preset?.customSlots && preset.customSlots.length > 0
    ? preset.customSlots.map(s => ({
        left: `${s.xPct}%`, top: `${s.yPct}%`,
        width: `${s.widthPct}%`, height: `${s.heightPct}%`,
      }))
    : autoSlots;

  return (
    <div className="relative overflow-hidden rounded-md shrink-0 shadow-xl shadow-black/20 border border-zinc-800/30"
      style={{ width: 64, aspectRatio: "500/1202.5", ...bgCSS }}>
      {displaySlots.slice(0, 8).map((sl, i) => (
        <div key={i} style={{
          position: "absolute",
          left: sl.left, top: sl.top, width: sl.width, height: sl.height,
          backgroundColor: isNeon ? "#0a0a0a" : "rgba(0,0,0,0.12)",
          border: isNeon ? "1px solid rgba(0,255,255,0.4)" : "1px solid rgba(0,0,0,0.2)",
          borderRadius: 2, display: "flex", alignItems: "center",
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
  selectedLayoutId: string;
  onSelectPreset: (preset: PresetTemplate) => void;
  onSelectFilter: (filter: { id: string; name: string; css: string }) => void;
  onSelectLayout: (layoutId: string) => void;
  availableFilters: { id: string; name: string; css: string }[];
  availableLayouts: { id: string; name: string; count: number; description: string }[];
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
  selectedLayoutId,
  onSelectPreset,
  onSelectFilter,
  onSelectLayout,
  availableFilters,
  availableLayouts,
  onContinue,
}: SessionSetupScreenProps) {
  const [activeTab, setActiveTab] = useState<"preset" | "filter" | "layout">("preset");

  const presets = config.presetTemplates || [];
  const selectedPreset   = presets.find(p => p.id === selectedPresetId);
  const selectedFilter   = availableFilters.find(f => f.id === selectedFilterId) || availableFilters[0];
  const selectedLayout   = availableLayouts.find(l => l.id === selectedLayoutId) || availableLayouts[0];

  const TABS = [
    { id: "preset",  label: "Template",   icon: Sparkles, count: presets.length },
    { id: "filter",  label: "Filter",     icon: Filter,   count: availableFilters.length },
    { id: "layout",  label: "Tata Letak", icon: Layers,   count: availableLayouts.length },
  ] as const;

  return (
    <div className="min-h-screen bg-white dark:bg-[#121214] text-zinc-950 dark:text-zinc-50 font-sans flex flex-col selection:bg-zinc-200 dark:selection:bg-zinc-800">
      
      {/* ── MAIN CONTAINER ── */}
      <div className="max-w-5xl mx-auto w-full px-6 py-8 flex flex-col flex-1 gap-8">
        
        {/* ── HEADER ── */}
        <header className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-bold text-sm shadow-sm">
              GB
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">{eventName || "Glowbooth Event"}</span>
              <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 mt-1">
                <User className="w-3 h-3" />
                {customerName} • {customerPhone}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400">
              <Camera className="w-3.5 h-3.5" />
              Sesi {sessionNum} / {totalSessions}
            </div>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-center transition-colors text-zinc-600 dark:text-zinc-400"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <main className="flex-1 flex flex-col gap-8">
          
          {/* Title & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 shrink-0">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Pengaturan Sesi</h1>
              <p className="text-sm text-zinc-500 mt-1">Pilih template, filter, dan tata letak untuk jepretan Anda.</p>
            </div>

            {/* Segmented Control (Tabs) */}
            <div className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 p-1 text-zinc-500 dark:text-zinc-400 shrink-0 overflow-x-auto">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                      isActive 
                        ? "bg-white dark:bg-[#121214] text-zinc-950 dark:text-zinc-50 shadow-sm" 
                        : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 opacity-70" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-mono leading-none ${
                        isActive ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-200/70 dark:bg-zinc-800/70"
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
                  <div className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[24px] bg-zinc-50/50 dark:bg-zinc-900/20">
                    <Sparkles className="w-6 h-6 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-500">Tidak ada template tersedia</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {presets.map(preset => {
                      const layout = availableLayouts.find(l => l.id === preset.layoutId);
                      const slotCount = preset.customSlots?.length || layout?.count || 4;
                      const isSelected = selectedPresetId === preset.id;

                      return (
                        <button
                          key={preset.id}
                          onClick={() => onSelectPreset(preset)}
                          className={`group relative flex flex-col gap-3 p-5 rounded-[24px] text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                            isSelected
                              ? "border-2 border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 shadow-sm"
                              : "border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          }`}
                        >
                          <div className="w-full flex justify-center py-4">
                            <SlotPreviewMini preset={preset} slotCount={slotCount} />
                          </div>
                          <div className="w-full mt-auto">
                            <p className="text-lg font-bold truncate text-zinc-900 dark:text-zinc-100">{preset.name}</p>
                            <div className="flex items-center gap-2.5 mt-2">
                              <span className="inline-flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                                {preset.frameStyle || "Neon"}
                              </span>
                              <span className="text-[12px] text-zinc-400 dark:text-zinc-500 font-mono">{slotCount} Shot</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-4 right-4 bg-white dark:bg-zinc-900 rounded-full">
                              <CheckCircle2 className="w-6 h-6 text-zinc-900 dark:text-white" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-fade-in duration-200">
                {availableFilters.map(filter => {
                  const isSelected = selectedFilterId === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => onSelectFilter(filter)}
                      className={`group relative flex flex-col gap-3 p-5 rounded-[24px] text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                        isSelected
                          ? "border-2 border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 shadow-sm"
                          : "border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <div className="w-full aspect-video rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800 mb-2">
                        <div
                          className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-90"
                          style={{ filter: filter.css === "none" || !filter.css ? undefined : filter.css }}
                        />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{filter.name}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-white dark:bg-zinc-900 rounded-full">
                          <CheckCircle2 className="w-6 h-6 text-zinc-900 dark:text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Tab: Layout ── */}
            {activeTab === "layout" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in duration-200">
                {availableLayouts.map(layout => {
                  const isSelected = selectedLayoutId === layout.id;
                  return (
                    <button
                      key={layout.id}
                      onClick={() => onSelectLayout(layout.id)}
                      className={`group relative flex items-start gap-4 p-5 rounded-[24px] text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                        isSelected
                          ? "border-2 border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 shadow-sm"
                          : "border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <div className="flex flex-col gap-1.5 shrink-0 items-center justify-center w-8 pt-1">
                        {Array.from({ length: Math.min(layout.count, 4) }).map((_, i) => (
                          <div key={i} className={`w-full h-2 rounded-sm transition-colors ${isSelected ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                        ))}
                        {layout.count > 4 && <span className="text-[9px] text-zinc-500 font-mono mt-1">+{layout.count - 4}</span>}
                      </div>
                      <div className="flex-1 pr-6">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{layout.name}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">{layout.description}</p>
                        <div className="mt-4">
                          <span className="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium tracking-wide">
                            {layout.count} Shots
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-white dark:bg-zinc-900 rounded-full">
                          <CheckCircle2 className="w-6 h-6 text-zinc-900 dark:text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="mt-auto pt-6 pb-2 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 mr-1 hidden sm:block">Terpilih:</span>
            {selectedPreset && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 text-xs font-medium text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800">
                <Sparkles className="w-3.5 h-3.5 opacity-60" /> {selectedPreset.name}
              </span>
            )}
            {selectedFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 text-xs font-medium text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800">
                <Filter className="w-3.5 h-3.5 opacity-60" /> {selectedFilter.name}
              </span>
            )}
            {selectedLayout && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 text-xs font-medium text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800">
                <Layers className="w-3.5 h-3.5 opacity-60" /> {selectedLayout.name}
              </span>
            )}
          </div>

          <Button
            onClick={onContinue}
            className="w-full sm:w-auto h-11 px-8 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium tracking-wide shadow-sm transition-all active:scale-95"
          >
            Mulai Kamera
            <ArrowRight className="w-4 h-4 ml-2 opacity-80" />
          </Button>
        </footer>
      </div>
    </div>
  );
}