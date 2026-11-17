import { BackendState, BusinessType, PaymentMethod } from "../types.js";

export const defaultDonerProducts = [
  {
    id: "d1",
    name: "Toyuq Dönəri (Çörəkdə)",
    price: 3.5,
    category: "Dönər",
    business: BusinessType.Doner,
    ingredients: ["Toyuq əti", "Pomidor", "Xiyar", "Mayonez", "Kartof fri"],
    image: "https://images.unsplash.com/photo-1642686336061-12c8b5dfccb7?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "d2",
    name: "Toyuq Dönəri (Lavaşda)",
    price: 4.0,
    category: "Dönər",
    business: BusinessType.Doner,
    ingredients: ["Toyuq əti", "Pomidor", "Xiyar", "Mayonez", "Kartof fri"],
    image: "https://images.unsplash.com/photo-1561651823-34fed022540e?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "d3",
    name: "Ət Dönəri (Çörəkdə)",
    price: 4.5,
    category: "Dönər",
    business: BusinessType.Doner,
    ingredients: ["Ət", "Pomidor", "Xiyar", "Sous", "Soğan"],
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "d4",
    name: "Ət Dönəri (Lavaşda)",
    price: 5.0,
    category: "Dönər",
    business: BusinessType.Doner,
    ingredients: ["Ət", "Pomidor", "Xiyar", "Sous", "Soğan"],
    image: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "d5",
    name: "İskəndər Dönər",
    price: 8.5,
    category: "Dönər",
    business: BusinessType.Doner,
    ingredients: ["Ət", "Qatıq", "İskəndər sousu", "Kərə yağı", "Çörək"],
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "d6",
    name: "Ayran 200ml",
    price: 1.0,
    category: "İçki",
    business: BusinessType.Doner,
    stock: 0,
    totalReceived: 0,
    totalSold: 0,
    image: "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "d7",
    name: "Coca-Cola 330ml",
    price: 1.5,
    category: "İçki",
    business: BusinessType.Doner,
    stock: 0,
    totalReceived: 0,
    totalSold: 0,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "d8",
    name: "Fanta 330ml",
    price: 1.5,
    category: "İçki",
    business: BusinessType.Doner,
    stock: 0,
    totalReceived: 0,
    totalSold: 0,
    image: "https://images.unsplash.com/photo-1624515699002-4713919e9f6c?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "d9",
    name: "Kartof Fri",
    price: 2.0,
    category: "Qəlyanaltı",
    business: BusinessType.Doner,
    ingredients: ["Kartof", "Ketçup", "Mayonez"],
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=600"
  }
];

export const defaultTables = [
  { tableNumber: 1, tableName: "Masa 1", section: "Əsas Zal", status: "EMPTY" as const, shape: "SQUARE" as const, capacity: 4, guestCount: 0, posX: 14, posY: 18, items: [], subtotal: 0 },
  { tableNumber: 2, tableName: "Masa 2", section: "Əsas Zal", status: "EMPTY" as const, shape: "ROUND" as const, capacity: 4, guestCount: 0, posX: 38, posY: 18, items: [], subtotal: 0 },
  { tableNumber: 3, tableName: "Masa 3", section: "Əsas Zal", status: "EMPTY" as const, shape: "RECTANGLE" as const, capacity: 6, guestCount: 0, posX: 64, posY: 18, items: [], subtotal: 0 },
  { tableNumber: 4, tableName: "Masa 4", section: "Əsas Zal", status: "EMPTY" as const, shape: "SQUARE" as const, capacity: 2, guestCount: 0, posX: 88, posY: 18, items: [], subtotal: 0 },
  { tableNumber: 5, tableName: "Masa 5", section: "Əsas Zal", status: "EMPTY" as const, shape: "ROUND" as const, capacity: 4, guestCount: 0, posX: 14, posY: 52, items: [], subtotal: 0 },
  { tableNumber: 6, tableName: "Masa 6", section: "Əsas Zal", status: "EMPTY" as const, shape: "SQUARE" as const, capacity: 4, guestCount: 0, posX: 38, posY: 52, items: [], subtotal: 0 },
  { tableNumber: 7, tableName: "Masa 7", section: "Əsas Zal", status: "EMPTY" as const, shape: "RECTANGLE" as const, capacity: 8, guestCount: 0, posX: 64, posY: 52, items: [], subtotal: 0 },
  { tableNumber: 8, tableName: "Masa 8", section: "Əsas Zal", status: "EMPTY" as const, shape: "SQUARE" as const, capacity: 2, guestCount: 0, posX: 88, posY: 52, items: [], subtotal: 0 },
  { tableNumber: 9, tableName: "Terras 1", section: "Terras", status: "EMPTY" as const, shape: "ROUND" as const, capacity: 4, guestCount: 0, posX: 16, posY: 84, items: [], subtotal: 0 },
  { tableNumber: 10, tableName: "Terras 2", section: "Terras", status: "EMPTY" as const, shape: "ROUND" as const, capacity: 4, guestCount: 0, posX: 40, posY: 84, items: [], subtotal: 0 },
  { tableNumber: 11, tableName: "VIP 1", section: "VIP Kabinet", status: "EMPTY" as const, shape: "RECTANGLE" as const, capacity: 8, guestCount: 0, posX: 66, posY: 84, items: [], subtotal: 0 },
  { tableNumber: 12, tableName: "VIP 2", section: "VIP Kabinet", status: "EMPTY" as const, shape: "RECTANGLE" as const, capacity: 10, guestCount: 0, posX: 90, posY: 84, items: [], subtotal: 0 }
];

