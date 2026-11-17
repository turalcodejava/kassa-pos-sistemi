import { Request, Response } from "express";
import { supplierService } from "../services/supplierService.js";
import { db } from "../db/database.js";

export class SupplierController {
  public getAll(req: Request, res: Response) {
    const suppliers = supplierService.getAllSuppliers();
    res.json({ success: true, suppliers, state: db.getState(), version: db.getVersion().version });
  }

  public add(req: Request, res: Response) {
    const { supplier } = req.body;
    if (!supplier || !supplier.name) {
      return res.status(400).json({ error: "Təchizatçı adı daxil edilməlidir" });
    }

    const newSupplier = supplierService.addSupplier(supplier);
    res.json({ success: true, supplier: newSupplier, state: db.getState(), version: db.getVersion().version });
  }

  public update(req: Request, res: Response) {
    const { id, updatedFields } = req.body;
    if (!id || !updatedFields) {
      return res.status(400).json({ error: "ID və yenilənəcək məlumatlar tələb olunur" });
    }

    const updated = supplierService.updateSupplier(id, updatedFields);
    if (!updated) {
      return res.status(404).json({ error: "Təchizatçı tapılmadı" });
    }

    res.json({ success: true, supplier: updated, state: db.getState(), version: db.getVersion().version });
  }

  public delete(req: Request, res: Response) {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Təchizatçı ID tələb olunur" });
    }

    const deleted = supplierService.deleteSupplier(id);
    if (!deleted) {
      return res.status(404).json({ error: "Təchizatçı tapılmadı" });
    }

    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }

  public recordPurchase(req: Request, res: Response) {
    const data = req.body;
    if (!data.supplierId || !data.totalAmount) {
      return res.status(400).json({ error: "Təchizatçı və ümumi məbləğ tələb olunur" });
    }

    const result = supplierService.recordPurchase(data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      supplier: result.supplier,
      transaction: result.transaction,
      expense: result.expense,
      state: db.getState(),
      version: db.getVersion().version
    });
  }

  public recordPayment(req: Request, res: Response) {
    const data = req.body;
    if (!data.supplierId || !data.amount) {
      return res.status(400).json({ error: "Təchizatçı və ödəniş məbləği tələb olunur" });
    }

    const result = supplierService.recordPayment(data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      supplier: result.supplier,
      transaction: result.transaction,
      expense: result.expense,
      state: db.getState(),
      version: db.getVersion().version
    });
  }

  public getTransactions(req: Request, res: Response) {
    const { supplierId } = req.query;
    const transactions = supplierService.getSupplierTransactions(supplierId as string | undefined);
    res.json({ success: true, transactions, state: db.getState(), version: db.getVersion().version });
  }

  public updateTransaction(req: Request, res: Response) {
    const { id, updatedFields } = req.body;
    if (!id || !updatedFields) {
      return res.status(400).json({ error: "ID və yenilənəcək sahələr tələb olunur" });
    }

    const result = supplierService.updateTransaction(id, updatedFields);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      transaction: result.transaction,
      supplier: result.supplier,
      state: db.getState(),
      version: db.getVersion().version
    });
  }

  public deleteTransaction(req: Request, res: Response) {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Əməliyyat ID tələb olunur" });
    }

    const result = supplierService.deleteTransaction(id);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Əməliyyat silinə bilmədi" });
    }

    res.json({
      success: true,
      supplier: result.supplier,
      state: db.getState(),
      version: db.getVersion().version
    });
  }
}

export const supplierController = new SupplierController();
