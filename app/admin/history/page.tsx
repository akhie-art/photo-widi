"use client";

import { usePhotoboothStore } from "../../hooks/usePhotoboothStore";
import HistoryTab from "../components/HistoryTab";

export default function HistoryPage() {
  const { photos, config, clearPhotos, deletePhoto } = usePhotoboothStore();
  return (
    <HistoryTab
      photos={photos}
      config={config}
      clearPhotos={clearPhotos}
      deletePhoto={deletePhoto}
    />
  );
}
