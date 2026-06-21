import { PhotoStrip } from "../../hooks/usePhotoboothStore";

export interface GalleryTabProps {
  photos: PhotoStrip[];
  clearPhotos: () => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
}
