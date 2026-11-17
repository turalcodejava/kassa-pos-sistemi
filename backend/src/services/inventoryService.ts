import { db } from "../db/database.js";
import { InventoryItem, InventoryBatch, InventoryLoss, InventoryUsage, BusinessType } from "../types.js";

export class InventoryService {
  public getItems(): InventoryItem[] {
    return db.getState().inventoryItems || [];
  }

  public getBatches(): InventoryBatch[] {
    return db.getState().inventoryBatches || [];
  }

  public getLosses(): InventoryLoss[] {
    return db.getState().inventoryLosses || [];
  }

  public getUsages(itemId?: string): InventoryUsage[] {
    const usages = db.getState().inventoryUsages || [];
    if (itemId) {
      return usages.filter(u => u.itemId === itemId);
    }
    return usages;
  }

  public addItem(item: Partial<InventoryItem> & { addToMenu?: boolean; menuPrice?: number }): InventoryItem {
    const stockQty = Number(item.stock) || 0;
    const rawName = item.name?.trim() || "Adsız Məhsul";
    const category = item.category || "Digər";
    const unit = item.unit || "ədəd";
    const minStockAlert = item.minStockAlert !== undefined && item.minStockAlert !== null ? Number(item.minStockAlert) : undefined;
    const costPrice = item.costPrice !== undefined && item.costPrice !== null ? Number(item.costPrice) : undefined;
    let resultItem: InventoryItem;

    db.mutate(state => {
      if (!state.inventoryItems) state.inventoryItems = [];
      let existing = state.inventoryItems.find(i => i.name.trim().toLowerCase() === rawName.toLowerCase());

      if (existing) {
        existing.stock = (existing.stock || 0) + stockQty;
        existing.totalReceived = (existing.totalReceived || 0) + stockQty;
        if (minStockAlert !== undefined) existing.minStockAlert = minStockAlert;
        if (costPrice !== undefined) existing.costPrice = costPrice;
        if (category) existing.category = category;
        if (unit) existing.unit = unit;
        resultItem = existing;
      } else {
        const newItem: InventoryItem = {
          id: "inv_" + Date.now(),
          name: rawName,
          category,
          stock: stockQty,
          unit,
          minStockAlert,
          costPrice,
          totalReceived: stockQty,
          totalSold: 0,
          totalUsed: 0,
          createdAt: new Date().toISOString()
        };
        state.inventoryItems.push(newItem);
        resultItem = newItem;
      }

      // Add to cashier menu if requested
      if (item.addToMenu) {
        const menuPrice = Number(item.menuPrice) || 0;
        const menuCategory = category === "İçki" ? "İçki" : "Digər";
        const prodIdx = state.donerProducts.findIndex(p => p.name.trim().toLowerCase() === rawName.toLowerCase());
        
        if (prodIdx >= 0) {
          state.donerProducts[prodIdx].stock = (state.donerProducts[prodIdx].stock || 0) + stockQty;
          state.donerProducts[prodIdx].totalReceived = (state.donerProducts[prodIdx].totalReceived || 0) + stockQty;
          if (menuPrice > 0) state.donerProducts[prodIdx].price = menuPrice;
        } else {
          state.donerProducts.push({
            id: "d_" + Date.now(),
            name: rawName,
            price: menuPrice,
            category: menuCategory,
            business: BusinessType.Doner,
            stock: stockQty,
            totalReceived: stockQty,
            totalSold: 0
          });
        }
      }
    });

    return resultItem!;
  }

  public updateItem(id: string, fields: Partial<InventoryItem>): InventoryItem | null {
    let result: InventoryItem | null = null;
    db.mutate(state => {
      const target = state.inventoryItems?.find(i => i.id === id);
      if (target) {
        if (fields.name) target.name = fields.name.trim();
        if (fields.category) target.category = fields.category.trim();
        if (fields.unit) target.unit = fields.unit.trim();
        if (fields.stock !== undefined) target.stock = Number(fields.stock);
        if (fields.minStockAlert !== undefined) target.minStockAlert = fields.minStockAlert !== null ? Number(fields.minStockAlert) : undefined;
        if (fields.costPrice !== undefined) target.costPrice = fields.costPrice !== null ? Number(fields.costPrice) : undefined;
        result = target;
      }
    });
    return result;
  }

