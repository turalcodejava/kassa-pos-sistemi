import React, { useState, useMemo } from "react";
import { AppState, DonerOrder, PaymentMethod, BusinessType } from "../types";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  ShoppingBag,
  Layers,
  Search,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Clock,
  Utensils,
  Truck,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  PieChart,
  Tag,
  CreditCard,
  Banknote,
  Receipt,
  FileSpreadsheet,
  Award,
  Eye,
  X,
  Trash2,
  Edit2,
  Plus,
  Minus,
  Shield
} from "lucide-react";

interface DonerReportsProps {
  state: AppState;
  onOpenReceipt?: (orderProps: any) => void;
  onUpdateState?: (state: AppState) => void;
  initialPeriod?: PeriodType;
}

type PeriodType = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "LAST_MONTH" | "ALL" | "CUSTOM";
type ReportSubTab = "PRODUCTS" | "DATES" | "ORDERS";
type SortByOption = "QTY_DESC" | "REVENUE_DESC" | "PRICE_DESC" | "NAME_ASC";

export default function DonerReports({ state, onOpenReceipt, onUpdateState, initialPeriod = "ALL" }: DonerReportsProps) {
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>("PRODUCTS");
  const [period, setPeriod] = useState<PeriodType>(initialPeriod);
  
  // Custom date range (default to current month)
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [customStartDate, setCustomStartDate] = useState<string>(firstDayOfMonth);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Product tab filters
  const [productSearch, setProductSearch] = useState<string>("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("ALL");
  const [productSortBy, setProductSortBy] = useState<SortByOption>("QTY_DESC");

  // Orders tab filters
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>("ALL");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("ALL");

  // Selected Order for Receipt inspection modal
  const [inspectedOrder, setInspectedOrder] = useState<DonerOrder | null>(null);

  // Admin Order Cancellation State
  const [cancelModalOrder, setCancelModalOrder] = useState<DonerOrder | null>(null);
  const [cancelAdminPin, setCancelAdminPin] = useState("");
  const [cancelReason, setCancelReason] = useState("Müştəri imtina etdi");
  const [cancelError, setCancelError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder || !cancelAdminPin) {
      setCancelError("Admin PIN daxil edilməlidir!");
      return;
    }
    setIsCancelling(true);
    setCancelError("");
    try {
      const res = await fetch("/api/doner/order/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: cancelModalOrder.id,
          adminPin: cancelAdminPin,
          reason: cancelReason
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdateState) onUpdateState(data.state);
        setCancelModalOrder(null);
        setCancelAdminPin("");
        setCancelReason("Müştəri imtina etdi");
        if (inspectedOrder && inspectedOrder.id === cancelModalOrder.id) {
          setInspectedOrder(null);
        }
        alert(`Sifariş #${cancelModalOrder.id} uğurla ləğv edildi və anbar/kassa yeniləndi!`);
      } else {
        setCancelError(data.error || "Ləğv edilərkən xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      setCancelError("Serverlə əlaqə kəsildi");
    } finally {
      setIsCancelling(false);
    }
  };

  // Admin Order Edit State
  const [editModalOrder, setEditModalOrder] = useState<DonerOrder | null>(null);
  const [editAdminPin, setEditAdminPin] = useState("");
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [editOrderType, setEditOrderType] = useState<"TABLE" | "DELIVERY" | "TAKEAWAY">("TAKEAWAY");
  const [editTableNumber, setEditTableNumber] = useState<number | undefined>(undefined);
  const [editError, setEditError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Admin Order Delete State
  const [deleteModalOrder, setDeleteModalOrder] = useState<DonerOrder | null>(null);
  const [deleteAdminPin, setDeleteAdminPin] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenEditModal = (order: DonerOrder) => {
    setEditModalOrder(order);
    setEditAdminPin("");
    setEditError("");
    setEditItems(JSON.parse(JSON.stringify(order.items || [])));
    setEditPaymentMethod(order.paymentMethod || PaymentMethod.Cash);
    setEditOrderType(order.orderType || "TAKEAWAY");
    setEditTableNumber(order.tableNumber);
  };

  const handleEditItemQty = (index: number, delta: number) => {
    setEditItems(prev => {
      const next = [...prev];
      const newQty = Math.max(1, (next[index].quantity || 1) + delta);
      next[index] = { ...next[index], quantity: newQty };
      return next;
    });
  };

  const handleRemoveEditItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProductToEdit = (prodId: string) => {
    const prod = (state.donerProducts || []).find(p => p.id === prodId);
    if (!prod) return;
    setEditItems(prev => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        price: prod.price,
        quantity: 1
      }
    ]);
  };

  const handleUpdateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOrder || !editAdminPin) {
      setEditError("Admin PIN kodu daxil edilməlidir!");
      return;
    }
    if (editItems.length === 0) {
      setEditError("Sifarişdə ən azı 1 məhsul olmalıdır!");
      return;
    }

    setIsEditing(true);
    setEditError("");
    try {
      const newSubtotal = editItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
      const res = await fetch("/api/doner/order/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: editModalOrder.id,
          adminPin: editAdminPin,
          updatedFields: {
            items: editItems,
            subtotal: newSubtotal,
            paymentMethod: editPaymentMethod,
            orderType: editOrderType,
            tableNumber: editTableNumber
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdateState) onUpdateState(data.state);
        setEditModalOrder(null);
        setEditAdminPin("");
        if (inspectedOrder && inspectedOrder.id === editModalOrder.id) {
          setInspectedOrder(data.order || null);
        }
        alert(`Sifariş #${editModalOrder.id} uğurla redaktə edildi və yeniləndi!`);
      } else {
        setEditError(data.error || "Redaktə zamanı xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      setEditError("Serverlə əlaqə kəsildi");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModalOrder || !deleteAdminPin) {
      setDeleteError("Admin PIN kodu daxil edilməlidir!");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/doner/order/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: deleteModalOrder.id,
          adminPin: deleteAdminPin
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdateState) onUpdateState(data.state);
        const delId = deleteModalOrder.id;
        setDeleteModalOrder(null);
        setDeleteAdminPin("");
        if (inspectedOrder && inspectedOrder.id === delId) {
          setInspectedOrder(null);
        }
        alert(`Sifariş #${delId} bazadan tamamilə silindi!`);
      } else {
        setDeleteError(data.error || "Silinərkən xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      setDeleteError("Serverlə əlaqə kəsildi");
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Filter Orders by Date / Period
  const filteredOrders = useMemo(() => {
    const orders = state.donerOrders || [];
    const now = new Date();

    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const sevenDaysAgo = new Date(todayDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return true;

      const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

      switch (period) {
        case "TODAY":
          return orderDateOnly.getTime() === todayDate.getTime();
        case "YESTERDAY":
          return orderDateOnly.getTime() === yesterdayDate.getTime();
        case "LAST_7_DAYS":
          return orderDateOnly >= sevenDaysAgo && orderDateOnly <= todayDate;
        case "THIS_MONTH":
          return orderDateOnly >= firstDayThisMonth && orderDateOnly <= todayDate;
        case "LAST_MONTH":
          return orderDateOnly >= firstDayLastMonth && orderDateOnly <= lastDayLastMonth;
        case "CUSTOM": {
          if (!customStartDate && !customEndDate) return true;
          const start = customStartDate ? new Date(customStartDate) : new Date(0);
          const end = customEndDate ? new Date(customEndDate) : (customStartDate ? new Date(customStartDate) : new Date());
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return orderDate >= start && orderDate <= end;
        }
        case "ALL":
        default:
          return true;
      }
    });
  }, [state.donerOrders, period, customStartDate, customEndDate]);

  // 2. High-level KPIs calculation (only completed paid orders, excluding cancelled and pending)
  const validOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === "COMPLETED" || (!o.status && o.status !== "CANCELLED"));
  }, [filteredOrders]);

  const totalRevenue = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  }, [validOrders]);

  const totalOrdersCount = validOrders.length;

  const totalItemsSold = useMemo(() => {
    return validOrders.reduce((sum, o) => {
      return sum + (o.items || []).reduce((iSum, item) => iSum + (item.quantity || 1), 0);
    }, 0);
  }, [validOrders]);

  const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Breakdown by Payment Method
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let pos = 0;
    let apps = 0; // Wolt, Bolt, Yango
    let others = 0; // m10, CardTransfer

    validOrders.forEach(o => {
      const amt = o.subtotal || 0;
      if (o.paymentMethod === PaymentMethod.Cash || !o.paymentMethod) {
        cash += amt;
      } else if (o.paymentMethod === PaymentMethod.PosTerminal || o.paymentMethod === PaymentMethod.Card) {
        pos += amt;
      } else if (o.paymentMethod === PaymentMethod.Wolt || o.paymentMethod === PaymentMethod.Bolt || o.paymentMethod === PaymentMethod.Yango) {
        apps += amt;
      } else {
        others += amt;
      }
    });

    return { cash, pos, apps, others };
  }, [validOrders]);

  // Breakdown by Order Type
  const orderTypeBreakdown = useMemo(() => {
    let tableAmt = 0;
    let tableCount = 0;
    let takeawayAmt = 0;
    let takeawayCount = 0;
    let deliveryAmt = 0;
    let deliveryCount = 0;

    validOrders.forEach(o => {
      const amt = o.subtotal || 0;
      if (o.orderType === "TABLE") {
        tableAmt += amt;
        tableCount += 1;
      } else if (o.orderType === "TAKEAWAY") {
        takeawayAmt += amt;
        takeawayCount += 1;
      } else if (o.orderType === "DELIVERY") {
        deliveryAmt += amt;
        deliveryCount += 1;
      }
    });

    return { tableAmt, tableCount, takeawayAmt, takeawayCount, deliveryAmt, deliveryCount };
  }, [validOrders]);

  // 3. Products Sales Aggregation
  const productsSalesMap = useMemo(() => {
    const map: Record<string, {
      id: string;
      name: string;
      category: string;
      price: number;
      quantitySold: number;
      totalRevenue: number;
      ordersCount: number;
      image?: string;
    }> = {};

    // Initialize all existing doner products so even 0-sales items can be referenced if wanted
    (state.donerProducts || []).forEach(p => {
      map[p.id] = {
        id: p.id,
        name: p.name,
        category: p.category || "Digər",
        price: p.price,
        quantitySold: 0,
        totalRevenue: 0,
        ordersCount: 0,
        image: p.image
      };
    });

    // Aggregate from filtered orders
    filteredOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const pId = item.productId || item.name;
        if (!map[pId]) {
          const matchedProd = state.donerProducts?.find(dp => dp.id === item.productId || dp.name === item.name);
          map[pId] = {
            id: pId,
            name: item.name,
            category: matchedProd?.category || "Dönər",
            price: item.price || 0,
            quantitySold: 0,
            totalRevenue: 0,
            ordersCount: 0,
            image: matchedProd?.image
          };
        }

        map[pId].quantitySold += item.quantity || 1;
        map[pId].totalRevenue += (item.price || 0) * (item.quantity || 1);
        map[pId].ordersCount += 1;
      });
    });

    return Object.values(map);
  }, [filteredOrders, state.donerProducts]);

  // Categories list for filter
  const productCategories = useMemo(() => {
    const set = new Set<string>();
    productsSalesMap.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ["ALL", ...Array.from(set)];
  }, [productsSalesMap]);

  // Filtered and Sorted Products
  const filteredAndSortedProducts = useMemo(() => {
    return productsSalesMap
      .filter(p => {
        const matchesCategory = productCategoryFilter === "ALL" || p.category === productCategoryFilter;
        const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (productSortBy === "QTY_DESC") return b.quantitySold - a.quantitySold;
        if (productSortBy === "REVENUE_DESC") return b.totalRevenue - a.totalRevenue;
        if (productSortBy === "PRICE_DESC") return b.price - a.price;
        if (productSortBy === "NAME_ASC") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [productsSalesMap, productCategoryFilter, productSearch, productSortBy]);

  // Top Product & Categories Share
  const topSellingProduct = useMemo(() => {
    const sorted = [...productsSalesMap].sort((a, b) => b.quantitySold - a.quantitySold);
    return sorted[0] && sorted[0].quantitySold > 0 ? sorted[0] : null;
  }, [productsSalesMap]);

  const topRevenueProduct = useMemo(() => {
    const sorted = [...productsSalesMap].sort((a, b) => b.totalRevenue - a.totalRevenue);
    return sorted[0] && sorted[0].totalRevenue > 0 ? sorted[0] : null;
  }, [productsSalesMap]);

  const categoryRevenueBreakdown = useMemo(() => {
    const catMap: Record<string, { name: string; revenue: number; qty: number }> = {};
    productsSalesMap.forEach(p => {
      if (!catMap[p.category]) {
        catMap[p.category] = { name: p.category, revenue: 0, qty: 0 };
      }
      catMap[p.category].revenue += p.totalRevenue;
      catMap[p.category].qty += p.quantitySold;
    });
    return Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
  }, [productsSalesMap]);

  // 4. Daily Breakdown (Dates Tab)
  const dailyBreakdown = useMemo(() => {
    const dayMap: Record<string, {
      dateStr: string;
      orderCount: number;
      itemsCount: number;
      revenue: number;
      cash: number;
      pos: number;
      apps: number;
      timestamp: number;
    }> = {};

    filteredOrders.forEach(order => {
      const d = new Date(order.createdAt);
      const dateKey = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "Bilinməyən";
      const ts = !isNaN(d.getTime()) ? new Date(dateKey).getTime() : 0;

      if (!dayMap[dateKey]) {
        dayMap[dateKey] = {
          dateStr: dateKey,
          orderCount: 0,
          itemsCount: 0,
          revenue: 0,
          cash: 0,
          pos: 0,
          apps: 0,
          timestamp: ts
        };
      }

      const amt = order.subtotal || 0;
      dayMap[dateKey].orderCount += 1;
      dayMap[dateKey].itemsCount += (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
      dayMap[dateKey].revenue += amt;

      if (order.paymentMethod === PaymentMethod.Cash || !order.paymentMethod) {
        dayMap[dateKey].cash += amt;
      } else if (order.paymentMethod === PaymentMethod.PosTerminal || order.paymentMethod === PaymentMethod.Card) {
        dayMap[dateKey].pos += amt;
      } else {
        dayMap[dateKey].apps += amt;
      }
    });

    return Object.values(dayMap).sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredOrders]);

  // Peak Hours Calculation
  const peakHours = useMemo(() => {
    const hourMap: Record<number, { count: number; revenue: number }> = {};
    for (let i = 0; i < 24; i++) hourMap[i] = { count: 0, revenue: 0 };

    filteredOrders.forEach(order => {
      const d = new Date(order.createdAt);
      if (!isNaN(d.getTime())) {
        const hour = d.getHours();
        hourMap[hour].count += 1;
        hourMap[hour].revenue += (order.subtotal || 0);
      }
    });

    return hourMap;
  }, [filteredOrders]);

  // 5. Orders Tab Filtered
  const filteredOrdersList = useMemo(() => {
    return filteredOrders
      .filter(o => {
        // Payment filter
        if (orderPaymentFilter !== "ALL") {
          if (orderPaymentFilter === "CASH" && o.paymentMethod !== PaymentMethod.Cash && o.paymentMethod !== undefined) return false;
          if (orderPaymentFilter === "POS" && o.paymentMethod !== PaymentMethod.PosTerminal && o.paymentMethod !== PaymentMethod.Card) return false;
          if (orderPaymentFilter === "WOLT" && o.paymentMethod !== PaymentMethod.Wolt) return false;
          if (orderPaymentFilter === "BOLT" && o.paymentMethod !== PaymentMethod.Bolt) return false;
          if (orderPaymentFilter === "M10" && o.paymentMethod !== PaymentMethod.M10) return false;
        }

        // Type filter
        if (orderTypeFilter !== "ALL" && o.orderType !== orderTypeFilter) {
          return false;
        }

        // Search
        if (orderSearch.trim()) {
          const q = orderSearch.toLowerCase();
          const matchesId = o.id.toLowerCase().includes(q);
          const matchesTable = o.tableNumber && `masa ${o.tableNumber}`.toLowerCase().includes(q);
          const matchesCustomer = o.deliveryName && o.deliveryName.toLowerCase().includes(q);
          const matchesItems = (o.items || []).some(i => i.name.toLowerCase().includes(q));
          if (!matchesId && !matchesTable && !matchesCustomer && !matchesItems) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders, orderPaymentFilter, orderTypeFilter, orderSearch]);

  // Export to CSV
  const handleExportCSV = () => {
    if (activeSubTab === "PRODUCTS") {
      let csv = "Sıra,Məhsul Adı,Kateqoriya,Qiymət (AZN),Satılan Say (Ədəd),Cəmi Gəlir (AZN),Satış Payı (%)\n";
      filteredAndSortedProducts.forEach((p, idx) => {
        const share = totalRevenue > 0 ? ((p.totalRevenue / totalRevenue) * 100).toFixed(1) : "0";
        csv += `"${idx + 1}","${p.name}","${p.category}","${p.price.toFixed(2)}","${p.quantitySold}","${p.totalRevenue.toFixed(2)}","${share}%"\n`;
      });
      downloadFile(csv, `KozDoner_Mehsul_Hesabati_${period}_${todayStr}.csv`, "text/csv;charset=utf-8;");
    } else if (activeSubTab === "DATES") {
      let csv = "Tarix,Sifariş Sayı,Satılan Ədəd,Nağd (AZN),POS Terminal (AZN),Tətbiqlər/Digər (AZN),Cəmi Gəlir (AZN)\n";
      dailyBreakdown.forEach(d => {
        csv += `"${d.dateStr}","${d.orderCount}","${d.itemsCount}","${d.cash.toFixed(2)}","${d.pos.toFixed(2)}","${d.apps.toFixed(2)}","${d.revenue.toFixed(2)}"\n`;
      });
      downloadFile(csv, `KozDoner_Tarix_Hesabati_${period}_${todayStr}.csv`, "text/csv;charset=utf-8;");
    } else {
      let csv = "Sifariş ID,Tarix,Sifariş Növü,Masa/Müştəri,Məhsullar,Ödəniş Üsulu,Məbləğ (AZN)\n";
      filteredOrdersList.forEach(o => {
        const itemsStr = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join("; ");
        const target = o.orderType === "TABLE" ? `Masa ${o.tableNumber}` : o.orderType === "DELIVERY" ? `Çatdırılma: ${o.deliveryName || ""}` : "Özünlə Apar";
        csv += `"${o.id}","${new Date(o.createdAt).toLocaleString("az-AZ")}","${o.orderType}","${target}","${itemsStr}","${o.paymentMethod || 'NAGD'}","${(o.subtotal || 0).toFixed(2)}"\n`;
      });
      downloadFile(csv, `KozDoner_Satis_Jurnali_${period}_${todayStr}.csv`, "text/csv;charset=utf-8;");
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for payment method label & badge
  const getPaymentLabel = (method?: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.PosTerminal:
      case PaymentMethod.Card:
        return { label: "POS Terminal", color: "bg-blue-950/60 text-blue-400 border-blue-800" };
      case PaymentMethod.Wolt:
        return { label: "Wolt", color: "bg-cyan-950/60 text-cyan-400 border-cyan-800" };
      case PaymentMethod.Bolt:
        return { label: "Bolt Food", color: "bg-emerald-950/60 text-emerald-400 border-emerald-800" };
      case PaymentMethod.Yango:
        return { label: "Yango Deli", color: "bg-red-950/60 text-red-400 border-red-800" };
      case PaymentMethod.M10:
        return { label: "m10", color: "bg-purple-950/60 text-purple-400 border-purple-800" };
      case PaymentMethod.Cash:
      default:
        return { label: "Nağd", color: "bg-amber-950/60 text-amber-400 border-amber-800" };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 sm:p-6 space-y-6">
      
      {/* 1. HEADER & PERIOD FILTER BAR */}
      <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-xl shadow-lg shadow-orange-950/50">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>Köz Dönər Hesabatları & Satış Analitikası</span>
                <span className="text-xs bg-orange-500/20 text-orange-400 font-bold px-2.5 py-0.5 rounded-full border border-orange-500/30">
                  Canlı Dövriyyə
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Məhsulların satış statistikası, tarixlər üzrə gəlir və ümumi çek jurnalı
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter Pills & Custom Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "ALL", label: "Bütün dövr" },
              { key: "TODAY", label: "Bu gün" },
              { key: "YESTERDAY", label: "Dünən" },
              { key: "LAST_7_DAYS", label: "Son 7 gün" },
              { key: "THIS_MONTH", label: "Bu ay" },
              { key: "LAST_MONTH", label: "Ötən ay" },
              { key: "CUSTOM", label: "Xüsusi Tarix" }
            ] as const
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === tab.key
                  ? "bg-orange-600 text-white shadow-md shadow-orange-950/40"
                  : "bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Action: Export CSV */}
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-950/30 cursor-pointer ml-1"
            title="Seçilmiş hesabatı Excel/CSV faylı olaraq yüklə"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker (Shown when period === 'CUSTOM') */}
      {period === "CUSTOM" && (
        <div className="bg-slate-950/80 border border-orange-500/30 p-4 rounded-xl flex flex-wrap items-center gap-4 text-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="text-slate-300 font-semibold">Başlanğıc tarixi:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="text-slate-300 font-semibold">Bitmə tarixi:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-orange-500"
            />
          </div>
          <span className="text-[11px] text-slate-400">
            Filtrdə göstərilən dövr: {customStartDate || "əvvəldən"} — {customEndDate || "bu günə qədər"}
          </span>
        </div>
      )}

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ümumi Dövriyyə</span>
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {totalRevenue.toFixed(2)} <span className="text-orange-400 text-lg font-bold">₼</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
            <span>Cəmi {totalOrdersCount} sifarişdən</span>
            <span className="text-emerald-400 font-bold">Ort. {averageOrderValue.toFixed(2)} ₼/çek</span>
          </div>
        </div>

        {/* Product Items Sold */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Satılan Məhsullar</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {totalItemsSold} <span className="text-emerald-400 text-base font-bold">ədəd</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
            <span>Ən çox satılan:</span>
            <span className="text-emerald-400 font-bold truncate max-w-[120px]">
              {topSellingProduct ? `${topSellingProduct.name} (${topSellingProduct.quantitySold})` : "Yoxdur"}
            </span>
          </div>
        </div>

        {/* Cash Sales */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">💵 Nağd Satış</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
              {paymentBreakdown.cash.toFixed(2)} <span className="text-white text-lg font-bold">₼</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
            <span>Dövriyyədəki payı:</span>
            <span className="text-amber-400 font-bold">
              {totalRevenue > 0 ? ((paymentBreakdown.cash / totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* POS Terminal & Cards */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">💳 POS Terminal & Kart</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 tracking-tight">
              {paymentBreakdown.pos.toFixed(2)} <span className="text-white text-lg font-bold">₼</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
            <span>Aqreqator/Digər:</span>
            <span className="text-cyan-400 font-bold">
              {(paymentBreakdown.apps + paymentBreakdown.others).toFixed(2)} ₼
            </span>
          </div>
        </div>

      </div>

      {/* 3. SUB-NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-850 pb-2">
        <button
          onClick={() => setActiveSubTab("PRODUCTS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "PRODUCTS"
              ? "bg-orange-600 text-white shadow-lg shadow-orange-950/40"
              : "bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>🍔 Məhsullara Görə Satış ({filteredAndSortedProducts.filter(p => p.quantitySold > 0).length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("DATES")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "DATES"
              ? "bg-orange-600 text-white shadow-lg shadow-orange-950/40"
              : "bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>📅 Tarix və Zamana Görə Dinamika ({dailyBreakdown.length} gün)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("ORDERS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeSubTab === "ORDERS"
              ? "bg-orange-600 text-white shadow-lg shadow-orange-950/40"
              : "bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>📋 Ümumi Satış Siyahısı & Çek Jurnalı ({filteredOrdersList.length})</span>
        </button>
      </div>

      {/* 4. SUB-TAB CONTENT */}

      {/* ---------------- SUB-TAB 1: PRODUCTS BREAKDOWN ---------------- */}
      {activeSubTab === "PRODUCTS" && (
        <div className="space-y-6">
          
          {/* Top highlight banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Top Seller by Volume */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center space-x-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ən Çox Satılan Məhsul</span>
                <h4 className="text-sm font-extrabold text-white truncate">
                  {topSellingProduct ? topSellingProduct.name : "Məlumat yoxdur"}
                </h4>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                  {topSellingProduct ? `${topSellingProduct.quantitySold} ədəd (${topSellingProduct.totalRevenue.toFixed(2)} ₼)` : "-"}
                </p>
              </div>
            </div>

            {/* Top Seller by Revenue */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ən Çox Gəlir Gətirən</span>
                <h4 className="text-sm font-extrabold text-white truncate">
                  {topRevenueProduct ? topRevenueProduct.name : "Məlumat yoxdur"}
                </h4>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                  {topRevenueProduct ? `${topRevenueProduct.totalRevenue.toFixed(2)} ₼ (${topRevenueProduct.quantitySold} ədəd)` : "-"}
                </p>
              </div>
            </div>

            {/* Total Unique Menu Items with Sales */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex items-center space-x-4">
              <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
                <PieChart className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Satış Edilən Çeşid Sayı</span>
                <h4 className="text-sm font-extrabold text-white">
                  {productsSalesMap.filter(p => p.quantitySold > 0).length} növ məhsul
                </h4>
                <p className="text-xs text-orange-400 font-semibold mt-0.5">
                  Cəmi {productsSalesMap.length} menyu çeşidindən
                </p>
              </div>
            </div>

          </div>

          {/* Filter, Search & Sort Bar */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Məhsul adı ilə axtarış..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills & Sort Select */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Category Pills */}
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {productCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      productCategoryFilter === cat
                        ? "bg-orange-600 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat === "ALL" ? "Bütün Kateqoriyalar" : cat}
                  </button>
                ))}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-semibold">Sırala:</span>
                <select
                  value={productSortBy}
                  onChange={e => setProductSortBy(e.target.value as SortByOption)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value="QTY_DESC">🔥 Ən çox satılan (Sayı çox)</option>
                  <option value="REVENUE_DESC">💰 Ən yüksək gəlir (AZN)</option>
                  <option value="PRICE_DESC">🏷️ Qiymətə görə (Yüksək)</option>
                  <option value="NAME_ASC">🔤 Əlifba sırası (A-Z)</option>
                </select>
              </div>

            </div>

          </div>

          {/* Products Sales Table */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Məhsul</th>
                    <th className="py-3 px-4">Kateqoriya</th>
                    <th className="py-3 px-4 text-right">Vahid Qiymət</th>
                    <th className="py-3 px-4 text-center">Satılan Miqdar</th>
                    <th className="py-3 px-4 text-right">Cəmi Gəlir</th>
                    <th className="py-3 px-4 text-center w-36">Satışdakı Payı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 font-medium">
                  {filteredAndSortedProducts.map((prod, index) => {
                    const sharePercent = totalRevenue > 0 ? ((prod.totalRevenue / totalRevenue) * 100) : 0;
                    const isTopThree = index < 3 && prod.quantitySold > 0;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-900/40 transition-colors">
                        
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center">
                          {isTopThree ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                              index === 0
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : index === 1
                                ? "bg-slate-400/20 text-slate-300 border border-slate-400/30"
                                : "bg-orange-700/20 text-orange-400 border border-orange-700/30"
                            }`}>
                              #{index + 1}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">#{index + 1}</span>
                          )}
                        </td>

                        {/* Product Name & Image */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                <Utensils className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-white block text-sm">{prod.name}</span>
                              <span className="text-[10px] text-slate-500">ID: {prod.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-800">
                            {prod.category}
                          </span>
                        </td>

                        {/* Unit Price */}
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-300">
                          {prod.price.toFixed(2)} ₼
                        </td>

                        {/* Quantity Sold */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`font-extrabold text-sm ${prod.quantitySold > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                              {prod.quantitySold} <span className="text-[10px] font-normal text-slate-400">ədəd</span>
                            </span>
                            {prod.ordersCount > 0 && (
                              <span className="text-[9px] text-slate-500">({prod.ordersCount} çekdə)</span>
                            )}
                          </div>
                        </td>

                        {/* Total Revenue */}
                        <td className="py-3.5 px-4 text-right">
                          <span className={`font-black text-sm ${prod.totalRevenue > 0 ? "text-white" : "text-slate-500"}`}>
                            {prod.totalRevenue.toFixed(2)} <span className="text-orange-400 text-xs">₼</span>
                          </span>
                        </td>

                        {/* Share of Sales */}
                        <td className="py-3.5 px-4">
                          <div className="w-full space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 font-semibold">{sharePercent.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(sharePercent, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                      </tr>
                    );
                  })}

                  {filteredAndSortedProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        Seçilmiş filtrə uyğun məhsul tapılmadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Revenue Breakdown Summary */}
          <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-orange-400" />
              <span>Kateqoriyalar Üzrə Satış və Gəlir Bölgüsü</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoryRevenueBreakdown.map(cat => {
                const catShare = totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(1) : "0";
                return (
                  <div key={cat.name} className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{cat.name}</span>
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-md">
                        {catShare}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{cat.qty} ədəd satılıb</span>
                      <span className="font-extrabold text-white">{cat.revenue.toFixed(2)} ₼</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full"
                        style={{ width: `${Math.min(parseFloat(catShare), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ---------------- SUB-TAB 2: DATES & HOURLY BREAKDOWN ---------------- */}
      {activeSubTab === "DATES" && (
        <div className="space-y-6">

          {/* Daily Dynamic Bar Chart Visualization */}
          <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Gündəlik Satış və Dövriyyə Qrafiki</span>
                </h3>
                <p className="text-[11px] text-slate-400">Seçilmiş dövrdə günlər üzrə gəlirin dəyişməsi</p>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 bg-orange-500 rounded-sm inline-block"></span>
                  <span className="text-slate-300">Gəlir (AZN)</span>
                </div>
              </div>
            </div>

            {/* Interactive Dynamic SVG / CSS Bars */}
            <div className="pt-4 pb-2">
              {dailyBreakdown.length > 0 ? (
                (() => {
                  const maxDailyRevenue = Math.max(...dailyBreakdown.map(d => d.revenue), 10);
                  const reversedForChart = [...dailyBreakdown].reverse(); // Chronological

                  return (
                    <div className="space-y-2">
                      <div className="h-48 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-2 pt-6 px-2">
                        {reversedForChart.map(day => {
                          const heightPct = Math.max(8, (day.revenue / maxDailyRevenue) * 100);

                          return (
                            <div
                              key={day.dateStr}
                              className="flex flex-col items-center flex-1 min-w-[50px] group relative h-full justify-end"
                            >
                              {/* Tooltip on hover */}
                              <div className="absolute -top-12 bg-slate-900 border border-slate-700 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                <div>{day.dateStr}</div>
                                <div className="text-orange-400">{day.revenue.toFixed(2)} ₼ ({day.orderCount} çek)</div>
                              </div>

                              {/* Amount text above bar */}
                              <span className="text-[9px] font-bold text-slate-400 mb-1 opacity-80 group-hover:text-orange-400">
                                {day.revenue.toFixed(0)}₼
                              </span>

                              {/* Bar */}
                              <div className="w-full max-w-[42px] bg-slate-900 rounded-t-lg overflow-hidden h-full flex items-end">
                                <div
                                  className="w-full bg-gradient-to-t from-orange-600 to-amber-400 rounded-t-lg transition-all duration-500 group-hover:from-orange-500 group-hover:to-amber-300"
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>

                              {/* Date label under bar */}
                              <span className="text-[10px] text-slate-400 mt-2 font-medium truncate w-full text-center">
                                {day.dateStr.split("-").slice(1).join("/")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Bu dövr üzrə heç bir satış məlumatı yoxdur.
                </div>
              )}
            </div>
          </div>

          {/* Order Types Breakdown (Table / Takeaway / Delivery) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Table Orders */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Utensils className="w-4 h-4 text-orange-400" />
                  <span>Masa Sifarişləri (Stol)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                  {totalRevenue > 0 ? ((orderTypeBreakdown.tableAmt / totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">{orderTypeBreakdown.tableAmt.toFixed(2)} ₼</span>
                <span className="text-xs text-slate-400">{orderTypeBreakdown.tableCount} sifariş</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full"
                  style={{ width: `${totalRevenue > 0 ? (orderTypeBreakdown.tableAmt / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Takeaway Orders */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>Özünlə Apar (Paket)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  {totalRevenue > 0 ? ((orderTypeBreakdown.takeawayAmt / totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">{orderTypeBreakdown.takeawayAmt.toFixed(2)} ₼</span>
                <span className="text-xs text-slate-400">{orderTypeBreakdown.takeawayCount} sifariş</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${totalRevenue > 0 ? (orderTypeBreakdown.takeawayAmt / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Delivery Orders */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span>Kuryer Çatdırılması</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                  {totalRevenue > 0 ? ((orderTypeBreakdown.deliveryAmt / totalRevenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">{orderTypeBreakdown.deliveryAmt.toFixed(2)} ₼</span>
                <span className="text-xs text-slate-400">{orderTypeBreakdown.deliveryCount} sifariş</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full"
                  style={{ width: `${totalRevenue > 0 ? (orderTypeBreakdown.deliveryAmt / totalRevenue) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>

          {/* Daily Table Breakdown */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-850 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span>Gündəlik Satış Cədvəli</span>
              </h4>
              <span className="text-xs text-slate-400 font-semibold">{dailyBreakdown.length} gün aktiv</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Tarix</th>
                    <th className="py-3 px-4 text-center">Sifariş Sayı</th>
                    <th className="py-3 px-4 text-center">Satılan Ədəd</th>
                    <th className="py-3 px-4 text-right">Nağd</th>
                    <th className="py-3 px-4 text-right">POS Terminal</th>
                    <th className="py-3 px-4 text-right">Tətbiqlər / Digər</th>
                    <th className="py-3 px-4 text-right font-black text-orange-400">Cəmi Satış</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 font-medium">
                  {dailyBreakdown.map(day => (
                    <tr key={day.dateStr} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {day.dateStr}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 font-bold border border-slate-800">
                          {day.orderCount} çek
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-semibold">
                        {day.itemsCount} ədəd
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-400 font-semibold">
                        {day.cash.toFixed(2)} ₼
                      </td>
                      <td className="py-3.5 px-4 text-right text-blue-400 font-semibold">
                        {day.pos.toFixed(2)} ₼
                      </td>
                      <td className="py-3.5 px-4 text-right text-cyan-400 font-semibold">
                        {day.apps.toFixed(2)} ₼
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-white text-sm">
                        {day.revenue.toFixed(2)} <span className="text-orange-400 text-xs">₼</span>
                      </td>
                    </tr>
                  ))}

                  {dailyBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        Bu dövr üzrə məlumat yoxdur.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ---------------- SUB-TAB 3: ORDERS JOURNAL ---------------- */}
      {activeSubTab === "ORDERS" && (
        <div className="space-y-6">

          {/* Search and Filters Bar */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Çek ID, masa №, müştəri və ya məhsul adı..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
              {orderSearch && (
                <button
                  onClick={() => setOrderSearch("")}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Payment Filter */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-slate-400 font-semibold">Ödəniş:</span>
                <select
                  value={orderPaymentFilter}
                  onChange={e => setOrderPaymentFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">Hamısı</option>
                  <option value="CASH">💵 Nağd</option>
                  <option value="POS">💳 POS Terminal</option>
                  <option value="WOLT">🛵 Wolt</option>
                  <option value="BOLT">🛵 Bolt Food</option>
                  <option value="M10">📱 m10</option>
                </select>
              </div>

              {/* Order Type Filter */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-slate-400 font-semibold">Növ:</span>
                <select
                  value={orderTypeFilter}
                  onChange={e => setOrderTypeFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-orange-500"
                >
                  <option value="ALL">Hamısı</option>
                  <option value="TABLE">🍽️ Masa Sifarişi</option>
                  <option value="TAKEAWAY">🛍️ Özünlə Apar</option>
                  <option value="DELIVERY">🚚 Çatdırılma</option>
                </select>
              </div>

            </div>

          </div>

          {/* Orders Table */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Çek № / Tarix</th>
                    <th className="py-3 px-4">Sifariş Növü</th>
                    <th className="py-3 px-4">Tərkibindəki Məhsullar</th>
                    <th className="py-3 px-4">Ödəniş Üsulu</th>
                    <th className="py-3 px-4 text-right">Məbləğ</th>
                    <th className="py-3 px-4 text-center">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 font-medium">
                  {filteredOrdersList.map(order => {
                    const pay = getPaymentLabel(order.paymentMethod);
                    const formattedDate = new Date(order.createdAt).toLocaleString("az-AZ", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                        
                        {/* ID & Date */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-white block">{order.id}</span>
                            <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{formattedDate}</span>
                            </span>
                          </div>
                        </td>

                        {/* Order Type */}
                        <td className="py-3.5 px-4">
                          {order.orderType === "TABLE" ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              <Utensils className="w-3 h-3" />
                              <span>Masa #{order.tableNumber}</span>
                            </span>
                          ) : order.orderType === "DELIVERY" ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <Truck className="w-3 h-3" />
                                <span>Çatdırılma</span>
                              </span>
                              {order.deliveryName && (
                                <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                                  {order.deliveryName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShoppingBag className="w-3 h-3" />
                              <span>Özünlə Apar</span>
                            </span>
                          )}
                        </td>

                        {/* Items List */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-1">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="flex items-center space-x-1 text-[11px] text-slate-300">
                                <span className="font-bold text-orange-400">{item.quantity}x</span>
                                <span className="truncate">{item.name}</span>
                                {item.removedIngredients && item.removedIngredients.length > 0 && (
                                  <span className="text-[9px] text-red-400 bg-red-950/40 px-1 rounded">
                                    (-{item.removedIngredients.join(", ")})
                                  </span>
                                )}
                                {item.itemNote && (
                                  <span className="text-[9px] text-amber-300 bg-amber-950/40 px-1 rounded border border-amber-500/20">
                                    💬 {item.itemNote}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${pay.color}`}>
                            {pay.label}
                          </span>
                        </td>

                        {/* Subtotal & Status */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="space-y-0.5">
                            <span className={`font-black text-sm ${order.status === "CANCELLED" ? "text-slate-500 line-through" : "text-white"}`}>
                              {(order.subtotal || 0).toFixed(2)} <span className="text-orange-400 text-xs">₼</span>
                            </span>
                            {order.status === "CANCELLED" && (
                              <span className="block text-[9px] font-bold text-red-400 uppercase tracking-wider">
                                Ləğv Edildi
                              </span>
                            )}
                            {order.status === "PENDING" && (
                              <span className="block text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                                🛵 Çatdırılmada
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setInspectedOrder(order)}
                              className="bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white px-2 py-1.5 rounded-lg text-[11px] font-bold border border-slate-800 transition-all flex items-center space-x-1 cursor-pointer"
                              title="Detallara Bax / Qəbz Çapı"
                            >
                              <Eye className="w-3.5 h-3.5 text-orange-400" />
                              <span>Bax</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(order)}
                              className="bg-amber-950/30 hover:bg-amber-900/50 text-amber-400 hover:text-amber-300 px-2 py-1.5 rounded-lg text-[11px] font-bold border border-amber-900/30 transition-all flex items-center space-x-1 cursor-pointer"
                              title="Admin Təsdiqi ilə Sifarişi Redaktə Et"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Redaktə</span>
                            </button>

                            <button
                              onClick={() => {
                                setDeleteModalOrder(order);
                                setDeleteAdminPin("");
                                setDeleteError("");
                              }}
                              className="bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg text-[11px] font-bold border border-red-900/30 transition-all flex items-center space-x-1 cursor-pointer"
                              title="Admin Təsdiqi ilə Bazadan Tamamilə Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Sil</span>
                            </button>

                            {order.status !== "CANCELLED" && (
                              <button
                                onClick={() => {
                                  setCancelModalOrder(order);
                                  setCancelAdminPin("");
                                  setCancelError("");
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 px-1.5 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
                                title="Ləğv / İadə Et"
                              >
                                <span>İadə</span>
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}

                  {filteredOrdersList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        Axtarışa və ya filtrə uyğun sifariş tapılmadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 5. ORDER INSPECTION RECEIPT MODAL */}
      {inspectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-850 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-4 bg-slate-900/80 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-sm">Sifariş Detalları ({inspectedOrder.id})</h3>
              </div>
              <button
                onClick={() => setInspectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono text-slate-200">
              
              {inspectedOrder.status === "CANCELLED" && (
                <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-300 font-sans space-y-1">
                  <div className="font-bold text-red-400 flex items-center space-x-1.5">
                    <span>⚠️ BU SİFARİŞ LƏĞV EDİLİB (İADƏ)</span>
                  </div>
                  <div className="text-[11px]">Səbəb: <strong>{inspectedOrder.cancelReason || "Admin tərəfindən ləğv edildi"}</strong></div>
                  {inspectedOrder.cancelledBy && (
                    <div className="text-[10px] text-slate-400">Təsdiqləyən Admin: {inspectedOrder.cancelledBy}</div>
                  )}
                </div>
              )}

              <div className="text-center border-b border-slate-800 pb-3">
                <h2 className="text-base font-black text-white">KÖZ DÖNƏR</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Satış Qəbzi / Çek</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                  <span>Tarix: {new Date(inspectedOrder.createdAt).toLocaleString("az-AZ")}</span>
                  <span className="font-bold text-orange-400">
                    {inspectedOrder.orderType === "TABLE" ? `Masa ${inspectedOrder.tableNumber}` : inspectedOrder.orderType === "DELIVERY" ? "Çatdırılma" : "Özünlə Apar"}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-b border-slate-800 pb-3 font-sans">
                {(inspectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold text-white">{item.quantity}x {item.name}</span>
                      {item.removedIngredients && item.removedIngredients.length > 0 && (
                        <span className="block text-[10px] text-red-400">
                          (İnqr: -{item.removedIngredients.join(", ")})
                        </span>
                      )}
                      {item.itemNote && (
                        <span className="block text-[10px] text-amber-300 font-semibold">
                          💬 Qeyd: {item.itemNote}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-300">
                      {((item.price || 0) * (item.quantity || 1)).toFixed(2)} ₼
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery Details if any */}
              {inspectedOrder.orderType === "DELIVERY" && (
                <div className="bg-slate-900/60 p-3 rounded-xl space-y-1 font-sans text-[11px] border border-slate-800">
                  <div className="text-cyan-400 font-bold">Çatdırılma Məlumatı:</div>
                  <div>Müştəri: <span className="text-white font-semibold">{inspectedOrder.deliveryName}</span></div>
                  <div>Telefon: <span className="text-white font-semibold">{inspectedOrder.deliveryPhone}</span></div>
                  <div>Ünvan: <span className="text-white font-semibold">{inspectedOrder.deliveryAddress}</span></div>
                  {inspectedOrder.courierName && (
                    <div>Kuryer: <span className="text-white font-semibold">{inspectedOrder.courierName}</span></div>
                  )}
                </div>
              )}

              {/* Payment Summary */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-sans">
                  <span className="text-slate-400">Ödəniş Üsulu:</span>
                  <span className="font-bold text-white">
                    {getPaymentLabel(inspectedOrder.paymentMethod).label}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black font-sans border-t border-slate-800 pt-2">
                  <span className="text-white">CƏMİ MƏBLƏĞ:</span>
                  <span className={inspectedOrder.status === "CANCELLED" ? "text-slate-500 line-through" : "text-orange-400"}>
                    {(inspectedOrder.subtotal || 0).toFixed(2)} ₼
                  </span>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    handleOpenEditModal(inspectedOrder);
                    setInspectedOrder(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-amber-400 hover:text-white bg-amber-950/30 hover:bg-amber-900/50 border border-amber-900/30 transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Redaktə Et</span>
                </button>

                <button
                  onClick={() => {
                    setDeleteModalOrder(inspectedOrder);
                    setDeleteAdminPin("");
                    setDeleteError("");
                    setInspectedOrder(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white bg-red-950/30 hover:bg-red-900/50 border border-red-900/30 transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Tam Sil</span>
                </button>

                {inspectedOrder.status !== "CANCELLED" && (
                  <button
                    onClick={() => {
                      setCancelModalOrder(inspectedOrder);
                      setCancelAdminPin("");
                      setCancelError("");
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-750 transition-all cursor-pointer"
                  >
                    İadə Et
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setInspectedOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Bağla
                </button>
                {onOpenReceipt && inspectedOrder.status !== "CANCELLED" && (
                  <button
                    onClick={() => {
                      onOpenReceipt({
                        title: "KÖZ DÖNƏR",
                        orderType: inspectedOrder.orderType === "TABLE" ? "Masa" : inspectedOrder.orderType === "DELIVERY" ? "Çatdırılma" : "Özünlə Apar",
                        tableNumber: inspectedOrder.tableNumber,
                        items: inspectedOrder.items,
                        subtotal: inspectedOrder.subtotal,
                        paymentMethod: inspectedOrder.paymentMethod,
                        createdAt: inspectedOrder.createdAt,
                        deliveryDetails: inspectedOrder.orderType === "DELIVERY" ? {
                          receiverName: inspectedOrder.deliveryName,
                          receiverPhone: inspectedOrder.deliveryPhone,
                          deliveryAddress: inspectedOrder.deliveryAddress,
                          courierName: inspectedOrder.courierName
                        } : undefined
                      });
                      setInspectedOrder(null);
                    }}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-orange-950/40 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Qəbzi Çap Et</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. ADMIN PIN AUTHORIZATION MODAL FOR ORDER CANCELLATION */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">Sifarişin Ləğv Edilməsi</h3>
              <p className="text-xs text-slate-400">
                Sifariş #{cancelModalOrder.id} (<strong>{(cancelModalOrder.subtotal || 0).toFixed(2)} ₼</strong>) ləğv edilməsi üçün Admin təsdiqi tələb olunur.
              </p>
            </div>

            <form onSubmit={handleCancelOrder} className="space-y-4">
              
              {/* Reason selection */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ləğvetmə Səbəbi
                </label>
                <select
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Müştəri imtina etdi">Müştəri imtina etdi</option>
                  <option value="Səhvən iki dəfə vurulub">Səhvən iki dəfə vurulub</option>
                  <option value="Yemək keyfiyyəti / İadə">Yemək keyfiyyəti / İadə</option>
                  <option value="Ödəniş xətası / Başqa üsul">Ödəniş xətası / Başqa üsul</option>
                  <option value="Digər səbəb">Digər səbəb</option>
                </select>
              </div>

              {/* Admin PIN Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Admin 4-Rəqəmli PİN Kodu *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  placeholder="••••"
                  value={cancelAdminPin}
                  onChange={e => setCancelAdminPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-red-500"
                />
              </div>

              {cancelError && (
                <div className="text-[11px] font-semibold text-red-400 bg-red-950/40 border border-red-900/30 p-2.5 rounded-xl text-center">
                  {cancelError}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-850 transition-all cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isCancelling ? "Ləğv edilir..." : "Ləğvi Təsdiq Et"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 7. ADMIN EDIT ORDER MODAL */}
      {editModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Sifarişi Redaktə Et</h3>
                  <p className="text-[11px] text-slate-400">
                    Sifariş #{editModalOrder.id} • {new Date(editModalOrder.createdAt).toLocaleTimeString("az-AZ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrderSubmit} className="space-y-4">
              
              {/* Order Items Table/List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sifarişdəki Məhsullar
                  </label>
                  <span className="text-[10px] text-slate-500">{editItems.length} məhsul</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 max-h-48 overflow-y-auto">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-850 gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{item.name}</span>
                        <span className="text-[10px] text-orange-400 font-semibold">
                          {(item.price || 0).toFixed(2)} ₼ / ədəd
                        </span>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleEditItemQty(idx, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-300 rounded font-bold text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-white w-5 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleEditItemQty(idx, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-300 rounded font-bold text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total Price */}
                      <span className="text-xs font-black text-slate-200 w-16 text-right">
                        {((item.price || 0) * (item.quantity || 1)).toFixed(2)} ₼
                      </span>

                      {/* Remove item */}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditItem(idx)}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/40 cursor-pointer"
                        title="Məhsulu sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {editItems.length === 0 && (
                    <div className="text-center py-4 text-xs text-red-400 font-semibold">
                      Sifarişdə heç bir məhsul qalmayıb! Aşağıdan yeni məhsul əlavə edin.
                    </div>
                  )}
                </div>

                {/* Add Product Dropdown */}
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProductToEdit(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="" disabled>+ Menyu məhsulu əlavə et...</option>
                    {(state.donerProducts || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {(p.price || 0).toFixed(2)} ₼ ({p.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Method & Order Type Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Ödəniş Üsulu
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value={PaymentMethod.Cash}>💵 Nağd</option>
                    <option value={PaymentMethod.PosTerminal}>💳 POS Terminal</option>
                    <option value={PaymentMethod.Card}>💳 Bank Kartı</option>
                    <option value={PaymentMethod.CardTransfer}>📲 Kartdan Karta / BirBank</option>
                    <option value={PaymentMethod.M10}>📱 M10</option>
                    <option value={PaymentMethod.Wolt}>🛵 Wolt Pay</option>
                    <option value={PaymentMethod.Bolt}>🚗 Bolt Food</option>
                    <option value={PaymentMethod.Yango}>🟡 Yango Deli</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Sifariş Növü
                  </label>
                  <select
                    value={editOrderType}
                    onChange={(e) => setEditOrderType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="TABLE">🍽️ Masa Sifarişi</option>
                    <option value="TAKEAWAY">🛍️ Özünlə Apar</option>
                    <option value="DELIVERY">🛵 Çatdırılma</option>
                  </select>
                </div>
              </div>

              {/* Subtotal Display */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Yenilənmiş Məbləğ:</span>
                <span className="text-xl font-black text-amber-400">
                  {editItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0).toFixed(2)} ₼
                </span>
              </div>

              {/* Admin PIN Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin PIN Kodu (Təsdiq üçün) *</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  placeholder="••••"
                  value={editAdminPin}
                  onChange={e => setEditAdminPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-amber-500"
                />
              </div>

              {editError && (
                <div className="text-[11px] font-semibold text-red-400 bg-red-950/40 border border-red-900/30 p-2.5 rounded-xl text-center">
                  {editError}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOrder(null)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-850 transition-all cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? "Saxlanılır..." : "Dəyişiklikləri Saxla"}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 8. ADMIN PERMANENT DELETE MODAL */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">Sifarişin Bazadan Silinməsi</h3>
              <p className="text-xs text-slate-400">
                Sifariş #{deleteModalOrder.id} (<strong>{(deleteModalOrder.subtotal || 0).toFixed(2)} ₼</strong>) bazadan <strong>tamamilə silinəcək</strong>.
              </p>
            </div>

            <form onSubmit={handleDeleteOrderSubmit} className="space-y-4">
              
              {/* Admin PIN Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Admin 4-Rəqəmli PİN Kodu *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  placeholder="••••"
                  value={deleteAdminPin}
                  onChange={e => setDeleteAdminPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-red-500"
                />
              </div>

              {deleteError && (
                <div className="text-[11px] font-semibold text-red-400 bg-red-950/40 border border-red-900/30 p-2.5 rounded-xl text-center">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-850 transition-all cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-950/40 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? "Silinir..." : "Tamamilə Sil"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
