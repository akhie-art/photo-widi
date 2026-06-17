"use client";

import React from "react";
import { PlacedSticker } from "./usePhotoboothStore";

interface UseStickerInteractionProps {
  placedStickers: PlacedSticker[];
  onUpdateSticker?: (id: string, fields: Partial<PlacedSticker>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useStickerInteraction({
  placedStickers,
  onUpdateSticker,
  containerRef,
}: UseStickerInteractionProps) {
  const [activeStickerId, setActiveStickerId] = React.useState<string | null>(null);

  // References to keep track of pointer interaction state
  const interactionRef = React.useRef<{
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

  const handlePointerDown = React.useCallback((
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
  }, [placedStickers, containerRef]);

  const handlePointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
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

      onUpdateSticker && onUpdateSticker(inter.stickerId, {
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

      onUpdateSticker && onUpdateSticker(inter.stickerId, {
        rotation: newRotation,
        scalePct: newScalePct,
      });
    }
  }, [onUpdateSticker, containerRef]);

  const handlePointerUp = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    interactionRef.current = null;
  }, []);

  return {
    activeStickerId,
    setActiveStickerId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
