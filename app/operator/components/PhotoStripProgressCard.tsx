"use client";

import React, { useRef } from "react";
import { RefreshCw, X, ArrowRight, Maximize2 } from "lucide-react";
import { FrameTemplate, EventConfig, StickerAsset, PlacedSticker } from "../../hooks/usePhotoboothStore";

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
  isCapturing: boolean;
  onRetakeSlot?: (index: number) => void;
  onComplete?: () => void;
  filledPhotosCount: number;
  config: EventConfig;
  placedStickers?: PlacedSticker[];
  onRemoveSticker?: (id: string) => void;
  onUpdateSticker?: (id: string, updates: Partial<PlacedSticker>) => void;
}

const InteractiveSticker = ({
  sticker,
  asset,
  containerRef,
  isCapturing,
  onRemove,
  onUpdate,
}: {
  sticker: PlacedSticker;
  asset: StickerAsset;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isCapturing: boolean;
  onRemove?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<PlacedSticker>) => void;
}) => {
  const isEmoji = !asset.imageUrl.startsWith("data:") && !asset.imageUrl.startsWith("http") && !asset.imageUrl.startsWith("/");

  const handleDragStart = (e: React.PointerEvent) => {
    if (isCapturing || !onUpdate || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startXPct = sticker.xPct;
    const startYPct = sticker.yPct;

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newXPct = startXPct + (deltaX / rect.width) * 100;
      const newYPct = startYPct + (deltaY / rect.height) * 100;

      onUpdate(sticker.id, { xPct: newXPct, yPct: newYPct });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleTransformStart = (e: React.PointerEvent) => {
    if (isCapturing || !onUpdate || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + (sticker.xPct / 100) * rect.width;
    const centerY = rect.top + (sticker.yPct / 100) * rect.height;

    const startX = e.clientX;
    const startY = e.clientY;

    const startAngle = Math.atan2(startY - centerY, startX - centerX);
    const startDist = Math.hypot(startY - centerY, startX - centerX) || 1;

    const initialRotation = sticker.rotation;
    const initialScale = sticker.scalePct;

    const onMove = (moveEvent: PointerEvent) => {
      const currentX = moveEvent.clientX;
      const currentY = moveEvent.clientY;

      const currentAngle = Math.atan2(currentY - centerY, currentX - centerX);
      const currentDist = Math.hypot(currentY - centerY, currentX - centerX);

      let angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
      const newRotation = initialRotation + angleDiff;

      const scaleRatio = currentDist / startDist;
      const newScale = initialScale * scaleRatio;

      onUpdate(sticker.id, {
        rotation: newRotation,
        scalePct: Math.max(10, newScale), 
      });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Komponen Helper untuk merender tuas di sudut agar kode JSX lebih bersih
  const TransformHandle = ({ position, cursor }: { position: string, cursor: string }) => {
    if (isCapturing || !onUpdate) return null;
    return (
      <div
        onPointerDown={handleTransformStart}
        className={`absolute w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-40 border-2 border-white dark:border-[#121214] ${position} ${cursor}`}
        title="Tarik untuk mengubah ukuran dan memutar"
      >
        <Maximize2 className="w-2 h-2" />
      </div>
    );
  };

  return (
    <div
      className={`absolute z-30 group ${!isCapturing ? "cursor-move touch-none" : ""}`}
      style={{
        left: `${sticker.xPct}%`,
        top: `${sticker.yPct}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scalePct / 100})`,
        transformOrigin: "center center",
      }}
      onPointerDown={handleDragStart}
    >
      <div className={`relative ${!isCapturing ? "group-hover:ring-1 ring-blue-500/50 rounded-sm" : ""}`}>
        {isEmoji ? (
          <span className="text-[5cqw] leading-none select-none drop-shadow-md pointer-events-none">
            {asset.imageUrl}
          </span>
        ) : (
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="w-[14cqw] h-[14cqw] object-contain drop-shadow-md pointer-events-none"
            draggable={false}
          />
        )}

        {/* Tombol Hapus: Dipindahkan ke atas-tengah agar tidak bentrok dengan tuas sudut */}
        {!isCapturing && onRemove && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={() => onRemove(sticker.id)}
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-50 cursor-pointer"
            title="Hapus stiker"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}

        {/* 👇 EMPAT TUAS TRANSFORMASI DI SETIAP SUDUT 👇 */}
        {/* Top-Left */}
        <TransformHandle position="-top-1.5 -left-1.5" cursor="cursor-nwse-resize" />
        {/* Top-Right */}
        <TransformHandle position="-top-1.5 -right-1.5" cursor="cursor-nesw-resize" />
        {/* Bottom-Right (Original) */}
        <TransformHandle position="-bottom-1.5 -right-1.5" cursor="cursor-nwse-resize" />
        {/* Bottom-Left */}
        <TransformHandle position="-bottom-1.5 -left-1.5" cursor="cursor-nesw-resize" />

      </div>
    </div>
  );
};

// ... sisa komponen PhotoStripProgressCard tidak berubah ...
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
  isCapturing,
  onRetakeSlot,
  onComplete,
  filledPhotosCount,
  config,
  placedStickers = [],
  onRemoveSticker,
  onUpdateSticker,
}: PhotoStripProgressCardProps) {
  const allDone = filledPhotosCount === layoutsCount && !isCapturing;
  const remaining = layoutsCount - filledPhotosCount;

  return (
    <div className="w-full h-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-between gap-3 sm:gap-4 transition-all relative overflow-hidden">

      <div className="w-full pb-3 border-b border-zinc-100 dark:border-zinc-800/50 select-none flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-1 text-left">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Pratinjau Cetak
          </h3>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
            {remaining > 0 ? `${remaining} foto tersisa` : "Semua foto selesai!"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {Array.from({ length: layoutsCount }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < filledPhotosCount
                  ? "w-4 bg-blue-500"
                  : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="w-full flex-1 flex justify-center items-center relative min-h-0">
        <div
          ref={containerRef}
          className="relative overflow-hidden border border-zinc-200/60 dark:border-zinc-800/60 transition-all duration-300 mx-auto"
          style={{
            aspectRatio: `${currentW} / ${currentH}`,
            width: "100%",
            maxWidth: `min(260px, calc(65vh * (${currentW} / ${currentH})))`,
            containerType: "inline-size",
            borderRadius: isCustomFrame ? "0px" : "12px",
            ...getBackgroundStyle(),
          }}
        >
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
                    backgroundColor: "#0a0a0a",
                    overflow: "hidden",
                    ...getSlotBorderStyle(index),
                  }}
                  className="flex items-center justify-center"
                >
                  <span className="text-[8cqw] font-mono text-zinc-700 font-bold select-none opacity-40">
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ objectFit: "cover" }}
                  />
                ) : null}
                {!isCapturing && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5">
                    <div className="bg-white/15 backdrop-blur-sm rounded-full p-2">
                      <RefreshCw className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}

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

          {placedStickers.map((ps) => {
            const asset = config.customStickers?.find((s) => s.id === ps.stickerId);
            if (!asset) return null;
            
            return (
              <InteractiveSticker
                key={ps.id}
                sticker={ps}
                asset={asset}
                containerRef={containerRef}
                isCapturing={isCapturing}
                onRemove={onRemoveSticker}
                onUpdate={onUpdateSticker}
              />
            );
          })}

        </div>
      </div>

      <div className="w-full flex justify-center min-h-[52px] items-center">
        {allDone ? (
          <button
            onClick={onComplete}
            className="group w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-sm py-3.5 rounded-2xl cursor-pointer transition-all duration-200 shadow-lg shadow-blue-500/25"
          >
            <span>Lihat Hasil</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        ) : (
          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
            <div className="flex gap-1">
              {Array.from({ length: remaining }).map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <span className="text-[10px] font-mono">
              {remaining} foto lagi
            </span>
          </div>
        )}
      </div>
    </div>
  );
}