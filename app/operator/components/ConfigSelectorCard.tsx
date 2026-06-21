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
  customization?: any;
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
  customization,
}: ConfigSelectorCardProps) {
  const stickerList: StickerAsset[] = (config.customStickers ?? []).filter((s) => {
    if (!config.allowedStickers || config.allowedStickers.length === 0) {
      return true;
    }
    return config.allowedStickers.includes(s.id);
  });

  const cardStyle = customization?.cardStyle;

  const getCardStyleClasses = (style?: string) => {
    switch (style) {
      case "glass":
        return "w-full h-full bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-saturate-150 p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 transition-all duration-300 rounded-2xl";
      case "frameless":
        return "w-full h-full bg-transparent border-none shadow-none p-2 flex flex-col gap-3 sm:gap-4 transition-all duration-300";
      case "neobrutalist":
        return "w-full h-full bg-[#FFF6E9] dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000000] dark:shadow-[6px_6px_0px_0px_#ffffff] p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 transition-all duration-300 rounded-none";
      case "classic":
      default:
        return "w-full h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 transition-all duration-300 rounded-2xl";
    }
  };

  const getTabsWrapperClasses = (style?: string) => {
    switch (style) {
      case "neobrutalist":
        return "flex items-center bg-white dark:bg-zinc-850 p-1 border-4 border-black dark:border-white w-full rounded-none";
      case "glass":
        return "flex items-center bg-white/10 dark:bg-black/20 backdrop-blur-md p-1 border border-white/10 w-full rounded-xl";
      default:
        return "flex items-center bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl w-full border border-zinc-200/20 dark:border-zinc-800/10";
    }
  };

  const getTabButtonClasses = (style?: string, isActive?: boolean) => {
    if (isActive) {
      switch (style) {
        case "neobrutalist":
          return "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 bg-black text-[#FFF6E9] dark:bg-white dark:text-black font-black text-[10px] sm:text-xs rounded-none transition-all";
        case "glass":
          return "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 bg-white/20 text-white font-extrabold text-[10px] sm:text-xs rounded-lg transition-all border border-white/10";
        default:
          return "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50 text-[10px] sm:text-xs font-semibold rounded-lg transition-all";
      }
    } else {
      switch (style) {
        case "neobrutalist":
          return "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 font-bold text-[10px] sm:text-xs rounded-none transition-all";
        case "glass":
          return "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 text-white/60 hover:text-white hover:bg-white/10 text-[10px] sm:text-xs font-semibold rounded-lg transition-all";
        default:
          return "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-[10px] sm:text-xs font-medium rounded-lg transition-all";
      }
    }
  };

  const getItemButtonClasses = (style?: string, isActive?: boolean) => {
    if (isActive) {
      switch (style) {
        case "neobrutalist":
          return "group flex flex-col p-2 bg-[#FFF6E9] dark:bg-zinc-900 border-4 border-[#ea580c] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] transition-all rounded-none outline-none";
        case "glass":
          return "group flex flex-col p-2 bg-white/25 border border-white/40 ring-2 ring-white/20 shadow-md backdrop-blur-md transition-all rounded-2xl outline-none";
        default:
          return "group flex flex-col p-2 bg-blue-50/50 dark:bg-blue-500/10 ring-2 ring-inset ring-blue-500 shadow-sm transition-all rounded-2xl outline-none";
      }
    } else {
      switch (style) {
        case "neobrutalist":
          return "group flex flex-col p-2 bg-white dark:bg-zinc-800 border-4 border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all w-full rounded-none outline-none";
        case "glass":
          return "group flex flex-col p-2 bg-white/5 border border-white/10 hover:bg-white/15 transition-all rounded-2xl outline-none w-full";
        default:
          return "group flex flex-col p-2 bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 hover:ring-zinc-300 dark:hover:ring-zinc-700 hover:shadow-sm transition-all rounded-2xl outline-none w-full";
      }
    }
  };

  const getFilterButtonClasses = (style?: string, isActive?: boolean) => {
    if (isActive) {
      switch (style) {
        case "neobrutalist":
          return "group flex items-center gap-3 p-2.5 bg-[#FFF6E9] dark:bg-zinc-900 border-4 border-[#ea580c] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] transition-all rounded-none outline-none w-full";
        case "glass":
          return "group flex items-center gap-3 p-2.5 bg-white/25 border border-white/40 shadow-md backdrop-blur-md transition-all rounded-2xl outline-none w-full";
        default:
          return "group flex items-center gap-3 p-2.5 bg-blue-50/50 dark:bg-blue-500/10 ring-2 ring-inset ring-blue-500 shadow-sm transition-all rounded-2xl outline-none w-full";
      }
    } else {
      switch (style) {
        case "neobrutalist":
          return "group flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-800 border-4 border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all w-full rounded-none outline-none";
        case "glass":
          return "group flex items-center gap-3 p-2.5 bg-white/5 border border-white/10 hover:bg-white/15 transition-all rounded-2xl outline-none w-full";
        default:
          return "group flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 hover:ring-zinc-300 dark:hover:ring-zinc-700 hover:shadow-sm transition-all rounded-2xl outline-none w-full";
      }
    }
  };

  const getStickerButtonClasses = (style?: string) => {
    switch (style) {
      case "neobrutalist":
        return "group relative flex flex-col rounded-none overflow-hidden bg-white dark:bg-zinc-800 border-4 border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#ffffff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer aspect-square w-full";
      case "glass":
        return "group relative flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:bg-white/15 hover:shadow-md transition-all cursor-pointer aspect-square w-full";
      default:
        return "group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-zinc-950 ring-1 ring-inset ring-zinc-200/80 dark:ring-zinc-800/80 hover:ring-blue-500/70 dark:hover:ring-blue-500/60 hover:shadow-md transition-all cursor-pointer aspect-square w-full";
    }
  };

  return (
    <div
      className={`${getCardStyleClasses(cardStyle)} ${
        isCapturing ? "opacity-50 pointer-events-none select-none grayscale-[20%]" : ""
      }`}
    >
      {/* Header Section */}
      <div className={`w-full pb-3 border-b ${cardStyle === "neobrutalist" ? "border-black dark:border-white" : "border-zinc-100 dark:border-zinc-900"} select-none flex flex-col gap-1`}>
        <h3 className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight ${cardStyle === "neobrutalist" ? "uppercase font-black" : ""}`}>
          Pengaturan Foto
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {isCapturing ? "Terkunci saat pengambilan gambar..." : "Sesuaikan bingkai, filter & stiker."}
        </p>
      </div>

      {/* Segmented Controls (Tabs) */}
      <div className={getTabsWrapperClasses(cardStyle)}>
        <button
          type="button"
          onClick={() => setActiveTab("frame")}
          className={getTabButtonClasses(cardStyle, activeTab === "frame")}
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>Bingkai</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("filter")}
          className={getTabButtonClasses(cardStyle, activeTab === "filter")}
        >
          <Sliders className="w-3 h-3 shrink-0" />
          <span>Filter</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sticker")}
          className={getTabButtonClasses(cardStyle, activeTab === "sticker")}
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
                  .filter((item) => {
                    if (!item || !item.id) return false;
                    if (!config.allowedPresets || config.allowedPresets.length === 0) {
                      return true;
                    }
                    return config.allowedPresets.includes(item.id);
                  })
                  .map((item) => {
                    const isActive = activeFrameId === item.id;
                    const previewImage = (item as any).thumbnailUrl || (item as any).previewUrl || item.imageOverlay || (item as any).frameUrl || (item as any).backgroundUrl;
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectPreset && onSelectPreset(item)}
                        className={getItemButtonClasses(cardStyle, isActive)}
                      >
                        <div className={`relative w-full h-[160px] rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2 transition-colors ${
                           isActive ? "bg-white dark:bg-zinc-900 shadow-sm" : "bg-zinc-50 dark:bg-zinc-900/40"
                        } ${cardStyle === "neobrutalist" ? "border-2 border-black rounded-none bg-white" : ""}`}>
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
                      className={getFilterButtonClasses(cardStyle, isActive)}
                    >
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
                        isActive ? "bg-white dark:bg-zinc-900 shadow-sm" : "bg-zinc-50 dark:bg-zinc-900/50"
                      } ${cardStyle === "neobrutalist" ? "border-2 border-black rounded-none bg-white" : ""}`}>
                        <span className={`w-3.5 h-3.5 rounded-full shadow-inner ring-1 ring-inset ring-black/10 dark:ring-white/10 ${dotStyle}`} />
                      </div>
                      <span className={`text-xs font-semibold truncate ${isActive ? (cardStyle === "neobrutalist" ? "text-black dark:text-white font-black" : "text-blue-700 dark:text-blue-400") : "text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"}`}>
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
                    title="Tambah Stiker"
                    className={getStickerButtonClasses(cardStyle)}
                  >
                    {/* Sticker preview area */}
                    <div className="w-full h-full flex items-center justify-center p-2 bg-zinc-50/80 dark:bg-zinc-900/40">
                      {sticker.imageUrl.startsWith("data:") || sticker.imageUrl.startsWith("http") || sticker.imageUrl.startsWith("/") ? (
                        <img
                          src={sticker.imageUrl}
                          alt="Stiker"
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
                    <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 active:scale-90 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20 border border-white dark:border-zinc-955 z-10 ${cardStyle === "neobrutalist" ? "border-2 border-black bg-[#ea580c] rounded-none shadow-none" : ""}`}>
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