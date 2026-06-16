"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePhotoboothStore } from "@/app/hooks/usePhotoboothStore";

export default function TitleHandler() {
  const { config } = usePhotoboothStore();
  const pathname = usePathname();
  const eventName = config.eventName?.trim() || "GLOW Virtual Photobooth";

  useEffect(() => {
    let pageName = "";

    if (pathname === "/") {
      pageName = "Beranda";
    } else if (pathname === "/login") {
      pageName = "Masuk";
    } else if (pathname === "/admin") {
      pageName = "Admin Dashboard";
    } else if (pathname === "/admin/config") {
      pageName = "Pengaturan Booth";
    } else if (pathname === "/admin/frames") {
      pageName = "Bingkai & Dekorasi";
    } else if (pathname === "/admin/gallery") {
      pageName = "Galeri Foto Tamu";
    } else if (pathname === "/admin/history") {
      pageName = "Riwayat Sesi Foto";
    } else if (pathname === "/operator") {
      pageName = "Operator";
    } else if (pathname.startsWith("/operator/")) {
      pageName = "Sesi Foto";
    } else if (pathname.startsWith("/share/")) {
      pageName = "Unduh Foto";
    } else {
      pageName = "Virtual Photobooth";
    }

    document.title = `${eventName} | ${pageName}`;
  }, [eventName, pathname]);

  return null;
}
