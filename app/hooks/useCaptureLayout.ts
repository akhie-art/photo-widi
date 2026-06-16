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
    return !!(
      activeTemplate &&
      (!activeTemplate.customSlots || activeTemplate.customSlots.length <= 1)
    );
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
    const overlayH = activeTemplate?.overlayH ?? 100;
    if (activeLayout === "strip") {
      const isDesignedForTile = isCustomFrame && overlayH <= 50;
      if (isCustomFrame && isDesignedForTile) {
        const tileH = (overlayH / 100) * 1202.5;
        const h = STRIP_PADDING + layoutsCount * tileH + STRIP_PADDING;
        return { w: STRIP_W, h };
      }
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
      if (isCustomFrame) {
        const scaleX = gPhW / 500;
        const tileH = (overlayH / 100) * 1202.5 * scaleX;
        const h = gPad + 2 * tileH + gGap + gPad;
        return { w: gW, h };
      }
      const h = gPad + 2 * gPhW + gGap + 130 + gPad;
      return { w: gW, h };
    } else {
      // polaroid
      const pW = 600, pPad = 35;
      const pPhW = pW - pPad * 2;
      if (isCustomFrame) {
        const scaleX = pPhW / 500;
        const tileH = (overlayH / 100) * 1202.5 * scaleX;
        const h = pPad + tileH + pPad;
        return { w: pW, h };
      }
      const h = pPad + pPhW + 140 + pPad;
      return { w: pW, h };
    }
  }, [activeLayout, activeTemplate, isCustomFrame, layoutsCount]);

  const { w: currentW, h: currentH } = React.useMemo(() => {
    return getLayoutDimensions();
  }, [getLayoutDimensions]);

  // ─── Per-slot position percentages ────────────────────────────────────────────
  const slots = React.useMemo(() => {
    const { w: cW, h: cH } = getLayoutDimensions();
    const overlayH = activeTemplate?.overlayH ?? 100;

    if (activeLayout === "strip") {
      const isDesignedForTile = isCustomFrame && overlayH <= 50;

      if (isCustomFrame) {
        const slot = (activeTemplate?.customSlots && activeTemplate.customSlots.length > 0)
          ? activeTemplate.customSlots[0]
          : { xPct: 5, yPct: 5, widthPct: 90, heightPct: 90, rotation: 0 };

        const scaleX = cW / 500;

        return Array.from({ length: layoutsCount }).map((_, i) => {
          let sy = 0, sh = 0;
          if (isDesignedForTile) {
            const scaleY = scaleX;
            const tileH = (overlayH / 100) * 1202.5 * scaleY;
            const tileY = STRIP_PADDING + i * tileH;
            sh = (slot.heightPct / 100) * 1202.5 * scaleY;
            sy = tileY + (slot.yPct / 100) * 1202.5 * scaleY;
          } else {
            const th = cH / layoutsCount;
            const scaleY = th / 1202.5;
            sh = (slot.heightPct / 100) * 1202.5 * scaleY;
            sy = (i * th) + (slot.yPct / 100) * 1202.5 * scaleY;
          }
          const sw = (slot.widthPct / 100) * 500 * scaleX;
          const sx = (slot.xPct / 100) * 500 * scaleX;

          return {
            left: `${(sx / cW) * 100}%`,
            top: `${(sy / cH) * 100}%`,
            width: `${(sw / cW) * 100}%`,
            height: `${(sh / cH) * 100}%`,
          };
        });
      }

      if (activeTemplate?.customSlots && activeTemplate.customSlots.length > 1) {
        return activeTemplate.customSlots.map(s => ({
          left:   `${s.xPct}%`,
          top:    `${s.yPct}%`,
          width:  `${s.widthPct}%`,
          height: `${s.heightPct}%`,
        }));
      }

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

      if (isCustomFrame) {
        const slot = (activeTemplate?.customSlots && activeTemplate.customSlots.length > 0)
          ? activeTemplate.customSlots[0]
          : { xPct: 5, yPct: 5, widthPct: 90, heightPct: 90, rotation: 0 };

        const cols = 2;
        const scaleX = gPhW / 500;
        const scaleY = scaleX;

        const tileH = (overlayH / 100) * 1202.5 * scaleY;
        const tw = gPhW;

        return Array.from({ length: layoutsCount }).map((_, i) => {
          const gridCol = i % cols;
          const gridRow = Math.floor(i / cols);

          const sw = (slot.widthPct / 100) * 500 * scaleX;
          const sh = (slot.heightPct / 100) * 1202.5 * scaleY;

          const sx = gPad + gridCol * (tw + gGap) + (slot.xPct / 100) * 500 * scaleX;
          const sy = gPad + gridRow * (tileH + gGap) + (slot.yPct / 100) * 1202.5 * scaleY;

          return {
            left: `${(sx / cW) * 100}%`,
            top: `${(sy / cH) * 100}%`,
            width: `${(sw / cW) * 100}%`,
            height: `${(sh / cH) * 100}%`,
          };
        });
      }

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

      if (isCustomFrame) {
        const slot = (activeTemplate?.customSlots && activeTemplate.customSlots.length > 0)
          ? activeTemplate.customSlots[0]
          : { xPct: 5, yPct: 5, widthPct: 90, heightPct: 90, rotation: 0 };

        const scaleX = pPhW / 500;
        const scaleY = scaleX;

        const sw = (slot.widthPct / 100) * 500 * scaleX;
        const sh = (slot.heightPct / 100) * 1202.5 * scaleY;

        const sx = pPad + (slot.xPct / 100) * 500 * scaleX;
        const sy = pPad + (slot.yPct / 100) * 1202.5 * scaleY;

        return [{
          left: `${(sx / cW) * 100}%`,
          top: `${(sy / cH) * 100}%`,
          width: `${(sw / cW) * 100}%`,
          height: `${(sh / cH) * 100}%`,
        }];
      }

      return [
        {
          left:   `${(pPad  / pW)  * 100}%`,
          top:    `${(pPad  / cH) * 100}%`,
          width:  `${(pPhW  / pW)  * 100}%`,
          height: `${(pPhW  / cH) * 100}%`,
        },
      ];
    }
  }, [getLayoutDimensions, activeLayout, activeTemplate, isCustomFrame, layoutsCount, frameStyle]);

  // ─── Overlays calculation ──────────────────────────────────────────────────
  const displayOverlays = React.useMemo(() => {
    const { w: cW, h: cH } = getLayoutDimensions();
    const overlayH = activeTemplate?.overlayH ?? 100;
    const overlayX = activeTemplate?.overlayX ?? 0;
    const overlayY = activeTemplate?.overlayY ?? 0;
    const overlayW = activeTemplate?.overlayW ?? 100;

    let overlaysList: Array<{ left: string; top: string; width: string; height: string }> = [];

    if (isCustomFrame && activeTemplate?.imageOverlay) {
      if (activeLayout === "strip") {
        const isDesignedForTile = overlayH <= 50;
        const scaleX = cW / 500; // 1

        overlaysList = Array.from({ length: layoutsCount }).map((_, i) => {
          let oy = 0, oh = 0;
          if (isDesignedForTile) {
            const scaleY = scaleX;
            const tileH = (overlayH / 100) * 1202.5 * scaleY;
            const tileY = STRIP_PADDING + i * tileH;
            oh = tileH;
            oy = tileY + (overlayY / 100) * 1202.5 * scaleY;
          } else {
            const th = cH / layoutsCount;
            const scaleY = th / 1202.5;
            oh = (overlayH / 100) * 1202.5 * scaleY;
            oy = (i * th) + (overlayY / 100) * 1202.5 * scaleY;
          }
          const ow = (overlayW / 100) * 500 * scaleX;
          const ox = (overlayX / 100) * 500 * scaleX;

          return {
            left: `${(ox / cW) * 100}%`,
            top: `${(oy / cH) * 100}%`,
            width: `${(ow / cW) * 100}%`,
            height: `${(oh / cH) * 100}%`,
          };
        });
      } else if (activeLayout === "grid") {
        const gW = 800, gPad = 40, gGap = 25;
        const gPhW = (gW - gPad * 2 - gGap) / 2;

        const cols = 2;
        const scaleX = gPhW / 500;
        const scaleY = scaleX;

        const tileH = (overlayH / 100) * 1202.5 * scaleY;
        const tw = gPhW;

        overlaysList = Array.from({ length: layoutsCount }).map((_, i) => {
          const gridCol = i % cols;
          const gridRow = Math.floor(i / cols);

          const ow = (overlayW / 100) * 500 * scaleX;
          const oh = tileH;

          const ox = gPad + gridCol * (tw + gGap) + (overlayX / 100) * 500 * scaleX;
          const oy = gPad + gridRow * (tileH + gGap) + (overlayY / 100) * 1202.5 * scaleY;
          return {
            left: `${(ox / cW) * 100}%`,
            top: `${(oy / cH) * 100}%`,
            width: `${(ow / cW) * 100}%`,
            height: `${(oh / cH) * 100}%`,
          };
        });
      } else {
        // polaroid
        const pW = 600, pPad = 35;
        const pPhW = pW - pPad * 2;

        const scaleX = pPhW / 500;
        const scaleY = scaleX;

        const tileH = (overlayH / 100) * 1202.5 * scaleY;

        const ow = (overlayW / 100) * 500 * scaleX;
        const oh = tileH;

        const ox = pPad + (overlayX / 100) * 500 * scaleX;
        const oy = pPad + (overlayY / 100) * 1202.5 * scaleY;

        overlaysList = [{
          left: `${(ox / cW) * 100}%`,
          top: `${(oy / cH) * 100}%`,
          width: `${(ow / cW) * 100}%`,
          height: `${(oh / cH) * 100}%`,
        }];
      }
    } else if (activeTemplate?.imageOverlay) {
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
    if (frameStyle === "neon")          return { background: "linear-gradient(to bottom, #0d0a16, #160f2c)" };
    if (frameStyle === "classic-white") return { backgroundColor: "#ffffff" };
    if (frameStyle === "classic-black") return { backgroundColor: "#09090b" };
    if (frameStyle === "pastel")        return { background: "linear-gradient(135deg, #fef2f2, #faf5ff, #eff6ff)" };
    if (frameStyle === "filmstrip")     return { backgroundColor: "#141416" };
    return { backgroundColor: "#18181b" };
  }, [frameStyle]);

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
