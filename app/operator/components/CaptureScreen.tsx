"use client";

import React from "react";
import { EventConfig, PresetTemplate, StickerAsset, PlacedSticker } from "../../hooks/usePhotoboothStore";
import ConfigSelectorCard, { FilterItem } from "./ConfigSelectorCard";
import CameraStandbyCard from "./CameraStandbyCard";
import PhotoStripProgressCard from "./PhotoStripProgressCard";
import { useCaptureLayout } from "../../hooks/useCaptureLayout";

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
  placedStickers: PlacedSticker[];
  onAddSticker: (sticker: StickerAsset) => void;
  onRemoveSticker: (id: string) => void;
  // Menambahkan properti onUpdateSticker agar logic dari parent bisa berjalan
  onUpdateSticker: (id: string, updates: Partial<PlacedSticker>) => void;
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
  placedStickers,
  onAddSticker,
  onRemoveSticker,
  onUpdateSticker,
}: CaptureScreenProps) {
  const [activeTab, setActiveTab] = React.useState<"frame" | "filter" | "sticker">("frame");
  const containerRef = React.useRef<HTMLDivElement | null>(null);

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

  const filledPhotosCount = Array.from({ length: layoutsCount }).filter((_, idx) => !!capturedPhotos[idx]).length;

  const is4R = activeTemplate?.paperSize === "4R";

  const cameraColClass = is4R
    ? "w-full col-span-12 portrait:col-span-8 portrait:row-start-1 portrait:col-start-1 landscape:col-span-5 landscape:row-start-1 landscape:col-start-4 h-full flex flex-col min-h-0"
    : "w-full col-span-12 portrait:col-span-9 portrait:row-start-1 portrait:col-start-1 landscape:col-span-6 landscape:row-start-1 landscape:col-start-4 h-full flex flex-col min-h-0";

  const progressColClass = is4R
    ? "w-full col-span-12 portrait:col-span-4 portrait:row-start-1 portrait:col-start-9 landscape:col-span-4 landscape:row-start-1 landscape:col-start-9 h-full flex flex-col min-h-0"
    : "w-full col-span-12 portrait:col-span-3 portrait:row-start-1 portrait:col-start-10 landscape:col-span-3 landscape:row-start-1 landscape:col-start-10 h-full flex flex-col min-h-0";

  return (
    <div className="w-full h-screen grid grid-cols-12 gap-4 md:gap-6 p-4 md:p-6 items-stretch justify-center animate-fade-in duration-300 overflow-hidden">
      
      {/* COLUMN 1: CONFIGURATION SELECTOR CARD */}
      <div className="w-full h-full col-span-12 portrait:col-span-12 portrait:row-start-2 portrait:col-start-1 landscape:col-span-3 landscape:row-start-1 landscape:col-start-1 flex flex-col justify-stretch">
        <ConfigSelectorCard
          isCapturing={isCapturing}
          config={config}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeFrameId={activeFrameId}
          activeFilter={activeFilter}
          activeFiltersList={activeFiltersList}
          onSelectPreset={onSelectPreset}
          onSelectFilter={onSelectFilter}
          onAddSticker={onAddSticker}
        />
      </div>

      {/* COLUMN 2: CAMERA STANDBY CARD */}
      <div className={cameraColClass}>
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
          currentCaptureNum={currentCaptureNum}
          poseAlert={poseAlert}
        />
      </div>

      {/* COLUMN 3: PHOTO STRIP PROGRESS/RESULTS */}
      <div className={progressColClass}>
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
          isCapturing={isCapturing}
          onRetakeSlot={onRetakeSlot}
          onComplete={onComplete}
          filledPhotosCount={filledPhotosCount}
          config={config}
          placedStickers={placedStickers}
          onRemoveSticker={onRemoveSticker}
          onUpdateSticker={onUpdateSticker} /* Meneruskan onUpdateSticker di sini */
        />
      </div>

    </div>
  );
}