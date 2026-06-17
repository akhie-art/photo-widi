"use client";

import React from "react";
import { Sparkles, Sliders, Smile, Plus } from "lucide-react";
import { EventConfig, PresetTemplate, StickerAsset } from "../../hooks/usePhotoboothStore";

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
  onSelectPreset?: (preset: PresetTemplate) => void;
  onSelectFilter?: (filter: FilterItem) => void;
  onAddSticker?: (sticker: StickerAsset) => void;
}

export default function ConfigSelectorCard({
  isCapturing,
  config,
  activeTab,
  setActiveTab,
  activeFrameId,
  activeFilter,
  activeFiltersList,
  onSelectPreset,
  onSelectFilter,
  onAddSticker,
}: ConfigSelectorCardProps) {
  const stickerList: StickerAsset[] = config.customStickers ?? [];

  return (
    <div
      className={`w-full h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 transition-all duration-300 ${
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
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
            activeTab === "frame"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>Bingkai</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("filter")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
            activeTab === "filter"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Sliders className="w-3 h-3 shrink-0" />
          <span>Filter</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sticker")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${
            activeTab === "sticker"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Smile className="w-3 h-3 shrink-0" />
          <span>Stiker</span>
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto max-h-[240px] md:max-h-[min(30vh,350px)] lg:max-h-[min(48vh,480px)] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 pr-1 select-none">
        
        {/* TAB: BINGKAI (FRAME) */}
        {activeTab === "frame" && (
          <div className="animate-fade-in duration-200">
            {config.presetTemplates?.length ? (
              <div className="grid grid-cols-2 portrait:sm:grid-cols-3 portrait:md:grid-cols-4 portrait:lg:grid-cols-6 portrait:xl:grid-cols-8 landscape:grid-cols-2 gap-3">
                {(config.presetTemplates || [])
                  .filter((item) => item && item.id)
                  .map((item) => {
                    const isActive = activeFrameId === item.id;
                    const previewImage = (item as any).thumbnailUrl || (item as any).previewUrl || item.imageOverlay || (item as any).frameUrl || (item as any).backgroundUrl;
                    
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
                        <div className={`relative w-full h-[160px] rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2 transition-colors ${
                           isActive ? "bg-white dark:bg-zinc-900 shadow-sm" : "bg-zinc-50 dark:bg-zinc-900/40"
                        }`}>
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt={item.name}
                              className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400">
                              PRESET
                            </span>
                          )}
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
              <div className="grid grid-cols-2 portrait:sm:grid-cols-3 portrait:md:grid-cols-4 portrait:lg:grid-cols-6 portrait:xl:grid-cols-8 landscape:grid-cols-2 gap-3">
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

        {/* TAB: STIKER */}
        {activeTab === "sticker" && (
          <div className="animate-fade-in duration-200">
            {stickerList.length > 0 ? (
              <div className="grid grid-cols-3 landscape:grid-cols-3 portrait:sm:grid-cols-4 gap-2">
                {stickerList.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => onAddSticker && onAddSticker(sticker)}
                    title={`Tambah ${sticker.name}`}
                    className="group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 hover:ring-blue-500/70 dark:hover:ring-blue-500/60 hover:shadow-md transition-all cursor-pointer aspect-square"
                  >
                    {/* Sticker preview area */}
                    <div className="w-full h-full flex items-center justify-center p-2 bg-zinc-50/80 dark:bg-zinc-900/40">
                      {sticker.imageUrl.startsWith("data:") || sticker.imageUrl.startsWith("http") || sticker.imageUrl.startsWith("/") ? (
                        <img
                          src={sticker.imageUrl}
                          alt={sticker.name}
                          className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                          draggable={false}
                        />
                      ) : (
                        <span className="text-3xl leading-none select-none group-hover:scale-105 transition-transform duration-200">
                          {sticker.imageUrl}
                        </span>
                      )}
                    </div>

                    {/* Plus Button Overlay */}
                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 active:scale-90 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20 border border-white dark:border-zinc-950 z-10">
                      <Plus className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Smile className="w-6 h-6 text-zinc-400 mb-1" />}
                message="Belum ada stiker. Tambahkan stiker di Admin Panel."
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-10 px-4 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 border-dashed rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
      {icon}
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 text-center">
        {message}
      </p>
    </div>
  );
}