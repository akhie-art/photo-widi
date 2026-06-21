"use client";

import { usePhotoboothStore } from "../../hooks/usePhotoboothStore";
import GalleryTab from "./components/GalleryTab";

export default function GalleryPage() {
  const { photos, clearPhotos, deletePhoto } = usePhotoboothStore();
  return (
    <GalleryTab
      photos={photos}
      clearPhotos={clearPhotos}
      deletePhoto={deletePhoto}
    />
  );
}
