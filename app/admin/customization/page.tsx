"use client";

import { usePhotoboothStore } from "../../hooks/usePhotoboothStore";
import CustomizationTab from "./components/CustomizationTab";

export default function CustomizationPage() {
  const { config, updateConfig } = usePhotoboothStore();
  return <CustomizationTab config={config} updateConfig={updateConfig} />;
}
