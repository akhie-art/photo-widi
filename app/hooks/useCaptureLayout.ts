"use client";

import React from "react";
import { EventConfig, FrameTemplate } from "./usePhotoboothStore";

// ─── Layout parameters mirroring canvasRenderer.ts ───────────────────────────
const STRIP_W = 500;
const STRIP_PADDING = 25;
const STRIP_PHOTO_W = STRIP_W - STRIP_PADDING * 2; // 450
const STRIP_PHOTO_H = STRIP_PHOTO_W * 0.75;        // 337.5
const STRIP_GAP = 15;
const STRIP_FOOTER_H = 110;

interface UseCaptureLayoutProps {
  config: EventConfig;
  activeFrameId: string;
  activeLayout: string;
  layoutsCount: number;
}

export function useCaptureLayout({
  config,
  activeFrameId,
  activeLayout,
  layoutsCount,
}: UseCaptureLayoutProps) {
  const activeTemplate = React.useMemo(() => {
    return (
      config.presetTemplates?.find((p) => p.id === activeFrameId) ||
      config.presetTemplates?.find((p) => p.id === config.activePresetTemplateId) ||
      config.presetTemplates?.[0]
    );
  }, [config, activeFrameId]);

  const isCustomFrame = React.useMemo(() => {
    return !!activeTemplate;
  }, [activeTemplate]);

  const isFilmFrame = React.useMemo(() => {
    return (
      !isCustomFrame &&
      (activeTemplate?.id === "preset_retro_scrapbook" ||
        !!activeTemplate?.imageOverlay?.includes("film_frame"))
    );
  }, [isCustomFrame, activeTemplate]);

  const isRedVintage = React.useMemo(() => {
    return !isCustomFrame && !!activeTemplate?.imageOverlay?.includes("red_vintage");
  }, [isCustomFrame, activeTemplate]);

  const frameStyle = config.frameStyle || "neon";

  // ─── Canvas dimensions ────────────────────────────────────────────────────────
  const getLayoutDimensions = React.useCallback((): { w: number; h: number } => {
    if (isCustomFrame && activeTemplate) {
      const is2R = activeTemplate.paperSize === "2R" || !activeTemplate.paperSize;
      return { w: is2R ? 591 : 1205, h: is2R ? 1772 : 1795 };
    }

    if (activeLayout === "strip") {
      const h =
        STRIP_PADDING +
        layoutsCount * STRIP_PHOTO_H +
        (layoutsCount - 1) * STRIP_GAP +
        STRIP_FOOTER_H +
        STRIP_PADDING;
      return { w: STRIP_W, h };
    } else if (activeLayout === "grid") {
      const gW = 800, gPad = 40, gGap = 25;
      const gPhW = (gW - gPad * 2 - gGap) / 2;
      const h = gPad + 2 * gPhW + gGap + 130 + gPad;
      return { w: gW, h };
    } else {
      // polaroid
      const pW = 600, pPad = 35;
      const pPhW = pW - pPad * 2;
      const h = pPad + pPhW + 140 + pPad;
      return { w: pW, h };
    }
  }, [activeLayout, activeTemplate, isCustomFrame, layoutsCount]);

  const { w: currentW, h: currentH } = React.useMemo(() => {
    return getLayoutDimensions();
  }, [getLayoutDimensions]);

  // ─── Per-slot position percentages ────────────────────────────────────────────
  const slots = React.useMemo(() => {
    if (isCustomFrame && activeTemplate) {
      const slotsList = (activeTemplate.customSlots && activeTemplate.customSlots.length > 0)
        ? activeTemplate.customSlots
        : [{ id: "default_0", xPct: 5, yPct: 5, widthPct: 90, heightPct: 90, rotation: 0 }];

      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
      const sortedSlots = [...slotsList].sort((a, b) => collator.compare(a.id, b.id));

      return sortedSlots.map(s => ({
        left:   `${s.xPct}%`,
        top:    `${s.yPct}%`,
        width:  `${s.widthPct}%`,
        height: `${s.heightPct}%`,
      }));
    }

    const { w: cW, h: cH } = getLayoutDimensions();

    if (activeLayout === "strip") {
      if (isFilmFrame) {
        return [
          { left: "13%", width: "74%", top: "4%",    height: "29%" },
          { left: "13%", width: "74%", top: "35.5%", height: "29%" },
          { left: "13%", width: "74%", top: "67%",   height: "29%" },
        ];
      }

      if (isRedVintage) {
        const slotTopPx = (13.96 / 100) * cH;
        const slotHPx   = (69.93 / 100) * cH;
        const phH = (slotHPx - (layoutsCount - 1) * STRIP_GAP) / layoutsCount;
        return Array.from({ length: layoutsCount }).map((_, i) => {
          const topPx = slotTopPx + i * (phH + STRIP_GAP);
          return {
            left: "14.84%",
            width: "68.07%",
            top: `${(topPx / cH) * 100}%`,
            height: `${(phH / cH) * 100}%`,
          };
        });
      }

      const isFilmstripStyle =
        frameStyle === "filmstrip" || activeTemplate?.id === "frame_filmstrip";
      const left  = isFilmstripStyle ? "7%"  : "5%";
      const width = isFilmstripStyle ? "86%" : "90%";

      return Array.from({ length: layoutsCount }).map((_, i) => {
        const topPx = STRIP_PADDING + i * (STRIP_PHOTO_H + STRIP_GAP);
        return {
          left,
          width,
          top:    `${(topPx / cH) * 100}%`,
          height: `${(STRIP_PHOTO_H / cH) * 100}%`,
        };
      });
    } else if (activeLayout === "grid") {
      const gW = 800, gPad = 40, gGap = 25;
      const gPhW = (gW - gPad * 2 - gGap) / 2;

      return [
        { x: gPad,         y: gPad },
        { x: gPad + gPhW + gGap, y: gPad },
        { x: gPad,         y: gPad + gPhW + gGap },
        { x: gPad + gPhW + gGap, y: gPad + gPhW + gGap },
      ].map(({ x, y }) => ({
        left:   `${(x / gW)   * 100}%`,
        top:    `${(y / cH)  * 100}%`,
        width:  `${(gPhW / gW) * 100}%`,
        height: `${(gPhW / cH) * 100}%`,
      }));
    } else {
      // polaroid
      const pW = 600, pPad = 35;
      const pPhW = pW - pPad * 2;

      return [
        {
          left:   `${(pPad  / pW)  * 100}%`,
          top:    `${(pPad  / cH) * 100}%`,
          width:  `${(pPhW  / pW)  * 100}%`,
          height: `${(pPhW  / cH) * 100}%`,
        },
      ];
    }
  }, [getLayoutDimensions, activeLayout, activeTemplate, isCustomFrame, layoutsCount, frameStyle, isFilmFrame, isRedVintage]);

  // ─── Overlays calculation ──────────────────────────────────────────────────
  const displayOverlays = React.useMemo(() => {
    if (isCustomFrame && activeTemplate) {
      if (activeTemplate.imageOverlay) {
        const ox = activeTemplate.overlayX ?? 0;
        const oy = activeTemplate.overlayY ?? 0;
        const ow = activeTemplate.overlayW ?? 100;
        const oh = activeTemplate.overlayH ?? 100;
        return [{
          left: `${ox}%`,
          top: `${oy}%`,
          width: `${ow}%`,
          height: `${oh}%`,
        }];
      }
      return [];
    }

    let overlaysList: Array<{ left: string; top: string; width: string; height: string }> = [];

    if (activeTemplate?.imageOverlay) {
      overlaysList = [{
        left: `${activeTemplate.overlayX ?? 0}%`,
        top: `${activeTemplate.overlayY ?? 0}%`,
        width: `${activeTemplate.overlayW ?? 100}%`,
        height: `${activeTemplate.overlayH ?? 100}%`,
      }];
    }

    return overlaysList;
  }, [getLayoutDimensions, activeLayout, activeTemplate, isCustomFrame, layoutsCount]);

  // ─── Style helpers ────────────────────────────────────────────────────────────
  const getBackgroundStyle = React.useCallback((): React.CSSProperties => {
    if (isCustomFrame)                  return { backgroundColor: "transparent", background: "transparent" };
    if (frameStyle === "neon")          return { background: "linear-gradient(to bottom, #0d0a16, #160f2c)" };
    if (frameStyle === "classic-white") return { backgroundColor: "#ffffff" };
    if (frameStyle === "classic-black") return { backgroundColor: "#09090b" };
    if (frameStyle === "pastel")        return { background: "linear-gradient(135deg, #fef2f2, #faf5ff, #eff6ff)" };
    if (frameStyle === "filmstrip")     return { backgroundColor: "#141416" };
    return { backgroundColor: "#18181b" };
  }, [isCustomFrame, frameStyle]);

  const getSlotBorderStyle = React.useCallback((index: number): React.CSSProperties => {
    if (isCustomFrame) {
      return { border: "none", borderRadius: "0", boxShadow: "none" };
    }
    if (frameStyle === "neon") {
      const c = index % 2 === 0 ? "#3b82f6" : "#ec4899";
      return { border: `2px solid ${c}`, boxShadow: `0 0 10px ${c}`, borderRadius: "8px" };
    }
    if (frameStyle === "classic-white") return { border: "1px solid #e4e4e7", borderRadius: "2px" };
    if (frameStyle === "classic-black") return { border: "2px solid #27272a", borderRadius: "2px" };
    if (frameStyle === "pastel")        return { border: "3px solid #ffffff", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" };
    if (frameStyle === "filmstrip")     return { border: "1px solid #27272a" };
    return { border: "1px solid #3f3f46" };
  }, [isCustomFrame, frameStyle]);

  return {
    activeTemplate,
    isCustomFrame,
    isFilmFrame,
    isRedVintage,
    frameStyle,
    currentW,
    currentH,
    slots,
    displayOverlays,
    getBackgroundStyle,
    getSlotBorderStyle,
  };
}