  public adjustItemStock(itemId: string, quantityToAdd?: number, newStock?: number): boolean {
    let success = false;
    db.mutate(state => {
      const target = state.inventoryItems?.find(i => i.id === itemId);
      if (target) {
        if (quantityToAdd !== undefined && quantityToAdd > 0) {
          target.stock = (target.stock || 0) + Number(quantityToAdd);
          target.totalReceived = (target.totalReceived || 0) + Number(quantityToAdd);

          const corr = state.donerProducts.find(p => p.name.trim().toLowerCase() === target.name.trim().toLowerCase());
          if (corr) {
            corr.stock = (corr.stock || 0) + Number(quantityToAdd);
            corr.totalReceived = (corr.totalReceived || 0) + Number(quantityToAdd);
          }
        } else if (newStock !== undefined) {
          target.stock = Number(newStock);
        }
        success = true;
      }
    });
    return success;
  }

  public recordUsage(data: {
    itemId: string;
    quantity: number;
    reason: string;
    date?: string;
    createdByName?: string;
    note?: string;
  }): { success: boolean; usage?: InventoryUsage; item?: InventoryItem; error?: string } {
    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      return { success: false, error: "Silinmə / İstifadə miqdarı düzgün deyil!" };
    }

    let createdUsage: InventoryUsage | undefined;
    let updatedItem: InventoryItem | undefined;

    db.mutate(state => {
      if (!state.inventoryUsages) state.inventoryUsages = [];
      const item = state.inventoryItems?.find(i => i.id === data.itemId);
      if (!item) {
        return;
      }

      // Deduct stock and increment totalUsed
      item.stock = Math.max(0, item.stock - qty);
      item.totalUsed = (item.totalUsed || 0) + qty;
      updatedItem = item;

      // Sync menu item if it corresponds to donerProducts (e.g. drinks)
      const corrProd = state.donerProducts.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      if (corrProd && corrProd.stock !== undefined) {
        corrProd.stock = Math.max(0, corrProd.stock - qty);
      }

      const usageEntry: InventoryUsage = {
        id: "use_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        quantity: qty,
        unit: item.unit,
        reason: data.reason || "Gündəlik istifadə",
        date: data.date || new Date().toISOString().split("T")[0],
        timestamp: new Date().toISOString(),
        createdByName: data.createdByName || "Admin / Kassir",
        costAmount: item.costPrice ? Number((item.costPrice * qty).toFixed(2)) : undefined,
        note: data.note?.trim() || undefined
      };

      state.inventoryUsages.push(usageEntry);
      createdUsage = usageEntry;
    });

    if (!updatedItem) {
      return { success: false, error: "Məhsul anbarda tapılmadı!" };
    }

