"use client";

import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EventConfig } from "../../hooks/usePhotoboothStore";

const FILTERS = [
  { id: "original", name: "Original" },
  { id: "bw", name: "Retro B&W" },
  { id: "vintage", name: "Warm Film" },
  { id: "neon", name: "Neon Glow" },
  { id: "sepia", name: "Sepia Dream" },
  { id: "cyber", name: "Cyberpunk" },
  { id: "pop", name: "Pop Art" },
  { id: "noir", name: "Classic Noir" },
];

const LAYOUTS = [
  { id: "strip", name: "Classic Strip (4x1)" },
  { id: "grid", name: "Grid (2x2)" },
  { id: "polaroid", name: "Polaroid (1x1)" },
];

interface ConfigTabProps {
  config: EventConfig;
  updateConfig: (newConfigFields: Partial<EventConfig>) => void;
}

export default function ConfigTab({ config, updateConfig }: ConfigTabProps) {
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [allowedFilters, setAllowedFilters] = useState<string[]>([]);
  const [allowedLayouts, setAllowedLayouts] = useState<string[]>([]);
  const [mirrorDefault, setMirrorDefault] = useState(true);

  // Sync state when config changes
  useEffect(() => {
    if (config) {
      setCountdownDuration(config.countdownDuration ?? 3);
      setAllowedFilters(config.allowedFilters || []);
      setAllowedLayouts(config.allowedLayouts || []);
      setMirrorDefault(config.mirrorDefault ?? true);
    }
  }, [config]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      countdownDuration,
      allowedFilters,
      allowedLayouts,
      mirrorDefault,
    });
    alert("Pengaturan booth berhasil disimpan!");
  };

  const handleFilterToggle = (filterId: string) => {
    setAllowedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleLayoutToggle = (layoutId: string) => {
    setAllowedLayouts((prev) =>
      prev.includes(layoutId)
        ? prev.filter((id) => id !== layoutId)
        : [...prev, layoutId]
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Pengaturan Booth</h2>
        <p className="text-muted-foreground text-xs mt-1">
          Kustomisasi hitung mundur, mirror, dan batasan filter di booth pelanggan.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="border-b border-border py-3.5">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground font-mono">
              <Camera className="w-4 h-4 text-blue-500" strokeWidth={1.5} /> KONTROL KAMERA & FITUR
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Waktu Hitung Mundur (Countdown)</Label>
                <select
                  value={countdownDuration}
                  onChange={(e) => setCountdownDuration(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
                >
                  <option value={3}>3 Detik</option>
                  <option value={5}>5 Detik</option>
                  <option value={10}>10 Detik</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pl-1 pt-5">
                <Switch
                  id="mirror-switch"
                  checked={mirrorDefault}
                  onCheckedChange={(checked) => setMirrorDefault(checked)}
                  className="accent-blue-500"
                />
                <Label htmlFor="mirror-switch" className="cursor-pointer text-muted-foreground text-xs">
                  Auto Mirror Kamera Pelanggan
                </Label>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Batasan Filter yang Boleh Digunakan Tamu</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-background p-3.5 rounded-xl border border-border">
                {FILTERS.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground select-none"
                  >
                    <input
                      type="checkbox"
                      checked={allowedFilters.includes(f.id)}
                      onChange={() => handleFilterToggle(f.id)}
                      className="accent-blue-500 w-4.5 h-4.5 rounded"
                    />
                    <span>{f.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Batasan Template Layout Bingkai</Label>
              <div className="flex flex-wrap gap-4 bg-background p-3.5 rounded-xl border border-border">
                {LAYOUTS.map((lay) => (
                  <label
                    key={lay.id}
                    className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground select-none"
                  >
                    <input
                      type="checkbox"
                      checked={allowedLayouts.includes(lay.id)}
                      onChange={() => handleLayoutToggle(lay.id)}
                      className="accent-blue-500 w-4.5 h-4.5 rounded"
                    />
                    <span>{lay.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full py-3 text-xs font-semibold tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-none transition-all cursor-pointer"
        >
          Simpan Pengaturan Fitur
        </Button>
      </form>
    </div>
  );
}
