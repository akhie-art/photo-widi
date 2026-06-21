import { EventConfig } from "../../hooks/usePhotoboothStore";

export interface ConfigTabProps {
  config: EventConfig;
  updateConfig: (newConfigFields: Partial<EventConfig>) => Promise<boolean>;
}