export const defaultInventoryItems = [
  { id: "i1", name: "Dana Əti (Təzə)", category: "Ət", stock: 10, unit: "kq", minStockAlert: 3, costPrice: 14.5, totalReceived: 10, totalSold: 0, totalUsed: 0 },
  { id: "i2", name: "Toyuq Əti (Filə)", category: "Ət", stock: 15, unit: "kq", minStockAlert: 4, costPrice: 7.5, totalReceived: 15, totalSold: 0, totalUsed: 0 },
  { id: "i3", name: "Dönər Çörəyi", category: "Çörək", stock: 50, unit: "ədəd", minStockAlert: 15, costPrice: 0.35, totalReceived: 50, totalSold: 0, totalUsed: 0 },
  { id: "i4", name: "Lavaş", category: "Lavaş", stock: 60, unit: "ədəd", minStockAlert: 20, costPrice: 0.25, totalReceived: 60, totalSold: 0, totalUsed: 0 },
  { id: "i5", name: "Coca-Cola 330ml", category: "İçki", stock: 24, unit: "ədəd", minStockAlert: 6, costPrice: 0.85, totalReceived: 24, totalSold: 0, totalUsed: 0 },
  { id: "i6", name: "Ayran 200ml", category: "İçki", stock: 30, unit: "ədəd", minStockAlert: 10, costPrice: 0.45, totalReceived: 30, totalSold: 0, totalUsed: 0 },
  { id: "i7", name: "Kartof (Fri üçün)", category: "Tərəvəz", stock: 20, unit: "kq", minStockAlert: 5, costPrice: 1.2, totalReceived: 20, totalSold: 0, totalUsed: 0 },
  { id: "i8", name: "Mayonez & Ketçup", category: "Sous", stock: 5, unit: "vedrə", minStockAlert: 1, costPrice: 12.0, totalReceived: 5, totalSold: 0, totalUsed: 0 }
];

export const defaultInventoryBatches = [];

export const defaultUsers = [
  { id: "u1", name: "Anar Əliyev", pin: "1111", role: "CASHIER" as const },
  { id: "u2", name: "Leyla Məmmədova", pin: "2222", role: "CASHIER" as const },
  { id: "u3", name: "Tural Hüseynli", pin: "3333", role: "ADMIN" as const }
];

export const defaultCouriers = [
  { id: "c1", name: "Əli Məmmədov", phone: "+994 50 123 45 67" },
  { id: "c2", name: "Vüqar Həsənov", phone: "+994 55 987 65 43" },
  { id: "c3", name: "Nicat Əliyev", phone: "+994 70 456 78 90" }
];

export const defaultSuppliers = [
  { id: "sup_1", name: "Köz Ət Təchizat", phone: "+994 50 211 33 44", company: "Köz Ət MMC", category: "Ət və Toyuq", note: "Dana və Toyuq əti tədarükçüsü", totalPurchases: 0, totalPaid: 0, debtBalance: 0, createdAt: new Date().toISOString() },
  { id: "sup_2", name: "Bakı Çörək Zavodu", phone: "+994 12 400 11 22", company: "Bakı Çörək ASC", category: "Çörək və Lavaş", note: "Dönər çörəyi və lavaş", totalPurchases: 0, totalPaid: 0, debtBalance: 0, createdAt: new Date().toISOString() },
  { id: "sup_3", name: "Coca-Cola Bottlers", phone: "+994 12 345 67 89", company: "CCI Azerbaijan", category: "İçkilər", note: "Sərinləşdirici içkilər", totalPurchases: 0, totalPaid: 0, debtBalance: 0, createdAt: new Date().toISOString() }
];

export const defaultExpenses = [];

export const initialBackendState: BackendState = {
  donerProducts: defaultDonerProducts,
  tables: defaultTables,
  donerOrders: [],
  expenses: [],
  couriers: defaultCouriers,
  tableCount: 12,
  inventoryItems: defaultInventoryItems,
  inventoryUsages: [],
  inventoryBatches: [],
  users: defaultUsers,
  shifts: [],
  inventoryLosses: [],
  suppliers: defaultSuppliers,
  supplierTransactions: [],
  flowerProducts: [],
  flowerOrders: []
};
