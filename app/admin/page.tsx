"use client";

import { usePhotoboothStore } from "../hooks/usePhotoboothStore";
import OverviewTab from "./components/OverviewTab";

export default function AdminOverviewPage() {
  const { photos, config } = usePhotoboothStore();

  const handleStartSlideshow = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("start-slideshow"));
    }
  };

  return (
    <OverviewTab
      photos={photos}
      config={config}
      onStartSlideshow={handleStartSlideshow}
    />
  );
}
