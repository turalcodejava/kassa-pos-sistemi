import React, { useState, useMemo } from "react";
import { AppState, Product, BusinessType, Expense, Courier, PaymentMethod, ExpensePaymentSource, User, Supplier, SupplierTransaction, InventoryItem, InventoryUsage, Shift } from "../types";
import { 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Database, 
  ChevronRight, 
  FileText, 
  Users, 
  Utensils, 
  Flower, 
  Package, 
  Settings,
  X,
  Edit2,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Truck,
  Clock,
  Search,
  Image as ImageIcon,
  Tag,
  Layers,
  BarChart3,
  CreditCard,
  Banknote,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  PieChart,
  Filter,
  Info,
  Building2,
  Receipt,
  Key,
  UserCheck,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  QrCode,
  Printer,
  Upload,
  Download,
  FolderUp,
  RefreshCw,
  FileUp,
  Sparkles as SparklesIcon,
  Check,
  Archive,
  MinusCircle,
  AlertCircle,
  Scale
} from "lucide-react";
import DonerReports from "./DonerReports";
import TableQRModal from "./TableQRModal";
import { processImageFile } from "../utils/imageUtils";

interface AdminPanelProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onBackToHub: () => void;
  initialSubTab?: "REPORTS" | "EXPENSES" | "SUPPLIERS" | "INVENTORY" | "PRODUCTS" | "COURIERS_TABLES" | "SHIFTS_LOSSES" | "USERS" | "DATABASE";
}

