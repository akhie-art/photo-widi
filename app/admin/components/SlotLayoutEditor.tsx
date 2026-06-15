"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Plus, Minus, RotateCcw, Trash2, Move } from "lucide-react";
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

// Strip real-world dimensions (standard photo booth strip ≈ 10cm × 24.05cm)
const STRIP_W_CM = 10;
const STRIP_H_CM = 24.05;

const pctToCmW = (pct: number) => (pct / 100) * STRIP_W_CM;
const pctToCmH = (pct: number) => (pct / 100) * STRIP_H_CM;

const frameBg = (style: string): React.CSSProperties => {
  if (style === "neon")          return { background: "linear-gradient(to bottom,#0b0813,#150e29)" };
  if (style === "classic-white") return { backgroundColor: "#ffffff" };
  if (style === "classic-black") return { backgroundColor: "#0a0a0a" };
  if (style === "pastel")        return { background: "linear-gradient(135deg,#ffdcd9,#fae8ff,#e0e7ff)" };
  if (style === "filmstrip")     return { backgroundColor: "#18181b" };
  return { backgroundColor: "#111" };
};

// ─── drag-state type ─────────────────────────────────────────────────────────

type DragState =
  | null
  | { op: "move";   slotId: string; startX: number; startY: number; origX: number; origY: number; moved: boolean }
  | { op: "resize"; slotId: string; handle: string; startX: number; startY: number; orig: SlotConfig }
  | { op: "rotate"; slotId: string; cx: number; cy: number; startAngle: number; origRot: number }
  | { op: "moveOverlay"; startX: number; startY: number; origX: number; origY: number; moved: boolean }
  | { op: "rotateOverlay"; cx: number; cy: number; startAngle: number; origRot: number }
  | { op: "resizeOverlay"; handle: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number };

// ─── constants ────────────────────────────────────────────────────────────────

const HANDLE        = 11;  // px — corner handle size
const ROT_R         = 9;   // px — rotation handle radius
const ROT_OFF       = 32;  // px — distance above slot top
const MOVE_THRESHOLD = 4;  // px — min movement to register drag

interface Props {
  slots:      SlotConfig[];
  onChange:   (slots: SlotConfig[]) => void;
  frameStyle: string;
  overlay?:   string;
  overlayX:   number;
  overlayY:   number;
  overlayW:   number;
  overlayH:   number;
  overlayRotation: number;
  onChangeOverlay: (x: number, y: number, w: number, h: number, rot: number) => void;
}

// ─── component ───────────────────────────────────────────────────────────────

