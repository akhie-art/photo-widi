"use client";

import { usePhotoboothStore } from "../hooks/usePhotoboothStore";
import OverviewTab from "./components/OverviewTab";

export default function AdminOverviewPage() {
  const { photos, config } = usePhotoboothStore();

  return (
    <OverviewTab
      photos={photos}
      config={config}
    />
  );
}
