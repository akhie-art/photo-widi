"use client";

import { usePhotoboothStore } from "../../hooks/usePhotoboothStore";
import ConfigTab from "./components/ConfigTab";

export default function ConfigPage() {
  const { config, updateConfig } = usePhotoboothStore();
  return <ConfigTab config={config} updateConfig={updateConfig} />;
}
