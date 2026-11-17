export enum BusinessType {
  Doner = "DONER",
  Flower = "FLOWER"
}

export enum PaymentMethod {
  Cash = "NAGD",
  PosTerminal = "POS_TERMINAL",
  Card = "KART", // Backwards compatibility for older records
  Wolt = "WOLT",
  Bolt = "BOLT",
  Yango = "YANGO",
  CardTransfer = "KART_TRANSFER",
  M10 = "M10"
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string; // e.g., "Dönər", "İçki", "Gül", "Aksesuar"
  business: BusinessType;
  ingredients?: string[]; // list of ingredients
  stock?: number; // current stock remaining in warehouse (used for flowers and doner cold drinks)
  totalReceived?: number; // total quantity purchased/restocked
  totalSold?: number; // total quantity sold
  image?: string; // product image URL
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  removedIngredients?: string[]; // ingredients removed by the user
  itemNote?: string; // custom kitchen note (e.g. "mayonezi bol olsun")
}

export interface DonerOrder {
  id: string;
  orderType: "TABLE" | "TAKEAWAY" | "DELIVERY";
  tableNumber?: number;
  items: OrderItem[];
  subtotal: number;
  paymentMethod?: PaymentMethod;
  paymentNote?: string; // e.g. Card number or m10 phone number
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  // Delivery details
  deliveryName?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  courierId?: string;
  courierName?: string;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  notes?: string;
}

export interface FlowerOrder {
  id: string;
  orderType: "POS" | "WEB";
  items: OrderItem[];
  subtotal: number;
  paymentMethod: PaymentMethod;
  paymentNote?: string; // e.g. Card number or m10 phone number
  status: "COMPLETED";
  createdAt: string;
  // Delivery details
  isDelivery?: boolean;
  receiverName?: string;
  receiverPhone?: string;
  deliveryAddress?: string;
  deliveryDateTime?: string;
  cardNote?: string;
}

export type ExpensePaymentSource = 
  | "Nağd" 
  | "POS Terminal" 
  | "Wolt" 
  | "Bolt" 
  | "Yango" 
  | "Bank Kartı" 
  | "m10" 
  | "Digər" 
  | "Kassa (Nağd)";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  business: BusinessType;
  isInventoryPurchase?: boolean;
  inventoryItemId?: string;
  inventoryItemName?: string;
  itemCategory?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  paymentSource?: ExpensePaymentSource;
  note?: string;
  addToMenu?: boolean;
  menuPrice?: number;
  isConfirmed?: boolean; // true = Təsdiqlənib (xərclərə daxil edilib və kassadan çıxılıb), false = Təsdiq gözləyir
  confirmedAt?: string;
  confirmedBy?: string;
  supplierId?: string;
  supplierName?: string;
  invoiceTotal?: number;
  paidAmount?: number;
  debtAmount?: number;
  isSupplierPayment?: boolean;
  createdAt?: string;
  timestamp?: string;
}

export interface Supplier {
  id: string;
  name: string;
  suppliedProduct?: string; // Təchiz olunan əsas məhsul / malın adı
  phone?: string;
  company?: string;
  category?: string; // e.g. "Ət və Toyuq", "İçkilər", "Tərəvəz", "Çörək", "Qablaşdırma"
  note?: string;
  totalPurchases: number; // Total invoiced / purchased amount (₼)
  totalPaid: number; // Total amount paid (₼)
  debtBalance: number; // Remaining debt owed to supplier (₼)
  createdAt?: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  type: "PURCHASE" | "PAYMENT"; // PURCHASE = Mal alışı, PAYMENT = Borc ödəməsi
  totalAmount: number; // Purchase total or Payment amount
  paidAmount: number; // Paid amount on transaction
  debtAmount: number; // Newly added debt (for PURCHASE: totalAmount - paidAmount)
  paymentSource?: ExpensePaymentSource;
  note?: string;
  date: string;
  timestamp: string;
  itemsSummary?: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
}

export interface TableLock {
  deviceId: string;
  deviceName?: string; // e.g. "Mobil Telefon (iPhone)"
  waiterName: string; // e.g. "Ofisiant Elvin"
  lockedAt: string; // ISO date
  expiresAt: number; // unix timestamp ms
}

