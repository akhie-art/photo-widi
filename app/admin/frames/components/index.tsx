"use client";

import React, { useState } from "react";
import { Sparkles, Filter, Smile } from "lucide-react";
import PresetsTab from "./PresetsTab";
import FiltersTab from "./FiltersTab";
import StickersTab from "./StickersTab";
import { FramesTabProps } from "../types";

export default function FramesTab(props: FramesTabProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "filters" | "stickers">("presets");

  const tabOptions = [
    { id: "presets",  label: "Template Instan", icon: Sparkles },
    { id: "filters",  label: "Filters", icon: Filter },
    { id: "stickers", label: "Stickers", icon: Smile },
  ] as const;

  return (
    <div className="flex flex-col gap-6 animate-fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-2">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
          Template & Aset Dekorasi
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xl">
          Kelola template instan, filter, dan stiker kustom.
        </p>
      </div>

      {/* Sleek Underline Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabOptions.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap outline-none ${
                  isActive
                    ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="mt-2 min-h-[500px]">
        {activeTab === "presets" && <PresetsTab {...props} />}
        {activeTab === "filters" && <FiltersTab {...props} />}
        {activeTab === "stickers" && <StickersTab {...props} />}
      </div>
    </div>
  );
}