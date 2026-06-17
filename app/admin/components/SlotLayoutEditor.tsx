"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Plus, Minus, RotateCcw, Trash2, Move, GripVertical, Image as ImageIcon, Square, ZoomIn, ZoomOut, ChevronUp, ChevronDown, Undo2, Redo2, Layers } from "lucide-react";
import { SlotConfig } from "../../hooks/usePhotoboothStore";

// ─── helpers ─────────────────────────────────────────────────────────────────

export function generateDefaultSlots(count: number): SlotConfig[] {
  const gapPct    = 1.5;
  const leftPct   = 5;
  const wPct      = 90;
  const topStart  = 2;
  const footerPct = 10;
  const available = 100 - topStart - footerPct - (count - 1) * gapPct;
  const slotH     = Math.max(4, available / count);

  return Array.from({ length: count }, (_, i) => ({
    id:        `slot_${Date.now()}_${i}`,
    xPct:      leftPct,
    yPct:      topStart + i * (slotH + gapPct),
    widthPct:  wPct,
    heightPct: slotH,
    rotation:  0,
  }));
}

// CM dimensions conversion helper (moved inside component for dynamic paperSize support)

function isPointInSlot(px: number, py: number, slot: SlotConfig): boolean {
  const cx = slot.xPct + slot.widthPct / 2;
  const cy = slot.yPct + slot.heightPct / 2;
  const rad = -slot.rotation * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const dx = px - cx;
  const dy = py - cy;
  
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;
  
  return Math.abs(rx) <= slot.widthPct / 2 && Math.abs(ry) <= slot.heightPct / 2;
}

// ─── types ───────────────────────────────────────────────────────────────────

type DragState =
  | null
  | { op: "move";   slotId: string; startX: number; startY: number; origX: number; origY: number; moved: boolean }
  | { op: "resize"; slotId: string; handle: string; startX: number; startY: number; orig: SlotConfig }
  | { op: "rotate"; slotId: string; cx: number; cy: number; startAngle: number; origRot: number }
  | { op: "moveOverlay"; startX: number; startY: number; origX: number; origY: number; moved: boolean }
  | { op: "rotateOverlay"; cx: number; cy: number; startAngle: number; origRot: number }
  | { op: "resizeOverlay"; handle: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number };

type HistoryState = {
  slots: SlotConfig[];
  overlayX: number;
  overlayY: number;
  overlayW: number;
  overlayH: number;
  overlayRotation: number;
  overlayZIndex: number;
};

// ─── constants ────────────────────────────────────────────────────────────────

const HANDLE        = 11;
const ROT_R         = 9;
const ROT_OFF       = 32;
const MOVE_THRESHOLD = 4;

interface Props {
  slots:      SlotConfig[];
  onChange:   (slots: SlotConfig[]) => void;
  overlay?:   string;
  overlayX:   number;
  overlayY:   number;
  overlayW:   number;
  overlayH:   number;
  overlayRotation: number;
  onChangeOverlay: (x: number, y: number, w: number, h: number, rot: number) => void;
  overlayZIndex?: number;
  onChangeOverlayZIndex?: (z: number) => void;
  maxSlots?:  number;
  paperSize?: "2R" | "4R";
}

// ─── component ───────────────────────────────────────────────────────────────

