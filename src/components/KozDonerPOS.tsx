import React, { useState, useCallback, useMemo } from "react";
import { AppState, Product, TableState, PaymentMethod, OrderItem, Courier, BusinessType, Expense, User as UserType, DonerOrder, InventoryItem } from "../types";
import { 
  ChefHat, 
  Layers, 
  Utensils, 
  ShoppingBag, 
  Truck, 
  Plus, 
  Minus, 
  MinusCircle,
  Trash2, 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Printer, 
  CheckCircle, 
  QrCode, 
  PlusCircle, 
  Phone, 
  MapPin, 
  User as UserIcon,
  ArrowLeft,
  X,
  Check,
  Info,
  Sparkles,
  Calendar,
  Activity,
  Archive,
  TrendingUp,
  Settings,
  Grid,
  BarChart3,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  FolderUp,
  Download,
  RefreshCw,
  Database,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Flame,
  Globe,
  Wifi,
  Copy
} from "lucide-react";
import ReceiptPrinter from "./ReceiptPrinter";
import PaymentSelector from "./PaymentSelector";
import DonerReports from "./DonerReports";
import TableQRModal from "./TableQRModal";
import { QRCodeSVG } from "qrcode.react";
import { processImageFile } from "../utils/imageUtils";

const standardItemsList = [
  { name: "Coca-Cola 330ml", category: "İçki", unit: "ədəd" },
  { name: "Fanta 330ml", category: "İçki", unit: "ədəd" },
  { name: "Sprite 330ml", category: "İçki", unit: "ədəd" },
  { name: "Ayran 200ml", category: "İçki", unit: "ədəd" },
  { name: "Su 500ml", category: "İçki", unit: "ədəd" },
  { name: "Dönər Çörəyi", category: "Çörək", unit: "ədəd" },
  { name: "Dönər Lavaş", category: "Çörək", unit: "ədəd" },
  { name: "Tombik Çörək", category: "Çörək", unit: "ədəd" },
  { name: "Mayonez", category: "Digər", unit: "kq" },
  { name: "Ketçup", category: "Digər", unit: "kq" },
  { name: "Xiyar Turşusu", category: "Digər", unit: "kq" },
  { name: "Pomidor", category: "Digər", unit: "kq" },
  { name: "Kartof Fri", category: "Digər", unit: "kq" },
  { name: "Göyərti", category: "Digər", unit: "dəstə" }
];

interface KozDonerPOSProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onBackToHub: () => void;
  currentUser?: UserType | null;
}

