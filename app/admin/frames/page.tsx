"use client";

import React from "react";
import { usePhotoboothStore } from "@/app/hooks/usePhotoboothStore";
import FramesTab from "./components";

export default function FramesPage() {
  const store = usePhotoboothStore();

  return (
    <div className="w-full h-full">
      <FramesTab
        config={store.config}
        addFilterAsset={store.addFilterAsset}
        deleteFilterAsset={store.deleteFilterAsset}
        addStickerAsset={store.addStickerAsset}
        deleteStickerAsset={store.deleteStickerAsset}
        addPresetTemplate={store.addPresetTemplate}
        updatePresetTemplate={store.updatePresetTemplate}
        deletePresetTemplate={store.deletePresetTemplate}
        setActivePresetTemplate={store.setActivePresetTemplate}
      />
    </div>
  );
}