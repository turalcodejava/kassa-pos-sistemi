import { db } from "../db/database.js";
import { Supplier, SupplierTransaction, Expense, ExpensePaymentSource, BusinessType } from "../types.js";

export class SupplierService {
  public getAllSuppliers(): Supplier[] {
    return db.getState().suppliers || [];
  }

  public getSupplier(id: string): Supplier | undefined {
    return (db.getState().suppliers || []).find(s => s.id === id);
  }

  public addSupplier(data: Partial<Supplier>): Supplier {
    const newSupplier: Supplier = {
      id: "sup_" + Date.now(),
      name: data.name?.trim() || "Təchizatçı",
      suppliedProduct: data.suppliedProduct?.trim() || "",
      phone: data.phone?.trim() || "",
      company: data.company?.trim() || "",
      category: data.category?.trim() || "Ərzaq və Məhsul",
      note: data.note?.trim() || "",
      totalPurchases: Number(data.totalPurchases) || 0,
      totalPaid: Number(data.totalPaid) || 0,
      debtBalance: Number(data.debtBalance) || 0,
      createdAt: new Date().toISOString()
    };

    db.mutate(state => {
      if (!state.suppliers) state.suppliers = [];
      state.suppliers.push(newSupplier);
    });

    return newSupplier;
  }

  public updateSupplier(id: string, data: Partial<Supplier>): Supplier | null {
    let updated: Supplier | null = null;

    db.mutate(state => {
      if (!state.suppliers) state.suppliers = [];
      const sup = state.suppliers.find(s => s.id === id);
      if (sup) {
        if (data.name !== undefined) sup.name = data.name.trim();
        if (data.suppliedProduct !== undefined) sup.suppliedProduct = data.suppliedProduct.trim();
        if (data.phone !== undefined) sup.phone = data.phone.trim();
        if (data.company !== undefined) sup.company = data.company.trim();
        if (data.category !== undefined) sup.category = data.category.trim();
        if (data.note !== undefined) sup.note = data.note.trim();
        if (data.totalPurchases !== undefined) sup.totalPurchases = Number(data.totalPurchases) || 0;
        if (data.totalPaid !== undefined) sup.totalPaid = Number(data.totalPaid) || 0;
        if (data.debtBalance !== undefined) sup.debtBalance = Number(data.debtBalance) || 0;
        updated = sup;
      }
    });

    return updated;
  }

  public deleteSupplier(id: string): boolean {
    let deleted = false;
    db.mutate(state => {
      const initLen = state.suppliers?.length || 0;
      state.suppliers = (state.suppliers || []).filter(s => s.id !== id);
      deleted = (state.suppliers.length < initLen);
    });
    return deleted;
  }

