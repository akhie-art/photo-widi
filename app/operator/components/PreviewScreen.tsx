"use client";

import React, { useState, useRef } from "react";
import { Download, RotateCcw, Smile, X, Printer } from "lucide-react";
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
  const allowedStickers = config.customStickers || [];

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
      const newScalePct = Math.max(5, Math.min(60, inter.startScalePct * scaleFactor));

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
    <div className="max-w-4xl mx-auto w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-xl flex flex-col gap-6 animate-fade-in duration-300 transition-colors">
      {/* Integrated top bar */}
      <div className="flex items-center justify-between w-full border-b border-zinc-200/50 dark:border-zinc-800/40 pb-4 select-none">
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800/40 shrink-0">
              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs tracking-tighter shadow-md shadow-blue-500/10">
              GB
            </div>
          )}
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none">
              Event: {config.eventName || "Event Virtual"}
            </span>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wide mt-1 leading-none">
              Pengunjung: {customerName} ({customerPhone})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
            Sesi {currentSessionNum} dari {sessionsCount}
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-8 items-center justify-center">
      
      {/* ── Left Column: Interactive Photo Strip Editor Sandbox ── */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center gap-3">
        <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
          Sentuh / Tarik stiker untuk mengedit (Drag, Rotasi, Skala)
        </span>
        
        {isRendering ? (
          <div className="w-[260px] h-[480px] bg-white/70 dark:bg-zinc-950/45 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4.5 shadow-2xl">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500">Memproses foto strip...</span>
          </div>
        ) : (
          compiledStripUrl && (
            <div
              ref={containerRef}
              onClick={() => setActiveStickerId(null)}
              className="relative rounded-xl border border-zinc-200 dark:border-zinc-800/80 max-h-[500px] object-contain shadow-2xl overflow-hidden select-none"
              style={{
                aspectRatio: activeLayout === "grid" ? "800/1050" : (activeLayout === "polaroid" ? "600/780" : "500/1202.5"),
                width: activeLayout === "polaroid" ? "220px" : (activeLayout === "grid" ? "235px" : "200px"),
                backgroundImage: `url(${compiledStripUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Placed Stickers Interactive Layer */}
              {placedStickers.map(placed => {
                const asset = config.customStickers?.find(s => s.id === placed.stickerId);
                if (!asset) return null;
                const isImg = asset.imageUrl.startsWith("data:") || asset.imageUrl.includes("/") || asset.imageUrl.startsWith("http");
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
                      <span className="text-3xl select-none block text-center leading-none pointer-events-none">{asset.imageUrl}</span>
                    )}

                    {/* Resize/Delete Controls */}
                    {isFocused && (
                      <>
                        <button
                          type="button"
                          onPointerDown={e => e.stopPropagation()}
                          onClick={() => deleteSticker(placed.id)}
                          className="absolute -top-3 -left-3 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-red-600 border border-white"
                          title="Hapus Stiker"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div
                          onPointerDown={e => handlePointerDown(e, placed.id, "resize")}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          className="absolute -bottom-3 -right-3 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md cursor-se-resize hover:bg-blue-600 border border-white"
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
          )
        )}
      </div>

      {/* ── Right Column: Customizer options, Stickers Drawer & Actions ── */}
      <div className="w-full md:w-1/2 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl relative overflow-hidden text-left transition-colors">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/35 to-blue-500/0" />
        
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-[#e3e3e3] tracking-tight">Hias Foto Strip</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">
            Tambahkan stiker, sesuaikan bingkai kustom, dan unduh hasil cetak.
          </p>
        </div>

        {/* Dynamic Sticker Collection Drawer */}
        <div className="flex flex-col gap-2 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
          <Label className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span>Ketuk Stiker untuk Menambahkan</span>
          </Label>
          
          <div className="grid grid-cols-6 gap-2 bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 max-h-[110px] overflow-y-auto">
            {allowedStickers.map(sticker => {
              const isImg = sticker.imageUrl.startsWith("data:") || sticker.imageUrl.includes("/") || sticker.imageUrl.startsWith("http");
              return (
                <button
                  key={sticker.id}
                  onClick={() => addSticker(sticker.id)}
                  className="aspect-square bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-1.5 hover:border-blue-500/50 hover:bg-blue-50/10 transition-all cursor-pointer flex items-center justify-center select-none"
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
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Button
            onClick={handlePrint}
            disabled={isRendering || !compiledStripUrl}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold py-3.5 rounded-xl transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] border-none cursor-pointer"
          >
            <Printer className="w-4 h-4" strokeWidth={1.5} />
            <span>Cetak Strip</span>
          </Button>

          <Button
            onClick={handleDownload}
            disabled={isRendering || !compiledStripUrl}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] border-none cursor-pointer"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            <span>Simpan &amp; Lanjut</span>
          </Button>

          <Button
            variant="outline"
            onClick={onRetake}
            className="w-full bg-white dark:bg-transparent border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white text-xs py-3.5 rounded-xl transition-all cursor-pointer border shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
            <span>Foto Ulang</span>
          </Button>

          <Button
            variant="ghost"
            onClick={onReset}
            className="w-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 text-xs py-2.5 rounded-xl transition-all cursor-pointer border-none font-semibold"
          >
            Selesai &amp; Sesi Baru
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
