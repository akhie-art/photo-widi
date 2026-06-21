import {
  EventConfig, FilterAsset, StickerAsset, PresetTemplate
} from "../../hooks/usePhotoboothStore";

export interface FramesTabProps {
  config: EventConfig;
  addFilterAsset: (filter: Omit<FilterAsset, "id">) => void;
  deleteFilterAsset: (id: string) => void;
  addStickerAsset: (sticker: Omit<StickerAsset, "id">) => Promise<boolean>;
  deleteStickerAsset: (id: string) => void;
  addPresetTemplate: (preset: Omit<PresetTemplate, "id">) => Promise<boolean>;
  updatePresetTemplate: (id: string, fields: Partial<PresetTemplate>) => Promise<boolean>;
  deletePresetTemplate: (id: string) => void;
  setActivePresetTemplate: (id: string) => void;
}
