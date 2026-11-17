export enum BusinessType {
  Doner = "DONER",
  Flower = "FLOWER"
}

export enum PaymentMethod {
  Cash = "NAGD",
  PosTerminal = "POS_TERMINAL",
  Card = "KART",
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
  category: string;
  business: BusinessType;
  ingredients?: string[];
  stock?: number;
  totalReceived?: number;
  totalSold?: number;
  image?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  removedIngredients?: string[];
  itemNote?: string;
}

export interface DonerOrder {
  id: string;
  orderType: "TABLE" | "TAKEAWAY" | "DELIVERY";
  tableNumber?: number;
  items: OrderItem[];
  subtotal: number;
  paymentMethod?: PaymentMethod;
  paymentNote?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
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
  isConfirmed?: boolean;
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
  category?: string;
  note?: string;
  totalPurchases: number;
  totalPaid: number;
  debtBalance: number;
  createdAt?: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  type: "PURCHASE" | "PAYMENT";
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
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
  tableName?: string;
  section?: string;
  status: "EMPTY" | "ORDERED" | "BILL_REQUEST" | "RESERVED";
  shape?: "ROUND" | "SQUARE" | "RECTANGLE";
  capacity?: number;
  guestCount?: number;
  posX?: number;
  posY?: number;
  orderStartedAt?: string;
  reservedFor?: string;
  items: OrderItem[];
  subtotal: number;
  lockedBy?: TableLock;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStockAlert?: number;
  costPrice?: number;
  totalReceived: number;
  totalSold: number;
  totalUsed?: number;
  createdAt?: string;
}

export interface InventoryUsage {
  id: string;
  itemId: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit: string;
  reason: string;
  date: string;
  timestamp: string;
  createdByName?: string;
  costAmount?: number;
  note?: string;
}

export interface InventoryBatch {
  id: string;
  name: string;
  weightKq: number;
  costPrice: number;
  createdAt: string;
  finishedAt?: string;
  status: "ACTIVE" | "FINISHED";
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
  itemId: string;
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
  type: "IN" | "OUT";
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
  receivedPosTerminal?: number;
  receivedCard: number;
  receivedWolt: number;
  receivedBolt?: number;
  receivedYango?: number;
  receivedCardTransfer?: number;
  receivedM10?: number;
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

export interface BackendState {
  donerProducts: Product[];
  tables: TableState[];
  donerOrders: DonerOrder[];
  expenses: Expense[];
  couriers: Courier[];
  tableCount: number;
  inventoryItems: InventoryItem[];
  inventoryUsages?: InventoryUsage[];
  inventoryBatches: InventoryBatch[];
  users: User[];
  shifts: Shift[];
  inventoryLosses: InventoryLoss[];
  suppliers?: Supplier[];
  supplierTransactions?: SupplierTransaction[];
  flowerProducts?: any[];
  flowerOrders?: any[];
}
