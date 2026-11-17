import { db } from "../db/database.js";
import { Expense, BusinessType } from "../types.js";

export class ExpenseService {
  public getAllExpenses(): Expense[] {
    return db.getState().expenses || [];
  }

  public addExpense(expenseData: Partial<Expense>): Expense {
    const expenseId = "exp_" + Date.now();
    const amount = Number(expenseData.amount) || 0;

    const isConfirmed = expenseData.isConfirmed === true; // Unconfirmed by default unless explicitly true
    const newExpense: Expense = {
      id: expenseId,
      title: expenseData.title?.trim() || "Xərc",
      amount,
      category: expenseData.category || "Digər",
      date: expenseData.date || new Date().toISOString().split("T")[0],
      business: BusinessType.Doner,
      isInventoryPurchase: expenseData.isInventoryPurchase,
      inventoryItemId: expenseData.inventoryItemId,
      inventoryItemName: expenseData.inventoryItemName,
      itemCategory: expenseData.itemCategory,
      quantity: expenseData.quantity ? Number(expenseData.quantity) : undefined,
      unit: expenseData.unit,
      unitPrice: expenseData.unitPrice ? Number(expenseData.unitPrice) : undefined,
      paymentSource: expenseData.paymentSource || "Kassa (Nağd)",
      note: expenseData.note,
      addToMenu: expenseData.addToMenu,
      menuPrice: expenseData.menuPrice ? Number(expenseData.menuPrice) : undefined,
      isConfirmed: isConfirmed,
      confirmedAt: isConfirmed ? new Date().toISOString() : undefined,
      confirmedBy: isConfirmed ? expenseData.confirmedBy : undefined,
      supplierId: expenseData.supplierId,
      supplierName: expenseData.supplierName,
      invoiceTotal: expenseData.invoiceTotal ? Number(expenseData.invoiceTotal) : undefined,
      paidAmount: expenseData.paidAmount ? Number(expenseData.paidAmount) : undefined,
      debtAmount: expenseData.debtAmount ? Number(expenseData.debtAmount) : undefined,
      isSupplierPayment: expenseData.isSupplierPayment,
      createdAt: expenseData.timestamp || expenseData.createdAt || (expenseData.date ? new Date(expenseData.date).toISOString() : new Date().toISOString()),
      timestamp: expenseData.timestamp || expenseData.createdAt || (expenseData.date ? new Date(expenseData.date).toISOString() : new Date().toISOString())
    };

    db.mutate(state => {
      if (!state.expenses) state.expenses = [];
      state.expenses.unshift(newExpense);

      // If linked to a supplier, update supplier stats
      if (newExpense.supplierId) {
        if (!state.suppliers) state.suppliers = [];
        const sup = state.suppliers.find(s => s.id === newExpense.supplierId);
        if (sup) {
          if (newExpense.isSupplierPayment) {
            sup.totalPaid = (sup.totalPaid || 0) + newExpense.amount;
            sup.debtBalance = Math.max(0, (sup.debtBalance || 0) - newExpense.amount);
          } else if (newExpense.invoiceTotal !== undefined) {
            const invTotal = Number(newExpense.invoiceTotal) || newExpense.amount;
            const paid = Number(newExpense.paidAmount !== undefined ? newExpense.paidAmount : newExpense.amount);
            const debt = Math.max(0, invTotal - paid);
            sup.totalPurchases = (sup.totalPurchases || 0) + invTotal;
            sup.totalPaid = (sup.totalPaid || 0) + paid;
            sup.debtBalance = Math.max(0, (sup.debtBalance || 0) + debt);
          }
        }
      }

      // Auto update inventory if this is a stock purchase
      if (newExpense.isInventoryPurchase && newExpense.inventoryItemName && newExpense.quantity) {
        const qty = Number(newExpense.quantity) || 0;
        const rawName = String(newExpense.inventoryItemName).trim();
        const unit = newExpense.unit || "ədəd";
        const cat = newExpense.itemCategory || newExpense.category || "İçki";

        if (qty > 0 && rawName) {
          if (!state.inventoryItems) state.inventoryItems = [];

          let existingInv = state.inventoryItems.find(
            i => i.name.trim().toLowerCase() === rawName.toLowerCase()
          );

          if (existingInv) {
            existingInv.stock = (existingInv.stock || 0) + qty;
            existingInv.totalReceived = (existingInv.totalReceived || 0) + qty;
            if (unit) existingInv.unit = unit;
          } else {
            existingInv = {
              id: "inv_" + Date.now(),
              name: rawName,
              category: cat,
              stock: qty,
              unit: unit,
              totalReceived: qty,
              totalSold: 0
            };
            state.inventoryItems.push(existingInv);
          }

          if (!state.donerProducts) state.donerProducts = [];
          const existingProd = state.donerProducts.find(
            p => p.name.trim().toLowerCase() === rawName.toLowerCase()
          );

          if (existingProd) {
            existingProd.stock = (existingProd.stock || 0) + qty;
            existingProd.totalReceived = (existingProd.totalReceived || 0) + qty;
          } else if (newExpense.addToMenu) {
            const menuPrice = Number(newExpense.menuPrice) || (newExpense.unitPrice ? newExpense.unitPrice * 1.5 : 2.0);
            state.donerProducts.push({
              id: "d_" + Date.now(),
              name: rawName,
              price: menuPrice,
              category: cat === "İçki" ? "İçki" : "Digər",
              business: BusinessType.Doner,
              stock: qty,
              totalReceived: qty,
              totalSold: 0
            });
          }
        }
      }

      // ONLY deduct from active shift if confirmed AND paid by cashier drawer cash
      if (newExpense.isConfirmed) {
        if (!newExpense.paymentSource || newExpense.paymentSource === "Nağd" || newExpense.paymentSource === "Kassa (Nağd)") {
          const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
          if (activeShift) {
            activeShift.spentCash = (activeShift.spentCash || 0) + amount;
          }
        }
      }
    });

    return newExpense;
  }