  public recordPurchase(data: {
    supplierId: string;
    totalAmount: number;
    paidAmount: number;
    paymentSource?: ExpensePaymentSource;
    itemsSummary?: string;
    date?: string;
    note?: string;
    inventoryItemId?: string;
    inventoryItemName?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    addToMenu?: boolean;
    menuPrice?: number;
    itemCategory?: string;
  }): { success: boolean; supplier?: Supplier; transaction?: SupplierTransaction; expense?: Expense; error?: string } {
    const totalAmount = Number(data.totalAmount) || 0;
    const paidAmount = Number(data.paidAmount) || 0;
    const debtAmount = Math.max(0, totalAmount - paidAmount);

    if (totalAmount <= 0) {
      return { success: false, error: "Alış məbləği 0-dan böyük olmalıdır!" };
    }

    let resultSupplier: Supplier | undefined;
    let resultTx: SupplierTransaction | undefined;
    let resultExp: Expense | undefined;

    db.mutate(state => {
      if (!state.suppliers) state.suppliers = [];
      const supplier = state.suppliers.find(s => s.id === data.supplierId);
      if (!supplier) {
        return;
      }

      // Update supplier balances
      supplier.totalPurchases = (supplier.totalPurchases || 0) + totalAmount;
      supplier.totalPaid = (supplier.totalPaid || 0) + paidAmount;
      supplier.debtBalance = Math.max(0, (supplier.debtBalance || 0) + debtAmount);
      resultSupplier = supplier;

      const dateStr = data.date || new Date().toISOString().split("T")[0];
      const timestamp = new Date().toISOString();

      // Create transaction log
      const tx: SupplierTransaction = {
        id: "tx_sup_" + Date.now(),
        supplierId: supplier.id,
        supplierName: supplier.name,
        type: "PURCHASE",
        totalAmount,
        paidAmount,
        debtAmount,
        paymentSource: data.paymentSource || "Kassa (Nağd)",
        note: data.note || "",
        date: dateStr,
        timestamp,
        itemsSummary: data.itemsSummary || (data.inventoryItemName ? `${data.quantity || 1} ${data.unit || "ədəd"} ${data.inventoryItemName}` : "Məhsul Alışı")
      };

      if (!state.supplierTransactions) state.supplierTransactions = [];
      state.supplierTransactions.unshift(tx);
      resultTx = tx;

      // If money was paid now, create an Expense entry
      if (paidAmount > 0) {
        const exp: Expense = {
          id: "exp_" + Date.now(),
          title: `Təchizatçı Alışı: ${supplier.name}` + (data.inventoryItemName ? ` (${data.inventoryItemName})` : ""),
          amount: paidAmount,
          category: "Məhsul Alışı",
          date: dateStr,
          business: BusinessType.Doner,
          isInventoryPurchase: !!data.inventoryItemName,
          inventoryItemId: data.inventoryItemId,
          inventoryItemName: data.inventoryItemName,
          itemCategory: data.itemCategory || "İçki",
          quantity: data.quantity ? Number(data.quantity) : undefined,
          unit: data.unit,
          unitPrice: data.unitPrice ? Number(data.unitPrice) : undefined,
          paymentSource: data.paymentSource || "Kassa (Nağd)",
          note: (data.note ? data.note + " | " : "") + (debtAmount > 0 ? `Qaimə: ${totalAmount} ₼ (Borca qalan: ${debtAmount.toFixed(2)} ₼)` : `Tam ödənilib: ${totalAmount} ₼`),
          supplierId: supplier.id,
          supplierName: supplier.name,
          invoiceTotal: totalAmount,
          paidAmount: paidAmount,
          debtAmount: debtAmount,
          isConfirmed: true,
          confirmedAt: timestamp
        };

        if (!state.expenses) state.expenses = [];
        state.expenses.unshift(exp);
        resultExp = exp;

        // Deduct from active shift if cash
        if (!exp.paymentSource || exp.paymentSource === "Nağd" || exp.paymentSource === "Kassa (Nağd)") {
          const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
          if (activeShift) {
            activeShift.spentCash = (activeShift.spentCash || 0) + paidAmount;
            activeShift.expectedCash = Math.max(0, (activeShift.expectedCash || 0) - paidAmount);
          }
        }
      }

      // Restock warehouse product if name and qty specified
      if (data.inventoryItemName && data.quantity) {
        const qty = Number(data.quantity) || 0;
        const rawName = String(data.inventoryItemName).trim();
        const unit = data.unit || "ədəd";
        const cat = data.itemCategory || "İçki";

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
          } else if (data.addToMenu) {
            const menuPrice = Number(data.menuPrice) || (data.unitPrice ? data.unitPrice * 1.5 : 2.0);
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
    });

    if (!resultSupplier) {
      return { success: false, error: "Təchizatçı tapılmadı!" };
    }

    return {
      success: true,
      supplier: resultSupplier,
      transaction: resultTx,
      expense: resultExp
    };
  }

  public recordPayment(data: {
    supplierId: string;
    amount: number;
    paymentSource: ExpensePaymentSource;
    note?: string;
    date?: string;
  }): { success: boolean; supplier?: Supplier; transaction?: SupplierTransaction; expense?: Expense; error?: string } {
    const amount = Number(data.amount) || 0;
    if (amount <= 0) {
      return { success: false, error: "Ödəniş məbləği 0-dan böyük olmalıdır!" };
    }

    let resultSupplier: Supplier | undefined;
    let resultTx: SupplierTransaction | undefined;
    let resultExp: Expense | undefined;

    db.mutate(state => {
      if (!state.suppliers) state.suppliers = [];
      const supplier = state.suppliers.find(s => s.id === data.supplierId);
      if (!supplier) {
        return;
      }

      // Update supplier balances
      supplier.totalPaid = (supplier.totalPaid || 0) + amount;
      supplier.debtBalance = Math.max(0, (supplier.debtBalance || 0) - amount);
      resultSupplier = supplier;

      const dateStr = data.date || new Date().toISOString().split("T")[0];
      const timestamp = new Date().toISOString();

      // Create transaction log
      const tx: SupplierTransaction = {
        id: "tx_sup_" + Date.now(),
        supplierId: supplier.id,
        supplierName: supplier.name,
        type: "PAYMENT",
        totalAmount: amount,
        paidAmount: amount,
        debtAmount: 0,
        paymentSource: data.paymentSource || "Kassa (Nağd)",
        note: data.note || "Təchizatçıya borc ödənişi",
        date: dateStr,
        timestamp,
        itemsSummary: `Borc ödənişi: ${amount.toFixed(2)} ₼`
      };

      if (!state.supplierTransactions) state.supplierTransactions = [];
      state.supplierTransactions.unshift(tx);
      resultTx = tx;

      // Create Expense record
      const exp: Expense = {
        id: "exp_" + Date.now(),
        title: `Təchizatçı Borc Ödənişi: ${supplier.name}`,
        amount: amount,
        category: "Təchizatçı Borc Ödənişi",
        date: dateStr,
        business: BusinessType.Doner,
        paymentSource: data.paymentSource || "Kassa (Nağd)",
        note: data.note || `Qalıq borc ödənildi (Yeni qalıq: ${supplier.debtBalance.toFixed(2)} ₼)`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        paidAmount: amount,
        isSupplierPayment: true,
        isConfirmed: true,
        confirmedAt: timestamp
      };

      if (!state.expenses) state.expenses = [];
      state.expenses.unshift(exp);
      resultExp = exp;

      // Deduct from active shift if cash
      if (!exp.paymentSource || exp.paymentSource === "Nağd" || exp.paymentSource === "Kassa (Nağd)") {
        const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
        if (activeShift) {
          activeShift.spentCash = (activeShift.spentCash || 0) + amount;
          activeShift.expectedCash = Math.max(0, (activeShift.expectedCash || 0) - amount);
        }
      }
    });

    if (!resultSupplier) {
      return { success: false, error: "Təchizatçı tapılmadı!" };
    }

    return {
      success: true,
      supplier: resultSupplier,
      transaction: resultTx,
      expense: resultExp
    };
  }

  public getSupplierTransactions(supplierId?: string): SupplierTransaction[] {
    const txs = db.getState().supplierTransactions || [];
    if (!supplierId) return txs;
    return txs.filter(t => t.supplierId === supplierId);
  }

  public updateTransaction(
    id: string,
    updatedFields: {
      itemsSummary?: string;
      note?: string;
      date?: string;
      paidAmount?: number;
      totalAmount?: number;
      paymentSource?: ExpensePaymentSource;
    }
  ): { success: boolean; transaction?: SupplierTransaction; supplier?: Supplier; error?: string } {
    let resultTx: SupplierTransaction | undefined;
    let resultSup: Supplier | undefined;

    db.mutate(state => {
      if (!state.supplierTransactions) state.supplierTransactions = [];
      let tx = state.supplierTransactions.find(t => t.id === id);

      // Fallback: If not in supplierTransactions but in expenses
      if (!tx && state.expenses) {
        const fallbackExp = state.expenses.find(e => e.id === id);
        if (fallbackExp && fallbackExp.supplierId) {
          const sup = state.suppliers?.find(s => s.id === fallbackExp.supplierId);
          tx = {
            id: fallbackExp.id,
            supplierId: fallbackExp.supplierId,
            supplierName: fallbackExp.supplierName || (sup ? sup.name : "Təchizatçı"),
            type: fallbackExp.isSupplierPayment ? "PAYMENT" : "PURCHASE",
            totalAmount: fallbackExp.invoiceTotal || fallbackExp.amount,
            paidAmount: fallbackExp.amount,
            debtAmount: fallbackExp.debtAmount || 0,
            paymentSource: fallbackExp.paymentSource,
            note: fallbackExp.note || "",
            date: fallbackExp.date,
            timestamp: fallbackExp.confirmedAt || fallbackExp.date,
            itemsSummary: fallbackExp.title
          };
          state.supplierTransactions.unshift(tx);
        }
      }

      if (!tx) {
        return;
      }

      const supplier = state.suppliers?.find(s => s.id === tx!.supplierId);
      const oldPaid = Number(tx.paidAmount) || 0;
      const oldTotal = Number(tx.totalAmount) || 0;
      const oldDebt = Number(tx.debtAmount) || 0;

      if (tx.type === "PAYMENT") {
        const newPaid = updatedFields.paidAmount !== undefined
          ? Math.max(0, Number(updatedFields.paidAmount) || 0)
          : (updatedFields.totalAmount !== undefined ? Math.max(0, Number(updatedFields.totalAmount) || 0) : oldPaid);

        const delta = newPaid - oldPaid;

        if (supplier) {
          supplier.totalPaid = Math.max(0, (supplier.totalPaid || 0) + delta);
          supplier.debtBalance = Math.max(0, (supplier.debtBalance || 0) - delta);
          resultSup = supplier;
        }

        tx.paidAmount = newPaid;
        tx.totalAmount = newPaid;
        tx.debtAmount = 0;

        if (updatedFields.itemsSummary !== undefined && updatedFields.itemsSummary.trim()) {
          tx.itemsSummary = updatedFields.itemsSummary.trim();
        } else if (!tx.itemsSummary || tx.itemsSummary.startsWith("Borc ödənişi:")) {
          tx.itemsSummary = `Borc ödənişi: ${newPaid.toFixed(2)} ₼`;
        }

        // Adjust active shift if cash
        const oldSource = tx.paymentSource || "Kassa (Nağd)";
        const newSource = updatedFields.paymentSource || oldSource;
        const isOldCash = oldSource === "Nağd" || oldSource === "Kassa (Nağd)";
        const isNewCash = newSource === "Nağd" || newSource === "Kassa (Nağd)";

        const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
        if (activeShift) {
          if (isOldCash && isNewCash) {
            activeShift.spentCash = Math.max(0, (activeShift.spentCash || 0) + delta);
            activeShift.expectedCash = Math.max(0, (activeShift.expectedCash || 0) - delta);
          } else if (!isOldCash && isNewCash) {
            activeShift.spentCash = (activeShift.spentCash || 0) + newPaid;
            activeShift.expectedCash = Math.max(0, (activeShift.expectedCash || 0) - newPaid);
          } else if (isOldCash && !isNewCash) {
            activeShift.spentCash = Math.max(0, (activeShift.spentCash || 0) - oldPaid);
            activeShift.expectedCash = (activeShift.expectedCash || 0) + oldPaid;
          }
        }

        if (updatedFields.paymentSource !== undefined) tx.paymentSource = updatedFields.paymentSource;
        if (updatedFields.note !== undefined) tx.note = updatedFields.note.trim();
        if (updatedFields.date !== undefined && updatedFields.date.trim()) tx.date = updatedFields.date.trim();

        // Update corresponding expense in state.expenses
        if (state.expenses) {
          const exp = state.expenses.find(
            e => e.id === tx!.id ||
              (e.supplierId === tx!.supplierId && (e.isSupplierPayment || e.category === "Təchizatçı Borc Ödənişi") && Math.abs(e.amount - oldPaid) < 0.01)
          );
          if (exp) {
            exp.amount = newPaid;
            exp.paidAmount = newPaid;
            if (tx.itemsSummary) exp.title = `Təchizatçı Borc Ödənişi: ${supplier ? supplier.name : tx.supplierName}`;
            if (updatedFields.date) exp.date = updatedFields.date.trim();
            if (updatedFields.note !== undefined) exp.note = updatedFields.note.trim();
            if (updatedFields.paymentSource) exp.paymentSource = updatedFields.paymentSource;
          }
        }
      } else {
        // PURCHASE
        const newTotal = updatedFields.totalAmount !== undefined ? Math.max(0, Number(updatedFields.totalAmount) || 0) : oldTotal;
        const newPaid = updatedFields.paidAmount !== undefined ? Math.max(0, Number(updatedFields.paidAmount) || 0) : oldPaid;
        const newDebt = Math.max(0, newTotal - newPaid);

        const deltaTotal = newTotal - oldTotal;
        const deltaPaid = newPaid - oldPaid;
        const deltaDebt = newDebt - oldDebt;

        if (supplier) {
          supplier.totalPurchases = Math.max(0, (supplier.totalPurchases || 0) + deltaTotal);
          supplier.totalPaid = Math.max(0, (supplier.totalPaid || 0) + deltaPaid);
          supplier.debtBalance = Math.max(0, (supplier.debtBalance || 0) + deltaDebt);
          resultSup = supplier;
        }

        tx.totalAmount = newTotal;
        tx.paidAmount = newPaid;
        tx.debtAmount = newDebt;

        if (updatedFields.itemsSummary !== undefined && updatedFields.itemsSummary.trim()) {
          tx.itemsSummary = updatedFields.itemsSummary.trim();
        }
        if (updatedFields.paymentSource !== undefined) tx.paymentSource = updatedFields.paymentSource;
        if (updatedFields.note !== undefined) tx.note = updatedFields.note.trim();
        if (updatedFields.date !== undefined && updatedFields.date.trim()) tx.date = updatedFields.date.trim();

        // Adjust active shift if cash
        const oldSource = tx.paymentSource || "Kassa (Nağd)";
        const newSource = updatedFields.paymentSource || oldSource;
        const isOldCash = oldSource === "Nağd" || oldSource === "Kassa (Nağd)";
        const isNewCash = newSource === "Nağd" || newSource === "Kassa (Nağd)";

        const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
        if (activeShift) {
          if (isOldCash && isNewCash) {
            activeShift.spentCash = Math.max(0, (activeShift.spentCash || 0) + deltaPaid);
            activeShift.expectedCash = Math.max(0, (activeShift.expectedCash || 0) - deltaPaid);
          } else if (!isOldCash && isNewCash) {
            activeShift.spentCash = (activeShift.spentCash || 0) + newPaid;
            activeShift.expectedCash = Math.max(0, (activeShift.expectedCash || 0) - newPaid);
          } else if (isOldCash && !isNewCash) {
            activeShift.spentCash = Math.max(0, (activeShift.spentCash || 0) - oldPaid);
            activeShift.expectedCash = (activeShift.expectedCash || 0) + oldPaid;
          }
        }

        // Update corresponding expense in state.expenses
        if (state.expenses) {
          const exp = state.expenses.find(
            e => e.id === tx!.id ||
              (e.supplierId === tx!.supplierId && !e.isSupplierPayment && Math.abs((e.invoiceTotal || e.amount) - oldTotal) < 0.01)
          );
          if (exp) {
            exp.amount = newPaid;
            exp.paidAmount = newPaid;
            exp.invoiceTotal = newTotal;
            exp.debtAmount = newDebt;
            if (tx.itemsSummary) exp.title = `Təchizatçı Alışı: ${supplier ? supplier.name : tx.supplierName} (${tx.itemsSummary})`;
            if (updatedFields.date) exp.date = updatedFields.date.trim();
            if (updatedFields.note !== undefined) exp.note = updatedFields.note.trim();
            if (updatedFields.paymentSource) exp.paymentSource = updatedFields.paymentSource;
          }
        }
      }

      resultTx = tx;
      if (supplier && !resultSup) resultSup = supplier;
    });

    if (!resultTx) {
      return { success: false, error: "Əməliyyat tapılmadı!" };
    }
    return { success: true, transaction: resultTx, supplier: resultSup };
  }

  public deleteTransaction(id: string): { success: boolean; supplier?: Supplier; error?: string } {
    let resultSup: Supplier | undefined;
    let found = false;

    db.mutate(state => {
      if (!state.supplierTransactions) state.supplierTransactions = [];
      const tx = state.supplierTransactions.find(t => t.id === id);

      if (tx) {
        found = true;
        const supplier = state.suppliers?.find(s => s.id === tx.supplierId);
        const paid = Number(tx.paidAmount) || 0;
        const total = Number(tx.totalAmount) || 0;
        const debt = Number(tx.debtAmount) || 0;

        if (tx.type === "PAYMENT") {
          if (supplier) {
            supplier.totalPaid = Math.max(0, (supplier.totalPaid || 0) - paid);
            supplier.debtBalance = Math.max(0, (supplier.debtBalance || 0) + paid);
            resultSup = supplier;
          }

          // Restore cash in active shift if this was paid with cash
          const isCash = !tx.paymentSource || tx.paymentSource === "Nağd" || tx.paymentSource === "Kassa (Nağd)";
          if (isCash) {
            const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
            if (activeShift) {
              activeShift.spentCash = Math.max(0, (activeShift.spentCash || 0) - paid);
              activeShift.expectedCash = (activeShift.expectedCash || 0) + paid;
            }
          }

          // Remove linked expense
          if (state.expenses) {
            state.expenses = state.expenses.filter(
              e => !(e.id === tx.id || (e.supplierId === tx.supplierId && (e.isSupplierPayment || e.category === "Təchizatçı Borc Ödənişi") && Math.abs(e.amount - paid) < 0.01))
            );
          }
        } else {
          // PURCHASE
          if (supplier) {
            supplier.totalPurchases = Math.max(0, (supplier.totalPurchases || 0) - total);
            supplier.totalPaid = Math.max(0, (supplier.totalPaid || 0) - paid);
            supplier.debtBalance = Math.max(0, (supplier.debtBalance || 0) - debt);
            resultSup = supplier;
          }

          // Restore cash in active shift if paid upfront with cash
          const isCash = !tx.paymentSource || tx.paymentSource === "Nağd" || tx.paymentSource === "Kassa (Nağd)";
          if (isCash && paid > 0) {
            const activeShift = state.shifts?.find(s => s.status === "ACTIVE");
            if (activeShift) {
              activeShift.spentCash = Math.max(0, (activeShift.spentCash || 0) - paid);
              activeShift.expectedCash = (activeShift.expectedCash || 0) + paid;
            }
          }

          // Remove linked expense
          if (state.expenses) {
            state.expenses = state.expenses.filter(
              e => !(e.id === tx.id || (e.supplierId === tx.supplierId && !e.isSupplierPayment && Math.abs((e.invoiceTotal || e.amount) - total) < 0.01))
            );
          }
        }

        // Remove from supplierTransactions
        state.supplierTransactions = state.supplierTransactions.filter(t => t.id !== id);
      } else if (state.expenses) {
        // Fallback: check if id matches an expense
        const exp = state.expenses.find(e => e.id === id);
        if (exp && exp.supplierId) {
          found = true;
          const supplier = state.suppliers?.find(s => s.id === exp.supplierId);
          if (supplier) {
            if (exp.isSupplierPayment) {
              supplier.totalPaid = Math.max(0, (supplier.totalPaid || 0) - exp.amount);
              supplier.debtBalance = Math.max(0, (supplier.debtBalance || 0) + exp.amount);
            } else {
              const invTotal = Number(exp.invoiceTotal) || exp.amount;
              const paid = Number(exp.paidAmount !== undefined ? exp.paidAmount : exp.amount);
              const debt = Math.max(0, invTotal - paid);
              supplier.totalPurchases = Math.max(0, (supplier.totalPurchases || 0) - invTotal);
              supplier.totalPaid = Math.max(0, (supplier.totalPaid || 0) - paid);
              supplier.debtBalance = Math.max(0, (supplier.debtBalance || 0) - debt);
            }
            resultSup = supplier;
          }
          state.expenses = state.expenses.filter(e => e.id !== id);
        }
      }
    });

    if (!found) {
      return { success: false, error: "Əməliyyat tapılmadı!" };
    }

    return { success: true, supplier: resultSup };
  }
}

export const supplierService = new SupplierService();
