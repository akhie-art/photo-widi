"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePhotoboothStore } from "../hooks/usePhotoboothStore";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Settings,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
  Palette,
  Sun,
  Moon,
  History,
  Users,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";

import SlideshowOverlay from "./components/SlideshowOverlay";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { config, photos } = usePhotoboothStore();
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  // Authentication gate (Secure Supabase Auth check)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const role = session.user?.user_metadata?.role;
          if (role === "admin") {
            if (mounted) {
              setAuthorized(true);
              sessionStorage.setItem("glow_admin_auth", "true");
            }
          } else {
            if (mounted) {
              sessionStorage.removeItem("glow_admin_auth");
              router.replace("/login");
            }
          }
        } else {
          if (mounted) {
            sessionStorage.removeItem("glow_admin_auth");
            router.replace("/login");
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        const adminAuthFlag = sessionStorage.getItem("glow_admin_auth");
        if (adminAuthFlag === "true") {
          if (mounted) setAuthorized(true);
        } else {
          if (mounted) {
            sessionStorage.removeItem("glow_admin_auth");
            router.replace("/login");
          }
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  // Determine current active page
  const activeTab = pathname.endsWith("/admin")
    ? "dashboard"
    : pathname.split("/").pop() || "dashboard";

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = sessionStorage.getItem("glow_admin_theme") as "dark" | "light" | null;
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    sessionStorage.setItem("glow_admin_theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };



  // Listen to start-slideshow custom events from overview pages
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStartSlideshow = () => setIsSlideshowActive(true);
    window.addEventListener("start-slideshow", handleStartSlideshow);
    return () => window.removeEventListener("start-slideshow", handleStartSlideshow);
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex flex-col items-center justify-center gap-4 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <span>Memverifikasi Otoritas Admin...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground flex flex-col">
      {/* 📺 Fullscreen Slideshow Viewport Overlay */}
      <SlideshowOverlay
        isOpen={isSlideshowActive}
        onClose={() => setIsSlideshowActive(false)}
        photos={photos}
        eventName={config.eventName}
        location={config.location}
        date={config.date}
      />

      {/* 🛠️ Layout with SidebarProvider */}
      <SidebarProvider defaultOpen={true} className="h-screen overflow-hidden">
          
          {/* 👈 Left Navigation Sidebar */}
          <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200">
            <SidebarHeader className="border-b border-sidebar-border px-6 group-data-[state=collapsed]:px-2 py-4.5 group-data-[state=collapsed]:py-3 bg-sidebar transition-all duration-200">
              <div className="flex items-center gap-2.5 group-data-[state=collapsed]:justify-center">
                {config.logoUrl ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-sidebar-border bg-zinc-50 dark:bg-zinc-900 shrink-0">
                    <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285F4] via-[#9B72CB] to-[#D96570] flex items-center justify-center shadow-md shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={1.5} />
                  </div>
                )}
                <div className="group-data-[state=collapsed]:hidden transition-all duration-200 min-w-0">
                  <h2 className="text-sm font-semibold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 truncate">
                    {config.eventName || "GLOW SYSTEM"}
                  </h2>
                  <p className="text-[9px] text-zinc-500 font-mono">Booth Management</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-3 group-data-[state=collapsed]:p-2 gap-3 bg-sidebar transition-all duration-200">
              <SidebarGroup className="group-data-[state=collapsed]:p-0">
                <SidebarGroupLabel className="text-[10px] text-zinc-500 font-mono tracking-wider px-2 mb-1 group-data-[state=collapsed]:hidden">
                  NAVIGASI UTAMA
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link href="/admin" />}
                        isActive={activeTab === "dashboard"}
                        tooltip="Dashboard"
                        className={`w-full justify-start group-data-[state=collapsed]:justify-center gap-3 group-data-[state=collapsed]:gap-0 px-3 group-data-[state=collapsed]:px-2 py-2 rounded-lg text-xs transition-all border ${
                          activeTab === "dashboard"
                            ? "bg-sidebar-accent border-sidebar-border text-foreground font-medium"
                            : "bg-transparent border-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                        <span className="group-data-[state=collapsed]:hidden">Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link href="/admin/operators" />}
                        isActive={activeTab === "operators"}
                        tooltip="Manajemen Operator"
                        className={`w-full justify-start group-data-[state=collapsed]:justify-center gap-3 group-data-[state=collapsed]:gap-0 px-3 group-data-[state=collapsed]:px-2 py-2 rounded-lg text-xs transition-all border ${
                          activeTab === "operators"
                            ? "bg-sidebar-accent border-sidebar-border text-foreground font-medium"
                            : "bg-transparent border-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Users className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                        <span className="group-data-[state=collapsed]:hidden">Manajemen Operator</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link href="/admin/config" />}
                        isActive={activeTab === "config"}
                        tooltip="Pengaturan Booth"
                        className={`w-full justify-start group-data-[state=collapsed]:justify-center gap-3 group-data-[state=collapsed]:gap-0 px-3 group-data-[state=collapsed]:px-2 py-2 rounded-lg text-xs transition-all border ${
                          activeTab === "config"
                            ? "bg-sidebar-accent border-sidebar-border text-foreground font-medium"
                            : "bg-transparent border-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Settings className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                        <span className="group-data-[state=collapsed]:hidden">Pengaturan Booth</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link href="/admin/frames" />}
                        isActive={activeTab === "frames"}
                        tooltip="Bingkai & Dekorasi"
                        className={`w-full justify-start group-data-[state=collapsed]:justify-center gap-3 group-data-[state=collapsed]:gap-0 px-3 group-data-[state=collapsed]:px-2 py-2 rounded-lg text-xs transition-all border ${
                          activeTab === "frames"
                            ? "bg-sidebar-accent border-sidebar-border text-foreground font-medium"
                            : "bg-transparent border-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Palette className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                        <span className="group-data-[state=collapsed]:hidden">Bingkai & Dekorasi</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link href="/admin/gallery" />}
                        isActive={activeTab === "gallery"}
                        tooltip="Galeri Foto Tamu"
                        className={`w-full justify-start group-data-[state=collapsed]:justify-center gap-3 group-data-[state=collapsed]:gap-0 px-3 group-data-[state=collapsed]:px-2 py-2 rounded-lg text-xs transition-all border items-center justify-between group-data-[state=collapsed]:justify-center ${
                          activeTab === "gallery"
                            ? "bg-sidebar-accent border-sidebar-border text-foreground font-medium"
                            : "bg-transparent border-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 group-data-[state=collapsed]:gap-0">
                            <ImageIcon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                            <span className="group-data-[state=collapsed]:hidden">Galeri Foto Tamu</span>
                          </div>
                          {photos.length > 0 && (
                            <span className="text-[9px] bg-sidebar-accent text-muted-foreground px-2 py-0.5 rounded-full border border-sidebar-border font-mono font-bold group-data-[state=collapsed]:hidden">
                              {photos.length}
                            </span>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link href="/admin/history" />}
                        isActive={activeTab === "history"}
                        tooltip="Riwayat Sesi Foto"
                        className={`w-full justify-start group-data-[state=collapsed]:justify-center gap-3 group-data-[state=collapsed]:gap-0 px-3 group-data-[state=collapsed]:px-2 py-2 rounded-lg text-xs transition-all border ${
                          activeTab === "history"
                            ? "bg-sidebar-accent border-sidebar-border text-foreground font-medium"
                            : "bg-transparent border-transparent hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <History className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                        <span className="group-data-[state=collapsed]:hidden">Riwayat Sesi Foto</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>


                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>


            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border p-3 bg-sidebar flex flex-col gap-2 justify-center transition-all duration-200">
              <Link
                href="/"
                className="w-full group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:h-8 bg-background hover:bg-sidebar-accent text-muted-foreground hover:text-foreground border border-sidebar-border text-xs font-mono py-2 rounded-xl transition-all flex items-center justify-center gap-2 group-data-[state=collapsed]:gap-0"
                title="Kembali Ke Booth"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                <span className="group-data-[state=collapsed]:hidden">Kembali Ke Booth</span>
              </Link>
              <button
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } catch (err) {
                    console.error("Sign out error:", err);
                  }
                  sessionStorage.removeItem("glow_admin_auth");
                  router.replace("/login");
                }}
                className="w-full group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:h-8 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-2 group-data-[state=collapsed]:gap-0 cursor-pointer"
                title="Log Out"
              >
                <span className="group-data-[state=collapsed]:hidden">Keluar Sistem</span>
              </button>
            </SidebarFooter>
          </Sidebar>

          {/* 👉 Right Content Inset */}
          <SidebarInset className="flex-1 flex flex-col bg-background overflow-y-auto">
            {/* Nav Header */}
            <header className="px-6 py-4 border-b border-border bg-background/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground hover:bg-sidebar-accent" />
                <h1 className="text-xs font-mono text-muted-foreground capitalize">
                  / admin / {activeTab === "dashboard" ? "overview" : activeTab}
                </h1>
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground border border-sidebar-border rounded-xl transition-all cursor-pointer flex items-center justify-center"
                title={theme === "dark" ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                ) : (
                  <Moon className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
                )}
              </button>
            </header>

            {/* Dashboard Inset Panel Content */}
            <div className="flex-1 p-5 md:p-6 max-w-6xl w-full mx-auto">
              {children}
            </div>
          </SidebarInset>

      </SidebarProvider>
    </div>
  );
}