export default function SlotLayoutEditor({
  slots,
  onChange,
  overlay,
  overlayX,
  overlayY,
  overlayW,
  overlayH,
  overlayRotation,
  onChangeOverlay,
  overlayZIndex,
  onChangeOverlayZIndex,
  maxSlots,
  paperSize = "2R",
}: Props) {
  const is2R = paperSize === "2R";
  const STRIP_W_CM = is2R ? 5.08 : 10.16;
  const STRIP_H_CM = 15.24;

  const pctToCmW = (pct: number) => (pct / 100) * STRIP_W_CM;
  const pctToCmH = (pct: number) => (pct / 100) * STRIP_H_CM;

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const drag         = useRef<DragState>(null);
  const [activeId, setActiveId] = useState<string | null>(slots[0]?.id ?? null);
  const [editTarget, setEditTarget] = useState<"slots" | "overlay">("slots");
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});
  
  const [zoom, setZoom] = useState(paperSize === "2R" ? 1.5 : 1);
  const [layersOpen, setLayersOpen] = useState(true);
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const touchStartDist = useRef<number>(0);
  const touchStartZoom = useRef<number>(1);

  // Wheel & Touch Pinch-to-Zoom gesture handler
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomFactor = 0.01;
        setZoom((currentZoom) => {
          const nextZoom = currentZoom - e.deltaY * zoomFactor;
          return Math.max(0.2, Math.min(3, nextZoom));
        });
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchStartDist.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        touchStartZoom.current = zoomRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist.current > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const factor = dist / touchStartDist.current;
        setZoom(() => {
          const nextZoom = touchStartZoom.current * factor;
          return Math.max(0.2, Math.min(3, nextZoom));
        });
      }
    };

    const handleTouchEnd = () => {
      touchStartDist.current = 0;
    };

    scrollContainer.addEventListener("wheel", handleWheel, { passive: false });
    scrollContainer.addEventListener("touchstart", handleTouchStart, { passive: false });
    scrollContainer.addEventListener("touchmove", handleTouchMove, { passive: false });
    scrollContainer.addEventListener("touchend", handleTouchEnd);
    scrollContainer.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel);
      scrollContainer.removeEventListener("touchstart", handleTouchStart);
      scrollContainer.removeEventListener("touchmove", handleTouchMove);
      scrollContainer.removeEventListener("touchend", handleTouchEnd);
      scrollContainer.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);
  const [localOverlayZ, setLocalOverlayZ] = useState(slots.length);
  const activeOverlayZ = overlayZIndex ?? localOverlayZ;

  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // ── History / Undo Redo States ──
  const history = useRef<HistoryState[]>([]);
  const historyIndex = useRef<number>(-1);
  const latestState = useRef<HistoryState>({ slots, overlayX, overlayY, overlayW, overlayH, overlayRotation, overlayZIndex: activeOverlayZ });
  const pendingHistoryState = useRef<HistoryState | null>(null);
  
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Mengurutkan slot berdasarkan urutan ID secara kronologis untuk memisahkan urutan visual (Z-Index) dari nomor asli kamera
  const sortedSlotsForNumbering = useMemo(() => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    return [...slots].sort((a, b) => collator.compare(a.id, b.id));
  }, [slots]);

  // Capture current state to latestState continuously
  useEffect(() => {
    latestState.current = { slots, overlayX, overlayY, overlayW, overlayH, overlayRotation, overlayZIndex: activeOverlayZ };
  }, [slots, overlayX, overlayY, overlayW, overlayH, overlayRotation, activeOverlayZ]);

  // Initial history snapshot
  useEffect(() => {
    if (history.current.length === 0 && slots.length > 0) {
      history.current = [{ slots, overlayX, overlayY, overlayW, overlayH, overlayRotation, overlayZIndex: activeOverlayZ }];
      historyIndex.current = 0;
    }
  }, [slots, overlayX, overlayY, overlayW, overlayH, overlayRotation, activeOverlayZ]);

  const saveSnapshot = useCallback((newState?: HistoryState) => {
    const stateToSave = newState || latestState.current;
    const nextIdx = historyIndex.current + 1;
    history.current = history.current.slice(0, nextIdx);
    history.current.push(stateToSave);
    historyIndex.current = nextIdx;
    setCanUndo(historyIndex.current > 0);
    setCanRedo(historyIndex.current < history.current.length - 1);
  }, []);

  const applyHistoryState = useCallback((state: HistoryState) => {
    onChange(state.slots);
    if (overlay) {
      onChangeOverlay(state.overlayX, state.overlayY, state.overlayW, state.overlayH, state.overlayRotation);
      if (onChangeOverlayZIndex) onChangeOverlayZIndex(state.overlayZIndex);
    }
    setLocalOverlayZ(state.overlayZIndex);
    if (activeId && !state.slots.find(s => s.id === activeId)) {
      setActiveId(state.slots[0]?.id ?? null);
    }
  }, [onChange, onChangeOverlay, onChangeOverlayZIndex, overlay, activeId]);

  const handleUndo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current -= 1;
      applyHistoryState(history.current[historyIndex.current]);
      setCanUndo(historyIndex.current > 0);
      setCanRedo(true);
    }
  }, [applyHistoryState]);

  const handleRedo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current += 1;
      applyHistoryState(history.current[historyIndex.current]);
      setCanUndo(true);
      setCanRedo(historyIndex.current < history.current.length - 1);
    }
  }, [applyHistoryState]);

  // Keyboard Shortcuts (Ctrl+Z / Cmd+Z)
  const canUndoRef = useRef(canUndo);
  const canRedoRef = useRef(canRedo);
  canUndoRef.current = canUndo;
  canRedoRef.current = canRedo;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pastikan pengguna tidak sedang mengetik di input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedoRef.current) handleRedo();
        } else {
          if (canUndoRef.current) handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedoRef.current) handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const updateOverlayZ = (newZ: number) => {
    setLocalOverlayZ(newZ);
    onChangeOverlayZIndex?.(newZ);
  };

  // ── Layer Management ──
  type LayerItem = { type: 'slot' | 'overlay'; id: string; data?: SlotConfig; origIndex?: number };

  const layerStack: LayerItem[] = slots.map((s, i) => ({ type: 'slot', id: s.id, data: s, origIndex: i }));
  if (overlay) {
    layerStack.splice(activeOverlayZ, 0, { type: 'overlay', id: 'overlay_layer' });
  }

  const uiLayers = [...layerStack].reverse();

  // Mempertahankan penomoran slot secara konstan berdasarkan urutan ID aslinya, bukan urutan lapisannya
  const getSlotNumber = (id: string) => {
    const idx = sortedSlotsForNumbering.findIndex(l => l.id === id);
    return idx !== -1 ? idx + 1 : 1;
  };

  const getSnapAndGuides = (
    x: number, y: number, w: number, h: number, excludeId: string | null
  ) => {
    const threshold = 1.2;
    let snapX = x; let snapY = y;
    let guideX: number | undefined = undefined; let guideY: number | undefined = undefined;
    const others = slots.filter(s => s.id !== excludeId);
    const targetsX = [{ value: 5 }, { value: 50 }, { value: 95 }];
    others.forEach(o => {
      targetsX.push({ value: o.xPct });
      targetsX.push({ value: o.xPct + o.widthPct / 2 });
      targetsX.push({ value: o.xPct + o.widthPct });
    });
    const itemLeft = x; const itemCenterX = x + w / 2; const itemRight = x + w;

    for (const t of targetsX) {
      if (Math.abs(itemLeft - t.value) < threshold) { snapX = t.value; guideX = t.value; break; }
    }
    if (guideX === undefined) {
      for (const t of targetsX) {
        if (Math.abs(itemCenterX - t.value) < threshold) { snapX = t.value - w / 2; guideX = t.value; break; }
      }
    }
    if (guideX === undefined) {
      for (const t of targetsX) {
        if (Math.abs(itemRight - t.value) < threshold) { snapX = t.value - w; guideX = t.value; break; }
      }
    }

    const targetsY = [{ value: 50 }];
    others.forEach(o => {
      targetsY.push({ value: o.yPct });
      targetsY.push({ value: o.yPct + o.heightPct / 2 });
      targetsY.push({ value: o.yPct + o.heightPct });
    });
    const itemTop = y; const itemCenterY = y + h / 2; const itemBottom = y + h;

    for (const t of targetsY) {
      if (Math.abs(itemTop - t.value) < threshold) { snapY = t.value; guideY = t.value; break; }
    }
    if (guideY === undefined) {
      for (const t of targetsY) {
        if (Math.abs(itemCenterY - t.value) < threshold) { snapY = t.value - h / 2; guideY = t.value; break; }
      }
    }
    if (guideY === undefined) {
      for (const t of targetsY) {
        if (Math.abs(itemBottom - t.value) < threshold) { snapY = t.value - h; guideY = t.value; break; }
      }
    }

    return { snapX, snapY, guideX, guideY };
  };

  useEffect(() => {
    if (activeId && !slots.find(s => s.id === activeId)) {
      setActiveId(slots[0]?.id ?? null);
    }
  }, [slots, activeId]);

  useEffect(() => {
    if (!overlay) setEditTarget("slots");
  }, [overlay]);

  useEffect(() => {
    if (activeOverlayZ > slots.length) updateOverlayZ(slots.length);
  }, [slots.length, activeOverlayZ]);

  const patch = useCallback(
    (id: string, u: Partial<SlotConfig>) => {
      const newSlots = slots.map(s => (s.id === id ? { ...s, ...u } : s));
      pendingHistoryState.current = { ...latestState.current, slots: newSlots };
      onChange(newSlots);
    },
    [slots, onChange]
  );

  const updateOverlayLocal = useCallback(
    (x: number, y: number, w: number, h: number, rot: number) => {
      pendingHistoryState.current = { ...latestState.current, overlayX: x, overlayY: y, overlayW: w, overlayH: h, overlayRotation: rot };
      onChangeOverlay(x, y, w, h, rot);
    },
    [onChangeOverlay]
  );

  const onSlotDown = (e: React.PointerEvent, slotId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveId(slotId);
    const slot = slots.find(s => s.id === slotId)!;
    drag.current = {
      op: "move", slotId,
      startX: e.clientX, startY: e.clientY,
      origX: slot.xPct, origY: slot.yPct, moved: false,
    };
    containerRef.current!.setPointerCapture(e.pointerId);
  };

  const onHandleDown = (e: React.PointerEvent, slotId: string, op: "resize" | "rotate", handle?: string) => {
    e.preventDefault(); e.stopPropagation();
    const rect = containerRef.current!.getBoundingClientRect();
    const slot = slots.find(s => s.id === slotId)!;
    if (op === "resize") {
      drag.current = { op: "resize", slotId, handle: handle!, startX: e.clientX, startY: e.clientY, orig: { ...slot } };
    } else {
      const cx = rect.left + (slot.xPct + slot.widthPct / 2) / 100 * rect.width;
      const cy = rect.top  + (slot.yPct + slot.heightPct / 2) / 100 * rect.height;
      drag.current = {
        op: "rotate", slotId, cx, cy,
        startAngle: Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI, origRot: slot.rotation,
      };
    }
    containerRef.current!.setPointerCapture(e.pointerId);
  };

  const onOverlayDown = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const clickXPct = ((e.clientX - rect.left) / rect.width) * 100;
    const clickYPct = ((e.clientY - rect.top) / rect.height) * 100;

    const hitSlot = [...slots]
      .reverse()
      .find(slot => isPointInSlot(clickXPct, clickYPct, slot));

    if (hitSlot) {
      setEditTarget("slots");
      setActiveId(hitSlot.id);
      drag.current = {
        op: "move", slotId: hitSlot.id,
        startX: e.clientX, startY: e.clientY,
        origX: hitSlot.xPct, origY: hitSlot.yPct, moved: false,
      };
    } else {
      drag.current = { op: "moveOverlay", startX: e.clientX, startY: e.clientY, origX: overlayX, origY: overlayY, moved: false };
    }
    containerRef.current!.setPointerCapture(e.pointerId);
  };

  const onContainerDown = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const clickXPct = ((e.clientX - rect.left) / rect.width) * 100;
    const clickYPct = ((e.clientY - rect.top) / rect.height) * 100;

    const hitSlot = [...slots]
      .reverse()
      .find(slot => isPointInSlot(clickXPct, clickYPct, slot));

    if (hitSlot) {
      setEditTarget("slots");
      setActiveId(hitSlot.id);
      drag.current = {
        op: "move", slotId: hitSlot.id,
        startX: e.clientX, startY: e.clientY,
        origX: hitSlot.xPct, origY: hitSlot.yPct, moved: false,
      };
      containerRef.current!.setPointerCapture(e.pointerId);
    } else {
      if (overlay) {
        setEditTarget("overlay");
        setActiveId(null);
        drag.current = {
          op: "moveOverlay",
          startX: e.clientX,
          startY: e.clientY,
          origX: overlayX,
          origY: overlayY,
          moved: false,
        };
        containerRef.current!.setPointerCapture(e.pointerId);
      } else {
        if (editTarget === "slots") {
          setActiveId(null);
        }
      }
    }
  };

  const onHandleDownOverlay = (e: React.PointerEvent, hType: "rotate" | "nw" | "ne" | "sw" | "se") => {
    e.preventDefault(); e.stopPropagation();
    const rect = containerRef.current!.getBoundingClientRect();
    if (hType === "rotate") {
      const cx = rect.left + (overlayX + overlayW / 2) / 100 * rect.width;
      const cy = rect.top  + (overlayY + overlayH / 2) / 100 * rect.height;
      drag.current = { op: "rotateOverlay", cx, cy, startAngle: Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI, origRot: overlayRotation };
    } else {
      drag.current = { op: "resizeOverlay", handle: hType, startX: e.clientX, startY: e.clientY, origX: overlayX, origY: overlayY, origW: overlayW, origH: overlayH };
    }
    containerRef.current!.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const W = rect.width; const H = rect.height;

    if (d.op === "move") {
      const dx = e.clientX - d.startX; const dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;
      (drag.current as any).moved = true;
      const slot = slots.find(s => s.id === d.slotId)!;
      const proposedX = d.origX + dx / W * 100; const proposedY = d.origY + dy / H * 100;
      const { snapX, snapY, guideX, guideY } = getSnapAndGuides(proposedX, proposedY, slot.widthPct, slot.heightPct, d.slotId);
      setGuides({ x: guideX, y: guideY });
      patch(d.slotId, { xPct: Math.max(-20, Math.min(120 - slot.widthPct,  snapX)), yPct: Math.max(-20, Math.min(120 - slot.heightPct, snapY)) });
    } else if (d.op === "resize") {
      const dxPct = (e.clientX - d.startX) / W * 100; const dyPct = (e.clientY - d.startY) / H * 100;
      const o = d.orig; const h = d.handle;
      let { xPct, yPct, widthPct, heightPct } = o;
      if (h.includes("e")) widthPct  = Math.max(5, o.widthPct + dxPct);
      if (h.includes("s")) heightPct = Math.max(4, o.heightPct + dyPct);
      if (h.includes("w")) { const nw = Math.max(5, o.widthPct - dxPct); xPct = o.xPct + (o.widthPct - nw); widthPct = nw; }
      if (h.includes("n")) { const nh = Math.max(4, o.heightPct - dyPct); yPct = o.yPct + (o.heightPct - nh); heightPct = nh; }
      patch(d.slotId, { xPct, yPct, widthPct, heightPct });
    } else if (d.op === "rotate") {
      const angle = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180 / Math.PI;
      patch(d.slotId, { rotation: Math.round((d.origRot + angle - d.startAngle) * 10) / 10 });
    } else if (d.op === "moveOverlay") {
      const dx = e.clientX - d.startX; const dy = e.clientY - d.startY;
      const proposedX = d.origX + dx / W * 100; const proposedY = d.origY + dy / H * 100;
      const { snapX, snapY, guideX, guideY } = getSnapAndGuides(proposedX, proposedY, overlayW, overlayH, null);
      setGuides({ x: guideX, y: guideY });
      updateOverlayLocal(Math.max(-50, Math.min(150 - overlayW, snapX)), Math.max(-50, Math.min(150 - overlayH, snapY)), overlayW, overlayH, overlayRotation);
    } else if (d.op === "rotateOverlay") {
      const angle = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180 / Math.PI;
      updateOverlayLocal(overlayX, overlayY, overlayW, overlayH, Math.round((d.origRot + angle - d.startAngle) * 10) / 10);
    } else if (d.op === "resizeOverlay") {
      const dxPct = (e.clientX - d.startX) / W * 100; const dyPct = (e.clientY - d.startY) / H * 100;
      const h = d.handle; let x = d.origX; let y = d.origY; let w = d.origW; let hDim = d.origH;
      if (h.includes("e")) w = Math.max(5, d.origW + dxPct);
      if (h.includes("s")) hDim = Math.max(5, d.origH + dyPct);
      if (h.includes("w")) { const nw = Math.max(5, d.origW - dxPct); x = d.origX + (d.origW - nw); w = nw; }
      if (h.includes("n")) { const nh = Math.max(5, d.origH - dyPct); y = d.origY + (d.origH - nh); hDim = nh; }
      updateOverlayLocal(x, y, w, hDim, overlayRotation);
    }
  };

  const onUp = (e: React.PointerEvent) => {
    if (drag.current) {
      try {
        containerRef.current?.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    
    // Push new snapshot to history only after a drag successfully modifies the canvas
    if (pendingHistoryState.current) {
      saveSnapshot(pendingHistoryState.current);
      pendingHistoryState.current = null;
    }

    drag.current = null;
    setGuides({});
  };

  const addSlot = () => {
    if (slots.length >= 6) return;
    // Mengacu pada slot yang chronologically terakhir untuk positioning, bukan yang di layer teratas
    const last = sortedSlotsForNumbering[sortedSlotsForNumbering.length - 1];
    const n: SlotConfig = {
      id: `slot_${Date.now()}_${slots.length}`, 
      xPct: last?.xPct ?? 5, 
      yPct: last ? Math.min(90, last.yPct + last.heightPct + 1.5) : 5,
      widthPct: last?.widthPct ?? 90, 
      heightPct: last?.heightPct ?? 20, 
      rotation: 0,
    };
    const newSlots = [...slots, n];
    onChange(newSlots); 
    setActiveId(n.id);
    saveSnapshot({ ...latestState.current, slots: newSlots });
  };

  const removeSlot = () => {
    if (slots.length <= 1) return;
    // Hapus slot yang chronologically paling terakhir ditambahkan, bukan layer teratas
    const idToRemove = sortedSlotsForNumbering[sortedSlotsForNumbering.length - 1].id;
    const next = slots.filter(s => s.id !== idToRemove);
    onChange(next); 
    setActiveId(next[next.length - 1]?.id ?? null);
    saveSnapshot({ ...latestState.current, slots: next });
  };

  const deleteSlot = (id: string) => {
    if (slots.length <= 1) return;
    const next = slots.filter(s => s.id !== id);
    onChange(next); 
    setActiveId(next[0]?.id ?? null);
    saveSnapshot({ ...latestState.current, slots: next });
  };

  const resetLayout = () => {
    const next = generateDefaultSlots(slots.length);
    onChange(next); 
    setActiveId(next[0]?.id ?? null);
    saveSnapshot({ ...latestState.current, slots: next });
  };

  const CURSORS: Record<string, string> = { nw: "nw-resize", ne: "ne-resize", sw: "sw-resize", se: "se-resize" };

  const moveLayer = (targetId: string, direction: 'up' | 'down') => {
    const sourceIndex = uiLayers.findIndex(l => l.id === targetId);
    if (sourceIndex === -1) return;

    const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;
    if (targetIndex < 0 || targetIndex >= uiLayers.length) return;

    const newUiLayers = [...uiLayers];
    const [moved] = newUiLayers.splice(sourceIndex, 1);
    newUiLayers.splice(targetIndex, 0, moved);

    const newStack = [...newUiLayers].reverse();
    const newSlots: SlotConfig[] = [];
    let newZ = newStack.length - 1;

    newStack.forEach((item, index) => {
      if (item.type === 'slot' && item.data) newSlots.push(item.data);
      if (item.type === 'overlay') newZ = index;
    });

    onChange(newSlots);
    updateOverlayZ(newZ);
    saveSnapshot({ ...latestState.current, slots: newSlots, overlayZIndex: newZ });
  };

  const handleDragStartLayer = (e: React.DragEvent, id: string) => {
    setDraggedLayerId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropLayer = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedLayerId || draggedLayerId === targetId) return;

    const sourceUiIndex = uiLayers.findIndex(l => l.id === draggedLayerId);
    const targetUiIndex = uiLayers.findIndex(l => l.id === targetId);

    const newUiLayers = [...uiLayers];
    const [moved] = newUiLayers.splice(sourceUiIndex, 1);
    newUiLayers.splice(targetUiIndex, 0, moved);

    const newStack = [...newUiLayers].reverse();
    const newSlots: SlotConfig[] = [];
    let newZ = newStack.length - 1;

    newStack.forEach((item, index) => {
      if (item.type === 'slot' && item.data) newSlots.push(item.data);
      if (item.type === 'overlay') newZ = index;
    });

    onChange(newSlots);
    updateOverlayZ(newZ);
    setDraggedLayerId(null);
    saveSnapshot({ ...latestState.current, slots: newSlots, overlayZIndex: newZ });
  };

  const handleTouchMoveLayer = (e: React.TouchEvent, layerId: string) => {
    if (!draggedLayerId) return;

    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetEl) return;

    const targetCard = targetEl.closest("[data-layer-id]");
    if (!targetCard) return;

    const targetId = targetCard.getAttribute("data-layer-id");
    if (targetId && targetId !== draggedLayerId) {
      const sourceUiIndex = uiLayers.findIndex(l => l.id === draggedLayerId);
      const targetUiIndex = uiLayers.findIndex(l => l.id === targetId);

      if (sourceUiIndex !== -1 && targetUiIndex !== -1 && sourceUiIndex !== targetUiIndex) {
        const newUiLayers = [...uiLayers];
        const [moved] = newUiLayers.splice(sourceUiIndex, 1);
        newUiLayers.splice(targetUiIndex, 0, moved);

        const newStack = [...newUiLayers].reverse();
        const newSlots: SlotConfig[] = [];
        let newZ = newStack.length - 1;

        newStack.forEach((item, index) => {
          if (item.type === 'slot' && item.data) newSlots.push(item.data);
          if (item.type === 'overlay') newZ = index;
        });

        onChange(newSlots);
        updateOverlayZ(newZ);
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full h-full">
      {/* KIRI: Kanvas & Kontrol */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {/* UNDO & REDO Group */}
            <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
              <button type="button" onClick={handleUndo} disabled={!canUndo}
                className="px-2 py-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-30 cursor-pointer" 
                title="Batal (Ctrl+Z)">
                <Undo2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <div className="w-[1px] h-3.5 bg-zinc-200 dark:bg-zinc-800"></div>
              <button type="button" onClick={handleRedo} disabled={!canRedo}
                className="px-2 py-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-30 cursor-pointer" 
                title="Ulangi (Ctrl+Y)">
                <Redo2 className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>

            {maxSlots !== 1 && (
              <>
                <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm ml-1">
                  <button type="button" onClick={removeSlot} disabled={slots.length <= 1}
                    className="px-2 py-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-30 cursor-pointer" title="Kurangi Slot">
                    <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white px-2 border-x border-zinc-200 dark:border-zinc-800 min-w-[28px] text-center tabular-nums">
                    {slots.length}
                  </span>
                  <button type="button" onClick={addSlot} disabled={slots.length >= 6}
                    className="px-2 py-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all disabled:opacity-30 cursor-pointer" title="Tambah Slot">
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                </div>
                <button type="button" onClick={resetLayout}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-sm ml-1" title="Reset Layout">
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                  Reset
                </button>
              </>
            )}

            <button type="button" onClick={() => setLayersOpen(!layersOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-sm ml-1" title={layersOpen ? "Sembunyikan Lapisan" : "Tampilkan Lapisan"}>
              <Layers className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{layersOpen ? "Sembunyikan Lapisan" : "Daftar Lapisan"}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden relative min-h-[400px]">
          
          <div className="absolute top-3 right-3 z-50 flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
            <button type="button" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <div 
              className="px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 min-w-[3.5rem] text-center select-none cursor-pointer hover:text-zinc-900 dark:hover:text-white" 
              onClick={() => setZoom(1)} title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </div>
            <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-auto w-full h-full custom-scrollbar"
          >
            <div className="min-w-full min-h-full flex items-center justify-center p-8">
              
              {/* Outer Wrapper that scales with Zoom to maintain correct scroll boundary limits */}
              <div
                style={{
                  width: (is2R ? 160 : 300) * zoom,
                  height: (is2R ? 480 : 447) * zoom,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div 
                  style={{ 
                    width: is2R ? 160 : 300, 
                    height: is2R ? 480 : 447, 
                    transform: `scale(${zoom})`, 
                    transformOrigin: 'center', 
                    flexShrink: 0 
                  }}
                >
                <div
                  ref={containerRef}
                  className="relative overflow-visible border border-zinc-300 dark:border-zinc-700/80 select-none shadow-sm w-full h-full bg-checkered"
                  style={{
                    containerType: "inline-size", 
                    touchAction: "none",
                    borderRadius: overlay ? "0px" : "12px", 
                  }}
                  onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                  onPointerDown={onContainerDown}
                >
                  {guides.x !== undefined && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${guides.x}%`, width: "1.5px", borderLeft: "1.5px dashed #ff007f", zIndex: 40, pointerEvents: "none" }} />}
                  {guides.y !== undefined && <div style={{ position: "absolute", left: 0, right: 0, top: `${guides.y}%`, height: "1.5px", borderTop: "1.5px dashed #ff007f", zIndex: 40, pointerEvents: "none" }} />}

                  {/* Garis putus-putus vertikal putih di tengah kanvas */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: "50%",
                      width: 0,
                      borderLeft: "1.5px dashed rgba(255, 255, 255, 0.8)",
                      transform: "translateX(-50%)",
                      zIndex: 5,
                      pointerEvents: "none",
                      filter: "drop-shadow(0px 0px 1px rgba(0,0,0,0.5))"
                    }}
                  />

                  {slots.map((slot) => {
                    const isActive = slot.id === activeId && editTarget === "slots";
                    const stackIdx = layerStack.findIndex(l => l.id === slot.id);
                    const zIdx = stackIdx + 10;
                    
                    const slotNum = getSlotNumber(slot.id);

                    return (
                      <div
                        key={slot.id}
                        style={{
                          position: "absolute", left: `${slot.xPct}%`, top: `${slot.yPct}%`, width: `${slot.widthPct}%`, height: `${slot.heightPct}%`,
                          transform: `rotate(${slot.rotation}deg)`, transformOrigin: "center", zIndex: zIdx,
                          boxSizing: "border-box", overflow: "visible", borderRadius: overlay ? 0 : 2,
                          touchAction: "none",
                          
                          border: isActive ? "2px dashed #60a5fa" : "1px solid #3f3f46",
                          background: isActive ? "#1e3a8a" : "#27272a", 
                          
                          cursor: editTarget === "slots" ? (isActive ? "move" : "pointer") : "default",
                          pointerEvents: editTarget === "slots" ? "auto" : "none", transition: "border-color 0.15s, background 0.15s",
                        }}
                        onPointerDown={editTarget === "slots" ? (e) => onSlotDown(e, slot.id) : undefined}
                      >
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", pointerEvents: "none" }}>
                          <ImageIcon style={{ width: "max(12px, 20cqw)", height: "max(12px, 20cqw)", color: isActive ? "#93c5fd" : "#52525b" }} strokeWidth={1.5} />
                          <span style={{ fontSize: "max(7px, 5cqw)", fontWeight: 800, fontFamily: "monospace", userSelect: "none", lineHeight: 1, color: isActive ? "#93c5fd" : "#71717a", transition: "color 0.15s" }}>
                            #{slotNum}
                          </span>
                        </div>

                        {!isActive && editTarget === "slots" && (
                          <div style={{ position: "absolute", bottom: 2, right: 3, fontSize: "max(5px, 3cqw)", fontFamily: "monospace", color: "rgba(255,255,255,0.22)", pointerEvents: "none", userSelect: "none" }}>
                            klik
                          </div>
                        )}

                        {isActive && (
                          <>
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "10%", pointerEvents: "none" }}>
                              <Move style={{ width: "max(8px,6cqw)", height: "max(8px,6cqw)", color: "rgba(96,165,250,0.5)" }} strokeWidth={1.5} />
                            </div>
                            {(["nw","ne","sw","se"] as const).map(h => (
                              <div key={h} style={{ position: "absolute", width: HANDLE, height: HANDLE, background: "#ffffff", border: "2px solid #3b82f6", borderRadius: 2, cursor: CURSORS[h], zIndex: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.35)", touchAction: "none", userSelect: "none", ...(h.includes("n") ? { top: -HANDLE / 2 } : { bottom: -HANDLE / 2 }), ...(h.includes("w") ? { left: -HANDLE / 2 } : { right: -HANDLE / 2 }) }} onPointerDown={e => { e.stopPropagation(); onHandleDown(e, slot.id, "resize", h); }} />
                            ))}
                            <div style={{ position: "absolute", top: -(ROT_OFF - HANDLE / 2), left: "50%", width: 1.5, height: ROT_OFF - HANDLE / 2, background: "#3b82f6", transform: "translateX(-50%)", pointerEvents: "none", borderRadius: 1, opacity: 0.8 }} />
                            <div style={{ position: "absolute", top: -ROT_OFF - ROT_R, left: "50%", width: ROT_R * 2, height: ROT_R * 2, borderRadius: "50%", background: "#ffffff", border: "2px solid #3b82f6", transform: "translateX(-50%)", cursor: "crosshair", zIndex: 23, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 3px rgba(59,130,246,0.20), 0 2px 6px rgba(0,0,0,0.3)", touchAction: "none", userSelect: "none" }} onPointerDown={e => { e.stopPropagation(); onHandleDown(e, slot.id, "rotate"); }}>
                              <RotateCcw style={{ width: ROT_R, height: ROT_R, color: "#3b82f6", pointerEvents: "none" }} strokeWidth={2.5} />
                            </div>
                            {slots.length > 1 && (
                              <div style={{ position: "absolute", top: -HANDLE / 2, right: -HANDLE / 2 - 18, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", border: "1.5px solid #dc2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 24, boxShadow: "0 2px 6px rgba(0,0,0,0.35)", touchAction: "none", userSelect: "none" }} onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); deleteSlot(slot.id); }}>
                                <Trash2 style={{ width: 8, height: 8, color: "#fff", pointerEvents: "none" }} strokeWidth={2.5} />
                              </div>
                            )}
                            <div style={{ position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#3b82f6", color: "#ffffff", fontSize: "7px", fontWeight: "bold", padding: "1px 3.5px", borderRadius: "3px", fontFamily: "monospace", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 35, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                              {pctToCmW(slot.widthPct).toFixed(2)} cm
                            </div>
                            <div style={{ position: "absolute", left: "-10px", top: "50%", transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "center", backgroundColor: "#3b82f6", color: "#ffffff", fontSize: "7px", fontWeight: "bold", padding: "1px 3.5px", borderRadius: "3px", fontFamily: "monospace", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 35, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                              {pctToCmH(slot.heightPct).toFixed(2)} cm
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* PNG overlay */}
                  {overlay && (
                    <div
                      style={{
                        position: "absolute", left: `${overlayX}%`, top: `${overlayY}%`, width: `${overlayW}%`, height: `${overlayH}%`,
                        transform: `rotate(${overlayRotation}deg)`, transformOrigin: "center", zIndex: activeOverlayZ + 10,
                        boxSizing: "border-box", cursor: editTarget === "overlay" ? "move" : "default", pointerEvents: editTarget === "overlay" ? "auto" : "none",
                        border: editTarget === "overlay" ? "2px dashed #3b82f6" : "none",
                        touchAction: "none",
                      }}
                      onPointerDown={editTarget === "overlay" ? onOverlayDown : undefined}
                    >
                      <img src={overlay} alt="" draggable={false} className="w-full h-full" style={{ objectFit: "fill" }} />
                      {editTarget === "overlay" && (
                        <>
                          <div style={{ position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#3b82f6", color: "#ffffff", fontSize: "7px", fontWeight: "bold", padding: "1px 3.5px", borderRadius: "3px", fontFamily: "monospace", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 35, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                            {pctToCmW(overlayW).toFixed(2)} cm
                          </div>
                          <div style={{ position: "absolute", left: "-10px", top: "50%", transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "center", backgroundColor: "#3b82f6", color: "#ffffff", fontSize: "7px", fontWeight: "bold", padding: "1px 3.5px", borderRadius: "3px", fontFamily: "monospace", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 35, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                            {pctToCmH(overlayH).toFixed(2)} cm
                          </div>
                          {(["nw","ne","sw","se"] as const).map(h => (
                            <div key={h} style={{ position: "absolute", width: HANDLE, height: HANDLE, background: "#ffffff", border: "2px solid #3b82f6", borderRadius: 2, cursor: CURSORS[h], zIndex: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.35)", touchAction: "none", userSelect: "none", ...(h.includes("n") ? { top: -HANDLE / 2 } : { bottom: -HANDLE / 2 }), ...(h.includes("w") ? { left: -HANDLE / 2 } : { right: -HANDLE / 2 }) }} onPointerDown={e => { e.stopPropagation(); onHandleDownOverlay(e, h); }} />
                          ))}
                          <div style={{ position: "absolute", top: -(ROT_OFF - HANDLE / 2), left: "50%", width: 1.5, height: ROT_OFF - HANDLE / 2, background: "#3b82f6", transform: "translateX(-50%)", pointerEvents: "none", borderRadius: 1, opacity: 0.8 }} />
                          <div style={{ position: "absolute", top: -ROT_OFF - ROT_R, left: "50%", width: ROT_R * 2, height: ROT_R * 2, borderRadius: "50%", background: "#ffffff", border: "2px solid #3b82f6", transform: "translateX(-50%)", cursor: "crosshair", zIndex: 23, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 3px rgba(59,130,246,0.20), 0 2px 6px rgba(0,0,0,0.3)", touchAction: "none", userSelect: "none" }} onPointerDown={e => { e.stopPropagation(); onHandleDownOverlay(e, "rotate"); }}>
                            <RotateCcw style={{ width: ROT_R, height: ROT_R, color: "#3b82f6", pointerEvents: "none" }} strokeWidth={2.5} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* KANAN: Daftar Lapisan Terintegrasi */}
      <div className={`shrink-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col shadow-sm max-h-[500px] transition-all duration-300 ${
        layersOpen 
          ? "w-full md:w-[180px] lg:w-56 opacity-100" 
          : "w-0 p-0 opacity-0 border-none overflow-hidden pointer-events-none"
      }`}>
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Daftar Lapisan</h4>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {uiLayers.map((layer, index) => {
            const isOverlay = layer.type === 'overlay';
            const isSelected = isOverlay 
              ? editTarget === 'overlay' 
              : (editTarget === 'slots' && activeId === layer.id);

            const isOver = dragOverId === layer.id;

            return (
              <div
                key={layer.id}
                data-layer-id={layer.id}
                draggable
                onDragStart={(e) => handleDragStartLayer(e, layer.id)}
                onDragEnter={(e) => { e.preventDefault(); setDragOverId(layer.id); }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDragLeave={(e) => { e.preventDefault(); if (dragOverId === layer.id) setDragOverId(null); }}
                onDrop={(e) => handleDropLayer(e, layer.id)}
                onDragEnd={() => {
                  setDraggedLayerId(null);
                  setDragOverId(null);
                }}
                onTouchStart={() => {
                  setDraggedLayerId(layer.id);
                }}
                onTouchMove={(e) => handleTouchMoveLayer(e, layer.id)}
                onTouchEnd={() => {
                  setDraggedLayerId(null);
                  setDragOverId(null);
                  saveSnapshot();
                }}
                onTouchCancel={() => {
                  setDraggedLayerId(null);
                  setDragOverId(null);
                }}
                onClick={() => {
                  if (isOverlay) {
                    setEditTarget('overlay');
                  } else {
                    setEditTarget('slots');
                    setActiveId(layer.id);
                  }
                }}
                className={`flex items-center gap-1.5 lg:gap-2 p-1.5 lg:p-2 border rounded-lg cursor-grab active:cursor-grabbing transition-all select-none relative ${
                  draggedLayerId === layer.id ? 'opacity-40 border-zinc-400 scale-[0.98]' :
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 ring-1 ring-blue-500/50' :
                  'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                } ${isOver ? 'ring-2 ring-blue-500 ring-offset-1 z-10 border-transparent shadow-md' : ''}`}
                style={{
                  touchAction: "none",
                  WebkitTouchCallout: "none"
                }}
              >
                {/* Grip Handle */}
                <GripVertical className="pointer-events-none w-4 h-4 text-zinc-400 shrink-0" />
                
                {/* Icon Item */}
                <div className={`pointer-events-none flex items-center justify-center w-6 h-6 rounded ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-white dark:bg-zinc-800'} border border-zinc-200 dark:border-zinc-700 shrink-0`}>
                  {isOverlay ? (
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </div>

                {/* Text Label */}
                <p className={`pointer-events-none text-xs font-medium truncate flex-1 ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {isOverlay ? 'Gambar Overlay' : `Slot Kamera ${getSlotNumber(layer.id)}`}
                </p>

                {/* Arrow Controls */}
                <div className="flex flex-col gap-[2px] ml-auto shrink-0">
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }}
                    disabled={index === 0}
                    title="Naikkan Lapisan"
                    className="p-0.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:text-white dark:hover:bg-zinc-700 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }}
                    disabled={index === uiLayers.length - 1}
                    title="Turunkan Lapisan"
                    className="p-0.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:text-white dark:hover:bg-zinc-700 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}