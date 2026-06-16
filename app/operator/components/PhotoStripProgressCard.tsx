"use client";

import React from "react";
import { RefreshCw, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlacedSticker, FrameTemplate, EventConfig } from "../../hooks/usePhotoboothStore";

interface PhotoStripProgressCardProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  capturedPhotos: string[];
  layoutsCount: number;
  activeLayout: string;
  isCustomFrame: boolean;
  isFilmFrame: boolean;
  isRedVintage: boolean;
  frameStyle: string;
  currentW: number;
  currentH: number;
  slots: Array<{ left: string; top: string; width: string; height: string }>;
  displayOverlays: Array<{ left: string; top: string; width: string; height: string }>;
  activeTemplate?: FrameTemplate;
  getBackgroundStyle: () => React.CSSProperties;
  getSlotBorderStyle: (index: number) => React.CSSProperties;
  placedStickers: PlacedSticker[];
  activeStickerId: string | null;
  setActiveStickerId: (id: string | null) => void;
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string, type: "drag" | "resize") => void;
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  isCapturing: boolean;
  onRetakeSlot?: (index: number) => void;
  onDeleteSticker?: (id: string) => void;
  onComplete?: () => void;
  filledPhotosCount: number;
  config: EventConfig;
}

export default function PhotoStripProgressCard({
  containerRef,
  capturedPhotos,
  layoutsCount,
  activeLayout,
  isCustomFrame,
  isFilmFrame,
  isRedVintage,
  frameStyle,
  currentW,
  currentH,
  slots,
  displayOverlays,
  activeTemplate,
  getBackgroundStyle,
  getSlotBorderStyle,
  placedStickers,
  activeStickerId,
  setActiveStickerId,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isCapturing,
  onRetakeSlot,
  onDeleteSticker,
  onComplete,
  filledPhotosCount,
  config,
}: PhotoStripProgressCardProps) {
  return (
    <div className="w-full lg:w-[300px] bg-white dark:bg-[#121214] border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-4 flex flex-col items-center justify-between gap-4 shadow-xl transition-colors shrink-0">
      
      {/* Results Header */}
      <div className="w-full text-center pb-2 select-none border-b border-zinc-100 dark:border-zinc-800/50">
        <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono tracking-wider uppercase">
          Hasil Sementara
        </h3>
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
          Klik foto untuk mengulang
        </p>
      </div>

      {/* WYSIWYG Frame Preview Container */}
      <div className="w-full flex-1 flex justify-center items-center py-2 relative">
        <div
          ref={containerRef}
          onClick={(e) => {
            e.stopPropagation();
            setActiveStickerId(null);
          }}
          className="relative overflow-hidden shadow-2xl border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl transition-all duration-300 mx-auto"
          style={{
            aspectRatio: `${currentW} / ${currentH}`,
            width: "100%",
            maxWidth: `min(280px, calc(68vh * (${currentW} / ${currentH})))`,
            containerType: "inline-size",
            borderRadius: isCustomFrame ? "0px" : undefined,
            ...getBackgroundStyle(),
          }}
        >
          {/* Filmstrip sprocket holes */}
          {frameStyle === "filmstrip" && !isFilmFrame && (
            <>
              <div className="absolute left-1.5 top-0 bottom-0 w-[3.5%] flex flex-col justify-around py-[2%] z-10 pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-full aspect-square bg-zinc-950 rounded-sm border border-zinc-900" />
                ))}
              </div>
              <div className="absolute right-1.5 top-0 bottom-0 w-[3.5%] flex flex-col justify-around py-[2%] z-10 pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="w-full aspect-square bg-zinc-950 rounded-sm border border-zinc-900" />
                ))}
              </div>
            </>
          )}

          {/* Photo slots */}
          {slots.map((slot, index) => {
            const isTaken = index < capturedPhotos.length;
            if (!isTaken) {
              return (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    left: slot.left,
                    top: slot.top,
                    width: slot.width,
                    height: slot.height,
                    backgroundColor: "#000002",
                    overflow: "hidden",
                    ...getSlotBorderStyle(index),
                  }}
                  className="flex items-center justify-center relative group"
                >
                  <span className="text-[5cqw] font-mono text-zinc-800 dark:text-zinc-700 font-bold select-none">
                    {index + 1}
                  </span>
                </div>
              );
            }
            return (
              <button
                key={index}
                disabled={isCapturing}
                onClick={() => onRetakeSlot && onRetakeSlot(index)}
                style={{
                  position: "absolute",
                  left: slot.left,
                  top: slot.top,
                  width: slot.width,
                  height: slot.height,
                  overflow: "hidden",
                  ...getSlotBorderStyle(index),
                }}
                className="group relative cursor-pointer disabled:cursor-not-allowed overflow-hidden block p-0 border-0 outline-none"
                title="Klik untuk mengulang foto ini"
              >
                {capturedPhotos[index] ? (
                  <img
                    src={capturedPhotos[index]}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{ objectFit: "cover" }}
                  />
                ) : null}
                {!isCapturing && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1">
                    <RefreshCw className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[7px] xl:text-[8px] font-mono text-white font-bold tracking-wider uppercase bg-black/60 px-1.5 py-0.5 rounded">
                      Ulangi Foto
                    </span>
                  </div>
                )}
              </button>
            );
          })}

          {/* Transparent PNG overlays */}
          {displayOverlays.map((ov, index) => {
            if (!activeTemplate?.imageOverlay) return null;
            return (
              <img
                key={index}
                src={activeTemplate.imageOverlay}
                alt="Bingkai"
                className="absolute z-20 pointer-events-none"
                style={{
                  left: ov.left,
                  top: ov.top,
                  width: ov.width,
                  height: ov.height,
                  objectFit: "fill",
                }}
              />
            );
          })}

          {/* Placed stickers interactive preview layer */}
          {placedStickers.map((placed) => {
            const asset = config.customStickers?.find((s) => s.id === placed.stickerId);
            if (!asset) return null;
            const isImg =
              asset.imageUrl.startsWith("data:") ||
              asset.imageUrl.includes("/") ||
              asset.imageUrl.startsWith("http");
            const isFocused = activeStickerId === placed.id;

            return (
              <div
                key={placed.id}
                style={{
                  position: "absolute",
                  left: `${placed.xPct}%`,
                  top: `${placed.yPct}%`,
                  width: `${placed.scalePct}%`,
                  transform: `translate(-50%, -50%) rotate(${placed.rotation}deg)`,
                  cursor: "move",
                  border: isFocused ? "1.5px dashed #3b82f6" : "none",
                  touchAction: "none",
                  zIndex: 30, // Above frames
                }}
                onPointerDown={(e) => handlePointerDown(e, placed.id, "drag")}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Sticker Content */}
                {isImg ? (
                  <img src={asset.imageUrl} alt={asset.name} className="w-full h-auto pointer-events-none select-none" />
                ) : (
                  <span className="text-[12cqw] block text-center leading-none select-none pointer-events-none">{asset.imageUrl}</span>
                )}

                {/* Resize/Delete Controls */}
                {isFocused && (
                  <>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSticker && onDeleteSticker(placed.id);
                        if (activeStickerId === placed.id) setActiveStickerId(null);
                      }}
                      className="absolute -top-3 -left-3 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-red-600 border border-white z-[40]"
                      title="Hapus Stiker"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    <div
                      onPointerDown={(e) => handlePointerDown(e, placed.id, "resize")}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="absolute -bottom-3 -right-3 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md cursor-se-resize hover:bg-blue-600 border border-white z-[40]"
                      title="Putar & Skala"
                    >
                      <span className="text-[9px] font-bold">↺</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Done / Complete capture button */}
      <div className="w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-center min-h-[48px]">
        {filledPhotosCount === layoutsCount && !isCapturing ? (
          <Button
            onClick={onComplete}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs py-3 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Check className="w-4 h-4" />
            <span>Lihat Hasil</span>
          </Button>
        ) : (
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono text-center flex items-center justify-center">
            Ambil {layoutsCount - filledPhotosCount} foto lagi
          </span>
        )}
      </div>
    </div>
  );
}
