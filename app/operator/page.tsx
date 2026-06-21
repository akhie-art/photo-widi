"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut, Camera, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ScheduledEvents, { EventItem } from "./components/ScheduledEvents";

export default function OperatorEventSelection() {
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currentOperator, setCurrentOperator] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Append ?step=event-terjadwal to the URL on mount if it's not present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("step") !== "event-terjadwal") {
      searchParams.set("step", "event-terjadwal");
      router.replace(`/operator?${searchParams.toString()}`);
    }
  }, [router]);

  // Initialization & Auth Guard
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const role = session.user?.user_metadata?.role;
          const displayName = session.user?.user_metadata?.display_name || "Operator";

          if (role === "operator") {
            if (mounted) {
              setCurrentOperator(displayName);
              sessionStorage.setItem("glow_operator_auth", "true");
              sessionStorage.setItem("glow_operator_name", displayName);
            }
          } else {
            if (mounted) router.replace("/login");
          }
        } else {
          if (mounted) router.replace("/login");
        }
      } catch (err) {
        console.error("Operator auth check failed:", err);
        const operatorAuthFlag = sessionStorage.getItem("glow_operator_auth");
        const displayName = sessionStorage.getItem("glow_operator_name") || "Operator";
        if (operatorAuthFlag === "true" && displayName) {
          if (mounted) setCurrentOperator(displayName);
        } else {
          if (mounted) router.replace("/login");
        }
      }
    };

    checkAuth();

    // Fetch Events list
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setEvents(data as EventItem[]);
        } else if (error) {
          console.error("Error fetching events:", error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();

    // Theme initialization
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    return () => {
      mounted = false;
    };
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    sessionStorage.setItem("glow_theme", newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleOperatorLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    sessionStorage.removeItem("glow_operator_auth");
    sessionStorage.removeItem("glow_operator_name");
    setCurrentOperator(null);
    router.replace("/login");
  };

  const selectEvent = (slug: string) => {
    sessionStorage.setItem("glow_active_event_slug", slug);
    router.push(`/operator/${slug}?step=registrasi`);
  };

  if (!currentOperator) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 text-zinc-500 font-mono text-sm">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-300 animate-spin" />
        <span>Memverifikasi Sesi Portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 font-sans flex flex-col selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors duration-300">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight text-sm">GLOW Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{currentOperator}</span>
              <span className="text-xs text-zinc-500">Operator</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                aria-label="Operator Menu"
              >
                <Activity className="w-4 h-4 text-zinc-650 dark:text-zinc-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl">
                <div className="px-3 py-2.5 flex flex-col gap-0.5 select-none border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Sesi Aktif</span>
                  <span className="text-sm font-medium truncate">{currentOperator}</span>
                </div>
                
                <div className="p-1">
                  <DropdownMenuItem 
                    onClick={toggleTheme} 
                    className="flex items-center gap-2.5 px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-4 h-4" />
                        <span>Mode Terang</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4" />
                        <span>Mode Gelap</span>
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />

                  <DropdownMenuItem 
                    onClick={handleOperatorLogout} 
                    className="flex items-center gap-2.5 px-2 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Portal</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <ScheduledEvents
        events={events}
        loadingEvents={loadingEvents}
        onSelectEvent={selectEvent}
      />
    </div>
  );
}