  public confirmExpense(id: string, isConfirmed = true, confirmedBy?: string): boolean {
    let updated = false;
    db.mutate(state => {
      const exp = state.expenses?.find(e => e.id === id);
      if (!exp) return;

      const wasConfirmed = exp.isConfirmed === true;
      const willBeConfirmed = isConfirmed;

      if (wasConfirmed === willBeConfirmed) {
        return;
      }

      exp.isConfirmed = willBeConfirmed;
      exp.confirmedAt = willBeConfirmed ? new Date().toISOString() : undefined;
      if (confirmedBy) exp.confirmedBy = confirmedBy;

      const isCash = !exp.paymentSource || exp.paymentSource === "Nağd" || exp.paymentSource === "Kassa (Nağd)";
      if (isCash) {
        const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
        if (activeShift) {
          if (willBeConfirmed) {
            activeShift.spentCash = (activeShift.spentCash || 0) + (exp.amount || 0);
          } else {
            activeShift.spentCash = Math.max(0, (activeShift.spentCash || 0) - (exp.amount || 0));
          }
        }
      }

      updated = true;
    });
    return updated;
  }

  public deleteExpense(id: string): boolean {
    let deleted = false;
    db.mutate(state => {
      const exp = state.expenses?.find(e => e.id === id);
      if (!exp) return;

      // If it was confirmed and paid by cash, restore spentCash in active shift
      if (exp.isConfirmed && (!exp.paymentSource || exp.paymentSource === "Nağd" || exp.paymentSource === "Kassa (Nağd)")) {
        const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
        if (activeShift) {
          activeShift.spentCash = Math.max(0, (activeShift.spentCash || 0) - (exp.amount || 0));
        }
      }

      // If linked to a supplier, restore supplier debt and remove corresponding supplierTransaction
      if (exp.supplierId) {
        const sup = state.suppliers?.find(s => s.id === exp.supplierId);
        if (sup) {
          if (exp.isSupplierPayment) {
            sup.totalPaid = Math.max(0, (sup.totalPaid || 0) - (exp.amount || 0));
            sup.debtBalance = Math.max(0, (sup.debtBalance || 0) + (exp.amount || 0));
          } else {
            const invTotal = Number(exp.invoiceTotal) || exp.amount || 0;
            const paid = Number(exp.paidAmount !== undefined ? exp.paidAmount : exp.amount) || 0;
            const debt = Math.max(0, invTotal - paid);
            sup.totalPurchases = Math.max(0, (sup.totalPurchases || 0) - invTotal);
            sup.totalPaid = Math.max(0, (sup.totalPaid || 0) - paid);
            sup.debtBalance = Math.max(0, (sup.debtBalance || 0) - debt);
          }
        }
        if (state.supplierTransactions) {
          state.supplierTransactions = state.supplierTransactions.filter(
            t => !(t.id === exp.id || (t.supplierId === exp.supplierId && Math.abs(t.paidAmount - exp.amount) < 0.01 && t.date === exp.date))
          );
        }
      }

      const initLen = state.expenses?.length || 0;
      state.expenses = state.expenses?.filter(e => e.id !== id) || [];
      deleted = (state.expenses.length < initLen);
    });
    return deleted;
  }
}

export const expenseService = new ExpenseService();
