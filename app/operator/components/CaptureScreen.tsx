"use client";

import React from "react";
import { EventConfig, PresetTemplate, PlacedSticker } from "../../hooks/usePhotoboothStore";
import ConfigSelectorCard, { FilterItem } from "./ConfigSelectorCard";
import CameraStandbyCard from "./CameraStandbyCard";
import PhotoStripProgressCard from "./PhotoStripProgressCard";
import { useCaptureLayout } from "../../hooks/useCaptureLayout";
import { useStickerInteraction } from "../../hooks/useStickerInteraction";

interface LayoutItem {
  id: string;
  name: string;
  description?: string | null;
  count: number;
}

interface CaptureScreenProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCapturing: boolean;
  capturedPhotos: string[];
  activeLayout: string;
  activeFilter: FilterItem;
  activeFiltersList: FilterItem[];
  activeLayoutsList: LayoutItem[];
  countdown: number | null;
  poseAlert: string | null;
  isMirrored: boolean;
  setIsMirrored: (m: boolean) => void;
  startCaptureSequence: () => void;
  onCancel: () => void;
  layoutsCount: number;
  config: EventConfig;
  activeFrameId: string;
  countdownDuration: number;
  setCountdownDuration: (duration: number) => void;
  onRetakeSlot?: (index: number) => void;
  onComplete?: () => void;
  currentCaptureNum: number;
  customerName: string;
  customerPhone: string;
  currentSessionNum: number;
  sessionsCount: number;
  onSelectPreset?: (preset: PresetTemplate) => void;
  onSelectFilter?: (filter: FilterItem) => void;
  placedStickers?: PlacedSticker[];
  onAddSticker?: (stickerId: string) => void;
  onClearStickers?: () => void;
  onUpdateSticker?: (id: string, fields: Partial<PlacedSticker>) => void;
  onDeleteSticker?: (id: string) => void;
}

export default function CaptureScreen({
  videoRef,
  isCapturing,
  capturedPhotos,
  activeLayout,
  activeFilter,
  activeFiltersList,
  activeLayoutsList,
  countdown,
  poseAlert,
  isMirrored,
  setIsMirrored,
  startCaptureSequence,
  onCancel,
  layoutsCount,
  config,
  activeFrameId,
  countdownDuration,
  setCountdownDuration,
  onRetakeSlot,
  onComplete,
  currentCaptureNum,
  customerName,
  customerPhone,
  currentSessionNum,
  sessionsCount,
  onSelectPreset,
  onSelectFilter,
  placedStickers = [],
  onAddSticker,
  onClearStickers,
  onUpdateSticker,
  onDeleteSticker,
}: CaptureScreenProps) {
  const [activeTab, setActiveTab] = React.useState<"frame" | "filter" | "sticker">("frame");
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Hook for layout/geometry calculations
  const {
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
  } = useCaptureLayout({
    config,
    activeFrameId,
    activeLayout,
    layoutsCount,
  });

  // Hook for sticker drag-and-drop & pointer interactions
  const {
    activeStickerId,
    setActiveStickerId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useStickerInteraction({
    placedStickers,
    onUpdateSticker,
    containerRef,
  });

  const filledPhotosCount = Array.from({ length: layoutsCount }).filter((_, idx) => !!capturedPhotos[idx]).length;

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6 items-stretch justify-center px-4 animate-fade-in duration-300">
      {/* COLUMN 1: CONFIGURATION SELECTOR CARD */}
      <ConfigSelectorCard
        isCapturing={isCapturing}
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeFrameId={activeFrameId}
        activeFilter={activeFilter}
        activeFiltersList={activeFiltersList}
        placedStickers={placedStickers}
        onSelectPreset={onSelectPreset}
        onSelectFilter={onSelectFilter}
        onAddSticker={onAddSticker}
        onClearStickers={onClearStickers}
      />

      {/* COLUMN 2: CAMERA STANDBY CARD */}
      <CameraStandbyCard
        videoRef={videoRef}
        isCapturing={isCapturing}
        countdownDuration={countdownDuration}
        setCountdownDuration={setCountdownDuration}
        currentSessionNum={currentSessionNum}
        sessionsCount={sessionsCount}
        countdown={countdown}
        isMirrored={isMirrored}
        setIsMirrored={setIsMirrored}
        activeFilter={activeFilter}
        startCaptureSequence={startCaptureSequence}
        onCancel={onCancel}
        filledPhotosCount={filledPhotosCount}
        layoutsCount={layoutsCount}
      />

      {/* COLUMN 3: PHOTO STRIP PROGRESS/RESULTS */}
      <PhotoStripProgressCard
        containerRef={containerRef}
        capturedPhotos={capturedPhotos}
        layoutsCount={layoutsCount}
        activeLayout={activeLayout}
        isCustomFrame={isCustomFrame}
        isFilmFrame={isFilmFrame}
        isRedVintage={isRedVintage}
        frameStyle={frameStyle}
        currentW={currentW}
        currentH={currentH}
        slots={slots}
        displayOverlays={displayOverlays}
        activeTemplate={activeTemplate}
        getBackgroundStyle={getBackgroundStyle}
        getSlotBorderStyle={getSlotBorderStyle}
        placedStickers={placedStickers}
        activeStickerId={activeStickerId}
        setActiveStickerId={setActiveStickerId}
        handlePointerDown={handlePointerDown}
        handlePointerMove={handlePointerMove}
        handlePointerUp={handlePointerUp}
        isCapturing={isCapturing}
        onRetakeSlot={onRetakeSlot}
        onDeleteSticker={onDeleteSticker}
        onComplete={onComplete}
        filledPhotosCount={filledPhotosCount}
        config={config}
      />
    </div>
  );
}