export default function SlotLayoutEditor({
  slots,
  onChange,
  frameStyle,
  overlay,
  overlayX,
  overlayY,
  overlayW,
  overlayH,
  overlayRotation,
  onChangeOverlay,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drag         = useRef<DragState>(null);
  const [activeId, setActiveId] = useState<string | null>(slots[0]?.id ?? null);
  const [editTarget, setEditTarget] = useState<"slots" | "overlay">("slots");
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});

  // Helper to calculate guides and snapping
  const getSnapAndGuides = (
    x: number,
    y: number,
    w: number,
    h: number,
    excludeId: string | null
  ) => {
    const threshold = 1.2; // snapping threshold in percentage
    let snapX = x;
    let snapY = y;
    let guideX: number | undefined = undefined;
    let guideY: number | undefined = undefined;

    // 1. Gather other elements
    const others = slots.filter(s => s.id !== excludeId);

    // 2. Define target X lines (Left, Center, Right)
    const targetsX = [
      { value: 5 },   // Left boundary margin
      { value: 50 },  // Canvas vertical center
      { value: 95 },  // Right boundary margin
    ];
    others.forEach(o => {
      targetsX.push({ value: o.xPct });
      targetsX.push({ value: o.xPct + o.widthPct / 2 });
      targetsX.push({ value: o.xPct + o.widthPct });
    });

    const itemLeft = x;
    const itemCenterX = x + w / 2;
    const itemRight = x + w;

    // Try to snap Left edge
    for (const t of targetsX) {
      if (Math.abs(itemLeft - t.value) < threshold) {
        snapX = t.value;
        guideX = t.value;
        break;
      }
    }
    // Try to snap Center X
    if (guideX === undefined) {
      for (const t of targetsX) {
        if (Math.abs(itemCenterX - t.value) < threshold) {
          snapX = t.value - w / 2;
          guideX = t.value;
          break;
        }
      }
    }
    // Try to snap Right edge
    if (guideX === undefined) {
      for (const t of targetsX) {
        if (Math.abs(itemRight - t.value) < threshold) {
          snapX = t.value - w;
          guideX = t.value;
          break;
        }
      }
    }

    // 3. Define target Y lines (Top, Center, Bottom)
    const targetsY = [
      { value: 50 }, // Canvas horizontal center
    ];
    others.forEach(o => {
      targetsY.push({ value: o.yPct });
      targetsY.push({ value: o.yPct + o.heightPct / 2 });
      targetsY.push({ value: o.yPct + o.heightPct });
    });

    const itemTop = y;
    const itemCenterY = y + h / 2;
    const itemBottom = y + h;

    // Try to snap Top edge
    for (const t of targetsY) {
      if (Math.abs(itemTop - t.value) < threshold) {
        snapY = t.value;
        guideY = t.value;
        break;
      }
    }
    // Try to snap Center Y
    if (guideY === undefined) {
      for (const t of targetsY) {
        if (Math.abs(itemCenterY - t.value) < threshold) {
          snapY = t.value - h / 2;
          guideY = t.value;
          break;
        }
      }
    }
    // Try to snap Bottom edge
    if (guideY === undefined) {
      for (const t of targetsY) {
        if (Math.abs(itemBottom - t.value) < threshold) {
          snapY = t.value - h;
          guideY = t.value;
          break;
        }
      }
    }

    return { snapX, snapY, guideX, guideY };
  };

  // Keep activeId valid when slots change
  useEffect(() => {
    if (activeId && !slots.find(s => s.id === activeId)) {
      setActiveId(slots[0]?.id ?? null);
    }
  }, [slots, activeId]);

  // Reset target if overlay goes away
  useEffect(() => {
    if (!overlay) {
      setEditTarget("slots");
    }
  }, [overlay]);

  // ── patch helper ──
  const patch = useCallback(
    (id: string, u: Partial<SlotConfig>) =>
      onChange(slots.map(s => (s.id === id ? { ...s, ...u } : s))),
    [slots, onChange],
  );

  // ── pointer handlers ──────────────────────────────────────────────────────

  /** Click on unselected slot → select only (no drag). */
  const onSlotDown = (e: React.PointerEvent, slotId: string) => {
    e.stopPropagation();

    if (activeId !== slotId) {
      setActiveId(slotId);
      return;
    }

    e.preventDefault();
    const slot = slots.find(s => s.id === slotId)!;
    drag.current = {
      op: "move", slotId,
      startX: e.clientX, startY: e.clientY,
      origX: slot.xPct, origY: slot.yPct,
      moved: false,
    };
    containerRef.current!.setPointerCapture(e.pointerId);
  };

  /** Handle (resize / rotate) pointer down — always on already-active slot. */
  const onHandleDown = (
    e: React.PointerEvent,
    slotId: string,
    op: "resize" | "rotate",
    handle?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current!.getBoundingClientRect();
    const slot = slots.find(s => s.id === slotId)!;

    if (op === "resize") {
      drag.current = {
        op: "resize", slotId, handle: handle!,
        startX: e.clientX, startY: e.clientY,
        orig: { ...slot },
      };
    } else {
      const cx = rect.left + (slot.xPct + slot.widthPct / 2) / 100 * rect.width;
      const cy = rect.top  + (slot.yPct + slot.heightPct / 2) / 100 * rect.height;
      drag.current = {
        op: "rotate", slotId, cx, cy,
        startAngle: Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI,
        origRot: slot.rotation,
      };
    }

    containerRef.current!.setPointerCapture(e.pointerId);
  };

  // ── Overlay Drag and Drop Pointer Handlers ──
  const onOverlayDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    drag.current = {
      op: "moveOverlay",
      startX: e.clientX,
      startY: e.clientY,
      origX: overlayX,
      origY: overlayY,
      moved: false,
    };
    containerRef.current!.setPointerCapture(e.pointerId);
  };

  const onHandleDownOverlay = (
    e: React.PointerEvent,
    hType: "rotate" | "nw" | "ne" | "sw" | "se",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current!.getBoundingClientRect();

    if (hType === "rotate") {
      const cx = rect.left + (overlayX + overlayW / 2) / 100 * rect.width;
      const cy = rect.top  + (overlayY + overlayH / 2) / 100 * rect.height;
      drag.current = {
        op: "rotateOverlay",
        cx, cy,
        startAngle: Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI,
        origRot: overlayRotation,
      };
    } else {
      drag.current = {
        op: "resizeOverlay",
        handle: hType,
        startX: e.clientX,
        startY: e.clientY,
        origX: overlayX,
        origY: overlayY,
        origW: overlayW,
        origH: overlayH,
      };
    }

    containerRef.current!.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;

    const rect = containerRef.current!.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    if (d.op === "move") {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;
      (drag.current as any).moved = true;

      const slot = slots.find(s => s.id === d.slotId)!;
      const proposedX = d.origX + dx / W * 100;
      const proposedY = d.origY + dy / H * 100;

      const { snapX, snapY, guideX, guideY } = getSnapAndGuides(
        proposedX,
        proposedY,
        slot.widthPct,
        slot.heightPct,
        d.slotId
      );

      setGuides({ x: guideX, y: guideY });

      patch(d.slotId, {
        xPct: Math.max(-20, Math.min(120 - slot.widthPct,  snapX)),
        yPct: Math.max(-20, Math.min(120 - slot.heightPct, snapY)),
      });

    } else if (d.op === "resize") {
      const dxPct = (e.clientX - d.startX) / W * 100;
      const dyPct = (e.clientY - d.startY) / H * 100;
      const o = d.orig;
      const h = d.handle;
      let { xPct, yPct, widthPct, heightPct } = o;

      if (h.includes("e")) widthPct  = Math.max(5, o.widthPct + dxPct);
      if (h.includes("s")) heightPct = Math.max(4, o.heightPct + dyPct);
      if (h.includes("w")) {
        const nw = Math.max(5, o.widthPct - dxPct);
        xPct = o.xPct + (o.widthPct - nw);
        widthPct = nw;
      }
      if (h.includes("n")) {
        const nh = Math.max(4, o.heightPct - dyPct);
        yPct = o.yPct + (o.heightPct - nh);
        heightPct = nh;
      }

      patch(d.slotId, { xPct, yPct, widthPct, heightPct });

    } else if (d.op === "rotate") {
      const angle = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180 / Math.PI;
      patch(d.slotId, { rotation: Math.round((d.origRot + angle - d.startAngle) * 10) / 10 });

    } else if (d.op === "moveOverlay") {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      const proposedX = d.origX + dx / W * 100;
      const proposedY = d.origY + dy / H * 100;

      const { snapX, snapY, guideX, guideY } = getSnapAndGuides(
        proposedX,
        proposedY,
        overlayW,
        overlayH,
        null
      );

      setGuides({ x: guideX, y: guideY });

      onChangeOverlay(
        Math.max(-50, Math.min(150 - overlayW, snapX)),
        Math.max(-50, Math.min(150 - overlayH, snapY)),
        overlayW,
        overlayH,
        overlayRotation
      );

    } else if (d.op === "rotateOverlay") {
      const angle = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180 / Math.PI;
      onChangeOverlay(
        overlayX,
        overlayY,
        overlayW,
        overlayH,
        Math.round((d.origRot + angle - d.startAngle) * 10) / 10
      );

    } else if (d.op === "resizeOverlay") {
      const dxPct = (e.clientX - d.startX) / W * 100;
      const dyPct = (e.clientY - d.startY) / H * 100;
      const h = d.handle;
      let x = d.origX;
      let y = d.origY;
      let w = d.origW;
      let hDim = d.origH;

      if (h.includes("e")) w = Math.max(5, d.origW + dxPct);
      if (h.includes("s")) hDim = Math.max(5, d.origH + dyPct);
      if (h.includes("w")) {
        const nw = Math.max(5, d.origW - dxPct);
        x = d.origX + (d.origW - nw);
        w = nw;
      }
      if (h.includes("n")) {
        const nh = Math.max(5, d.origH - dyPct);
        y = d.origY + (d.origH - nh);
        hDim = nh;
      }

      onChangeOverlay(x, y, w, hDim, overlayRotation);
    }
  };

  const onUp = () => {
    drag.current = null;
    setGuides({});
  };

  // ── slot management ──────────────────────────────────────────────────────

  const addSlot = () => {
    if (slots.length >= 6) return;
    const last = slots[slots.length - 1];
    const n: SlotConfig = {
      id:        `slot_${Date.now()}`,
      xPct:      last?.xPct      ?? 5,
      yPct:      last ? Math.min(90, last.yPct + last.heightPct + 1.5) : 5,
      widthPct:  last?.widthPct  ?? 90,
      heightPct: last?.heightPct ?? 20,
      rotation:  0,
    };
    onChange([...slots, n]);
    setActiveId(n.id);
  };

  const removeSlot = () => {
    if (slots.length <= 1) return;
    const next = slots.slice(0, -1);
    onChange(next);
    setActiveId(next[next.length - 1]?.id ?? null);
  };

  const deleteSlot = (id: string) => {
    if (slots.length <= 1) return;
    const next = slots.filter(s => s.id !== id);
    onChange(next);
    setActiveId(next[0]?.id ?? null);
  };

  const resetLayout = () => {
    const next = generateDefaultSlots(slots.length);
    onChange(next);
    setActiveId(next[0]?.id ?? null);
  };

  const CURSORS: Record<string, string> = {
    nw: "nw-resize", ne: "ne-resize",
    sw: "sw-resize", se: "se-resize",
  };

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2.5 w-full">

      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {overlay ? (
          <div className="flex bg-background border border-border rounded-lg p-0.5 select-none">
            <button
              type="button"
              onClick={() => setEditTarget("slots")}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                editTarget === "slots"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              Slot Kamera
            </button>
            <button
              type="button"
              onClick={() => setEditTarget("overlay")}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                editTarget === "overlay"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              Gambar Overlay
            </button>
          </div>
        ) : (
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider select-none">
            Tata Letak Slot Kamera
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden">
            <button type="button" onClick={removeSlot} disabled={slots.length <= 1}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-30 cursor-pointer">
              <Minus className="w-3 h-3" strokeWidth={2.5} />
            </button>
            <span className="text-[11px] font-bold text-foreground px-2.5 border-x border-border min-w-[28px] text-center tabular-nums">
              {slots.length}
            </span>
            <button type="button" onClick={addSlot} disabled={slots.length >= 6}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-30 cursor-pointer">
              <Plus className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">jepretan</span>
          <button type="button" onClick={resetLayout}
            className="flex items-center gap-1 px-2 py-1.5 text-[9px] text-muted-foreground hover:text-foreground bg-background border border-border rounded-lg hover:bg-accent transition-all cursor-pointer font-mono">
            <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
            Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative overflow-visible rounded-xl border border-zinc-700/80 mx-auto select-none shadow-inner"
        style={{
          width: "100%",
          maxWidth: 175,
          aspectRatio: "500 / 1202.5",
          containerType: "inline-size",
          touchAction: "none",
          ...frameBg(frameStyle),
        }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerDown={() => {
          if (editTarget === "slots") setActiveId(null);
        }}
      >
        {/* Filmstrip sprocket holes */}
        {frameStyle === "filmstrip" && (
          <div className="pointer-events-none">
            <div className="absolute left-0 top-0 bottom-0 w-[6%] flex flex-col justify-around py-[3%] pointer-events-none z-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-full aspect-square bg-zinc-950 rounded-[1px]" />
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-[6%] flex flex-col justify-around py-[3%] pointer-events-none z-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-full aspect-square bg-zinc-950 rounded-[1px]" />
              ))}
            </div>
          </div>
        )}
        {/* Alignment Guide Lines */}
        {guides.x !== undefined && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${guides.x}%`,
              width: "1.5px",
              borderLeft: "1.5px dashed #ff007f",
              zIndex: 40,
              pointerEvents: "none",
            }}
          />
        )}
        {guides.y !== undefined && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${guides.y}%`,
              height: "1.5px",
              borderTop: "1.5px dashed #ff007f",
              zIndex: 40,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Slots */}
        {slots.map((slot, idx) => {
          const isActive = slot.id === activeId && editTarget === "slots";
          return (
            <div
              key={slot.id}
              style={{
                position:        "absolute",
                left:            `${slot.xPct}%`,
                top:             `${slot.yPct}%`,
                width:           `${slot.widthPct}%`,
                height:          `${slot.heightPct}%`,
                transform:       `rotate(${slot.rotation}deg)`,
                transformOrigin: "center",
                zIndex:          isActive ? 20 : 10,
                boxSizing:       "border-box",
                overflow:        "visible",
                borderRadius:    2,
                border:          isActive
                  ? "2px dashed #3b82f6"
                  : "1.5px solid rgba(255,255,255,0.28)",
                background:      isActive
                  ? "rgba(59,130,246,0.10)"
                  : "rgba(0,0,0,0.25)",
                cursor:          editTarget === "slots" ? (isActive ? "move" : "pointer") : "default",
                pointerEvents:   editTarget === "slots" ? "auto" : "none",
                transition:      "border-color 0.15s, background 0.15s",
              }}
              onPointerDown={editTarget === "slots" ? (e) => onSlotDown(e, slot.id) : undefined}
            >
              {/* Slot number */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <span style={{
                  fontSize:   "max(7px, 5cqw)",
                  fontWeight: 800,
                  fontFamily: "monospace",
                  userSelect: "none",
                  lineHeight: 1,
                  color:      isActive ? "#60a5fa" : "rgba(255,255,255,0.42)",
                  transition: "color 0.15s",
                }}>
                  #{idx + 1}
                </span>
              </div>

              {/* "klik" hint on inactive */}
              {!isActive && editTarget === "slots" && (
                <div style={{
                  position:      "absolute",
                  bottom: 2, right: 3,
                  fontSize:      "max(5px, 3cqw)",
                  fontFamily:    "monospace",
                  color:         "rgba(255,255,255,0.22)",
                  pointerEvents: "none",
                  userSelect:    "none",
                }}>
                  klik
                </div>
              )}

              {/* Active handles for slot */}
              {isActive && (
                <>
                  {/* Move icon */}
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "flex-end", justifyContent: "center",
                    paddingBottom: "10%", pointerEvents: "none",
                  }}>
                    <Move style={{
                      width: "max(8px,6cqw)", height: "max(8px,6cqw)",
                      color: "rgba(59,130,246,0.35)",
                    }} strokeWidth={1.5} />
                  </div>

                  {/* Corner resize handles */}
                  {(["nw","ne","sw","se"] as const).map(h => (
                    <div
                      key={h}
                      style={{
                        position:     "absolute",
                        width:        HANDLE, height: HANDLE,
                        background:   "#ffffff",
                        border:       "2px solid #3b82f6",
                        borderRadius: 2,
                        cursor:       CURSORS[h],
                        zIndex:       22,
                        boxShadow:    "0 1px 4px rgba(0,0,0,0.35)",
                        ...(h.includes("n") ? { top:    -HANDLE / 2 } : { bottom: -HANDLE / 2 }),
                        ...(h.includes("w") ? { left:   -HANDLE / 2 } : { right:  -HANDLE / 2 }),
                      }}
                      onPointerDown={e => { e.stopPropagation(); onHandleDown(e, slot.id, "resize", h); }}
                    />
                  ))}

                  {/* Rotation stem */}
                  <div style={{
                    position:      "absolute",
                    top:           -(ROT_OFF - HANDLE / 2),
                    left:          "50%",
                    width:         1.5, height: ROT_OFF - HANDLE / 2,
                    background:    "#3b82f6",
                    transform:     "translateX(-50%)",
                    pointerEvents: "none",
                    borderRadius:  1,
                    opacity:       0.8,
                  }} />

                  {/* Rotation circle */}
                  <div
                    style={{
                      position:       "absolute",
                      top:            -ROT_OFF - ROT_R,
                      left:           "50%",
                      width:          ROT_R * 2, height: ROT_R * 2,
                      borderRadius:   "50%",
                      background:     "#ffffff",
                      border:         "2px solid #3b82f6",
                      transform:      "translateX(-50%)",
                      cursor:         "crosshair",
                      zIndex:         23,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      boxShadow:      "0 0 0 3px rgba(59,130,246,0.20), 0 2px 6px rgba(0,0,0,0.3)",
                    }}
                    onPointerDown={e => { e.stopPropagation(); onHandleDown(e, slot.id, "rotate"); }}
                  >
                    <RotateCcw style={{
                      width: ROT_R, height: ROT_R,
                      color: "#3b82f6", pointerEvents: "none",
                    }} strokeWidth={2.5} />
                  </div>

                  {/* Delete button */}
                  {slots.length > 1 && (
                    <div
                      style={{
                        position:       "absolute",
                        top:            -HANDLE / 2, right: -HANDLE / 2 - 18,
                        width:          16, height: 16,
                        borderRadius:   "50%",
                        background:     "#ef4444",
                        border:         "1.5px solid #dc2626",
                        cursor:         "pointer",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        zIndex:         24,
                        boxShadow:      "0 2px 6px rgba(0,0,0,0.35)",
                      }}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); deleteSlot(slot.id); }}
                    >
                      <Trash2 style={{ width: 8, height: 8, color: "#fff", pointerEvents: "none" }} strokeWidth={2.5} />
                    </div>
                  )}

                  {/* Dynamic Dimension Labels */}
                  <div style={{
                    position: "absolute",
                    bottom: "-10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    fontSize: "7px",
                    fontWeight: "bold",
                    padding: "1px 3.5px",
                    borderRadius: "3px",
                    fontFamily: "monospace",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    zIndex: 35,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}>
                    {pctToCmW(slot.widthPct).toFixed(2)} cm
                  </div>

                  <div style={{
                    position: "absolute",
                    left: "-10px",
                    top: "50%",
                    transform: "translateY(-50%) rotate(-90deg)",
                    transformOrigin: "center",
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    fontSize: "7px",
                    fontWeight: "bold",
                    padding: "1px 3.5px",
                    borderRadius: "3px",
                    fontFamily: "monospace",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    zIndex: 35,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}>
                    {pctToCmH(slot.heightPct).toFixed(2)} cm
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* PNG overlay (Dynamic when editTarget is 'overlay') */}
        {overlay && (
          <div
            style={{
              position: "absolute",
              left: `${overlayX}%`,
              top: `${overlayY}%`,
              width: `${overlayW}%`,
              height: `${overlayH}%`,
              transform: `rotate(${overlayRotation}deg)`,
              transformOrigin: "center",
              zIndex: editTarget === "overlay" ? 20 : 30, // behind handles when editing slots, on top when editing overlay
              boxSizing: "border-box",
              cursor: editTarget === "overlay" ? "move" : "default",
              pointerEvents: editTarget === "overlay" ? "auto" : "none",
              border: editTarget === "overlay"
                ? "2px dashed #3b82f6"
                : "none",
            }}
            onPointerDown={editTarget === "overlay" ? onOverlayDown : undefined}
          >
            <img src={overlay} alt="" draggable={false}
              className="w-full h-full"
              style={{ objectFit: "fill" }}
            />

            {/* Dynamic Dimension Labels for Overlay */}
            {editTarget === "overlay" && (
              <>
                <div style={{
                  position: "absolute",
                  bottom: "-10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  fontSize: "7px",
                  fontWeight: "bold",
                  padding: "1px 3.5px",
                  borderRadius: "3px",
                  fontFamily: "monospace",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  zIndex: 35,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}>
                  {pctToCmW(overlayW).toFixed(2)} cm
                </div>

                <div style={{
                  position: "absolute",
                  left: "-10px",
                  top: "50%",
                  transform: "translateY(-50%) rotate(-90deg)",
                  transformOrigin: "center",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  fontSize: "7px",
                  fontWeight: "bold",
                  padding: "1px 3.5px",
                  borderRadius: "3px",
                  fontFamily: "monospace",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                  zIndex: 35,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}>
                  {pctToCmH(overlayH).toFixed(2)} cm
                </div>

                {/* Corner resize handles for Overlay */}
                {(["nw","ne","sw","se"] as const).map(h => (
                  <div
                    key={h}
                    style={{
                      position:     "absolute",
                      width:        HANDLE, height: HANDLE,
                      background:   "#ffffff",
                      border:       "2px solid #3b82f6",
                      borderRadius: 2,
                      cursor:       CURSORS[h],
                      zIndex:       22,
                      boxShadow:    "0 1px 4px rgba(0,0,0,0.35)",
                      ...(h.includes("n") ? { top:    -HANDLE / 2 } : { bottom: -HANDLE / 2 }),
                      ...(h.includes("w") ? { left:   -HANDLE / 2 } : { right:  -HANDLE / 2 }),
                    }}
                    onPointerDown={e => { e.stopPropagation(); onHandleDownOverlay(e, h); }}
                  />
                ))}

                {/* Rotation stem & circle for Overlay */}
                <div style={{
                  position:      "absolute",
                  top:           -(ROT_OFF - HANDLE / 2),
                  left:          "50%",
                  width:         1.5, height: ROT_OFF - HANDLE / 2,
                  background:    "#3b82f6",
                  transform:     "translateX(-50%)",
                  pointerEvents: "none",
                  borderRadius:  1,
                  opacity:       0.8,
                }} />

                <div
                  style={{
                    position:       "absolute",
                    top:            -ROT_OFF - ROT_R,
                    left:           "50%",
                    width:          ROT_R * 2, height: ROT_R * 2,
                    borderRadius:   "50%",
                    background:     "#ffffff",
                    border:         "2px solid #3b82f6",
                    transform:      "translateX(-50%)",
                    cursor:         "crosshair",
                    zIndex:         23,
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    boxShadow:      "0 0 0 3px rgba(59,130,246,0.20), 0 2px 6px rgba(0,0,0,0.3)",
                  }}
                  onPointerDown={e => { e.stopPropagation(); onHandleDownOverlay(e, "rotate"); }}
                >
                  <RotateCcw style={{
                    width: ROT_R, height: ROT_R,
                    color: "#3b82f6", pointerEvents: "none",
                  }} strokeWidth={2.5} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
