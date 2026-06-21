import { PhotoStrip, EventConfig } from "../../hooks/usePhotoboothStore";

export interface HistoryTabProps {
  photos: PhotoStrip[];
  clearPhotos: () => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  config: EventConfig;
}