export default function AdminPanel({ state, onUpdateState, onBackToHub, initialSubTab = "REPORTS" }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"REPORTS" | "EXPENSES" | "SUPPLIERS" | "INVENTORY" | "PRODUCTS" | "COURIERS_TABLES" | "SHIFTS_LOSSES" | "USERS" | "DATABASE">(initialSubTab);
  const [activeReportType, setActiveReportType] = useState<"DONER" | "FLOWER">("DONER");

  // Date Range Filter States for Reports
  type PeriodType = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "LAST_MONTH" | "ALL" | "CUSTOM";
  const [reportPeriod, setReportPeriod] = useState<PeriodType>("ALL");
  const [reportStartDate, setReportStartDate] = useState<string>("");
  const [reportEndDate, setReportEndDate] = useState<string>("");

  // Date Range Filter States for Expenses Tab
  const [expDatePeriod, setExpDatePeriod] = useState<PeriodType>("ALL");
  const [expStartDate, setExpStartDate] = useState<string>("");
  const [expEndDate, setExpEndDate] = useState<string>("");

  // Supplier Management States
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState("ALL");
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFormName, setSupplierFormName] = useState("");
  const [supplierFormProduct, setSupplierFormProduct] = useState("");
  const [supplierFormPhone, setSupplierFormPhone] = useState("");
  const [supplierFormCompany, setSupplierFormCompany] = useState("");
  const [supplierFormCategory, setSupplierFormCategory] = useState("Ət və Toyuq");
  const [supplierFormNote, setSupplierFormNote] = useState("");
  const [supplierFormInitialDebt, setSupplierFormInitialDebt] = useState<number | "">("");
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);

  // Supplier Transaction / Purchase Record Edit State
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [txEditItemSummary, setTxEditItemSummary] = useState("");
  const [txEditPaidAmount, setTxEditPaidAmount] = useState<number | "">("");
  const [txEditTotalAmount, setTxEditTotalAmount] = useState<number | "">("");
  const [txEditPaymentSource, setTxEditPaymentSource] = useState<ExpensePaymentSource>("Kassa (Nağd)");
  const [txEditNote, setTxEditNote] = useState("");
  const [txEditDate, setTxEditDate] = useState("");
  const [isSubmittingTxEdit, setIsSubmittingTxEdit] = useState(false);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  // Supplier Purchase Modal State
  const [purchaseModalSupplier, setPurchaseModalSupplier] = useState<Supplier | null>(null);
  const [purchaseItemName, setPurchaseItemName] = useState("");
  const [purchaseCategory, setPurchaseCategory] = useState("Ət");
  const [purchaseQty, setPurchaseQty] = useState<number | "">("");
  const [purchaseUnit, setPurchaseUnit] = useState("kq");
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState<number | "">("");
  const [purchaseTotalAmount, setPurchaseTotalAmount] = useState<number | "">("");
  const [purchasePaidAmount, setPurchasePaidAmount] = useState<number | "">("");
  const [purchasePaymentSource, setPurchasePaymentSource] = useState<ExpensePaymentSource>("Kassa (Nağd)");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchaseNote, setPurchaseNote] = useState("");
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  // Supplier Pay Debt Modal State
  const [payDebtSupplier, setPayDebtSupplier] = useState<Supplier | null>(null);
  const [payDebtAmount, setPayDebtAmount] = useState<number | "">("");
  const [payDebtSource, setPayDebtSource] = useState<ExpensePaymentSource>("Kassa (Nağd)");
  const [payDebtNote, setPayDebtNote] = useState("");
  const [payDebtDate, setPayDebtDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmittingPayDebt, setIsSubmittingPayDebt] = useState(false);

  // Supplier Ledger Modal State
  const [ledgerSupplier, setLedgerSupplier] = useState<Supplier | null>(null);

  // --- Inventory & Warehouse Management States ---
  const [invSearch, setInvSearch] = useState("");
  const [invCategoryFilter, setInvCategoryFilter] = useState("ALL");
  const [invStockFilter, setInvStockFilter] = useState<"ALL" | "LOW" | "OUT" | "NORMAL">("ALL");
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [editingInvItem, setEditingInvItem] = useState<InventoryItem | null>(null);
  const [invFormName, setInvFormName] = useState("");
  const [invFormCategory, setInvFormCategory] = useState("Ət");
  const [invFormStock, setInvFormStock] = useState<number | "">("");
  const [invFormUnit, setInvFormUnit] = useState("kq");
  const [invFormMinAlert, setInvFormMinAlert] = useState<number | "">("");
  const [invFormCostPrice, setInvFormCostPrice] = useState<number | "">("");
  const [invFormAddToMenu, setInvFormAddToMenu] = useState(false);
  const [invFormMenuPrice, setInvFormMenuPrice] = useState<number | "">("");
  const [isSubmittingInvItem, setIsSubmittingInvItem] = useState(false);

  // Usage (Silinmə / Məxaric) Modal States
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [usageItem, setUsageItem] = useState<InventoryItem | null>(null);
  const [usageQty, setUsageQty] = useState<number | "">("");
  const [usageReason, setUsageReason] = useState("Gündəlik dönər üçün istifadə");
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split("T")[0]);
  const [usageNote, setUsageNote] = useState("");
  const [isSubmittingUsage, setIsSubmittingUsage] = useState(false);

  // Quick Restock (+ Mədaxil) Modal States
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number | "">("");
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // Usage History View / Filter
  const [usageFilterPeriod, setUsageFilterPeriod] = useState<PeriodType>("ALL");
  const [usageStartDate, setUsageStartDate] = useState("");
  const [usageEndDate, setUsageEndDate] = useState("");
  const [usageSearchQuery, setUsageSearchQuery] = useState("");
  
  // Product Management States
  const [prodBusiness, setProdBusiness] = useState<BusinessType>(BusinessType.Doner);
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategoryFilter, setProdCategoryFilter] = useState("ALL");
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form Fields
  const [formProdName, setFormProdName] = useState("");
  const [formProdPrice, setFormProdPrice] = useState<number>(0);
  const [formProdCategory, setFormProdCategory] = useState("");
  const [formProdStock, setFormProdStock] = useState<number | "">("");
  const [formProdIngredients, setFormProdIngredients] = useState("");
  const [formProdImage, setFormProdImage] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Image Upload State
  const [imageUploadTab, setImageUploadTab] = useState<"FILE" | "URL">("FILE");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [imageStats, setImageStats] = useState<{ originalKB: number; compressedKB: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Backup & Restore State
  const restoreFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isRestoringDatabase, setIsRestoringDatabase] = useState(false);
  const supplierFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isImportingSuppliers, setIsImportingSuppliers] = useState(false);

  // Expense form state
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState(0);
  const [expCategory, setExpCategory] = useState("Məhsul");
  const [expBusiness, setExpBusiness] = useState<BusinessType>(BusinessType.Doner);
  const [expPaymentSource, setExpPaymentSource] = useState<ExpensePaymentSource>("Nağd");
  const [expNote, setExpNote] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);

  // Expenses Tab Filters
  const [expTabFilter, setExpTabFilter] = useState<"ALL" | "CONFIRMED" | "PENDING" | "DONER" | "FLOWER" | "CASH" | "POS" | "WOLT" | "BOLT" | "YANGO" | "OTHER">("ALL");
  const [expTabSearch, setExpTabSearch] = useState("");

  // Courier form state
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");

  // Table setting state
  const [tableInput, setTableInput] = useState(state.tableCount);
  const [qrModalTable, setQrModalTable] = useState<number | "ALL" | null>(null);

  // User / Cashier Management State
  const [formUserName, setFormUserName] = useState("");
  const [formUserPin, setFormUserPin] = useState("");
  const [formUserRole, setFormUserRole] = useState<"CASHIER" | "ADMIN">("CASHIER");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  const togglePinVisibility = (userId: string) => {
    setShowPins(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Shift expansion state
  const [expandedShifts, setExpandedShifts] = useState<Record<string, boolean>>({});

  const toggleShiftExpand = (id: string) => {
    setExpandedShifts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // DATE RANGE FILTER HELPER
  const filterByDateRange = <T extends { date?: string; createdAt?: string }>(
    items: T[],
    period: PeriodType,
    startDate?: string,
    endDate?: string
  ): T[] => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const sevenDaysAgo = new Date(todayDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    return items.filter(item => {
      const rawDate = item.date || item.createdAt;
      if (!rawDate) return true;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return true;
      const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      switch (period) {
        case "TODAY":
          return dateOnly.getTime() === todayDate.getTime();
        case "YESTERDAY":
          return dateOnly.getTime() === yesterdayDate.getTime();
        case "LAST_7_DAYS":
          return dateOnly >= sevenDaysAgo && dateOnly <= todayDate;
        case "THIS_MONTH":
          return dateOnly >= firstDayThisMonth && dateOnly <= todayDate;
        case "LAST_MONTH":
          return dateOnly >= firstDayLastMonth && dateOnly <= lastDayLastMonth;
        case "CUSTOM": {
          if (!startDate && !endDate) return true;
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : (startDate ? new Date(startDate) : new Date(8640000000000000));
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return d >= start && d <= end;
        }
        case "ALL":
        default:
          return true;
      }
    });
  };

  // CALCULATE METRICS (DYNAMICALLY FILTERED BY SELECTED DATE RANGE)

  // 1. Doner Sales & Channel Breakdown (only completed/paid orders within period)
  const allDonerOrders = state.donerOrders || [];
  const completedDonerOrders = allDonerOrders.filter(o => o.status === "COMPLETED" || (!o.status && o.status !== "CANCELLED"));
  const donerOrders = useMemo(() => {
    return filterByDateRange(completedDonerOrders, reportPeriod, reportStartDate, reportEndDate);
  }, [completedDonerOrders, reportPeriod, reportStartDate, reportEndDate]);

  const totalDonerRevenue = donerOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  
  const donerCashRevenue = donerOrders.filter(o => o.paymentMethod === PaymentMethod.Cash || !o.paymentMethod).reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const donerPosRevenue = donerOrders.filter(o => o.paymentMethod === PaymentMethod.PosTerminal || o.paymentMethod === PaymentMethod.Card).reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const donerWoltRevenue = donerOrders.filter(o => o.paymentMethod === PaymentMethod.Wolt).reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const donerBoltRevenue = donerOrders.filter(o => o.paymentMethod === PaymentMethod.Bolt).reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const donerYangoRevenue = donerOrders.filter(o => o.paymentMethod === PaymentMethod.Yango).reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const donerTransfersRevenue = donerOrders.filter(o => o.paymentMethod === PaymentMethod.CardTransfer || o.paymentMethod === PaymentMethod.M10).reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const donerAppsRevenue = donerWoltRevenue + donerBoltRevenue + donerYangoRevenue;

  // 1. Doner Expenses Breakdown (within selected period)
  const allExpensesInPeriod = useMemo(() => {
    return filterByDateRange(state.expenses || [], reportPeriod, reportStartDate, reportEndDate);
  }, [state.expenses, reportPeriod, reportStartDate, reportEndDate]);

  const donerExpensesList = useMemo(() => {
    return allExpensesInPeriod.filter(e => e.business === BusinessType.Doner || !e.business);
  }, [allExpensesInPeriod]);

  const confirmedDonerExpenses = donerExpensesList.filter(e => e.isConfirmed !== false);
  const pendingDonerExpenses = donerExpensesList.filter(e => e.isConfirmed === false);
  const totalDonerExpenses = confirmedDonerExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPendingDonerExpenses = pendingDonerExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const donerCashExpenses = confirmedDonerExpenses
    .filter(e => !e.paymentSource || e.paymentSource === "Nağd" || e.paymentSource === "Kassa (Nağd)")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const donerPosExpenses = confirmedDonerExpenses
    .filter(e => e.paymentSource === "POS Terminal" || e.paymentSource === "Bank Kartı")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const donerWoltExpenses = confirmedDonerExpenses
    .filter(e => e.paymentSource === "Wolt")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const donerBoltExpenses = confirmedDonerExpenses
    .filter(e => e.paymentSource === "Bolt")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const donerYangoExpenses = confirmedDonerExpenses
    .filter(e => e.paymentSource === "Yango")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const donerOtherExpenses = confirmedDonerExpenses
    .filter(e => e.paymentSource === "m10" || e.paymentSource === "Digər")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Net Balances per payment channel (Daxil olan satış - Həmin kanal üzrə xərc)
  const netDonerCash = donerCashRevenue - donerCashExpenses;
  const netDonerPos = donerPosRevenue - donerPosExpenses;
  const netDonerWolt = donerWoltRevenue - donerWoltExpenses;
  const netDonerBolt = donerBoltRevenue - donerBoltExpenses;
  const netDonerYango = donerYangoRevenue - donerYangoExpenses;
  const netDonerTransfers = donerTransfersRevenue - donerOtherExpenses;
  const netDonerProfit = totalDonerRevenue - totalDonerExpenses;

  // Doner expenses grouped by category (Pullar hara xərclənib?)
  const donerExpensesByCategory = useMemo(() => {
    const map: Record<string, { 
      total: number; 
      cash: number; 
      pos: number; 
      wolt: number;
      bolt: number;
      yango: number;
      other: number;
      count: number; 
      items: Expense[] 
    }> = {};

    confirmedDonerExpenses.forEach(e => {
      const cat = e.category || "Digər";
      if (!map[cat]) {
        map[cat] = { total: 0, cash: 0, pos: 0, wolt: 0, bolt: 0, yango: 0, other: 0, count: 0, items: [] };
      }
      map[cat].total += e.amount;
      map[cat].count += 1;
      map[cat].items.push(e);

      if (e.paymentSource === "POS Terminal" || e.paymentSource === "Bank Kartı") {
        map[cat].pos += e.amount;
      } else if (e.paymentSource === "Wolt") {
        map[cat].wolt += e.amount;
      } else if (e.paymentSource === "Bolt") {
        map[cat].bolt += e.amount;
      } else if (e.paymentSource === "Yango") {
        map[cat].yango += e.amount;
      } else if (e.paymentSource === "m10" || e.paymentSource === "Digər") {
        map[cat].other += e.amount;
      } else {
        map[cat].cash += e.amount;
      }
    });

    return Object.entries(map)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [confirmedDonerExpenses]);

  // 2. Flowers Sales & Channel Breakdown (within selected period)
  const flowerOrders = useMemo(() => {
    return filterByDateRange(state.flowerOrders || [], reportPeriod, reportStartDate, reportEndDate);
  }, [state.flowerOrders, reportPeriod, reportStartDate, reportEndDate]);

  const totalFlowerRevenue = flowerOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  
  const flowerPosRevenue = flowerOrders.filter(o => o.paymentMethod === PaymentMethod.PosTerminal || o.paymentMethod === PaymentMethod.Card || o.orderType === "POS").reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const flowerCashRevenue = flowerOrders.filter(o => o.paymentMethod === PaymentMethod.Cash).reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const flowerWebRevenue = flowerOrders.filter(o => o.orderType === "WEB").reduce((sum, o) => sum + (o.subtotal || 0), 0);
  
  // 2. Flowers Expenses Breakdown (within selected period)
  const flowerExpensesList = useMemo(() => {
    return filterByDateRange(state.expenses || [], reportPeriod, reportStartDate, reportEndDate)
      .filter(e => e.business === "FLOWER" || e.category === "Gül Alışı" || e.category === "Gül Aksesuarları");
  }, [state.expenses, reportPeriod, reportStartDate, reportEndDate]);

  const confirmedFlowerExpenses = flowerExpensesList.filter(e => e.isConfirmed !== false);
  const totalFlowerExpenses = confirmedFlowerExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const flowerCashExpenses = confirmedFlowerExpenses
    .filter(e => !e.paymentSource || e.paymentSource === "Nağd" || e.paymentSource === "Kassa (Nağd)")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const flowerPosExpenses = confirmedFlowerExpenses
    .filter(e => e.paymentSource === "POS Terminal" || e.paymentSource === "Bank Kartı")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const flowerWoltExpenses = confirmedFlowerExpenses
    .filter(e => e.paymentSource === "Wolt")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const flowerBoltExpenses = confirmedFlowerExpenses
    .filter(e => e.paymentSource === "Bolt")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const flowerYangoExpenses = confirmedFlowerExpenses
    .filter(e => e.paymentSource === "Yango")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netFlowerCash = flowerCashRevenue - flowerCashExpenses;
  const netFlowerPos = flowerPosRevenue - flowerPosExpenses;
  const netFlowerProfit = totalFlowerRevenue - totalFlowerExpenses;

  // Flower expenses grouped by category
  const flowerExpensesByCategory = useMemo(() => {
    const map: Record<string, { total: number; cash: number; pos: number; count: number; items: Expense[] }> = {};
    flowerExpensesList.forEach(e => {
      const cat = e.category || "Digər";
      if (!map[cat]) map[cat] = { total: 0, cash: 0, pos: 0, count: 0, items: [] };
      map[cat].total += e.amount;
      map[cat].count += 1;
      map[cat].items.push(e);
      if (e.paymentSource === "POS Terminal" || e.paymentSource === "Bank Kartı") {
        map[cat].pos += e.amount;
      } else {
        map[cat].cash += e.amount;
      }
    });
    return Object.entries(map)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [flowerExpensesList]);

  // Courier report calculation
  const getCourierReport = () => {
    return state.couriers.map(courier => {
      const deliveries = donerOrders.filter(o => o.orderType === "DELIVERY" && o.courierId === courier.id);
      const deliveryCount = deliveries.length;
      
      let totalDonersDelivered = 0;
      deliveries.forEach(del => {
        del.items.forEach(item => {
          totalDonersDelivered += item.quantity;
        });
      });

      const totalRevenue = deliveries.reduce((sum, o) => sum + o.subtotal, 0);

      return {
        ...courier,
        deliveryCount,
        totalDonersDelivered,
        totalRevenue
      };
    });
  };

  // SUPPLIER METRICS & HELPERS
  const suppliers = state.suppliers || [];
  const totalSuppliersCount = suppliers.length;
  const totalSuppliersDebt = suppliers.reduce((sum, s) => sum + (s.debtBalance || 0), 0);
  const totalSuppliersPurchases = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
  const totalSuppliersPaid = suppliers.reduce((sum, s) => sum + (s.totalPaid || 0), 0);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(sup => {
      const matchesSearch = !supplierSearch || 
        sup.name.toLowerCase().includes(supplierSearch.toLowerCase()) || 
        (sup.phone && sup.phone.includes(supplierSearch)) ||
        (sup.company && sup.company.toLowerCase().includes(supplierSearch.toLowerCase()));
      const matchesCat = supplierCategoryFilter === "ALL" || sup.category === supplierCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [suppliers, supplierSearch, supplierCategoryFilter]);

  // SUPPLIER ACTIONS
  const handleOpenSupplierModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupplierFormName(sup.name);
      setSupplierFormProduct(sup.suppliedProduct || "");
      setSupplierFormPhone(sup.phone || "");
      setSupplierFormCompany(sup.company || "");
      setSupplierFormCategory(sup.category || "Ət və Toyuq");
      setSupplierFormNote(sup.note || "");
      setSupplierFormInitialDebt(sup.debtBalance || 0);
    } else {
      setEditingSupplier(null);
      setSupplierFormName("");
      setSupplierFormProduct("");
      setSupplierFormPhone("");
      setSupplierFormCompany("");
      setSupplierFormCategory("Ət və Toyuq");
      setSupplierFormNote("");
      setSupplierFormInitialDebt("");
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormName.trim()) {
      triggerToast("Təchizatçı və ya məhsul adı daxil edilməlidir!");
      return;
    }
    setIsSubmittingSupplier(true);

    try {
      if (editingSupplier) {
        const res = await fetch("/api/suppliers/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingSupplier.id,
            updatedFields: {
              name: supplierFormName,
              suppliedProduct: supplierFormProduct,
              phone: supplierFormPhone,
              company: supplierFormCompany,
              category: supplierFormCategory,
              note: supplierFormNote,
              debtBalance: typeof supplierFormInitialDebt === "number" ? supplierFormInitialDebt : undefined
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          onUpdateState(data.state);
          triggerToast("Təchizatçı və məhsul məlumatları yeniləndi! ✔️");
          setIsSupplierModalOpen(false);
        } else {
          triggerToast(data.error || "Xəta baş verdi");
        }
      } else {
        const res = await fetch("/api/suppliers/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplier: {
              name: supplierFormName,
              suppliedProduct: supplierFormProduct,
              phone: supplierFormPhone,
              company: supplierFormCompany,
              category: supplierFormCategory,
              note: supplierFormNote,
              debtBalance: Number(supplierFormInitialDebt) || 0,
              totalPurchases: Number(supplierFormInitialDebt) || 0
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          onUpdateState(data.state);
          triggerToast("Yeni təchizatçı əlavə olundu! ✔️");
          setIsSupplierModalOpen(false);
        } else {
          triggerToast(data.error || "Xəta baş verdi");
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi.");
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  const handleOpenEditTx = (tx: any) => {
    setEditingTransaction(tx);
    setTxEditItemSummary(tx.itemsSummary || "");
    setTxEditPaidAmount(tx.paidAmount !== undefined ? tx.paidAmount : (tx.totalAmount || ""));
    setTxEditTotalAmount(tx.totalAmount !== undefined ? tx.totalAmount : (tx.paidAmount || ""));
    setTxEditPaymentSource(tx.paymentSource || "Kassa (Nağd)");
    setTxEditNote(tx.note || "");
    setTxEditDate(tx.date || new Date().toISOString().split("T")[0]);
  };

  const handleSaveTransactionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const paidNum = Number(txEditPaidAmount);
    const totalNum = editingTransaction.type === "PAYMENT" ? paidNum : Number(txEditTotalAmount);

    if (editingTransaction.type === "PAYMENT" && (isNaN(paidNum) || paidNum <= 0)) {
      triggerToast("Ödəniş məbləği 0-dan böyük olmalıdır!");
      return;
    }
    if (editingTransaction.type === "PURCHASE" && (isNaN(totalNum) || totalNum <= 0)) {
      triggerToast("Ümumi alış məbləği 0-dan böyük olmalıdır!");
      return;
    }

    setIsSubmittingTxEdit(true);

    try {
      const res = await fetch("/api/suppliers/transactions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTransaction.id,
          updatedFields: {
            itemsSummary: txEditItemSummary,
            totalAmount: totalNum,
            paidAmount: paidNum,
            paymentSource: txEditPaymentSource,
            note: txEditNote,
            date: txEditDate
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        if (data.supplier && ledgerSupplier && data.supplier.id === ledgerSupplier.id) {
          setLedgerSupplier(data.supplier);
        } else if (ledgerSupplier && data.state.suppliers) {
          const updatedSup = data.state.suppliers.find((s: Supplier) => s.id === ledgerSupplier.id);
          if (updatedSup) setLedgerSupplier(updatedSup);
        }
        triggerToast("Təchizatçı əməliyyatı və borc qalığı uğurla yeniləndi! ✔️");
        setEditingTransaction(null);
      } else {
        triggerToast(data.error || "Xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi.");
    } finally {
      setIsSubmittingTxEdit(false);
    }
  };

  const handleDeleteTransaction = async (tx: any) => {
    const isPayment = tx.type === "PAYMENT";
    const label = isPayment ? "Borc ödənişi" : "Mal alışı";
    const amountStr = (tx.paidAmount || tx.totalAmount || 0).toFixed(2);

    if (!window.confirm(`"${tx.itemsSummary || label}" (${amountStr} ₼) əməliyyatını silmək istədiyinizə əminsiniz?\n\nBu əməliyyat silindikdə təchizatçının borc qalığı və kassa xərcləri avtomatik bərpa ediləcək.`)) {
      return;
    }

    setIsDeletingTx(true);
    try {
      const res = await fetch("/api/suppliers/transactions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tx.id })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        if (data.supplier && ledgerSupplier && data.supplier.id === ledgerSupplier.id) {
          setLedgerSupplier(data.supplier);
        } else if (ledgerSupplier && data.state.suppliers) {
          const updatedSup = data.state.suppliers.find((s: Supplier) => s.id === ledgerSupplier.id);
          if (updatedSup) setLedgerSupplier(updatedSup);
        }
        triggerToast("Təchizatçı əməliyyatı silindi və borc qalığı bərpa edildi! ✔️");
        if (editingTransaction && editingTransaction.id === tx.id) {
          setEditingTransaction(null);
        }
      } else {
        triggerToast(data.error || "Silinərkən xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi.");
    } finally {
      setIsDeletingTx(false);
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (supplier.debtBalance > 0) {
      if (!confirm(`Diqqət! ${supplier.name} təchizatçısına ${supplier.debtBalance.toFixed(2)} ₼ borc qalığı var. Yenə də silinsin?`)) {
        return;
      }
    } else if (!confirm(`${supplier.name} təchizatçısını silmək istədiyinizdən əminsiniz?`)) {
      return;
    }

    try {
      const res = await fetch("/api/suppliers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: supplier.id })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Təchizatçı silindi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordSupplierPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseModalSupplier) return;
    const tot = Number(purchaseTotalAmount) || 0;
    if (tot <= 0) {
      triggerToast("Alışın ümumi məbləğini daxil edin!");
      return;
    }
    const paid = Number(purchasePaidAmount) || 0;
    setIsSubmittingPurchase(true);

    try {
      const res = await fetch("/api/suppliers/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: purchaseModalSupplier.id,
          totalAmount: tot,
          paidAmount: paid,
          paymentSource: purchasePaymentSource,
          date: purchaseDate,
          note: purchaseNote,
          inventoryItemName: purchaseItemName || undefined,
          itemCategory: purchaseCategory || undefined,
          quantity: Number(purchaseQty) || undefined,
          unit: purchaseUnit || undefined,
          unitPrice: Number(purchaseUnitPrice) || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Mal alışı qeydə alındı və borc/anbar yeniləndi! ✔️");
        setPurchaseModalSupplier(null);
        setPurchaseItemName("");
        setPurchaseTotalAmount("");
        setPurchasePaidAmount("");
        setPurchaseQty("");
        setPurchaseUnitPrice("");
        setPurchaseNote("");
      } else {
        triggerToast(data.error || "Xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi.");
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const handlePaySupplierDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebtSupplier) return;
    const amt = Number(payDebtAmount) || 0;
    if (amt <= 0) {
      triggerToast("Ödəniş məbləğini daxil edin!");
      return;
    }
    setIsSubmittingPayDebt(true);

    try {
      const res = await fetch("/api/suppliers/pay-debt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: payDebtSupplier.id,
          amount: amt,
          paymentSource: payDebtSource,
          date: payDebtDate,
          note: payDebtNote
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Borc ödənişi qeydə alındı və kassadan çıxıldı! ✔️");
        setPayDebtSupplier(null);
        setPayDebtAmount("");
        setPayDebtNote("");
      } else {
        triggerToast(data.error || "Xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi.");
    } finally {
      setIsSubmittingPayDebt(false);
    }
  };

  // --- INVENTORY / WAREHOUSE HANDLERS ---
  const handleOpenInvModal = (item?: InventoryItem) => {
    if (item) {
      setEditingInvItem(item);
      setInvFormName(item.name);
      setInvFormCategory(item.category || "Ət");
      setInvFormStock(item.stock || 0);
      setInvFormUnit(item.unit || "kq");
      setInvFormMinAlert(item.minStockAlert !== undefined ? item.minStockAlert : "");
      setInvFormCostPrice(item.costPrice !== undefined ? item.costPrice : "");
      setInvFormAddToMenu(false);
      setInvFormMenuPrice("");
    } else {
      setEditingInvItem(null);
      setInvFormName("");
      setInvFormCategory("Ət");
      setInvFormStock("");
      setInvFormUnit("kq");
      setInvFormMinAlert("");
      setInvFormCostPrice("");
      setInvFormAddToMenu(false);
      setInvFormMenuPrice("");
    }
    setIsInvModalOpen(true);
  };

  const handleSaveInvItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invFormName.trim()) {
      triggerToast("Məhsulun adını daxil edin!");
      return;
    }
    setIsSubmittingInvItem(true);
    try {
      const isEdit = !!editingInvItem;
      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isEdit ? "EDIT" : "ADD",
          item: {
            id: editingInvItem ? editingInvItem.id : undefined,
            name: invFormName.trim(),
            category: invFormCategory,
            stock: Number(invFormStock) || 0,
            unit: invFormUnit,
            minStockAlert: invFormMinAlert !== "" ? Number(invFormMinAlert) : undefined,
            costPrice: invFormCostPrice !== "" ? Number(invFormCostPrice) : undefined,
            addToMenu: invFormAddToMenu,
            menuPrice: Number(invFormMenuPrice) || 0
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(isEdit ? "Anbar məhsulu yeniləndi! ✔️" : "Yeni anbar məhsulu əlavə edildi! ✔️");
        setIsInvModalOpen(false);
      } else {
        triggerToast(data.error || "Xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi");
    } finally {
      setIsSubmittingInvItem(false);
    }
  };

  const handleDeleteInvItem = async (item: InventoryItem) => {
    if (!window.confirm(`"${item.name}" məhsulunu anbardan tamamilə silmək istədiyinizə əminsiniz?`)) return;
    try {
      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", item: { id: item.id } })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(`"${item.name}" anbardan silindi.`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Silinmə zamanı xəta baş verdi.");
    }
  };

  const handleOpenUsageModal = (item?: InventoryItem) => {
    setUsageItem(item || null);
    setUsageQty("");
    setUsageReason("Gündəlik dönər üçün istifadə");
    setUsageDate(new Date().toISOString().split("T")[0]);
    setUsageNote("");
    setIsUsageModalOpen(true);
  };

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageItem) {
      triggerToast("Silinəcək məhsulu seçin!");
      return;
    }
    const q = Number(usageQty);
    if (isNaN(q) || q <= 0) {
      triggerToast("Düzgün silinmə/istifadə miqdarı daxil edin!");
      return;
    }
    setIsSubmittingUsage(true);
    try {
      const res = await fetch("/api/inventory/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: usageItem.id,
          quantity: q,
          reason: usageReason,
          date: usageDate,
          note: usageNote,
          createdByName: "Admin"
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(`"${usageItem.name}" üçün ${q} ${usageItem.unit} silindi! Qalan qalıq: ${data.item.stock} ${usageItem.unit} ✔️`);
        setIsUsageModalOpen(false);
      } else {
        triggerToast(data.error || "Xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi");
    } finally {
      setIsSubmittingUsage(false);
    }
  };

  const handleDeleteUsage = async (usage: InventoryUsage) => {
    if (!window.confirm(`"${usage.itemName}" üçün qeyd edilmiş ${usage.quantity} ${usage.unit} silinmə qeydini ləğv edib miqdarı anbara geri qaytarmaq istəyirsiniz?`)) return;
    try {
      const res = await fetch("/api/inventory/usage/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: usage.id, restoreStock: true })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Silinmə qeydi ləğv edildi və miqdar anbara qaytarıldı! ✔️");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRestockModal = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockQty("");
    setIsRestockModalOpen(true);
  };

  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const q = Number(restockQty);
    if (isNaN(q) || q <= 0) {
      triggerToast("Mədaxil miqdarını daxil edin!");
      return;
    }
    setIsSubmittingRestock(true);
    try {
      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADJUST",
          item: {
            id: restockItem.id,
            quantityToAdd: q
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(`"${restockItem.name}" anbarına +${q} ${restockItem.unit} mədaxil edildi! ✔️`);
        setIsRestockModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // EXPENSE ACTION

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || expAmount <= 0) {
      triggerToast("Xərci tam doldurun!");
      return;
    }

    try {
      const dateToSave = expCustomDateTime 
        ? expCustomDateTime.split("T")[0] 
        : (expDate || new Date().toISOString().split("T")[0]);
      const timestampToSave = expCustomDateTime 
        ? new Date(expCustomDateTime).toISOString() 
        : new Date().toISOString();

      const response = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD",
          expense: {
            title: expTitle,
            amount: Number(expAmount),
            category: expCategory,
            date: dateToSave,
            timestamp: timestampToSave,
            business: expBusiness,
            paymentSource: expPaymentSource,
            note: expNote.trim() || undefined,
            isConfirmed: true // Admin added expenses default to confirmed
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Xərc uğurla qeydiyyata alındı və təsdiqləndi!");
        setExpTitle("");
        setExpAmount(0);
        setExpNote("");
        setExpCustomDateTime("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmExpense = async (expense: Expense, isConfirmed: boolean) => {
    try {
      const response = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONFIRM",
          expense: {
            id: expense.id,
            isConfirmed,
            confirmedBy: "Admin"
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(
          isConfirmed 
            ? `"${expense.title}" xərci təsdiqləndi və hesabat/kassadan çıxıldı!` 
            : `"${expense.title}" xərcinin təsdiqi ləğv edildi.`
        );
      }
    } catch (err) {
      console.error(err);
      triggerToast("Təsdiqləmə zamanı xəta baş verdi.");
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      const response = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          expense
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Xərc silindi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // COURIER ACTION

  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName || !courierPhone) {
      triggerToast("Kuryer məlumatlarını doldurun!");
      return;
    }

    try {
      const response = await fetch("/api/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD",
          courier: { name: courierName, phone: courierPhone }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Kuryer reyestrə əlavə olundu!");
        setCourierName("");
        setCourierPhone("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourier = async (courier: Courier) => {
    try {
      const response = await fetch("/api/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          courier
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Kuryer siyahıdan çıxarıldı.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // USER / CASHIER ACTIONS

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserName.trim() || !formUserPin.trim()) {
      triggerToast("Ad və PIN kodu daxil edin!");
      return;
    }
    if (formUserPin.trim().length < 4) {
      triggerToast("PIN kod ən azı 4 rəqəmdən ibarət olmalıdır!");
      return;
    }

    setIsSubmittingUser(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingUser ? "EDIT" : "ADD",
          user: {
            id: editingUser?.id,
            name: formUserName.trim(),
            pin: formUserPin.trim(),
            role: formUserRole
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(editingUser ? "İstifadəçi məlumatları yeniləndi!" : "Yeni kassir uğurla əlavə edildi!");
        setFormUserName("");
        setFormUserPin("");
        setFormUserRole("CASHIER");
        setEditingUser(null);
      } else {
        triggerToast(data.error || "Xəta baş verdi!");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Şəbəkə xətası baş verdi.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleEditUserClick = (u: User) => {
    setEditingUser(u);
    setFormUserName(u.name);
    setFormUserPin(u.pin);
    setFormUserRole(u.role);
  };

  const handleCancelUserEdit = () => {
    setEditingUser(null);
    setFormUserName("");
    setFormUserPin("");
    setFormUserRole("CASHIER");
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`"${user.name}" adlı ${user.role === "ADMIN" ? "Admini" : "Kassiri"} silmək istədiyinizə əminsiniz?`)) return;

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          user: { id: user.id }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(`"${user.name}" silindi.`);
        if (editingUser?.id === user.id) {
          handleCancelUserEdit();
        }
      } else {
        triggerToast(data.error || "Silinərkən xəta baş verdi!");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Şəbəkə xətası baş verdi.");
    }
  };

  // CONFIG ACTION

  const handleUpdateTableCount = async () => {
    const val = parseInt(String(tableInput));
    if (!val || val <= 0) return;

    try {
      const response = await fetch("/api/table/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: val })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(`Masa sayı ${val} olaraq yeniləndi!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Flower stock quick increments (Mal qəbulu)
  const handleQuickAddStock = async (prod: Product, qty: number) => {
    const payload = {
      action: "EDIT",
      product: {
        ...prod,
        stock: (prod.stock || 0) + qty
      }
    };

    try {
      const response = await fetch("/api/flower/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(`${prod.name} ehtiyatı +${qty} ədəd artırıldı!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // PRODUCT CRUD HANDLERS
  const handleOpenAddProduct = (business: BusinessType) => {
    setEditingProduct(null);
    setProdBusiness(business);
    setFormProdName("");
    setFormProdPrice(0);
    setFormProdCategory(business === BusinessType.Doner ? "Dönər" : "Güllər");
    setFormProdStock("");
    setFormProdIngredients("");
    setFormProdImage("");
    setImageUploadTab("FILE");
    setImageStats(null);
    setIsProdModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdBusiness(prod.business);
    setFormProdName(prod.name);
    setFormProdPrice(prod.price);
    setFormProdCategory(prod.category);
    setFormProdStock(prod.stock !== undefined ? prod.stock : "");
    setFormProdIngredients(prod.ingredients ? prod.ingredients.join(", ") : "");
    setFormProdImage(prod.image || "");
    setImageUploadTab(prod.image && prod.image.startsWith("http") ? "URL" : "FILE");
    setImageStats(null);
    setIsProdModalOpen(true);
  };

  // Image Processing Handlers
  const handleProcessImageFile = async (file: File) => {
    if (!file) return;
    setIsProcessingImage(true);
    try {
      const result = await processImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
      setFormProdImage(result.dataUrl);
      setImageStats({ originalKB: result.originalSizeKB, compressedKB: result.compressedSizeKB });
      triggerToast(`Şəkil optimallaşdırıldı (${result.originalSizeKB} KB → ${result.compressedSizeKB} KB)`);
    } catch (err: any) {
      console.error("Image processing error:", err);
      triggerToast(err.message || "Şəkil yüklənərkən xəta baş verdi.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setFormProdImage("");
    setImageStats(null);
  };

  // Database Backup (JSON Export)
  const handleExportBackupJson = () => {
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const backupData = JSON.stringify(state, null, 2);
      const blob = new Blob([backupData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KozDoner_Menyu_Baza_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast("Baza və Menyu uğurla JSON faylı kimi endirildi!");
    } catch (err) {
      console.error(err);
      triggerToast("Fayl endirilərkən xəta baş verdi.");
    }
  };

  // Export ONLY Suppliers & Supplier Transactions
  const handleExportSuppliersJson = () => {
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const payload = {
        exportedAt: new Date().toISOString(),
        type: "SUPPLIERS_ONLY",
        suppliers: state.suppliers || [],
        supplierTransactions: state.supplierTransactions || []
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KozDoner_Techizatcilar_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast("Təchizatçılar bazası uğurla JSON faylı kimi endirildi!");
    } catch (err) {
      console.error(err);
      triggerToast("Fayl endirilərkən xəta baş verdi.");
    }
  };

  // Import ONLY Suppliers & Supplier Transactions (accepts either supplier json or full data.json)
  const handleImportSuppliersFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingSuppliers(true);
      const text = await file.text();
      const parsed = JSON.parse(text);

      const targetSuppliers = parsed.suppliers || [];
      const targetTransactions = parsed.supplierTransactions || [];

      if (!Array.isArray(targetSuppliers) || targetSuppliers.length === 0) {
        alert("Faylda heç bir təchizatçı tapılmadı! Zəhmət olmasa düzgün baza və ya təchizatçı JSON faylı seçin.");
        setIsImportingSuppliers(false);
        if (supplierFileInputRef.current) supplierFileInputRef.current.value = "";
        return;
      }

      const confirmed = window.confirm(
        `Diqqət: "${file.name}" faylından ${targetSuppliers.length} təchizatçı və ${targetTransactions.length} əməliyyat serverə köçürüləcək. Digər məlumatlar (masalar, sifarişlər) dəyişməyəcək. Davam edilsin?`
      );

      if (!confirmed) {
        setIsImportingSuppliers(false);
        if (supplierFileInputRef.current) supplierFileInputRef.current.value = "";
        return;
      }

      const res = await fetch("/api/state/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...state,
          suppliers: targetSuppliers,
          supplierTransactions: targetTransactions
        })
      });

      const d = await res.json();
      if (d.success) {
        onUpdateState(d.state);
        triggerToast(`✅ ${targetSuppliers.length} təchizatçı və ${targetTransactions.length} əməliyyat serverə uğurla köçürüldü!`);
      } else {
        triggerToast("Serverə yazılarkən xəta baş verdi.");
      }
    } catch (err) {
      console.error(err);
      alert("Fayl oxunarkən xəta baş verdi. Zəhmət olmasa düzgün JSON faylı seçin.");
    } finally {
      setIsImportingSuppliers(false);
      if (supplierFileInputRef.current) supplierFileInputRef.current.value = "";
    }
  };

  // Database Restore (JSON Import)
  const handleRestoreJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Diqqət: "${file.name}" faylındakı menyu və məlumatlar cari sistemə yüklənəcək. Davam edilsin?`)) {
      if (e.target) e.target.value = "";
      return;
    }

    setIsRestoringDatabase(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Faylın strukturu düzgün JSON deyil.");
      }

      const response = await fetch("/api/state/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });

      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Menyu və baza uğurla bərpa edildi!");
      } else {
        triggerToast(data.error || "Baza bərpa edilərkən xəta baş verdi.");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast("JSON faylı oxunarkən xəta: " + (err.message || "Yanlış fayl"));
    } finally {
      setIsRestoringDatabase(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProdName.trim() || formProdPrice <= 0 || !formProdCategory.trim()) {
      triggerToast("Məhsul adı, qiymət və kateqoriyanı düzgün daxil edin!");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const endpoint = prodBusiness === BusinessType.Doner ? "/api/doner/products" : "/api/flower/products";
      const action = editingProduct ? "EDIT" : "ADD";
      
      const ingredientsList = formProdIngredients
        .split(",")
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const productPayload: Partial<Product> = {
        name: formProdName.trim(),
        price: Number(formProdPrice),
        category: formProdCategory.trim(),
        business: prodBusiness,
        ingredients: ingredientsList.length > 0 ? ingredientsList : undefined,
        stock: formProdStock !== "" ? Number(formProdStock) : undefined,
        image: formProdImage.trim() || undefined
      };

      if (editingProduct) {
        productPayload.id = editingProduct.id;
        if (editingProduct.totalReceived !== undefined) productPayload.totalReceived = editingProduct.totalReceived;
        if (editingProduct.totalSold !== undefined) productPayload.totalSold = editingProduct.totalSold;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          product: productPayload
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(editingProduct ? "Məhsul uğurla yeniləndi!" : "Yeni məhsul menyuya əlavə edildi!");
        setIsProdModalOpen(false);
      } else {
        triggerToast("Xəta baş verdi, yenidən cəhd edin.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Şəbəkə xətası baş verdi.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`"${prod.name}" məhsulunu silmək istədiyinizə əminsiniz?`)) {
      return;
    }

    try {
      const endpoint = prod.business === BusinessType.Doner ? "/api/doner/products" : "/api/flower/products";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          product: prod
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(`"${prod.name}" menyudan silindi.`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Silinərkən xəta baş verdi.");
    }
  };

  // Reset & Database Management Handlers
  const handleClearTestOrdersOnly = async () => {
    if (!window.confirm("Bütün əvvəlki test satışlarını, sifarişləri, hesabatları, stollardakı qalıqları və xərcləri təmizləyib bazanı TƏMİZ BAŞLANĞIC üçün sıfırlamaq istəyirsiniz?\n\n(Qeyd: Məhsullarınız, menyu, qiymətlər və istifadəçilər SİLİNMƏYƏCƏK, yalnız sifariş tarixçəsi təmizlənəcək)")) {
      return;
    }

    try {
      const freshTables = (state.tables || []).map(t => ({
        ...t,
        status: "EMPTY" as const,
        items: [],
        subtotal: 0,
        guestCount: undefined
      }));

      const cleanState: AppState = {
        ...state,
        tables: freshTables,
        donerOrders: [],
        flowerOrders: [],
        expenses: [],
        shifts: [],
        inventoryLosses: []
      };

      const res = await fetch("/api/state/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanState)
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        localStorage.removeItem("sentToKitchenMap");
        triggerToast("Bütün test sifarişləri və hesabatlar uğurla təmizləndi! Sistem real işə hazırdır.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Sıfırlama zamanı xəta baş verdi.");
    }
  };

  const handleFullFactoryReset = async () => {
    if (!window.confirm("⚠️ DİQQƏT: Bütün sistemi (bütün məhsullar, sifarişlər, xərclər daxil olmaqla) İLKİN ZAVOD vəziyyətinə sıfırlamaq istədiyinizə ƏMİNSİNİZ?")) {
      return;
    }

    try {
      const response = await fetch("/api/state");
      const defaultState = await response.json();

      const freshTables = Array.from({ length: 12 }, (_, i) => ({
        tableNumber: i + 1,
        tableName: `Masa ${i + 1}`,
        section: "Əsas Zal",
        status: "EMPTY" as const,
        shape: "SQUARE" as const,
        capacity: 4,
        guestCount: 0,
        posX: 10 + (i % 4) * 25,
        posY: 15 + Math.floor(i / 4) * 30,
        items: [],
        subtotal: 0
      }));

      const fullClean: Partial<AppState> = {
        ...defaultState,
        tables: freshTables,
        donerOrders: [],
        flowerOrders: [],
        expenses: [],
        shifts: [],
        inventoryLosses: [],
        tableCount: 12
      };

      const res = await fetch("/api/state/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullClean)
      });
      const d = await res.json();
      if (d.success) {
        onUpdateState(d.state);
        localStorage.removeItem("sentToKitchenMap");
        triggerToast("Sistem tam zavod vəziyyətinə sıfırlandı!");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi.");
    }
  };

  const inventoryItems = useMemo(() => state.inventoryItems || [], [state.inventoryItems]);
  const inventoryUsages = useMemo(() => state.inventoryUsages || [], [state.inventoryUsages]);

  const outOfStockItems = useMemo(() => 
    inventoryItems.filter(i => (i.stock || 0) <= 0),
    [inventoryItems]
  );

  const lowStockItems = useMemo(() => 
    inventoryItems.filter(i => {
      const stock = i.stock || 0;
      const minAlert = i.minStockAlert !== undefined && i.minStockAlert !== null ? i.minStockAlert : 5;
      return stock > 0 && stock <= minAlert;
    }),
    [inventoryItems]
  );

  const outOfStockCount = outOfStockItems.length;
  const lowStockCount = lowStockItems.length;

  const totalUsedAllTime = useMemo(() => 
    inventoryUsages.reduce((sum, u) => sum + (u.quantity || 0), 0),
    [inventoryUsages]
  );

  // Edit Shift State
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editShiftStartingCash, setEditShiftStartingCash] = useState<string>("");
  const [editShiftActualCash, setEditShiftActualCash] = useState<string>("");
  const [editShiftReceivedCash, setEditShiftReceivedCash] = useState<string>("");
  const [editShiftSpentCash, setEditShiftSpentCash] = useState<string>("");
  const [editShiftMgmtAdded, setEditShiftMgmtAdded] = useState<string>("");
  const [editShiftMgmtWithdrawn, setEditShiftMgmtWithdrawn] = useState<string>("");
  const [editShiftUserName, setEditShiftUserName] = useState<string>("");
  const [editShiftStartTime, setEditShiftStartTime] = useState<string>("");
  const [editShiftEndTime, setEditShiftEndTime] = useState<string>("");
  const [editShiftStatus, setEditShiftStatus] = useState<"ACTIVE" | "FINISHED">("FINISHED");
  const [editShiftNotes, setEditShiftNotes] = useState<string>("");
  const [editShiftAdminPin, setEditShiftAdminPin] = useState<string>("");
  const [isEditShiftModalOpen, setIsEditShiftModalOpen] = useState<boolean>(false);

  // Custom Expense DateTime state in Admin Panel
  const [expCustomDateTime, setExpCustomDateTime] = useState<string>("");

  const handleOpenEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setEditShiftStartingCash(String(shift.startingCash || 0));
    setEditShiftActualCash(String(shift.actualCashInDrawer || 0));
    setEditShiftReceivedCash(String(shift.receivedCash || 0));
    setEditShiftSpentCash(String(shift.spentCash || 0));
    setEditShiftMgmtAdded(String(shift.managementAdded || 0));
    setEditShiftMgmtWithdrawn(String(shift.managementWithdrawn || 0));
    setEditShiftUserName(shift.userName || "");
    setEditShiftStartTime(shift.startTime ? new Date(shift.startTime).toISOString().slice(0, 16) : "");
    setEditShiftEndTime(shift.endTime ? new Date(shift.endTime).toISOString().slice(0, 16) : "");
    setEditShiftStatus(shift.status || "FINISHED");
    setEditShiftNotes(shift.notes || "");
    setEditShiftAdminPin("");
    setIsEditShiftModalOpen(true);
  };

  const handleSaveEditedShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    if (!editShiftAdminPin.trim()) {
      triggerToast("Admin PİN kodu daxil edilməlidir!");
      return;
    }

    const starting = parseFloat(editShiftStartingCash) || 0;
    const actual = parseFloat(editShiftActualCash) || 0;
    const received = parseFloat(editShiftReceivedCash) || 0;
    const spent = parseFloat(editShiftSpentCash) || 0;
    const mgmtAdd = parseFloat(editShiftMgmtAdded) || 0;
    const mgmtWith = parseFloat(editShiftMgmtWithdrawn) || 0;

    const expected = starting + received + mgmtAdd - spent - mgmtWith;
    const diff = actual - expected;

    const updatedFields: Partial<Shift> = {
      startingCash: starting,
      actualCashInDrawer: actual,
      receivedCash: received,
      spentCash: spent,
      managementAdded: mgmtAdd,
      managementWithdrawn: mgmtWith,
      expectedCash: expected,
      difference: diff,
      userName: editShiftUserName.trim() || editingShift.userName,
      startTime: editShiftStartTime ? new Date(editShiftStartTime).toISOString() : editingShift.startTime,
      endTime: editShiftEndTime ? new Date(editShiftEndTime).toISOString() : editingShift.endTime,
      status: editShiftStatus,
      notes: editShiftNotes.trim() || undefined
    };

    try {
      const response = await fetch("/api/shift/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: editingShift.id,
          updatedShift: updatedFields,
          adminPin: editShiftAdminPin.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        setIsEditShiftModalOpen(false);
        setEditingShift(null);
        triggerToast("Növbə məlumatları və kassa qalığı uğurla yeniləndi!");
      } else {
        triggerToast(data.error || "PİN kod yanlışdır və ya xəta baş verdi.");
      }
    } catch (err) {
      console.error(err);
      // Fallback local update if offline
      const updatedShifts = (state.shifts || []).map(sh => 
        sh.id === editingShift.id ? { ...sh, ...updatedFields } : sh
      );
      onUpdateState({ ...state, shifts: updatedShifts });
      setIsEditShiftModalOpen(false);
      setEditingShift(null);
      triggerToast("Növbə məlumatları yeniləndi (Lokal)!");
    }
  };

  const handleDeleteShift = async (shift: Shift) => {
    const pin = prompt(`"${shift.userName}" (${shift.startTime ? new Date(shift.startTime).toLocaleDateString("az-AZ") : ""}) növbəsini silmək üçün Admin PİN kodunu daxil edin:`);
    if (!pin) return;

    try {
      const response = await fetch("/api/shift/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: shift.id,
          adminPin: pin.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Növbə uğurla silindi!");
      } else {
        triggerToast(data.error || "PİN kod yanlışdır.");
      }
    } catch (err) {
      console.error(err);
      const updatedShifts = (state.shifts || []).filter(sh => sh.id !== shift.id);
      onUpdateState({ ...state, shifts: updatedShifts });
      triggerToast("Növbə silindi (Lokal)!");
    }
  };

  const handleConfirmCashHandover = async (shift: Shift) => {
    const amount = (shift.cashHandover?.amount || shift.actualCashInDrawer || 0);
    const recipient = shift.cashHandover?.recipient || "Rəhbərlik";
    const supId = shift.cashHandover?.supplierId;
    const sup = supId ? (state.suppliers || []).find(s => s.id === supId) : undefined;

    let confirmPrompt = `"${shift.userName}" növbəsi: ${amount.toFixed(2)} ₼ nağd pulun "${recipient}" tərəfindən təhvil alındığını təsdiqləyirsiniz?`;
    if (sup) {
      confirmPrompt = `"${shift.userName}" növbəsi: ${amount.toFixed(2)} ₼ nağd kassa vəsaitinin "${sup.name}" təchizatçısına verildiyini təsdiqləyirsiniz?\n\n⚠️ Təsdiq etdikdə təchizatçının borcundan (${(sup.debtBalance || 0).toFixed(2)} ₼) ${amount.toFixed(2)} ₼ dərhal silinəcək və ödəniş rəsmi qeydə alınacaq.`;
    }

    const confirmed = window.confirm(confirmPrompt);
    if (!confirmed) return;

    try {
      const response = await fetch("/api/shift/confirm-handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: shift.id,
          adminPin: "1234"
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(sup ? `"${sup.name}" üçün ${amount.toFixed(2)} ₼ nağd ödəniş təsdiqləndi və borcdan silindi! ✔️` : "Nağd pul təhvili Rəhbərlik tərəfindən uğurla təsdiqləndi! ✔️");
      } else {
        triggerToast(data.error || "Təsdiqləmə zamanı xəta baş verdi.");
      }
    } catch (err) {
      console.error(err);
      // Fallback local update if offline
      const updatedShifts = (state.shifts || []).map(sh => {
        if (sh.id === shift.id) {
          return {
            ...sh,
            cashHandover: sh.cashHandover ? { ...sh.cashHandover, isConfirmed: true, confirmedAt: new Date().toISOString(), confirmedBy: "Rəhbərlik (Admin)" } : undefined
          };
        }
        return sh;
      });

      let updatedSuppliers = state.suppliers || [];
      let updatedTx = state.supplierTransactions || [];
      if (supId) {
        updatedSuppliers = updatedSuppliers.map(s => {
          if (s.id === supId) {
            return {
              ...s,
              totalPaid: (s.totalPaid || 0) + amount,
              debtBalance: Math.max(0, (s.debtBalance || 0) - amount)
            };
          }
          return s;
        });
        updatedTx = [
          {
            id: "tx_sup_" + Date.now(),
            supplierId: supId,
            supplierName: sup ? sup.name : recipient,
            type: "PAYMENT" as const,
            totalAmount: amount,
            paidAmount: amount,
            debtAmount: 0,
            paymentSource: "Kassa (Nağd)",
            note: shift.cashHandover?.note || "Nağd kassa qalığından borc ödənişi təsdiqləndi",
            date: new Date().toISOString().split("T")[0],
            timestamp: new Date().toISOString(),
            itemsSummary: `Nağd Kassa Borc ödənişi: ${amount.toFixed(2)} ₼`
          },
          ...updatedTx
        ];
      }

      onUpdateState({ ...state, shifts: updatedShifts, suppliers: updatedSuppliers, supplierTransactions: updatedTx });
      triggerToast(sup ? `"${sup.name}" borcundan ${amount.toFixed(2)} ₼ silindi (Lokal)!` : "Nağd pul təhvili təsdiqləndi (Lokal)!");
    }
  };

  const handleConfirmPosAllocation = async (shift: Shift) => {
    if (!shift.posAllocation) return;
    const amount = shift.posAllocation.amount;
    const allocatedTo = shift.posAllocation.allocatedTo;
    const supId = shift.posAllocation.supplierId;
    const sup = supId ? (state.suppliers || []).find(s => s.id === supId) : undefined;

    let confirmPrompt = `"${shift.userName}" növbəsi: "${allocatedTo}" üçün ayrılmış ${amount.toFixed(2)} ₼ POS terminal ödənişini təsdiqləmək istəyirsiniz?`;
    if (sup) {
      confirmPrompt = `"${shift.userName}" növbəsi: ${amount.toFixed(2)} ₼ POS terminal vəsaitinin "${sup.name}" təchizatçısına verildiyini təsdiqləyirsiniz?\n\n⚠️ Təsdiq etdikdə təchizatçının borcundan (${(sup.debtBalance || 0).toFixed(2)} ₼) ${amount.toFixed(2)} ₼ dərhal silinəcək və ödəniş rəsmi qeydə alınacaq.`;
    }

    const confirmed = window.confirm(confirmPrompt);
    if (!confirmed) return;

    try {
      const response = await fetch("/api/shift/confirm-pos-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: shift.id,
          adminPin: "1234"
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(sup ? `"${sup.name}" üçün ${amount.toFixed(2)} ₼ POS ödənişi təsdiqləndi və borcdan silindi! ✔️` : "POS terminal ödənişi təsdiqləndi və xərclərə keçirildi! ✔️");
      } else {
        triggerToast(data.error || "Təsdiqləmə zamanı xəta baş verdi.");
      }
    } catch (err) {
      console.error(err);
      // Fallback local update if offline
      const updatedShifts = (state.shifts || []).map(sh => {
        if (sh.id === shift.id && sh.posAllocation) {
          return {
            ...sh,
            posAllocation: { ...sh.posAllocation, isConfirmed: true, confirmedAt: new Date().toISOString(), confirmedBy: "Rəhbərlik (Admin)" }
          };
        }
        return sh;
      });

      let updatedSuppliers = state.suppliers || [];
      let updatedTx = state.supplierTransactions || [];
      if (supId) {
        updatedSuppliers = updatedSuppliers.map(s => {
          if (s.id === supId) {
            return {
              ...s,
              totalPaid: (s.totalPaid || 0) + amount,
              debtBalance: Math.max(0, (s.debtBalance || 0) - amount)
            };
          }
          return s;
        });
        updatedTx = [
          {
            id: "tx_sup_" + Date.now(),
            supplierId: supId,
            supplierName: sup ? sup.name : allocatedTo,
            type: "PAYMENT" as const,
            totalAmount: amount,
            paidAmount: amount,
            debtAmount: 0,
            paymentSource: "POS Terminal",
            note: shift.posAllocation.note || "POS terminal vəsaitindən borc ödənişi təsdiqləndi",
            date: new Date().toISOString().split("T")[0],
            timestamp: new Date().toISOString(),
            itemsSummary: `POS Borc ödənişi: ${amount.toFixed(2)} ₼`
          },
          ...updatedTx
        ];
      }

      onUpdateState({ ...state, shifts: updatedShifts, suppliers: updatedSuppliers, supplierTransactions: updatedTx });
      triggerToast(sup ? `"${sup.name}" borcundan ${amount.toFixed(2)} ₼ silindi (Lokal)!` : "POS terminal ödənişi təsdiqləndi (Lokal)!");
    }
  };

  // Pending shift approvals calculations
  const pendingCashHandovers = useMemo(() => {
    return (state.shifts || []).filter(
      (s) => s.cashHandover && s.cashHandover.amount > 0 && !s.cashHandover.isConfirmed
    );
  }, [state.shifts]);

  const pendingPosAllocations = useMemo(() => {
    return (state.shifts || []).filter(
      (s) => s.posAllocation && s.posAllocation.amount > 0 && !s.posAllocation.isConfirmed
    );
  }, [state.shifts]);

  const totalPendingShiftApprovals = pendingCashHandovers.length + pendingPosAllocations.length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce text-xs">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Admin Panel Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-900/30 text-white">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center space-x-2">
              <span>Admin Panel & Hesabatlar</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Mərkəz</span>
            </h1>
            <p className="text-xs text-slate-400">Biznes göstəriciləri, xərclər, məhsul idarəetməsi və kuryer analizləri</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pr-28 sm:pr-32">
          <button
            onClick={onBackToHub}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Secondary Sub-navigation */}
      <div className="bg-slate-950 px-6 py-2 border-b border-slate-850 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab("REPORTS")}
          className={`py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            activeSubTab === "REPORTS" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          Biznes Hesabatları
        </button>

        <button
          onClick={() => setActiveSubTab("EXPENSES")}
          className={`py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            activeSubTab === "EXPENSES" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          Xərclər (Hər iki dükan)
        </button>

        <button
          onClick={() => setActiveSubTab("SUPPLIERS")}
          className={`py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1.5 ${
            activeSubTab === "SUPPLIERS" ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20" : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Təchizatçılar & Borclar</span>
          {totalSuppliersDebt > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {totalSuppliersDebt.toFixed(0)} ₼
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("INVENTORY")}
          className={`py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1.5 ${
            activeSubTab === "INVENTORY" ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20" : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>📦 Anbar & Xammal Qalıqları</span>
          {(outOfStockCount > 0 || lowStockCount > 0) && (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              outOfStockCount > 0 
                ? "bg-red-500 text-white animate-pulse" 
                : "bg-amber-500 text-slate-950 font-black"
            }`}>
              {outOfStockCount > 0 ? `! ${outOfStockCount}` : lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("PRODUCTS")}
          className={`py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1.5 ${
            activeSubTab === "PRODUCTS" ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20" : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Məhsullar & Menyu İdarəetməsi</span>
        </button>

        <button
          onClick={() => setActiveSubTab("COURIERS_TABLES")}
          className={`py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            activeSubTab === "COURIERS_TABLES" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          Kuryerlər & Masalar
        </button>

        <button
          onClick={() => setActiveSubTab("SHIFTS_LOSSES")}
          className={`py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1.5 ${
            activeSubTab === "SHIFTS_LOSSES" ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20" : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <span>Növbələr & Anbar İtkiləri</span>
          {totalPendingShiftApprovals > 0 && (
            <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
              {totalPendingShiftApprovals} Təsdiq
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("USERS")}
          className={`py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1.5 ${
            activeSubTab === "USERS" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Kassirlər & Girişlər</span>
        </button>

        <button
          onClick={() => setActiveSubTab("DATABASE")}
          className={`py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1.5 ${
            activeSubTab === "DATABASE" ? "bg-rose-600 text-white shadow-md shadow-rose-950/20" : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Baza & Sıfırlama</span>
        </button>
      </div>

      {/* Panel Inner Content */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-8">

        {/* Prominent Pending Approvals Alert Banner */}
        {totalPendingShiftApprovals > 0 && (
          <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-amber-950/40 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl font-bold shrink-0 mt-0.5 shadow-md">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-amber-300 flex flex-wrap items-center gap-2">
                    <span>Rəhbərlik Təsdiqi Gözləyən Növbə Təhvili və Ödənişlər ({totalPendingShiftApprovals})</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                      Kassir növbəni bağlayıb
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Kassada qalan nağd pulun təhvili və ya POS terminal gəlirinin təchizatçılara/xərclərə ayrılması sizin təsdiqinizi gözləyir. Aşağıdan dərhal bir toxunuşla təsdiqləyə bilərsiniz:
                  </p>
                </div>
              </div>

              {activeSubTab !== "SHIFTS_LOSSES" && (
                <button
                  type="button"
                  onClick={() => setActiveSubTab("SHIFTS_LOSSES")}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-amber-500/30 cursor-pointer"
                >
                  <span>Bütün Növbələrə Keç</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Direct 1-Click Confirmation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4 pt-3.5 border-t border-amber-500/20">
              {pendingCashHandovers.map(shift => (
                <div key={`pending-cash-${shift.id}`} className="bg-slate-950/80 border border-amber-500/30 hover:border-amber-500/60 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold">
                      <Banknote className="w-4 h-4" />
                      <span>Nağd Pul Təhvili</span>
                    </div>
                    <div className="text-base font-mono font-black text-white">
                      {(shift.cashHandover?.amount || shift.actualCashInDrawer || 0).toFixed(2)} ₼
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      Kassir: <strong className="text-white">{shift.userName}</strong> ➔ <span className="text-amber-300 font-semibold">{shift.cashHandover?.recipient || "Rəhbərlik"}</span>
                    </div>
                    {shift.cashHandover?.supplierId && (
                      <div className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold inline-block border border-amber-500/30">
                        🥩 Təchizatçı: {shift.cashHandover.supplierName || shift.cashHandover.recipient} (Borcdan silinəcək)
                      </div>
                    )}
                    {shift.endTime && (
                      <div className="text-[10px] text-slate-400">
                        {new Date(shift.endTime).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConfirmCashHandover(shift)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-950/30 shrink-0 cursor-pointer active:scale-95"
                    title="Nağd pul təhvilini təsdiqlə"
                  >
                    ✓ Təsdiq Et
                  </button>
                </div>
              ))}

              {pendingPosAllocations.map(shift => (
                <div key={`pending-pos-${shift.id}`} className="bg-slate-950/80 border border-blue-500/30 hover:border-blue-500/60 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-bold">
                      <CreditCard className="w-4 h-4" />
                      <span>POS Terminal Ödənişi</span>
                    </div>
                    <div className="text-base font-mono font-black text-white">
                      {shift.posAllocation?.amount.toFixed(2)} ₼
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      Kassir: <strong className="text-white">{shift.userName}</strong> ➔ <span className="text-blue-300 font-semibold">{shift.posAllocation?.allocatedTo}</span>
                    </div>
                    {shift.posAllocation?.supplierId && (
                      <div className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold inline-block border border-blue-500/30">
                        🥩 Təchizatçı: {shift.posAllocation.supplierName || shift.posAllocation.allocatedTo} (Borcdan silinəcək)
                      </div>
                    )}
                    {shift.endTime && (
                      <div className="text-[10px] text-slate-400">
                        {new Date(shift.endTime).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConfirmPosAllocation(shift)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-blue-950/30 shrink-0 cursor-pointer active:scale-95"
                    title="POS terminal ödənişini təsdiqlə və xərclərə keçir"
                  >
                    ✓ Ödənildi
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* SUBTAB 1: REPORTS */}
        {activeSubTab === "REPORTS" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Report Type Switcher Buttons & Global Date Range Bar */}
            <div className="space-y-4 border-b border-slate-800 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-850">
                  <button
                    onClick={() => setActiveReportType("DONER")}
                    className={`py-3 px-6 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                      activeReportType === "DONER"
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-950/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Köz Dönər Hesabatı</span>
                  </button>
                  <button
                    onClick={() => setActiveReportType("FLOWER")}
                    className={`py-3 px-6 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                      activeReportType === "FLOWER"
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Flower className="w-4 h-4" />
                    <span>Zərif Güllər Hesabatı</span>
                  </button>
                </div>

                {/* Quick Overall Summary Badge */}
                <div className="bg-slate-950 border border-slate-850 py-2.5 px-4 rounded-xl flex items-center space-x-4 text-xs font-semibold">
                  <span className="text-slate-500">Ümumi Dövriyyə ({reportPeriod === "ALL" ? "Bütün Vaxt" : reportPeriod === "THIS_MONTH" ? "Bu Ay" : reportPeriod === "TODAY" ? "Bugün" : "Seçilmiş Aralıq"}):</span>
                  <span className="text-indigo-400 font-bold">{(totalDonerRevenue + totalFlowerRevenue).toFixed(2)} ₼</span>
                </div>
              </div>

              {/* Global Date Range Filter Bar */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Tarix Aralığı Filtri</span>
                      <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-medium">Bütün Göstəricilərə Tətbiq Olunur</span>
                    </span>
                    <p className="text-[10px] text-slate-400">Hesabatı istənilən tarixə və ya hazır dövrlərə görə filterləyin</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                  {[
                    { key: "ALL", label: "Bütün Vaxt" },
                    { key: "TODAY", label: "Bugün" },
                    { key: "YESTERDAY", label: "Dünən" },
                    { key: "LAST_7_DAYS", label: "Son 7 Gün" },
                    { key: "THIS_MONTH", label: "Bu Ay" },
                    { key: "LAST_MONTH", label: "Keçən Ay" },
                    { key: "CUSTOM", label: "📅 Xüsusi Tarix" }
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setReportPeriod(p.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        reportPeriod === p.key
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {reportPeriod === "CUSTOM" && (
                  <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-indigo-500/30 animate-fadeIn">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] text-slate-400">Başlanğıc:</span>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={e => setReportStartDate(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-slate-600 font-bold">-</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] text-slate-400">Son:</span>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={e => setReportEndDate(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Koz Doner Report section */}
            {activeReportType === "DONER" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* 1. TOP FINANCIAL SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Revenue */}
                  <div className="bg-slate-950 border border-orange-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-orange-950/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Ümumi Dövriyyə</span>
                      <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-black text-orange-400">
                        {totalDonerRevenue.toFixed(2)} <span className="text-sm font-bold text-white">₼</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                      <span>Nağd: <strong className="text-emerald-400">{donerCashRevenue.toFixed(2)} ₼</strong></span>
                      <span>POS: <strong className="text-blue-400">{donerPosRevenue.toFixed(2)} ₼</strong></span>
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div className="bg-slate-950 border border-red-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-red-950/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Cəmi Xərclər</span>
                      <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                        <ArrowDownRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="my-2">
                      <span className="text-2xl sm:text-3xl font-black text-red-400">
                        {totalDonerExpenses.toFixed(2)} <span className="text-sm font-bold text-white">₼</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                      <span>Nağd xərc: <strong className="text-amber-400">{donerCashExpenses.toFixed(2)} ₼</strong></span>
                      <span>POS xərc: <strong className="text-blue-400">{donerPosExpenses.toFixed(2)} ₼</strong></span>
                    </div>
                  </div>

                  {/* Net Cash Balance (Nağd Satış - Nağd Xərclər) */}
                  <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-amber-950/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest flex items-center space-x-1">
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Kassa Nağd Qalığı</span>
                      </span>
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                        Kassa Balansı
                      </span>
                    </div>
                    <div className="my-2">
                      <span className={`text-2xl sm:text-3xl font-black ${netDonerCash >= 0 ? "text-amber-400" : "text-red-400"}`}>
                        {netDonerCash.toFixed(2)} <span className="text-sm font-bold text-white">₼</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                      <span>{donerCashRevenue.toFixed(2)} ₼ (satış)</span>
                      <span>- {donerCashExpenses.toFixed(2)} ₼ (xərc)</span>
                    </div>
                  </div>

                  {/* Net POS Terminal Balance (POS Satış - POS Xərclər) */}
                  <div className="bg-slate-950 border border-blue-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-blue-950/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest flex items-center space-x-1">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>POS Terminal Qalığı</span>
                      </span>
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                        Bank Balansı
                      </span>
                    </div>
                    <div className="my-2">
                      <span className={`text-2xl sm:text-3xl font-black ${netDonerPos >= 0 ? "text-blue-400" : "text-red-400"}`}>
                        {netDonerPos.toFixed(2)} <span className="text-sm font-bold text-white">₼</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                      <span>{donerPosRevenue.toFixed(2)} ₼ (satış)</span>
                      <span>- {donerPosExpenses.toFixed(2)} ₼ (xərc)</span>
                    </div>
                  </div>
                </div>

                {/* 2. DETAILED FINANCIAL RECONCILIATION BANNER */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white font-display">
                          Ödəniş Mənbələri və Xərclərin Silinməsi Balansı (Reconciliation)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Hər ödəniş kanalından (Nağd, POS, Wolt, Bolt, Yango, Digər) olan xərclər avtomatik olaraq həmin kanalın satışından silinir
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-bold">Ümumi Xalis Mənfəət:</span>
                      <span className={`text-sm font-extrabold ${netDonerProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {netDonerProfit.toFixed(2)} ₼
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Nağd Kassa Kanalı */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                          <Banknote className="w-4 h-4" />
                          <span>💵 Nağd Kassa Kanalı</span>
                        </span>
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-semibold">Kassa</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Cəmi Nağd Satış:</span>
                          <span className="font-bold text-emerald-400">+{donerCashRevenue.toFixed(2)} ₼</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Kassadan Çıxan Xərc:</span>
                          <span className="font-bold text-red-400">-{donerCashExpenses.toFixed(2)} ₼</span>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-sm">
                          <span className="text-slate-200">Xalis Nağd Qalıq:</span>
                          <span className={netDonerCash >= 0 ? "text-amber-400 font-black" : "text-red-400 font-black"}>
                            {netDonerCash.toFixed(2)} ₼
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* POS Terminal Kanalı */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-blue-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 flex items-center space-x-1.5">
                          <CreditCard className="w-4 h-4" />
                          <span>💳 POS Terminal Kanalı</span>
                        </span>
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-semibold">Bank</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Cəmi POS Satış:</span>
                          <span className="font-bold text-emerald-400">+{donerPosRevenue.toFixed(2)} ₼</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>POS-dan Silinən Xərc:</span>
                          <span className="font-bold text-red-400">-{donerPosExpenses.toFixed(2)} ₼</span>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-sm">
                          <span className="text-slate-200">Xalis POS Qalıq:</span>
                          <span className={netDonerPos >= 0 ? "text-blue-400 font-black" : "text-red-400 font-black"}>
                            {netDonerPos.toFixed(2)} ₼
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Wolt Kanalı */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-cyan-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400 flex items-center space-x-1.5">
                          <Truck className="w-4 h-4" />
                          <span>🛵 Wolt Çatdırılma</span>
                        </span>
                        <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-semibold">Wolt</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Cəmi Wolt Satışı:</span>
                          <span className="font-bold text-emerald-400">+{donerWoltRevenue.toFixed(2)} ₼</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Wolt-dan Silinən Xərc:</span>
                          <span className="font-bold text-red-400">-{donerWoltExpenses.toFixed(2)} ₼</span>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-sm">
                          <span className="text-slate-200">Xalis Wolt Qalıq:</span>
                          <span className={netDonerWolt >= 0 ? "text-cyan-400 font-black" : "text-red-400 font-black"}>
                            {netDonerWolt.toFixed(2)} ₼
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bolt Food Kanalı */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                          <Truck className="w-4 h-4" />
                          <span>⚡ Bolt Food Çatdırılma</span>
                        </span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-semibold">Bolt</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Cəmi Bolt Satışı:</span>
                          <span className="font-bold text-emerald-400">+{donerBoltRevenue.toFixed(2)} ₼</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Bolt-dan Silinən Xərc:</span>
                          <span className="font-bold text-red-400">-{donerBoltExpenses.toFixed(2)} ₼</span>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-sm">
                          <span className="text-slate-200">Xalis Bolt Qalıq:</span>
                          <span className={netDonerBolt >= 0 ? "text-emerald-400 font-black" : "text-red-400 font-black"}>
                            {netDonerBolt.toFixed(2)} ₼
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Yango Deli Kanalı */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-red-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400 flex items-center space-x-1.5">
                          <Truck className="w-4 h-4" />
                          <span>🚗 Yango Çatdırılma</span>
                        </span>
                        <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-semibold">Yango</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Cəmi Yango Satışı:</span>
                          <span className="font-bold text-emerald-400">+{donerYangoRevenue.toFixed(2)} ₼</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Yango-dan Silinən Xərc:</span>
                          <span className="font-bold text-red-400">-{donerYangoExpenses.toFixed(2)} ₼</span>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-sm">
                          <span className="text-slate-200">Xalis Yango Qalıq:</span>
                          <span className={netDonerYango >= 0 ? "text-red-400 font-black" : "text-red-400 font-black"}>
                            {netDonerYango.toFixed(2)} ₼
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kart Köçürmə & Digər */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-purple-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
                          <Wallet className="w-4 h-4" />
                          <span>📱 Kart Köçürmə / m10 / Digər</span>
                        </span>
                        <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-semibold">Digər</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Cəmi Köçürmə Satışı:</span>
                          <span className="font-bold text-emerald-400">+{donerTransfersRevenue.toFixed(2)} ₼</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Çıxılan Digər Xərclər:</span>
                          <span className="font-bold text-red-400">-{donerOtherExpenses.toFixed(2)} ₼</span>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-sm">
                          <span className="text-slate-200">Xalis Digər Qalıq:</span>
                          <span className={netDonerTransfers >= 0 ? "text-purple-400 font-black" : "text-red-400 font-black"}>
                            {netDonerTransfers.toFixed(2)} ₼
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PULLAR HARA XƏRCLƏNİB? (WHERE DID THE MONEY GO?) */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                        <PieChart className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white font-display">
                          Pullar Hara Xərclənib? (Kateqoriyalar və Ödəniş Kanalları üzrə Xərc Analizi)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Hansı məqsədlər üçün pul xərcləndiyi və Nağd, POS, Wolt, Bolt, Yango üzrə bölgüsü
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                      Cəmi: {totalDonerExpenses.toFixed(2)} ₼
                    </span>
                  </div>

                  {donerExpensesByCategory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {donerExpensesByCategory.map(cat => {
                        const percent = totalDonerExpenses > 0 ? ((cat.total / totalDonerExpenses) * 100).toFixed(1) : "0";
                        return (
                          <div key={cat.category} className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-white">{cat.category}</span>
                                <span className="text-[10px] text-slate-500 font-semibold">({cat.count} əməliyyat)</span>
                              </div>
                              <span className="font-black text-sm text-red-400">{cat.total.toFixed(2)} ₼</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            {/* Channel breakdown tags */}
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                              {cat.cash > 0 && (
                                <span className="flex items-center space-x-1 bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                                  <Banknote className="w-3 h-3 text-amber-400" />
                                  <span>Nağd: <strong>{cat.cash.toFixed(2)} ₼</strong></span>
                                </span>
                              )}
                              {cat.pos > 0 && (
                                <span className="flex items-center space-x-1 bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                                  <CreditCard className="w-3 h-3 text-blue-400" />
                                  <span>POS: <strong>{cat.pos.toFixed(2)} ₼</strong></span>
                                </span>
                              )}
                              {cat.wolt > 0 && (
                                <span className="flex items-center space-x-1 bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">
                                  <span>🛵 Wolt: <strong>{cat.wolt.toFixed(2)} ₼</strong></span>
                                </span>
                              )}
                              {cat.bolt > 0 && (
                                <span className="flex items-center space-x-1 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                                  <span>⚡ Bolt: <strong>{cat.bolt.toFixed(2)} ₼</strong></span>
                                </span>
                              )}
                              {cat.yango > 0 && (
                                <span className="flex items-center space-x-1 bg-red-500/10 text-red-300 px-2 py-0.5 rounded border border-red-500/20">
                                  <span>🚗 Yango: <strong>{cat.yango.toFixed(2)} ₼</strong></span>
                                </span>
                              )}
                              {cat.other > 0 && (
                                <span className="flex items-center space-x-1 bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                                  <span>📱 Digər: <strong>{cat.other.toFixed(2)} ₼</strong></span>
                                </span>
                              )}
                              <span className="ml-auto font-bold text-orange-400">{percent}%</span>
                            </div>

                            {/* Recent item previews */}
                            <div className="border-t border-slate-800/80 pt-2 space-y-1">
                              {cat.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex justify-between text-[10px] text-slate-400">
                                  <span className="truncate max-w-[180px]">{item.title}</span>
                                  <span className="font-bold text-slate-300">{item.amount.toFixed(2)} ₼ ({item.paymentSource || "Nağd"})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-850 text-slate-500 text-xs">
                      Hələlik heç bir xərc qeydiyyatı yoxdur.
                    </div>
                  )}
                </div>

                {/* 4. COURIER REPORT SECTION */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-orange-500" />
                      <h3 className="font-bold text-base text-white font-display">Kuryer Çatdırılma Hesabatı (Aylıq)</h3>
                    </div>
                    <span className="text-[10px] bg-orange-600/10 text-orange-400 font-extrabold px-2.5 py-1 rounded-full uppercase border border-orange-500/20">
                      Kuryer Reyestri
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300 border border-slate-900 rounded-xl overflow-hidden">
                      <thead className="bg-slate-900 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-3">Kuryer Adı</th>
                          <th className="p-3">Telefon</th>
                          <th className="p-3">Sifariş Sayı</th>
                          <th className="p-3 text-center">Çatdırılan Dönər</th>
                          <th className="p-3 text-right">Daşıdığı Dəyər</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {getCourierReport().map(report => (
                          <tr key={report.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-3 font-semibold text-white">{report.name}</td>
                            <td className="p-3 text-slate-400">{report.phone}</td>
                            <td className="p-3 font-bold text-slate-200">{report.deliveryCount} çatdırılma</td>
                            <td className="p-3 text-center font-bold text-orange-400">{report.totalDonersDelivered} ədəd</td>
                            <td className="p-3 text-right font-bold text-emerald-400">{report.totalRevenue.toFixed(2)} ₼</td>
                          </tr>
                        ))}
                        {getCourierReport().length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-500">Sistemdə qeydiyyatlı kuryer yoxdur.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. DETAILED DYNAMIC DONER REPORTS COMPONENT (Products, Dates, Receipts, Finance) */}
                <div className="pt-2">
                  <DonerReports state={state} />
                </div>
              </div>
            )}

            {/* Zarif Gullar Report section */}
            {activeReportType === "FLOWER" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Revenue Card */}
                  <div className="bg-slate-950 border border-emerald-500/10 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-emerald-950/5">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Gül Dövriyyəsi</h4>
                    <div className="text-3xl font-black text-emerald-400">
                      {totalFlowerRevenue.toFixed(2)} ₼
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex justify-between">
                      <span>Ümumi Satış Həcmi</span>
                    </div>
                  </div>

                  {/* Expenses Card */}
                  <div className="bg-slate-950 border border-red-500/10 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-red-950/5">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
                    <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Gül Xərcləri</h4>
                    <div className="text-3xl font-black text-red-400">
                      {totalFlowerExpenses.toFixed(2)} ₼
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex justify-between">
                      <span>Qeydə alınmış xərclər</span>
                    </div>
                  </div>

                  {/* Net Profit Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
                    <span className="absolute top-4 right-4 bg-emerald-600/10 text-emerald-400 text-[9px] font-extrabold py-0.5 px-2 rounded-full uppercase">Zərif Güllər</span>
                    <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Gül Xalis Mənfəəti</h4>
                    <div className="text-3xl font-black text-white">
                      {netFlowerProfit.toFixed(2)} ₼
                    </div>
                    <div className="text-xs text-slate-400 mt-2 flex justify-between">
                      <span>Dövriyyə - Xərclər</span>
                      <span className={netFlowerProfit >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                        {netFlowerProfit >= 0 ? "Müsbət" : "Zərər"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flower shop section details */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <Flower className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-bold text-base text-white font-display">Gül Satışı - Ətraflı Hesabat</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between border border-slate-850">
                      <div>
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-0.5">Kassa Satışı (POS)</span>
                        <span className="font-black text-lg text-slate-200">{flowerPosRevenue.toFixed(2)} ₼</span>
                      </div>
                      <span className="text-[10px] bg-slate-950 p-1.5 rounded-lg text-slate-500">Mağaza içi</span>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between border border-emerald-500/10">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-extrabold uppercase block mb-0.5">Sayt Satışı (Onlayn Web)</span>
                        <span className="font-black text-lg text-emerald-400">{flowerWebRevenue.toFixed(2)} ₼</span>
                      </div>
                      <span className="text-[9px] bg-emerald-600/10 text-emerald-400 font-bold px-2 py-1 rounded-lg">Avtomatik sinxron</span>
                    </div>
                  </div>

                  {/* Pullar hara xərclənib for Flowers */}
                  {flowerExpensesByCategory.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-900">
                      <span className="text-xs font-bold text-slate-300 block">Pullar Hara Xərclənib? (Gül Xərcləri)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {flowerExpensesByCategory.map(cat => (
                          <div key={cat.category} className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex justify-between items-center">
                            <div>
                              <span className="text-xs font-bold text-white block">{cat.category}</span>
                              <span className="text-[10px] text-slate-400">💵 {cat.cash.toFixed(2)} ₼ Nağd | 💳 {cat.pos.toFixed(2)} ₼ POS</span>
                            </div>
                            <span className="text-xs font-bold text-red-400">{cat.total.toFixed(2)} ₼</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warehouse Low Stock Warnings */}
                  <div className="space-y-3 pt-4 border-t border-slate-900">
                    <span className="text-xs font-bold text-slate-300 block">Anbar Statusu & Xəbərdarlıqlar</span>
                    
                    <div className="space-y-2">
                      {state.flowerProducts.map(p => {
                        const isLowStock = p.stock !== undefined && p.stock <= 5;
                        return (
                          <div key={p.id} className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-850">
                            <div>
                              <span className="font-semibold text-xs text-slate-200">{p.name}</span>
                              <span className="block text-[9px] text-slate-500">{p.category}</span>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className={`text-xs font-bold ${isLowStock ? "text-amber-400" : "text-slate-400"}`}>
                                {p.stock !== undefined ? `${p.stock} ədəd` : "N/A"}
                              </span>
                              
                              {/* Stock increment clickers */}
                              <button
                                onClick={() => handleQuickAddStock(p, 50)}
                                className="text-[10px] font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                              >
                                +50 qəbul et
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SUBTAB 2: EXPENSES (ENHANCED WITH RECONCILIATION & PAYMENT SOURCE) */}
        {activeSubTab === "EXPENSES" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Reconciliation Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 uppercase font-extrabold block">💵 Kassa Nağd Balansı</span>
                  <span className="text-xl font-black text-white">{netDonerCash.toFixed(2)} ₼</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Satış ({donerCashRevenue.toFixed(2)} ₼) - Xərc ({donerCashExpenses.toFixed(2)} ₼)
                  </span>
                </div>
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-400 uppercase font-extrabold block">💳 POS Terminal Balansı</span>
                  <span className="text-xl font-black text-white">{netDonerPos.toFixed(2)} ₼</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Satış ({donerPosRevenue.toFixed(2)} ₼) - Xərc ({donerPosExpenses.toFixed(2)} ₼)
                  </span>
                </div>
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-red-400 uppercase font-extrabold block">📊 Cəmi Qeydiyyatlı Xərclər</span>
                  <span className="text-xl font-black text-red-400">{(totalDonerExpenses + totalFlowerExpenses).toFixed(2)} ₼</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Köz Dönər: {totalDonerExpenses.toFixed(2)} ₼ | Zərif Güllər: {totalFlowerExpenses.toFixed(2)} ₼
                  </span>
                </div>
                <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400">
                  <PieChart className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Add expense form with Payment Source selection */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
                <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Yeni Xərc Əlavə Et</span>
                </h3>

                <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Xərc başlığı *</label>
                    <input
                      type="text"
                      required
                      placeholder="Məs, Ət və Toyuq alışı / İşıq pulu / Çörək"
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                      className="bg-slate-900 text-white border border-slate-800 rounded-lg p-2.5 w-full focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Məbləğ (₼) *</label>
                      <input
                        type="number"
                        required
                        min={0.1}
                        step={0.1}
                        placeholder="Məs, 45"
                        value={expAmount || ""}
                        onChange={(e) => setExpAmount(Number(e.target.value))}
                        className="bg-slate-900 text-white border border-slate-800 rounded-lg p-2.5 w-full focus:outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Biznes sahəsi *</label>
                      <select
                        value={expBusiness}
                        onChange={(e) => setExpBusiness(e.target.value as BusinessType)}
                        className="bg-slate-900 text-white border border-slate-800 rounded-lg p-2.5 w-full focus:outline-none focus:border-indigo-500"
                      >
                        <option value={BusinessType.Doner}>Köz Dönər</option>
                        <option value={BusinessType.Flower}>Zərif Güllər</option>
                      </select>
                    </div>
                  </div>

                  {/* Ödəniş Mənbəyi (Cash, POS, Wolt, Bolt, Yango, Card, m10, Other) */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block mb-1">
                      Ödəniş Mənbəyi (Pul haradan ödənilib?) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setExpPaymentSource("Nağd")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          expPaymentSource === "Nağd" || expPaymentSource === "Kassa (Nağd)"
                            ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-md shadow-amber-950/30"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5 text-amber-400" />
                        <span>💵 Nağd Kassa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpPaymentSource("POS Terminal")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          expPaymentSource === "POS Terminal"
                            ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-md shadow-blue-950/30"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                        <span>💳 POS Terminal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpPaymentSource("Wolt")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          expPaymentSource === "Wolt"
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-950/30"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>🛵 Wolt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpPaymentSource("Bolt")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          expPaymentSource === "Bolt"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/30"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>⚡ Bolt Food</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpPaymentSource("Yango")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          expPaymentSource === "Yango"
                            ? "bg-red-500/20 border-red-500 text-red-400 shadow-md shadow-red-950/30"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5 text-red-400" />
                        <span>🚗 Yango</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpPaymentSource("Bank Kartı")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          expPaymentSource === "Bank Kartı"
                            ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-md shadow-blue-950/30"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                        <span>💳 Bank Kartı</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpPaymentSource("m10")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          expPaymentSource === "m10"
                            ? "bg-purple-500/20 border-purple-500 text-purple-400 shadow-md shadow-purple-950/30"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5 text-purple-400" />
                        <span>📱 m10</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpPaymentSource("Digər")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          expPaymentSource === "Digər"
                            ? "bg-slate-700 border-slate-500 text-white shadow-md"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>🔄 Digər</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {expPaymentSource === "POS Terminal" || expPaymentSource === "Bank Kartı" 
                        ? "Qeyd: Bu xərc POS Terminal satışından avtomatik silinəcək." 
                        : expPaymentSource === "Wolt"
                        ? "Qeyd: Bu xərc Wolt satış dövriyyəsindən avtomatik silinəcək."
                        : expPaymentSource === "Bolt"
                        ? "Qeyd: Bu xərc Bolt Food satış dövriyyəsindən avtomatik silinəcək."
                        : expPaymentSource === "Yango"
                        ? "Qeyd: Bu xərc Yango satış dövriyyəsindən avtomatik silinəcək."
                        : expPaymentSource === "m10" || expPaymentSource === "Digər"
                        ? "Qeyd: Bu xərc digər köçürmə satışlarından avtomatik silinəcək."
                        : "Qeyd: Bu xərc Nağd Kassa satışından avtomatik silinəcək."}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Kateqoriya *</label>
                      <select
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        className="bg-slate-900 text-white border border-slate-800 rounded-lg p-2.5 w-full focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Məhsul">Məhsul Alışı</option>
                        <option value="İcarə">İcarə Haqqı</option>
                        <option value="Əmək haqqı">Əmək haqqı</option>
                        <option value="Kommunal">Kommunal xərclər</option>
                        <option value="Təsərrüfat">Təsərrüfat xərci</option>
                        <option value="Digər">Digər xərclər</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">📅 Tarix və Saat (Dəyişmək üçün)</label>
                      <input
                        type="datetime-local"
                        value={expCustomDateTime}
                        onChange={(e) => {
                          setExpCustomDateTime(e.target.value);
                          if (e.target.value) {
                            setExpDate(e.target.value.split("T")[0]);
                          }
                        }}
                        className="bg-slate-900 text-white border border-slate-800 rounded-lg p-2.5 w-full focus:outline-none focus:border-indigo-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Qeyd / Təchizatçı / Qaimə № (İstəyə bağlı)</label>
                    <input
                      type="text"
                      placeholder="Məs, 'Ətçi Vəli Dayı - 50 kq quzu əti'"
                      value={expNote}
                      onChange={(e) => setExpNote(e.target.value)}
                      className="bg-slate-900 text-white border border-slate-800 rounded-lg p-2.5 w-full focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-950/20"
                  >
                    Xərci Qeydiyyata Al və Təsdiqlə
                  </button>
                </form>
              </div>

              {/* Right: Filterable Expenses Register */}
              <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 pb-4">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-sm text-white">Xərclər Jurnalı (Reyestr)</h3>
                  </div>

                  {/* Date Range Filter for Expenses */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold px-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      Tarix:
                    </span>
                    {[
                      { key: "ALL", label: "Hamısı" },
                      { key: "TODAY", label: "Bugün" },
                      { key: "YESTERDAY", label: "Dünən" },
                      { key: "LAST_7_DAYS", label: "Son 7 Gün" },
                      { key: "THIS_MONTH", label: "Bu Ay" },
                      { key: "LAST_MONTH", label: "Keçən Ay" },
                      { key: "CUSTOM", label: "📅 Xüsusi" }
                    ].map(p => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setExpDatePeriod(p.key as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          expDatePeriod === p.key
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {expDatePeriod === "CUSTOM" && (
                    <div className="w-full flex items-center justify-end gap-2 bg-slate-900 p-2 rounded-xl border border-indigo-500/30 animate-fadeIn text-xs">
                      <span className="text-[11px] text-slate-400">Başlanğıc:</span>
                      <input
                        type="date"
                        value={expStartDate}
                        onChange={e => setExpStartDate(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-slate-600 font-bold">-</span>
                      <span className="text-[11px] text-slate-400">Son:</span>
                      <input
                        type="date"
                        value={expEndDate}
                        onChange={e => setExpEndDate(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Filter Pills (Status & Source) */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs w-full pt-1 border-t border-slate-900">
                    {(
                      [
                        { key: "ALL", label: "Bütün Kateqoriyalar" },
                        { key: "CONFIRMED", label: "🟢 Təsdiqlənmiş" },
                        { key: "PENDING", label: "🟡 Təsdiq Gözləyən" },
                        { key: "DONER", label: "Köz Dönər" },
                        { key: "FLOWER", label: "Zərif Güllər" },
                        { key: "CASH", label: "💵 Nağd" },
                        { key: "POS", label: "💳 POS" },
                        { key: "WOLT", label: "🛵 Wolt" },
                        { key: "BOLT", label: "⚡ Bolt" },
                        { key: "YANGO", label: "🚗 Yango" },
                        { key: "OTHER", label: "📱 Digər" }
                      ] as const
                    ).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setExpTabFilter(tab.key)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          expTabFilter === tab.key
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar for Expenses */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={expTabSearch}
                    onChange={(e) => setExpTabSearch(e.target.value)}
                    placeholder="Xərclərdə və ya təchizatçılarda axtar..."
                    className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Başlıq / Təyinat</th>
                        <th className="p-3">Ödəniş Mənbəyi</th>
                        <th className="p-3">Biznes sahəsi</th>
                        <th className="p-3 text-center">Tarix</th>
                        <th className="p-3 text-right">Məbləğ</th>
                        <th className="p-3 text-center">Status & Təsdiq</th>
                        <th className="p-3 text-center">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {filterByDateRange(state.expenses, expDatePeriod, expStartDate, expEndDate)
                        .filter(exp => {
                          if (expTabFilter === "CONFIRMED" && exp.isConfirmed === false) return false;
                          if (expTabFilter === "PENDING" && exp.isConfirmed !== false) return false;
                          if (expTabFilter === "DONER" && exp.business !== BusinessType.Doner) return false;
                          if (expTabFilter === "FLOWER" && exp.business !== BusinessType.Flower) return false;
                          if (expTabFilter === "CASH" && (exp.paymentSource === "POS Terminal" || exp.paymentSource === "Wolt" || exp.paymentSource === "Bolt" || exp.paymentSource === "Yango" || exp.paymentSource === "Bank Kartı" || exp.paymentSource === "m10" || exp.paymentSource === "Digər")) return false;
                          if (expTabFilter === "POS" && exp.paymentSource !== "POS Terminal" && exp.paymentSource !== "Bank Kartı") return false;
                          if (expTabFilter === "WOLT" && exp.paymentSource !== "Wolt") return false;
                          if (expTabFilter === "BOLT" && exp.paymentSource !== "Bolt") return false;
                          if (expTabFilter === "YANGO" && exp.paymentSource !== "Yango") return false;
                          if (expTabFilter === "OTHER" && exp.paymentSource !== "m10" && exp.paymentSource !== "Digər") return false;
                          if (expTabSearch.trim()) {
                            const q = expTabSearch.toLowerCase();
                            const matchTitle = exp.title.toLowerCase().includes(q);
                            const matchCat = exp.category.toLowerCase().includes(q);
                            const matchNote = exp.note ? exp.note.toLowerCase().includes(q) : false;
                            if (!matchTitle && !matchCat && !matchNote) return false;
                          }
                          return true;
                        })
                        .map(exp => {
                          const isApproved = exp.isConfirmed !== false;
                          return (
                            <tr key={exp.id} className={`hover:bg-slate-900/40 transition-colors ${!isApproved ? "bg-amber-950/10" : ""}`}>
                              <td className="p-3">
                                <span className="font-semibold text-white block">{exp.title}</span>
                                <div className="flex items-center space-x-2 mt-0.5">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase">{exp.category}</span>
                                  {exp.note && (
                                    <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                                      {exp.note}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                {exp.paymentSource === "Wolt" ? (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    <Truck className="w-3 h-3" />
                                    <span>🛵 Wolt</span>
                                  </span>
                                ) : exp.paymentSource === "Bolt" ? (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <Truck className="w-3 h-3" />
                                    <span>⚡ Bolt Food</span>
                                  </span>
                                ) : exp.paymentSource === "Yango" ? (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                    <Truck className="w-3 h-3" />
                                    <span>🚗 Yango</span>
                                  </span>
                                ) : exp.paymentSource === "POS Terminal" || exp.paymentSource === "Bank Kartı" ? (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <CreditCard className="w-3 h-3" />
                                    <span>💳 {exp.paymentSource}</span>
                                  </span>
                                ) : exp.paymentSource === "m10" || exp.paymentSource === "Digər" ? (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Wallet className="w-3 h-3" />
                                    <span>📱 {exp.paymentSource}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Banknote className="w-3 h-3" />
                                    <span>💵 Nağd Kassa</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  exp.business === BusinessType.Doner 
                                    ? "bg-orange-600/10 text-orange-400" 
                                    : "bg-emerald-600/10 text-emerald-400"
                                }`}>
                                  {exp.business === BusinessType.Doner ? "Köz Dönər" : "Zərif Güllər"}
                                </span>
                              </td>
                              <td className="p-3 text-center text-slate-400 font-medium">{exp.date}</td>
                              <td className="p-3 text-right font-bold text-red-400 text-sm">-{exp.amount.toFixed(2)} ₼</td>
                              <td className="p-3 text-center">
                                {isApproved ? (
                                  <div className="flex items-center justify-center space-x-1.5">
                                    <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                                      <span>Təsdiqlənib</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmExpense(exp, false)}
                                      className="text-slate-400 hover:text-amber-400 text-[9px] font-bold py-0.5 px-1.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer"
                                      title="Təsdiqi ləğv et"
                                    >
                                      ↩
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center space-x-1.5">
                                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                      <Clock className="w-3 h-3 text-amber-400" />
                                      <span>Gözləyir</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmExpense(exp, true)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] flex items-center space-x-1 shadow cursor-pointer"
                                      title="Təsdiq et və kassa/hesabatdan çıx"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Təsdiqlə</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteExpense(exp)}
                                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                                  title="Xərci sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {state.expenses.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500">Heç bir xərc qeydiyyatı yoxdur.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB: SUPPLIERS & DEBT MANAGEMENT */}
        {activeSubTab === "SUPPLIERS" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* 1. TOP SUMMARY METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Suppliers Count */}
              <div className="bg-slate-950 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-indigo-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Təchizatçı Sayı</span>
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">{totalSuppliersCount}</span>
                </div>
                <p className="text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                  Aktiv mal və ərzaq tədarükçüləri
                </p>
              </div>

              {/* Total Debt Balance (Borc Qalığı) */}
              <div className="bg-slate-950 border border-red-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-red-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest">Cəmi Borc Qalığımız</span>
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-black text-red-400">
                    {totalSuppliersDebt.toFixed(2)} <span className="text-sm font-bold text-white">₼</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 border-t border-slate-900 pt-2 flex items-center justify-between">
                  <span>Təchizatçılara qalan nisyə borc</span>
                  {totalSuppliersDebt > 0 ? (
                    <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full">Ödənilməli</span>
                  ) : (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">Borc Yoxdur ✔️</span>
                  )}
                </p>
              </div>

              {/* Total Purchases */}
              <div className="bg-slate-950 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-blue-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Cəmi Alışlar</span>
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-black text-blue-400">
                    {totalSuppliersPurchases.toFixed(2)} <span className="text-sm font-bold text-white">₼</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                  Təchizatçılardan daxil olan ümumi qaimə məbləği
                </p>
              </div>

              {/* Total Paid */}
              <div className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-emerald-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Cəmi Ödənilmiş</span>
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {totalSuppliersPaid.toFixed(2)} <span className="text-sm font-bold text-white">₼</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 border-t border-slate-900 pt-2">
                  Faktiki ödənilmiş (Kassa + Bank)
                </p>
              </div>

            </div>

            {/* 2. TOOLBAR & CONTROLS */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* Search & Category Filter */}
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="relative min-w-[240px] flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={supplierSearch}
                      onChange={e => setSupplierSearch(e.target.value)}
                      placeholder="Təchizatçı adı, nömrə və ya şirkət axtar..."
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    {[
                      { key: "ALL", label: "Hamısı" },
                      { key: "Ət və Toyuq", label: "🥩 Ət & Toyuq" },
                      { key: "Çörək və Lavaş", label: "🥖 Çörək & Lavaş" },
                      { key: "İçkilər", label: "🥤 İçkilər" },
                      { key: "Tərəvəz", label: "🥬 Tərəvəz" },
                      { key: "Qablaşdırma", label: "📦 Qablaşdırma" },
                      { key: "Digər", label: "Digər" }
                    ].map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setSupplierCategoryFilter(cat.key)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                          supplierCategoryFilter === cat.key
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/30"
                            : "bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions: Export, Import, Add */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={supplierFileInputRef}
                    accept=".json,application/json"
                    onChange={handleImportSuppliersFile}
                    className="hidden"
                  />

                  {/* Export Suppliers Button */}
                  <button
                    type="button"
                    onClick={handleExportSuppliersJson}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Təchizatçıları və borc əməliyyatlarını JSON faylı kimi endir"
                  >
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Təchizatçıları Endir (.json)</span>
                  </button>

                  {/* Import Suppliers Button */}
                  <button
                    type="button"
                    disabled={isImportingSuppliers}
                    onClick={() => supplierFileInputRef.current?.click()}
                    className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                    title="POS monitordan və ya kompüterdən təchizatçı JSON faylını və ya data.json faylını seçib serverə köçür"
                  >
                    {isImportingSuppliers ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <Upload className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Təchizatçıları Yüklə (İdxal)</span>
                  </button>

                  {/* Add Supplier Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenSupplierModal()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-950/30 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Təchizatçı</span>
                  </button>
                </div>

              </div>
            </div>

            {/* 3. SUPPLIERS CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSuppliers.map(sup => {
                const hasDebt = (sup.debtBalance || 0) > 0;
                return (
                  <div
                    key={sup.id}
                    className={`bg-slate-950 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-md hover:border-slate-700 ${
                      hasDebt ? "border-red-500/30 shadow-red-950/10" : "border-slate-800"
                    }`}
                  >
                    {/* Card Top / Header */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-base text-white font-display flex items-center gap-2">
                            <span>{sup.name}</span>
                          </h4>
                          {sup.suppliedProduct && (
                            <p className="text-xs text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                              <Package className="w-3 h-3 shrink-0" />
                              <span>Məhsul: {sup.suppliedProduct}</span>
                            </p>
                          )}
                          {sup.company && (
                            <p className="text-xs text-slate-400 font-medium">{sup.company}</p>
                          )}
                        </div>

                        <span className="text-[10px] font-bold bg-slate-900 text-indigo-400 px-2.5 py-1 rounded-full border border-slate-800 shrink-0">
                          {sup.category || "Təchizatçı"}
                        </span>
                      </div>

                      {/* Contact & Note */}
                      <div className="space-y-1 text-xs text-slate-400">
                        {sup.phone && (
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500 text-[11px]">Əlaqə:</span>
                            <a href={`tel:${sup.phone}`} className="text-indigo-400 hover:underline font-semibold">
                              {sup.phone}
                            </a>
                          </div>
                        )}
                        {sup.note && (
                          <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-850">
                            {sup.note}
                          </p>
                        )}
                      </div>

                      {/* Debt & Financial Breakdown Bar */}
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Cari Borc Qalığı:</span>
                          <span className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                            hasDebt
                              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}>
                            {sup.debtBalance ? sup.debtBalance.toFixed(2) : "0.00"} ₼
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Cəmi Alış:</span>
                            <strong className="text-blue-400 font-bold">{sup.totalPurchases ? sup.totalPurchases.toFixed(2) : "0.00"} ₼</strong>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block">Ödənilmiş:</span>
                            <strong className="text-emerald-400 font-bold">{sup.totalPaid ? sup.totalPaid.toFixed(2) : "0.00"} ₼</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="bg-slate-900/80 p-3 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        {/* Edit Supplier / Product */}
                        <button
                          type="button"
                          onClick={() => handleOpenSupplierModal(sup)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-950/40"
                          title="Təchizatçı və ya məhsul adını, kateqoriyasını və borcunu redaktə et"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Redaktə Et (Edit)</span>
                        </button>

                        {/* Pay Debt */}
                        <button
                          type="button"
                          onClick={() => {
                            setPayDebtSupplier(sup);
                            setPayDebtAmount(sup.debtBalance > 0 ? sup.debtBalance : "");
                            setPayDebtDate(new Date().toISOString().split("T")[0]);
                          }}
                          className="bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                          title="Borc ödənişi et"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Borc Ödə</span>
                        </button>

                        {/* View Ledger Statement */}
                        <button
                          type="button"
                          onClick={() => setLedgerSupplier(sup)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold py-1.5 px-2.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                          title="Əməliyyat tarixçəsi və çıxarış"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Çıxarış</span>
                        </button>

                        {/* Optional Quick Purchase button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPurchaseModalSupplier(sup);
                            setPurchaseItemName(sup.suppliedProduct || sup.name || "");
                            setPurchaseCategory(sup.category || "Ət və Toyuq");
                            setPurchaseTotalAmount("");
                            setPurchasePaidAmount("");
                            setPurchaseDate(new Date().toISOString().split("T")[0]);
                          }}
                          className="bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-semibold py-1.5 px-2 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                          title="Mal alışı qeyd et"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Alış</span>
                        </button>
                      </div>

                      {/* Delete */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(sup)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Təchizatçını sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}

              {filteredSuppliers.length === 0 && (
                <div className="col-span-full bg-slate-950 p-12 text-center rounded-2xl border border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-base text-white">Təchizatçı tapılmadı</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Axtarışa uyğun və ya qeydiyyatdan keçmiş təchizatçı yoxdur. Mal alışlarını və borc qalıqlarını izləmək üçün yeni təchizatçı əlavə edin.
                  </p>
                  <button
                    onClick={() => handleOpenSupplierModal()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs inline-flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>İlk Təchizatçını Əlavə Et</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SUBTAB: INVENTORY & WAREHOUSE MANAGEMENT */}
        {activeSubTab === "INVENTORY" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* 1. Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Warehouse Items */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Cəmi Xammal / Məhsul</span>
                  <div className="text-2xl font-black text-white mt-1">{inventoryItems.length} <span className="text-xs font-normal text-slate-400">növ</span></div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Anbarda qeydiyyatda olan</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Archive className="w-6 h-6" />
                </div>
              </div>

              {/* Out of Stock (0 Stock) */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                outOfStockCount > 0 
                  ? "bg-red-950/20 border-red-500/40 shadow-lg shadow-red-950/20 animate-pulse" 
                  : "bg-slate-950 border-slate-800"
              }`}>
                <div>
                  <span className="text-[11px] text-red-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Bitmiş Məhsullar (0 Qalıq)</span>
                  </span>
                  <div className="text-2xl font-black text-red-400 mt-1">{outOfStockCount} <span className="text-xs font-normal text-slate-400">məhsul</span></div>
                  <span className="text-[10px] text-red-400/80 block mt-0.5">
                    {outOfStockCount > 0 ? "Təcili sifariş/mədaxil tələb olunur!" : "Bitmiş məhsul yoxdur ✔️"}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              {/* Low Stock (Below min alert) */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                lowStockCount > 0 
                  ? "bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20" 
                  : "bg-slate-950 border-slate-800"
              }`}>
                <div>
                  <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Kritik Qalıq (Bitmək üzrə)</span>
                  </span>
                  <div className="text-2xl font-black text-amber-400 mt-1">{lowStockCount} <span className="text-xs font-normal text-slate-400">məhsul</span></div>
                  <span className="text-[10px] text-amber-400/80 block mt-0.5">
                    {lowStockCount > 0 ? "Kritik limitdən aşağı düşüb" : "Bütün qalıqlar normadadır ✔️"}
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Scale className="w-6 h-6" />
                </div>
              </div>

              {/* Total Usage / Written Off */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Cəmi Məxaric / İstifadə</span>
                  <div className="text-2xl font-black text-orange-400 mt-1">{inventoryUsages.length} <span className="text-xs font-normal text-slate-400">qeyd</span></div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{totalUsedAllTime.toFixed(1)} vahid silinib</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <MinusCircle className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* 2. Critical Warning Banners (Live Alerts) */}
            {outOfStockCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-red-300">Təcili Diqqət: Anbarda bitmiş məhsullar var!</h4>
                    <p className="text-xs text-red-400/90 mt-0.5">
                      Aşağıdakı məhsulların qalığı tükənib (0):{" "}
                      <strong>{outOfStockItems.map(i => `${i.name} (${i.unit})`).join(", ")}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInvStockFilter("OUT")}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow cursor-pointer"
                >
                  Bitmişləri Göstər ({outOfStockCount})
                </button>
              </div>
            )}

            {lowStockCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-300">Kritik Qalıq Xəbərdarlığı: Bitmək üzrə olan ərzaqlar!</h4>
                    <p className="text-xs text-amber-400/90 mt-0.5">
                      Bu məhsullar kritik minimum həddə çatıb:{" "}
                      <strong>{lowStockItems.map(i => `${i.name}: ${i.stock} ${i.unit} (Limit: ${i.minStockAlert || 5})`).join(", ")}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInvStockFilter("LOW")}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition-all shadow cursor-pointer"
                >
                  Kritik Qalıqları Göstər ({lowStockCount})
                </button>
              </div>
            )}

            {/* 3. Action Toolbar & Filtering */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                
                {/* Left: Search and Status Filters */}
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      placeholder="Anbar məhsullarında axtar..."
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Stock Status Pills */}
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    {[
                      { key: "ALL", label: "Hamısı" },
                      { key: "NORMAL", label: "🟢 Normal" },
                      { key: "LOW", label: `🟡 Kritik (${lowStockCount})` },
                      { key: "OUT", label: `🔴 Bitmiş (${outOfStockCount})` }
                    ].map(st => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setInvStockFilter(st.key as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          invStockFilter === st.key
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Primary Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Record Usage (Write-off) */}
                  <button
                    type="button"
                    onClick={() => handleOpenUsageModal()}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-orange-950/20 transition-all cursor-pointer"
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>🔻 Məhsul / Ət Sil (Məxaric)</span>
                  </button>

                  {/* Add New Inventory Item */}
                  <button
                    type="button"
                    onClick={() => handleOpenInvModal()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-950/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Yeni Anbar Məhsulu</span>
                  </button>
                </div>

              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Kateqoriya:</span>
                {[
                  "ALL",
                  "Ət",
                  "Çörək",
                  "Lavaş",
                  "Tərəvəz",
                  "İçki",
                  "Sous",
                  "Qablaşdırma",
                  "Digər"
                ].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setInvCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      invCategoryFilter === cat
                        ? "bg-slate-800 text-indigo-400 border border-indigo-500/40"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    {cat === "ALL" ? "Bütün Kateqoriyalar" : cat}
                  </button>
                ))}
              </div>

            </div>

            {/* 4. Inventory Items Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Archive className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Anbar Xammal & Məhsul Qalıqları Cədvəli</h3>
                </div>
                <span className="text-xs text-slate-400">
                  Göstərilir: <strong className="text-white">{
                    inventoryItems
                      .filter(item => {
                        if (invCategoryFilter !== "ALL" && item.category !== invCategoryFilter) return false;
                        const stock = item.stock || 0;
                        const minAlert = item.minStockAlert !== undefined && item.minStockAlert !== null ? item.minStockAlert : 5;
                        if (invStockFilter === "OUT" && stock > 0) return false;
                        if (invStockFilter === "LOW" && (stock <= 0 || stock > minAlert)) return false;
                        if (invStockFilter === "NORMAL" && stock <= minAlert) return false;
                        if (invSearch.trim()) {
                          const q = invSearch.toLowerCase();
                          return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
                        }
                        return true;
                      }).length
                  }</strong> məhsul
                </span>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left text-slate-300">
                  <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Məhsul / Xammal Adı</th>
                      <th className="p-3 text-center">Kateqoriya</th>
                      <th className="p-3 text-center">Cari Qalıq (Stok)</th>
                      <th className="p-3 text-center">Kritik Qalıq Həddi</th>
                      <th className="p-3 text-right">Maya Qiyməti</th>
                      <th className="p-3 text-center">Cəmi Mədaxil</th>
                      <th className="p-3 text-center">Cəmi Silinib / İstifadə</th>
                      <th className="p-3 text-center">Əməliyyatlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {inventoryItems
                      .filter(item => {
                        if (invCategoryFilter !== "ALL" && item.category !== invCategoryFilter) return false;
                        const stock = item.stock || 0;
                        const minAlert = item.minStockAlert !== undefined && item.minStockAlert !== null ? item.minStockAlert : 5;
                        if (invStockFilter === "OUT" && stock > 0) return false;
                        if (invStockFilter === "LOW" && (stock <= 0 || stock > minAlert)) return false;
                        if (invStockFilter === "NORMAL" && stock <= minAlert) return false;
                        if (invSearch.trim()) {
                          const q = invSearch.toLowerCase();
                          return item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map(item => {
                        const stock = item.stock || 0;
                        const minAlert = item.minStockAlert !== undefined && item.minStockAlert !== null ? item.minStockAlert : 5;
                        const isOut = stock <= 0;
                        const isLow = stock > 0 && stock <= minAlert;

                        return (
                          <tr key={item.id} className={`hover:bg-slate-900/40 transition-colors ${isOut ? "bg-red-950/10" : isLow ? "bg-amber-950/10" : ""}`}>
                            
                            {/* Product Name & ID */}
                            <td className="p-3">
                              <div className="flex items-center space-x-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                  isOut ? "bg-red-500/20 text-red-400" : isLow ? "bg-amber-500/20 text-amber-400" : "bg-indigo-500/20 text-indigo-400"
                                }`}>
                                  {(item.name || "M").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-white block text-xs">{item.name || "Məhsul"}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">ID: {item.id}</span>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="p-3 text-center">
                              <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-slate-300 rounded-md border border-slate-800 font-medium">
                                {item.category || "Xammal"}
                              </span>
                            </td>

                            {/* Current Stock with Visual Badge */}
                            <td className="p-3 text-center">
                              <div className="inline-flex items-center space-x-1.5">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${
                                  isOut
                                    ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                                    : isLow
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                }`}>
                                  {Number(stock || 0)} {item.unit || "ədəd"}
                                </span>
                              </div>
                              {isOut && <span className="block text-[9px] text-red-400 font-bold mt-0.5">🔴 Bitib!</span>}
                              {isLow && <span className="block text-[9px] text-amber-400 font-bold mt-0.5">🟡 Bitmək üzrə</span>}
                            </td>

                            {/* Min Alert Level */}
                            <td className="p-3 text-center text-slate-400 text-xs">
                              {item.minStockAlert !== undefined && item.minStockAlert !== null ? (
                                <span className="font-mono">{Number(item.minStockAlert)} {item.unit || "ədəd"}</span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* Cost Price */}
                            <td className="p-3 text-right text-slate-300 font-mono font-bold text-xs">
                              {item.costPrice !== undefined && item.costPrice !== null && !isNaN(Number(item.costPrice)) ? `${Number(item.costPrice).toFixed(2)} ₼` : <span className="text-slate-600 font-normal">—</span>}
                            </td>

                            {/* Total Received */}
                            <td className="p-3 text-center text-slate-400 font-medium">
                              {Number(item.totalReceived || 0)} {item.unit || "ədəd"}
                            </td>

                            {/* Total Used / Written Off */}
                            <td className="p-3 text-center text-orange-400 font-bold">
                              {Number(item.totalUsed || 0)} {item.unit || "ədəd"}
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                
                                {/* Deduct / Usage / Sil */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenUsageModal(item)}
                                  className="bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/30 text-[10px] font-bold py-1 px-2 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                                  title="Gündəlik istifadəni sil (Məxaric)"
                                >
                                  <MinusCircle className="w-3 h-3" />
                                  <span>🔻 Sil / İstifadə</span>
                                </button>

                                {/* Restock (+ Mədaxil) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenRestockModal(item)}
                                  className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-bold py-1 px-2 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                                  title="Yeni mal qəbul et (Mədaxil)"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Mədaxil</span>
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvModal(item)}
                                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850 transition-colors cursor-pointer"
                                  title="Redaktə et"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInvItem(item)}
                                  className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-slate-850 transition-colors cursor-pointer"
                                  title="Anbardan tamamilə sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      })}

                    {inventoryItems.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-500">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2">
                            <Archive className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-400">Anbarda hələ ki heç bir məhsul qeydə alınmayıb</p>
                          <button
                            type="button"
                            onClick={() => handleOpenInvModal()}
                            className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>İlk Məhsulu Əlavə Et</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Usage & Write-off History Table (Gündəlik İstifadə və Silinmə Jurnalı) */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 pb-4">
                <div className="flex items-center space-x-2">
                  <MinusCircle className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">Gündəlik İstifadə və Silinmə Jurnalı (Məxaric Reyestri)</h3>
                    <p className="text-[11px] text-slate-400">Gündəlik istifadə olunaraq anbardan silinən ət və xammalın tam tarixçəsi</p>
                  </div>
                </div>

                {/* Date Range Filter for Usage History */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold px-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-orange-400" />
                    Tarix:
                  </span>
                  {[
                    { key: "ALL", label: "Hamısı" },
                    { key: "TODAY", label: "Bugün" },
                    { key: "YESTERDAY", label: "Dünən" },
                    { key: "LAST_7_DAYS", label: "Son 7 Gün" },
                    { key: "THIS_MONTH", label: "Bu Ay" },
                    { key: "LAST_MONTH", label: "Keçən Ay" },
                    { key: "CUSTOM", label: "📅 Xüsusi" }
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setUsageFilterPeriod(p.key as any)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        usageFilterPeriod === p.key
                          ? "bg-orange-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range Selector if selected */}
              {usageFilterPeriod === "CUSTOM" && (
                <div className="flex items-center justify-end gap-2 bg-slate-900 p-2.5 rounded-xl border border-orange-500/30 animate-fadeIn text-xs">
                  <span className="text-[11px] text-slate-400 font-semibold">Başlanğıc:</span>
                  <input
                    type="date"
                    value={usageStartDate}
                    onChange={(e) => setUsageStartDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[11px] text-slate-400 font-semibold ml-2">Son:</span>
                  <input
                    type="date"
                    value={usageEndDate}
                    onChange={(e) => setUsageEndDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              {/* Search within Usages */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={usageSearchQuery}
                  onChange={(e) => setUsageSearchQuery(e.target.value)}
                  placeholder="Silinmə qeydlərində (məhsul, səbəb, şəxs) axtar..."
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Usage Records Table */}
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left text-slate-300">
                  <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Tarix & Saat</th>
                      <th className="p-3">Məhsul / Xammal</th>
                      <th className="p-3 text-center">Kateqoriya</th>
                      <th className="p-3 text-right">Silinən Miqdar</th>
                      <th className="p-3">Səbəb & Qeyd</th>
                      <th className="p-3 text-center">Qeyd Edən</th>
                      <th className="p-3 text-center">Ləğv Et</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {filterByDateRange<InventoryUsage>(inventoryUsages, usageFilterPeriod, usageStartDate, usageEndDate)
                      .filter(u => {
                        if (!usageSearchQuery.trim()) return true;
                        const q = usageSearchQuery.toLowerCase();
                        return (
                          u.itemName.toLowerCase().includes(q) ||
                          (u.reason && u.reason.toLowerCase().includes(q)) ||
                          (u.createdByName && u.createdByName.toLowerCase().includes(q)) ||
                          (u.note && u.note.toLowerCase().includes(q))
                        );
                      })
                      .slice()
                      .reverse()
                      .map(u => (
                        <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                          
                          {/* Date & Time */}
                          <td className="p-3">
                            <span className="font-bold text-white block text-xs">{u.date}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {u.timestamp ? new Date(u.timestamp).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </td>

                          {/* Item Name */}
                          <td className="p-3 font-bold text-white text-xs">
                            {u.itemName}
                          </td>

                          {/* Category */}
                          <td className="p-3 text-center">
                            <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800">
                              {u.category || "Ət / Xammal"}
                            </span>
                          </td>

                          {/* Quantity Deducted */}
                          <td className="p-3 text-right">
                            <span className="inline-block font-black text-red-400 text-xs px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20">
                              -{u.quantity} {u.unit}
                            </span>
                          </td>

                          {/* Reason / Note */}
                          <td className="p-3">
                            <span className="text-slate-200 block text-xs font-semibold">{u.reason}</span>
                            {u.note && (
                              <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850 mt-0.5 inline-block">
                                💬 {u.note}
                              </span>
                            )}
                          </td>

                          {/* Created By */}
                          <td className="p-3 text-center text-slate-400 text-[11px]">
                            {u.createdByName || "Admin"}
                          </td>

                          {/* Cancel / Delete Usage */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteUsage(u)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Silinməni ləğv et və miqdarı anbara qaytar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>

                        </tr>
                      ))}

                    {inventoryUsages.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                          Hələ heç bir məxaric / silinmə qeydə alınmayıb. Gündəlik istifadə olunan ət və ərzağı yuxarıdakı "🔻 Məhsul / Ət Sil" düyməsi ilə qeyd edə bilərsiniz.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB 3: PRODUCTS & MENU MANAGEMENT */}
        {activeSubTab === "PRODUCTS" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Toolbar: Business Switcher, Search, Category Filter, and Add Button */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* Business Type Selector */}
                <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => {
                      setProdBusiness(BusinessType.Doner);
                      setProdCategoryFilter("ALL");
                    }}
                    className={`py-2 px-5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                      prodBusiness === BusinessType.Doner
                        ? "bg-orange-600 text-white shadow-md shadow-orange-950/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Köz Dönər Menyusu ({state.donerProducts?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => {
                      setProdBusiness(BusinessType.Flower);
                      setProdCategoryFilter("ALL");
                    }}
                    className={`py-2 px-5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                      prodBusiness === BusinessType.Flower
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Flower className="w-3.5 h-3.5" />
                    <span>Zərif Güllər Vitrini ({state.flowerProducts?.length || 0})</span>
                  </button>
                </div>

                {/* Add Product Button */}
                <button
                  onClick={() => handleOpenAddProduct(prodBusiness)}
                  className={`py-2.5 px-5 rounded-xl text-xs font-extrabold text-white flex items-center space-x-2 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                    prodBusiness === BusinessType.Doner
                      ? "bg-orange-600 hover:bg-orange-500 shadow-orange-950/30"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Yeni Məhsul Əlavə Et</span>
                </button>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-900">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Məhsul adı, kateqoriya və ya tərkib axtar..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="w-full bg-slate-900 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  {prodSearch && (
                    <button
                      onClick={() => setProdSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Categories Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Kateqoriya:</span>
                  <button
                    onClick={() => setProdCategoryFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      prodCategoryFilter === "ALL"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-850"
                    }`}
                  >
                    Hamısı
                  </button>
                  {Array.from(new Set((prodBusiness === BusinessType.Doner ? state.donerProducts : state.flowerProducts).map(p => p.category))).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setProdCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        prodCategoryFilter === cat
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900 text-slate-400 hover:text-white border border-slate-850"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Products Table & Grid List */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">
                    {prodBusiness === BusinessType.Doner ? "Köz Dönər Məhsulları Siyahısı" : "Zərif Güllər Məhsulları Siyahısı"}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Cəmi: <strong className="text-white font-bold">{(prodBusiness === BusinessType.Doner ? state.donerProducts : state.flowerProducts).length}</strong> məhsul
                </span>
              </div>

              {/* Table of Products */}
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left text-slate-300">
                  <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-14 text-center">Şəkil</th>
                      <th className="p-3">Məhsulun Adı</th>
                      <th className="p-3">Kateqoriya</th>
                      <th className="p-3">Tərkib / Qeyd</th>
                      <th className="p-3 text-center">Anbar Qalığı</th>
                      <th className="p-3 text-right">Qiymət</th>
                      <th className="p-3 text-center">Əməliyyatlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {(prodBusiness === BusinessType.Doner ? state.donerProducts : state.flowerProducts)
                      .filter(p => {
                        const s = prodSearch.toLowerCase();
                        const matchSearch = !prodSearch || 
                          p.name.toLowerCase().includes(s) || 
                          p.category.toLowerCase().includes(s) ||
                          (p.ingredients && p.ingredients.some(i => i.toLowerCase().includes(s)));
                        const matchCat = prodCategoryFilter === "ALL" || p.category === prodCategoryFilter;
                        return matchSearch && matchCat;
                      })
                      .map(prod => {
                        const isLowStock = prod.stock !== undefined && prod.stock <= 5;
                        return (
                          <tr key={prod.id} className="hover:bg-slate-900/60 transition-colors group">
                            {/* Product Photo */}
                            <td className="p-3 text-center">
                              <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center">
                                {prod.image ? (
                                  <img 
                                    src={prod.image} 
                                    alt={prod.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-slate-600" />
                                )}
                              </div>
                            </td>

                            {/* Product Name & Business */}
                            <td className="p-3">
                              <span className="font-bold text-white text-sm block">{prod.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">ID: {prod.id}</span>
                            </td>

                            {/* Category Badge */}
                            <td className="p-3">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 text-indigo-300 border border-slate-800">
                                {prod.category}
                              </span>
                            </td>

                            {/* Ingredients */}
                            <td className="p-3 max-w-xs">
                              {prod.ingredients && prod.ingredients.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {prod.ingredients.map((ing, idx) => (
                                    <span key={idx} className="text-[10px] bg-slate-900/90 text-slate-400 px-1.5 py-0.5 rounded border border-slate-850">
                                      {ing}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-[11px]">-</span>
                              )}
                            </td>

                            {/* Stock */}
                            <td className="p-3 text-center">
                              {prod.stock !== undefined ? (
                                <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                                  isLowStock 
                                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" 
                                    : "bg-slate-900 text-slate-300"
                                }`}>
                                  {prod.stock} ədəd
                                </span>
                              ) : (
                                <span className="text-slate-600 font-mono text-[10px]">Sərbəst</span>
                              )}
                            </td>

                            {/* Price */}
                            <td className="p-3 text-right">
                              <span className="font-black text-sm text-emerald-400 font-mono">
                                {prod.price.toFixed(2)} ₼
                              </span>
                            </td>

                            {/* Actions: Edit & Delete */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(prod)}
                                  className="p-1.5 bg-slate-900 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer border border-slate-800"
                                  title="Məhsulu Redaktə Et (Qiymət, Ad, Şəkil və s.)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod)}
                                  className="p-1.5 bg-slate-900 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer border border-slate-800"
                                  title="Məhsulu Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {(prodBusiness === BusinessType.Doner ? state.donerProducts : state.flowerProducts).length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          Heç bir məhsul tapılmadı. "+ Yeni Məhsul Əlavə Et" düyməsinə klikləyərək məhsul yarada bilərsiniz.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB 4: COURIERS_TABLES */}
        {activeSubTab === "COURIERS_TABLES" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            
            {/* Courier manager */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
              <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center space-x-1">
                <Truck className="w-4 h-4 text-orange-500" />
                <span>Kuryer Reyestri</span>
              </h3>

              <form onSubmit={handleAddCourier} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Kuryerin Adı, Soyadı *</label>
                    <input
                      type="text"
                      required
                      placeholder="Məs, Əli Məmmədov"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="bg-slate-900 text-white border border-slate-800 rounded-lg p-2.5 w-full focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Telefonu *</label>
                    <input
                      type="text"
                      required
                      placeholder="Məs, +994 50 123 45 67"
                      value={courierPhone}
                      onChange={(e) => setCourierPhone(e.target.value)}
                      className="bg-slate-900 text-white border border-slate-800 rounded-lg p-2.5 w-full focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Kuryeri Reyestrə Əlavə Et
                </button>
              </form>

              <div className="pt-4 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Fəal Kuryerlər</span>
                <div className="space-y-2">
                  {state.couriers.map(c => (
                    <div key={c.id} className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white block">{c.name}</span>
                        <span className="text-[10px] text-slate-400">{c.phone}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCourier(c)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-950"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tables Configuration */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
              <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center space-x-1">
                <Settings className="w-4 h-4 text-indigo-500" />
                <span>Köz Dönər Masa tənzimləmələri</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Restorandakı cəmi masa sayı *</label>
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      required
                      min={1}
                      max={40}
                      value={tableInput}
                      onChange={(e) => setTableInput(Number(e.target.value))}
                      className="bg-slate-900 text-white border border-slate-800 rounded-lg p-2.5 w-24 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleUpdateTableCount}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-lg transition-all cursor-pointer"
                    >
                      Masa Sayını Yenilə
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Qeyd: Masa sayı azaldıqda mövcud boş masalar çıxarılacaq, lakin fəal sifarişləri olan masalar qorunub saxlanacaq.</span>
                </div>

                {/* QR Code generator & printer card */}
                <div className="pt-4 border-t border-slate-850">
                  <label className="text-slate-400 block mb-2 font-semibold">Masa QR Menyu Kodları & Çap</label>
                  <button
                    type="button"
                    onClick={() => setQrModalTable("ALL")}
                    className="w-full py-3 px-4 rounded-xl bg-orange-600/15 hover:bg-orange-600/25 border border-orange-500/30 text-orange-400 font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <QrCode className="w-4 h-4 text-orange-400" />
                    <span>Masa QR Kodlarına Bax & Çap Et</span>
                  </button>
                  <span className="text-[10px] text-slate-500 mt-1.5 block">
                    Bütün masaların unikal QR kodlarını tək pəncərədə görün və masaların üstü üçün birbaşa printerə göndərin.
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB 4: SHIFTS & LOSSES */}
        {activeSubTab === "SHIFTS_LOSSES" && (
          <div className="space-y-8 animate-fadeIn text-xs">
            
            {/* 1. Cashier Shifts Section */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Növbələr və Kassa Hesabatları (Kassirlər üzrə)</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Kassirlərin kassa hesabatları, kəsir və artıqların izlənməsi</span>
              </div>

              {(!state.shifts || state.shifts.length === 0) ? (
                <p className="text-slate-500 text-xs py-4 text-center">Hələ ki, heç bir iş növbəsi qeydə alınmayıb.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2">Kassir / Status</th>
                        <th className="py-3 px-2">Başlama Vaxtı</th>
                        <th className="py-3 px-2">Bitmə Vaxtı</th>
                        <th className="py-3 px-2 text-right">Başlanğıc Nəğd</th>
                        <th className="py-3 px-2 text-right">Satış Nəğd (+)</th>
                        <th className="py-3 px-2 text-right">Rəhbərlik Mədaxil (+)</th>
                        <th className="py-3 px-2 text-right">Rəhbərlik Məxaric (-)</th>
                        <th className="py-3 px-2 text-right">Kassa Məxaric (-)</th>
                        <th className="py-3 px-2 text-right">Gözlənilən Kassa</th>
                        <th className="py-3 px-2 text-right">Real Kassa</th>
                        <th className="py-3 px-2 text-right">Kəsir / Artıq</th>
                        <th className="py-3 px-2 text-center">Nağd Təhvil</th>
                        <th className="py-3 px-2 text-center">POS Ayrılması (Ət)</th>
                        <th className="py-3 px-2 text-center">Ətraflı</th>
                        <th className="py-3 px-2 text-center">Əməliyyat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {state.shifts.slice().reverse().map((shift) => {
                        const expected = (shift.startingCash || 0) + (shift.receivedCash || 0) + (shift.managementAdded || 0) - (shift.spentCash || 0) - (shift.managementWithdrawn || 0);
                        const isCompleted = shift.status === "FINISHED";
                        const diff = shift.difference || 0;
                        const isExpanded = !!expandedShifts[shift.id];
                        return (
                          <React.Fragment key={shift.id}>
                            <tr 
                              onClick={() => toggleShiftExpand(shift.id)}
                              className="hover:bg-slate-900/50 transition-colors cursor-pointer select-none"
                            >
                              <td className="py-3.5 px-2 font-semibold">
                                <div className="flex items-center space-x-1.5">
                                  <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transform transition-transform ${isExpanded ? "rotate-90 text-indigo-400" : ""}`} />
                                  <div>
                                    <span className="block text-white font-black">{shift.userName}</span>
                                    {shift.status === "ACTIVE" ? (
                                      <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 animate-pulse">Aktiv</span>
                                    ) : (
                                      <span className="inline-block bg-slate-800 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase mt-0.5">Bağlanıb</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-2 text-slate-400">
                                {new Date(shift.startTime).toLocaleString("az-AZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="py-3.5 px-2 text-slate-400">
                                {shift.endTime ? (
                                  new Date(shift.endTime).toLocaleString("az-AZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-2 text-right font-mono text-slate-300">{(shift.startingCash || 0).toFixed(2)} ₼</td>
                              <td className="py-3.5 px-2 text-right font-mono text-emerald-400">+{(shift.receivedCash || 0).toFixed(2)} ₼</td>
                              <td className="py-3.5 px-2 text-right font-mono text-teal-400 font-bold">
                                {shift.managementAdded && shift.managementAdded > 0 ? `+${shift.managementAdded.toFixed(2)} ₼` : "-"}
                              </td>
                              <td className="py-3.5 px-2 text-right font-mono text-orange-400 font-bold">
                                {shift.managementWithdrawn && shift.managementWithdrawn > 0 ? `-${shift.managementWithdrawn.toFixed(2)} ₼` : "-"}
                              </td>
                              <td className="py-3.5 px-2 text-right font-mono text-red-400">-{(shift.spentCash || 0).toFixed(2)} ₼</td>
                              <td className="py-3.5 px-2 text-right font-mono text-indigo-400 font-bold">{expected.toFixed(2)} ₼</td>
                              <td className="py-3.5 px-2 text-right font-mono text-slate-200">
                                {isCompleted ? `${(shift.actualCashInDrawer || 0).toFixed(2)} ₼` : <span className="text-slate-600">Növbə fəaldır</span>}
                              </td>
                              <td className="py-3.5 px-2 text-right font-mono font-bold">
                                {!isCompleted ? (
                                  <span className="text-slate-600">-</span>
                                ) : diff < 0 ? (
                                  <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">Kəsir: {Math.abs(diff).toFixed(2)} ₼</span>
                                ) : diff > 0 ? (
                                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">Artıq: +{diff.toFixed(2)} ₼</span>
                                ) : (
                                  <span className="text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">Tamamdır</span>
                                )}
                              </td>

                              {/* Nağd Təhvil column */}
                              <td className="py-3.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                {shift.cashHandover ? (
                                  <div className="space-y-1 inline-block text-left">
                                    <span className="font-mono font-bold text-white block text-[11px]">
                                      {shift.cashHandover.amount.toFixed(2)} ₼
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate max-w-[100px]" title={shift.cashHandover.recipient}>
                                      {shift.cashHandover.recipient}
                                    </span>
                                    {shift.cashHandover.supplierId && (
                                      <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-bold block truncate max-w-[100px]" title={`Təchizatçı: ${shift.cashHandover.supplierName || shift.cashHandover.recipient}`}>
                                        🥩 {shift.cashHandover.supplierName || shift.cashHandover.recipient}
                                      </span>
                                    )}
                                    {shift.cashHandover.isConfirmed ? (
                                      <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                        ✓ Təsdiqləndi
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmCashHandover(shift)}
                                        className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500 hover:text-white px-2 py-0.5 rounded border border-amber-500/40 transition-colors cursor-pointer shadow-sm"
                                        title="Rəhbərlik nağd pul təhvilini təsdiqləsin"
                                      >
                                        ⏳ Təsdiq Et
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>

                              {/* POS Allocation column */}
                              <td className="py-3.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                {shift.posAllocation && shift.posAllocation.amount > 0 ? (
                                  <div className="space-y-1 inline-block text-left">
                                    <span className="font-mono font-bold text-blue-400 block text-[11px]">
                                      {shift.posAllocation.amount.toFixed(2)} ₼
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate max-w-[110px]" title={shift.posAllocation.allocatedTo}>
                                      {shift.posAllocation.allocatedTo}
                                    </span>
                                    {shift.posAllocation.supplierId && (
                                      <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded font-bold block truncate max-w-[110px]" title={`Təchizatçı: ${shift.posAllocation.supplierName || shift.posAllocation.allocatedTo}`}>
                                        🥩 {shift.posAllocation.supplierName || shift.posAllocation.allocatedTo}
                                      </span>
                                    )}
                                    {shift.posAllocation.isConfirmed ? (
                                      <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                        ✓ Ödənildi
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmPosAllocation(shift)}
                                        className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-300 bg-blue-500/15 hover:bg-blue-500 hover:text-white px-2 py-0.5 rounded border border-blue-500/40 transition-colors cursor-pointer shadow-sm"
                                        title="Ödənildikdə Rəhbərlik təsdiq etsin"
                                      >
                                        ⏳ Ödənildi və Təsdiqlə
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>

                              <td className="py-3.5 px-2 text-center text-slate-500">
                                <span className="text-indigo-400 hover:underline text-[10px] font-semibold">
                                  {isExpanded ? "Bağla" : "Aç"}
                                </span>
                              </td>
                              <td className="py-3.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditShift(shift)}
                                    className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 shadow-sm"
                                    title="Növbəni redaktə et (İlkin və son qalıq)"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Redaktə</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteShift(shift)}
                                    className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title="Növbəni sil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-950/70">
                                <td colSpan={15} className="py-4 px-4 border-b border-slate-850">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
                                    
                                    {/* Daily Settlement & Handover Audit Card */}
                                    <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                        <div className="flex items-center space-x-2">
                                          <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                            <ShieldCheck className="w-4 h-4" />
                                          </span>
                                          <h4 className="font-extrabold text-white text-xs">Gündəlik Bağlanış və Hesablaşma Auditi</h4>
                                        </div>
                                        <div className="flex items-center space-x-3 text-[11px]">
                                          <span className="text-slate-400">Dövriyyə: <strong className="text-white font-mono">{(shift.totalShiftRevenue || 0).toFixed(2)} ₼</strong></span>
                                          <span className="text-slate-400">Xərc: <strong className="text-red-400 font-mono">{(shift.totalShiftExpenses || 0).toFixed(2)} ₼</strong></span>
                                          <span className="text-slate-400">Xalis Qazanc: <strong className="text-emerald-400 font-mono">{(shift.shiftNetProfit || 0).toFixed(2)} ₼</strong></span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                                        {/* Cash Handover Details */}
                                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
                                              <Banknote className="w-3.5 h-3.5" />
                                              <span>Nağd Pul Təhvili</span>
                                            </span>
                                            {shift.cashHandover?.isConfirmed ? (
                                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                ✅ Təsdiqləndi
                                              </span>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => handleConfirmCashHandover(shift)}
                                                className="text-[9px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500 hover:text-white px-2 py-0.5 rounded border border-amber-500/40 cursor-pointer"
                                              >
                                                ⏳ Rəhbərlik Təsdiq Et
                                              </button>
                                            )}
                                          </div>
                                          <div className="flex justify-between text-slate-300">
                                            <span className="text-slate-500">Təhvil Verilən:</span>
                                            <span className="font-bold text-white">{shift.cashHandover?.recipient || "Rəhbərlik"}</span>
                                          </div>
                                          {shift.cashHandover?.supplierId && (
                                            <div className="flex justify-between text-amber-300 text-[11px]">
                                              <span className="text-slate-500">Təchizatçı:</span>
                                              <span className="font-bold">🥩 {shift.cashHandover.supplierName || shift.cashHandover.recipient} (Borcdan silinəcək)</span>
                                            </div>
                                          )}
                                          <div className="flex justify-between text-slate-300">
                                            <span className="text-slate-500">Məbləğ:</span>
                                            <span className="font-mono font-bold text-amber-400">{(shift.cashHandover?.amount || shift.actualCashInDrawer || 0).toFixed(2)} ₼</span>
                                          </div>
                                          {shift.cashHandover?.note && (
                                            <div className="text-slate-400 italic text-[10px]">
                                              Qeyd: {shift.cashHandover.note}
                                            </div>
                                          )}
                                          {shift.cashHandover?.confirmedBy && (
                                            <div className="text-slate-500 text-[10px]">
                                              Təsdiq edən: {shift.cashHandover.confirmedBy} ({new Date(shift.cashHandover.confirmedAt || "").toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })})
                                            </div>
                                          )}
                                        </div>

                                        {/* POS Allocation Details */}
                                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-blue-400 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
                                              <CreditCard className="w-3.5 h-3.5" />
                                              <span>POS Terminal Ayrılması (Ət və s.)</span>
                                            </span>
                                            {shift.posAllocation?.isConfirmed ? (
                                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                ✅ Ödənildi və Təsdiqləndi
                                              </span>
                                            ) : shift.posAllocation && shift.posAllocation.amount > 0 ? (
                                              <button
                                                type="button"
                                                onClick={() => handleConfirmPosAllocation(shift)}
                                                className="text-[9px] font-bold text-blue-300 bg-blue-500/20 hover:bg-blue-500 hover:text-white px-2 py-0.5 rounded border border-blue-500/40 cursor-pointer"
                                              >
                                                ⏳ Ödənildi və Təsdiqlə
                                              </button>
                                            ) : (
                                              <span className="text-slate-600 text-[9px]">-</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between text-slate-300">
                                            <span className="text-slate-500">Təyinat / Təchizatçı:</span>
                                            <span className="font-bold text-white">{shift.posAllocation?.allocatedTo || "Ayrılma olmayıb"}</span>
                                          </div>
                                          <div className="flex justify-between text-slate-300">
                                            <span className="text-slate-500">Ayrılan Məbləğ:</span>
                                            <span className="font-mono font-bold text-blue-400">{(shift.posAllocation?.amount || 0).toFixed(2)} ₼</span>
                                          </div>
                                          {shift.posAllocation?.note && (
                                            <div className="text-slate-400 italic text-[10px]">
                                              Qeyd: {shift.posAllocation.note}
                                            </div>
                                          )}
                                          {shift.posAllocation?.confirmedBy && (
                                            <div className="text-slate-500 text-[10px]">
                                              Təsdiq edən: {shift.posAllocation.confirmedBy} ({new Date(shift.posAllocation.confirmedAt || "").toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })})
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Detailed Cash Operations */}
                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                                      <h4 className="font-bold text-white text-[11px] uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
                                        <span>Rəhbərlik Kassa Əməliyyatları</span>
                                        <span className="text-[10px] text-slate-500 font-normal">({(shift.cashTransactions || []).length} əməliyyat)</span>
                                      </h4>
                                      
                                      {(!shift.cashTransactions || shift.cashTransactions.length === 0) ? (
                                        <p className="text-slate-500 italic text-[11px]">Növbə zamanı rəhbərlik tərəfindən heç bir mədaxil və ya məxaric qeydə alınmayıb.</p>
                                      ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                          {shift.cashTransactions.slice().reverse().map((tx: any) => (
                                            <div key={tx.id} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/40 flex justify-between items-center text-[11px]">
                                              <div className="space-y-0.5">
                                                <div className="flex items-center space-x-1.5">
                                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                    tx.type === "IN" ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                                                  }`}>
                                                    {tx.type === "IN" ? "Mədaxil" : "Məxaric"}
                                                  </span>
                                                  <span className="text-slate-500 text-[10px]">
                                                    {new Date(tx.timestamp).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}
                                                  </span>
                                                </div>
                                                <span className="text-slate-300 block mt-1 font-medium">{tx.note}</span>
                                              </div>
                                              <span className={`font-mono font-bold ${tx.type === "IN" ? "text-emerald-400" : "text-orange-400"}`}>
                                                {tx.type === "IN" ? "+" : "-"}{tx.amount.toFixed(2)} ₼
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Sold Items & Inventory Losses list */}
                                    <div className="space-y-3">
                                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                                        <h4 className="font-bold text-white text-[11px] uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-1.5">
                                          Növbə Ərzində Nağd Satışlar
                                        </h4>
                                        {(!shift.soldItems || shift.soldItems.length === 0) ? (
                                          <p className="text-slate-500 italic text-[11px]">Nəğd satış edilməyib.</p>
                                        ) : (
                                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                            {shift.soldItems.map((item: any) => (
                                              <div key={item.productId} className="flex justify-between text-[11px] text-slate-400">
                                                <span>{item.name} <strong className="text-slate-300">x{item.quantity}</strong></span>
                                                <span className="font-mono text-slate-300">{(item.price * item.quantity).toFixed(2)} ₼</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {shift.inventoryLosses && shift.inventoryLosses.length > 0 && (
                                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                                          <h4 className="font-bold text-white text-[11px] uppercase tracking-wider text-red-400 border-b border-slate-800 pb-1.5">
                                            Qeydə Alınmış Zay/İtki Məhsullar
                                          </h4>
                                          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                                            {shift.inventoryLosses.map((loss: any, idx: number) => (
                                              <div key={idx} className="flex justify-between text-[11px] text-slate-400">
                                                <span>{loss.name} <strong className="text-slate-300">{loss.quantity} {loss.unit}</strong></span>
                                                <span className="text-red-400 italic">({loss.reason})</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Inventory Loss / Shrinkage Section */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-sm text-white">Anbar İtki Hesabatları (Növbələr üzrə)</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Mağaza və anbarda baş vermiş məhsul zay olmaları və kəsirlər</span>
              </div>

              {(!state.inventoryLosses || state.inventoryLosses.length === 0) ? (
                <p className="text-slate-500 text-xs py-4 text-center">Növbələr zamanı heç bir anbar itkisi qeydə alınmayıb.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.inventoryLosses.slice().reverse().map((loss) => (
                    <div key={loss.id} className="bg-slate-900 border border-slate-850 rounded-2xl p-4.5 space-y-3 relative overflow-hidden hover:border-slate-700 transition-colors">
                      <div className="absolute right-3 top-3 px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[9px] font-bold uppercase tracking-wider">
                        İtki
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Məhsul</span>
                        <h4 className="text-white font-black text-xs">{loss.name}</h4>
                        <p className="text-red-400 font-mono font-bold text-xs">Miqdar: {loss.quantity} {loss.unit}</p>
                      </div>

                      <div className="border-t border-slate-850/60 pt-2.5 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">İtki Səbəbi</span>
                        <p className="text-slate-300 italic text-xs leading-normal">"{loss.reason}"</p>
                      </div>

                      <div className="border-t border-slate-850/60 pt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Kassir: <strong className="text-slate-300 font-bold">{loss.cashierName}</strong></span>
                        <span>{new Date(loss.timestamp).toLocaleString("az-AZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. EDIT SHIFT MODAL */}
            {isEditShiftModalOpen && editingShift && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
                  
                  {/* Modal Header */}
                  <div className="bg-slate-950 p-5 border-b border-slate-850 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
                        <Edit2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Növbəni Redaktə Et & Kassa Qalığı Düzəlişi</h3>
                        <p className="text-[10px] text-slate-400">İlkin və son qalıqları, məbləğləri redaktə edin</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setIsEditShiftModalOpen(false); setEditingShift(null); }}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Form */}
                  <form onSubmit={handleSaveEditedShift} className="p-6 space-y-4 text-xs">
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1 font-semibold">Kassir Adı</label>
                        <input
                          type="text"
                          value={editShiftUserName}
                          onChange={(e) => setEditShiftUserName(e.target.value)}
                          className="bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 w-full focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 font-semibold">Status</label>
                        <select
                          value={editShiftStatus}
                          onChange={(e) => setEditShiftStatus(e.target.value as "ACTIVE" | "FINISHED")}
                          className="bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 w-full focus:outline-none focus:border-indigo-500"
                        >
                          <option value="FINISHED">Bağlanıb (FINISHED)</option>
                          <option value="ACTIVE">Aktiv (ACTIVE)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1 font-semibold">Başlama Vaxtı</label>
                        <input
                          type="datetime-local"
                          value={editShiftStartTime}
                          onChange={(e) => setEditShiftStartTime(e.target.value)}
                          className="bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 w-full focus:outline-none focus:border-indigo-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 font-semibold">Bitmə Vaxtı</label>
                        <input
                          type="datetime-local"
                          value={editShiftEndTime}
                          onChange={(e) => setEditShiftEndTime(e.target.value)}
                          className="bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 w-full focus:outline-none focus:border-indigo-500 font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Cash Balances */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3">
                      <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Kassa Qalıqları & Məbləğlər</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-amber-400 block mb-1 font-bold">İlkin Kassa Qalığı (₼) *</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={editShiftStartingCash}
                            onChange={(e) => setEditShiftStartingCash(e.target.value)}
                            className="bg-slate-900 text-white font-mono font-bold border border-amber-500/30 rounded-xl p-2.5 w-full focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-emerald-400 block mb-1 font-bold">Son Real Kassa Qalığı (₼) *</label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={editShiftActualCash}
                            onChange={(e) => setEditShiftActualCash(e.target.value)}
                            className="bg-slate-900 text-white font-mono font-bold border border-emerald-500/30 rounded-xl p-2.5 w-full focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-slate-400 block mb-1 font-medium">Nağd Satış (+) ₼</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editShiftReceivedCash}
                            onChange={(e) => setEditShiftReceivedCash(e.target.value)}
                            className="bg-slate-900 text-white font-mono border border-slate-800 rounded-xl p-2 w-full focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1 font-medium">Xərclər (-) ₼</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editShiftSpentCash}
                            onChange={(e) => setEditShiftSpentCash(e.target.value)}
                            className="bg-slate-900 text-white font-mono border border-slate-800 rounded-xl p-2 w-full focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-teal-400 block mb-1 font-medium">Rəhbərlik Mədaxil (+) ₼</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editShiftMgmtAdded}
                            onChange={(e) => setEditShiftMgmtAdded(e.target.value)}
                            className="bg-slate-900 text-white font-mono border border-slate-800 rounded-xl p-2 w-full focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-orange-400 block mb-1 font-medium">Rəhbərlik Məxaric (-) ₼</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editShiftMgmtWithdrawn}
                            onChange={(e) => setEditShiftMgmtWithdrawn(e.target.value)}
                            className="bg-slate-900 text-white font-mono border border-slate-800 rounded-xl p-2 w-full focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Live Calculated difference summary */}
                      {(() => {
                        const s = parseFloat(editShiftStartingCash) || 0;
                        const r = parseFloat(editShiftReceivedCash) || 0;
                        const ma = parseFloat(editShiftMgmtAdded) || 0;
                        const sp = parseFloat(editShiftSpentCash) || 0;
                        const mw = parseFloat(editShiftMgmtWithdrawn) || 0;
                        const act = parseFloat(editShiftActualCash) || 0;
                        const exp = s + r + ma - sp - mw;
                        const d = act - exp;
                        return (
                          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs mt-2">
                            <span className="text-slate-400">Gözlənilən Kassa: <strong className="text-white font-mono">{exp.toFixed(2)} ₼</strong></span>
                            <span className={`font-mono font-bold ${d < 0 ? "text-red-400" : d > 0 ? "text-emerald-400" : "text-slate-300"}`}>
                              {d < 0 ? `Kəsir: ${Math.abs(d).toFixed(2)} ₼` : d > 0 ? `Artıq: +${d.toFixed(2)} ₼` : "Tamamdır (0.00 ₼)"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Admin PIN Confirmation */}
                    <div className="bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-800/40 space-y-1.5">
                      <label className="text-indigo-300 block font-bold">🔒 Admin PİN Kodu ilə Təsdiq *</label>
                      <input
                        type="password"
                        required
                        maxLength={6}
                        placeholder="Admin PIN kodunu daxil edin"
                        value={editShiftAdminPin}
                        onChange={(e) => setEditShiftAdminPin(e.target.value)}
                        className="bg-slate-950 text-white font-mono font-bold tracking-widest text-center border border-indigo-500/50 rounded-xl p-2.5 w-full focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    {/* Modal Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setIsEditShiftModalOpen(false); setEditingShift(null); }}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold cursor-pointer transition-colors"
                      >
                        Ləğv Et
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold cursor-pointer transition-colors shadow-lg shadow-indigo-950/40"
                      >
                        Yadda Saxla
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SUBTAB 6: USERS / CASHIERS MANAGEMENT */}
        {activeSubTab === "USERS" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header & Description */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-lg font-bold text-white font-display flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" />
                  <span>Kassirlər və İstifadəçi Girişləri</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kassir və admin heyətini idarə edin, 4 rəqəmli fərdi PIN kodlar təyin edin.
                </p>
              </div>

              <div className="bg-indigo-950/40 border border-indigo-800/40 px-3.5 py-2 rounded-xl text-xs text-indigo-300 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Ümumi istifadəçi sayı: <strong className="text-white font-bold">{state.users?.length || 0}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Add / Edit User Form */}
              <div className="lg:col-span-1 bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-5 h-fit shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-sm text-white">
                      {editingUser ? "İstifadəçini Redaktə Et" : "Yeni Kassir / İstifadəçi"}
                    </h3>
                  </div>
                  {editingUser && (
                    <button
                      type="button"
                      onClick={handleCancelUserEdit}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Ləğv et
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
                  {/* Name */}
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Ad və Soyad *</label>
                    <input
                      type="text"
                      required
                      placeholder="Məs: Əli Əliyev"
                      value={formUserName}
                      onChange={(e) => setFormUserName(e.target.value)}
                      className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* PIN Code */}
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">4 Rəqəmli PIN Kod *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="Məs: 1234"
                      value={formUserPin}
                      onChange={(e) => setFormUserPin(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono font-bold tracking-widest text-sm"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Kassir sistemə bu kodla daxil olacaq.</span>
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Sistem Rolu *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormUserRole("CASHIER")}
                        className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 border transition-all cursor-pointer ${
                          formUserRole === "CASHIER"
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/30"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Kassir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormUserRole("ADMIN")}
                        className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 border transition-all cursor-pointer ${
                          formUserRole === "ADMIN"
                            ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/30"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Admin</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/30 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingUser ? (
                      <span>Yadda saxlanılır...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{editingUser ? "Dəyişiklikləri Saxla" : "Kassiri Əlavə Et"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Users List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-bold text-sm text-white">Qeydiyyatdakı İstifadəçilər</h3>
                    </div>
                    <span className="text-[11px] text-slate-400">PIN kodlara nəzarət və silmə</span>
                  </div>

                  {(!state.users || state.users.length === 0) ? (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      İstifadəçi tapılmadı. Sol tərəfdən yeni kassir əlavə edin.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {state.users.map((u) => {
                        const isVisible = !!showPins[u.id];
                        return (
                          <div 
                            key={u.id}
                            className={`bg-slate-900 border rounded-2xl p-4.5 space-y-3 transition-all hover:border-slate-700 relative overflow-hidden ${
                              editingUser?.id === u.id ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-slate-850"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                                  u.role === "ADMIN" ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-indigo-500 to-blue-600"
                                }`}>
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="text-white font-bold text-sm">{u.name}</h4>
                                  <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md mt-0.5 ${
                                    u.role === "ADMIN" 
                                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" 
                                      : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                                  }`}>
                                    {u.role === "ADMIN" ? "👑 Admin" : "👨‍🍳 Kassir"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditUserClick(u)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  title="Redaktə et"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* PIN display row */}
                            <div className="bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                              <span className="text-[11px] text-slate-400 font-medium">Giriş PIN Kodu:</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-black text-sm text-amber-300 tracking-wider">
                                  {isVisible ? u.pin : "••••"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePinVisibility(u.id)}
                                  className="text-slate-400 hover:text-white cursor-pointer p-0.5"
                                  title={isVisible ? "Gizlət" : "Göstər"}
                                >
                                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Helpful Note Card */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4.5 text-xs text-slate-400 space-y-1.5 flex items-start space-x-3">
                  <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-semibold block">Kassir Girişi Haqqında:</strong>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      Hər bir kassir öz fərdi 4 rəqəmli PIN kodu ilə sistemə daxil olaraq öz növbəsini açır. Satışlar, kassa dövriyyəsi və anbar itkiləri həmin kassirin adına qeyd olunur.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUBTAB 7: DATABASE & SYSTEM RESET (ADMIN ONLY) */}
        {activeSubTab === "DATABASE" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Header & Description */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-lg font-bold text-white font-display flex items-center space-x-2">
                  <Database className="w-5 h-5 text-rose-500" />
                  <span>Baza və Sistem Sıfırlama Mərkəzi</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bu bölmə yalnız Admin üçün nəzərdə tutulub. Kassa menyusunda bu düymələr yoxdur.
                </p>
              </div>

              <div className="bg-rose-950/40 border border-rose-800/40 px-3.5 py-2 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Mühafizə: <strong className="text-white font-bold">Yalnız Admin Girişi</strong></span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <span className="text-[11px] text-slate-400 font-semibold block">Cəmi Sifariş Tarixçəsi</span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {(state.donerOrders?.length || 0) + (state.flowerOrders?.length || 0)}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">tamamlanmış satış</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <span className="text-[11px] text-slate-400 font-semibold block">Masa Sayı</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block">
                  {state.tables?.length || 12}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">restoran zalı masası</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <span className="text-[11px] text-slate-400 font-semibold block">Aktiv Məhsul Sayı</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  {state.donerProducts?.length || 0}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">menyu məhsulu</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <span className="text-[11px] text-slate-400 font-semibold block">İstifadəçi Heyəti</span>
                <span className="text-2xl font-black text-indigo-400 mt-1 block">
                  {state.users?.length || 0}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">admin və kassirlər</span>
              </div>
            </div>

            {/* BACKUP & RESTORE SECTION (Menyunu kompüterdən kompüterə köçürmək və qorumaq üçün) */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-indigo-500/30 space-y-5 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <span>Menyu və Baza Ehtiyat Nüsxəsi (Backup & Restore)</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30">
                        Köçürmə & Qoruma
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Menyunu öz kompüterinizdə hazırlayıb istənilən vaxt kassa kompüterinə və ya serverə köçürə bilərsiniz. Şəkillər və məhsullar qətiyyən silinmir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Export JSON */}
                <div className="bg-slate-900/90 p-4.5 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                      <Download className="w-4 h-4" />
                      <span>1. Menyunu və Bazanı Endir (Backup .json)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Bütün menyunu, daxil etdiyiniz şəkilləri, qiymətləri, istifadəçiləri və parametrləri tək bir JSON faylına çıxarır.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportBackupJson}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-950/40 cursor-pointer active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Menyu və Baza Faylını Endir (.json)</span>
                  </button>
                </div>

                {/* 2. Import / Restore JSON */}
                <div className="bg-slate-900/90 p-4.5 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                      <FileUp className="w-4 h-4" />
                      <span>2. Hazır Menyunu / Bazanı Bərpa Et (Restore)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Öz kompüterinizdə hazırladığınız və ya əvvəl endirdiyiniz backup `.json` faylını seçin və dərhal sistemə tətbiq edin.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={restoreFileInputRef}
                    accept=".json,application/json"
                    onChange={handleRestoreJsonFile}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isRestoringDatabase}
                    onClick={() => restoreFileInputRef.current?.click()}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-950/40 cursor-pointer active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isRestoringDatabase ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Baza Bərpa Edilir...</span>
                      </>
                    ) : (
                      <>
                        <FolderUp className="w-4 h-4" />
                        <span>JSON Backup Faylını Seç və Yüklə</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Option 1: Clean Test Orders (Recommended) */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Test Sifarişlərini Sıfırla (Tövsiyə Olunur)</h3>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Təmiz Başlanğıc</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    İşə real başlamaq üçün əvvəlki bütün test satışlarını, çekləri, hesabatları və masalardakı açıq qalıqları sıfırlayır.
                  </p>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850 text-[11px] space-y-1 text-slate-300">
                    <div className="text-emerald-400 font-bold">✔️ Qorunub saxlanılır:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
                      <li>Bütün məhsullar və menyu qiymətləri</li>
                      <li>Kateqoriyalar və inqrediyentlər</li>
                      <li>Kassirlər, adminlər və PIN kodlar</li>
                      <li>Kuryer məlumatları və masa quruluşu</li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearTestOrdersOnly}
                  className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-950/40 cursor-pointer active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sifariş və Satış Tarixçəsini Sıfırla</span>
                </button>
              </div>

              {/* Option 2: Full Factory Reset */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-600/10 text-red-400 rounded-xl border border-red-500/20">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Tam Zavod Sıfırlaması (Factory Reset)</h3>
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">İlkin Vəziyyət</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bütün sistemi (yeni əlavə edilmiş məhsullar, sifarişlər, xərclər daxil olmaqla) ilkin ilkin proqram vəziyyətinə qaytarır.
                  </p>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-850 text-[11px] space-y-1 text-slate-300">
                    <div className="text-red-400 font-bold">⚠️ Qeyd:</div>
                    <p className="text-slate-400 leading-relaxed">
                      Bu əməliyyat yalnız proqramı tamamilə ilkin zavod halına qaytarmaq istədikdə istifadə edilməlidir.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFullFactoryReset}
                  className="w-full py-3.5 px-4 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold rounded-xl text-xs transition-all shadow-lg cursor-pointer active:scale-95 flex items-center justify-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Tam Zavod Sıfırlaması Et</span>
                </button>
              </div>

            </div>

            {/* Security Explanation Note */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 space-y-2 flex items-start space-x-3.5">
              <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <strong className="text-white font-bold block text-sm">Təhlükəsizlik Məlumatı:</strong>
                <p className="text-slate-400 text-xs">
                  Bu sıfırlama alətləri yalnız Admin Panel daxilində yerləşir və PIN kodla qorunur. Kassirlərin işlədiyi gündəlik POS ekranında heç bir silmə düyməsi yoxdur. Beləliklə, işçilər və ya təsadüfi toxunuşlar real satış məlumatlarını silə bilməz.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* PRODUCT ADD / EDIT MODAL */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2.5 rounded-xl ${prodBusiness === BusinessType.Doner ? "bg-orange-600/20 text-orange-400" : "bg-emerald-600/20 text-emerald-400"}`}>
                  {prodBusiness === BusinessType.Doner ? <Utensils className="w-5 h-5" /> : <Flower className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-display">
                    {editingProduct ? "Məhsulu Redaktə Et (Yenilə)" : "Yeni Məhsul Əlavə Et"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {prodBusiness === BusinessType.Doner ? "Köz Dönər Menyusu" : "Zərif Güllər Kolleksiyası"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProdModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              {/* Business Selector (only if adding new) */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Biznes Şöbəsi *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProdBusiness(BusinessType.Doner);
                      if (!formProdCategory) setFormProdCategory("Dönər");
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
                      prodBusiness === BusinessType.Doner
                        ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-950/30"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Köz Dönər</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProdBusiness(BusinessType.Flower);
                      if (!formProdCategory) setFormProdCategory("Güllər");
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-2 border transition-all cursor-pointer ${
                      prodBusiness === BusinessType.Flower
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/30"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    <Flower className="w-3.5 h-3.5" />
                    <span>Zərif Güllər</span>
                  </button>
                </div>
              </div>

              {/* Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1 font-semibold">Məhsulun Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Məs: Toyuq Dönəri (Porsiyon) və ya Ağ Qızılgül"
                    value={formProdName}
                    onChange={(e) => setFormProdName(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Qiymət (₼) *</label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step={0.1}
                    placeholder="Məs: 4.50"
                    value={formProdPrice || ""}
                    onChange={(e) => setFormProdPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Category & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Kateqoriya *</label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Məs: Dönər, İçki, Qəlyanaltı, Güllər..."
                      value={formProdCategory}
                      onChange={(e) => setFormProdCategory(e.target.value)}
                      className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex flex-wrap gap-1">
                      {(prodBusiness === BusinessType.Doner ? ["Dönər", "İçki", "Qəlyanaltı", "Sous"] : ["Güllər", "Buketlər", "Aksesuarlar", "Qutular"]).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormProdCategory(c)}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Anbar Qalığı (Ədəd)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Məs: 100 (İçki və güllər üçün)"
                    value={formProdStock}
                    onChange={(e) => setFormProdStock(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Qeyd: Boş buraxsanız sərbəst hazırlanma sayılır.</span>
                </div>
              </div>

              {/* Ingredients (For food items) */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Tərkib İnqrediyentləri (Vergüllə ayırın)</label>
                <input
                  type="text"
                  placeholder="Məs: Ət, Pomidor, Xiyar, Sous, Soğan"
                  value={formProdIngredients}
                  onChange={(e) => setFormProdIngredients(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Müştəri sifariş verərkən çıxara biləcəyi inqrediyentlər.</span>
              </div>

              {/* Image Upload & Management Section */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-semibold block flex items-center space-x-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Məhsulun Şəkli</span>
                  </label>

                  {/* Mode switcher: File Upload vs URL */}
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setImageUploadTab("FILE")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        imageUploadTab === "FILE"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      📁 Kompüterdən Yüklə
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadTab("URL")}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        imageUploadTab === "URL"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      🔗 İnternet Linki (URL)
                    </button>
                  </div>
                </div>

                {/* TAB 1: File Upload (Computer / Drag & Drop) */}
                {imageUploadTab === "FILE" && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    {!formProdImage ? (
                      <div
                        onDragOver={handleImageDragOver}
                        onDragLeave={handleImageDragLeave}
                        onDrop={handleImageDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2.5 ${
                          imageDragActive
                            ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                            : "border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950"
                        }`}
                      >
                        {isProcessingImage ? (
                          <div className="flex flex-col items-center space-y-2 py-2">
                            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                            <span className="text-xs text-slate-300 font-bold">Şəkil sıxılır və yaddaşa yazılır...</span>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">
                                Şəkli bura sürükləyin və ya <span className="text-indigo-400 underline">kompüterdən seçin</span>
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                JPG, PNG, WEBP və ya SVG (Maks. 15 MB)
                              </p>
                            </div>
                            <span className="inline-flex items-center space-x-1 text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-full">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Şəkil bazada saxlanılır, başqa kompüterə köçürdükdə silinmir</span>
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      /* Image Preview & Actions */
                      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between space-x-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative group">
                            <img
                              src={formProdImage}
                              alt="Seçilmiş şəkil"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              <span>Şəkil hazırdır</span>
                            </span>
                            <p className="text-[10px] text-slate-400 truncate">
                              {formProdImage.startsWith("data:") 
                                ? "Kompüter yaddaşından yükləndi (Base64)" 
                                : formProdImage}
                            </p>
                            {imageStats && (
                              <p className="text-[9px] text-slate-500 font-mono">
                                Həcm: {imageStats.compressedKB} KB (əvvəlki: {imageStats.originalKB} KB)
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 transition-colors cursor-pointer flex items-center space-x-1"
                          >
                            <FolderUp className="w-3.5 h-3.5" />
                            <span>Dəyiş</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors cursor-pointer"
                            title="Şəkli sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Web URL input */}
                {imageUploadTab === "URL" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... və ya web link"
                        value={formProdImage}
                        onChange={(e) => setFormProdImage(e.target.value)}
                        className="flex-1 bg-slate-950 text-white border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      {formProdImage && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-3 py-2 bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                    {formProdImage && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        <img 
                          src={formProdImage} 
                          alt="Önbaxış" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProdModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
                >
                  Ləğv Et
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className={`px-6 py-3 rounded-xl text-white font-extrabold transition-all cursor-pointer flex items-center space-x-2 shadow-lg ${
                    prodBusiness === BusinessType.Doner
                      ? "bg-orange-600 hover:bg-orange-500 shadow-orange-950/30"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30"
                  }`}
                >
                  {isSubmittingProduct ? (
                    <span>Saxlanılır...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{editingProduct ? "Dəyişiklikləri Saxla" : "Məhsulu Əlavə Et"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual Table QR Code & Printing Modal */}
      {/* Visual Table QR Code & Printing Modal */}
      {qrModalTable !== null && (
        <TableQRModal
          initialTableNumber={qrModalTable}
          tables={state.tables || []}
          onClose={() => setQrModalTable(null)}
        />
      )}

      {/* 1. SUPPLIER ADD / EDIT MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingSupplier ? "Təchizatçını Redaktə Et" : "Yeni Təchizatçı Əlavə Et"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Mal və ərzaq tədarükçüsü məlumatları</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Təchizatçının və ya Məhsulun Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Məs: Ət Təchizatı (Dana əti), Çörək, Coca-Cola Distribütor"
                  value={supplierFormName}
                  onChange={e => setSupplierFormName(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Təchiz Edilən Əsas Məhsul / Malın Növü (İstəyə bağlı)</label>
                <input
                  type="text"
                  placeholder="Məs: Dana əti (Şişlik), Lavaş, Ayran, Kartof Fri, Qablaşdırma və s."
                  value={supplierFormProduct}
                  onChange={e => setSupplierFormProduct(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Təchizatçının təqdim etdiyi məhsulun adını buradan asanlıqla dəyişə və ya təyin edə bilərsiniz</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Telefon Nömrəsi</label>
                  <input
                    type="text"
                    placeholder="Məs: +994 50 123 45 67"
                    value={supplierFormPhone}
                    onChange={e => setSupplierFormPhone(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Şirkət / Mağaza / VÖEN</label>
                  <input
                    type="text"
                    placeholder="Məs: Bakı Ət MMC"
                    value={supplierFormCompany}
                    onChange={e => setSupplierFormCompany(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Təchizat Sahəsi / Kateqoriya</label>
                <select
                  value={supplierFormCategory}
                  onChange={e => setSupplierFormCategory(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Ət və Toyuq">🥩 Ət və Toyuq</option>
                  <option value="Çörək və Lavaş">🥖 Çörək və Lavaş</option>
                  <option value="İçkilər">🥤 Sərinləşdirici İçkilər</option>
                  <option value="Tərəvəz">🥬 Tərəvəz və Ədviyyat</option>
                  <option value="Qablaşdırma">📦 Qablaşdırma və Birdəfəlik qablar</option>
                  <option value="Güllər və Aksesuarlar">🌸 Güllər və Aksesuarlar</option>
                  <option value="Digər">Digər təchizat</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  {editingSupplier ? "Cari Borc Qalığı (₼)" : "İlkin Borc Qalığı (Varsa, ₼)"}
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="0.00"
                  value={supplierFormInitialDebt}
                  onChange={e => setSupplierFormInitialDebt(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {editingSupplier ? "Təchizatçıya qalan cari borc məbləğinə buradan birbaşa düzəliş edə bilərsiniz" : "Əgər təchizatçıya əvvəldən ödənilməmiş borc varsa daxil edin"}
                </span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Əlavə Qeydlər</label>
                <textarea
                  rows={2}
                  placeholder="Məs: Çatdırılma günləri: Çərşənbə və Şənbə günləri..."
                  value={supplierFormNote}
                  onChange={e => setSupplierFormNote(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupplier}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold transition-all cursor-pointer shadow-lg shadow-indigo-950/30 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingSupplier ? "Yenilə" : "Əlavə Et"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SUPPLIER RECORD PURCHASE MODAL (MAL ALIŞI) */}
      {purchaseModalSupplier !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Mal Alışı: {purchaseModalSupplier.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cari borc: <strong className="text-red-400">{purchaseModalSupplier.debtBalance.toFixed(2)} ₼</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPurchaseModalSupplier(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSupplierPurchase} className="space-y-4 text-xs">
              
              {/* Product selection / input */}
              <div className="space-y-2">
                <label className="text-slate-400 block font-semibold">Məhsul / Malın Adı (Anbara mədaxil üçün)</label>
                <input
                  type="text"
                  placeholder="Məs: Dana əti (Spit / Şiş), Coca-Cola 330ml, Dönər Çörəyi"
                  value={purchaseItemName}
                  onChange={e => setPurchaseItemName(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
                
                {/* Fast select from existing warehouse items */}
                {state.inventoryItems && state.inventoryItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Mövcud anbardan seç:</span>
                    {state.inventoryItems.slice(0, 6).map(inv => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => {
                          setPurchaseItemName(inv.name);
                          setPurchaseCategory(inv.category);
                          setPurchaseUnit(inv.unit);
                        }}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        {inv.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity, Unit, Unit Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Miqdar</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    placeholder="Məs: 50"
                    value={purchaseQty}
                    onChange={e => {
                      const q = e.target.value === "" ? "" : Number(e.target.value);
                      setPurchaseQty(q);
                      if (typeof q === "number" && typeof purchaseUnitPrice === "number") {
                        setPurchaseTotalAmount(Number((q * purchaseUnitPrice).toFixed(2)));
                      }
                    }}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Ölçü Vahidi</label>
                  <select
                    value={purchaseUnit}
                    onChange={e => setPurchaseUnit(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="kq">kq</option>
                    <option value="ədəd">ədəd</option>
                    <option value="litr">litr</option>
                    <option value="rulon">rulon</option>
                    <option value="qutu">qutu</option>
                    <option value="bağlama">bağlama</option>
                    <option value="qram">qram</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Vahid Qiyməti (₼)</label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder="Məs: 12.50"
                    value={purchaseUnitPrice}
                    onChange={e => {
                      const p = e.target.value === "" ? "" : Number(e.target.value);
                      setPurchaseUnitPrice(p);
                      if (typeof purchaseQty === "number" && typeof p === "number") {
                        setPurchaseTotalAmount(Number((purchaseQty * p).toFixed(2)));
                      }
                    }}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Invoiced Total vs Paid Now */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold text-white">Alışın Cəmi Məbləği (₼) *</label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step={0.1}
                    placeholder="Məs: 500.00"
                    value={purchaseTotalAmount}
                    onChange={e => setPurchaseTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-900 text-white text-base font-black border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Qaimədəki ümumi məbləğ</span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold text-emerald-400">İndi Ödənilən Məbləğ (₼)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="0.00 (Tam nisyədirsə 0 qoyun)"
                    value={purchasePaidAmount}
                    onChange={e => setPurchasePaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-900 text-emerald-400 text-base font-black border border-emerald-500/30 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Dərhal kassadan/bankdan verilən hissə</span>
                </div>
              </div>

              {/* Debt Calculation Summary */}
              {typeof purchaseTotalAmount === "number" && purchaseTotalAmount > 0 && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block">Təchizatçının Borc Qalığına Əlavə Olunacaq:</span>
                    <strong className="text-red-400 text-sm font-black">
                      {Math.max(0, purchaseTotalAmount - (Number(purchasePaidAmount) || 0)).toFixed(2)} ₼
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Yeni Ümumi Borc:</span>
                    <strong className="text-white text-sm font-black">
                      {(purchaseModalSupplier.debtBalance + Math.max(0, purchaseTotalAmount - (Number(purchasePaidAmount) || 0))).toFixed(2)} ₼
                    </strong>
                  </div>
                </div>
              )}

              {/* Payment Source & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Ödəniş Mənbəyi (Ödənilən hissə üçün)</label>
                  <select
                    value={purchasePaymentSource}
                    onChange={e => setPurchasePaymentSource(e.target.value as any)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Kassa (Nağd)">💵 Kassa (Nağd) - Növbədən çıxılır</option>
                    <option value="Bank Kartı">💳 Bank Hesabı / Kart</option>
                    <option value="POS Terminal">💳 POS Terminal</option>
                    <option value="m10">📱 m10</option>
                    <option value="Digər">Digər</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Tarix</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={e => setPurchaseDate(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Qaimə № / Qeyd</label>
                <input
                  type="text"
                  placeholder="Məs: Qaimə №1042, Şişlik dana əti təhvil alındı"
                  value={purchaseNote}
                  onChange={e => setPurchaseNote(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPurchaseModalSupplier(null)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPurchase}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition-all cursor-pointer shadow-lg shadow-emerald-950/30 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Alışı Qeyd Et və Anbara Daxil Et</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SUPPLIER PAY DEBT MODAL (BORC ÖDƏNİŞİ) */}
      {payDebtSupplier !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-amber-600/20 text-amber-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Borc Ödənişi</h3>
                  <p className="text-[11px] text-slate-400">{payDebtSupplier.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayDebtSupplier(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySupplierDebt} className="space-y-4 text-xs">
              
              {/* Current Debt Banner */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Təchizatçıya Cari Borcumuz</span>
                  <span className="text-xl font-black text-red-400">
                    {payDebtSupplier.debtBalance.toFixed(2)} ₼
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPayDebtAmount(payDebtSupplier.debtBalance)}
                  className="text-[11px] bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                >
                  Tam Borcu Seç
                </button>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold text-white">Ödəniləcək Məbləğ (₼) *</label>
                <input
                  type="number"
                  required
                  min={0.1}
                  step={0.1}
                  placeholder="Məs: 200.00"
                  value={payDebtAmount}
                  onChange={e => setPayDebtAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-950 text-white text-base font-black border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {typeof payDebtAmount === "number" && payDebtAmount > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Ödənişdən sonra qalıq:</span>
                  <strong className="text-emerald-400 font-bold">
                    {Math.max(0, payDebtSupplier.debtBalance - payDebtAmount).toFixed(2)} ₼
                  </strong>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Ödəniş Mənbəyi *</label>
                  <select
                    value={payDebtSource}
                    onChange={e => setPayDebtSource(e.target.value as any)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Kassa (Nağd)">💵 Kassa (Nağd) - Kassa çıxışı</option>
                    <option value="Bank Kartı">💳 Bank Hesabı / Kart</option>
                    <option value="POS Terminal">💳 POS Terminal</option>
                    <option value="m10">📱 m10</option>
                    <option value="Digər">Digər</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Ödəniş Tarixi</label>
                  <input
                    type="date"
                    required
                    value={payDebtDate}
                    onChange={e => setPayDebtDate(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Qeyd (İstəyə bağlı)</label>
                <input
                  type="text"
                  placeholder="Məs: Ət borcunun bir hissəsi ödənildi"
                  value={payDebtNote}
                  onChange={e => setPayDebtNote(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayDebtSupplier(null)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayDebt}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold transition-all cursor-pointer shadow-lg shadow-amber-950/30 flex items-center space-x-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Ödənişi Təsdiqlə və Çıx</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. SUPPLIER STATEMENT / LEDGER MODAL (ÇIXARIŞ VƏ TARİXÇƏ) */}
      {ledgerSupplier !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Təchizatçı Çıxarışı: {ledgerSupplier.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bütün alışların, ödənişlərin və borc dəyişikliklərinin xronologiyası
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLedgerSupplier(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPI stats banner */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Cəmi Mal Alışı:</span>
                <strong className="text-blue-400 text-sm font-black">
                  {ledgerSupplier.totalPurchases.toFixed(2)} ₼
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Cəmi Ödənilmiş:</span>
                <strong className="text-emerald-400 text-sm font-black">
                  {ledgerSupplier.totalPaid.toFixed(2)} ₼
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Cari Borc Qalığı:</span>
                <strong className={`text-sm font-black ${ledgerSupplier.debtBalance > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {ledgerSupplier.debtBalance.toFixed(2)} ₼
                </strong>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-950 text-[10px] text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Tarix</th>
                    <th className="p-3">Əməliyyat Növü</th>
                    <th className="p-3">Məhsul / Təyinat</th>
                    <th className="p-3 text-right">Ümumi Alış</th>
                    <th className="p-3 text-right">Ödənilən</th>
                    <th className="p-3 text-right">Borca Yazılan</th>
                    <th className="p-3">Mənbə & Qeyd</th>
                    <th className="p-3 text-center">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {((state.supplierTransactions || []).filter(t => t.supplierId === ledgerSupplier.id).length > 0
                    ? (state.supplierTransactions || []).filter(t => t.supplierId === ledgerSupplier.id)
                    : (state.expenses || []).filter(e => e.supplierId === ledgerSupplier.id).map(e => ({
                        id: e.id,
                        supplierId: ledgerSupplier.id,
                        supplierName: ledgerSupplier.name,
                        type: e.isSupplierPayment ? ("PAYMENT" as const) : ("PURCHASE" as const),
                        totalAmount: e.invoiceTotal || e.amount,
                        paidAmount: e.amount,
                        debtAmount: e.debtAmount || 0,
                        paymentSource: e.paymentSource,
                        note: e.note,
                        date: e.date,
                        timestamp: e.confirmedAt || e.date,
                        itemsSummary: e.title
                      }))
                  ).map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-slate-400 font-medium whitespace-nowrap">{tx.date}</td>
                      <td className="p-3 whitespace-nowrap">
                        {tx.type === "PURCHASE" ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Package className="w-3 h-3" />
                            <span>Mal Alışı</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <DollarSign className="w-3 h-3" />
                            <span>Borc Ödənişi</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-white font-medium">{tx.itemsSummary || "-"}</td>
                      <td className="p-3 text-right font-bold text-blue-400">
                        {tx.type === "PURCHASE" ? `${tx.totalAmount.toFixed(2)} ₼` : "-"}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {tx.paidAmount > 0 ? `${tx.paidAmount.toFixed(2)} ₼` : "0.00 ₼"}
                      </td>
                      <td className="p-3 text-right font-bold text-red-400">
                        {tx.debtAmount > 0 ? `+${tx.debtAmount.toFixed(2)} ₼` : "-"}
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        <span className="text-indigo-400 block font-semibold">{tx.paymentSource || "Kassa (Nağd)"}</span>
                        {tx.note && <span className="text-slate-500">{tx.note}</span>}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTx(tx)}
                            className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Düzəliş et (Məbləğ, tarix, qeyd)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx)}
                            className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Əməliyyatı sil və borcu bərpa et"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {(state.supplierTransactions || []).filter(t => t.supplierId === ledgerSupplier.id).length === 0 &&
                   (state.expenses || []).filter(e => e.supplierId === ledgerSupplier.id).length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500">
                        Bu təchizatçı ilə hələ heç bir əməliyyat və ya alış qeydə alınmayıb.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Edit Transaction Modal inline */}
            {editingTransaction !== null && (
              <div className="bg-slate-950 p-5 rounded-2xl border-2 border-indigo-500/40 space-y-4 animate-fadeIn shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Təchizatçı Əməliyyatına Düzəliş</span>
                        {editingTransaction.type === "PAYMENT" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            💳 Borc Ödənişi
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            📦 Mal Alışı
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Məbləğ və ya digər məlumatları dəyişdikdə təchizatçının borc qalığı avtomatik yenidən hesablanacaq
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 text-xs transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveTransactionEdit} className="space-y-3.5">
                  {editingTransaction.type === "PAYMENT" ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 block mb-1 text-[11px] font-bold">
                            Ödəniş Məbləği (₼) *
                          </label>
                          <input
                            type="number"
                            required
                            step="any"
                            min="0.01"
                            placeholder="Məs: 50.00"
                            value={txEditPaidAmount}
                            onChange={e => setTxEditPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl p-2.5 text-sm font-black focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-slate-300 block mb-1 text-[11px] font-semibold">
                            Ödəniş Mənbəyi *
                          </label>
                          <select
                            value={txEditPaymentSource}
                            onChange={e => setTxEditPaymentSource(e.target.value as ExpensePaymentSource)}
                            className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                          >
                            <option value="Kassa (Nağd)">💵 Kassa (Nağd) - Kassa çıxışı</option>
                            <option value="Bank Kartı">💳 Bank Hesabı / Kart</option>
                            <option value="POS Terminal">💳 POS Terminal</option>
                            <option value="m10">📱 m10</option>
                            <option value="Digər">Digər</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1 text-[11px] font-semibold">
                          Təyinat / Əməliyyat Başlığı
                        </label>
                        <input
                          type="text"
                          placeholder="Məs: Borc ödənişi"
                          value={txEditItemSummary}
                          onChange={e => setTxEditItemSummary(e.target.value)}
                          className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-slate-300 block mb-1 text-[11px] font-semibold">
                          Məhsulun / Malın Adı *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Məs: Dana Əti, Coca-Cola 330ml, Dönər Çörəyi"
                          value={txEditItemSummary}
                          onChange={e => setTxEditItemSummary(e.target.value)}
                          className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-slate-300 block mb-1 text-[11px] font-bold">
                            Ümumi Alış Məbləği (₼) *
                          </label>
                          <input
                            type="number"
                            required
                            step="any"
                            min="0.01"
                            value={txEditTotalAmount}
                            onChange={e => setTxEditTotalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-slate-900 text-blue-400 border border-slate-700 rounded-xl p-2.5 text-sm font-black focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-slate-300 block mb-1 text-[11px] font-bold">
                            Ödənilən Məbləğ (₼)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={txEditPaidAmount}
                            onChange={e => setTxEditPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl p-2.5 text-sm font-black focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 text-[11px]">
                            Borca Qalan (Avtomatik)
                          </label>
                          <div className="w-full bg-slate-950 text-red-400 border border-slate-800 rounded-xl p-2.5 text-sm font-black">
                            {Math.max(0, (Number(txEditTotalAmount) || 0) - (Number(txEditPaidAmount) || 0)).toFixed(2)} ₼
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 block mb-1 text-[11px] font-semibold">
                          Ödəniş Mənbəyi
                        </label>
                        <select
                          value={txEditPaymentSource}
                          onChange={e => setTxEditPaymentSource(e.target.value as ExpensePaymentSource)}
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl p-2 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          <option value="Kassa (Nağd)">💵 Kassa (Nağd) - Kassa çıxışı</option>
                          <option value="Bank Kartı">💳 Bank Hesabı / Kart</option>
                          <option value="POS Terminal">💳 POS Terminal</option>
                          <option value="m10">📱 m10</option>
                          <option value="Digər">Digər</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-slate-400 block mb-1 text-[11px] font-semibold">Tarix *</label>
                      <input
                        type="date"
                        required
                        value={txEditDate}
                        onChange={e => setTxEditDate(e.target.value)}
                        className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 text-[11px] font-semibold">Qeyd</label>
                      <input
                        type="text"
                        placeholder="Əlavə qeyd..."
                        value={txEditNote}
                        onChange={e => setTxEditNote(e.target.value)}
                        className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={isDeletingTx}
                      onClick={() => handleDeleteTransaction(editingTransaction)}
                      className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Bu Əməliyyatı Sil</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTransaction(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Ləğv Et
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingTxEdit}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-indigo-950/40"
                      >
                        {isSubmittingTxEdit ? "Yadda Saxlanılır..." : "Düzəlişi Təsdiqlə"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLedgerSupplier(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT INVENTORY ITEM */}
      {isInvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsInvModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  {editingInvItem ? "Anbar Məhsulunu Redaktə Et" : "Yeni Anbar Məhsulu / Xammal Əlavə Et"}
                </h3>
                <p className="text-xs text-slate-400">Ət, xammal, souslar, içki və ərzaq qalıqlarını qeyd edin</p>
              </div>
            </div>

            <form onSubmit={handleSaveInvItem} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Məhsulun / Xammalın Adı *</label>
                <input
                  type="text"
                  required
                  value={invFormName}
                  onChange={(e) => setInvFormName(e.target.value)}
                  placeholder="Məs: Dana Əti (Təzə), Toyuq Əti, Çörək, Lavaş..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Kateqoriya *</label>
                  <select
                    value={invFormCategory}
                    onChange={(e) => setInvFormCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white w-full focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Ət">Ət & Toyuq</option>
                    <option value="Çörək">Çörək</option>
                    <option value="Lavaş">Lavaş</option>
                    <option value="Tərəvəz">Tərəvəz & Göyərti</option>
                    <option value="İçki">İçki</option>
                    <option value="Sous">Sous & Ədviyyat</option>
                    <option value="Qablaşdırma">Qablaşdırma / Paket</option>
                    <option value="Digər">Digər Xammal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Ölçü Vahidi *</label>
                  <select
                    value={invFormUnit}
                    onChange={(e) => setInvFormUnit(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white w-full focus:outline-none focus:border-indigo-500"
                  >
                    <option value="kq">kq (Kiloqram)</option>
                    <option value="qram">qram</option>
                    <option value="ədəd">ədəd</option>
                    <option value="litr">litr</option>
                    <option value="qutu">qutu</option>
                    <option value="bağlama">bağlama</option>
                    <option value="vedrə">vedrə</option>
                    <option value="rulon">rulon</option>
                  </select>
                </div>
              </div>

              {/* Stock & Min Stock Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Cari Qalıq (Stok) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={invFormStock}
                    onChange={(e) => setInvFormStock(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Məs: 10"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-400 block mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Kritik Xəbərdarlıq Həddi</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={invFormMinAlert}
                    onChange={(e) => setInvFormMinAlert(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Məs: 3 (bu həddə xəbərdar et)"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-amber-300 placeholder-slate-500 w-full focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Bu miqdara çatanda sarı xəbərdarlıq çıxacaq</span>
                </div>
              </div>

              {/* Cost Price */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Maya / Alış Qiyməti (₼ vahid üçün - istəyə bağlı)</label>
                <input
                  type="number"
                  step="0.01"
                  value={invFormCostPrice}
                  onChange={(e) => setInvFormCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Məs: 14.50"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInvModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvItem}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-950/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingInvItem ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saxlanılır...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingInvItem ? "Dəyişiklikləri Saxla" : "Məhsulu Əlavə Et"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD USAGE / WRITE-OFF (GÜNDƏLİK İSTİFADƏ VƏ SİLİNMƏ) */}
      {isUsageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsUsageModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
                <MinusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Məhsul / Ət İstifadəsi və Silinməsi (Məxaric)</h3>
                <p className="text-xs text-slate-400">Gündəlik istifadə olunan miqdarı daxil edin (məs: 10 kq ətdən 8 kq silinsin)</p>
              </div>
            </div>

            <form onSubmit={handleRecordUsage} className="space-y-4">
              {/* Select Item */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Silinəcək Xammal / Ət *</label>
                <select
                  required
                  value={usageItem?.id || ""}
                  onChange={(e) => {
                    const sel = inventoryItems.find(i => i.id === e.target.value);
                    setUsageItem(sel || null);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white w-full focus:outline-none focus:border-orange-500 font-bold"
                >
                  <option value="" disabled>-- Məhsulu seçin --</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Anbarda qalıq: {item.stock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Item Stock Banner */}
              {usageItem && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Anbardakı Mövcud Qalıq:</span>
                  <span className={`font-black text-sm px-2.5 py-0.5 rounded-lg border ${
                    usageItem.stock <= 0
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : usageItem.stock <= (usageItem.minStockAlert || 5)
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  }`}>
                    {usageItem.stock} {usageItem.unit}
                  </span>
                </div>
              )}

              {/* Quantity to Write-off */}
              <div>
                <label className="text-xs font-bold text-orange-400 block mb-1 flex items-center justify-between">
                  <span>Silinəcək (İstifadə Olunmuş) Miqdar *</span>
                  {usageItem && <span className="text-slate-400 font-normal">Ölçü: {usageItem.unit}</span>}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={usageQty}
                  onChange={(e) => setUsageQty(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={`Məs: 8 (${usageItem ? usageItem.unit : "kq"})`}
                  className="bg-slate-950 border border-orange-500/40 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 w-full focus:outline-none font-mono font-bold"
                />
              </div>

              {/* Live Remaining Stock Preview */}
              {usageItem && usageQty !== "" && Number(usageQty) > 0 && (
                <div className="bg-orange-950/20 border border-orange-500/30 p-3 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
                  <span className="text-orange-300 font-medium">Əməliyyatdan sonra qalan stok:</span>
                  <strong className="text-sm font-black text-orange-400">
                    {Math.max(0, usageItem.stock - Number(usageQty)).toFixed(2)} {usageItem.unit}
                  </strong>
                </div>
              )}

              {/* Reason & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Silinmə Səbəbi *</label>
                  <select
                    value={usageReason}
                    onChange={(e) => setUsageReason(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white w-full focus:outline-none focus:border-orange-500"
                  >
                    <option value="Gündəlik dönər üçün istifadə">Gündəlik dönər satışı üçün</option>
                    <option value="Mətbəx / Yemək hazırlığı">Mətbəx / Yemək hazırlığı</option>
                    <option value="İşçi yeməyi">İşçi / Heyət yeməyi</option>
                    <option value="Xarab oldu / İtki">Xarab oldu / İtki / Brak</option>
                    <option value="Sınaq / Dadım">Sınaq / Dadım</option>
                    <option value="Digər">Digər səbəb</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Tarix *</label>
                  <input
                    type="date"
                    required
                    value={usageDate}
                    onChange={(e) => setUsageDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white w-full focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Qeyd (İstəyə bağlı)</label>
                <input
                  type="text"
                  value={usageNote}
                  onChange={(e) => setUsageNote(e.target.value)}
                  placeholder="Məs: 'Nahar növbəsində dönər üçün işləndi'"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 w-full focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUsageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUsage}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition-all shadow-md shadow-orange-950/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingUsage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Silinir...</span>
                    </>
                  ) : (
                    <>
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>Miqdarı Sil və Qalığı Yenilə</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK RESTOCK (+ MƏDAXİL) */}
      {isRestockModalOpen && restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsRestockModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Anbara Mədaxil Et</h3>
                <p className="text-xs text-slate-400">{restockItem.name}</p>
              </div>
            </div>

            <form onSubmit={handleSaveRestock} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Cari Stok:</span>
                <span className="font-bold text-white text-sm">{restockItem.stock} {restockItem.unit}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400 block mb-1">
                  Əlavə Olunacaq Miqdar ({restockItem.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={`Məs: 20 (${restockItem.unit})`}
                  className="bg-slate-950 border border-emerald-500/40 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 w-full focus:outline-none font-mono font-bold"
                />
              </div>

              {restockQty !== "" && Number(restockQty) > 0 && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-medium">Yeni Stok Qalığı:</span>
                  <strong className="text-sm font-black text-emerald-400">
                    {(restockItem.stock + Number(restockQty)).toFixed(2)} {restockItem.unit}
                  </strong>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRestock}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-950/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingRestock ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Qəbul Edilir...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Mədaxil Et</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