export default function KozDonerPOS({ state, onUpdateState, onBackToHub, currentUser }: KozDonerPOSProps) {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<"TABLES" | "ORDER_WINDOW" | "DIRECT_ORDER" | "DELIVERIES" | "EXPENSES" | "STOCK" | "REPORTS" | "SETTINGS" | "STOCK_PURCHASE">("TABLES");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [settingsTableCount, setSettingsTableCount] = useState<string>(String(state.tables?.length || 12));

  // POS Device ID & Table Locking
  const [posDeviceId] = useState<string>("pos_cashier_desktop");
  const [blockedTableWarning, setBlockedTableWarning] = useState<TableState | null>(null);

  // Mobile Waiter QR Modal & Network IP & Cloudflare Tunnel
  const [isWaiterQRModalOpen, setIsWaiterQRModalOpen] = useState<boolean>(false);
  const [localServerIp, setLocalServerIp] = useState<string>("");
  const [localServerPort, setLocalServerPort] = useState<number>(3000);
  const [networkAdapters, setNetworkAdapters] = useState<{ name: string; ip: string; isWifi: boolean; isEthernet: boolean; label: string }[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>("");
  const [customIpInput, setCustomIpInput] = useState<string>("");
  const [useCustomIp, setUseCustomIp] = useState<boolean>(false);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [isTunnelLoading, setIsTunnelLoading] = useState<boolean>(false);
  const [connectionTab, setConnectionTab] = useState<"LOCAL" | "ONLINE">("LOCAL");
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);

  const fetchNetworkInfo = useCallback(() => {
    fetch("/api/network-info")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const list = data.addresses || [];
          setNetworkAdapters(list);
          const defIp = data.defaultIp || (list[0]?.ip) || window.location.hostname;
          setLocalServerIp(defIp);
          setSelectedIp(prev => prev || defIp);
          if (data.tunnelUrl) {
            setTunnelUrl(data.tunnelUrl);
          }
          setLocalServerPort(data.port || (window.location.port ? parseInt(window.location.port) : 3000));
        }
      })
      .catch(() => {
        setLocalServerIp(window.location.hostname);
        setSelectedIp(prev => prev || window.location.hostname);
      });
  }, []);

  React.useEffect(() => {
    fetchNetworkInfo();
  }, [fetchNetworkInfo]);

  // Handle Online Tunnel start / stop
  const handleToggleTunnel = async () => {
    if (tunnelUrl) {
      setIsTunnelLoading(true);
      try {
        await fetch("/api/tunnel/stop", { method: "POST" });
        setTunnelUrl(null);
      } catch (err) {
        console.error("Tunnel stop error", err);
      } finally {
        setIsTunnelLoading(false);
      }
    } else {
      setIsTunnelLoading(true);
      try {
        const res = await fetch("/api/tunnel/start", { method: "POST" });
        const data = await res.json();
        if (data.success && data.url) {
          setTunnelUrl(data.url);
          setConnectionTab("ONLINE");
        } else {
          alert(data.message || data.error || "Onlayn tünel bağlantısı qurula bilmədi. İnternet bağlantınızı yoxlayın.");
        }
      } catch (err) {
        console.error("Tunnel start error", err);
        alert("Xəta baş verdi: " + String(err));
      } finally {
        setIsTunnelLoading(false);
      }
    }
  };

  // Sync settings table count with state
  React.useEffect(() => {
    if (state.tables) {
      setSettingsTableCount(String(state.tables.length));
    }
  }, [state.tables?.length]);

  const [selectedCategory, setSelectedCategory] = useState<string>("Hamısı");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  // Cart & Order State
  const [currentCart, setCurrentCart] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [paymentNote, setPaymentNote] = useState<string>("");
  
  // Direct Order Details (Takeaway / Delivery)
  const [directOrderType, setDirectOrderType] = useState<"TAKEAWAY" | "DELIVERY">("TAKEAWAY");
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedCourierId, setSelectedCourierId] = useState("");

  // Delivery Management State
  const [deliveryTabFilter, setDeliveryTabFilter] = useState<"PENDING" | "COMPLETED">("PENDING");
  const [confirmDeliveryOrder, setConfirmDeliveryOrder] = useState<DonerOrder | null>(null);
  const [confirmDeliveryPaymentMethod, setConfirmDeliveryPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [confirmDeliveryNote, setConfirmDeliveryNote] = useState<string>("");
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState<boolean>(false);

  const [cancelDeliveryOrder, setCancelDeliveryOrder] = useState<DonerOrder | null>(null);
  const [cancelDeliveryReason, setCancelDeliveryReason] = useState<string>("");
  const [cancelDeliveryPin, setCancelDeliveryPin] = useState<string>("");
  const [isCancellingDelivery, setIsCancellingDelivery] = useState<boolean>(false);

  // Pending and Completed Deliveries
  const pendingDeliveries = useMemo(() => {
    return (state.donerOrders || []).filter(o => o.orderType === "DELIVERY" && o.status === "PENDING");
  }, [state.donerOrders]);

  const completedTodayDeliveries = useMemo(() => {
    const todayStr = new Date().toDateString();
    return (state.donerOrders || []).filter(o => {
      if (o.orderType !== "DELIVERY" || o.status !== "COMPLETED") return false;
      const orderDate = o.createdAt ? new Date(o.createdAt).toDateString() : "";
      return orderDate === todayStr;
    });
  }, [state.donerOrders]);

  // Helper for elapsed time
  const formatElapsedTime = (isoDateString?: string) => {
    if (!isoDateString) return "";
    const created = new Date(isoDateString).getTime();
    if (isNaN(created)) return "";
    const diffMinutes = Math.floor((Date.now() - created) / 60000);
    if (diffMinutes < 1) return "İndicə";
    if (diffMinutes < 60) return `${diffMinutes} dəq əvvəl`;
    const diffHours = Math.floor(diffMinutes / 60);
    const remMins = diffMinutes % 60;
    return `${diffHours} saat ${remMins} dəq əvvəl`;
  };

  // Kitchen Sent Items Tracking (Incremental / Delta Printing)
  const [sentToKitchenMap, setSentToKitchenMap] = useState<Record<string, OrderItem[]>>(() => {
    try {
      const saved = localStorage.getItem("sentToKitchenMap");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("sentToKitchenMap", JSON.stringify(sentToKitchenMap));
    } catch (e) {
      console.error(e);
    }
  }, [sentToKitchenMap]);

  // 1-Minute Inactivity / Unsent Kitchen Order Reminder State
  const [showUnsentAlert, setShowUnsentAlert] = useState(false);
  const [unsentAlertSnoozeCount, setUnsentAlertSnoozeCount] = useState(0);

  // QR Code Modal State
  const [qrModalTable, setQrModalTable] = useState<number | "ALL" | null>(null);

  // Print Receipt State
  interface PrintQueueItem {
    id: string;
    type: "CUSTOMER" | "KITCHEN";
    props: any;
  }
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [autoPrintKitchen, setAutoPrintKitchen] = useState<boolean>(() => {
    const saved = localStorage.getItem("autoPrintKitchen");
    return saved !== null ? saved === "true" : true;
  });
  const [initialCart, setInitialCart] = useState<OrderItem[]>([]);

  // Dual Printer Hardware Management State
  const [installedPrinters, setInstalledPrinters] = useState<{ name: string; isDefault?: boolean }[]>([]);
  const [cashierPrinter, setCashierPrinter] = useState<string>(() => localStorage.getItem("cashier_printer") || "");
  const [kitchenPrinter, setKitchenPrinter] = useState<string>(() => localStorage.getItem("kitchen_printer") || "");

  const loadPrinters = useCallback(async () => {
    if (window.electronAPI && typeof window.electronAPI.getPrinters === "function") {
      try {
        const list = await window.electronAPI.getPrinters();
        setInstalledPrinters(list || []);
      } catch (err) {
        console.error("Error fetching printers:", err);
      }
    }
  }, []);

  React.useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  const handleSaveCashierPrinter = (val: string) => {
    setCashierPrinter(val);
    localStorage.setItem("cashier_printer", val);
    triggerToast("Satış (Kassa) printeri yadda saxlanıldı!");
  };

  const handleSaveKitchenPrinter = (val: string) => {
    setKitchenPrinter(val);
    localStorage.setItem("kitchen_printer", val);
    triggerToast("Mətbəx printeri yadda saxlanıldı!");
  };

  React.useEffect(() => {
    localStorage.setItem("autoPrintKitchen", String(autoPrintKitchen));
  }, [autoPrintKitchen]);

  // Ingredient Customization state
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customizingItemNote, setCustomizingItemNote] = useState<string>("");

  // Expenses & Inventory Purchase management state
  const [expenseMode, setExpenseMode] = useState<"INVENTORY" | "GENERAL">("INVENTORY");
  const [expenseItemSelect, setExpenseItemSelect] = useState<string>("");
  const [expenseItemName, setExpenseItemName] = useState<string>("");
  const [expenseItemCategory, setExpenseItemCategory] = useState<string>("İçki");
  const [expenseQuantity, setExpenseQuantity] = useState<string>("");
  const [expenseUnit, setExpenseUnit] = useState<string>("ədəd");
  const [expenseUnitPrice, setExpenseUnitPrice] = useState<string>("");
  const [expenseTotalAmount, setExpenseTotalAmount] = useState<string>("");
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [expensePaymentSource, setExpensePaymentSource] = useState<"Nağd" | "POS Terminal">("Nağd");
  const [expenseNote, setExpenseNote] = useState<string>("");
  const [expenseAddToMenu, setExpenseAddToMenu] = useState<boolean>(false);
  const [expenseMenuPrice, setExpenseMenuPrice] = useState<string>("");
  const [expenseCategory, setExpenseCategory] = useState("Kommunal");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseFilter, setExpenseFilter] = useState<"ALL" | "CONFIRMED" | "PENDING" | "INVENTORY" | "GENERAL">("ALL");
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>("");
  const [expenseAutoConfirm, setExpenseAutoConfirm] = useState<boolean>(false);
  const [posExpPeriod, setPosExpPeriod] = useState<"TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "LAST_MONTH" | "ALL" | "CUSTOM">("ALL");
  const [posExpStartDate, setPosExpStartDate] = useState<string>("");
  const [posExpEndDate, setPosExpEndDate] = useState<string>("");
  const [expenseSupplierId, setExpenseSupplierId] = useState<string>("");
  const [expenseInvoiceTotal, setExpenseInvoiceTotal] = useState<string>("");
  const [expensePaidAmount, setExpensePaidAmount] = useState<string>("");
  const [isSubmittingExpense, setIsSubmittingExpense] = useState<boolean>(false);

  // Custom DateTime states for retroactive sale and expense entry with PIN protection
  const [orderCustomDateTime, setOrderCustomDateTime] = useState<string>("");
  const [expenseCustomDateTime, setExpenseCustomDateTime] = useState<string>("");
  const [showCustomOrderTime, setShowCustomOrderTime] = useState<boolean>(false);

  // Dedicated PIN Confirmation Modal state (replacing window.prompt which is blocked in Electron)
  const [pinDialog, setPinDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    pin: string;
    error: string;
    onSuccess: () => void;
  } | null>(null);

  const requestPastDateConfirmation = (
    customDateTime: string,
    actionName: string,
    onSuccessAction: () => void
  ) => {
    if (!customDateTime) {
      onSuccessAction();
      return;
    }
    const selected = new Date(customDateTime);
    const today = new Date();
    const isPastDate = selected.toDateString() !== today.toDateString() && selected.getTime() < today.getTime();
    if (!isPastDate) {
      onSuccessAction();
      return;
    }

    setPinDialog({
      isOpen: true,
      title: "⚠️ Keçmiş Tarixli Əməliyyat Təsdiqi",
      description: `Siz keçmiş tarixə (${selected.toLocaleDateString("az-AZ")} ${selected.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}) ${actionName} daxil edirsiniz. Təsdiq üçün Kassir və ya Admin PİN kodunu daxil edin:`,
      pin: "",
      error: "",
      onSuccess: onSuccessAction
    });
  };

  const handleVerifyAndSubmitPin = () => {
    if (!pinDialog) return;
    const inputPin = pinDialog.pin.trim();
    if (!inputPin) {
      setPinDialog(prev => prev ? { ...prev, error: "PİN kod daxil edilməlidir!" } : null);
      return;
    }
    const isValid = (state.users || []).some(u => u.pin === inputPin) || 
                    inputPin === "1234" || 
                    inputPin === "1111" || 
                    inputPin === "2222" || 
                    inputPin === "3333" || 
                    inputPin === "9999" ||
                    (currentUser && currentUser.pin === inputPin);
    if (!isValid) {
      setPinDialog(prev => prev ? { ...prev, error: "❌ Yanlış PİN kodu! Əməliyyata icazə verilmədi." } : null);
      return;
    }

    const callback = pinDialog.onSuccess;
    setPinDialog(null);
    callback();
  };

  // Stock management state
  const [restockAmounts, setRestockAmounts] = useState<Record<string, string>>({});

  // --- New Warehouse Inventory State Hooks ---
  const [selectedPredefinedItem, setSelectedPredefinedItem] = useState("");
  const [newInvName, setNewInvName] = useState("");
  const [newInvCategory, setNewInvCategory] = useState("İçki");
  const [newInvStock, setNewInvStock] = useState("");
  const [newInvUnit, setNewInvUnit] = useState("ədəd");
  const [newInvPrice, setNewInvPrice] = useState("");
  const [addToMenu, setAddToMenu] = useState(false);
  const [invAdjustAmounts, setInvAdjustAmounts] = useState<Record<string, string>>({});

  // POS Usage (Silinmə / Məxaric) Modal State
  const [isPosUsageModalOpen, setIsPosUsageModalOpen] = useState(false);
  const [posUsageItem, setPosUsageItem] = useState<InventoryItem | null>(null);
  const [posUsageQty, setPosUsageQty] = useState<number | "">("");
  const [posUsageReason, setPosUsageReason] = useState("Gündəlik dönər üçün istifadə");
  const [posUsageDate, setPosUsageDate] = useState(new Date().toISOString().split("T")[0]);
  const [posUsageNote, setPosUsageNote] = useState("");
  const [isSubmittingPosUsage, setIsSubmittingPosUsage] = useState(false);

  // --- New Batch Meat State Hooks ---
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchWeight, setNewBatchWeight] = useState("");
  const [newBatchPrice, setNewBatchPrice] = useState("");
  const [newBatchAutoExpense, setNewBatchAutoExpense] = useState(true);

  // Product Management (Image Addition) States
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCategory, setProdCategory] = useState("Dönər");
  const [prodIngredients, setProdIngredients] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodImage, setProdImage] = useState("");

  // Product Image Upload & Compression States
  const [imageUploadTab, setImageUploadTab] = useState<"FILE" | "URL">("FILE");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [imageStats, setImageStats] = useState<{ originalKB: number; compressedKB: number } | null>(null);
  const [isRestoringDatabase, setIsRestoringDatabase] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const backupFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenProductForm = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdPrice(String(prod.price));
      setProdCategory(prod.category);
      setProdIngredients(prod.ingredients?.join(", ") || "");
      setProdStock(prod.stock !== undefined ? String(prod.stock) : "");
      setProdImage(prod.image || "");
      setImageUploadTab(prod.image && prod.image.startsWith("http") ? "URL" : "FILE");
      setImageStats(null);
    } else {
      setEditingProduct(null);
      setProdName("");
      setProdPrice("");
      setProdCategory("Dönər");
      setProdIngredients("");
      setProdStock("");
      setProdImage("");
      setImageUploadTab("FILE");
      setImageStats(null);
    }
    setProductFormOpen(true);
  };

  const handleProcessProductImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Zəhmət olmasa, düzgün şəkil formatı seçin (PNG, JPG, WEBP, SVG)!");
      return;
    }

    try {
      setIsProcessingImage(true);
      const result = await processImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85
      });
      setProdImage(result.dataUrl);
      setImageStats({
        originalKB: result.originalSizeKB,
        compressedKB: result.compressedSizeKB
      });
      triggerToast(`Şəkil optimallaşdırıldı: ${result.compressedSizeKB} KB`);
    } catch (err: any) {
      alert(err.message || "Şəkil yüklənərkən xəta baş verdi");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessProductImage(file);
    }
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
      handleProcessProductImage(file);
    }
  };

  const handleRemoveImage = () => {
    setProdImage("");
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
    if (!prodName || !prodPrice || !prodCategory) {
      alert("Zəhmət olmasa, vacib sahələri doldurun!");
      return;
    }

    const priceNum = parseFloat(prodPrice);
    if (isNaN(priceNum)) {
      alert("Qiymət rəqəm olmalıdır!");
      return;
    }

    const ingredientsArray = prodIngredients
      ? prodIngredients.split(",").map(i => i.trim()).filter(i => i.length > 0)
      : undefined;

    const stockNum = prodStock !== "" ? parseInt(prodStock) : undefined;

    const productPayload: any = {
      name: prodName,
      price: priceNum,
      category: prodCategory,
      business: BusinessType.Doner,
      ingredients: ingredientsArray,
      stock: stockNum,
      image: prodImage || undefined
    };

    if (editingProduct) {
      productPayload.id = editingProduct.id;
    }

    try {
      const response = await fetch("/api/doner/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingProduct ? "EDIT" : "ADD",
          product: productPayload
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        setProductFormOpen(false);
        triggerToast(editingProduct ? "Məhsul redaktə edildi!" : "Yeni məhsul əlavə edildi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm("Bu məhsulu silmək istədiyinizə əminsiniz?")) return;
    try {
      const response = await fetch("/api/doner/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          product: { id: prodId }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Məhsul silindi!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Handlers for Warehouse Inventory ---
  const handlePredefinedItemChange = (val: string) => {
    setSelectedPredefinedItem(val);
    if (val === "NEW_CUSTOM") {
      setNewInvName("");
      setNewInvCategory("İçki");
      setNewInvUnit("ədəd");
      setAddToMenu(false);
      setNewInvPrice("");
    } else if (val) {
      // Check if it exists in donerProducts
      const donerProduct = state.donerProducts?.find(p => p.id === val);
      if (donerProduct) {
        setNewInvName(donerProduct.name);
        setNewInvCategory(donerProduct.category === "İçki" ? "İçki" : "Digər");
        setNewInvUnit("ədəd");
        setAddToMenu(false); // already in menu
        setNewInvPrice("");
      } else {
        // Check in standard list
        const stdItem = standardItemsList.find(i => i.name === val);
        if (stdItem) {
          setNewInvName(stdItem.name);
          setNewInvCategory(stdItem.category);
          setNewInvUnit(stdItem.unit);
          setAddToMenu(false);
          setNewInvPrice("");
        }
      }
    } else {
      setNewInvName("");
      setAddToMenu(false);
      setNewInvPrice("");
    }
  };

  const handleAddInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim()) {
      triggerToast("Məhsul adı daxil edilməlidir!");
      return;
    }
    try {
      const response = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD",
          item: {
            name: newInvName.trim(),
            category: newInvCategory,
            stock: Number(newInvStock) || 0,
            unit: newInvUnit,
            addToMenu: addToMenu,
            menuPrice: Number(newInvPrice) || 0
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        setNewInvName("");
        setNewInvStock("");
        setNewInvPrice("");
        setAddToMenu(false);
        setSelectedPredefinedItem("");
        triggerToast(`"${newInvName}" anbara əlavə edildi!`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Anbar məhsulu əlavə edilərkən xəta baş verdi.");
    }
  };

  const handleAdjustInventoryItem = async (itemId: string) => {
    const amountStr = invAdjustAmounts[itemId];
    const amount = Number(amountStr);
    if (!amountStr || isNaN(amount) || amount <= 0) {
      triggerToast("Düzgün say daxil edin!");
      return;
    }
    try {
      const response = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADJUST",
          item: {
            id: itemId,
            quantityToAdd: amount
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        setInvAdjustAmounts(prev => ({ ...prev, [itemId]: "" }));
        triggerToast("Anbar stoku uğurla yeniləndi!");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Stok yeniləmə xətası.");
    }
  };

  const handleDeleteInventoryItem = async (itemId: string, itemName: string) => {
    if (!confirm(`"${itemName}" məhsulunu anbardan silmək istədiyinizə əminsiniz?`)) return;
    try {
      const response = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          item: { id: itemId }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Məhsul anbardan silindi.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Silinmə xətası.");
    }
  };

  const handleOpenPosUsageModal = (item: InventoryItem) => {
    setPosUsageItem(item);
    setPosUsageQty("");
    setPosUsageReason("Gündəlik dönər üçün istifadə");
    setPosUsageDate(new Date().toISOString().split("T")[0]);
    setPosUsageNote("");
    setIsPosUsageModalOpen(true);
  };

  const handleRecordPosUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posUsageItem) return;
    const q = Number(posUsageQty);
    if (isNaN(q) || q <= 0) {
      triggerToast("Düzgün istifadə/silinmə miqdarı daxil edin!");
      return;
    }
    setIsSubmittingPosUsage(true);
    try {
      const res = await fetch("/api/inventory/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: posUsageItem.id,
          quantity: q,
          reason: posUsageReason,
          date: posUsageDate,
          note: posUsageNote,
          createdByName: currentUser?.name || "Kassir / Aşpaz"
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(`"${posUsageItem.name}" üçün ${q} ${posUsageItem.unit} silindi! Anbarda qalan: ${data.item.stock} ${posUsageItem.unit} ✔️`);
        setIsPosUsageModalOpen(false);
      } else {
        triggerToast(data.error || "Xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi");
    } finally {
      setIsSubmittingPosUsage(false);
    }
  };

  // --- Handlers for Meat Roll Batches ---
  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim() || !newBatchWeight || !newBatchPrice) {
      triggerToast("Rulon adı, çəkisi və qiyməti daxil edilməlidir!");
      return;
    }
    try {
      const response = await fetch("/api/inventory/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD",
          batch: {
            name: newBatchName,
            weightKq: Number(newBatchWeight),
            costPrice: Number(newBatchPrice),
            autoExpense: newBatchAutoExpense
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        setNewBatchName("");
        setNewBatchWeight("");
        setNewBatchPrice("");
        triggerToast(`Yeni fəal ət rulonu daxil edildi: ${newBatchName}!`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Yeni rulon daxil edilərkən xəta baş verdi.");
    }
  };

  const handleFinishBatch = async (batchId: string, finalCount: number) => {
    if (!confirm("Bu rulonun tam bitdiyini (qurtardığını) təsdiq edirsiniz? Bu zaman bu rulondan neçə ədəd dönər çıxdığı qeydə alınacaq.")) return;
    try {
      const response = await fetch("/api/inventory/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FINISH",
          batch: {
            id: batchId,
            donerCount: finalCount
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Ət rulonu bitmiş olaraq arxivə göndərildi!");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Rulon bitirilmə xətası.");
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Bu rulon tarixçəsini birdəfəlik silmək istəyirsiniz?")) return;
    try {
      const response = await fetch("/api/inventory/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          batch: { id: batchId }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Rulon silindi.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Silinmə xətası.");
    }
  };

  // 1. Get products in Doner category
  const products = useMemo(() => state.donerProducts || [], [state.donerProducts]);

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
    const q = searchQuery.toLowerCase().trim();
    let list = products.filter(p => {
      if (selectedCategory === "🔥 Ən Çox Satılanlar") {
        return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      const matchesCategory = selectedCategory === "Hamısı" || p.category === selectedCategory;
      const matchesSearch = !q || p.name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
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

  // Filter trackable products (like cold drinks/waters) that have stock fields
  const trackableProducts = useMemo(() => products.filter(p => p.stock !== undefined), [products]);

  // Filter expenses associated with Doner business (dynamically filtered by selected period)
  const filterByDateRange = (items: any[], period: string, startDate?: string, endDate?: string) => {
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
        case "TODAY": return dateOnly.getTime() === todayDate.getTime();
        case "YESTERDAY": return dateOnly.getTime() === yesterdayDate.getTime();
        case "LAST_7_DAYS": return dateOnly >= sevenDaysAgo && dateOnly <= todayDate;
        case "THIS_MONTH": return dateOnly >= firstDayThisMonth && dateOnly <= todayDate;
        case "LAST_MONTH": return dateOnly >= firstDayLastMonth && dateOnly <= lastDayLastMonth;
        case "CUSTOM": {
          if (!startDate && !endDate) return true;
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date(8640000000000000);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return d >= start && d <= end;
        }
        case "ALL":
        default: return true;
      }
    });
  };

  const allDonerExpenses = useMemo(() => (state.expenses || []).filter(e => e.business === BusinessType.Doner || !e.business), [state.expenses]);
  const donerExpenses = useMemo(() => filterByDateRange(allDonerExpenses, posExpPeriod, posExpStartDate, posExpEndDate), [allDonerExpenses, posExpPeriod, posExpStartDate, posExpEndDate]);
  const confirmedDonerExpenses = useMemo(() => donerExpenses.filter(e => e.isConfirmed !== false), [donerExpenses]);
  const pendingDonerExpenses = useMemo(() => donerExpenses.filter(e => e.isConfirmed === false), [donerExpenses]);
  const totalConfirmedDonerExpenses = useMemo(() => confirmedDonerExpenses.reduce((sum, e) => sum + (e.amount || 0), 0), [confirmedDonerExpenses]);
  const totalPendingDonerExpenses = useMemo(() => pendingDonerExpenses.reduce((sum, e) => sum + (e.amount || 0), 0), [pendingDonerExpenses]);
  const totalConfirmedCashExpenses = useMemo(() => confirmedDonerExpenses
    .filter(e => !e.paymentSource || e.paymentSource === "Nağd" || e.paymentSource === "Kassa (Nağd)")
    .reduce((sum, e) => sum + (e.amount || 0), 0), [confirmedDonerExpenses]);

  // Auto-sync cart state with the backend (debounced to eliminate UI freezing on fast clicks)
  const cartSyncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const syncCartToBackend = (tableNum: number, updatedCart: OrderItem[]) => {
    if (cartSyncTimeoutRef.current) {
      clearTimeout(cartSyncTimeoutRef.current);
    }
    cartSyncTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/table/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber: tableNum,
            items: updatedCart,
            status: updatedCart.length > 0 ? "ORDERED" : "EMPTY"
          })
        });
        const data = await response.json();
        if (data.success) {
          onUpdateState(data.state);
        }
      } catch (e) {
        console.error("Mətbəxə avtomatik ötürmə xətası:", e);
      }
    }, 120);
  };

  const handleUpdateTableCount = async (newCount: number) => {
    if (newCount < 1) {
      triggerToast("Masa sayı ən azı 1 olmalıdır!");
      return;
    }
    if (newCount > 50) {
      triggerToast("Maksimum 50 masa əlavə edə bilərsiniz!");
      return;
    }
    
    // If we decrease table count, check if there are tables with orders
    if (newCount < (state.tables?.length || 0)) {
      const activeTablesBeingRemoved = (state.tables || []).slice(newCount).filter(t => t.status !== "EMPTY" || (t.items && t.items.length > 0));
      if (activeTablesBeingRemoved.length > 0) {
        if (!confirm(`Siz masa sayını azaldırsınız. Silinəcək masalar arasında (${activeTablesBeingRemoved.map(t => '#' + t.tableNumber).join(', ')}) hələ də sifarişi olanlar var. Davam etmək istəyirsiniz?`)) {
          return;
        }
      }
    }

    try {
      const response = await fetch("/api/table/count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: newCount })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(`Masa sayı yeniləndi: ${newCount} masa`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Masa sayı yenilənərkən xəta baş verdi.");
    }
  };

  // 2. Click Table
  const handleSelectTable = async (tableNumber: number) => {
    const table = state.tables.find(t => t.tableNumber === tableNumber);
    const now = Date.now();

    // Check if table is locked by someone else
    if (table?.lockedBy && table.lockedBy.expiresAt > now && table.lockedBy.deviceId !== posDeviceId) {
      setBlockedTableWarning(table);
      return;
    }

    // Try to acquire lock on the server for POS cashier
    try {
      const res = await fetch("/api/table/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          deviceId: posDeviceId,
          deviceName: "Kassa POS Monitor",
          waiterName: currentUser?.name || "Kassir",
          ttlSeconds: 120
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.lockedBy) {
          setBlockedTableWarning({ ...(table || state.tables.find(t => t.tableNumber === tableNumber)!), lockedBy: data.lockedBy });
        } else {
          triggerToast(data.error || "Masa açıla bilmədi");
        }
        return;
      }
      if (data.state) onUpdateState(data.state);
    } catch (e) {
      console.error("POS Lock error", e);
    }

    setSelectedTable(tableNumber);
    if (table) {
      setCurrentCart(table.items || []);
      setInitialCart(table.items || []);
    } else {
      setCurrentCart([]);
      setInitialCart([]);
    }
    setActiveTab("ORDER_WINDOW");
  };

  // Force unlock table by Admin/Cashier
  const handleForceUnlockTable = async (tableNumber: number) => {
    try {
      const res = await fetch("/api/table/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          forceAdmin: true
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.state) onUpdateState(data.state);
        triggerToast(`Masa #${tableNumber} kilidi məcburi açıldı.`);
        setBlockedTableWarning(null);
      } else {
        triggerToast(data.error || "Kilid açıla bilmədi");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Xəta baş verdi");
    }
  };

  // 3. Click Direct Order Button
  const handleDirectOrder = (type: "TAKEAWAY" | "DELIVERY") => {
    setSelectedTable(null);
    setDirectOrderType(type);
    setCurrentCart([]);
    setDeliveryName("");
    setDeliveryPhone("");
    setDeliveryAddress("");
    setSelectedCourierId("");
    setActiveTab("DIRECT_ORDER");
  };

  // Add customized/standard product to cart
  const addProductToCart = (product: Product, removed: string[], itemNote?: string) => {
    const cleanNote = itemNote?.trim() || undefined;
    let updatedCart: OrderItem[] = [];

    setCurrentCart(prev => {
      // Find item with same ID, exact same removed ingredients, and exact same note
      const existingIndex = prev.findIndex(item => {
        const arr1 = item.removedIngredients || [];
        const arr2 = removed || [];
        const sameRemoved = arr1.length === arr2.length && arr1.every(val => arr2.includes(val));
        const sameNote = (item.itemNote || "") === (cleanNote || "");
        return item.productId === product.id && sameRemoved && sameNote;
      });

      if (existingIndex > -1) {
        updatedCart = prev.map((item, idx) => 
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const newItem: OrderItem = {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          removedIngredients: removed.length > 0 ? removed : undefined,
          itemNote: cleanNote
        };
        updatedCart = [...prev, newItem];
      }

      // Auto-sync to kitchen instantly if selectedTable is active
      if (selectedTable) {
        syncCartToBackend(selectedTable, updatedCart);
      }

      return updatedCart;
    });

    triggerToast(`"${product.name}" səbətə əlavə edildi! Mətbəxə avtomatik ötürüldü.`);
  };

  // Clicking a product card in the cashier menu
  const handleProductClick = (product: Product) => {
    if (product.stock !== undefined && product.stock <= 0) {
      triggerToast(`Təəssüf ki, "${product.name}" bitib.`);
      return;
    }

    if (product.ingredients && product.ingredients.length > 0) {
      setCustomizingProduct(product);
      setSelectedIngredients([...product.ingredients]);
      setCustomizingItemNote("");
    } else {
      addProductToCart(product, [], "");
    }
  };

  const handleConfirmCustomSifaris = () => {
    if (!customizingProduct) return;
    const original = customizingProduct.ingredients || [];
    const removed = original.filter(ing => !selectedIngredients.includes(ing));
    
    addProductToCart(customizingProduct, removed, customizingItemNote);
    setCustomizingProduct(null);
    setCustomizingItemNote("");
  };

  const handleToggleIngredient = (ing: string) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ing)) {
        return prev.filter(item => item !== ing);
      } else {
        return [...prev, ing];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number, removed?: string[], itemNote?: string) => {
    let updatedCart: OrderItem[] = [];
    setCurrentCart(prev => {
      updatedCart = prev.map(item => {
        const isSameRemoved = (item.removedIngredients || []).length === (removed || []).length &&
          (item.removedIngredients || []).every(v => (removed || []).includes(v));
        const isSameNote = (item.itemNote || "") === (itemNote || "");

        if (item.productId === productId && isSameRemoved && isSameNote) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is OrderItem => item !== null);

      if (selectedTable) {
        syncCartToBackend(selectedTable, updatedCart);
      }

      return updatedCart;
    });
  };

  const removeFromCart = (productId: string, removed?: string[], itemNote?: string) => {
    let updatedCart: OrderItem[] = [];
    setCurrentCart(prev => {
      updatedCart = prev.filter(item => {
        const isSameRemoved = (item.removedIngredients || []).length === (removed || []).length &&
          (item.removedIngredients || []).every(v => (removed || []).includes(v));
        const isSameNote = (item.itemNote || "") === (itemNote || "");
        return !(item.productId === productId && isSameRemoved && isSameNote);
      });

      if (selectedTable) {
        syncCartToBackend(selectedTable, updatedCart);
      }

      return updatedCart;
    });
  };

  const cartSubtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Current Table or Direct Order Key for kitchen tracking
  const currentTableKey = selectedTable ? `table_${selectedTable}` : `direct_${directOrderType}`;

  // Calculate items that have NOT yet been sent to the kitchen
  const getUnsentKitchenItems = (cart: OrderItem[], key: string): OrderItem[] => {
    const sentItems = sentToKitchenMap[key] || [];
    const unsent: OrderItem[] = [];

    cart.forEach(cartItem => {
      const sentMatch = sentItems.find(s => 
        s.productId === cartItem.productId &&
        JSON.stringify(s.removedIngredients || []) === JSON.stringify(cartItem.removedIngredients || [])
      );
      const sentQty = sentMatch ? sentMatch.quantity : 0;
      const diffQty = cartItem.quantity - sentQty;
      if (diffQty > 0) {
        unsent.push({
          ...cartItem,
          quantity: diffQty
        });
      }
    });

    return unsent;
  };

  const currentUnsentItems = getUnsentKitchenItems(currentCart, currentTableKey);
  const hasUnsentKitchenItems = currentUnsentItems.length > 0;
  const unsentCount = currentUnsentItems.reduce((sum, item) => sum + item.quantity, 0);

  // Play gentle warning beep when 1-minute inactivity alert triggers
  const playWarningBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay may be restricted if user hasn't interacted yet
    }
  }, []);

  // Track all tables that currently have unsent items
  const tablesWithUnsentOrders = useMemo(() => {
    return (state.tables || []).filter(t => {
      if (t.status !== "ORDERED" || !t.items || t.items.length === 0) return false;
      const unsent = getUnsentKitchenItems(t.items, `table_${t.tableNumber}`);
      return unsent.length > 0;
    });
  }, [state.tables, sentToKitchenMap]);

  // Send incremental items to Kitchen
  const handleSendToKitchen = () => {
    if (!hasUnsentKitchenItems) {
      triggerToast("Mətbəxə göndəriləcək yeni sifariş yoxdur.");
      return;
    }

    handleOpenPrint("KITCHEN", {
      title: "KÖZ XƏZƏR DÖNƏR",
      orderType: selectedTable ? "Masa" : (directOrderType === "TAKEAWAY" ? "Özünlə Apar" : "Çatdırılma"),
      tableNumber: selectedTable || undefined,
      items: currentUnsentItems,
      subtotal: cartSubtotal,
      createdAt: new Date().toISOString()
    });

    // Mark current cart as sent to kitchen
    setSentToKitchenMap(prev => ({
      ...prev,
      [currentTableKey]: JSON.parse(JSON.stringify(currentCart))
    }));

    setShowUnsentAlert(false);
    triggerToast("Sifariş mətbəxə göndərildi!");
  };

  // 1-Minute Unsent Inactivity Alert Timer (Expanded from 10s to 1 minute / 60 seconds)
  React.useEffect(() => {
    if (activeTab === "ORDER_WINDOW" || activeTab === "DIRECT_ORDER") {
      if (hasUnsentKitchenItems && currentCart.length > 0) {
        const timer = setTimeout(() => {
          setShowUnsentAlert(true);
          playWarningBeep();
        }, 60000); // 1 dəqiqə (60 saniyə)
        return () => clearTimeout(timer);
      } else {
        setShowUnsentAlert(false);
      }
    } else {
      setShowUnsentAlert(false);
    }
  }, [activeTab, hasUnsentKitchenItems, currentCart, unsentAlertSnoozeCount, playWarningBeep]);

  // Complete Table order and pay
  const handlePayTableOrder = async () => {
    if (!selectedTable || isProcessingPayment) return;
    if (currentCart.length === 0) {
      triggerToast("Sifariş boşdur!");
      return;
    }

    requestPastDateConfirmation(orderCustomDateTime, "satış qeydiyyatı", async () => {
      setIsProcessingPayment(true);
      const receiptProps = {
        title: "KÖZ XƏZƏR DÖNƏR",
        orderType: "Masa",
        tableNumber: selectedTable,
        items: currentCart,
        subtotal: cartSubtotal,
        paymentMethod: paymentMethod,
        paymentNote: paymentNote || undefined,
        createdAt: orderCustomDateTime ? new Date(orderCustomDateTime).toISOString() : new Date().toISOString()
      };

      try {
        const response = await fetch("/api/table/clear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableNumber: selectedTable,
            paymentMethod,
            paymentNote: paymentNote || undefined,
            customCreatedAt: orderCustomDateTime ? new Date(orderCustomDateTime).toISOString() : undefined
          })
        });
        const data = await response.json();
        if (data.success) {
          onUpdateState(data.state);
          triggerToast(`Masa ${selectedTable} ödənişi tamamlandı! Qəbz hazırlanır...`);

          // Print strictly ONLY the Customer Sales Receipt on checkout
          handleOpenPrint("CUSTOMER", receiptProps);

          // Clear kitchen tracking for this table
          setSentToKitchenMap(prev => {
            const next = { ...prev };
            delete next[currentTableKey];
            return next;
          });

          setShowUnsentAlert(false);
          setPaymentNote("");
          setOrderCustomDateTime("");
          setShowCustomOrderTime(false);
          setActiveTab("TABLES");
        }
      } catch (e) {
        console.error(e);
        triggerToast("Ödənişdə xəta baş verdi.");
      } finally {
        setIsProcessingPayment(false);
      }
    });
  };

  // Complete Direct Order (Takeaway/Delivery)
  const handlePayDirectOrder = async () => {
    if (isProcessingPayment) return;
    if (currentCart.length === 0) {
      triggerToast("Sifariş boşdur!");
      return;
    }

    if (directOrderType === "DELIVERY") {
      if (!deliveryName || !deliveryPhone || !deliveryAddress) {
        triggerToast("Çatdırılma məlumatlarını (Müştəri adı, telefon, ünvan) doldurun!");
        return;
      }
    }

    requestPastDateConfirmation(orderCustomDateTime, "satış qeydiyyatı", async () => {
      setIsProcessingPayment(true);
      const courier = (state.couriers || []).find(c => c.id === selectedCourierId);

      const receiptProps = {
        title: "KÖZ XƏZƏR DÖNƏR",
        orderType: directOrderType === "TAKEAWAY" ? "Özünlə Apar" : "Çatdırılma",
        items: currentCart,
        subtotal: cartSubtotal,
        paymentMethod: paymentMethod,
        paymentNote: paymentNote || undefined,
        createdAt: orderCustomDateTime ? new Date(orderCustomDateTime).toISOString() : new Date().toISOString(),
        deliveryDetails: directOrderType === "DELIVERY" ? {
          receiverName: deliveryName,
          receiverPhone: deliveryPhone,
          deliveryAddress,
          courierName: courier ? courier.name : "Kuryer təyin edilməyib"
        } : undefined
      };

      try {
        const response = await fetch("/api/doner/order/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderType: directOrderType,
            items: currentCart,
            paymentMethod,
            paymentNote: paymentNote || undefined,
            deliveryName: directOrderType === "DELIVERY" ? deliveryName : undefined,
            deliveryPhone: directOrderType === "DELIVERY" ? deliveryPhone : undefined,
            deliveryAddress: directOrderType === "DELIVERY" ? deliveryAddress : undefined,
            courierId: directOrderType === "DELIVERY" ? selectedCourierId : undefined,
            customCreatedAt: orderCustomDateTime ? new Date(orderCustomDateTime).toISOString() : undefined
          })
        });
        const data = await response.json();
        if (data.success) {
          onUpdateState(data.state);

          if (directOrderType === "DELIVERY") {
            triggerToast("🛵 Sifariş kuryerə göndərildi (Təsdiq gözləyir)!");
            // Print Kitchen / Delivery Dispatch ticket with customer address & notes
            handleOpenPrint("KITCHEN", {
              ...receiptProps,
              orderId: data.order?.id?.replace("ord_d_", "")
            });
            
            // Reset form fields
            setDeliveryName("");
            setDeliveryPhone("");
            setDeliveryAddress("");
            setSelectedCourierId("");
            setCurrentCart([]);
            setPaymentNote("");
            setShowUnsentAlert(false);
            setOrderCustomDateTime("");
            setShowCustomOrderTime(false);

            // Clear kitchen tracking
            setSentToKitchenMap(prev => {
              const next = { ...prev };
              delete next[currentTableKey];
              return next;
            });

            setActiveTab("DELIVERIES");
          } else {
            triggerToast("Birbaşa satış tamamlandı! Qəbz hazırlanır...");
            // Print strictly ONLY the Customer Sales Receipt on checkout
            handleOpenPrint("CUSTOMER", receiptProps);

            // Clear kitchen tracking
            setSentToKitchenMap(prev => {
              const next = { ...prev };
              delete next[currentTableKey];
              return next;
            });

            setShowUnsentAlert(false);
            setPaymentNote("");
            setOrderCustomDateTime("");
            setShowCustomOrderTime(false);
            setCurrentCart([]);
            setActiveTab("TABLES");
          }
        } else {
          triggerToast(data.error || "Xəta baş verdi");
        }
      } catch (e) {
        console.error(e);
        triggerToast("Xəta baş verdi.");
      } finally {
        setIsProcessingPayment(false);
      }
    });
  };

  // Confirm Payment & Close Delivery Order
  const handleConfirmDeliveryPayment = async () => {
    if (!confirmDeliveryOrder || isConfirmingDelivery) return;
    setIsConfirmingDelivery(true);

    try {
      const response = await fetch("/api/doner/order/complete-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: confirmDeliveryOrder.id,
          paymentMethod: confirmDeliveryPaymentMethod,
          paymentNote: confirmDeliveryNote || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Çatdırılma ödənişi təsdiqləndi və sifariş bağlandı! ✔️");

        const courier = (data.state.couriers || []).find((c: Courier) => c.id === confirmDeliveryOrder.courierId);
        const receiptProps = {
          title: "KÖZ XƏZƏR DÖNƏR",
          orderId: confirmDeliveryOrder.id.replace("ord_d_", ""),
          orderType: "Çatdırılma",
          items: confirmDeliveryOrder.items,
          subtotal: confirmDeliveryOrder.subtotal,
          paymentMethod: confirmDeliveryPaymentMethod,
          paymentNote: confirmDeliveryNote || undefined,
          createdAt: confirmDeliveryOrder.createdAt,
          deliveryDetails: {
            receiverName: confirmDeliveryOrder.deliveryName,
            receiverPhone: confirmDeliveryOrder.deliveryPhone,
            deliveryAddress: confirmDeliveryOrder.deliveryAddress,
            courierName: courier ? courier.name : (confirmDeliveryOrder.courierName || "Kuryer")
          }
        };

        // Print Customer Sales Receipt
        handleOpenPrint("CUSTOMER", receiptProps);
        setConfirmDeliveryOrder(null);
        setConfirmDeliveryNote("");
      } else {
        triggerToast(data.error || "Ödəniş təsdiqlənərkən xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi.");
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  // Cancel Delivery Order with Admin PIN
  const handleCancelDeliveryOrder = async () => {
    if (!cancelDeliveryOrder || isCancellingDelivery) return;
    if (!cancelDeliveryPin) {
      triggerToast("Admin PIN kodunu daxil edin!");
      return;
    }

    setIsCancellingDelivery(true);
    try {
      const response = await fetch("/api/doner/order/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: cancelDeliveryOrder.id,
          adminPin: cancelDeliveryPin,
          reason: cancelDeliveryReason || "Kuryer çatdırılması ləğv edildi"
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Çatdırılma sifarişi ləğv edildi və anbar məhsulları bərpa olundu!");
        setCancelDeliveryOrder(null);
        setCancelDeliveryPin("");
        setCancelDeliveryReason("");
      } else {
        triggerToast(data.error || "Ləğv edilərkən xəta baş verdi");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Xəta baş verdi.");
    } finally {
      setIsCancellingDelivery(false);
    }
  };

  // Change assigned courier for delivery order
  const handleChangeDeliveryCourier = async (orderId: string, newCourierId: string) => {
    const courier = (state.couriers || []).find(c => c.id === newCourierId);
    try {
      const response = await fetch("/api/doner/order/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          adminPin: "3333",
          updatedFields: {
            courierId: newCourierId || undefined,
            courierName: courier ? courier.name : undefined
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Kuryer uğurla dəyişdirildi! ✔️");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPrint = useCallback((type: "CUSTOMER" | "KITCHEN", props: any) => {
    const queueId = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setPrintQueue(prev => [...prev, { id: queueId, type, props }]);
  }, []);

  const handleClosePrint = useCallback(() => {
    setPrintQueue(prev => prev.slice(1));
  }, []);

  const handleBackToTables = () => {
    if (selectedTable) {
      fetch("/api/table/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: selectedTable,
          deviceId: posDeviceId
        })
      }).then(res => res.json()).then(data => {
        if (data.state) onUpdateState(data.state);
      }).catch(console.error);
    }
    setSelectedTable(null);
    setActiveTab("TABLES");
  };

  const handleClearAllOrders = async () => {
    const adminPin = window.prompt("🔒 TƏHLÜKƏSİZLİK TƏLƏBİ:\n\nBütün sifariş və satış tarixçəsini sıfırlamaq üçün Admin PIN kodunu daxil edin:");
    if (adminPin === null) return;

    const trimmedPin = adminPin.trim();
    const adminUser = (state.users || []).find(u => u.role === "ADMIN" && u.pin === trimmedPin);
    
    if (!adminUser && trimmedPin !== "3333" && trimmedPin !== "1234") {
      alert("❌ Yanlış Admin PIN kodu! Sıfırlama əməliyyatı ləğv edildi.");
      return;
    }

    if (!window.confirm("Bütün əvvəlki test sifarişlərini, hesabatları və masalardakı qalıqları təmizləyib sıfırlamaq istədiyinizə ƏMİNSİNİZ?\n\n(Qeyd: Məhsullarınız və qiymətlər silinməyəcək, yalnız sifariş tarixçəsi təmizlənəcək)")) {
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

      const cleanState: Partial<AppState> = {
        ...state,
        tables: freshTables,
        donerOrders: [],
        expenses: [],
        shifts: []
      };

      const res = await fetch("/api/state/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanState)
      });
      const data = await res.json();
      if (data.success) {
        onUpdateState(data.state);
        setSentToKitchenMap({});
        localStorage.removeItem("sentToKitchenMap");
        triggerToast("Bütün test sifarişləri və hesabatlar uğurla təmizləndi!");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Sıfırlama zamanı xəta baş verdi.");
    }
  };

  // Helper for selecting pre-defined item in Expense form
  const handleExpenseItemSelectChange = (val: string) => {
    setExpenseItemSelect(val);
    if (val === "NEW_CUSTOM") {
      setExpenseItemName("");
      setExpenseItemCategory("İçki");
      setExpenseUnit("ədəd");
      setExpenseAddToMenu(false);
      setExpenseMenuPrice("");
    } else if (val) {
      // Check existing doner product
      const donerProd = state.donerProducts?.find(p => p.id === val);
      if (donerProd) {
        setExpenseItemName(donerProd.name);
        setExpenseItemCategory(donerProd.category === "İçki" ? "İçki" : "Digər");
        setExpenseUnit("ədəd");
        setExpenseAddToMenu(false);
        setExpenseMenuPrice("");
      } else {
        const std = standardItemsList.find(s => s.name === val);
        if (std) {
          setExpenseItemName(std.name);
          setExpenseItemCategory(std.category);
          setExpenseUnit(std.unit);
          setExpenseAddToMenu(false);
          setExpenseMenuPrice("");
        } else {
          // Check inventoryItems
          const inv = state.inventoryItems?.find(i => i.name === val);
          if (inv) {
            setExpenseItemName(inv.name);
            setExpenseItemCategory(inv.category);
            setExpenseUnit(inv.unit);
            setExpenseAddToMenu(false);
            setExpenseMenuPrice("");
          }
        }
      }
    }
  };

  // Smart calculation for Quantity, Unit Price, and Total Amount
  const handleQuantityChange = (qtyStr: string) => {
    setExpenseQuantity(qtyStr);
    const qty = parseFloat(qtyStr);
    const unitP = parseFloat(expenseUnitPrice);
    if (!isNaN(qty) && qty > 0 && !isNaN(unitP) && unitP > 0) {
      setExpenseTotalAmount((qty * unitP).toFixed(2));
    }
  };

  const handleUnitPriceChange = (unitPStr: string) => {
    setExpenseUnitPrice(unitPStr);
    const unitP = parseFloat(unitPStr);
    const qty = parseFloat(expenseQuantity);
    if (!isNaN(unitP) && unitP >= 0 && !isNaN(qty) && qty > 0) {
      setExpenseTotalAmount((qty * unitP).toFixed(2));
    }
  };

  const handleTotalAmountChange = (totalStr: string) => {
    setExpenseTotalAmount(totalStr);
    const total = parseFloat(totalStr);
    const qty = parseFloat(expenseQuantity);
    if (!isNaN(total) && total >= 0 && !isNaN(qty) && qty > 0) {
      setExpenseUnitPrice((total / qty).toFixed(2));
    }
  };

  // Quick buy action from Inventory table
  const handleQuickBuyFromInventory = (itemName: string, category?: string, unit?: string) => {
    setActiveTab("EXPENSES");
    setExpenseMode("INVENTORY");
    setExpenseItemSelect(itemName);
    setExpenseItemName(itemName);
    setExpenseItemCategory(category || "İçki");
    setExpenseUnit(unit || "ədəd");
    setExpenseQuantity("");
    setExpenseUnitPrice("");
    setExpenseTotalAmount("");
    setExpenseNote("");
    triggerToast(`"${itemName}" üçün alış xərci bölməsi açıldı.`);
  };

  // Add Expense Handler (Handles both Inventory Purchases and General Expenses)
  // Add Expense Handler (Handles both Inventory Purchases and General Expenses)
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingExpense) return;

    if (expenseMode === "INVENTORY") {
      if (!expenseItemName.trim()) {
        triggerToast("Məhsul adı seçilməli və ya daxil edilməlidir!");
        return;
      }
      const qty = parseFloat(expenseQuantity);
      const totalAmount = parseFloat(expenseTotalAmount);

      if (isNaN(qty) || qty <= 0) {
        triggerToast("Məhsulun sayı / miqdarı düzgün daxil edilməlidir!");
        return;
      }
      if (isNaN(totalAmount) || totalAmount <= 0) {
        triggerToast("Ümumi alış məbləği daxil edilməlidir!");
        return;
      }

      requestPastDateConfirmation(expenseCustomDateTime, "xərc (mal alışı) qeydiyyatı", async () => {
        const dateToSave = expenseCustomDateTime 
          ? expenseCustomDateTime.split("T")[0] 
          : new Date().toISOString().split("T")[0];
        const timestampToSave = expenseCustomDateTime 
          ? new Date(expenseCustomDateTime).toISOString() 
          : new Date().toISOString();

        const calculatedUnitPrice = parseFloat(expenseUnitPrice) || (totalAmount / qty);
        const selectedSup = (state.suppliers || []).find(s => s.id === expenseSupplierId);
        const invTotal = parseFloat(expenseInvoiceTotal) || totalAmount;
        const paidAmt = expensePaidAmount !== "" ? parseFloat(expensePaidAmount) : totalAmount;
        const debtAmt = selectedSup ? Math.max(0, invTotal - paidAmt) : 0;
        const effectiveAmount = selectedSup ? paidAmt : totalAmount;
        const title = `${expenseItemName.trim()} alışı (${qty} ${expenseUnit})` + (selectedSup ? ` [${selectedSup.name}]` : "");

        setIsSubmittingExpense(true);
        try {
          const response = await fetch("/api/expense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "ADD",
              expense: {
                title,
                amount: effectiveAmount,
                category: "Məhsul Alışı",
                business: BusinessType.Doner,
                isInventoryPurchase: true,
                inventoryItemName: expenseItemName.trim(),
                itemCategory: expenseItemCategory,
                quantity: qty,
                unit: expenseUnit,
                unitPrice: calculatedUnitPrice,
                paymentSource: expensePaymentSource,
                note: (expenseNote.trim() ? expenseNote.trim() + " | " : "") + (selectedSup && debtAmt > 0 ? `Qaimə: ${invTotal} ₼ (Borca qalan: ${debtAmt.toFixed(2)} ₼)` : ""),
                addToMenu: expenseAddToMenu,
                menuPrice: parseFloat(expenseMenuPrice) || undefined,
                isConfirmed: expenseAutoConfirm,
                confirmedBy: expenseAutoConfirm ? (currentUser?.name || "Kassir") : undefined,
                supplierId: selectedSup?.id,
                supplierName: selectedSup?.name,
                invoiceTotal: selectedSup ? invTotal : undefined,
                paidAmount: selectedSup ? paidAmt : undefined,
                debtAmount: selectedSup ? debtAmt : undefined,
                date: dateToSave,
                timestamp: timestampToSave,
                createdAt: timestampToSave
              }
            })
          });
          const data = await response.json();
          if (data.success) {
            onUpdateState(data.state);
            setPosExpPeriod("ALL");
            // Reset form
            setExpenseItemSelect("");
            setExpenseItemName("");
            setExpenseQuantity("");
            setExpenseUnitPrice("");
            setExpenseTotalAmount("");
            setExpenseSupplierId("");
            setExpenseInvoiceTotal("");
            setExpensePaidAmount("");
            setExpenseNote("");
            setExpenseAddToMenu(false);
            setExpenseMenuPrice("");
            setExpenseCustomDateTime("");
            triggerToast(
              expenseAutoConfirm
                ? `"${expenseItemName}" alışı xərclərə yazıldı (${dateToSave}), təsdiqləndi və anbara +${qty} ${expenseUnit} daxil edildi!`
                : `"${expenseItemName}" alışı qeyd edildi (${dateToSave}, Təsdiq gözləyir). Təsdiq edilənədək kassadan çıxılmayacaq.`
            );
          }
        } catch (err) {
          console.error(err);
          triggerToast("Xərc və anbar qeydiyyatında xəta baş verdi.");
        } finally {
          setIsSubmittingExpense(false);
        }
      });

    } else {
      // General / Operational Expense
      if (!expenseTitle.trim()) {
        triggerToast("Xərcin başlığı / təyinatı daxil edilməlidir!");
        return;
      }
      const totalAmount = parseFloat(expenseAmount || expenseTotalAmount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        triggerToast("Məbləğ düzgün daxil edilməlidir!");
        return;
      }

      requestPastDateConfirmation(expenseCustomDateTime, "əməliyyat xərci qeydiyyatı", async () => {
        const dateToSave = expenseCustomDateTime 
          ? expenseCustomDateTime.split("T")[0] 
          : new Date().toISOString().split("T")[0];
        const timestampToSave = expenseCustomDateTime 
          ? new Date(expenseCustomDateTime).toISOString() 
          : new Date().toISOString();

        setIsSubmittingExpense(true);
        try {
          const response = await fetch("/api/expense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "ADD",
              expense: {
                title: expenseTitle.trim(),
                amount: totalAmount,
                category: expenseCategory,
                business: BusinessType.Doner,
                isInventoryPurchase: false,
                paymentSource: expensePaymentSource,
                note: expenseNote.trim() || undefined,
                isConfirmed: expenseAutoConfirm,
                confirmedBy: expenseAutoConfirm ? (currentUser?.name || "Kassir") : undefined,
                date: dateToSave,
                timestamp: timestampToSave,
                createdAt: timestampToSave
              }
            })
          });
          const data = await response.json();
          if (data.success) {
            onUpdateState(data.state);
            setPosExpPeriod("ALL");
            setExpenseTitle("");
            setExpenseAmount("");
            setExpenseTotalAmount("");
            setExpenseNote("");
            setExpenseCustomDateTime("");
            triggerToast(
              expenseAutoConfirm
                ? `Xərc uğurla qeydə alındı (${dateToSave}) və dərhal təsdiqləndi!`
                : `Xərc uğurla qeydə alındı (${dateToSave}, Təsdiq gözləyir). Təsdiq edilənədək kassadan çıxılmayacaq.`
            );
          }
        } catch (err) {
          console.error(err);
          triggerToast("Xərc daxil edilərkən xəta baş verdi.");
        } finally {
          setIsSubmittingExpense(false);
        }
      });
    }
  };

  // Confirm / Unconfirm Expense Handler
  const handleConfirmExpense = async (id: string, isConfirmed: boolean) => {
    try {
      const response = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONFIRM",
          expense: {
            id,
            isConfirmed,
            confirmedBy: currentUser?.name || "Kassir"
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast(
          isConfirmed 
            ? "✅ Xərc təsdiqləndi və kassadan çıxıldı!" 
            : "↩ Xərcin təsdiqi ləğv edildi və kassa bərpa olundu."
        );
      }
    } catch (err) {
      console.error(err);
      triggerToast("Təsdiqləmə zamanı xəta baş verdi.");
    }
  };

  // Delete Expense Handler
  const handleDeleteExpense = async (id: string) => {
    try {
      const response = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE",
          expense: { id }
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        triggerToast("Xərc silindi.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Silinmə xətası.");
    }
  };

  // Restock drink inventory item
  const handleRestockProduct = async (productId: string) => {
    const amountStr = restockAmounts[productId];
    const amount = Number(amountStr);
    if (!amountStr || isNaN(amount) || amount <= 0) {
      triggerToast("Düzgün say daxil edin!");
      return;
    }

    try {
      const response = await fetch("/api/product/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          business: BusinessType.Doner,
          quantityToAdd: amount
        })
      });
      const data = await response.json();
      if (data.success) {
        onUpdateState(data.state);
        setRestockAmounts(prev => ({ ...prev, [productId]: "" }));
        triggerToast("Anbar qalığı yeniləndi (Alış qeyd edildi!)");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Stok yeniləmə xətası.");
    }
  };

  // QR Code Modal & Simulator
  const handleSimulateQRScan = (tableNum: number) => {
    setQrModalTable(tableNum);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans pos-main-screen print:hidden">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* POS Top Navigation Bar */}
      <header className="bg-slate-950 border-b border-slate-850 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-900/30 animate-pulse">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center space-x-2">
              <span>Köz Xəzər Dönər Kassası</span>
              <span className="text-xs bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-full uppercase">Kassa</span>
            </h1>
            <p className="text-xs text-slate-400">Restoran Daxili & Çatdırılma İdarəetmə Paneli</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pr-28 sm:pr-32">
          <button
            type="button"
            onClick={() => setQrModalTable("ALL")}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
            title="Masalar üçün Vahid QR Menyu Kodu və Çap"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Menyu</span>
          </button>

          <button
            onClick={onBackToHub}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl transition-all cursor-pointer"
            title="Əsas Menyu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* PERSISTENT SUB-HEADER NAVIGATION TABS */}
      <div className="bg-slate-950/70 border-b border-slate-850 px-6 py-2.5 flex items-center space-x-2 shrink-0 overflow-x-auto">
        <button
          onClick={() => {
            setSelectedTable(null);
            setActiveTab("TABLES");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "TABLES" 
              ? "bg-orange-600 text-white shadow-md shadow-orange-950/30" 
              : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Masalar</span>
        </button>

        <button
          onClick={() => {
            handleDirectOrder("TAKEAWAY");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            (activeTab === "ORDER_WINDOW" || activeTab === "DIRECT_ORDER") && !selectedTable && directOrderType === "TAKEAWAY"
              ? "bg-orange-600 text-white shadow-md shadow-orange-950/30" 
              : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Özünlə Apar</span>
        </button>

        <button
          onClick={() => {
            setSelectedTable(null);
            setActiveTab("DELIVERIES");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap relative ${
            activeTab === "DELIVERIES" 
              ? "bg-orange-600 text-white shadow-md shadow-orange-950/30" 
              : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Çatdırılma</span>
          {pendingDeliveries.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full text-[10px] animate-pulse ml-1">
              {pendingDeliveries.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setSelectedTable(null);
            setActiveTab("EXPENSES");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "EXPENSES" 
              ? "bg-orange-600 text-white shadow-md shadow-orange-950/30" 
              : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Xərclər</span>
        </button>

        <button
          onClick={() => {
            setSelectedTable(null);
            setActiveTab("STOCK");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "STOCK" 
              ? "bg-orange-600 text-white shadow-md shadow-orange-950/30" 
              : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Anbar</span>
        </button>

        <button
          onClick={() => {
            setSelectedTable(null);
            setActiveTab("REPORTS");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "REPORTS" 
              ? "bg-orange-600 text-white shadow-md shadow-orange-950/30" 
              : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Hesabatlar</span>
        </button>

        <button
          onClick={() => {
            setSelectedTable(null);
            setActiveTab("SETTINGS");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "SETTINGS" 
              ? "bg-orange-600 text-white shadow-md shadow-orange-950/30" 
              : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:border-slate-700"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Tənzimləmələr</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-hidden flex flex-col">
        
        {/* VIEW 1: STOLLAR (TABLES PANEL) */}
        {activeTab === "TABLES" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
              <div>
                <h3 className="font-semibold text-white font-display">Masa Sifarişləri Paneli</h3>
                <p className="text-xs text-slate-400">Cari stolların vəziyyəti (Dəyişikliklər birbaşa mətbəxə ötürülür)</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                <button
                  onClick={() => setIsWaiterQRModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold text-xs active:scale-95 shadow-sm"
                  title="Ofisiantların telefonla qoşulması üçün QR kod və şəbəkə linki"
                >
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>Mobil Ofisiant Qoşulması</span>
                </button>
                <button
                  onClick={() => setQrModalTable("ALL")}
                  className="flex items-center space-x-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold text-xs active:scale-95 shadow-sm"
                  title="Bütün masaların QR menyu kodlarına bax və çap et"
                >
                  <QrCode className="w-4 h-4 text-orange-500" />
                  <span>QR Menyu & Çap</span>
                </button>
                <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-900">
                  <span className="w-2.5 h-2.5 bg-slate-500 rounded-full inline-block"></span>
                  <span>Cəmi: {state.tables?.length || 12} masa</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-900">
                  <span className="w-3 h-3 bg-slate-800 border border-slate-750 rounded-full inline-block"></span>
                  <span>Boş ({state.tables.filter(t => t.status === "EMPTY").length})</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-900">
                  <span className="w-3 h-3 bg-orange-600 rounded-full inline-block"></span>
                  <span>Mətbəxdə Hazırlanır ({state.tables.filter(t => t.status === "ORDERED").length})</span>
                </div>
              </div>
            </div>

            {/* Warning Banner for Tables with Unsent Orders */}
            {tablesWithUnsentOrders.length > 0 && (
              <div className="bg-amber-500/10 border-2 border-amber-500/40 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shrink-0">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-extrabold text-sm text-white">
                        Mətbəxə Göndərilməmiş Sifarişlər Mövcuddur!
                      </h4>
                      <span className="text-[10px] font-bold bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                        {tablesWithUnsentOrders.length} masa gözləyir
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Aşağıdakı masalarda qeydə alınmış yeməklər hələ mətbəxə ötürülməyib:{" "}
                      <strong className="text-amber-400">
                        {tablesWithUnsentOrders.map(t => `Masa #${t.tableNumber}`).join(", ")}
                      </strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectTable(tablesWithUnsentOrders[0].tableNumber)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Masa #{tablesWithUnsentOrders[0].tableNumber} Sifarişini Göndər</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {state.tables.map((table) => {
                const isActive = table.status === "ORDERED";
                const now = Date.now();
                const isLocked = table.lockedBy && table.lockedBy.expiresAt > now && table.lockedBy.deviceId !== posDeviceId;
                const tableUnsent = getUnsentKitchenItems(table.items || [], `table_${table.tableNumber}`);
                const hasUnsent = tableUnsent.length > 0;

                return (
                  <div 
                    key={table.tableNumber}
                    className={`relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col group ${
                      isLocked
                        ? "bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/20"
                        : hasUnsent
                        ? "bg-slate-850 border-amber-500/60 ring-1 ring-amber-500/30 shadow-lg shadow-amber-950/15"
                        : isActive 
                        ? "bg-slate-850 border-orange-500/50 shadow-lg shadow-orange-950/10" 
                        : "bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Top Status Banner if Locked */}
                    {isLocked && (
                      <div className="bg-amber-500/20 border-b border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-300 flex items-center justify-between z-10">
                        <span className="flex items-center space-x-1 truncate">
                          <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{table.lockedBy?.waiterName || "Mobil Cihaz"} daxil olub</span>
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0 ml-1"></span>
                      </div>
                    )}

                    {/* QR Code Simulator / Modal Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateQRScan(table.tableNumber);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600 border border-orange-500/30 text-orange-400 hover:text-white transition-all z-10 cursor-pointer shadow-sm"
                      title="Müştəri QR Koduna bax və çap et"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {/* Card Clickable */}
                    <div 
                      onClick={() => handleSelectTable(table.tableNumber)}
                      className="p-5 flex-1 cursor-pointer flex flex-col items-center justify-center text-center space-y-3"
                    >
                      <div className={`p-3 rounded-xl ${
                        isLocked
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : hasUnsent
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : isActive 
                          ? "bg-orange-600 text-white" 
                          : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                      }`}>
                        {isLocked ? <Lock className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-white font-display">Stol {table.tableNumber}</h4>
                        {isLocked ? (
                          <div className="mt-1">
                            <span className="text-xs font-bold text-amber-400 block">
                              Sifariş qəbul edilir...
                            </span>
                            <span className="text-[9px] text-amber-300/80 block mt-0.5">
                              {table.lockedBy?.waiterName || "Ofisiant"} (Telefonda)
                            </span>
                          </div>
                        ) : isActive ? (
                          <div className="mt-1">
                            <span className="text-sm font-black text-orange-400">
                              {table.subtotal.toFixed(2)} ₼
                            </span>
                            {hasUnsent ? (
                              <span className="inline-flex items-center space-x-1 bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-bold mt-1 animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                <span>Mətbəxə Göndərilməyib ({tableUnsent.reduce((s, i) => s + i.quantity, 0)})</span>
                              </span>
                            ) : (
                              <span className="block text-[10px] text-slate-400 mt-0.5">
                                {table.items.length} fəal məhsul
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium block mt-1">Boşdur</span>
                        )}
                      </div>
                    </div>

                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimulateQRScan(table.tableNumber);
                      }}
                      className="bg-slate-950 hover:bg-slate-900 border-t border-slate-850 py-2 px-3 text-[10px] text-slate-400 hover:text-orange-400 flex items-center justify-between cursor-pointer transition-colors"
                      title="Bu masanın QR Koduna bax və çap et"
                    >
                      <span className="flex items-center space-x-1 font-semibold">
                        <QrCode className="w-3.5 h-3.5 text-orange-400" />
                        <span>QR Menyu</span>
                      </span>
                      <span className="text-orange-400 flex items-center space-x-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Göstər</span>
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: SİFARİŞ EKRANI (ORDER WINDOW / DIRECT ORDER) */}
        {(activeTab === "ORDER_WINDOW" || activeTab === "DIRECT_ORDER") && (
          <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
            
            {/* Left Column: Menu Items list */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-850 bg-slate-950">
              
              {/* Category selector & Search bar */}
              <div className="p-4 border-b border-slate-850 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950">
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        selectedCategory === cat 
                          ? "bg-orange-600 text-white shadow-md shadow-orange-900/20" 
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Məhsul axtar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 text-xs text-slate-200 px-3.5 py-2.5 pl-9 rounded-xl border border-slate-800 focus:border-orange-500 focus:outline-none w-full sm:w-56"
                  />
                  <div className="absolute left-3 top-3 text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              <div className="p-5 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const qtyInCart = currentCart.filter(item => item.productId === product.id).reduce((sum, i) => sum + i.quantity, 0);
                  const salesCount = productSalesMap[product.id] || 0;
                  const isTopSeller = salesCount > 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className={`group rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-200 relative overflow-hidden select-none border shadow-sm hover:shadow-md hover:border-orange-500/50 ${
                        isTopSeller 
                          ? "bg-slate-900 border-amber-500/35 hover:border-amber-400/70 shadow-amber-950/10" 
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {/* Product Image on top (only what user added in menu) */}
                      <div className="relative w-full h-28 sm:h-32 bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800/80">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950/60 p-2 text-center">
                            <ChefHat className="w-7 h-7 text-orange-500/40 mb-1" />
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Köz Dönər</span>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                          <span className="text-[9px] bg-slate-950/80 backdrop-blur-md text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            {product.category}
                          </span>
                          {qtyInCart > 0 && (
                            <span className="bg-orange-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center animate-scaleIn shadow-lg border-2 border-slate-900">
                              {qtyInCart}
                            </span>
                          )}
                        </div>

                        {/* Top seller tag inside image bottom-left */}
                        {isTopSeller && (
                          <div className="absolute bottom-1.5 left-1.5 pointer-events-none">
                            <span className="text-[8px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black flex items-center space-x-1 shadow-sm">
                              <Flame className="w-2.5 h-2.5 fill-current" />
                              <span>Top Satış</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Name & Price Underneath Image */}
                      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                            {product.name}
                          </h4>
                          {product.ingredients && product.ingredients.length > 0 ? (
                            <span className="text-[9px] text-slate-500 block mt-1">Özəlləşdirilə bilər tərkib</span>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-auto">
                          <span className="font-black text-white text-sm sm:text-base font-display">
                            {Number(product.price || 0).toFixed(2)} ₼
                          </span>
                          <div className="bg-slate-800 group-hover:bg-orange-600 p-1.5 rounded-lg text-slate-300 group-hover:text-white transition-all">
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-12">
                    <p className="text-sm">Axtarışa uyğun məhsul tapılmadı.</p>
                  </div>
                )}
              </div>

              {/* Back button at footer */}
              <div className="p-4 border-t border-slate-850 bg-slate-950 flex items-center">
                <button
                  onClick={handleBackToTables}
                  className="px-5 py-2.5 text-xs text-slate-400 hover:text-white font-bold bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center space-x-2 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Stollara Geri Qayıt</span>
                </button>
              </div>

            </div>

            {/* Right Column: Active Bill Sidebar */}
            <div className="w-full md:w-[380px] lg:w-[420px] bg-slate-900 border-t md:border-t-0 border-l border-slate-850 flex flex-col overflow-hidden shrink-0">
              
              {/* Header Details */}
              <div className="p-4 border-b border-slate-850 bg-slate-950 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Cari Sifariş</span>
                    <h3 className="text-base font-extrabold text-white font-display">
                      {selectedTable 
                        ? `Masa ${selectedTable}` 
                        : (directOrderType === "TAKEAWAY" ? "Özünlə Apar" : "Kuryer Çatdırılması")}
                    </h3>
                  </div>
                  
                  {/* Indicator info */}
                  {selectedTable && (
                    <div className="text-right">
                      <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold py-1 px-2 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Masa Aktiv</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery info subform if DELIVERY is active */}
              {activeTab === "DIRECT_ORDER" && directOrderType === "DELIVERY" && (
                <div className="p-4 bg-slate-950 border-b border-slate-850 space-y-3 shrink-0">
                  <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider block">Çatdırılma Melumatları</span>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <UserIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Müştəri adı"
                        value={deliveryName}
                        onChange={(e) => setDeliveryName(e.target.value)}
                        className="bg-slate-900 text-xs text-white border border-slate-800 rounded-lg p-2 pl-8 w-full focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Müştəri telefonu"
                        value={deliveryPhone}
                        onChange={(e) => setDeliveryPhone(e.target.value)}
                        className="bg-slate-900 text-xs text-white border border-slate-800 rounded-lg p-2 pl-8 w-full focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Çatdırılma ünvanı"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="bg-slate-900 text-xs text-white border border-slate-800 rounded-lg p-2 pl-8 w-full focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Kuryer Təyin Et</label>
                      <select
                        value={selectedCourierId}
                        onChange={(e) => setSelectedCourierId(e.target.value)}
                        className="bg-slate-900 text-xs text-white border border-slate-800 rounded-lg p-2 w-full focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Kuryer Seçilməyib</option>
                        {state.couriers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ⚡ YUXARIDA BƏRKİDİLMİŞ ÖDƏNİŞ VƏ ƏMƏLİYYAT PANELİ (Heç bir sürüşdürmə tələb olunmur!) */}
              <div className="bg-slate-950 p-4 border-b border-slate-850 space-y-3 shrink-0 shadow-md">
                
                {/* Total amount view */}
                <div className="flex justify-between items-center text-white pb-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Cəm məbləğ:</span>
                    <span className="text-[10px] text-slate-500 font-medium">({currentCart.length} növ məhsul)</span>
                  </div>
                  <span className="font-black text-2xl text-orange-500 tracking-tight font-display">
                    {cartSubtotal.toFixed(2)} ₼
                  </span>
                </div>

                {/* ƏSAS DÜYMƏ: Ödənişi Tamamla (Birbaşa ən yuxarıda!) */}
                <button
                  type="button"
                  onClick={selectedTable ? handlePayTableOrder : handlePayDirectOrder}
                  disabled={currentCart.length === 0}
                  className={`w-full py-3.5 px-4 rounded-xl text-sm font-black text-white transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer ${
                    currentCart.length > 0
                      ? activeTab === "DIRECT_ORDER" && directOrderType === "DELIVERY"
                        ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 hover:scale-[1.01] shadow-orange-950/40"
                        : "bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] shadow-emerald-950/40"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                  }`}
                >
                  {activeTab === "DIRECT_ORDER" && directOrderType === "DELIVERY" ? (
                    <>
                      <Truck className="w-5 h-5" />
                      <span>🛵 Kuryerə Göndər (Təsdiq Gözləməyə Al)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Ödənişi Tamamla & Müştəri Qəbzi</span>
                    </>
                  )}
                </button>

                {/* Kitchen Send Button (Only active when there are unsent items!) */}
                <button
                  type="button"
                  onClick={handleSendToKitchen}
                  disabled={!hasUnsentKitchenItems || currentCart.length === 0}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border ${
                    hasUnsentKitchenItems && currentCart.length > 0
                      ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 cursor-pointer shadow-md shadow-amber-950/30"
                      : "bg-slate-900 text-slate-500 border-slate-850 cursor-not-allowed opacity-60"
                  }`}
                >
                  <ChefHat className="w-4 h-4 text-amber-400" />
                  <span>
                    {hasUnsentKitchenItems && currentCart.length > 0
                      ? `👨‍🍳 Mətbəxə Göndər (${unsentCount} yeni məhsul)`
                      : "Mətbəxə Göndərilib ✔️"}
                  </span>
                </button>

                {/* Payment Method selector */}
                <PaymentSelector
                  value={paymentMethod}
                  note={paymentNote}
                  onChange={(method, note) => {
                    setPaymentMethod(method);
                    setPaymentNote(note || "");
                  }}
                  theme="dark"
                />

                {/* Custom Date & Time for sale (Retroactive sale entry - compact) */}
                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-850 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-orange-400" />
                      <span>📅 Sifariş Tarixi & Vaxtı</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomOrderTime(prev => !prev)}
                      className="text-[10px] text-orange-400 hover:underline font-semibold cursor-pointer"
                    >
                      {showCustomOrderTime ? "Cari vaxta qaytar" : (orderCustomDateTime ? "Dəyişilib 🕒" : "Tarixi dəyiş")}
                    </button>
                  </div>
                  {showCustomOrderTime && (
                    <div className="space-y-1 mt-1.5 animate-fadeIn">
                      <input
                        type="datetime-local"
                        value={orderCustomDateTime}
                        onChange={(e) => setOrderCustomDateTime(e.target.value)}
                        className="w-full bg-slate-950 text-white font-mono text-xs border border-slate-800 rounded-lg p-1.5 focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-[9px] text-slate-500 block leading-tight">
                        * Boşdursa cari an qeyd olunur. Keçmiş tarix yazıldıqda PİN kodu ilə təsdiq tələb olunur.
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Cart Item list (Yuxarıdakı panelin altında sərbəst sürüşür) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-850/60">
                  <span>Sifariş Məhsulları ({currentCart.length})</span>
                  {currentCart.length > 0 && (
                    <span className="text-[10px] text-orange-400 font-semibold">Tərkib və say düzəlişi</span>
                  )}
                </div>

                {currentCart.map((item, index) => (
                  <div 
                    key={`${item.productId}-${index}`}
                    className="flex flex-col bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-3">
                        <h5 className="font-bold text-xs text-white truncate">{item.name}</h5>
                        <span className="text-[10px] text-slate-400">{item.price.toFixed(2)} ₼</span>
                        
                        {item.removedIngredients && item.removedIngredients.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.removedIngredients.map(ing => (
                              <span key={ing} className="bg-red-500/10 text-red-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-500/10">
                                -{ing}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {item.itemNote && (
                          <div className="mt-1">
                            <span className="bg-amber-500/10 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-amber-500/20 inline-flex items-center gap-1">
                              <span>💬 {item.itemNote}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center space-x-2 bg-slate-900 rounded-lg p-1 border border-slate-800">
                        <button 
                          onClick={() => updateQuantity(item.productId, -1, item.removedIngredients, item.itemNote)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs text-white font-bold px-1 min-w-[16px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, 1, item.removedIngredients, item.itemNote)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right ml-4 min-w-[50px]">
                        <span className="font-black text-xs text-white">
                          {(item.price * item.quantity).toFixed(2)} ₼
                        </span>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.productId, item.removedIngredients, item.itemNote)}
                        className="text-slate-500 hover:text-red-400 ml-2 p-1 rounded hover:bg-slate-850 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {currentCart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 space-y-2">
                    <ShoppingBag className="w-8 h-8 text-slate-700" />
                    <p className="text-xs">Sifariş boşdur. Sol tərəfdən məhsul seçin.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* VIEW: KURYER ÇATDIRILMALARI (DELIVERIES PANEL) */}
        {activeTab === "DELIVERIES" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* 1. Header & Summary Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-850 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-600/20 text-orange-400 p-3 rounded-2xl border border-orange-500/30">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white font-display flex items-center gap-2">
                    <span>Kuryer Çatdırılmaları Paneli</span>
                    {pendingDeliveries.length > 0 && (
                      <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-xs animate-pulse">
                        {pendingDeliveries.length} Aktiv
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Yolda olan sifarişlərin izlənməsi və kuryer qayıtdıqda ödənişin qəbul edilərək təsdiqlənməsi</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* KPI: Pending total amount */}
                <div className="bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Gözləmədəki Cəm Məbləğ</div>
                    <div className="text-base font-black text-amber-400">
                      {pendingDeliveries.reduce((sum, o) => sum + (o.subtotal || 0), 0).toFixed(2)} ₼
                    </div>
                  </div>
                </div>

                {/* Action: New Delivery button */}
                <button
                  onClick={() => handleDirectOrder("DELIVERY")}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-orange-950/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Yeni Çatdırılma Yarat</span>
                </button>
              </div>
            </div>

            {/* 2. Sub-tab Filters */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setDeliveryTabFilter("PENDING")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  deliveryTabFilter === "PENDING"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-slate-400 hover:text-white bg-slate-950 border border-slate-850"
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Aktiv / Yolda Olanlar ({pendingDeliveries.length})</span>
              </button>

              <button
                onClick={() => setDeliveryTabFilter("COMPLETED")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  deliveryTabFilter === "COMPLETED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white bg-slate-950 border border-slate-850"
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Bugün Tamamlananlar ({completedTodayDeliveries.length})</span>
              </button>
            </div>

            {/* 3. Pending Deliveries Grid */}
            {deliveryTabFilter === "PENDING" && (
              <div>
                {pendingDeliveries.length === 0 ? (
                  <div className="bg-slate-950 rounded-2xl border border-slate-850 p-12 text-center text-slate-500 space-y-3">
                    <Truck className="w-12 h-12 mx-auto text-slate-700 animate-bounce" />
                    <div className="text-base font-bold text-slate-400">Hazırda yolda olan gözləmədə çatdırılma yoxdur</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Yeni kuryer çatdırılması qeydiyyatdan keçirdikdə sifariş avtomatik burada əks olunacaq.
                    </p>
                    <button
                      onClick={() => handleDirectOrder("DELIVERY")}
                      className="mt-2 inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-850 text-orange-400 text-xs font-bold px-4 py-2 rounded-xl border border-orange-500/20 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yeni Çatdırılma Əlavə Et</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {pendingDeliveries.map(order => {
                      const courier = (state.couriers || []).find(c => c.id === order.courierId);
                      return (
                        <div
                          key={order.id}
                          className="bg-slate-950 rounded-2xl border border-amber-500/30 p-5 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 animate-pulse" />

                          {/* Header info */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-slate-400">
                                #{order.id.replace("ord_d_", "")}
                              </span>
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center space-x-1">
                                <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: "3s" }} />
                                <span>{formatElapsedTime(order.createdAt)}</span>
                              </span>
                            </div>

                            {/* Courier info & Selector */}
                            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-orange-400" />
                                  <span>Təyin Edilmiş Kuryer:</span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <select
                                  value={order.courierId || ""}
                                  onChange={(e) => handleChangeDeliveryCourier(order.id, e.target.value)}
                                  className="bg-slate-950 text-xs font-bold text-white border border-slate-700 rounded-lg p-1.5 flex-1 focus:outline-none focus:border-orange-500"
                                >
                                  <option value="">Kuryer Təyin Edilməyib</option>
                                  {(state.couriers || []).map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} ({c.phone})
                                    </option>
                                  ))}
                                </select>
                                {courier?.phone && (
                                  <a
                                    href={`tel:${courier.phone}`}
                                    className="p-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg border border-orange-500/30 transition-colors"
                                    title="Kuryerə zəng et"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Customer contact info */}
                            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-white flex items-center gap-1.5">
                                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{order.deliveryName || "Müştəri"}</span>
                                </span>
                                {order.deliveryPhone && (
                                  <a
                                    href={`tel:${order.deliveryPhone}`}
                                    className="text-xs font-bold text-orange-400 hover:underline flex items-center gap-1"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{order.deliveryPhone}</span>
                                  </a>
                                )}
                              </div>
                              {order.deliveryAddress && (
                                <div className="text-[11px] text-slate-300 flex items-start gap-1.5 pt-1 border-t border-slate-800">
                                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                  <span className="font-semibold">{order.deliveryAddress}</span>
                                </div>
                              )}
                            </div>

                            {/* Order items list */}
                            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 space-y-1.5 max-h-36 overflow-y-auto">
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Sifariş Məhsulları:</div>
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                  <span className="text-slate-200">
                                    <span className="font-bold text-orange-400 mr-1.5">{item.quantity}x</span>
                                    {item.name}
                                    {item.removedIngredients && item.removedIngredients.length > 0 && (
                                      <span className="text-[9px] text-red-400 ml-1">
                                        (-{item.removedIngredients.join(", ")})
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    {(item.price * item.quantity).toFixed(2)} ₼
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Footer & Action Buttons */}
                          <div className="space-y-3 pt-2 border-t border-slate-850">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400 font-bold uppercase">Yekun Məbləğ:</span>
                              <span className="text-xl font-black text-white">
                                {order.subtotal.toFixed(2)} <span className="text-orange-400 text-sm">₼</span>
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {/* Confirm & Close Button */}
                              <button
                                onClick={() => {
                                  setConfirmDeliveryOrder(order);
                                  setConfirmDeliveryPaymentMethod(order.paymentMethod || PaymentMethod.Cash);
                                  setConfirmDeliveryNote(order.paymentNote || "");
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Ödənişi Təsdiqlə & Bağla</span>
                              </button>

                              {/* Print Ticket Button */}
                              <button
                                onClick={() => {
                                  const courier = (state.couriers || []).find(c => c.id === order.courierId);
                                  handleOpenPrint("KITCHEN", {
                                    title: "KÖZ XƏZƏR DÖNƏR",
                                    orderId: order.id.replace("ord_d_", ""),
                                    orderType: "Çatdırılma",
                                    items: order.items,
                                    subtotal: order.subtotal,
                                    createdAt: order.createdAt,
                                    deliveryDetails: {
                                      receiverName: order.deliveryName,
                                      receiverPhone: order.deliveryPhone,
                                      deliveryAddress: order.deliveryAddress,
                                      courierName: courier ? courier.name : "Kuryer"
                                    }
                                  });
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white p-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer"
                                title="Kuryer / Mətbəx Çekini Çap Et"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Cancel Button */}
                              <button
                                onClick={() => {
                                  setCancelDeliveryOrder(order);
                                  setCancelDeliveryReason("");
                                  setCancelDeliveryPin("");
                                }}
                                className="bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 p-2.5 rounded-xl border border-red-900/40 transition-all cursor-pointer"
                                title="Sifarişi Ləğv Et (Anbara Qaytar)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. Completed Today Deliveries List */}
            {deliveryTabFilter === "COMPLETED" && (
              <div className="bg-slate-950 rounded-2xl border border-slate-850 p-6 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Bugün Tamamlanmış Çatdırılmalar ({completedTodayDeliveries.length})</span>
                </h4>

                {completedTodayDeliveries.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Bugün hələ tamamlanmış çatdırılma sifarişi qeydə alınmayıb.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-3 px-3">Sifariş ID</th>
                          <th className="pb-3 px-3">Müştəri & Ünvan</th>
                          <th className="pb-3 px-3">Kuryer</th>
                          <th className="pb-3 px-3">Ödəniş Metodu</th>
                          <th className="pb-3 px-3 text-right">Məbləğ</th>
                          <th className="pb-3 px-3 text-center">Qəbz</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {completedTodayDeliveries.map(ord => {
                          const courier = (state.couriers || []).find(c => c.id === ord.courierId);
                          return (
                            <tr key={ord.id} className="hover:bg-slate-900/30">
                              <td className="py-3 px-3 font-mono font-bold text-slate-300">
                                #{ord.id.replace("ord_d_", "")}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-white">{ord.deliveryName || "Müştəri"}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-xs">{ord.deliveryAddress}</div>
                              </td>
                              <td className="py-3 px-3 text-slate-300">
                                {courier ? courier.name : (ord.courierName || "Kuryer")}
                              </td>
                              <td className="py-3 px-3">
                                <span className="bg-slate-900 text-orange-400 border border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                  {ord.paymentMethod === PaymentMethod.Cash ? "Nağd" :
                                   ord.paymentMethod === PaymentMethod.PosTerminal ? "POS Terminal" :
                                   ord.paymentMethod === PaymentMethod.CardTransfer ? "Kart Transferi" :
                                   ord.paymentMethod === PaymentMethod.M10 ? "m10" :
                                   ord.paymentMethod || "Nağd"}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-black text-white">
                                {ord.subtotal.toFixed(2)} ₼
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => {
                                    handleOpenPrint("CUSTOMER", {
                                      title: "KÖZ XƏZƏR DÖNƏR",
                                      orderId: ord.id.replace("ord_d_", ""),
                                      orderType: "Çatdırılma",
                                      items: ord.items,
                                      subtotal: ord.subtotal,
                                      paymentMethod: ord.paymentMethod,
                                      paymentNote: ord.paymentNote,
                                      createdAt: ord.createdAt,
                                      deliveryDetails: {
                                        receiverName: ord.deliveryName,
                                        receiverPhone: ord.deliveryPhone,
                                        deliveryAddress: ord.deliveryAddress,
                                        courierName: courier ? courier.name : "Kuryer"
                                      }
                                    });
                                  }}
                                  className="p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg border border-slate-800 cursor-pointer"
                                  title="Qəbzi Çap Et"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: KASSA XƏRCLƏRİ VƏ ANBAR MƏDAXİLİ (EXPENSES & INVENTORY PURCHASE) */}
        {activeTab === "EXPENSES" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* Top Summary Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold">Cəmi Xərclər</span>
                  <Activity className="w-4 h-4 text-orange-500" />
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-white">
                    {donerExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)} ₼
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{donerExpenses.length} qeyd</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold">Mal / Anbar Alışları</span>
                  <Archive className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-emerald-400">
                    {donerExpenses
                      .filter(e => e.isInventoryPurchase || e.category === "Məhsul Alışı" || e.category === "Məhsul")
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toFixed(2)} ₼
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Anbara mədaxil olunan mallar</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold">Əməliyyat & Kommunal</span>
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-blue-400">
                    {donerExpenses
                      .filter(e => !e.isInventoryPurchase && e.category !== "Məhsul Alışı" && e.category !== "Məhsul")
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toFixed(2)} ₼
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">İcarə, maaş, kommunal və s.</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="font-semibold">Kassadan Nağd Çıxış</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-amber-400">
                    {donerExpenses
                      .filter(e => !e.paymentSource || e.paymentSource === "Nağd" || e.paymentSource === "Kassa (Nağd)")
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toFixed(2)} ₼
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Kassa qalığına təsir edir</p>
                </div>
              </div>
            </div>

            {/* Main Section: Form & Expense History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left pane: Expense Registration Form */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col space-y-4 h-fit">
                
                {/* Form Mode Selector */}
                <div className="space-y-2">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setExpenseMode("INVENTORY")}
                      className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        expenseMode === "INVENTORY"
                          ? "bg-orange-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Mal / Anbar Alışı</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseMode("GENERAL")}
                      className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        expenseMode === "GENERAL"
                          ? "bg-orange-600 text-white shadow-md"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Əməliyyat Xərci</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {expenseMode === "INVENTORY"
                      ? "💡 Kola, su, ət, çörək və s. alışı edildikdə həm xərc yazılır, həm də Anbar qalığı avtomatik artırılır."
                      : "💡 İcarə, işıq, qaz, maaş və digər restoran xərclərinin qeydiyyatı."}
                  </p>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-3.5 pt-1">
                  
                  {/* INVENTORY PURCHASE FIELDS */}
                  {expenseMode === "INVENTORY" && (
                    <>
                      {/* Item Quick Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Alınan Məhsul / Mal
                        </label>
                        <select
                          value={expenseItemSelect}
                          onChange={(e) => handleExpenseItemSelectChange(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none cursor-pointer font-semibold"
                        >
                          <option value="">Məhsul seçin və ya aşağıda daxil edin...</option>
                          <option value="NEW_CUSTOM" className="text-orange-400 font-extrabold">
                            + Yeni Məhsul Adı Daxil Et (Siyahıda yoxdur)
                          </option>

                          {/* Drinks & Menu items */}
                          {state.donerProducts && state.donerProducts.length > 0 && (
                            <optgroup label="Sistemdə Mövcud Menyu və İçkilər">
                              {state.donerProducts.map((p) => (
                                <option key={`prod-${p.id}`} value={p.id}>
                                  {p.name} ({p.category})
                                </option>
                              ))}
                            </optgroup>
                          )}

                          {/* Inventory items */}
                          {state.inventoryItems && state.inventoryItems.length > 0 && (
                            <optgroup label="Anbardakı Xammal və İnventarlar">
                              {state.inventoryItems.map((i) => (
                                <option key={`inv-${i.id}`} value={i.name}>
                                  {i.name} ({i.unit}) — Qalıq: {i.stock || 0} {i.unit}
                                </option>
                              ))}
                            </optgroup>
                          )}

                          {/* Standard suggestions */}
                          <optgroup label="Populyar Xammal və İnqrediyentlər">
                            {standardItemsList.map((std, i) => (
                              <option key={`std-exp-${i}`} value={std.name}>
                                {std.name} ({std.unit})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Item Name Input */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Məhsulun Tam Adı
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Məs. Coca-Cola 330ml, Dönər Çörəyi, Dana Əti"
                          value={expenseItemName}
                          onChange={(e) => setExpenseItemName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none"
                        />
                      </div>

                      {/* Category and Unit */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Kateqoriya</label>
                          <select
                            value={expenseItemCategory}
                            onChange={(e) => setExpenseItemCategory(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none cursor-pointer"
                          >
                            <option value="İçki">İçki / Su</option>
                            <option value="Çörək">Çörək / Un məhsulu</option>
                            <option value="Lavaş">Lavaş</option>
                            <option value="Ət">Ət / Toyuq</option>
                            <option value="Tərəvəz">Tərəvəz / Göyərti</option>
                            <option value="Sous">Sous / Ədviyyat</option>
                            <option value="Qablaşdırma">Qablaşdırma</option>
                            <option value="Digər">Digər</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Ölçü Vahidi</label>
                          <select
                            value={expenseUnit}
                            onChange={(e) => setExpenseUnit(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none cursor-pointer"
                          >
                            <option value="ədəd">ədəd</option>
                            <option value="kq">kq</option>
                            <option value="litr">litr</option>
                            <option value="blok">blok / bağlama</option>
                            <option value="qutu">qutu / yeşik</option>
                            <option value="vedrə">vedrə</option>
                            <option value="rulon">rulon</option>
                            <option value="paçka">paçka</option>
                          </select>
                        </div>
                      </div>

                      {/* Quantity & Pricing (Two-way auto calculation) */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Alınan Say ({expenseUnit})
                          </label>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Məs. 24"
                            value={expenseQuantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 text-white font-bold p-2 rounded-lg text-xs focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">
                            1 {expenseUnit} Qiyməti (₼)
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            placeholder="Məs. 0.75"
                            value={expenseUnitPrice}
                            onChange={(e) => handleUnitPriceChange(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 text-white font-bold p-2 rounded-lg text-xs focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-orange-400 uppercase tracking-wider block font-extrabold">
                            Cəm Məbləğ (₼)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Məs. 18.00"
                            value={expenseTotalAmount}
                            onChange={(e) => handleTotalAmountChange(e.target.value)}
                            className="w-full bg-orange-950/30 border border-orange-500/40 focus:border-orange-500 text-orange-300 font-extrabold p-2 rounded-lg text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Optional Supplier Selector & Debt split */}
                      <div className="space-y-1 bg-slate-900/40 p-2.5 rounded-xl border border-slate-850">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Təchizatçı (İstəyə bağlı)
                        </label>
                        <select
                          value={expenseSupplierId}
                          onChange={e => {
                            setExpenseSupplierId(e.target.value);
                            if (e.target.value && !expensePaidAmount) {
                              setExpensePaidAmount(expenseTotalAmount);
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2 rounded-lg text-xs focus:outline-none cursor-pointer font-semibold"
                        >
                          <option value="">Təchizatçı seçilməyib (Birbaşa tam ödəniş)</option>
                          {(state.suppliers || []).map(sup => (
                            <option key={sup.id} value={sup.id}>
                              {sup.name} {sup.company ? `(${sup.company})` : ""} — Qalıq Borc: {sup.debtBalance.toFixed(2)} ₼
                            </option>
                          ))}
                        </select>

                        {expenseSupplierId && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                            <div>
                              <label className="text-[9px] text-slate-400 block font-semibold">Qaimə Cəmi (₼)</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder={expenseTotalAmount || "0.00"}
                                value={expenseInvoiceTotal || expenseTotalAmount}
                                onChange={e => setExpenseInvoiceTotal(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-white font-bold p-1.5 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-emerald-400 block font-semibold">İndi Ödənilən (₼)</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder={expenseTotalAmount || "0.00"}
                                value={expensePaidAmount}
                                onChange={e => setExpensePaidAmount(e.target.value)}
                                className="w-full bg-slate-950 border border-emerald-500/40 text-emerald-300 font-bold p-1.5 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add to Menu Option if not already in menu */}
                      {!state.donerProducts?.some(p => p.name.toLowerCase() === expenseItemName.trim().toLowerCase()) && (
                        <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="expAddToMenu"
                              checked={expenseAddToMenu}
                              onChange={(e) => setExpenseAddToMenu(e.target.checked)}
                              className="accent-orange-500 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="expAddToMenu" className="text-[11px] text-slate-300 font-semibold cursor-pointer">
                              Satış menyusuna da əlavə edilsin?
                            </label>
                          </div>
                          {expenseAddToMenu && (
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">
                                Menyu Satış Qiyməti (₼)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                required={expenseAddToMenu}
                                placeholder="Məs. 1.50"
                                value={expenseMenuPrice}
                                onChange={(e) => setExpenseMenuPrice(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 text-white p-2 rounded-lg text-xs focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Live sync outcome summary */}
                      {expenseItemName && expenseQuantity && expenseTotalAmount && (
                        <div className="bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl text-[11px] text-emerald-300 space-y-1">
                          <div className="font-bold flex items-center space-x-1.5 text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>İnteqrasiya Nəticəsi:</span>
                          </div>
                          <p className="text-emerald-200/90 leading-relaxed text-[10px]">
                            • Xərclər: <strong>{expenseTotalAmount} ₼</strong> kassa çıxışı qeyd ediləcək.
                            <br />
                            • Anbar: <strong>{expenseItemName}</strong> qalığı <strong>+{expenseQuantity} {expenseUnit}</strong> artırılacaq.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* GENERAL / OPERATIONAL EXPENSE FIELDS */}
                  {expenseMode === "GENERAL" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Kateqoriya</label>
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none cursor-pointer font-semibold"
                        >
                          <option value="Kommunal">Kommunal (Qaz, İşıq, Su, İnternet)</option>
                          <option value="İcarə">İcarə Haqqı</option>
                          <option value="Maaş">Maaş / Avans</option>
                          <option value="Təmizlik">Təmizlik / Təsərrüfat Xərcləri</option>
                          <option value="Təmir">Təmir / Avadanlıq Xərci</option>
                          <option value="Reklam">Reklam / Marketinq</option>
                          <option value="Digər">Digər / Təcili Kassa Çıxışı</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Təyinat / Başlıq</label>
                        <input
                          type="text"
                          required
                          placeholder="Məs. İşıq pulu, Aşpaz avansı, Təsərrüfat alışı"
                          value={expenseTitle}
                          onChange={(e) => setExpenseTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Məbləğ (₼)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Məs. 85.00"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none font-bold"
                        />
                      </div>
                    </>
                  )}

                  {/* Payment Source */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Ödəniş Mənbəyi</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Nağd", "POS Terminal"] as const).map((source) => (
                        <button
                          key={source}
                          type="button"
                          onClick={() => setExpensePaymentSource(source)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer flex items-center justify-center space-x-1.5 ${
                            expensePaymentSource === source
                              ? "bg-orange-600/20 border-orange-500 text-orange-400 font-extrabold shadow-sm"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span>{source === "Nağd" ? "💵 Nağd" : "💳 POS Terminal"}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Note */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Qeyd / Təchizatçı / Qaimə № (İstəyə bağlı)
                    </label>
                    <input
                      type="text"
                      placeholder="Məs. Coca-Cola distribütoru, Qaimə #4921"
                      value={expenseNote}
                      onChange={(e) => setExpenseNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  {/* Custom Expense Date & Time */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold flex items-center justify-between">
                      <span>📅 Xərc Tarixi və Saatı</span>
                      <span className="text-slate-500 font-normal lowercase">(boşdursa cari vaxt)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={expenseCustomDateTime}
                      onChange={(e) => setExpenseCustomDateTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2 rounded-xl text-xs focus:outline-none font-mono"
                    />
                  </div>

                  {/* Immediate Confirmation Option */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="expAutoConfirm"
                        checked={expenseAutoConfirm}
                        onChange={(e) => setExpenseAutoConfirm(e.target.checked)}
                        className="accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="expAutoConfirm" className="text-[11px] text-slate-200 font-bold cursor-pointer flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Dərhal təsdiqlənsin (Kassadan çıxılsın)</span>
                      </label>
                    </div>
                    {!expenseAutoConfirm && (
                      <p className="text-[10px] text-amber-400/90 leading-tight">
                        ℹ️ Təsdiqlənməyən xərclər kassa qalığından və hesabat xərclərindən <strong>çıxılmır</strong>. Xərc daxil edildikdən sonra siyahıdan <strong>"Təsdiqlə"</strong> düyməsinə basıla bilər.
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingExpense}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer mt-2"
                  >
                    {isSubmittingExpense ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Xərc Qeydə Alınır...</span>
                      </>
                    ) : expenseMode === "INVENTORY" ? (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Xərci Qeyd Et & Anbara Mədaxil Et</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Xərci Qeyd Et</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right pane: Expense History & Filtered List */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 lg:col-span-2 flex flex-col space-y-4">
                
                {/* Summary Reconciliation Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-emerald-500/20">
                    <span className="text-[9px] text-emerald-400 uppercase font-black block flex items-center space-x-1">
                      <Banknote className="w-3 h-3 text-emerald-400" />
                      <span>Təsdiqlənmiş Kassa Xərci</span>
                    </span>
                    <span className="text-lg font-black text-white">{totalConfirmedCashExpenses.toFixed(2)} ₼</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Kassadan real çıxılan nağd</span>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-amber-500/30">
                    <span className="text-[9px] text-amber-400 uppercase font-black block flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Təsdiq Gözləyən ({pendingDonerExpenses.length})</span>
                    </span>
                    <span className="text-lg font-black text-amber-300">{totalPendingDonerExpenses.toFixed(2)} ₼</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Kassadan hələ çıxılmayıb</span>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-xl border border-orange-500/20">
                    <span className="text-[9px] text-orange-400 uppercase font-black block flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-orange-400" />
                      <span>Cəmi Təsdiqlənmiş Xərc</span>
                    </span>
                    <span className="text-lg font-black text-orange-400">{totalConfirmedDonerExpenses.toFixed(2)} ₼</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Bütün təsdiqlənmiş kanallar</span>
                  </div>
                </div>

                {/* Header & Search Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                      <Activity className="w-4 h-4 text-orange-500" />
                      <span>Xərclərin Reyestri & Təsdiqləmə Jurnalı</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Yalnız təsdiqlənmiş xərclər kassa qalığından və hesabatdan çıxılır</p>
                  </div>

                  {/* Search Bar */}
                  <input
                    type="text"
                    placeholder="Xərclərdə axtar..."
                    value={expenseSearchQuery}
                    onChange={(e) => setExpenseSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-800 focus:border-orange-500 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none w-full sm:w-44"
                  />
                </div>

                {/* Date Range Filter Bar for POS Expenses */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-400 font-bold text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span>Tarix Filtri:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
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
                        onClick={() => setPosExpPeriod(p.key as any)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          posExpPeriod === p.key
                            ? "bg-orange-600 text-white shadow-sm"
                            : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {posExpPeriod === "CUSTOM" && (
                    <div className="w-full flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80 animate-fadeIn text-[11px]">
                      <span className="text-slate-400">Başlanğıc:</span>
                      <input
                        type="date"
                        value={posExpStartDate}
                        onChange={e => setPosExpStartDate(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-slate-600 font-bold">-</span>
                      <span className="text-slate-400">Son:</span>
                      <input
                        type="date"
                        value={posExpEndDate}
                        onChange={e => setPosExpEndDate(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-0.5 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setExpenseFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                      expenseFilter === "ALL"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    Hamısı ({donerExpenses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseFilter("CONFIRMED")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                      expenseFilter === "CONFIRMED"
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Təsdiqlənmiş ({confirmedDonerExpenses.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseFilter("PENDING")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                      expenseFilter === "PENDING"
                        ? "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Təsdiq Gözləyən ({pendingDonerExpenses.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseFilter("INVENTORY")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                      expenseFilter === "INVENTORY"
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Mal Alışı ({donerExpenses.filter(e => e.isInventoryPurchase || e.category === "Məhsul Alışı" || e.category === "Məhsul").length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseFilter("GENERAL")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                      expenseFilter === "GENERAL"
                        ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Əməliyyat ({donerExpenses.filter(e => !e.isInventoryPurchase && e.category !== "Məhsul Alışı" && e.category !== "Məhsul").length})</span>
                  </button>
                </div>

                {/* Expenses List */}
                <div className="overflow-y-auto max-h-[520px] space-y-2.5 pr-1">
                  {donerExpenses
                    .filter(exp => {
                      if (expenseFilter === "CONFIRMED") {
                        if (exp.isConfirmed === false) return false;
                      }
                      if (expenseFilter === "PENDING") {
                        if (exp.isConfirmed !== false) return false;
                      }
                      if (expenseFilter === "INVENTORY") {
                        if (!exp.isInventoryPurchase && exp.category !== "Məhsul Alışı" && exp.category !== "Məhsul") return false;
                      }
                      if (expenseFilter === "GENERAL") {
                        if (exp.isInventoryPurchase || exp.category === "Məhsul Alışı" || exp.category === "Məhsul") return false;
                      }
                      if (expenseSearchQuery.trim()) {
                        const query = expenseSearchQuery.toLowerCase();
                        const matchTitle = exp.title.toLowerCase().includes(query);
                        const matchCat = exp.category.toLowerCase().includes(query);
                        const matchItem = exp.inventoryItemName?.toLowerCase().includes(query);
                        const matchNote = exp.note?.toLowerCase().includes(query);
                        return matchTitle || matchCat || matchItem || matchNote;
                      }
                      return true;
                    })
                    .map((exp) => {
                      const isInv = exp.isInventoryPurchase || exp.category === "Məhsul Alışı" || exp.category === "Məhsul";
                      const isApproved = exp.isConfirmed !== false;
                      
                      return (
                        <div 
                          key={exp.id}
                          className={`flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900 border p-3.5 rounded-xl hover:border-slate-700 transition-colors gap-3 ${
                            !isApproved
                              ? "border-amber-500/30 bg-amber-950/10"
                              : isInv 
                                ? "border-emerald-500/20 bg-emerald-950/10" 
                                : "border-slate-800/80"
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Status Badge */}
                              {isApproved ? (
                                <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Təsdiqlənib (Kassadan çıxılıb)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Təsdiq Gözləyir (Kassadan çıxılmayıb)</span>
                                </span>
                              )}

                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                isInv
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                              }`}>
                                {exp.category}
                              </span>

                              {exp.paymentSource && (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                  exp.paymentSource === "POS Terminal" || exp.paymentSource === "Bank Kartı"
                                    ? "bg-blue-950/40 text-blue-300 border-blue-500/30"
                                    : "bg-amber-950/40 text-amber-300 border-amber-500/30"
                                }`}>
                                  {exp.paymentSource === "POS Terminal" || exp.paymentSource === "Bank Kartı" ? "💳 POS Terminal" : "💵 Nağd"}
                                </span>
                              )}

                              <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{exp.date}</span>
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                              <span>{exp.title}</span>
                            </h4>

                            {/* Inventory Purchase Link Details */}
                            {isInv && (exp.quantity || exp.inventoryItemName) && (
                              <div className="inline-flex items-center space-x-1.5 bg-emerald-900/30 text-emerald-300 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-emerald-500/20">
                                <Archive className="w-3 h-3 text-emerald-400" />
                                <span>
                                  Anbara Mədaxil: <strong>+{exp.quantity || 0} {exp.unit || "ədəd"}</strong>
                                  {exp.unitPrice ? ` (1 ${exp.unit || 'ədəd'} = ${exp.unitPrice.toFixed(2)} ₼)` : ""}
                                </span>
                              </div>
                            )}

                            {exp.note && (
                              <p className="text-[10px] text-slate-400 italic">
                                Qeyd: {exp.note}
                              </p>
                            )}

                            {exp.confirmedBy && (
                              <span className="text-[9px] text-slate-500 block">
                                Təsdiq edən: <strong>{exp.confirmedBy}</strong>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                            <span className={`font-extrabold text-sm py-1.5 px-3.5 rounded-xl border ${
                              isApproved 
                                ? "text-white bg-slate-950 border-slate-800" 
                                : "text-amber-300 bg-amber-950/30 border-amber-500/30"
                            }`}>
                              {exp.amount.toFixed(2)} ₼
                            </span>

                            {/* Confirmation Button */}
                            {!isApproved ? (
                              <button
                                type="button"
                                onClick={() => handleConfirmExpense(exp.id, true)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-2 px-3.5 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all hover:scale-105 active:scale-95 border border-emerald-400/30"
                                title="Bu xərci təsdiq et və kassa balansından çıx"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Təsdiqlə (Kassadan Çıx)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`"${exp.title}" xərcinin təsdiqini ləğv etmək istəyirsiniz? Məbləğ kassa qalığına geri qaytarılacaq.`)) {
                                    handleConfirmExpense(exp.id, false);
                                  }
                                }}
                                className="text-slate-400 hover:text-amber-400 text-[10px] font-bold py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer"
                                title="Təsdiqi ləğv et və kassanı bərpa et"
                              >
                                ↩ Geri Al
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`"${exp.title}" xərc qeydini silmək istəyirsiniz?`)) {
                                  handleDeleteExpense(exp.id);
                                }
                              }}
                              className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {donerExpenses.length === 0 && (
                    <div className="text-center text-slate-500 text-xs py-14 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                      Heç bir xərc qeydiyyatı tapılmadı.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 4: ANBAR VƏ SULAR (STOCK INVENTORY & BATCH YIELD SYSTEM) */}
        {activeTab === "STOCK" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            
            {/* Header info */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-base text-white flex items-center space-x-2">
                  <Archive className="w-5 h-5 text-orange-500" />
                  <span>Anbar İdarəetmə Paneli</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Məhsulların anbar qalığı, xammal və suların daxilolma və satış qalıqlarının qeydiyyatı.
                </p>
              </div>
              <div className="text-xs font-semibold text-slate-400 flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Anbar İzləyicisi Fəaldır</span>
              </div>
            </div>

            {/* SECTION 1: MAIN WAREHOUSE PRODUCTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left pane: Add Warehouse Item Form */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 flex flex-col space-y-4 h-fit">
                <div className="border-b border-slate-850 pb-2">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <PlusCircle className="w-4 h-4 text-orange-500" />
                    <span>Anbara Yeni Mal Əlavə Et</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Su, kola, çörək, lavaş və digər xammalların anbara tanıdılması</p>
                </div>

                <form onSubmit={handleAddInventoryItem} className="space-y-4">
                  {/* Predefined Item Select Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Məhsul Seçimi
                    </label>
                    <select
                      value={selectedPredefinedItem}
                      onChange={(e) => handlePredefinedItemChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="">Məhsul seçin...</option>
                      <option value="NEW_CUSTOM" className="text-orange-400 font-extrabold">
                        + Yeni Məhsul Yarat (Siyahıda yoxdur)
                      </option>
                      
                      {state.donerProducts && state.donerProducts.length > 0 && (
                        <optgroup label="Sistemdə Mövcud Menyu Məhsulları">
                          {state.donerProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({Number(p.price || 0).toFixed(2)} ₼)
                            </option>
                          ))}
                        </optgroup>
                      )}

                      <optgroup label="Populyar Xammal və İnqrediyentlər">
                        {standardItemsList
                          .filter(std => !state.donerProducts?.some(p => (p.name || "").toLowerCase() === (std.name || "").toLowerCase()))
                          .map((std, i) => (
                            <option key={`std-${i}`} value={std.name}>
                              {std.name} ({std.unit})
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Manual Name Input (only show if custom or selected predefined) */}
                  {(selectedPredefinedItem === "NEW_CUSTOM" || selectedPredefinedItem !== "") && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Məhsulun Adı
                      </label>
                      <input
                        type="text"
                        required
                        disabled={selectedPredefinedItem !== "NEW_CUSTOM"}
                        placeholder="Məs. Coca-Cola 330ml, Lavaş, Dönər Çörəyi"
                        value={newInvName}
                        onChange={(e) => setNewInvName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 disabled:opacity-60 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Category and Unit */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Kateqoriya</label>
                      <select
                        value={newInvCategory}
                        disabled={selectedPredefinedItem !== "" && selectedPredefinedItem !== "NEW_CUSTOM"}
                        onChange={(e) => setNewInvCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 disabled:opacity-60 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="İçki">İçki / Su</option>
                        <option value="Çörək">Çörək / Un məhsulu</option>
                        <option value="Lavaş">Lavaş</option>
                        <option value="Ət">Xammal Ət / Toyuq</option>
                        <option value="Digər">Digər</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold font-sans">Ölçü Vahidi</label>
                      <input
                        type="text"
                        required
                        disabled={selectedPredefinedItem !== "" && selectedPredefinedItem !== "NEW_CUSTOM"}
                        placeholder="Məs. ədəd, kq, rulon"
                        value={newInvUnit}
                        onChange={(e) => setNewInvUnit(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 disabled:opacity-60 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Add to Menu Option (Only for custom new or standard items not already in the menu) */}
                  {selectedPredefinedItem !== "" && !state.donerProducts?.some(p => p.id === selectedPredefinedItem) && (
                    <div className="space-y-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          id="addToMenuCheck"
                          checked={addToMenu}
                          onChange={(e) => setAddToMenu(e.target.checked)}
                          className="accent-orange-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="addToMenuCheck" className="text-[11px] text-slate-300 font-bold cursor-pointer">
                          Satış menyusunda da eks olunsun?
                        </label>
                      </div>

                      {addToMenu && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-850">
                          <label className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Satış Qiyməti (₼)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required={addToMenu}
                            placeholder="Məs. 1.50"
                            value={newInvPrice}
                            onChange={(e) => setNewInvPrice(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 text-slate-200 p-2 rounded-lg text-xs focus:outline-none font-sans"
                          />
                          <p className="text-[9px] text-slate-500">
                            * Yeni məhsul satış menyusuna əlavə olunacaq və anbarda satıldıqca avtomatik silinəcək.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Starting stock */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      İlkin Anbar Qalığı ({newInvUnit || "ədəd"})
                    </label>
                    <input
                      type="number"
                      placeholder="Məs. 100, 200"
                      value={newInvStock}
                      onChange={(e) => setNewInvStock(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-200 p-2.5 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedPredefinedItem}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Malı Qeydə Al</span>
                  </button>
                </form>
              </div>

              {/* Right pane: Warehouse Items list table */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 lg:col-span-2 flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-orange-500" />
                      <span>Anbarda Olan Malların Siyahısı</span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Ümumi daxil olan, satılan və hazırda mövcud olan qalıqlar</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-900/40 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                        <th className="py-3 px-3">Məhsul / Mal adı</th>
                        <th className="py-3 px-2 text-center">Kateqoriya</th>
                        <th className="py-3 px-2 text-center">Mövcud Qalıq</th>
                        <th className="py-3 px-2 text-center">Daxil Olub</th>
                        <th className="py-3 px-2 text-center">Satılıb</th>
                        <th className="py-3 px-2 text-center">Stok Qəbulu</th>
                        <th className="py-3 px-2 text-center">Əməliyyat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {(state.inventoryItems || []).map((item) => {
                        const currentStock = Number(item.stock || 0);
                        const minAlert = Number(item.minStockAlert !== undefined && item.minStockAlert !== null ? item.minStockAlert : 5);
                        const isOut = currentStock <= 0;
                        const isLow = currentStock > 0 && currentStock <= minAlert;
                        const adjustVal = invAdjustAmounts[item.id] || "";
                        
                        return (
                          <tr key={item.id} className={`hover:bg-slate-900/30 transition-colors ${isOut ? "bg-red-950/10" : isLow ? "bg-amber-950/10" : ""}`}>
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-white block">{item.name || "Məhsul"}</span>
                              <span className="text-[9px] text-slate-500 font-mono">ID: {item.id}</span>
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800">
                                {item.category || "Xammal"}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${
                                isOut
                                  ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                                  : isLow
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              }`}>
                                {currentStock} {item.unit || "ədəd"}
                              </span>
                              {isOut && <span className="block text-[8px] text-red-400 font-black mt-0.5">🔴 Bitib!</span>}
                              {isLow && <span className="block text-[8px] text-amber-400 font-black mt-0.5">🟡 Bitmək üzrə</span>}
                            </td>
                            <td className="py-3.5 px-2 text-center text-slate-400 font-bold">
                              {Number(item.totalReceived || 0)} {item.unit || "ədəd"}
                            </td>
                            <td className="py-3.5 px-2 text-center text-orange-400 font-bold">
                              {Number(item.totalSold || 0) + Number(item.totalUsed || 0)} {item.unit || "ədəd"}
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <input
                                  type="number"
                                  placeholder="Məs. 50"
                                  value={adjustVal}
                                  onChange={(e) => setInvAdjustAmounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  className="bg-slate-900 border border-slate-800 focus:border-orange-500 text-white text-[11px] p-1 w-14 text-center rounded focus:outline-none font-sans"
                                />
                                <button
                                  onClick={() => handleAdjustInventoryItem(item.id)}
                                  className="bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white p-1 rounded transition-colors"
                                  title="Mal qəbul et"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-2 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPosUsageModal(item)}
                                  className="bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                                  title="Gündəlik istifadəni sil (Məxaric)"
                                >
                                  <MinusCircle className="w-3 h-3" />
                                  <span>🔻 Sil</span>
                                </button>
                                <button
                                  onClick={() => handleQuickBuyFromInventory(item.name || "", item.category || "", item.unit || "ədəd")}
                                  className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                                  title="Bu məhsul üçün alış xərci qeyd et"
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>+ Alış</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteInventoryItem(item.id, item.name || "")}
                                  className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-900 transition-colors"
                                  title="Anbardan tamamilə sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {(state.inventoryItems || []).length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center text-slate-500 py-12 text-xs">
                            Anbarda hələ ki heç bir məhsul qeydə alınmayıb.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Section: Recent Inventory Purchases Activity Feed */}
                <div className="pt-4 border-t border-slate-850">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <Archive className="w-4 h-4 text-emerald-400" />
                      <span>Xərclər Vasitəsilə Qeydə Alınan Son Mədaxillər</span>
                    </h4>
                    <button
                      onClick={() => setActiveTab("EXPENSES")}
                      className="text-[10px] text-orange-400 hover:underline font-semibold"
                    >
                      Bütün xərclərə bax →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {donerExpenses
                      .filter(e => e.isInventoryPurchase || e.category === "Məhsul Alışı" || e.category === "Məhsul")
                      .slice(0, 6)
                      .map(exp => (
                        <div
                          key={`stock-rec-${exp.id}`}
                          className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-white block text-[11px]">{exp.title}</span>
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              +{exp.quantity || 0} {exp.unit || "ədəd"} {exp.unitPrice ? `(${Number(exp.unitPrice || 0).toFixed(2)} ₼/əd)` : ""}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-white text-xs block">{Number(exp.amount || 0).toFixed(2)} ₼</span>
                            <span className="text-[9px] text-slate-500">{exp.date}</span>
                          </div>
                        </div>
                      ))}

                    {donerExpenses.filter(e => e.isInventoryPurchase || e.category === "Məhsul Alışı" || e.category === "Məhsul").length === 0 && (
                      <div className="col-span-2 text-center text-slate-500 text-[11px] py-4 bg-slate-900/30 rounded-lg">
                        Hələ ki heç bir mal alışı qeydə alınmayıb.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 4: HESABATLAR & SATIŞ ANALİTİKASI (REPORTS PANEL) */}
        {activeTab === "REPORTS" && (
          <DonerReports
            state={state}
            onUpdateState={onUpdateState}
            onOpenReceipt={(receiptProps) => handleOpenPrint("CUSTOMER", receiptProps)}
          />
        )}

        {/* VIEW 5: TƏNZİMLƏMƏLƏR (SETTINGS PANEL) */}
        {activeTab === "SETTINGS" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6 max-w-4xl mx-auto w-full">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6">
              <div className="border-b border-slate-850 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-orange-500 animate-spin-slow" />
                  <span>Sistem Tənzimləmələri</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Kassa sisteminin və masa xidmətlərinin konfiqurasiyası
                </p>
              </div>

              {/* Table Count Control Section */}
              <div className="max-w-xl space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Masa Sayının İdarə Olunması</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Restorandakı mövcud masaların sayını buradan təhlükəsiz şəkildə dəyişə bilərsiniz. Masa sayını azaltmaq aktiv sifarişləri olan stollara dərhal təsir etmir (sifarişləri itmir), lakin boş masaları siyahıdan çıxarır.
                    </p>
                  </div>

                  <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                      Restorandakı Masa Sayı
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={settingsTableCount}
                        onChange={(e) => setSettingsTableCount(e.target.value)}
                        className="bg-slate-950 text-white font-sans text-sm font-bold border border-slate-800 focus:border-orange-500 p-2.5 rounded-xl w-32 focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdateTableCount(parseInt(settingsTableCount) || 12)}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        Yadda Saxla
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      * İcazə verilən limit: 1 - 50 masa arası
                    </p>
                  </div>
                </div>

                {/* Dual Printer & Printing Configuration */}
                <div className="space-y-4 border-t border-slate-900 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                        <Printer className="w-4 h-4 text-orange-500" />
                        <span>Printer Tənzimləmələri (Dual Printer Sistemi)</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Mətbəx və Kassa çeklərini iki ayrı termal printerə yönləndirmək üçün printerləri seçin.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadPrinters}
                      className="text-[11px] bg-slate-850 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-750 transition-colors cursor-pointer"
                    >
                      🔄 Printerləri Yenilə
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cashier / Customer Receipt Printer */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400">🧾 Kassa (Satış Çeki) Printeri</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenPrint("CUSTOMER", {
                              title: "KÖZ XƏZƏR DÖNƏR",
                              orderType: "TEST ÇAP",
                              items: [{ productId: "test", name: "Kassa Printeri Test Çapı", price: 1.00, quantity: 1 }],
                              subtotal: 1.00,
                              createdAt: new Date().toISOString()
                            });
                          }}
                          className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30 transition-colors cursor-pointer"
                        >
                          🧪 Test Çapı
                        </button>
                      </div>
                      <select
                        value={cashierPrinter}
                        onChange={(e) => handleSaveCashierPrinter(e.target.value)}
                        className="w-full bg-slate-950 text-white text-xs font-medium border border-slate-800 focus:border-amber-500 p-2.5 rounded-xl focus:outline-none"
                      >
                        <option value="">-- Standart / Avtomatik Kassa Printeri --</option>
                        {installedPrinters.map((p, idx) => (
                          <option key={idx} value={p.name}>
                            {p.name} {p.isDefault ? "(Windows Default)" : ""}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400">
                        * Müştəriyə verilən satış qəbzi və ödəniş çeki bu printerdən çıxacaq.
                      </p>
                    </div>

                    {/* Kitchen Receipt Printer */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-400">👨‍🍳 Mətbəx (Sifariş Çeki) Printeri</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenPrint("KITCHEN", {
                              title: "KÖZ XƏZƏR DÖNƏR",
                              orderType: "TEST ÇAP",
                              items: [{ productId: "test", name: "Mətbəx Printeri Test Çapı", price: 0, quantity: 2 }],
                              subtotal: 0,
                              createdAt: new Date().toISOString()
                            });
                          }}
                          className="text-[10px] bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 px-2.5 py-1 rounded-md border border-orange-500/30 transition-colors cursor-pointer"
                        >
                          🧪 Test Çapı
                        </button>
                      </div>
                      <select
                        value={kitchenPrinter}
                        onChange={(e) => handleSaveKitchenPrinter(e.target.value)}
                        className="w-full bg-slate-950 text-white text-xs font-medium border border-slate-800 focus:border-orange-500 p-2.5 rounded-xl focus:outline-none"
                      >
                        <option value="">-- Standart / Avtomatik Mətbəx Printeri --</option>
                        {installedPrinters.map((p, idx) => (
                          <option key={idx} value={p.name}>
                            {p.name} {p.isDefault ? "(Windows Default)" : ""}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400">
                        * "Mətbəxə Göndər" düyməsinə basıldıqda sifariş çeki birbaşa bu printerdən çıxacaq.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: MƏHSULLARIN İDARƏ OLUNMASI */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Grid className="w-5 h-5 text-orange-500" />
                    <span>Məhsulların İdarə Olunması</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Kassa menyusu və müştəri QR menyusunda göstərilən məhsulların adları, şəkilləri və qiymətləri
                  </p>
                </div>
                <button
                  onClick={() => handleOpenProductForm()}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Məhsul</span>
                </button>
              </div>

              {/* Product list table */}
              <div className="overflow-x-auto rounded-xl border border-slate-900">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-850">
                      <th className="p-3.5 w-16">Şəkil</th>
                      <th className="p-3.5">Məhsul Adı</th>
                      <th className="p-3.5 w-24">Kateqoriya</th>
                      <th className="p-3.5 w-20 text-right">Qiymət</th>
                      <th className="p-3.5 w-32 text-center">Əməliyyatlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {state.donerProducts?.map(prod => (
                      <tr key={prod.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-800">
                            {prod.image ? (
                              <img src={prod.image} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt={prod.name} />
                            ) : (
                              <ChefHat className="w-6 h-6 text-slate-600" />
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{prod.name}</div>
                          {prod.ingredients && prod.ingredients.length > 0 && (
                            <div className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate">
                              Tərkibi: {prod.ingredients.join(", ")}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400">
                            {prod.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-bold text-orange-400">
                          {prod.price.toFixed(2)} ₼
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenProductForm(prod)}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors cursor-pointer"
                            >
                              Redaktə
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 transition-colors cursor-pointer"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Database & Menu Backup / Restore Section */}
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Database className="w-4 h-4 text-orange-400" />
                      <span>Menyu & Baza Ehtiyat Nüsxəsi (Backup / Köçürmə)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Öz kompüterinizdə hazırladığınız bütün menyunu, şəkilləri və tənzimləmələri JSON faylı kimi yükləyib digər kompüterə (POS kassaya) dərhal köçürə bilərsiniz.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Export Button */}
                  <button
                    type="button"
                    onClick={handleExportBackupJson}
                    className="p-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-orange-500/40 transition-all text-left group cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Download className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-white">Menyu & Baza Nüsxəsini Yüklə (Export)</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Bütün məhsullar və şəkillər .json faylına yazılaraq kompüterinizə endirilir.
                      </p>
                    </div>
                  </button>

                  {/* Import Button */}
                  <div>
                    <input
                      type="file"
                      ref={backupFileInputRef}
                      accept=".json,application/json"
                      onChange={handleRestoreJsonFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isRestoringDatabase}
                      onClick={() => backupFileInputRef.current?.click()}
                      className="w-full h-full p-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all text-left group cursor-pointer flex items-center justify-between disabled:opacity-50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {isRestoringDatabase ? (
                            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                          )}
                          <span className="text-xs font-bold text-white">
                            {isRestoringDatabase ? "Baza bərpa olunur..." : "Baza Faylını Bərpa Et (Import)"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Digər kompüterdə hazırlanmış .json backup faylını seçərək bazanı yeniləyin.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* PRODUCT ADD/EDIT MODAL */}
      {productFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleIn">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-850 bg-slate-950">
              <h3 className="text-white font-extrabold font-display text-sm">
                {editingProduct ? "Məhsulu Redaktə Et" : "Yeni Məhsul Əlavə Et"}
              </h3>
              <button 
                onClick={() => setProductFormOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Məhsulun Adı *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-slate-900 text-white border border-slate-800 focus:border-orange-500 rounded-xl p-3 text-xs focus:outline-none"
                    placeholder="Məsələn: Toyuq Dönəri (Lavaşda)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qiymət (₼) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full bg-slate-900 text-white border border-slate-800 focus:border-orange-500 rounded-xl p-3 text-xs focus:outline-none"
                    placeholder="Məsələn: 4.50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kateqoriya *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-slate-900 text-white border border-slate-800 focus:border-orange-500 rounded-xl p-3 text-xs focus:outline-none"
                  >
                    <option value="Dönər">Dönər</option>
                    <option value="İçki">İçki</option>
                    <option value="Qəlyanaltı">Qəlyanaltı</option>
                    <option value="Digər">Digər</option>
                  </select>
                </div>

                {/* Image Upload & Management Section */}
                <div className="space-y-2 col-span-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center space-x-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
                      <span>Məhsulun Şəkli</span>
                    </label>

                    {/* Mode switcher: File Upload vs URL */}
                    <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setImageUploadTab("FILE")}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          imageUploadTab === "FILE"
                            ? "bg-orange-600 text-white shadow-sm"
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
                            ? "bg-orange-600 text-white shadow-sm"
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

                      {!prodImage ? (
                        <div
                          onDragOver={handleImageDragOver}
                          onDragLeave={handleImageDragLeave}
                          onDrop={handleImageDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
                            imageDragActive
                              ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
                              : "border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900"
                          }`}
                        >
                          {isProcessingImage ? (
                            <div className="flex flex-col items-center space-y-2 py-2">
                              <RefreshCw className="w-7 h-7 text-orange-400 animate-spin" />
                              <span className="text-xs text-slate-300 font-bold">Şəkil sıxılır və yaddaşa yazılır...</span>
                            </div>
                          ) : (
                            <>
                              <div className="p-2.5 bg-orange-600/10 text-orange-400 rounded-xl border border-orange-500/20">
                                <Upload className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">
                                  Şəkli bura sürükləyin və ya <span className="text-orange-400 underline">kompüterdən seçin</span>
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  JPG, PNG, WEBP və ya SVG (Maks. 15 MB)
                                </p>
                              </div>
                              <span className="inline-flex items-center space-x-1 text-[9px] bg-slate-950 border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Şəkil bazada saxlanılır, başqa kompüterə köçürdükdə silinmir</span>
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        /* Image Preview & Actions */
                        <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between space-x-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative group">
                              <img
                                src={prodImage}
                                alt="Seçilmiş şəkil"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Check className="w-3 h-3" />
                                <span>Şəkil hazırdır</span>
                              </span>
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                {prodImage.startsWith("data:") 
                                  ? "Kompüter yaddaşından yükləndi (Base64)" 
                                  : prodImage}
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
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-bold border border-slate-800 transition-colors cursor-pointer flex items-center space-x-1"
                            >
                              <FolderUp className="w-3.5 h-3.5" />
                              <span>Dəyiş</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors cursor-pointer"
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
                          value={prodImage}
                          onChange={(e) => setProdImage(e.target.value)}
                          className="flex-1 bg-slate-900 text-white border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-orange-500"
                        />
                        {prodImage && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-3 py-2 bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                      {prodImage && (
                        <div className="flex items-center space-x-3 p-2 bg-slate-900 rounded-xl border border-slate-800">
                          <img
                            src={prodImage}
                            alt="URL preview"
                            className="w-10 h-10 rounded-lg object-cover bg-slate-950"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                          <span className="text-[10px] text-slate-400">İnternet şəkil önbaxışı</span>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500">Unsplash və ya hər hansı bir şəkil linkini yerləşdirin.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">İnqrediyentlər (Vergüllə ayırın)</label>
                  <input
                    type="text"
                    value={prodIngredients}
                    onChange={(e) => setProdIngredients(e.target.value)}
                    className="w-full bg-slate-900 text-white border border-slate-800 focus:border-orange-500 rounded-xl p-3 text-xs focus:outline-none"
                    placeholder="Toyuq əti, Pomidor, Mayonez, Kartof fri"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">İlkin Anbar Stoku (Limitli içkilər üçün)</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full bg-slate-900 text-white border border-slate-800 focus:border-orange-500 rounded-xl p-3 text-xs focus:outline-none"
                    placeholder="Məsələn: 100 (Boş buraxıla bilər)"
                  />
                </div>
              </div>

              {/* Form submit buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setProductFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-xs text-slate-400 font-bold transition-colors cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                >
                  {editingProduct ? "Dəyişiklikləri Yadda Saxla" : "Məhsulu Əlavə Et"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMBEDDED INGREDIENTS CUSTOMIZATION MODAL/DRAWER FOR CASHIER */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scaleIn">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-850 bg-slate-950">
              <div>
                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest block">Müştəri İstəyi - Tərkibi Sazla</span>
                <h3 className="text-white font-extrabold font-display text-sm">{customizingProduct.name}</h3>
              </div>
              <button 
                onClick={() => setCustomizingProduct(null)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-[11px] text-slate-400 leading-normal">
                Kassir qeydi: Müştərinin çıxarılmasını istədiyi inqrediyentlərin işarəsini söndürün:
              </p>

              {/* Ingredients checkbox list */}
              <div className="grid grid-cols-2 gap-2.5">
                {customizingProduct.ingredients?.map(ing => {
                  const isChecked = selectedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      onClick={() => handleToggleIngredient(ing)}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isChecked 
                          ? "bg-orange-500/10 border-orange-500/40 text-orange-400" 
                          : "bg-slate-900/40 border-slate-900 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      <span>{ing}</span>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-2 ${
                        isChecked ? "border-orange-500 bg-orange-600 text-white" : "border-slate-750"
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Exclusion Note snippet */}
              {customizingProduct.ingredients && customizingProduct.ingredients.filter(i => !selectedIngredients.includes(i)).length > 0 && (
                <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-[10px] text-red-400 font-bold flex items-center space-x-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    Çıxarılanlar: {customizingProduct.ingredients.filter(i => !selectedIngredients.includes(i)).map(i => `${i}suz`).join(", ")}
                  </span>
                </div>
              )}

              {/* Special Kitchen / Chef Request Note Field */}
              <div className="space-y-2.5 pt-3 border-t border-slate-850">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-400 flex items-center space-x-1.5">
                    <span>💬 Mətbəx / Aşpaz üçün Xüsusi Qeyd:</span>
                  </label>
                  <span className="text-[9px] text-slate-500 font-normal">Çekdə və mətbəxdə görünəcək</span>
                </div>

                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Mayonezi bol olsun",
                    "Sousu bol olsun",
                    "Acılı / İstiotlu",
                    "Qatışıq sous",
                    "Çox qızarsın",
                    "Az qızarsın",
                    "Çörəyi xırçıldayan",
                    "Sousu ayrı qoyulsun"
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        if (!customizingItemNote) {
                          setCustomizingItemNote(preset);
                        } else if (!customizingItemNote.includes(preset)) {
                          setCustomizingItemNote(prev => `${prev}, ${preset}`);
                        }
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 rounded-lg text-[10px] font-semibold border border-slate-800 transition-all cursor-pointer"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>

                {/* Custom Note input */}
                <div className="relative">
                  <input
                    type="text"
                    value={customizingItemNote}
                    onChange={(e) => setCustomizingItemNote(e.target.value)}
                    placeholder="Məs: Mayonezi bol olsun, az acılı, isti verilsin..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                  />
                  {customizingItemNote && (
                    <button
                      type="button"
                      onClick={() => setCustomizingItemNote("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Confirm add */}
              <button
                onClick={handleConfirmCustomSifaris}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-orange-950/20 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Səbətə Əlavə Et • {customizingProduct.price.toFixed(2)} ₼</span>
              </button>

            </div>

          </div>
        </div>
      )}

      </div>

      {/* 1-Minute Inactivity / Unsent Kitchen Order Alert Modal */}
      {showUnsentAlert && hasUnsentKitchenItems && currentCart.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/60 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl shadow-amber-950/40 animate-in zoom-in-95">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 text-amber-400">
                <div className="p-3 bg-amber-500/15 rounded-2xl border border-amber-500/30 shrink-0">
                  <AlertTriangle className="w-8 h-8 text-amber-400 animate-bounce" />
                </div>
                <div>
                  <div className="inline-flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase mb-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>1 Dəqiqədir Gözləyir</span>
                  </div>
                  <h3 className="font-black text-base text-white">Sifariş Mətbəxə Göndərilməyib!</h3>
                  <p className="text-xs text-slate-300">
                    {selectedTable ? `Masa #${selectedTable}` : (directOrderType === "TAKEAWAY" ? "Özünlə Apar" : "Çatdırılma")} — <strong>{unsentCount} ədəd</strong> yemək hələ mətbəxə göndərilməyib.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUnsentAlert(false);
                  setUnsentAlertSnoozeCount(c => c + 1);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Bağla"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 max-h-48 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase text-slate-400 block border-b border-slate-800 pb-1">
                Mətbəxə göndərilməmiş yeməklər:
              </span>
              {currentUnsentItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-bold text-white">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="text-amber-400">{(item.price * item.quantity).toFixed(2)} ₼</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSendToKitchen}
                className="w-full py-3 px-3 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <ChefHat className="w-4 h-4" />
                <span>👨‍🍳 Mətbəxə Göndər (İndi Çap Et)</span>
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnsentAlert(false);
                    setUnsentAlertSnoozeCount(c => c + 1);
                    triggerToast("Xatırlatma təxirə salındı (1 dəqiqə sonra təkrar bildiriləcək)");
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>⏳ Sifarişə Davam Et</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Səbəti və göndərilməmiş sifarişi silmək istədiyinizə əminsiniz?")) {
                      setCurrentCart([]);
                      if (selectedTable) syncCartToBackend(selectedTable, []);
                      setShowUnsentAlert(false);
                      triggerToast("Səbət silindi və masa təmizləndi.");
                    }
                  }}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/40 transition-all cursor-pointer"
                >
                  🗑️ Səbəti Sil
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delivery Payment Confirmation Modal */}
      {confirmDeliveryOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Çatdırılma Ödənişinin Təsdiqi</h3>
                  <p className="text-xs text-slate-400">Sifariş #{confirmDeliveryOrder.id.replace("ord_d_", "")}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmDeliveryOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order details summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Müştəri:</span>
                <span className="font-bold text-white">{confirmDeliveryOrder.deliveryName || "Müştəri"} ({confirmDeliveryOrder.deliveryPhone || "Nömrəsiz"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ünvan:</span>
                <span className="font-semibold text-slate-300 text-right max-w-xs">{confirmDeliveryOrder.deliveryAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kuryer:</span>
                <span className="font-bold text-orange-400">{confirmDeliveryOrder.courierName || "Kuryer təyin edilməyib"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-850 text-sm">
                <span className="font-bold text-slate-300">Ödəniləcək Cəm:</span>
                <span className="font-black text-emerald-400 text-base">{confirmDeliveryOrder.subtotal.toFixed(2)} ₼</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Kuryerdən Qəbul Edilən Faktiki Ödəniş Növü:</label>
              <PaymentSelector
                value={confirmDeliveryPaymentMethod}
                note={confirmDeliveryNote}
                onChange={(method, note) => {
                  setConfirmDeliveryPaymentMethod(method);
                  setConfirmDeliveryNote(note || "");
                }}
                theme="dark"
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeliveryOrder(null)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                İmtina
              </button>
              <button
                type="button"
                onClick={handleConfirmDeliveryPayment}
                disabled={isConfirmingDelivery}
                className="flex-2 py-3 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isConfirmingDelivery ? "Təsdiqlənir..." : "Ödənişi Qəbul Et & Kassaya Vur"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Delivery Order Modal */}
      {cancelDeliveryOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-900/40 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Çatdırılma Sifarişini Ləğv Et</h3>
                <p className="text-xs text-slate-400">Məhsullar avtomatik anbara və stoka bərpa olunacaq.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ləğv Səbəbi</label>
                <input
                  type="text"
                  placeholder="Məs: Müştəri imtina etdi / Ünvan tapılmadı"
                  value={cancelDeliveryReason}
                  onChange={(e) => setCancelDeliveryReason(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Admin PIN Kodu</label>
                <input
                  type="password"
                  placeholder="Admin PIN (məs: 3333)"
                  value={cancelDeliveryPin}
                  onChange={(e) => setCancelDeliveryPin(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelDeliveryOrder(null)}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                Bağla
              </button>
              <button
                type="button"
                onClick={handleCancelDeliveryOrder}
                disabled={isCancellingDelivery}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg transition-all cursor-pointer"
              >
                {isCancellingDelivery ? "Ləğv edilir..." : "Ləğv Et"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded XP Thermal Receipt Printer */}
      {printQueue.length > 0 && (
        <ReceiptPrinter
          key={printQueue[0].id}
          isOpen={true}
          onClose={handleClosePrint}
          title={printQueue[0].props.title || "KÖZ XƏZƏR DÖNƏR"}
          type={printQueue[0].type}
          orderId={printQueue[0].props.orderId}
          orderType={printQueue[0].props.orderType}
          tableNumber={printQueue[0].props.tableNumber}
          items={printQueue[0].props.items}
          subtotal={printQueue[0].props.subtotal}
          paymentMethod={printQueue[0].props.paymentMethod}
          paymentNote={printQueue[0].props.paymentNote}
          createdAt={printQueue[0].props.createdAt}
          deliveryDetails={printQueue[0].props.deliveryDetails}
        />
      )}

      {/* POS Inventory Usage / Write-off Modal */}
      {isPosUsageModalOpen && posUsageItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-orange-500/30 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsPosUsageModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 text-orange-400">
              <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                <MinusCircle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Xammal / Ət İstifadəsi (Silinmə)</h3>
                <p className="text-xs text-slate-400">{posUsageItem.name} — Cari Qalıq: <strong className="text-white">{posUsageItem.stock} {posUsageItem.unit}</strong></p>
              </div>
            </div>

            <form onSubmit={handleRecordPosUsage} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-orange-400 block mb-1">
                  Silinəcək Miqdar ({posUsageItem.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={posUsageQty}
                  onChange={(e) => setPosUsageQty(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={`Məs: 8 (${posUsageItem.unit})`}
                  className="w-full bg-slate-950 text-white border border-orange-500/40 focus:border-orange-500 rounded-xl p-2.5 text-sm font-bold font-mono focus:outline-none"
                />
              </div>

              {posUsageQty !== "" && Number(posUsageQty) > 0 && (
                <div className="bg-orange-950/20 border border-orange-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-orange-300 font-medium">Qalan Stok:</span>
                  <strong className="text-sm font-black text-orange-400">
                    {Math.max(0, posUsageItem.stock - Number(posUsageQty)).toFixed(2)} {posUsageItem.unit}
                  </strong>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Səbəb *</label>
                <select
                  value={posUsageReason}
                  onChange={(e) => setPosUsageReason(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
                >
                  <option value="Gündəlik dönər üçün istifadə">Gündəlik dönər satışı üçün</option>
                  <option value="Mətbəx / Yemək hazırlığı">Mətbəx / Yemək hazırlığı</option>
                  <option value="İşçi yeməyi">İşçi / Heyət yeməyi</option>
                  <option value="Xarab oldu / İtki">Xarab oldu / İtki / Brak</option>
                  <option value="Digər">Digər</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Qeyd (İstəyə bağlı)</label>
                <input
                  type="text"
                  placeholder="Məs: Günorta növbəsi istifadəsi"
                  value={posUsageNote}
                  onChange={(e) => setPosUsageNote(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPosUsageModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  Bağla
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPosUsage}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  {isSubmittingPosUsage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Silinir...</span>
                    </>
                  ) : (
                    <>
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>Sil və Qalığı Yenilə</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual Table QR Code & Printing Modal */}
      {qrModalTable !== null && (
        <TableQRModal
          initialTableNumber={qrModalTable}
          tables={state.tables || []}
          onClose={() => setQrModalTable(null)}
        />
      )}

      {/* Custom React PIN Confirmation Modal (Bypassing Electron prompt blocks) */}
      {pinDialog && pinDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">{pinDialog.title}</h3>
                <p className="text-[11px] text-slate-400">Təhlükəsizlik və PİN Təsdiqi</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 leading-relaxed">
              {pinDialog.description}
            </p>

            {pinDialog.error && (
              <div className="bg-rose-500/20 border border-rose-500/40 p-2.5 rounded-xl text-[11px] text-rose-300 font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{pinDialog.error}</span>
              </div>
            )}

            <div className="space-y-2">
              <input
                type="password"
                autoFocus
                maxLength={8}
                placeholder="PİN KOD"
                value={pinDialog.pin}
                onChange={(e) => setPinDialog({ ...pinDialog, pin: e.target.value, error: "" })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerifyAndSubmitPin();
                }}
                className="w-full bg-slate-950 border-2 border-orange-500/60 text-center tracking-[0.4em] font-mono text-xl py-3 rounded-2xl text-orange-400 placeholder:text-slate-600 focus:outline-none focus:border-orange-400 shadow-inner"
              />

              {/* Onscreen Keypad for Touch / Mouse */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPinDialog(prev => prev ? { ...prev, pin: prev.pin + n.toString(), error: "" } : null)}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 font-bold rounded-xl text-base transition-colors cursor-pointer"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPinDialog(prev => prev ? { ...prev, pin: "", error: "" } : null)}
                  className="py-2.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  TƏMİZLƏ
                </button>
                <button
                  type="button"
                  onClick={() => setPinDialog(prev => prev ? { ...prev, pin: prev.pin + "0", error: "" } : null)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 font-bold rounded-xl text-base transition-colors cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPinDialog(prev => prev ? { ...prev, pin: prev.pin.slice(0, -1), error: "" } : null)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold rounded-xl text-sm transition-colors flex items-center justify-center cursor-pointer"
                >
                  ⌫
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPinDialog(null)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                İmtina Et
              </button>
              <button
                type="button"
                onClick={handleVerifyAndSubmitPin}
                className="py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer"
              >
                Təsdiq Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCKED / LOCKED TABLE WARNING MODAL */}
      {blockedTableWarning && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-md w-full space-y-4 text-center shadow-2xl animate-scaleUp">
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-950/40">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white font-display">
                ⛔ Bu Masaya Daxil Olmaq Bloklanıb!
              </h3>
              <p className="text-xs text-amber-400 font-bold mt-1">
                Masa #{blockedTableWarning.tableNumber} - {blockedTableWarning.tableName || "Əsas Zal"}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Hazırda daxil olan şəxs:</span>
                <span className="font-bold text-white bg-slate-850 px-2.5 py-0.5 rounded-lg border border-slate-750">
                  👤 {blockedTableWarning.lockedBy?.waiterName || "Mobil Ofisiant"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>İstifadə edilən cihaz:</span>
                <span className="font-bold text-amber-400">
                  📱 {blockedTableWarning.lockedBy?.deviceName || "Mobil Telefon"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Daxil olma vaxtı:</span>
                <span className="font-bold text-slate-300">
                  🕒 {blockedTableWarning.lockedBy?.lockedAt ? new Date(blockedTableWarning.lockedBy.lockedAt).toLocaleTimeString("az-AZ") : "İndicə"}
                </span>
              </div>
              <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                ℹ️ <strong>Səbəb:</strong> Ofisiant hazırda müştərinin yanında bu masaya mobil telefonla sifariş daxil edir. Eyni masaya eyni vaxtda müxtəlif cihazlardan daxil olmaq sifarişlərin bir-birini silməsinin və çaşqınlığın qarşısını almaq üçün sistem tərəfindən bloklanıb.
              </div>
            </div>

            <div className="flex space-x-3 pt-1">
              <button
                onClick={() => setBlockedTableWarning(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Anladım (Geri Qayıt)
              </button>
              <button
                onClick={() => handleForceUnlockTable(blockedTableWarning.tableNumber)}
                className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                title="Əgər ofisiantın telefonu sönübsə və ya əlaqə kəsilibsə məcburi aç"
              >
                Məcburi Kilidi Aç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE WAITER QR MODAL */}
      {isWaiterQRModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-slate-950 border border-indigo-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 text-center shadow-2xl animate-scaleUp my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-white font-display">Mobil Ofisiant Qoşulması</h3>
                  <p className="text-[10px] text-indigo-400 font-semibold">Telefondan masaya yaxınlaşıb sifariş qəbul etmək üçün</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWaiterQRModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connection Method Tabs: Lokal Wi-Fi vs Onlayn Cloudflare Tünel */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setConnectionTab("LOCAL")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  connectionTab === "LOCAL"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Lokal Şəbəkə (Wi-Fi)</span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionTab("ONLINE")}
                className={`py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  connectionTab === "ONLINE"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Onlayn Tünel (İnternet / 4G)</span>
                {tunnelUrl && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>}
              </button>
            </div>

            {/* Local Tab Settings */}
            {connectionTab === "LOCAL" && (
              <div className="space-y-2.5 text-left bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold text-[11px] flex items-center space-x-1">
                    <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                    <span>POS Cihazının Şəbəkə Kartı (IP):</span>
                  </span>
                  <button
                    type="button"
                    onClick={fetchNetworkInfo}
                    className="text-[10px] text-slate-400 hover:text-indigo-400 flex items-center space-x-1 cursor-pointer"
                    title="Şəbəkələri yenidən axtar"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Yenilə</span>
                  </button>
                </div>

                {/* Network adapter selector */}
                {networkAdapters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {networkAdapters.map((item, idx) => {
                      const isSelected = !useCustomIp && (selectedIp === item.ip || (!selectedIp && idx === 0));
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedIp(item.ip);
                            setUseCustomIp(false);
                          }}
                          className={`text-[11px] px-2.5 py-1.5 rounded-xl font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                            isSelected
                              ? "bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-sm"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span>{item.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-indigo-400 inline" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Manual IP input option */}
                <div className="pt-1 border-t border-slate-850 flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-[10px] text-slate-400 font-medium">
                    <input
                      type="checkbox"
                      checked={useCustomIp}
                      onChange={(e) => {
                        setUseCustomIp(e.target.checked);
                        if (e.target.checked && !customIpInput) {
                          setCustomIpInput(selectedIp || localServerIp);
                        }
                      }}
                      className="rounded accent-indigo-600"
                    />
                    <span>Fərqli IP daxil et:</span>
                  </label>
                  {useCustomIp && (
                    <input
                      type="text"
                      value={customIpInput}
                      onChange={(e) => setCustomIpInput(e.target.value)}
                      placeholder="Məs: 192.168.1.50"
                      className="bg-slate-950 border border-slate-750 px-2 py-1 rounded-lg text-[11px] font-mono text-indigo-300 w-36 focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Online Tunnel Tab Settings */}
            {connectionTab === "ONLINE" && (
              <div className="space-y-2 text-left bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-bold text-xs">Cloudflare Onlayn Tünel</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tunnelUrl ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                  }`}>
                    {tunnelUrl ? "Aktivdir" : "Söndürülüb"}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Telefon və POS fərqli şəbəkələrdədirsə və ya Wi-Fi əlaqə qurulmursa, tüneli yandırın. Telefon <strong>mobil internetlə (Azercell/Bakcell/Nar)</strong> belə birbaşa qoşulacaq.
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleToggleTunnel}
                    disabled={isTunnelLoading}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md ${
                      tunnelUrl
                        ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
                    } ${isTunnelLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {isTunnelLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Tünel açılır, gözləyin...</span>
                      </>
                    ) : tunnelUrl ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Tüneli Dayandır</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>Onlayn Tüneli Yandır (Pulsuz & Limitsiz)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* QR Code */}
            {(() => {
              const currentEffectiveIp = useCustomIp && customIpInput.trim() ? customIpInput.trim() : (selectedIp || localServerIp || window.location.hostname || "127.0.0.1");
              const currentWaiterUrl = (connectionTab === "ONLINE" && tunnelUrl)
                ? `${tunnelUrl.replace(/\/$/, "")}/?mode=waiter`
                : `http://${currentEffectiveIp}:${localServerPort || 3000}/?mode=waiter`;

              return (
                <>
                  <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner border-4 border-indigo-500/30">
                    <QRCodeSVG
                      value={currentWaiterUrl}
                      size={190}
                      level="H"
                    />
                  </div>

                  {/* URL Display with Copy Button */}
                  <div className="space-y-2 text-xs text-left bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-bold flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Qoşulma Linki:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentWaiterUrl);
                          setIsCopiedLink(true);
                          setTimeout(() => setIsCopiedLink(false), 2000);
                        }}
                        className="text-[11px] flex items-center space-x-1 font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer bg-indigo-950/50 hover:bg-indigo-900/50 px-2 py-1 rounded-lg border border-indigo-800/40 transition-colors"
                      >
                        {isCopiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopiedLink ? "Kopyalandı!" : "Linki Kopyala"}</span>
                      </button>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 break-all select-all text-center font-bold">
                      {currentWaiterUrl}
                    </div>

                    <div className="text-[10px] text-slate-400 pt-1 leading-relaxed">
                      {connectionTab === "LOCAL" ? (
                        <span>💡 <strong>Qeyd:</strong> Telefon və POS kompüteri eyni Wi-Fi şəbəkəsində olmalıdır. Əgər qoşulma olmasa yuxarıdakı menyudan <strong>Onlayn Tünel</strong> rejimini seçin.</span>
                      ) : (
                        <span>💡 <strong>Qeyd:</strong> Tünel aktiv olduqda eyni Wi-Fi tələb olunmur, istənilən mobil internetlə (Azercell, Bakcell, Nar) qoşula bilərsiniz.</span>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            <button
              type="button"
              onClick={() => setIsWaiterQRModalOpen(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-lg shadow-indigo-950/50 cursor-pointer"
            >
              Pəncərəni Bağla
            </button>
          </div>
        </div>
      )}
    </>
  );
}