    return { success: true, usage: createdUsage, item: updatedItem };
  }

  public deleteUsage(usageId: string, restoreStock = true): boolean {
    let success = false;
    db.mutate(state => {
      if (!state.inventoryUsages) return;
      const targetIdx = state.inventoryUsages.findIndex(u => u.id === usageId);
      if (targetIdx >= 0) {
        const usage = state.inventoryUsages[targetIdx];
        if (restoreStock && usage) {
          const item = state.inventoryItems?.find(i => i.id === usage.itemId);
          if (item) {
            item.stock = (item.stock || 0) + usage.quantity;
            item.totalUsed = Math.max(0, (item.totalUsed || 0) - usage.quantity);
          }
        }
        state.inventoryUsages.splice(targetIdx, 1);
        success = true;
      }
    });
    return success;
  }

  public deleteItem(itemId: string): boolean {
    let deleted = false;
    db.mutate(state => {
      const initLen = state.inventoryItems?.length || 0;
      state.inventoryItems = state.inventoryItems?.filter(i => i.id !== itemId) || [];
      deleted = (state.inventoryItems.length < initLen);
    });
    return deleted;
  }

  public addBatch(batch: { name?: string; weightKq: number; costPrice: number; autoExpense?: boolean }): InventoryBatch {
    let createdBatch: InventoryBatch;

    db.mutate(state => {
      if (!state.inventoryBatches) state.inventoryBatches = [];

      // Finish any previously active batch
      state.inventoryBatches.forEach(b => {
        if (b.status === "ACTIVE") {
          b.status = "FINISHED";
          b.finishedAt = new Date().toISOString();
        }
      });

      const newBatch: InventoryBatch = {
        id: "batch_" + Date.now(),
        name: batch.name || `Dana Əti Rulonu #${state.inventoryBatches.length + 1}`,
        weightKq: Number(batch.weightKq) || 0,
        costPrice: Number(batch.costPrice) || 0,
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
        donerCount: 0
      };

      state.inventoryBatches.push(newBatch);
      createdBatch = newBatch;

      if (batch.autoExpense) {
        if (!state.expenses) state.expenses = [];
        state.expenses.push({
          id: "exp_" + Date.now(),
          title: `Ət Alışı (${newBatch.name})`,
          amount: newBatch.costPrice,
          category: "Məhsul",
          date: new Date().toISOString().split("T")[0],
          business: BusinessType.Doner
        });
      }
    });

    return createdBatch!;
  }

  public finishBatch(batchId: string, donerCount?: number): boolean {
    let finished = false;
    db.mutate(state => {
      const target = state.inventoryBatches?.find(b => b.id === batchId);
      if (target) {
        target.status = "FINISHED";
        target.finishedAt = new Date().toISOString();
        if (donerCount !== undefined) {
          target.donerCount = Number(donerCount);
        }
        finished = true;
      }
    });
    return finished;
  }

  public deleteBatch(batchId: string): boolean {
    let deleted = false;
    db.mutate(state => {
      const initLen = state.inventoryBatches?.length || 0;
      state.inventoryBatches = state.inventoryBatches?.filter(b => b.id !== batchId) || [];
      deleted = (state.inventoryBatches.length < initLen);
    });
    return deleted;
  }

  public recordLoss(data: { itemId: string; name: string; quantity: number; unit?: string; reason: string }): { success: boolean; error?: string } {
    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      return { success: false, error: "Miqdar düzgün deyil" };
    }

    let result: { success: boolean; error?: string } = { success: false };

    db.mutate(state => {
      const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
      if (!activeShift) {
        result = { success: false, error: "Aktiv növbə yoxdur! İtki qeydiyyatı üçün öncə növbə açılmalıdır." };
        return;
      }

      // Deduct stock
      let itemFound = false;
      const invItem = state.inventoryItems?.find(i => i.id === data.itemId);
      if (invItem) {
        invItem.stock = Math.max(0, invItem.stock - qty);
        itemFound = true;
      }

      if (!itemFound) {
        const prod = state.donerProducts?.find(p => p.id === data.itemId);
        if (prod && prod.stock !== undefined) {
          prod.stock = Math.max(0, prod.stock - qty);
          itemFound = true;
        }
      }

      if (!activeShift.inventoryLosses) activeShift.inventoryLosses = [];
      activeShift.inventoryLosses.push({
        itemId: data.itemId,
        name: data.name,
        quantity: qty,
        unit: data.unit || "ədəd",
        reason: data.reason,
        timestamp: new Date().toISOString()
      });

      if (!state.inventoryLosses) state.inventoryLosses = [];
      state.inventoryLosses.push({
        id: "loss_" + Date.now(),
        itemId: data.itemId,
        name: data.name,
        quantity: qty,
        unit: data.unit || "ədəd",
        reason: data.reason,
        timestamp: new Date().toISOString(),
        cashierName: activeShift.userName,
        shiftId: activeShift.id
      });

      result = { success: true };
    });

    return result;
  }

  public deductInventoryForOrder(items: Array<{ productId: string; name: string; quantity: number }>, state = db.getState()): void {
    if (!state.inventoryItems) state.inventoryItems = [];
    if (!state.inventoryBatches) state.inventoryBatches = [];

    items.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const nameLower = item.name.toLowerCase();

      // Match inventory item
      const matchingInv = state.inventoryItems.find(inv =>
        nameLower.includes(inv.name.toLowerCase()) || inv.name.toLowerCase().includes(nameLower)
      );

      if (matchingInv) {
        matchingInv.stock = Math.max(0, matchingInv.stock - qty);
        matchingInv.totalSold = (matchingInv.totalSold || 0) + qty;
      }

      // Bread deduction
      if (nameLower.includes("çörəkdə") || nameLower.includes("çörək")) {
        const bread = state.inventoryItems.find(i => i.id === "i4");
        if (bread) {
          bread.stock = Math.max(0, bread.stock - qty);
          bread.totalSold = (bread.totalSold || 0) + qty;
        }
      }

      // Lavash deduction
      if (nameLower.includes("lavaşda") || nameLower.includes("lavaş")) {
        const lavash = state.inventoryItems.find(i => i.id === "i5");
        if (lavash) {
          lavash.stock = Math.max(0, lavash.stock - qty);
          lavash.totalSold = (lavash.totalSold || 0) + qty;
        }
      }

      // Meat batch doner count increment
      if (nameLower.includes("ət") || nameLower.includes("iskəndər")) {
        const activeBatch = state.inventoryBatches.find(b => b.status === "ACTIVE");
        if (activeBatch) {
          activeBatch.donerCount = (activeBatch.donerCount || 0) + qty;
        }
      }
    });
  }
}

export const inventoryService = new InventoryService();
