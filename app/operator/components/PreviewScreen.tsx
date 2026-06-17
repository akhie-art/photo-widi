"use client";

import React, { useState, useRef } from "react";
import { Download, RotateCcw, Smile, X, Printer, ArrowLeft, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EventConfig, PlacedSticker } from "../../hooks/usePhotoboothStore";

interface PreviewScreenProps {
  compiledStripUrl: string | null;
  isRendering: boolean;
  config: EventConfig;
  activeLayout: string;
  handleDownload: () => void;
  handlePrint: () => void;
  onRetake: () => void;
  onReset: () => void;
  onBack: () => void;
  placedStickers: PlacedSticker[];
  setPlacedStickers: React.Dispatch<React.SetStateAction<PlacedSticker[]>>;
  customerName: string;
  customerPhone: string;
  currentSessionNum: number;
  sessionsCount: number;
}

export default function PreviewScreen({
  compiledStripUrl,
  isRendering,
  config,
  activeLayout,
  handleDownload,
  handlePrint,
  onRetake,
  onReset,
  onBack,
  placedStickers,
  setPlacedStickers,
  customerName,
  customerPhone,
  currentSessionNum,
  sessionsCount,
}: PreviewScreenProps) {
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // References to keep track of pointer interaction state
  const interactionRef = useRef<{
    stickerId: string;
    type: "drag" | "resize";
    startX: number;
    startY: number;
    startXPct: number;
    startYPct: number;
    startScalePct: number;
    startRotation: number;
    centerX: number;
    centerY: number;
    startAngle: number;
    startDist: number;
  } | null>(null);

  // Filter allowed stickers
  const allowedStickers = (config.customStickers || []).filter((s) => {
    if (!config.allowedStickers || config.allowedStickers.length === 0) {
      return true;
    }
    return config.allowedStickers.includes(s.id);
  });

  const addSticker = (stickerId: string) => {
    // eslint-disable-next-line react-hooks/purity
    const stickerIdStr = "placed_" + Date.now();
    const newSticker: PlacedSticker = {
      id: stickerIdStr,
      stickerId,
      xPct: 50, // center horizontally
      yPct: 45, // slightly above center
      scalePct: 20, // default 20% width of strip
      rotation: 0,
    };
    setPlacedStickers(prev => [...prev, newSticker]);
    setActiveStickerId(newSticker.id);
  };

  const deleteSticker = (id: string) => {
    setPlacedStickers(prev => prev.filter(s => s.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  const updateSticker = (id: string, fields: Partial<PlacedSticker>) => {
    setPlacedStickers(prev =>
      prev.map(s => (s.id === id ? { ...s, ...fields } : s))
    );
  };

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    id: string,
    type: "drag" | "resize"
  ) => {
    e.stopPropagation();
    setActiveStickerId(id);
    const sticker = placedStickers.find(s => s.id === id);
    if (!sticker || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Center coordinate of sticker in screen pixels
    const centerX = rect.left + (sticker.xPct / 100) * rect.width;
    const centerY = rect.top + (sticker.yPct / 100) * rect.height;

    const startX = e.clientX;
    const startY = e.clientY;

    const dx = startX - centerX;
    const dy = startY - centerY;
    const startAngle = Math.atan2(dy, dx);
    const startDist = Math.hypot(dx, dy);

    interactionRef.current = {
      stickerId: id,
      type,
      startX,
      startY,
      startXPct: sticker.xPct,
      startYPct: sticker.yPct,
      startScalePct: sticker.scalePct,
      startRotation: sticker.rotation,
      centerX,
      centerY,
      startAngle,
      startDist,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactionRef.current || !containerRef.current) return;
    const inter = interactionRef.current;
    const rect = containerRef.current.getBoundingClientRect();

    if (inter.type === "drag") {
      const dx = e.clientX - inter.startX;
      const dy = e.clientY - inter.startY;

      const newXPct = inter.startXPct + (dx / rect.width) * 100;
      const newYPct = inter.startYPct + (dy / rect.height) * 100;

      // Clamp so sticker doesn't leave photo bounds completely
      const clampedXPct = Math.max(0, Math.min(100, newXPct));
      const clampedYPct = Math.max(0, Math.min(100, newYPct));

      updateSticker(inter.stickerId, {
        xPct: clampedXPct,
        yPct: clampedYPct,
      });
    } else if (inter.type === "resize") {
      const dx = e.clientX - inter.centerX;
      const dy = e.clientY - inter.centerY;

      // Rotate
      const angle = Math.atan2(dy, dx);
      const angleDiff = ((angle - inter.startAngle) * 180) / Math.PI;
      const newRotation = (inter.startRotation + angleDiff) % 360;

      // Scale
      const dist = Math.hypot(dx, dy);
      const scaleFactor = dist / inter.startDist;
      const newScalePct = Math.max(5, inter.startScalePct * scaleFactor);

      updateSticker(inter.stickerId, {
        rotation: newRotation,
        scalePct: newScalePct,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    interactionRef.current = null;
  };

  return (
    <div className="h-screen w-screen bg-[#FFFBF7] dark:bg-[#0b0b0c] flex items-center justify-center p-4 md:p-8 select-none relative overflow-hidden transition-colors duration-300">
      {/* Visual Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[30%] aspect-square rounded-full bg-blue-500/5 blur-[80px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] aspect-square rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none z-0" />

      <div className="w-[95%] lg:w-[80%] max-w-7xl h-[95%] lg:h-[85%] bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/40 rounded-[32px] p-5 md:p-8 flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300 z-10 text-zinc-800 dark:text-[#e3e3e3] font-sans">
        {/* Integrated top bar */}
        <div className="flex items-center justify-between w-full border-b border-zinc-200/50 dark:border-zinc-800/40 pb-4 select-none z-10 relative">
          <div className="flex items-center gap-3.5">
            {/* Back button */}
            <button
              onClick={onBack}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {config.logoUrl && (
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800/40 shrink-0">
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                {config.eventName || "Event Virtual"}
              </span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wide mt-1 leading-none">
                Pengunjung: {customerName} ({customerPhone})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100/50 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold px-3.5 py-2 rounded-xl uppercase tracking-wider shadow-sm">
              Sesi {currentSessionNum} dari {sessionsCount}
            </div>
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-center overflow-y-auto pr-1 z-10 relative mt-4">
        
        {/* ── Left Column: Interactive Photo Strip Editor Sandbox ── */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center gap-4">
          
          {isRendering ? (
            <div className="w-[260px] h-[450px] bg-zinc-50/50 dark:bg-zinc-950/45 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 shadow-2xl">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500">Memproses foto strip...</span>
            </div>
          ) : (
            compiledStripUrl && (
              <div className="relative p-4 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-200/50 dark:border-zinc-900/50 rounded-2xl shadow-inner flex items-center justify-center min-h-[380px] w-full max-w-[320px]">
                <div
                  ref={containerRef}
                  onClick={() => setActiveStickerId(null)}
                  style={{ containerType: "inline-size" }}
                  className="relative rounded-xl border border-zinc-200/80 dark:border-zinc-800/85 shadow-2xl overflow-hidden select-none w-fit h-fit mx-auto flex items-center justify-center bg-zinc-100"
                >
                  {/* Gambar dipanggil langsung menggunakan tag img agar proporsinya natural */}
                  <img 
                    src={compiledStripUrl} 
                    alt="Compiled Strip" 
                    className="max-h-[min(55vh,520px)] w-auto object-contain block pointer-events-none" 
                  />
                  
                  {/* Placed Stickers Interactive Layer */}
                  {placedStickers.map(placed => {
                    const asset = config.customStickers?.find(s => s.id === placed.stickerId);
                    if (!asset) return null;
                    const isImg = asset.imageUrl.startsWith("data:") || asset.imageUrl.includes("/") || asset.imageUrl.startsWith("http");
                    const isFocused = activeStickerId === placed.id;

                    const TransformHandle = ({ position, cursor }: { position: string, cursor: string }) => (
                      <div
                        onPointerDown={e => handlePointerDown(e, placed.id, "resize")}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className={`absolute w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-md z-40 border border-white dark:border-[#121214] ${position} ${cursor}`}
                        title="Tarik untuk mengubah ukuran dan memutar"
                      >
                        <Maximize2 className="w-2.5 h-2.5" />
                      </div>
                    );

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
                        }}
                        onPointerDown={e => handlePointerDown(e, placed.id, "drag")}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Sticker Content */}
                        {isImg ? (
                          <img src={asset.imageUrl} alt={asset.name} className="w-full h-auto pointer-events-none select-none" />
                        ) : (
                          <span 
                            style={{ fontSize: `${placed.scalePct * 0.85}cqw` }}
                            className="select-none block text-center leading-none pointer-events-none w-full flex items-center justify-center"
                          >
                            {asset.imageUrl}
                          </span>
                        )}

                        {/* Resize/Delete Controls */}
                        {isFocused && (
                          <>
                            <button
                              type="button"
                              onPointerDown={e => e.stopPropagation()}
                              onClick={() => deleteSticker(placed.id)}
                              className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md cursor-pointer border border-white z-50"
                              title="Hapus Stiker"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            
                            {/* 4 corner handles */}
                            <TransformHandle position="-top-3 -left-3" cursor="cursor-nwse-resize" />
                            <TransformHandle position="-top-3 -right-3" cursor="cursor-nesw-resize" />
                            <TransformHandle position="-bottom-3 -left-3" cursor="cursor-nesw-resize" />
                            <TransformHandle position="-bottom-3 -right-3" cursor="cursor-nwse-resize" />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>

        {/* ── Right Column: Customizer options, Stickers Drawer & Actions ── */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-zinc-950 ring-1 ring-zinc-200/80 dark:ring-zinc-800/50 rounded-3xl p-6 flex flex-col gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden text-left transition-colors">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/35 to-blue-500/0" />
          
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-[#e3e3e3] tracking-tight">Hias Foto Strip</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Tambahkan stiker lucu untuk mempercantik hasil cetakan photobooth Anda.
            </p>
          </div>

          {/* Dynamic Sticker Collection Drawer */}
          <div className="flex flex-col gap-2.5 border-b border-zinc-150 dark:border-zinc-900 pb-5">
            <Label className="text-xs text-zinc-700 dark:text-zinc-350 font-semibold flex items-center gap-1.5 select-none">
              <Smile className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <span>Pilih Stiker Estetik</span>
            </Label>
            
            <div className="grid grid-cols-6 gap-2 bg-zinc-50/50 dark:bg-zinc-900/30 p-3.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/70 max-h-[120px] overflow-y-auto">
              {allowedStickers.map(sticker => {
                const isImg = sticker.imageUrl.startsWith("data:") || sticker.imageUrl.includes("/") || sticker.imageUrl.startsWith("http");
                return (
                  <button
                    key={sticker.id}
                    onClick={() => addSticker(sticker.id)}
                    className="aspect-square bg-white hover:bg-blue-50/20 dark:bg-zinc-900 dark:hover:bg-blue-950/20 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 hover:border-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center select-none shadow-sm"
                    title={sticker.name}
                  >
                    {isImg ? (
                      <img src={sticker.imageUrl} alt={sticker.name} className="max-w-full max-h-full object-contain pointer-events-none" />
                    ) : (
                      <span className="text-xl pointer-events-none">{sticker.imageUrl}</span>
                    )}
                  </button>
                );
              })}
              {allowedStickers.length === 0 && (
                <span className="col-span-full text-[10px] text-zinc-500 font-mono text-center py-2">
                  Tidak ada stiker yang diizinkan untuk tema ini.
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3 mt-1 w-full">
            {/* Retake Session Action */}
            <Button
              variant="outline"
              onClick={onRetake}
              className="w-full bg-white dark:bg-zinc-900 border border-red-200/50 dark:border-red-900/35 text-red-500 hover:bg-red-50/10 dark:hover:bg-red-950/10 hover:text-red-600 text-xs py-3.5 rounded-lg transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Foto Ulang</span>
            </Button>

            {/* Print Action */}
            <Button
              onClick={handlePrint}
              disabled={isRendering || !compiledStripUrl}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3.5 rounded-lg transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.99] border-none cursor-pointer"
            >
              <Printer className="w-4 h-4" strokeWidth={1.5} />
              <span>Cetak Strip</span>
            </Button>

            {/* Save & Advance Action */}
            <Button
              onClick={handleDownload}
              disabled={isRendering || !compiledStripUrl}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-lg transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/15 hover:scale-[1.01] active:scale-[0.99] border-none cursor-pointer"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              <span>Simpan &amp; Lanjut</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}