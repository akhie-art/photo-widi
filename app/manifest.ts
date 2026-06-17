import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = "GLOW Virtual Photobooth";
  let shortName = "GlowBooth";
  let logoUrl = "/icon-192.png";

  try {
    const { data: cfgRow } = await supabase
      .from("event_config")
      .select("config_json")
      .eq("id", "default")
      .single();

    if (cfgRow?.config_json) {
      const config = cfgRow.config_json as any;
      if (config.eventName) {
        name = config.eventName;
        shortName = config.eventName.substring(0, 12);
      }
      if (config.logoUrl) {
        logoUrl = config.logoUrl;
      }
    }
  } catch (err) {
    console.error("Error fetching config for manifest:", err);
  }

  return {
    name,
    short_name: shortName,
    description: "Premium virtual photobooth application for event memories.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b0b0c",
    theme_color: "#2563eb",
    icons: [
      {
        src: logoUrl,
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
