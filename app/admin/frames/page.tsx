"use client";

import { usePhotoboothStore } from "../../hooks/usePhotoboothStore";
import FramesTab from "../components/FramesTab";

export default function FramesPage() {
  const store = usePhotoboothStore();
  return (
    <FramesTab
      config={store.config}
      addLayoutAsset={store.addLayoutAsset}
      deleteLayoutAsset={store.deleteLayoutAsset}
      addFilterAsset={store.addFilterAsset}
      deleteFilterAsset={store.deleteFilterAsset}
      addStickerAsset={store.addStickerAsset}
      deleteStickerAsset={store.deleteStickerAsset}
      addPresetTemplate={store.addPresetTemplate}
      updatePresetTemplate={store.updatePresetTemplate}
      deletePresetTemplate={store.deletePresetTemplate}
      setActivePresetTemplate={store.setActivePresetTemplate}
    />
  );
}
