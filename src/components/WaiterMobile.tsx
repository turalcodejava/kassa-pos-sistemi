import React, { useState, useEffect, useMemo } from "react";
import { AppState, TableState, Product, OrderItem, User } from "../types";
import { 
  Utensils, 
  Search, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Lock, 
  CheckCircle2, 
  Flame, 
  ChevronRight, 
  Users, 
  Send, 
  AlertCircle,
  AlertTriangle,
  Clock,
  X,
  RefreshCw,
  LogOut,
  Smartphone,
  Check
} from "lucide-react";


interface WaiterMobileProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onBackToHub?: () => void;
  currentUser?: User | null;
}

export default function WaiterMobile({
  state,
  onUpdateState,
  onBackToHub,
  currentUser: initialUser
}: WaiterMobileProps) {
  // Device ID generation / persistence for this smartphone
  const [deviceId] = useState<string>(() => {
    let saved = localStorage.getItem("waiter_mobile_device_id");
    if (!saved) {
      saved = "phone_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now().toString(36);
      localStorage.setItem("waiter_mobile_device_id", saved);
    }
    return saved;
  });

  // Waiter identity
  const [waiterName, setWaiterName] = useState<string>(() => {
    if (initialUser?.name) return initialUser.name;
    const saved = localStorage.getItem("waiter_mobile_name");
    return saved || "Ofisiant";
  });

  const [isChangingName, setIsChangingName] = useState(false);
  const [nameInput, setNameInput] = useState(waiterName);

  // Active view: "TABLES" or "ORDER"
  const [activeView, setActiveView] = useState<"TABLES" | "ORDER">("TABLES");
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null);

  // Cart for active table
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [guestCount, setGuestCount] = useState<number>(2);

  // Product filtering
  const [selectedCategory, setSelectedCategory] = useState<string>("Hamısı");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Ingredient customization modal
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [itemNote, setItemNote] = useState<string>("");

  // Cart review sheet
  const [isCartSheetOpen, setIsCartSheetOpen] = useState<boolean>(false);

  // Conflict / Locked table modal
  const [lockedModalInfo, setLockedModalInfo] = useState<{
    tableNumber: number;
    waiterName: string;
    deviceName: string;
    lockedAt: string;
  } | null>(null);

  // Status message / toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1-minute unsent kitchen order timer on mobile
  const [showMobileUnsentAlert, setShowMobileUnsentAlert] = useState(false);
  useEffect(() => {
    if (activeView === "ORDER" && selectedTableNumber && cartItems.length > 0) {
      const timer = setTimeout(() => {
        setShowMobileUnsentAlert(true);
      }, 60000); // 1 minute (60 seconds)
      return () => clearTimeout(timer);
    } else {
      setShowMobileUnsentAlert(false);
    }
  }, [activeView, selectedTableNumber, cartItems]);

  // Extract products and categories
  const products = state.donerProducts || [];

  // Aggregate total sales count per product (from orders + product.totalSold)
  const productSalesMap = useMemo(() => {
    const map: Record<string, number> = {};
    (state.donerOrders || []).forEach(order => {
      if (order.status !== "CANCELLED") {
        (order.items || []).forEach(item => {
          map[item.productId] = (map[item.productId] || 0) + (item.quantity || 1);
        });
      }
    });
    (state.donerProducts || []).forEach(p => {
      map[p.id] = Math.max(map[p.id] || 0, p.totalSold || 0);
    });
    return map;
  }, [state.donerOrders, state.donerProducts]);

  const categories = useMemo(() => {
    const distinct = Array.from(new Set(products.map(p => p.category)));
    return ["Hamısı", "🔥 Ən Çox Satılanlar", ...distinct];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = products.filter(p => {
      if (selectedCategory === "🔥 Ən Çox Satılanlar") {
        return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      const matchCat = selectedCategory === "Hamısı" || p.category === selectedCategory;
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    if (selectedCategory === "🔥 Ən Çox Satılanlar") {
      const topSold = list.filter(p => (productSalesMap[p.id] || 0) > 0);
      list = topSold.length > 0 ? topSold : list.slice(0, 8);
    }

    // Sort descending by sales count: most sold items appear first!
    return list.slice().sort((a, b) => {
      const salesA = productSalesMap[a.id] || 0;
      const salesB = productSalesMap[b.id] || 0;
      if (salesB !== salesA) {
        return salesB - salesA;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [products, selectedCategory, searchQuery, productSalesMap]);

  // Cart calculation
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const cartTotalItemsCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Handle table selection & locking
  const handleSelectTable = async (table: TableState) => {
    const now = Date.now();
    // 1. Check if table is locked by someone else
    if (table.lockedBy && table.lockedBy.expiresAt > now && table.lockedBy.deviceId !== deviceId) {
      setLockedModalInfo({
        tableNumber: table.tableNumber,
        waiterName: table.lockedBy.waiterName || "Başqa istifadəçi",
        deviceName: table.lockedBy.deviceName || "Mobil Cihaz",
        lockedAt: table.lockedBy.lockedAt || new Date().toISOString()
      });
      return;
    }

    // 2. Request lock from server
    try {
      const res = await fetch("/api/table/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: table.tableNumber,
          deviceId,
          deviceName: "Mobil Telefon (" + (navigator.userAgent.includes("iPhone") ? "iPhone" : "Android") + ")",
          waiterName: waiterName || "Ofisiant",
          ttlSeconds: 120
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.lockedBy) {
          setLockedModalInfo({
            tableNumber: table.tableNumber,
            waiterName: data.lockedBy.waiterName || "Digər cihaz",
            deviceName: data.lockedBy.deviceName || "Mobil Cihaz",
            lockedAt: data.lockedBy.lockedAt || new Date().toISOString()
          });
        } else {
          showToast(data.error || "Masa açıla bilmədi", "error");
        }
        return;
      }

      if (data.state) {
        onUpdateState(data.state);
      }

      // Enter order mode
      setSelectedTableNumber(table.tableNumber);
      setCartItems(table.items || []);
      setGuestCount(table.guestCount || (table.items?.length ? 2 : 2));
      setActiveView("ORDER");
      setIsCartSheetOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Server bağlantı xətası!", "error");
    }
  };

  // Heartbeat while order view is active
  useEffect(() => {
    if (activeView !== "ORDER" || !selectedTableNumber) return;

    const interval = setInterval(async () => {
      try {
        await fetch("/api/table/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber: selectedTableNumber,
            deviceId,
            ttlSeconds: 120
          })
        });
      } catch (e) {
        console.error("Heartbeat error", e);
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [activeView, selectedTableNumber, deviceId]);

  // Release lock on unmount or browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedTableNumber) {
        navigator.sendBeacon(
          "/api/table/unlock",
          JSON.stringify({ tableNumber: selectedTableNumber, deviceId })
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedTableNumber, deviceId]);

  // Exit table order and unlock
  const handleExitTable = async () => {
    if (selectedTableNumber) {
      try {
        const res = await fetch("/api/table/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber: selectedTableNumber,
            deviceId
          })
        });
        const data = await res.json();
        if (data.state) onUpdateState(data.state);
      } catch (e) {
        console.error("Unlock error", e);
      }
    }

    setSelectedTableNumber(null);
    setCartItems([]);
    setIsCartSheetOpen(false);
    setActiveView("TABLES");
  };

  // Add standard product directly
  const handleAddProduct = (product: Product) => {
    setCartItems(prev => {
      const idx = prev.findIndex(item => 
        item.productId === product.id && 
        (!item.removedIngredients || item.removedIngredients.length === 0) &&
        !item.itemNote
      );

      if (idx > -1) {
        return prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            removedIngredients: [],
            itemNote: undefined
          }
        ];
      }
    });
  };

  // Decrease quantity of standard product
  const handleDecreaseProduct = (product: Product) => {
    setCartItems(prev => {
      const idx = prev.findIndex(item => 
        item.productId === product.id && 
        (!item.removedIngredients || item.removedIngredients.length === 0) &&
        !item.itemNote
      );

      if (idx > -1) {
        if (prev[idx].quantity > 1) {
          return prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity - 1 } : item);
        } else {
          return prev.filter((_, i) => i !== idx);
        }
      }
      return prev;
    });
  };

  // Get current quantity of a product in cart
  const getProductQuantityInCart = (productId: string) => {
    return cartItems
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Open custom ingredients modal
  const handleOpenCustomization = (product: Product) => {
    setCustomizingProduct(product);
    setRemovedIngredients([]);
    setItemNote("");
  };

  // Toggle ingredient removal
  const toggleRemovedIngredient = (ing: string) => {
    setRemovedIngredients(prev => 
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  // Confirm custom item
  const handleConfirmCustomItem = () => {
    if (!customizingProduct) return;
    const cleanNote = itemNote.trim() || undefined;

    setCartItems(prev => {
      const idx = prev.findIndex(item => {
        const arr1 = item.removedIngredients || [];
        const arr2 = removedIngredients || [];
        const sameRemoved = arr1.length === arr2.length && arr1.every(val => arr2.includes(val));
        const sameNote = (item.itemNote || "") === (cleanNote || "");
        return item.productId === customizingProduct.id && sameRemoved && sameNote;
      });

      if (idx > -1) {
        return prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [
          ...prev,
          {
            productId: customizingProduct.id,
            name: customizingProduct.name,
            price: customizingProduct.price,
            quantity: 1,
            removedIngredients: [...removedIngredients],
            itemNote: cleanNote
          }
        ];
      }
    });

    setCustomizingProduct(null);
    showToast(`${customizingProduct.name} əlavə edildi`, "success");
  };

  // Submit Order to Server & Unlock Table
  const handleSubmitOrder = async () => {
    if (!selectedTableNumber) return;
    if (cartItems.length === 0) {
      showToast("Səbət boşdur! Ən az bir məhsul əlavə edin.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/table/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: selectedTableNumber,
          items: cartItems,
          status: "ORDERED",
          guestCount,
          unlockAfter: true
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.state) onUpdateState(data.state);
        showToast(`✅ Masa ${selectedTableNumber} sifarişi qeydə alındı!`, "success");
        setSelectedTableNumber(null);
        setCartItems([]);
        setIsCartSheetOpen(false);
        setActiveView("TABLES");
      } else {
        showToast(data.error || "Sifariş saxlanıla bilmədi", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Şəbəkə xətası! Yenidən cəhd edin.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save waiter name
  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setWaiterName(trimmed);
      localStorage.setItem("waiter_mobile_name", trimmed);
    }
    setIsChangingName(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans max-w-md mx-auto relative select-none shadow-2xl border-x border-slate-900 pb-20">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-bounce transition-all ${
          toastMessage.type === "success" 
            ? "bg-emerald-600 text-white shadow-emerald-950/50" 
            : toastMessage.type === "error"
            ? "bg-rose-600 text-white shadow-rose-950/50"
            : "bg-slate-800 text-white border border-slate-700"
        }`}>
          {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ================= VIEW 1: TABLES GRID ================= */}
      {activeView === "TABLES" && (
        <div className="flex flex-col flex-1">
          
          {/* Mobile Header */}
          <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-950/50">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-black text-white font-display tracking-tight flex items-center space-x-1">
                    <span>Köz Xəzər Dönər</span>
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded-md font-bold">Ofisiant</span>
                  </h1>
                  
                  {isChangingName ? (
                    <div className="flex items-center space-x-1 mt-0.5">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Adınız..."
                        className="bg-slate-950 text-white text-[11px] px-2 py-0.5 rounded border border-orange-500 focus:outline-none w-24"
                        autoFocus
                      />
                      <button onClick={handleSaveName} className="p-0.5 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setNameInput(waiterName); setIsChangingName(true); }}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                      title="Adı dəyiş"
                    >
                      <span>👤 {waiterName}</span>
                      <span className="text-[9px] text-orange-400 font-bold underline">(dəyiş)</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-[10px] text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Canlı POS</span>
                </div>
                {onBackToHub && (
                  <button 
                    onClick={onBackToHub}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Kassa Ana Menyuya qayıt"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Subheader summary */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-center text-xs">
              <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 block">Cəmi Masa</span>
                <span className="font-extrabold text-white">{state.tables?.length || 12}</span>
              </div>
              <div className="bg-emerald-950/30 p-1.5 rounded-xl border border-emerald-900/30">
                <span className="text-[10px] text-emerald-400 block">Boş</span>
                <span className="font-extrabold text-emerald-300">
                  {(state.tables || []).filter(t => t.status === "EMPTY").length}
                </span>
              </div>
              <div className="bg-orange-950/30 p-1.5 rounded-xl border border-orange-900/30">
                <span className="text-[10px] text-orange-400 block">Sifarişdə</span>
                <span className="font-extrabold text-orange-300">
                  {(state.tables || []).filter(t => t.status === "ORDERED").length}
                </span>
              </div>
            </div>
          </header>

          {/* Tables Instruction */}
          <div className="px-4 pt-3 pb-1 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Sifariş qəbul etmək üçün masanı seçin:</span>
            <span className="text-[10px] text-orange-400 font-bold">📱 Sürətli Daxilolma</span>
          </div>

          {/* Tables Grid */}
          <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto">
            {(state.tables || []).map((table) => {
              const now = Date.now();
              const isLockedByOther = table.lockedBy && table.lockedBy.expiresAt > now && table.lockedBy.deviceId !== deviceId;
              const isLockedByMe = table.lockedBy && table.lockedBy.expiresAt > now && table.lockedBy.deviceId === deviceId;
              const isOrdered = table.status === "ORDERED";

              return (
                <div
                  key={table.tableNumber}
                  onClick={() => handleSelectTable(table)}
                  className={`relative p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between active:scale-[0.98] cursor-pointer shadow-sm ${
                    isLockedByOther
                      ? "bg-rose-950/20 border-rose-500/50 ring-1 ring-rose-500/30"
                      : isLockedByMe
                      ? "bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/40"
                      : isOrdered
                      ? "bg-orange-950/20 border-orange-500/50 shadow-orange-950/20"
                      : "bg-slate-900 hover:bg-slate-850 border-slate-800"
                  }`}
                >
                  {/* Top Header: Table Number & Lock Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-white font-display">
                      Masa #{table.tableNumber}
                    </span>

                    {isLockedByOther ? (
                      <span className="inline-flex items-center space-x-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        <Lock className="w-3 h-3" />
                        <span>Məşğul</span>
                      </span>
                    ) : isOrdered ? (
                      <span className="inline-flex items-center space-x-1 bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        <Flame className="w-3 h-3" />
                        <span>Aktiv</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        <span>Boş</span>
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="space-y-1 my-1">
                    <span className="text-[11px] text-slate-400 block truncate font-medium">
                      {table.tableName || table.section || "Əsas Zal"}
                    </span>

                    {isLockedByOther ? (
                      <div className="text-[10px] text-rose-400 font-semibold bg-rose-950/40 p-1.5 rounded-lg border border-rose-900/30 mt-1">
                        🔒 {table.lockedBy?.waiterName || "Başqa cihaz"} daxil olub
                      </div>
                    ) : isOrdered ? (
                      <div className="pt-1">
                        <div className="text-base font-black text-orange-400 font-display">
                          {Number(table.subtotal || 0).toFixed(2)} ₼
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {table.items?.length || 0} məhsul sifarişdə
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-400/80 font-medium pt-1">
                        Yeni sifariş daxil et ➔
                      </div>
                    )}
                  </div>

                  {/* Card bottom hint */}
                  <div className="pt-2 border-t border-slate-800/60 mt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>{table.capacity ? `${table.capacity} nəfərlik` : "Standart"}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ================= VIEW 2: ORDER ENTRY ================= */}
      {activeView === "ORDER" && selectedTableNumber && (
        <div className="flex flex-col flex-1">
          
          {/* Order Header */}
          <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3.5 sticky top-0 z-30 space-y-2.5">
            <div className="flex items-center justify-between">
              <button
                onClick={handleExitTable}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Geri (Çıxış)</span>
              </button>

              <div className="text-center">
                <span className="font-black text-sm text-white font-display block">
                  Masa #{selectedTableNumber}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Masa Kilidlənib (Sizdədir)</span>
                </span>
              </div>

              {/* Guest Count selector */}
              <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <option key={n} value={n} className="bg-slate-900 text-white">
                      {n} nəfər
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1-Minute Inactivity Alert Banner on Mobile */}
            {showMobileUnsentAlert && (
              <div className="bg-amber-500/20 border border-amber-500/40 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-300 animate-pulse">
                <div className="flex items-center space-x-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold truncate">
                    1 dəqiqədir sifariş mətbəxə göndərilməyib!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartSheetOpen(true)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-black text-[10px] shrink-0 cursor-pointer shadow"
                >
                  Mətbəxə Göndər
                </button>
              </div>
            )}

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Yemək, dönər və ya içki axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-orange-600 text-white shadow-md shadow-orange-950/40"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </header>

          {/* Product Items List */}
          <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
            {filteredProducts.map((product) => {
              const qtyInCart = getProductQuantityInCart(product.id);
              const salesCount = productSalesMap[product.id] || 0;
              const isTopSeller = salesCount > 0;

              return (
                <div
                  key={product.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    qtyInCart > 0 
                      ? "bg-slate-900 border-orange-500/40 shadow-sm" 
                      : isTopSeller
                      ? "bg-slate-900 border-amber-500/35 hover:border-amber-400/60 shadow-sm"
                      : "bg-slate-900/60 border-slate-855 hover:border-slate-800"
                  }`}
                >
                  {/* Left info */}
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                        {product.category}
                      </span>
                      {isTopSeller && (
                        <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold flex items-center space-x-0.5">
                          <Flame className="w-2.5 h-2.5 text-amber-400" />
                          <span>Top Satış ({salesCount})</span>
                        </span>
                      )}
                      {product.category.toLowerCase().includes("dönər") && (
                        <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                          Közdə
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-xs text-white truncate mt-0.5">
                      {product.name}
                    </h3>
                    <div className="text-xs font-black text-orange-400 mt-1">
                      {Number(product.price || 0).toFixed(2)} ₼
                    </div>
                  </div>


                  {/* Right Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Customize button (for ingredients) */}
                    {product.ingredients && product.ingredients.length > 0 && (
                      <button
                        onClick={() => handleOpenCustomization(product)}
                        className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1.5 rounded-xl transition-colors cursor-pointer"
                        title="Tərkibi dəyiş və ya xüsusi qeyd yaz"
                      >
                        Tərkib
                      </button>
                    )}

                    {/* Counter Controls */}
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {qtyInCart > 0 ? (
                        <>
                          <button
                            onClick={() => handleDecreaseProduct(product)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-black text-white">
                            {qtyInCart}
                          </span>
                        </>
                      ) : null}

                      <button
                        onClick={() => handleAddProduct(product)}
                        className={`h-7 rounded-lg flex items-center justify-center font-bold text-white transition-all active:scale-90 cursor-pointer ${
                          qtyInCart > 0 
                            ? "w-7 bg-orange-600 hover:bg-orange-500" 
                            : "px-3 bg-orange-600 hover:bg-orange-500 text-xs"
                        }`}
                      >
                        {qtyInCart > 0 ? (
                          <Plus className="w-3.5 h-3.5" />
                        ) : (
                          <span className="flex items-center space-x-1">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Əlavə et</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 space-y-2 text-slate-500">
                <Utensils className="w-8 h-8 mx-auto text-slate-700" />
                <p className="text-xs">Bu kateqoriyada məhsul tapılmadı.</p>
              </div>
            )}
          </div>

          {/* Sticky Bottom Order Bar */}
          {cartItems.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-30 shadow-2xl flex items-center space-x-2">
              
              {/* Review Cart Button */}
              <button
                onClick={() => setIsCartSheetOpen(true)}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-white p-2.5 rounded-2xl border border-slate-700 flex items-center justify-between text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black">
                    {cartTotalItemsCount}
                  </span>
                  <span>Səbətə bax</span>
                </div>
                <span className="text-orange-400 font-extrabold text-sm font-display">
                  {cartSubtotal.toFixed(2)} ₼
                </span>
              </button>

              {/* Submit to Kitchen Button */}
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-1.5 shadow-lg shadow-orange-950/50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Mətbəxə Göndər</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* ================= MODAL: INGREDIENT CUSTOMIZATION ================= */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-950 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-sm font-black text-white font-display">
                  {customizingProduct.name}
                </h3>
                <span className="text-xs text-orange-400 font-bold">
                  {Number(customizingProduct.price || 0).toFixed(2)} ₼
                </span>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ingredients to remove */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                İnqrediyentləri çıxar (İstəmədiklərinizin üzərinə vurun):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(customizingProduct.ingredients || []).map((ing) => {
                  const isRemoved = removedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      onClick={() => toggleRemovedIngredient(ing)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isRemoved
                          ? "bg-rose-600/20 text-rose-300 border-rose-500 line-through"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {ing} {isRemoved ? "❌" : "✓"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kitchen Note */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Mətbəx üçün xüsusi qeyd:
              </label>
              <input
                type="text"
                placeholder="Məs: sousu bol olsun, az acılı..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirmCustomItem}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-md shadow-orange-950/40 cursor-pointer"
            >
              Fərdiləşdirilmiş Məhsulu Səbətə Əlavə Et
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: CART REVIEW SHEET ================= */}
      {isCartSheetOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-slate-950 border-t border-slate-800 rounded-t-3xl max-w-md w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slideUp shadow-2xl flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-sm font-black text-white font-display">
                  Masa #{selectedTableNumber} - Səbət
                </h3>
                <span className="text-[11px] text-slate-400">
                  {cartTotalItemsCount} məhsul seçilib
                </span>
              </div>
              <button
                onClick={() => setIsCartSheetOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items list */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {cartItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-extrabold text-xs text-white block truncate">
                      {item.name}
                    </span>
                    {item.removedIngredients && item.removedIngredients.length > 0 && (
                      <span className="text-[10px] text-rose-400 block line-clamp-1">
                        Çıxarılan: {item.removedIngredients.join(", ")}
                      </span>
                    )}
                    {item.itemNote && (
                      <span className="text-[10px] text-amber-400 block italic">
                        Qeyd: "{item.itemNote}"
                      </span>
                    )}
                    <span className="text-xs font-black text-orange-400 block mt-0.5">
                      {(item.price * item.quantity).toFixed(2)} ₼
                    </span>
                  </div>

                  {/* Quantity control */}
                  <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      onClick={() => {
                        setCartItems(prev => {
                          if (prev[idx].quantity > 1) {
                            return prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity - 1 } : it);
                          } else {
                            return prev.filter((_, i) => i !== idx);
                          }
                        });
                      }}
                      className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center hover:bg-rose-600 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => {
                        setCartItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it));
                      }}
                      className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center hover:bg-orange-500 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-850 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Masa:</span>
                <span className="font-bold text-white">Masa #{selectedTableNumber}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Qonaq sayı:</span>
                <span className="font-bold text-white">{guestCount} nəfər</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
                <span>Cəmi Məbləğ:</span>
                <span className="text-orange-400 text-base font-display">
                  {cartSubtotal.toFixed(2)} ₼
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-xl shadow-orange-950/60 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Sifarişi Təsdiqlə və Mətbəxə Göndər</span>
              </button>
              <button
                onClick={() => setIsCartSheetOpen(false)}
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Menyuya Qayıt (Məhsul Əlavə Et)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: LOCKED TABLE CONFLICT ================= */}
      {lockedModalInfo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-white font-display">
                Masa Hazırda Məşğuldur!
              </h3>
              <p className="text-xs text-rose-400 font-bold mt-0.5">
                Masa #{lockedModalInfo.tableNumber}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Daxil olan şəxs:</span>
                <span className="font-bold text-white">{lockedModalInfo.waiterName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cihaz:</span>
                <span className="font-bold text-amber-400">{lockedModalInfo.deviceName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Vaxt:</span>
                <span className="font-bold text-slate-300">
                  {new Date(lockedModalInfo.lockedAt).toLocaleTimeString("az-AZ")}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-snug">
                ⚠️ <strong>Səbəb:</strong> Bu masaya hazırda başqa ofisiant və ya kassa daxil olub. Eyni masaya eyni anda daxil olmaq sifariş qarışıqlığının qarşısını almaq üçün bloklanıb.
              </div>
            </div>

            <button
              onClick={() => setLockedModalInfo(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Anladım (Bağla)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
