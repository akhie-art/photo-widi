"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePhotoboothStore, EventConfig, UiTemplate } from "../../../hooks/usePhotoboothStore";
import TemplateList from "./TemplateList"; // ✅ Benar, karena file berada di satu folder (sejajar)
import VisualBuilder from "./VisualBuilder"; // ✅ Benar

interface CustomizationTabProps {
  config: EventConfig;
  updateConfig: (newConfigFields: Partial<EventConfig>) => Promise<boolean>;
}

export default function CustomizationTab({ config, updateConfig }: CustomizationTabProps) {
  // Store actions & states
  const { 
    uiTemplates = [], 
    addUiTemplate, 
    updateUiTemplate, 
    deleteUiTemplate 
  } = usePhotoboothStore();

  // Local View Routing State
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UiTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handlers untuk List
  const handleStartAdd = () => {
    setEditingTemplate(null);
    setIsEditing(true);
  };

  const handleStartEdit = (template: UiTemplate) => {
    setEditingTemplate(template);
    setIsEditing(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const success = await deleteUiTemplate(id);
    if (success) {
      toast.success(`Template "${name}" berhasil dihapus.`);
    }
  };

  // Handlers untuk Builder
  const handleSaveBuilder = async (data: Partial<UiTemplate>): Promise<string | null> => {
    setIsSaving(true);
    let savedId: string | null = null;
    
    if (editingTemplate) {
      // Update template yang sudah ada
      const success = await updateUiTemplate(editingTemplate.id, data);
      if (success) {
        savedId = editingTemplate.id;
      }
    } else {
      // Simpan template baru
      // Tambahkan type assertion "as Omit<UiTemplate, 'id'>" di sini
      const newTemp = await addUiTemplate(data as Omit<UiTemplate, "id">);
      if (newTemp) {
        savedId = newTemp.id;
      }
    }
    
    setIsSaving(false);
    if (savedId) {
      setIsEditing(false); // Tutup builder jika sukses
    }
    return savedId;
  };

  const handleCancelBuilder = () => {
    setIsEditing(false);
  };

  // Render Logic
  if (isEditing) {
    // Memanggil Visual Builder dengan menggunakan `key` agar state builder
    // selalu reset/fresh ketika kita berpindah dari satu template ke template lainnya.
    return (
      <VisualBuilder 
        key={editingTemplate ? editingTemplate.id : 'new-template'}
        initialData={editingTemplate}
        templates={uiTemplates}
        onSave={handleSaveBuilder}
        onCancel={handleCancelBuilder}
        isSaving={isSaving}
        eventName={config.eventName}
        pricePerSession={config.pricePerSession}
      />
    );
  }

  // Jika tidak sedang mengedit, tampilkan grid list.
  return (
    <TemplateList 
      templates={uiTemplates} 
      onAdd={handleStartAdd} 
      onEdit={handleStartEdit} 
      onDelete={handleDelete} 
    />
  );
}