"use client";

import React, { useRef, useState, useEffect } from "react";
import { Sparkles, Heart, Star, Camera, GraduationCap, Award, BookOpen, Smile, Trophy, Trash2 } from "lucide-react";

interface InteractiveWrapperProps {
  id: string;
  scale: number;
  rotate: number;
  x: number;
  y: number;
  onUpdate: (scale: number, rotate: number, x: number, y: number) => void;
  onSelect: () => void;
  selected: boolean;
  enabled: boolean;
  children: React.ReactNode;
  className?: string;
}

function InteractiveWrapper({
  id,
  scale = 1,
  rotate = 0,
  x = 0,
  y = 0,
  onUpdate,
  onSelect,
  selected,
  enabled,
  children,
  className = ""
}: InteractiveWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<"resize" | "rotate" | "move" | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  if (!enabled) {
    return (
      <div 
        style={{ 
          transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`, 
          transformOrigin: "center",
        }}
        className={className}
      >
        {children}
      </div>
    );
  }

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (isDragging === "rotate") {
        const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let angleDeg = Math.round((angleRad * 180) / Math.PI) - 90;
        if (angleDeg < -180) angleDeg += 360;
        if (angleDeg > 180) angleDeg -= 360;
        onUpdate(scale, angleDeg, x, y);
      } else if (isDragging === "resize") {
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const baseDist = Math.max(20, Math.hypot(rect.width / 2, rect.height / 2)) / (scale || 1);
        const newScale = Math.min(2.5, Math.max(0.4, Number((dist / baseDist).toFixed(2))));
        onUpdate(newScale, rotate, x, y);
      } else if (isDragging === "move") {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        let newX = dragStartPos.current.offsetX + dx;
        let newY = dragStartPos.current.offsetY + dy;
        
        const snapThreshold = 8;
        if (Math.abs(newX) < snapThreshold) newX = 0;
        if (Math.abs(newY) < snapThreshold) newY = 0;
        onUpdate(scale, rotate, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      if (isDragging === "rotate") {
        const angleRad = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
        let angleDeg = Math.round((angleRad * 180) / Math.PI) - 90;
        if (angleDeg < -180) angleDeg += 360;
        if (angleDeg > 180) angleDeg -= 360;
        onUpdate(scale, angleDeg, x, y);
      } else if (isDragging === "resize") {
        const dist = Math.hypot(touch.clientX - centerX, touch.clientY - centerY);
        const baseDist = Math.max(20, Math.hypot(rect.width / 2, rect.height / 2)) / (scale || 1);
        const newScale = Math.min(2.5, Math.max(0.4, Number((dist / baseDist).toFixed(2))));
        onUpdate(newScale, rotate, x, y);
      } else if (isDragging === "move") {
        const dx = touch.clientX - dragStartPos.current.x;
        const dy = touch.clientY - dragStartPos.current.y;
        let newX = dragStartPos.current.offsetX + dx;
        let newY = dragStartPos.current.offsetY + dy;
        
        const snapThreshold = 8;
        if (Math.abs(newX) < snapThreshold) newX = 0;
        if (Math.abs(newY) < snapThreshold) newY = 0;
        onUpdate(scale, rotate, newX, newY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(null);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, scale, rotate, x, y, onUpdate]);

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={(e) => {
        if (!enabled) return;
        const target = e.target as HTMLElement;
        if (
          target.closest("button") || 
          target.closest("input") || 
          target.closest("textarea") || 
          target.closest("select") || 
          target.closest(".drag-handle")
        ) {
          return;
        }
        e.stopPropagation();
        onSelect();
        setIsDragging("move");
        dragStartPos.current = {
          x: e.clientX,
          y: e.clientY,
          offsetX: x || 0,
          offsetY: y || 0,
        };
      }}
      onTouchStart={(e) => {
        if (!enabled) return;
        const target = e.target as HTMLElement;
        if (
          target.closest("button") || 
          target.closest("input") || 
          target.closest("textarea") || 
          target.closest("select") || 
          target.closest(".drag-handle")
        ) {
          return;
        }
        e.stopPropagation();
        onSelect();
        if (e.touches.length > 0) {
          setIsDragging("move");
          dragStartPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            offsetX: x || 0,
            offsetY: y || 0,
          };
        }
      }}
      style={{
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`,
        transformOrigin: "center",
        transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`${className} ${(className.includes("absolute") || className.includes("relative")) ? "" : "relative"} select-none ${
        selected 
          ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950 z-35" 
          : "hover:ring-1 hover:ring-blue-400/60 hover:ring-offset-1 dark:hover:ring-offset-zinc-950 cursor-move"
      } transition-shadow duration-150 rounded-2xl flex justify-center`}
    >
      {children}

      {/* Resize & Rotate Handles (only shown when selected) */}
      {selected && (
        <>
          {/* Top Rotation Handler (lollipop handle) */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-40 drag-handle">
            <button
              type="button"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDragging("rotate");
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsDragging("rotate");
              }}
              className="w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-white dark:border-zinc-950 shadow-md flex items-center justify-center cursor-alias text-white transition-colors"
              title="Putar Elemen"
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
              </svg>
            </button>
            <div className="w-[1.5px] h-2 bg-blue-500" />
          </div>

          {/* Bottom-Right Resizing Handler */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDragging("resize");
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsDragging("resize");
            }}
            className="absolute -bottom-2 right-2 w-5.5 h-5.5 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-white dark:border-zinc-950 shadow-md flex items-center justify-center cursor-se-resize text-white z-40 transition-colors drag-handle"
            title="Ubah Ukuran Elemen"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M20 4v16M8 12l8 8" />
            </svg>
          </button>

          {/* Scale/Rotate badge indicator */}
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-zinc-900/90 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm border border-zinc-800 z-40 whitespace-nowrap flex items-center gap-1.5 pointer-events-auto">
            <span>Skala: {scale.toFixed(1)}x • Putar: {rotate}° • Posisi: ({Math.round(x)}, {Math.round(y)})</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(scale, rotate, 0, 0);
              }}
              className="px-1 py-0.25 bg-zinc-800 hover:bg-zinc-700 text-[7px] text-zinc-300 hover:text-white rounded border border-zinc-700 transition-colors drag-handle cursor-pointer"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface TemplateDecorationProps {
  cardStyle?: "classic" | "glass" | "frameless" | "neobrutalist";
  isBuilder?: boolean;
  onUpdateCustomization?: (key: string, value: any) => void;
  selectedComponent?: string | null;
  onSelectComponent?: (id: string | null) => void;
  hideSidePanels?: boolean;
  customization?: {
    groomLabel?: string;
    groomSubLabel?: string;
    groomPhotoUrl?: string;
    brideLabel?: string;
    brideSubLabel?: string;
    bridePhotoUrl?: string;
    
    groomScale?: number;
    groomRotate?: number;
    groomX?: number;
    groomY?: number;
    brideScale?: number;
    brideRotate?: number;
    brideX?: number;
    brideY?: number;
  };
}

export default function TemplateDecoration({
  cardStyle,
  customization,
  isBuilder,
  onUpdateCustomization,
  selectedComponent,
  onSelectComponent,
  hideSidePanels
}: TemplateDecorationProps) {
  const groomLabelRef = useRef<HTMLInputElement>(null);
  const brideLabelRef = useRef<HTMLInputElement>(null);

  if (cardStyle === "neobrutalist") {
    // Sekolah Ceria (Fun & Colorful)
    return (
      <div className={`${isBuilder ? "absolute" : "fixed"} inset-0 pointer-events-none select-none z-0 overflow-hidden`}>
        {/* Playful retro grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-70" />
        
        {/* Bold high-contrast neobrutalist ambient blobs */}
        <div className="absolute top-[5%] left-[5%] w-[35vw] aspect-square rounded-full bg-[#fde047] opacity-20 dark:opacity-10 blur-[80px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[40vw] aspect-square rounded-full bg-[#f43f5e] opacity-15 dark:opacity-10 blur-[90px]" />
        <div className="absolute top-[40%] right-[10%] w-[30vw] aspect-square rounded-full bg-[#06b6d4] opacity-15 dark:opacity-10 blur-[80px]" />

        {/* Fun floating badges/stickers */}
        {!hideSidePanels && (
          <>
            <div className="absolute left-[3%] top-[15%] rotate-[-8deg] border-2 border-black bg-[#ff007f] text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] hidden xl:block">
              CEPRET SERU! 💥
            </div>
            <div className="absolute right-[4%] top-[12%] rotate-[10deg] border-2 border-black bg-[#fde047] text-black px-3 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] hidden xl:block">
              ⚡️ FUN ZONE ⚡️
            </div>
            <div className="absolute left-[4%] bottom-[20%] rotate-[6deg] border-2 border-black bg-[#10b981] text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] hidden xl:block">
              🚀 GOKIL PARAH!
            </div>
          </>
        )}
        
        {/* Floating Playful Illustration Blocks */}
        {!hideSidePanels && (
          <>
            <div className="absolute left-[6%] top-[30%] w-24 h-56 rounded-none bg-[#fffbeb] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg] p-2 flex flex-col gap-2.5 opacity-90 hidden xl:flex">
              <div className="bg-[#ff80ab] border-2 border-black aspect-[4/3] flex items-center justify-center">
                <Star className="w-5 h-5 text-black fill-black" />
              </div>
              <div className="bg-[#80deea] border-2 border-black aspect-[4/3] flex items-center justify-center">
                <Camera className="w-5 h-5 text-black" />
              </div>
              <div className="bg-[#ffe082] border-2 border-black aspect-[4/3] flex items-center justify-center">
                <Smile className="w-5 h-5 text-black fill-black" />
              </div>
              <div className="mt-auto text-center text-[8px] font-black tracking-widest text-black uppercase">CERIA</div>
            </div>

            <div className="absolute right-[6%] top-[25%] w-28 h-32 rounded-none bg-[#fffbeb] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-[8deg] p-2 flex flex-col justify-between opacity-90 hidden xl:flex">
              <div className="bg-[#c5e1a5] border-2 border-black w-full aspect-square flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-black fill-yellow-400" />
              </div>
              <div className="text-center text-[9px] font-black uppercase text-black tracking-wider mt-1">SMILE! 😁</div>
            </div>
          </>
        )}

        {/* Floating Shapes */}
        <div className="absolute left-[20%] top-[8%] animate-bounce opacity-40" style={{ animationDuration: "5s" }}>
          <Star className="w-7 h-7 text-[#ffeb3b] fill-[#ffeb3b] stroke-black stroke-2" />
        </div>
        <div className="absolute right-[22%] bottom-[12%] animate-pulse opacity-40" style={{ animationDuration: "4s" }}>
          <Heart className="w-8 h-8 text-[#ff4081] fill-[#ff4081] stroke-black stroke-2" />
        </div>
        <div className="absolute left-[35%] bottom-[8%] animate-bounce opacity-30" style={{ animationDuration: "6s" }}>
          <Sparkles className="w-6 h-6 text-[#00e676] fill-[#00e676] stroke-black stroke-2" />
        </div>
      </div>
    );
  }

  if (cardStyle === "frameless") {
    // Royal Wedding (Dekorasi Full - Vintage, Floral & Elegant)
    return (
      <div className={`${isBuilder ? "absolute" : "fixed"} inset-0 pointer-events-none select-none z-0 overflow-hidden flex justify-center`}>
        <div className="w-full max-w-5xl h-full relative pointer-events-none">
        {/* Inline CSS for falling petals and custom animation delays */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes petalFall {
            0% {
              transform: translateY(-10%) rotate(0deg);
              opacity: 0;
            }
            15% {
              opacity: 0.8;
            }
            85% {
              opacity: 0.8;
            }
            100% {
              transform: translateY(110%) rotate(360deg);
              opacity: 0;
            }
          }
          @keyframes petalSway {
            0%, 100% {
              transform: translateX(0px) rotate(0deg) rotateY(0deg);
            }
            50% {
              transform: translateX(25px) rotate(20deg) rotateY(180deg);
            }
          }
          .animate-petal-slow-1 {
            animation: petalFall 14s linear infinite, petalSway 5s ease-in-out infinite alternate;
          }
          .animate-petal-slow-2 {
            animation: petalFall 18s linear infinite, petalSway 6s ease-in-out infinite alternate;
          }
          .animate-petal-slow-3 {
            animation: petalFall 12s linear infinite, petalSway 4.5s ease-in-out infinite alternate;
          }
          .animate-petal-slow-4 {
            animation: petalFall 16s linear infinite, petalSway 5.5s ease-in-out infinite alternate;
          }
        `}} />

        {/* Elegant vintage double line borders around the entire screen */}
        <div className="absolute inset-4 sm:inset-6 md:inset-8 border border-amber-800/15 dark:border-amber-600/15 pointer-events-none z-0 rounded-2xl" />
        <div className="absolute inset-5 sm:inset-7 md:inset-9 border-2 border-double border-amber-800/25 dark:border-amber-600/20 pointer-events-none z-0 rounded-2xl" />
        
        {/* Elegant Gold Stage Arch Line-Art in Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <svg viewBox="0 0 800 800" className="w-[85vw] h-[85vh] text-amber-500/10 dark:text-amber-500/5 fill-none stroke-current" strokeWidth="1">
            {/* Outer arch */}
            <path d="M 200,800 L 200,300 C 200,140 600,140 600,300 L 600,800" strokeWidth="1.5" />
            {/* Inner arch */}
            <path d="M 230,800 L 230,320 C 230,170 570,170 570,320 L 570,800" />
            {/* Ornamental patterns in the arch */}
            <path d="M 200,300 Q 215,310 230,320" />
            <path d="M 200,400 Q 215,410 230,420" />
            <path d="M 200,500 Q 215,510 230,520" />
            <path d="M 200,600 Q 215,610 230,620" />
            <path d="M 600,300 Q 585,310 570,320" />
            <path d="M 600,400 Q 585,410 570,420" />
            <path d="M 600,500 Q 585,510 570,520" />
            <path d="M 600,600 Q 585,610 570,620" />
            {/* Arch crown flourish */}
            <path d="M 400,110 C 390,130 410,130 400,110 Z" fill="currentColor" />
            <path d="M 380,120 Q 400,135 420,120" strokeWidth="1.5" />
          </svg>
        </div>
        
        {/* Soft, warm rose and champagne glowing light source */}
        <div className="absolute top-[-5%] left-[-5%] w-[45vw] aspect-square rounded-full bg-gradient-to-tr from-[#fca5a5]/10 to-[#fef3c7]/20 opacity-30 dark:opacity-20 blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[45vw] aspect-square rounded-full bg-gradient-to-tr from-[#fda4af]/10 to-[#fef3c7]/20 opacity-30 dark:opacity-20 blur-[100px]" />
        
        {/* Classical vintage corner frame flourishes using vector SVG lines */}
        <div className="absolute top-7 left-7 z-10 pointer-events-none hidden sm:block">
          <svg viewBox="0 0 100 100" className="w-12 h-12 text-amber-800/25 dark:text-amber-500/20 fill-none stroke-current" strokeWidth="1.5">
            <path d="M 5,5 L 5,65 C 5,45 15,35 30,25 C 45,15 55,5 75,5" />
            <path d="M 5,5 L 50,50 C 40,40 40,40 30,30" />
            <path d="M 5,5 C 15,5 22,12 22,22 C 22,12 30,5 42,5" />
            <path d="M 5,5 C 5,15 12,22 22,22 C 12,22 5,30 5,42" />
            <circle cx="5" cy="5" r="3" className="fill-current" />
            <circle cx="16" cy="16" r="1.5" className="fill-current" />
          </svg>
        </div>
        <div className="absolute top-7 right-7 z-10 pointer-events-none scale-x-[-1] hidden sm:block">
          <svg viewBox="0 0 100 100" className="w-12 h-12 text-amber-800/25 dark:text-amber-500/20 fill-none stroke-current" strokeWidth="1.5">
            <path d="M 5,5 L 5,65 C 5,45 15,35 30,25 C 45,15 55,5 75,5" />
            <path d="M 5,5 L 50,50 C 40,40 40,40 30,30" />
            <path d="M 5,5 C 15,5 22,12 22,22 C 22,12 30,5 42,5" />
            <path d="M 5,5 C 5,15 12,22 22,22 C 12,22 5,30 5,42" />
            <circle cx="5" cy="5" r="3" className="fill-current" />
            <circle cx="16" cy="16" r="1.5" className="fill-current" />
          </svg>
        </div>
        <div className="absolute bottom-7 left-7 z-10 pointer-events-none scale-y-[-1] hidden sm:block">
          <svg viewBox="0 0 100 100" className="w-12 h-12 text-amber-800/25 dark:text-amber-500/20 fill-none stroke-current" strokeWidth="1.5">
            <path d="M 5,5 L 5,65 C 5,45 15,35 30,25 C 45,15 55,5 75,5" />
            <path d="M 5,5 L 50,50 C 40,40 40,40 30,30" />
            <path d="M 5,5 C 15,5 22,12 22,22 C 22,12 30,5 42,5" />
            <path d="M 5,5 C 5,15 12,22 22,22 C 12,22 5,30 5,42" />
            <circle cx="5" cy="5" r="3" className="fill-current" />
            <circle cx="16" cy="16" r="1.5" className="fill-current" />
          </svg>
        </div>
        <div className="absolute bottom-7 right-7 z-10 pointer-events-none scale-x-[-1] scale-y-[-1] hidden sm:block">
          <svg viewBox="0 0 100 100" className="w-12 h-12 text-amber-800/25 dark:text-amber-500/20 fill-none stroke-current" strokeWidth="1.5">
            <path d="M 5,5 L 5,65 C 5,45 15,35 30,25 C 45,15 55,5 75,5" />
            <path d="M 5,5 L 50,50 C 40,40 40,40 30,30" />
            <path d="M 5,5 C 15,5 22,12 22,22 C 22,12 30,5 42,5" />
            <path d="M 5,5 C 5,15 12,22 22,22 C 12,22 5,30 5,42" />
            <circle cx="5" cy="5" r="3" className="fill-current" />
            <circle cx="16" cy="16" r="1.5" className="fill-current" />
          </svg>
        </div>

        {/* Elegant typography watermark in background */}
        <div className="absolute left-[3%] top-[45%] -rotate-90 origin-left text-amber-800/5 dark:text-amber-600/5 font-serif text-4xl tracking-[0.25em] uppercase hidden xl:block select-none">
          Royal Wedding • Love & Eternity
        </div>

        {/* Groom Card (Left Side) - Tilted polaroid/crest style */}
        {!hideSidePanels && (
          <InteractiveWrapper
            id="groomCard"
            scale={customization?.groomScale ?? 1}
            rotate={customization?.groomRotate ?? -7}
            x={customization?.groomX ?? 0}
            y={customization?.groomY ?? 0}
            onUpdate={(s, r, px, py) => {
              onUpdateCustomization?.("groomScale", s);
              onUpdateCustomization?.("groomRotate", r);
              onUpdateCustomization?.("groomX", px);
              onUpdateCustomization?.("groomY", py);
            }}
            onSelect={() => onSelectComponent?.("groomCard")}
            selected={selectedComponent === "groomCard"}
            enabled={!!isBuilder}
            className={`hidden md:flex absolute left-[3%] top-[24%] pointer-events-auto`}
          >
            <div 
              onClick={() => {
                if (isBuilder) groomLabelRef.current?.focus();
              }}
              className={`w-32 h-48 md:w-36 md:h-56 lg:w-40 lg:h-60 rounded-2xl bg-[#fdfbf7]/95 dark:bg-[#161513]/90 border border-amber-700/30 dark:border-amber-500/20 shadow-[0_15px_35px_-10px_rgba(139,92,26,0.15)] p-2.5 md:p-3 lg:p-3.5 flex flex-col gap-2 md:gap-3 lg:gap-3.5 opacity-90 before:absolute before:inset-1 before:rounded-[12px] before:pointer-events-none before:border-2 before:border-double before:border-amber-700/20 dark:before:border-amber-500/15 transition-all hover:scale-[1.04] hover:border-amber-500/40 hover:shadow-[0_20px_45px_-10px_rgba(180,83,9,0.22)] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-auto ${isBuilder ? "flex cursor-pointer hover:border-amber-500/50" : "flex"}`}
            >
              <div className="w-full aspect-[4/5] bg-[#faf7f2] dark:bg-stone-900 border border-amber-700/10 rounded-lg overflow-hidden p-0 flex items-center justify-center relative group">
                {customization?.groomPhotoUrl ? (
                  <img src={customization.groomPhotoUrl} alt="Groom" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                ) : (
                  <div className="p-2 w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-amber-800/60 dark:text-amber-500/40 fill-none stroke-current" strokeWidth="1.5">
                      <path d="M 50,20 C 42,20 40,28 40,32 C 40,36 44,38 50,38 C 56,38 60,36 60,32 C 60,28 58,20 50,20 Z" />
                      <path d="M 40,30 C 40,30 45,22 52,22 C 58,22 60,28 60,28" strokeWidth="2.5" />
                      <path d="M 46,38 L 46,45 L 54,45 L 54,38" />
                      <path d="M 30,55 L 44,45 L 50,58 L 56,45 L 70,55" />
                      <path d="M 46,46 L 54,49 L 54,46 L 46,49 Z" fill="currentColor" />
                      <circle cx="50" cy="47.5" r="2" fill="currentColor" />
                      <path d="M 25,60 C 25,60 30,52 40,50 L 50,58 L 60,50 C 70,52 75,60 75,60 L 75,90 L 25,90 Z" />
                      <path d="M 33,62 L 39,60 L 37,64 Z" fill="currentColor" />
                    </svg>
                  </div>
                )}

                {isBuilder && (
                  <>
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer pointer-events-auto z-10 text-white text-[9px] font-bold">
                      <Camera className="w-4 h-4 text-white" />
                      <span>Upload SVG/Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => onUpdateCustomization?.("groomPhotoUrl", ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {customization?.groomPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => onUpdateCustomization?.("groomPhotoUrl", "")}
                        className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-750 text-white rounded shadow pointer-events-auto z-20 transition-all hover:scale-105"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="text-center flex flex-col gap-0.5 pointer-events-auto">
                {isBuilder ? (
                  <>
                    <input
                      ref={groomLabelRef}
                      value={customization?.groomLabel ?? ""}
                      onChange={(e) => onUpdateCustomization?.("groomLabel", e.target.value)}
                      className="w-full text-center bg-transparent border-b border-dashed border-amber-700/30 text-amber-700 dark:text-amber-500 font-wedding-script text-xl md:text-2xl focus:outline-none focus:border-amber-700 focus:border-solid select-text pointer-events-auto cursor-text py-0.5"
                      placeholder="Mempelai Pria"
                    />
                    <input
                      value={customization?.groomSubLabel ?? ""}
                      onChange={(e) => onUpdateCustomization?.("groomSubLabel", e.target.value)}
                      className="w-full text-center bg-transparent border-b border-dashed border-stone-500/20 text-stone-500 font-serif text-[6px] md:text-[7px] tracking-[0.2em] uppercase focus:outline-none focus:border-stone-500/50 focus:border-solid select-text pointer-events-auto cursor-text py-0.5 mt-0.5"
                      placeholder="The Groom"
                    />
                  </>
                ) : (
                  <>
                    <span className="font-wedding-script text-xl md:text-2xl text-amber-700 dark:text-amber-500 line-clamp-1 truncate select-text pointer-events-auto">
                      {customization?.groomLabel || "Mempelai Pria"}
                    </span>
                    <span className="font-serif text-[6px] md:text-[7px] tracking-[0.2em] uppercase text-stone-500 select-text pointer-events-auto">
                      {customization?.groomSubLabel || "The Groom"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </InteractiveWrapper>
        )}

        {/* Bride Card (Right Side) - Tilted polaroid/crest style */}
        {!hideSidePanels && (
          <InteractiveWrapper
            id="brideCard"
            scale={customization?.brideScale ?? 1}
            rotate={customization?.brideRotate ?? 7}
            x={customization?.brideX ?? 0}
            y={customization?.brideY ?? 0}
            onUpdate={(s, r, px, py) => {
              onUpdateCustomization?.("brideScale", s);
              onUpdateCustomization?.("brideRotate", r);
              onUpdateCustomization?.("brideX", px);
              onUpdateCustomization?.("brideY", py);
            }}
            onSelect={() => onSelectComponent?.("brideCard")}
            selected={selectedComponent === "brideCard"}
            enabled={!!isBuilder}
            className={`hidden md:flex absolute right-[3%] top-[24%] pointer-events-auto`}
          >
            <div 
              onClick={() => {
                if (isBuilder) brideLabelRef.current?.focus();
              }}
              className={`w-32 h-48 md:w-36 md:h-56 lg:w-40 lg:h-60 rounded-2xl bg-[#fdfbf7]/95 dark:bg-[#161513]/90 border border-amber-700/30 dark:border-amber-500/20 shadow-[0_15px_35px_-10px_rgba(139,92,26,0.15)] p-2.5 md:p-3 lg:p-3.5 flex flex-col gap-2 md:gap-3 lg:gap-3.5 opacity-90 before:absolute before:inset-1 before:rounded-[12px] before:pointer-events-none before:border-2 before:border-double before:border-amber-700/20 dark:before:border-amber-500/15 transition-all hover:scale-[1.04] hover:border-amber-500/40 hover:shadow-[0_20px_45px_-10px_rgba(180,83,9,0.22)] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-auto ${isBuilder ? "flex cursor-pointer hover:border-amber-500/50" : "flex"}`}
            >
              <div className="w-full aspect-[4/5] bg-[#faf7f2] dark:bg-stone-900 border border-amber-700/10 rounded-lg overflow-hidden p-0 flex items-center justify-center relative group">
                {customization?.bridePhotoUrl ? (
                  <img src={customization.bridePhotoUrl} alt="Bride" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                ) : (
                  <div className="p-2 w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-amber-800/60 dark:text-amber-500/40 fill-none stroke-current" strokeWidth="1.5">
                      <path d="M 50,15 C 38,15 32,25 32,45 C 32,70 38,85 38,85 C 38,85 45,70 50,70 C 55,70 62,85 62,85 C 62,85 68,70 68,45 C 68,25 62,15 50,15 Z" strokeWidth="1" strokeDasharray="2 2" />
                      <path d="M 50,22 C 44,22 42,28 42,34 C 42,38 45,40 50,40 C 55,40 58,38 58,34 C 58,28 56,22 50,22 Z" />
                      <path d="M 42,30 C 45,24 55,24 58,30" strokeWidth="2" />
                      <path d="M 47,40 Q 50,45 53,40" />
                      <path d="M 45,43 Q 50,48 55,43" strokeWidth="1" />
                      <circle cx="50" cy="46" r="1.5" fill="currentColor" />
                      <path d="M 35,55 C 35,55 42,50 50,54 C 58,50 65,55 65,55 M 35,55 L 35,90 L 65,90 L 65,55" />
                      <path d="M 30,55 C 30,55 33,52 35,55" />
                      <path d="M 70,55 C 70,55 67,52 65,55" />
                      <circle cx="50" cy="72" r="8" className="fill-[#faf7f2] dark:fill-stone-900" />
                      <path d="M 45,70 Q 50,65 55,70 Q 50,75 45,70" />
                      <path d="M 47,73 Q 50,68 53,73" />
                    </svg>
                  </div>
                )}

                {isBuilder && (
                  <>
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer pointer-events-auto z-10 text-white text-[9px] font-bold">
                      <Camera className="w-4 h-4 text-white" />
                      <span>Upload SVG/Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => onUpdateCustomization?.("bridePhotoUrl", ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {customization?.bridePhotoUrl && (
                      <button
                        type="button"
                        onClick={() => onUpdateCustomization?.("bridePhotoUrl", "")}
                        className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-750 text-white rounded shadow pointer-events-auto z-20 transition-all hover:scale-105"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="text-center flex flex-col gap-0.5 pointer-events-auto">
                {isBuilder ? (
                  <>
                    <input
                      ref={brideLabelRef}
                      value={customization?.brideLabel ?? ""}
                      onChange={(e) => onUpdateCustomization?.("brideLabel", e.target.value)}
                      className="w-full text-center bg-transparent border-b border-dashed border-amber-700/30 text-amber-700 dark:text-amber-500 font-wedding-script text-xl md:text-2xl focus:outline-none focus:border-amber-700 focus:border-solid select-text pointer-events-auto cursor-text py-0.5"
                      placeholder="Mempelai Wanita"
                    />
                    <input
                      value={customization?.brideSubLabel ?? ""}
                      onChange={(e) => onUpdateCustomization?.("brideSubLabel", e.target.value)}
                      className="w-full text-center bg-transparent border-b border-dashed border-stone-500/20 text-stone-500 font-serif text-[6px] md:text-[7px] tracking-[0.2em] uppercase focus:outline-none focus:border-stone-500/50 focus:border-solid select-text pointer-events-auto cursor-text py-0.5 mt-0.5"
                      placeholder="The Bride"
                    />
                  </>
                ) : (
                  <>
                    <span className="font-wedding-script text-xl md:text-2xl text-amber-700 dark:text-amber-500 line-clamp-1 truncate select-text pointer-events-auto">
                      {customization?.brideLabel || "Mempelai Wanita"}
                    </span>
                    <span className="font-serif text-[6px] md:text-[7px] tracking-[0.2em] uppercase text-stone-500 select-text pointer-events-auto">
                      {customization?.brideSubLabel || "The Bride"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </InteractiveWrapper>
        )}

        {/* Floating Rose Petals / Sparks - DYNAMIC ANIMATIONS */}
        <div className="absolute left-[15%] top-[-5%] animate-petal-slow-1 pointer-events-none select-none z-0" style={{ animationDelay: "0s" }}>
          <span className="text-2xl drop-shadow-sm">🌸</span>
        </div>
        <div className="absolute left-[38%] top-[-5%] animate-petal-slow-2 pointer-events-none select-none z-0" style={{ animationDelay: "3.5s" }}>
          <span className="text-xl drop-shadow-sm">🌹</span>
        </div>
        <div className="absolute left-[58%] top-[-5%] animate-petal-slow-3 pointer-events-none select-none z-0" style={{ animationDelay: "1.2s" }}>
          <span className="text-2xl drop-shadow-sm">🌸</span>
        </div>
        <div className="absolute left-[78%] top-[-5%] animate-petal-slow-4 pointer-events-none select-none z-0" style={{ animationDelay: "6s" }}>
          <span className="text-xl drop-shadow-sm">🌹</span>
        </div>
        <div className="absolute left-[92%] top-[-5%] animate-petal-slow-1 pointer-events-none select-none z-0" style={{ animationDelay: "2.2s" }}>
          <span className="text-lg drop-shadow-sm">🌸</span>
        </div>
        <div className="absolute left-[26%] top-[-5%] animate-petal-slow-3 pointer-events-none select-none z-0" style={{ animationDelay: "7.8s" }}>
          <span className="text-lg drop-shadow-sm">🌹</span>
        </div>

        {/* Delicate floating sparks */}
        <div className="absolute left-[18%] top-[14%] animate-pulse opacity-40" style={{ animationDuration: "7s" }}>
          <Heart className="w-5 h-5 text-rose-350 fill-rose-200 dark:fill-transparent" />
        </div>
        <div className="absolute right-[15%] top-[18%] animate-bounce opacity-30" style={{ animationDuration: "5s" }}>
          <Sparkles className="w-5 h-5 text-amber-450" />
        </div>
        <div className="absolute right-[25%] bottom-[15%] animate-pulse opacity-45" style={{ animationDuration: "6s" }}>
          <Heart className="w-4 h-4 text-pink-405 fill-pink-300 dark:fill-transparent" />
        </div>
        </div>
      </div>
    );
  }

  if (cardStyle === "glass") {
    // Wisuda Akbar (Classic & Elegant - Glassmorphism, Gold, Navy & Royal)
    return (
      <div className={`${isBuilder ? "absolute" : "fixed"} inset-0 pointer-events-none select-none z-0 overflow-hidden flex justify-center`}>
        <div className="w-full max-w-5xl h-full relative pointer-events-none">
          {/* Inline CSS for floating bokeh, gold dust and animation delays */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes bokehFloat {
              0% {
                transform: translateY(110vh) translateX(0) scale(1);
                opacity: 0;
              }
              10% {
                opacity: 0.6;
              }
              90% {
                opacity: 0.6;
              }
              100% {
                transform: translateY(-10vh) translateX(50px) scale(1.2);
                opacity: 0;
              }
            }
            @keyframes rotateCap {
              0%, 100% {
                transform: rotate(-10deg) translateY(0);
              }
              50% {
                transform: rotate(-5deg) translateY(-8px);
              }
            }
            @keyframes rotateTrophy {
              0%, 100% {
                transform: rotate(12deg) translateY(0);
              }
              50% {
                transform: rotate(7deg) translateY(-8px);
              }
            }
            @keyframes goldGlow {
              0%, 100% {
                filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.2));
              }
              50% {
                filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.45));
              }
            }
            .animate-bokeh-1 {
              animation: bokehFloat 22s linear infinite;
            }
            .animate-bokeh-2 {
              animation: bokehFloat 28s linear infinite;
            }
            .animate-bokeh-3 {
              animation: bokehFloat 18s linear infinite;
            }
            .animate-bokeh-4 {
              animation: bokehFloat 25s linear infinite;
            }
            .animate-cap-float {
              animation: rotateCap 6s ease-in-out infinite;
            }
            .animate-trophy-float {
              animation: rotateTrophy 6.5s ease-in-out infinite;
            }
            .animate-gold-glow {
              animation: goldGlow 4s ease-in-out infinite;
            }
          `}} />

          {/* Elegant double line borders around the entire screen */}
          <div className="absolute inset-4 sm:inset-6 md:inset-8 border border-white/5 pointer-events-none z-0 rounded-2xl" />
          <div className="absolute inset-5 sm:inset-7 md:inset-9 border-2 border-double border-amber-500/10 dark:border-amber-500/5 pointer-events-none z-0 rounded-2xl" />

          {/* Soft elegant vertical alignment line */}
          <div className="absolute top-0 bottom-0 left-[50%] w-[1px] bg-gradient-to-b from-transparent via-amber-500/10 to-transparent pointer-events-none z-0 hidden lg:block" />

          {/* Royal navy and gold glowing ambient lights */}
          <div className="absolute top-[-10%] left-[20%] w-[55vw] aspect-square rounded-full bg-blue-900/15 dark:bg-indigo-950/15 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[50%] w-[45vw] aspect-square rounded-full bg-amber-500/10 dark:bg-amber-600/5 blur-[100px]" />

          {/* Concentric Sunburst / Certificate Flourish Pattern in Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.05]">
            <svg viewBox="0 0 800 800" className="w-[85vw] h-[85vh] text-amber-500 fill-none stroke-current" strokeWidth="0.75">
              <circle cx="400" cy="400" r="100" />
              <circle cx="400" cy="400" r="180" strokeDasharray="4 4" />
              <circle cx="400" cy="400" r="260" />
              <circle cx="400" cy="400" r="340" strokeDasharray="6 6" />
              {/* Sunburst Rays */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 360) / 24;
                return (
                  <line
                    key={i}
                    x1="400"
                    y1="400"
                    x2={400 + 380 * Math.cos((angle * Math.PI) / 180)}
                    y2={400 + 380 * Math.sin((angle * Math.PI) / 180)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Glowing floating Bokeh Circles (Classic & Elegant) */}
          <div className="absolute left-[8%] w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/10 to-yellow-400/5 backdrop-blur-[2px] border border-amber-500/10 animate-bokeh-1 pointer-events-none" style={{ left: '8%', animationDelay: '0s' }} />
          <div className="absolute right-[12%] w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600/10 to-indigo-500/5 backdrop-blur-[2px] border border-white/5 animate-bokeh-2 pointer-events-none" style={{ right: '12%', animationDelay: '4s' }} />
          <div className="absolute left-[35%] w-12 h-12 rounded-full border border-amber-500/20 animate-bokeh-3 pointer-events-none" style={{ left: '35%', animationDelay: '8s' }} />
          <div className="absolute right-[28%] w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500/5 to-amber-600/10 backdrop-blur-[3px] border border-white/10 animate-bokeh-4 pointer-events-none" style={{ right: '28%', animationDelay: '2s' }} />

          {/* Premium Academic/Elegant Floating Illustrations - LEFT SIDE */}
          {!hideSidePanels && (
            <div className="absolute left-[3%] top-[24%] w-24 h-56 rounded-2xl bg-white/[0.03] dark:bg-black/30 border border-white/15 dark:border-zinc-800/40 shadow-2xl backdrop-blur-md p-3.5 flex flex-col items-center justify-between opacity-90 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-3 hover:rotate-[-5deg] hover:border-amber-500/30 hover:shadow-[0_25px_50px_-12px_rgba(245,158,11,0.15)] group animate-cap-float before:absolute before:inset-1.5 before:rounded-xl before:border before:border-amber-500/10 before:pointer-events-none hidden xl:flex">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <GraduationCap className="w-7 h-7 text-amber-500 animate-gold-glow" />
              </div>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <Award className="w-7 h-7 text-amber-500 animate-gold-glow" />
              </div>
              <div className="text-center font-serif text-[7px] tracking-[0.25em] text-amber-500 font-bold uppercase select-none mt-1">GRADUATION</div>
            </div>
          )}

          {/* Premium Academic/Elegant Floating Illustrations - RIGHT SIDE */}
          {!hideSidePanels && (
            <div className="absolute right-[3%] top-[22%] w-26 h-40 rounded-2xl bg-white/[0.03] dark:bg-black/30 border border-white/15 dark:border-zinc-800/40 shadow-2xl backdrop-blur-md p-3.5 flex flex-col justify-between opacity-90 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-3 hover:rotate-[5deg] hover:border-amber-500/30 hover:shadow-[0_25px_50px_-12px_rgba(245,158,11,0.15)] group animate-trophy-float before:absolute before:inset-1.5 before:rounded-xl before:border before:border-amber-500/10 before:pointer-events-none hidden xl:flex">
              <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <Trophy className="w-8 h-8 text-amber-500 animate-gold-glow" />
              </div>
              <div className="text-center text-[8px] font-serif font-bold text-amber-500 uppercase tracking-[0.18em] mt-2 select-none">CLASS OF 2026</div>
            </div>
          )}

          {/* Academic icon decorations */}
          <div className="absolute left-[15%] top-[10%] animate-bounce opacity-40" style={{ animationDuration: "7s" }}>
            <GraduationCap className="w-5 h-5 text-amber-500/80" />
          </div>
          <div className="absolute right-[18%] top-[12%] animate-pulse opacity-45" style={{ animationDuration: "5s" }}>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          </div>
          <div className="absolute right-[22%] bottom-[16%] animate-bounce opacity-35" style={{ animationDuration: "8s" }}>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="absolute left-[25%] bottom-[12%] animate-pulse opacity-30" style={{ animationDuration: "6s" }}>
            <BookOpen className="w-4 h-4 text-zinc-400" />
          </div>
        </div>
      </div>
    );
  }

  // Classic/Default Theme
  return (
    <div className={`${isBuilder ? "absolute" : "fixed"} inset-0 pointer-events-none select-none z-0 overflow-hidden`}>
      {/* Dynamic ambient background flows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-amber-400/8 dark:bg-amber-500/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-pink-400/8 dark:bg-pink-500/5 blur-[120px]" />
      
      {/* Floating illustrations */}
      {!hideSidePanels && (
        <>
          <div className="absolute left-[5%] top-[20%] w-24 h-56 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rotate-[-12deg] p-2 flex flex-col gap-1.5 opacity-20 dark:opacity-10 hidden xl:flex">
            <div className="bg-zinc-50 dark:bg-zinc-955 aspect-[4/3] rounded-md flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-400 fill-amber-350 dark:fill-transparent" />
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-955 aspect-[4/3] rounded-md flex items-center justify-center">
              <Camera className="w-4 h-4 text-blue-400" />
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-955 aspect-[4/3] rounded-md flex items-center justify-center">
              <Heart className="w-4 h-4 text-pink-400 fill-pink-350 dark:fill-transparent" />
            </div>
            <div className="mt-auto text-center text-[6px] font-mono tracking-widest text-zinc-450 dark:text-zinc-500 uppercase font-bold">MEMORIES</div>
          </div>

          <div className="absolute right-[5%] top-[25%] w-28 h-32 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl rotate-[15deg] p-2 flex flex-col opacity-20 dark:opacity-10 hidden xl:flex">
            <div className="bg-zinc-50 dark:bg-zinc-955 w-full aspect-square rounded-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mt-auto text-center text-[8px] font-serif italic text-zinc-400 dark:text-zinc-500">smile!</div>
          </div>
        </>
      )}

      <div className="absolute left-[15%] top-[12%] opacity-25 dark:opacity-10 animate-bounce" style={{ animationDuration: '4s' }}>
        <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-150 dark:fill-transparent" />
      </div>
      <div className="absolute left-[4%] top-[55%] opacity-15 dark:opacity-5 animate-pulse" style={{ animationDuration: '3s' }}>
        <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
      </div>
    </div>
  );
}