export interface TableState {
  tableNumber: number;
  tableName?: string; // e.g., "Masa 1", "VIP-1", "Terras 2"
  section?: string; // e.g., "Əsas Zal", "Terras", "VIP Kabinet"
  status: "EMPTY" | "ORDERED" | "BILL_REQUEST" | "RESERVED";
  shape?: "ROUND" | "SQUARE" | "RECTANGLE"; // Shape of table
  capacity?: number; // Total seating capacity, e.g. 2, 4, 6, 8
  guestCount?: number; // Current number of seated guests
  posX?: number; // X coordinate on floor plan (0-100% or px)
  posY?: number; // Y coordinate on floor plan (0-100% or px)
  orderStartedAt?: string; // ISO string when first item was ordered
  reservedFor?: string; // Guest name or reservation notes
  items: OrderItem[];
  subtotal: number;
  lockedBy?: TableLock;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // e.g., "İçki", "Ət", "Çörək", "Tərəvəz", "Sous", "Qablaşdırma", "Digər"
  stock: number;
  unit: string; // e.g., "ədəd", "kq", "litr", "qram", "qutu", "bağlama"
  minStockAlert?: number; // Minimum kritik qalıq xəbərdarlıq həddi (məs: 2 kq və ya 10 ədəd)
  costPrice?: number; // Maya / Alış vahid qiyməti (₼)
  totalReceived: number;
  totalSold: number;
  totalUsed?: number; // Cəmi silinmiş / istifadə olunmuş miqdar
  createdAt?: string;
}

export interface InventoryUsage {
  id: string;
  itemId: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit: string;
  reason: string; // e.g., "Gündəlik dönər üçün istifadə", "Xarab oldu / İtki", "İşçi yeməyi", "Digər"
  date: string;
  timestamp: string;
  createdByName?: string;
  costAmount?: number;
  note?: string;
}

export interface InventoryBatch {
  id: string;
  name: string; // e.g., "Dana Əti Rulonu #4"
  weightKq: number; // e.g., 25 kg
  costPrice: number; // e.g., 350
  createdAt: string;
  finishedAt?: string;
  status: "ACTIVE" | "FINISHED";
  // How many meat doners have been sold in total since this batch was active
  donerCount: number;
}

export interface User {
  id: string;
  name: string;
  pin: string;
  role: "CASHIER" | "ADMIN" | "WAITER";
}

export interface InventoryLoss {
  id: string;
  itemId: string; // product id or warehouse item id
  name: string;
  quantity: number;
  unit: string;
  reason: string;
  timestamp: string;
  cashierName: string;
  shiftId: string;
}

export interface CashTransaction {
  id: string;
  type: "IN" | "OUT"; // IN = management cash deposit (mədaxil), OUT = management cash withdrawal (məxaric)
  amount: number;
  note: string;
  timestamp: string;
}

export interface CashHandover {
  amount: number;
  recipient: string; // e.g. "Rəhbərlik", "Müdiriyyət", "Seyf", or person name
  supplierId?: string;
  supplierName?: string;
  note?: string;
  isConfirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  expenseId?: string;
}

export interface PosAllocation {
  amount: number;
  allocatedTo: string; // e.g. "Ət Tədarükü (Köz Ət Təchizat)"
  supplierId?: string;
  supplierName?: string;
  note?: string;
  isConfirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  expenseId?: string;
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  status: "ACTIVE" | "FINISHED";
  startingCash: number;
  receivedCash: number;
  receivedPosTerminal?: number; // POS terminal payments
  receivedCard: number; // General card / POS terminal
  receivedWolt: number;
  receivedBolt?: number;
  receivedYango?: number;
  receivedCardTransfer?: number; // Card-to-card transfer
  receivedM10?: number; // m10 transfer
  spentCash: number;
  managementAdded?: number;
  managementWithdrawn?: number;
  cashTransactions?: CashTransaction[];
  actualCashInDrawer?: number;
  expectedCash?: number;
  difference?: number;
  notes?: string;
  cashHandover?: CashHandover;
  posAllocation?: PosAllocation;
  totalShiftRevenue?: number;
  totalShiftExpenses?: number;
  shiftNetProfit?: number;
  soldItems?: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    business: BusinessType;
  }[];
  inventoryLosses?: {
    itemId: string;
    name: string;
    quantity: number;
    unit: string;
    reason: string;
    timestamp: string;
  }[];
}

export interface AppState {
  donerProducts: Product[];
  flowerProducts: Product[];
  tables: TableState[];
  donerOrders: DonerOrder[];
  flowerOrders: FlowerOrder[];
  expenses: Expense[];
  couriers: Courier[];
  tableCount: number;
  inventoryItems?: InventoryItem[]; // list of warehouse products like cola, fanta, et, corek, etc.
  inventoryUsages?: InventoryUsage[]; // list of write-offs / daily ingredient usage logs
  inventoryBatches?: InventoryBatch[]; // list of meat rolls / other batches
  users?: User[];
  shifts?: Shift[];
  inventoryLosses?: InventoryLoss[];
  suppliers?: Supplier[];
  supplierTransactions?: SupplierTransaction[];
}
