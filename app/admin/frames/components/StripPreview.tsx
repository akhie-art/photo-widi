"use client";

import React from "react";
import { SlotConfig } from "../../../hooks/usePhotoboothStore";

export const getDefaultSlots = (overlay?: string): Array<{ left:string; top:string; width:string; height:string }> => {
  return [
    { left:"5%", width:"90%", top:"2.08%",  height:"28.07%" },
    { left:"5%", width:"90%", top:"31.39%", height:"28.07%" },
    { left:"5%", width:"90%", top:"60.71%", height:"28.07%" },
  ];
};

export default function StripPreview({
  overlay, customSlots, size = "sm",
  overlayX = 0, overlayY = 0, overlayW = 100, overlayH = 100, overlayRotation = 0,
  paperSize = "2R",
}: {
  overlay?: string; customSlots?: SlotConfig[]; size?: "sm" | "md" | "lg";
  overlayX?: number; overlayY?: number; overlayW?: number; overlayH?: number; overlayRotation?: number;
  paperSize?: "2R" | "4R";
}) {
  const widthMap = { sm: 72, md: 130, lg: 195 };
  const W = widthMap[size];
  const textSz = size === "lg" ? 10 : size === "md" ? 7 : 4.5;
  const is2R = paperSize === "2R";

  const displaySlots: Array<{ left:string; top:string; width:string; height:string; rot?: number; num: number }> =
    customSlots && customSlots.length > 0
      ? customSlots.map((s, idx) => {
          const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
          const sorted = [...customSlots].sort((a, b) => collator.compare(a.id, b.id));
          const numIdx = sorted.findIndex(item => item.id === s.id);
          return {
            left: `${s.xPct}%`,
            top: `${s.yPct}%`,
            width: `${s.widthPct}%`,
            height: `${s.heightPct}%`,
            rot: s.rotation,
            num: numIdx !== -1 ? numIdx + 1 : idx + 1,
          };
        })
      : getDefaultSlots(overlay).map((s, idx) => ({ ...s, num: idx + 1 }));

  return (
    <div className="relative overflow-hidden rounded-md shrink-0 select-none shadow-sm border border-zinc-200/50 dark:border-zinc-800/50"
      style={{ width: W, aspectRatio: is2R ? "591/1772" : "1205/1795", backgroundColor: "transparent" }}>

      {displaySlots.slice(0,6).map((sl, idx) => (
        <div key={idx} style={{
          position: "absolute", backgroundColor: "#27272a", border: "1px solid #3f3f46",
          left: sl.left, top: sl.top, width: sl.width, height: sl.height,
          transform: sl.rot ? `rotate(${sl.rot}deg)` : undefined, transformOrigin: "center",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: `${textSz}px`, fontFamily: "monospace", fontWeight: 700,
          color: "#71717a",
        }}>
          {sl.num}
        </div>
      ))}

      {overlay && (
        <img src={overlay} alt="" draggable={false}
          className="absolute pointer-events-none z-20"
          style={{
            left: `${overlayX}%`, top: `${overlayY}%`, width: `${overlayW}%`, height: `${overlayH}%`,
            transform: overlayRotation ? `rotate(${overlayRotation}deg)` : undefined,
            transformOrigin: "center", objectFit: "fill",
          }}
        />
      )}
    </div>
  );
}