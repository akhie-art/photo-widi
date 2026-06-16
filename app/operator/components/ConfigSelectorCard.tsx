"use client";

import React from "react";
import { Sparkles, Sliders, Smile, Trash2 } from "lucide-react";
import { EventConfig, PresetTemplate, PlacedSticker } from "../../hooks/usePhotoboothStore";

export interface FilterItem {
  id: string;
  name: string;
  css: string;
}

interface ConfigSelectorCardProps {
  isCapturing: boolean;
  config: EventConfig;
  activeTab: "frame" | "filter" | "sticker";
  setActiveTab: (tab: "frame" | "filter" | "sticker") => void;
  activeFrameId: string;
  activeFilter: FilterItem;
  activeFiltersList: FilterItem[];
  placedStickers: PlacedSticker[];
  onSelectPreset?: (preset: PresetTemplate) => void;
  onSelectFilter?: (filter: FilterItem) => void;
  onAddSticker?: (stickerId: string) => void;
  onClearStickers?: () => void;
}

export default function ConfigSelectorCard({
  isCapturing,
  config,
  activeTab,
  setActiveTab,
  activeFrameId,
  activeFilter,
  activeFiltersList,
  placedStickers,
  onSelectPreset,
  onSelectFilter,
  onAddSticker,
  onClearStickers,
}: ConfigSelectorCardProps) {
  return (
    <div
      className={`w-full lg:w-[320px] bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-800/60 rounded-2xl p-4 flex flex-col gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 shrink-0 ${
        isCapturing ? "opacity-50 pointer-events-none select-none grayscale-[20%]" : ""
      }`}
    >
      {/* Header Section */}
      <div className="w-full pb-3 border-b border-zinc-100 dark:border-zinc-900 select-none flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pengaturan Foto
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isCapturing ? "Terkunci saat pengambilan gambar..." : "Sesuaikan bingkai, filter & stiker."}
        </p>
      </div>

      {/* Segmented Controls (Tabs) */}
      <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl w-full">
        <button
          type="button"
          onClick={() => setActiveTab("frame")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === "frame"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bingkai</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("filter")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === "filter"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sticker")}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === "sticker"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Stiker</span>
          {placedStickers.length > 0 && (
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              {placedStickers.length}
            </span>
          )}
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto max-h-[350px] lg:max-h-[480px] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 pr-2 select-none">
        
        {/* TAB: BINGKAI (FRAME) */}
        {activeTab === "frame" && (
          <div className="animate-fade-in duration-200">
            {config.presetTemplates?.length ? (
              <div className="grid grid-cols-2 gap-3">
                {(config.presetTemplates || [])
                  .filter((item) => item && item.id)
                  .map((item) => {
                    const isActive = activeFrameId === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectPreset && onSelectPreset(item)}
                        className={`group flex flex-col p-2 rounded-2xl transition-all outline-none ${
                          isActive
                            ? "bg-blue-50/50 dark:bg-blue-500/10 ring-2 ring-inset ring-blue-500 shadow-sm"
                            : "bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 hover:ring-zinc-300 dark:hover:ring-zinc-700 hover:shadow-sm"
                        }`}
                      >
                        <div className={`relative w-full aspect-[2/3] rounded-xl overflow-hidden flex items-center justify-center p-2.5 mb-2 transition-colors ${
                           isActive ? "bg-white dark:bg-zinc-900 shadow-sm" : "bg-zinc-50 dark:bg-zinc-900/40"
                        }`}>
                          {item.imageOverlay ? (
                            <img
                              src={item.imageOverlay}
                              alt={item.name}
                              className="w-full h-full object-contain drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400">
                              PRESET
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-center justify-center px-1 pb-1">
                          <span className={`text-xs font-semibold truncate w-full text-center ${isActive ? "text-blue-700 dark:text-blue-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                            {item.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            ) : (
              <EmptyState message="Belum ada bingkai yang tersedia." />
            )}
          </div>
        )}

        {/* TAB: FILTER */}
        {activeTab === "filter" && (
          <div className="animate-fade-in duration-200">
            {activeFiltersList && activeFiltersList.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {activeFiltersList.map((filter) => {
                  const isActive = activeFilter.id === filter.id;
                  
                  let dotStyle = "bg-zinc-400 dark:bg-zinc-500";
                  if (["bw", "noir"].includes(filter.id)) dotStyle = "bg-gradient-to-br from-zinc-800 to-zinc-300";
                  else if (["vintage", "sepia"].includes(filter.id)) dotStyle = "bg-amber-700/80";
                  else if (["neon", "cyber"].includes(filter.id)) dotStyle = "bg-gradient-to-tr from-indigo-500 to-cyan-400";
                  else if (filter.id === "pop") dotStyle = "bg-rose-400";

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => onSelectFilter && onSelectFilter(filter)}
                      className={`group flex items-center gap-3 p-2.5 rounded-2xl transition-all outline-none ${
                        isActive
                          ? "bg-blue-50/50 dark:bg-blue-500/10 ring-2 ring-inset ring-blue-500 shadow-sm"
                          : "bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 hover:ring-zinc-300 dark:hover:ring-zinc-700 hover:shadow-sm"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
                        isActive ? "bg-white dark:bg-zinc-900 shadow-sm" : "bg-zinc-50 dark:bg-zinc-900/50"
                      }`}>
                        <span className={`w-3.5 h-3.5 rounded-full shadow-inner ring-1 ring-inset ring-black/10 dark:ring-white/10 ${dotStyle}`} />
                      </div>
                      <span className={`text-xs font-semibold truncate ${isActive ? "text-blue-700 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"}`}>
                        {filter.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="Belum ada filter yang tersedia." />
            )}
          </div>
        )}

        {/* TAB: STIKER (STICKER) */}
        {activeTab === "sticker" && (
          <div className="animate-fade-in duration-200 flex flex-col gap-3">
            {placedStickers.length > 0 && (
              <div className="flex justify-end px-1">
                <button
                  type="button"
                  onClick={onClearStickers}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1 rounded-md transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus Semua
                </button>
              </div>
            )}
            
            {config.customStickers && config.customStickers.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {config.customStickers.map((sticker) => {
                  const isImg = sticker.imageUrl.startsWith("data:") || sticker.imageUrl.includes("/") || sticker.imageUrl.startsWith("http");
                  
                  return (
                    <button
                      key={sticker.id}
                      type="button"
                      onClick={() => onAddSticker && onAddSticker(sticker.id)}
                      className="group flex flex-col p-2 rounded-2xl bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 hover:ring-zinc-300 dark:hover:ring-zinc-700 transition-all hover:shadow-sm active:scale-[0.96] outline-none"
                    >
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center p-2 mb-1.5 bg-zinc-50 dark:bg-zinc-900/40 transition-colors group-hover:bg-zinc-100 dark:group-hover:bg-zinc-900/60">
                        {isImg ? (
                          <img
                            src={sticker.imageUrl}
                            alt={sticker.name}
                            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-3xl pointer-events-none group-hover:scale-110 transition-transform duration-300">
                            {sticker.imageUrl}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col text-center px-1 pb-1">
                        <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 truncate w-full">
                          {sticker.name}
                        </span>
                        <span className="text-[8px] text-zinc-400 mt-0.5">Klik utk tambah</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="Belum ada stiker untuk tema ini." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-10 px-4 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 border-dashed rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 text-center">
        {message}
      </p>
    </div>
  );
}