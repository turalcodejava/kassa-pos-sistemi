import { db } from "../db/database.js";
import { TableState, DonerOrder, PaymentMethod, OrderItem } from "../types.js";
import { shiftService } from "./shiftService.js";
import { inventoryService } from "./inventoryService.js";

export class TableService {
  private cleanupExpiredLocks(tables?: TableState[]): boolean {
    const list = tables || db.getState().tables || [];
    const now = Date.now();
    let hasExpired = false;
    for (const t of list) {
      if (t.lockedBy && t.lockedBy.expiresAt && t.lockedBy.expiresAt < now) {
        t.lockedBy = undefined;
        hasExpired = true;
      }
    }
    return hasExpired;
  }

  public getTables(): TableState[] {
    const tables = db.getState().tables || [];
    if (this.cleanupExpiredLocks(tables)) {
      db.mutate(state => {
        state.tables = tables;
      });
    }
    return tables;
  }

  public getTable(tableNumber: number): TableState | undefined {
    return this.getTables().find(t => t.tableNumber === tableNumber);
  }

  public lockTable(data: {
    tableNumber: number;
    deviceId: string;
    deviceName?: string;
    waiterName: string;
    ttlSeconds?: number;
  }): { success: boolean; table?: TableState; error?: string; lockedBy?: any } {
    const tNum = parseInt(String(data.tableNumber));
    const now = Date.now();
    const ttl = (data.ttlSeconds || 90) * 1000;
    let result: { success: boolean; table?: TableState; error?: string; lockedBy?: any } = { success: false };

    db.mutate(state => {
      this.cleanupExpiredLocks(state.tables);
      const table = state.tables?.find(t => t.tableNumber === tNum);
      if (!table) {
        result = { success: false, error: "Masa tapılmadı" };
        return;
      }

      // Check if already locked by another device and lock has not expired
      if (table.lockedBy && table.lockedBy.expiresAt > now && table.lockedBy.deviceId !== data.deviceId) {
        result = {
          success: false,
          error: `Masa hazırda ${table.lockedBy.waiterName || "başqa cihaz"} tərəfindən idarə olunur.`,
          lockedBy: table.lockedBy
        };
        return;
      }

      // Set new lock or refresh existing
      const newLock = {
        deviceId: data.deviceId,
        deviceName: data.deviceName || "Mobil Telefon",
        waiterName: data.waiterName || "Ofisiant",
        lockedAt: new Date().toISOString(),
        expiresAt: now + ttl
      };

      table.lockedBy = newLock;
      result = { success: true, table, lockedBy: newLock };
    });

    return result;
  }

  public unlockTable(data: {
    tableNumber: number;
    deviceId?: string;
    forceAdmin?: boolean;
  }): { success: boolean; table?: TableState; error?: string } {
    const tNum = parseInt(String(data.tableNumber));
    let result: { success: boolean; table?: TableState; error?: string } = { success: false };

    db.mutate(state => {
      const table = state.tables?.find(t => t.tableNumber === tNum);
      if (!table) {
        result = { success: false, error: "Masa tapılmadı" };
        return;
      }

      if (table.lockedBy && !data.forceAdmin && data.deviceId && table.lockedBy.deviceId !== data.deviceId) {
        result = { success: false, error: "Bu masanın kilidini yalnız daxil olan cihaz və ya Admin aça bilər." };
        return;
      }

      table.lockedBy = undefined;
      result = { success: true, table };
    });

    return result;
  }

  public heartbeatLock(data: {
    tableNumber: number;
    deviceId: string;
    ttlSeconds?: number;
  }): { success: boolean; error?: string } {
    const tNum = parseInt(String(data.tableNumber));
    const now = Date.now();
    const ttl = (data.ttlSeconds || 90) * 1000;
    let success = false;

    db.mutate(state => {
      const table = state.tables?.find(t => t.tableNumber === tNum);
      if (table && table.lockedBy && table.lockedBy.deviceId === data.deviceId) {
        table.lockedBy.expiresAt = now + ttl;
        success = true;
      }
    });

    return { success };
  }

  public updateTableCount(count: number): TableState[] {
    const newCount = parseInt(String(count)) || 12;
    let resultTables: TableState[] = [];

    db.mutate(state => {
      state.tableCount = newCount;
      const current = state.tables || [];
      const newTables: TableState[] = [];

      for (let i = 1; i <= newCount; i++) {
        const existing = current.find(t => t.tableNumber === i);
        if (existing) {
          newTables.push(existing);
        } else {
          newTables.push({
            tableNumber: i,
            tableName: `Masa ${i}`,
            section: i <= 8 ? "Əsas Zal" : i <= 10 ? "Terras" : "VIP Kabinet",
            status: "EMPTY",
            shape: i % 3 === 0 ? "ROUND" : i % 2 === 0 ? "RECTANGLE" : "SQUARE",
            capacity: i % 4 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
            guestCount: 0,
            posX: (( (i - 1) % 4) * 25) + 14,
            posY: Math.floor((i - 1) / 4) * 32 + 18,
            items: [],
            subtotal: 0
          });
        }
      }
      state.tables = newTables;
      resultTables = newTables;
    });

    return resultTables;
  }

