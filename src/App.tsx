import React, { useState, useEffect } from "react";
import { AppState, BusinessType, User } from "./types";
import KozDonerPOS from "./components/KozDonerPOS";
import FlowerShopPOS from "./components/FlowerShopPOS";
import FlowerShopWeb from "./components/FlowerShopWeb";
import AdminPanel from "./components/AdminPanel";
import QRMenu from "./components/QRMenu";
import LoginScreen from "./components/LoginScreen";
import ShiftControl from "./components/ShiftControl";
import InventoryLossModal from "./components/InventoryLossModal";
import TableQRModal from "./components/TableQRModal";
import WaiterMobile from "./components/WaiterMobile";
import DirectorLogin from "./components/DirectorLogin";
import { 
  ChefHat, 
  Flower, 
  TrendingUp, 
  ShoppingBag, 
  Database, 
  Grid, 
  CheckCircle, 
  Activity, 
  Info, 
  ChevronRight, 
  Sparkles, 
  RefreshCw, 
  BellRing, 
  LogOut, 
  AlertTriangle, 
  Clock, 
  Sun, 
  Moon, 
  QrCode, 
  Archive,
  Smartphone
} from "lucide-react";

import { defaultInitialState } from "./defaultState";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const [state, setState] = useState<AppState>(defaultInitialState);
  const [adminSubTab, setAdminSubTab] = useState<"REPORTS" | "EXPENSES" | "SUPPLIERS" | "INVENTORY" | "PRODUCTS" | "COURIERS_TABLES" | "SHIFTS_LOSSES" | "USERS" | "DATABASE">("REPORTS");

  // Check if running on desktop Electron or local cashier PC
  const isDesktopLocal = typeof window !== "undefined" && (
    Boolean((window as any).electron) ||
    Boolean((window as any).electronAPI) ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );

  const [currentMode, setCurrentMode] = useState<"HUB" | "DONER_POS" | "FLOWER_POS" | "FLOWER_WEB" | "ADMIN" | "QR_CUSTOMER" | "SHIFT_CONTROL" | "WAITER_MOBILE">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      // Dedicated director / admin mode parameter
      if (params.get("admin") === "1" || params.get("rehber") === "1" || params.get("mode") === "admin") return "ADMIN";
      if (params.get("waiter") === "1" || params.get("mode") === "waiter") return "WAITER_MOBILE";
      if (params.get("pos") === "1") return "HUB";
      if (params.get("table") || params.get("menu")) return "QR_CUSTOMER";
      
      const isMobileScreen = window.innerWidth < 768;
      // Only phones connecting via network without explicit params default to WAITER_MOBILE
      // POS monitors / PC screens (width >= 768) default to HUB
      if (isMobileScreen && !isDesktopLocal) return "WAITER_MOBILE";
    }
    return "HUB";
  });
  const [qrTableNum, setQrTableNum] = useState<number | null>(null);
  const [isHubQRModalOpen, setIsHubQRModalOpen] = useState(false);

  // Check if phone/mobile format (screen width <= 768px or mobile device)
  const [isPhoneFormat, setIsPhoneFormat] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsPhoneFormat(isMobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Theme state: On phone format, only Light Mode is active
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      if (
        typeof window !== "undefined" &&
        (window.innerWidth <= 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      ) {
        return "light";
      }
      return (localStorage.getItem("app_theme") as "dark" | "light") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const isMobile = isPhoneFormat || currentMode === "WAITER_MOBILE";
    if (isMobile || theme === "light") {
      document.documentElement.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
    }
    if (!isMobile) {
      localStorage.setItem("app_theme", theme);
    }
  }, [theme, isPhoneFormat, currentMode]);

  const toggleTheme = () => {
    if (isPhoneFormat || currentMode === "WAITER_MOBILE") return;
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  // Authentication & Shift state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("currentUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isShiftLoading, setIsShiftLoading] = useState(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    if (user.role === "ADMIN") {
      setCurrentMode("ADMIN");
    } else {
      setCurrentMode("HUB");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setCurrentMode("HUB");
  };

  const handleStartShift = async (startingCash: number) => {
    if (!currentUser) return;
    setIsShiftLoading(true);
    try {
      const res = await fetch("/api/shift/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, startingCash })
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
      } else {
        alert(data.error || "Xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      alert("Növbə açıla bilmədi.");
    } finally {
      setIsShiftLoading(false);
    }
  };

  const handleEndShift = async (
    actualCash: number,
    cashHandover?: {
      amount: number;
      recipient: string;
      supplierId?: string;
      supplierName?: string;
      note?: string;
      adminPin?: string;
    },
    posAllocation?: {
      amount: number;
      allocatedTo: string;
      supplierId?: string;
      supplierName?: string;
      note?: string;
      adminPin?: string;
    },
    adminPin?: string
  ) => {
    setIsShiftLoading(true);
    try {
      const pin = adminPin || cashHandover?.adminPin || posAllocation?.adminPin;
      const res = await fetch("/api/shift/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualCashInDrawer: actualCash,
          cashHandover,
          posAllocation,
          adminPin: pin
        })
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        const diff = data.shift.difference;
        let msg = `Növbə uğurla bağlandı və sıfırlandı!\n\n` +
          `• Gözlənilən nəğd: ${data.shift.expectedCash.toFixed(2)} ₼\n` +
          `• Real nəğd: ${data.shift.actualCashInDrawer.toFixed(2)} ₼\n`;

        if (diff < 0) {
          msg += `⚠️ KƏSİR (Defisit): ${Math.abs(diff).toFixed(2)} ₼\n`;
        } else if (diff > 0) {
          msg += `❇️ ARTIQ: ${diff.toFixed(2)} ₼\n`;
        } else {
          msg += `✅ Kassa balansı tamamdır!\n`;
        }

        if (data.shift.cashHandover) {
          const supText = data.shift.cashHandover.supplierName ? ` [Təchizatçı: ${data.shift.cashHandover.supplierName}]` : "";
          msg += `\n💵 Nağd Təhvili: ${data.shift.cashHandover.amount.toFixed(2)} ₼ -> ${data.shift.cashHandover.recipient}${supText} (${data.shift.cashHandover.isConfirmed ? "✅ Təsdiqləndi" : "⏳ Rəhbər təsdiqi gözləyir"})`;
        }

        if (data.shift.posAllocation && data.shift.posAllocation.amount > 0) {
          const supText = data.shift.posAllocation.supplierName ? ` [Təchizatçı: ${data.shift.posAllocation.supplierName}]` : "";
          msg += `\n💳 POS Ayrılması: ${data.shift.posAllocation.amount.toFixed(2)} ₼ -> ${data.shift.posAllocation.allocatedTo}${supText} (${data.shift.posAllocation.isConfirmed ? "✅ Ödənildi və Təsdiqləndi" : "⏳ Ödəniş və Rəhbər Təsdiqi Gözləyir"})`;
        }

        alert(msg);
        handleLogout();
      } else {
        alert(data.error || "Xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      alert("Növbə bağlana bilmədi.");
    } finally {
      setIsShiftLoading(false);
    }
  };

  const handleRecordLoss = async (itemId: string, name: string, quantity: number, unit: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/inventory/loss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, name, quantity, unit, reason })
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        return true;
      } else {
        alert(data.error || "Xəta baş verdi");
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Poll intervals & smart version tracking to eliminate UI freezing
  const [lastCheckTime, setLastCheckTime] = useState<string>("");
  const lastKnownVersionRef = React.useRef<number>(0);
  const isFetchingRef = React.useRef<boolean>(false);

  // Fetch full state on mount or when server state version changes
  const fetchFullState = async () => {
    try {
      const response = await fetch("/api/state");
      const data = await response.json();
      setState(data);
      setLastCheckTime(new Date().toLocaleTimeString("az-AZ"));
    } catch (err) {
      console.error("Error loading state from server", err);
    }
  };

  // Ultra-lightweight sync check (only checks a tiny number instead of multi-MB state)
  const syncCheck = async (force = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (force || lastKnownVersionRef.current === 0) {
        await fetchFullState();
        try {
          const vRes = await fetch("/api/state/version");
          const vData = await vRes.json();
          if (vData && typeof vData.version === "number") {
            lastKnownVersionRef.current = vData.version;
          }
        } catch {}
      } else {
        const vRes = await fetch("/api/state/version");
        const vData = await vRes.json();
        if (vData && typeof vData.version === "number" && vData.version !== lastKnownVersionRef.current) {
          lastKnownVersionRef.current = vData.version;
          await fetchFullState();
        } else {
          setLastCheckTime(new Date().toLocaleTimeString("az-AZ"));
        }
      }
    } catch (err) {
      console.error("Sync check error:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const fetchState = () => {
    syncCheck(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get("table");
    const menuParam = params.get("menu");
    const posParam = params.get("pos");
    const waiterParam = params.get("waiter");
    const modeParam = params.get("mode");

    if (tableParam) {
      const tNum = parseInt(tableParam);
      if (tNum && !isNaN(tNum)) {
        setQrTableNum(tNum);
      }
    }

    const isMobileScreen = typeof window !== "undefined" && window.innerWidth < 768;
    const adminParam = params.get("admin") === "1" || params.get("rehber") === "1" || modeParam === "admin";

    if (adminParam) {
      setCurrentMode("ADMIN");
    } else if (waiterParam === "1" || modeParam === "waiter") {
      setCurrentMode("WAITER_MOBILE");
    } else if (posParam === "1") {
      setCurrentMode("HUB");
    } else if (menuParam !== null || tableParam) {
      setCurrentMode("QR_CUSTOMER");
    } else if (isMobileScreen && !isDesktopLocal) {
      setCurrentMode("WAITER_MOBILE");
    }

    // Initial load
    syncCheck(true);

    // 1. Server-Sent Events (SSE) for instant ~50ms live updates between POS and waiter phones
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.addEventListener("stateChange", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && typeof data.version === "number" && data.version !== lastKnownVersionRef.current) {
            lastKnownVersionRef.current = data.version;
            fetchFullState();
          }
        } catch (err) {
          console.error("SSE parse error", err);
        }
      });
    } catch (err) {
      console.warn("SSE connection error", err);
    }

    // 2. Poll lightweight server version every 2.5 seconds as fallback
    const interval = setInterval(() => {
      syncCheck(false);
    }, 2500);

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleUpdateState = (newState: AppState, newVersion?: number) => {
    setState(newState);
    if (typeof newVersion === "number") {
      lastKnownVersionRef.current = newVersion;
    } else {
      lastKnownVersionRef.current = (lastKnownVersionRef.current || 0) + 1;
    }
  };

  // Systems Restore Seed Data
  const handleRestoreDefaults = async () => {
    if (!window.confirm("Bütün mövcud sifarişləri, xərcləri və tənzimləmələri silib sistemi İLKİN SIFIRLAMA datasına qaytarmaq istəyirsiniz?")) return;
    
    try {
      const response = await fetch("/api/state");
      // Server-side resets by writing state, or just let server restart
      // Let's do a trick: we post empty states but preserve default products
      if (state) {
        const freshState: AppState = {
          ...state,
          tables: Array.from({ length: 12 }, (_, i) => ({
            tableNumber: i + 1,
            status: "EMPTY",
            items: [],
            subtotal: 0
          })),
          donerOrders: [],
          flowerOrders: [],
          expenses: [
            { id: "e1", title: "Köz Dönər - Ət və Toyuq alışı", amount: 120.0, category: "Məhsul", date: "2026-07-15", business: BusinessType.Doner },
            { id: "e2", title: "Gül Dükanı - Hollandiyadan idxal", amount: 250.0, category: "Məhsul", date: "2026-07-16", business: BusinessType.Flower }
          ],
          tableCount: 12
        };

        const res = await fetch("/api/state/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(freshState)
        });
        const d = await res.json();
        if (d.success) {
          setState(d.state);
          alert("Sistem uğurla ilkin vəziyyətinə sıfırlandı!");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const topThemeBtn = isPhoneFormat || currentMode === "WAITER_MOBILE" ? null : (
    <button
      type="button"
      onClick={toggleTheme}
      id="theme-toggle-top-btn"
      className="hidden md:flex fixed top-3 right-4 z-50 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-amber-400 hover:text-amber-300 py-1.5 px-3 rounded-full shadow-xl backdrop-blur-md items-center space-x-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 group text-xs select-none"
      title={theme === "dark" ? "Açıq Rejimə Keç (Light Mode)" : "Tünd Rejimə Keç (Dark Mode)"}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
          <span className="font-semibold text-slate-200 text-[11px]">Açıq Rejim</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-400 group-hover:-rotate-12 transition-transform" />
          <span className="font-semibold text-slate-800 text-[11px]">Tünd Rejim</span>
        </>
      )}
    </button>
  );

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Kassa POS yüklənir...</p>
        {topThemeBtn}
      </div>
    );
  }

  // Mobile Waiter Screen Routing (Accessible directly from smartphones)
  if (currentMode === "WAITER_MOBILE") {
    return (
      <>
        <WaiterMobile
          state={state}
          onUpdateState={handleUpdateState}
          onBackToHub={() => setCurrentMode("HUB")}
          currentUser={currentUser}
        />
        {topThemeBtn}
      </>
    );
  }

  // QR Customer digital menu view mode routing
  if (currentMode === "QR_CUSTOMER") {
    return (
      <>
        <QRMenu
          tableNumber={qrTableNum || undefined}
          state={state}
          onUpdateState={handleUpdateState}
        />
        {topThemeBtn}
      </>
    );
  }

  // Flower Shop Web (E-commerce) bypasses cashier login for customer simulator
  if (currentMode === "FLOWER_WEB") {
    return (
      <>
        <FlowerShopWeb
          state={state}
          onUpdateState={handleUpdateState}
          onBackToHub={() => setCurrentMode(currentUser ? "HUB" : "HUB")}
        />
        {topThemeBtn}
      </>
    );
  }

  // Dedicated Director / Admin Portal Login
  if (currentMode === "ADMIN" && currentUser?.role !== "ADMIN") {
    return (
      <>
        <DirectorLogin
          users={state.users || []}
          onLogin={(adminUser) => {
            handleLogin(adminUser);
            setCurrentMode("ADMIN");
          }}
          onBackToHub={() => setCurrentMode("HUB")}
        />
        {topThemeBtn}
      </>
    );
  }

  // Login Screen Routing
  if (!currentUser) {
    return (
      <>
        <LoginScreen
          users={state.users || []}
          onLogin={handleLogin}
          onOpenDirectorLogin={() => setCurrentMode("ADMIN")}
        />
        {topThemeBtn}
      </>
    );
  }

  // Active shift retrieval
  const activeShift = state.shifts?.find(s => s.status === "ACTIVE");

  // Shift checks for cashier OR any user in SHIFT_CONTROL mode
  const isOurShift = activeShift && activeShift.userId === currentUser.id;
  if ((currentUser.role === "CASHIER" && !isOurShift) || currentMode === "SHIFT_CONTROL") {
    return (
      <>
        <ShiftControl
          currentUser={currentUser}
          activeShift={activeShift}
          state={state}
          onStartShift={handleStartShift}
          onEndShift={handleEndShift}
          onLogout={handleLogout}
          isLoading={isShiftLoading}
          onBackToHub={() => setCurrentMode("HUB")}
          onUpdateState={handleUpdateState}
        />
        {topThemeBtn}
      </>
    );
  }

  // Detect any active table that has order placed but not yet completed
  const activeTablesCount = (state.tables || []).filter(t => t.status === "ORDERED").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* HUB PORTAL VIEW */}
      {currentMode === "HUB" && (
        <div className="flex-1 flex flex-col">
          
          {/* Top Banner Status */}
          <section className="bg-slate-900 border-b border-slate-800/80 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
              <span className="font-semibold text-slate-300">Server: Aktiv</span>
              <span className="text-slate-700">•</span>
              <span>Son sinxronizasiya: <span className="font-mono text-slate-300">{lastCheckTime}</span></span>
              <span className="text-slate-700">•</span>
              <span className="bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase text-[9px]">
                İstifadəçi: {currentUser?.name} ({currentUser?.role === "ADMIN" ? "Rəhbərlik" : "Kassir"})
              </span>
            </div>

            <div className="flex items-center space-x-3.5 pr-28 sm:pr-32">
              <button
                onClick={fetchState}
                className="text-slate-400 hover:text-white flex items-center space-x-1 font-bold cursor-pointer transition-colors py-1 px-2 rounded hover:bg-slate-800/60"
                title="Databaseni yenilə"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yenilə</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminSubTab("INVENTORY");
                  setCurrentMode("ADMIN");
                }}
                className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Anbar və Xammal Qalıqları İdarəetməsi"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>📦 Anbar Uçotu</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHubQRModalOpen(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Vahid QR Menyu Koduna Bax və Çap Et"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Menyu Kodu</span>
              </button>

              {currentUser?.role === "CASHIER" && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentMode("SHIFT_CONTROL")}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Növbəni Bağla</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLossModalOpen(true)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>İtki Qeydi</span>
                  </button>
                </>
              )}

              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800 rounded-lg py-1 px-2.5 font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıxış</span>
              </button>
            </div>
          </section>

          {/* Core Hub Dashboard Area */}
          <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center space-y-10">
            
            {/* Title / Brand Presentation */}
            <div className="text-center max-w-xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-2 bg-indigo-500/15 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                <span>Vahid Kassa Portalı v2.0</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white font-display tracking-tight leading-none">
                Kassa & Sifariş Portalı
              </h1>
              {currentUser?.role === "CASHIER" ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 max-w-sm mx-auto mt-2 text-left space-y-3 shadow-lg shadow-indigo-950/5">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">AKTİV İŞ NÖVBƏNİZ</span>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Açılış vaxtı:</span>
                      <span className="font-mono text-white font-bold">
                        {activeShift ? new Date(activeShift.startTime).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">İlkin kassa nəğd:</span>
                      <span className="font-mono text-white font-bold">{activeShift?.startingCash?.toFixed(2)} ₼</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentMode("SHIFT_CONTROL")}
                    className="w-full mt-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center block"
                  >
                    Növbəni İdarə Et & Kassanı Bağla
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 text-xs md:text-sm leading-normal">
                  Köz Dönər və Zərif Güllər mağazaları üçün vahid kassa satışı, anbar uçotu, QR-kod masa menyusu, kuryer çatdırılması və xərclərin idarə edilməsi mərkəzi.
                </p>
              )}
            </div>

            {/* Quick Live Notifications Banner for QR and Web orders */}
            {currentUser?.role === "CASHIER" && (activeTablesCount > 0 || (state.flowerOrders || []).filter(o => o.orderType === "WEB").length > 0) && (
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-start space-x-3.5 max-w-2xl mx-auto animate-pulse">
                <BellRing className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 text-slate-300">
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <span>Sistemdə Yeni Bildiriş var!</span>
                  </div>
                  <p>
                    {activeTablesCount > 0 && `⚠️ ${activeTablesCount} masada QR-kodla verilmiş aktiv müştəri sifarişi var! `}
                    {(state.flowerOrders || []).filter(o => o.orderType === "WEB").length > 0 && `🌸 Gül dükanına onlayn saytdan sifariş daxil olub.`}
                  </p>
                </div>
              </div>
            )}

            {/* Selection Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto w-full">
              
              {/* CARD 1: KOZ DONER POS - Only for cashiers / admins */}
              {(currentUser?.role === "CASHIER" || currentUser?.role === "ADMIN") && (
                <div 
                  onClick={() => setCurrentMode("DONER_POS")}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-orange-950/5 relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl group-hover:bg-orange-600/10 transition-colors"></div>
                  
                  <div className="space-y-4">
                    <div className="bg-orange-600 text-white p-3 rounded-2xl w-fit shadow-md shadow-orange-950/20">
                      <ChefHat className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white font-display group-hover:text-orange-400 transition-colors flex items-center space-x-1.5">
                        <span>Köz Dönər POS</span>
                        {activeTablesCount > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-ping"></span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 leading-normal">
                        Masa xidmətləri, QR-kod sifariş idarəsi, XP printer qəbzləri və Wolt/nağd ödənişlər.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-850 pt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-orange-400 transition-colors">
                    <span>Kassanı Aç</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* CARD 2: MOBILE WAITER ORDERING (Smartfon Sifariş) */}
              <div 
                onClick={() => setCurrentMode("WAITER_MOBILE")}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-amber-950/5 relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-amber-600/5 rounded-full blur-2xl group-hover:bg-amber-600/10 transition-colors"></div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-tr from-amber-600 to-orange-600 text-white p-3 rounded-2xl w-fit shadow-md shadow-amber-950/20">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white font-display group-hover:text-amber-400 transition-colors flex items-center space-x-1.5">
                      <span>Mobil Ofisiant Rejimi</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Smartfon</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1.5 leading-normal">
                      Telefonla masaya yaxınlaşıb sifarişi qəbul etmək, tərkibi seçmək və kassa monitoruna canlı ötürmək.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-850 pt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                  <span>Mobil Rejimi Aç</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* CARD 3: FLOWER POS - Only for cashiers / admins */}
              {(currentUser?.role === "CASHIER" || currentUser?.role === "ADMIN") && (
                <div 
                  onClick={() => setCurrentMode("FLOWER_POS")}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-emerald-950/5 relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-600/5 rounded-full blur-2xl group-hover:bg-emerald-600/10 transition-colors"></div>

                  <div className="space-y-4">
                    <div className="bg-emerald-600 text-white p-3 rounded-2xl w-fit shadow-md shadow-emerald-950/20">
                      <Flower className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white font-display group-hover:text-emerald-400 transition-colors">
                        Gül Satışı POS
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 leading-normal">
                        Floristika, aksesuarlar, hədiyyəlik kart və xüsusi çatdırılma ünvanlarının qeydiyyatı.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-850 pt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                    <span>Gül POS-u Aç</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* CARD 3: FLOWER E-COMMERCE WEBSITE - Only for admins */}
              {currentUser?.role === "ADMIN" && (
                <div 
                  onClick={() => setCurrentMode("FLOWER_WEB")}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-pink-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-pink-950/5 relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-colors"></div>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-tr from-pink-500 to-rose-500 text-white p-3 rounded-2xl w-fit shadow-md">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white font-display group-hover:text-pink-400 transition-colors">
                        Gül Satış Saytı
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 leading-normal">
                        Müştəri üçün kolleksiyalar və onlayn sifariş saytının tam simulyasiyası.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-850 pt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-pink-400 transition-colors">
                    <span>Sayta keçid et</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* CARD 4: ADMIN HUB & REPORTS - Only for admins */}
              {currentUser?.role === "ADMIN" && (
                <div 
                  onClick={() => setCurrentMode("ADMIN")}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-indigo-950/5 relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>

                  <div className="space-y-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl w-fit shadow-md shadow-indigo-950/20">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white font-display group-hover:text-indigo-400 transition-colors">
                        Admin Panel & Rəhbərlik
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 leading-normal">
                        Maliyyə hesabatları, xərclər jurnalı, kuryer çatdırılma hesabatları və anbar tənzimləmələri.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-850 pt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                    <span>Admin Panelə gir</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* CARD 5: ANBAR & XAMMAL UÇOTU - For all cashiers & admins */}
              {(currentUser?.role === "CASHIER" || currentUser?.role === "ADMIN") && (
                <div 
                  onClick={() => {
                    setAdminSubTab("INVENTORY");
                    setCurrentMode("ADMIN");
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-indigo-950/5 relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-2xl group-hover:bg-indigo-600/10 transition-colors"></div>

                  <div className="space-y-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl w-fit shadow-md shadow-indigo-950/20">
                      <Archive className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white font-display group-hover:text-indigo-400 transition-colors">
                        📦 Anbar & Xammal Uçotu
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 leading-normal">
                        Ət, toyuq, çörək, lavaş, içkilər, gündəlik istifadə/silinmə jurnalı və kritik qalıq bildirişləri.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-850 pt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
                    <span>Anbarı Aç</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* CARD 6: QR MENYU & MASALAR - For all cashiers / admins */}
              <div 
                onClick={() => setIsHubQRModalOpen(true)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-amber-950/5 relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-amber-600/5 rounded-full blur-2xl group-hover:bg-amber-600/10 transition-colors"></div>

                <div className="space-y-4">
                  <div className="bg-amber-600 text-white p-3 rounded-2xl w-fit shadow-md shadow-amber-950/20">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white font-display group-hover:text-amber-400 transition-colors">
                      Masa QR Menyu & Çap
                    </h3>
                    <p className="text-slate-400 text-xs mt-1.5 leading-normal">
                      Bütün masaların vizual QR kodlarına baxış, telefonla skan testi və masa üstü çap kartları.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-850 pt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                  <span>QR Kodları Göstər</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

            </div>

            {/* Explanatory System note / Reset tools */}
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-850/60 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start space-x-3 text-xs text-slate-400">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Sistem qeydləri:</span>
                  <span>Masa QR-kodları, onlayn sifarişlər və kassa POS eyni serverə bağlıdır və real-time sinxronlaşır.</span>
                </div>
              </div>
            </div>

          </main>

          {/* Hub Footer */}
          <footer className="text-center py-6 text-[10px] text-slate-500 font-medium tracking-wide">
            © 2026 Kassa POS Sistemi • Bütün hüquqlar qorunur.
          </footer>

        </div>
      )}

      {/* DETAILED VIEWS ROUTED FROM HUB */}
      {currentMode === "DONER_POS" && (
        <ErrorBoundary fallbackTitle="Köz Dönər POS Xətası" onReset={() => setCurrentMode("HUB")}>
          <KozDonerPOS
            state={state}
            onUpdateState={handleUpdateState}
            onBackToHub={() => setCurrentMode("HUB")}
          />
        </ErrorBoundary>
      )}

      {currentMode === "FLOWER_POS" && (
        <ErrorBoundary fallbackTitle="Gül Satışı POS Xətası" onReset={() => setCurrentMode("HUB")}>
          <FlowerShopPOS
            state={state}
            onUpdateState={handleUpdateState}
            onBackToHub={() => setCurrentMode("HUB")}
          />
        </ErrorBoundary>
      )}

      {currentMode === "FLOWER_WEB" && (
        <ErrorBoundary fallbackTitle="Gül Saytı Xətası" onReset={() => setCurrentMode("HUB")}>
          <FlowerShopWeb
            state={state}
            onUpdateState={handleUpdateState}
            onBackToHub={() => setCurrentMode("HUB")}
          />
        </ErrorBoundary>
      )}

      {currentMode === "ADMIN" && (
        <ErrorBoundary fallbackTitle="Admin Panel Xətası" onReset={() => setCurrentMode("HUB")}>
          <AdminPanel
            state={state}
            initialSubTab={adminSubTab}
            onUpdateState={handleUpdateState}
            onBackToHub={() => {
              setAdminSubTab("REPORTS");
              if (currentUser?.role === "ADMIN") {
                handleLogout();
              } else {
                setCurrentMode("HUB");
              }
            }}
          />
        </ErrorBoundary>
      )}

      {/* Inventory Loss Modal */}
      <InventoryLossModal
        isOpen={isLossModalOpen}
        onClose={() => setIsLossModalOpen(false)}
        inventoryItems={state.inventoryItems || []}
        donerProducts={state.donerProducts || []}
        flowerProducts={state.flowerProducts || []}
        onRecordLoss={handleRecordLoss}
      />

      {/* Global Hub Table QR Code Modal */}
      {isHubQRModalOpen && (
        <TableQRModal
          initialTableNumber="ALL"
          tables={state.tables || []}
          onClose={() => setIsHubQRModalOpen(false)}
        />
      )}

      {/* Global Top Theme Switcher */}
      {topThemeBtn}

    </div>
  );
}