  public updateTableOrder(data: { 
    tableNumber: number; 
    items: OrderItem[]; 
    status?: TableState["status"]; 
    guestCount?: number;
    unlockAfter?: boolean;
  }): TableState | null {
    let updatedTable: TableState | null = null;

    db.mutate(state => {
      state.tables = state.tables.map(t => {
        if (t.tableNumber === data.tableNumber) {
          const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          const isNewOrder = t.status === "EMPTY" && data.items.length > 0;
          const newT: TableState = {
            ...t,
            items: data.items,
            status: data.status || "ORDERED",
            subtotal,
            guestCount: data.guestCount !== undefined ? data.guestCount : (t.guestCount || (data.items.length > 0 ? 2 : 0)),
            orderStartedAt: isNewOrder ? new Date().toISOString() : (t.orderStartedAt || new Date().toISOString()),
            lockedBy: data.unlockAfter !== false ? undefined : t.lockedBy
          };
          updatedTable = newT;
          return newT;
        }
        return t;
      });
    });

    return updatedTable;
  }

  public updateTableLayout(tables: TableState[]): TableState[] {
    let result: TableState[] = [];

    db.mutate(state => {
      state.tables = tables.map(newT => {
        const oldT = state.tables.find(t => t.tableNumber === newT.tableNumber);
        return {
          ...newT,
          items: oldT ? oldT.items : (newT.items || []),
          subtotal: oldT ? oldT.subtotal : (newT.subtotal || 0),
          status: oldT && oldT.items.length > 0 ? "ORDERED" : (newT.status || "EMPTY"),
          guestCount: newT.guestCount !== undefined ? newT.guestCount : (oldT?.guestCount || 0)
        };
      });
      state.tableCount = state.tables.length;
      result = state.tables;
    });

    return result;
  }

  public updateTableProperties(data: {
    tableNumber: number;
    guestCount?: number;
    capacity?: number;
    shape?: "ROUND" | "SQUARE" | "RECTANGLE";
    section?: string;
    tableName?: string;
    status?: TableState["status"];
    reservedFor?: string;
  }): TableState | null {
    let updated: TableState | null = null;

    db.mutate(state => {
      state.tables = state.tables.map(t => {
        if (t.tableNumber === data.tableNumber) {
          const newT: TableState = {
            ...t,
            guestCount: data.guestCount !== undefined ? data.guestCount : t.guestCount,
            capacity: data.capacity !== undefined ? data.capacity : t.capacity,
            shape: data.shape !== undefined ? data.shape : t.shape,
            section: data.section !== undefined ? data.section : t.section,
            tableName: data.tableName !== undefined ? data.tableName : t.tableName,
            status: data.status !== undefined ? data.status : t.status,
            reservedFor: data.reservedFor !== undefined ? data.reservedFor : t.reservedFor
          };
          updated = newT;
          return newT;
        }
        return t;
      });
    });

    return updated;
  }

  public addCustomerOrder(tableNumber: number, items: OrderItem[]): { success: boolean; error?: string } {
    const tNum = parseInt(String(tableNumber));
    if (!tNum || isNaN(tNum)) {
      return { success: false, error: "Yanlış masa nömrəsi" };
    }

    let success = false;

    db.mutate(state => {
      state.tables = state.tables.map(t => {
        if (t.tableNumber === tNum) {
          const mergedItems = [...t.items];
          items.forEach(newItem => {
            const existingIndex = mergedItems.findIndex(i => {
              const arr1 = i.removedIngredients || [];
              const arr2 = newItem.removedIngredients || [];
              return (
                i.productId === newItem.productId &&
                arr1.length === arr2.length &&
                arr1.every(val => arr2.includes(val))
              );
            });

            if (existingIndex > -1) {
              mergedItems[existingIndex].quantity += newItem.quantity;
            } else {
              mergedItems.push(newItem);
            }
          });

          const subtotal = mergedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          success = true;
          return {
            ...t,
            items: mergedItems,
            status: "ORDERED",
            subtotal
          };
        }
        return t;
      });
    });

    return { success };
  }

  public checkoutTable(tableNumber: number, paymentMethod?: PaymentMethod, paymentNote?: string, customCreatedAt?: string): { success: boolean; order?: DonerOrder; error?: string } {
    let result: { success: boolean; order?: DonerOrder; error?: string } = { success: false };

    db.mutate(state => {
      const table = state.tables.find(t => t.tableNumber === tableNumber);
      if (!table || table.items.length === 0) {
        result = { success: false, error: "Sifariş tapılmadı və ya masa boşdur." };
        return;
      }

      const method = paymentMethod || PaymentMethod.Cash;
      const newOrder: DonerOrder = {
        id: "ord_d_" + Date.now(),
        orderType: "TABLE",
        tableNumber,
        items: table.items,
        subtotal: table.subtotal,
        paymentMethod: method,
        paymentNote: paymentNote || undefined,
        status: "COMPLETED",
        createdAt: customCreatedAt || new Date().toISOString()
      };

      if (!state.donerOrders) state.donerOrders = [];
      state.donerOrders.push(newOrder);

      // Track shift sale
      shiftService.trackSale(table.items, method, table.subtotal, state);

      // Deduct products stock
      table.items.forEach(item => {
        const prod = state.donerProducts.find(p => p.id === item.productId);
        if (prod && prod.stock !== undefined) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          prod.totalSold = (prod.totalSold || 0) + item.quantity;
        }
      });

      // Deduct warehouse inventory items & meat batch
      inventoryService.deductInventoryForOrder(table.items, state);

      // Reset Table
      state.tables = state.tables.map(t => {
        if (t.tableNumber === tableNumber) {
          return {
            ...t,
            status: "EMPTY",
            items: [],
            subtotal: 0,
            guestCount: 0,
            orderStartedAt: undefined,
            reservedFor: undefined,
            lockedBy: undefined
          };
        }
        return t;
      });

      result = { success: true, order: newOrder };
    });

    return result;
  }
}

export const tableService = new TableService();
