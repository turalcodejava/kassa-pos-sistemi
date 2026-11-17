import { Request, Response } from "express";
import { tableService } from "../services/tableService.js";
import { db } from "../db/database.js";

export class TableController {
  public updateCount(req: Request, res: Response) {
    const { count } = req.body;
    tableService.updateTableCount(count);
    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }

  public updateOrder(req: Request, res: Response) {
    const { tableNumber, items, status, guestCount } = req.body;
    const table = tableService.updateTableOrder({ tableNumber, items, status, guestCount });
    if (!table) {
      return res.status(404).json({ error: "Masa tapılmadı" });
    }
    res.json({ success: true, table, state: db.getState(), version: db.getVersion().version });
  }

  public updateLayout(req: Request, res: Response) {
    const { tables } = req.body;
    if (!Array.isArray(tables)) {
      return res.status(400).json({ error: "Yanlış masa məlumatları" });
    }
    tableService.updateTableLayout(tables);
    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }

  public updateProperties(req: Request, res: Response) {
    const { tableNumber, guestCount, capacity, shape, section, tableName, status, reservedFor } = req.body;
    const table = tableService.updateTableProperties({
      tableNumber,
      guestCount,
      capacity,
      shape,
      section,
      tableName,
      status,
      reservedFor
    });
    if (!table) {
      return res.status(404).json({ error: "Masa tapılmadı" });
    }
    res.json({ success: true, table, state: db.getState(), version: db.getVersion().version });
  }

  public handleCustomerQR(req: Request, res: Response) {
    const { tableNumber, items } = req.body;
    const result = tableService.addCustomerOrder(tableNumber, items || []);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Müştəri sifarişi qəbul edilmədi" });
    }
    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }

  public clearTable(req: Request, res: Response) {
    const { tableNumber, paymentMethod, paymentNote, customCreatedAt } = req.body;
    const result = tableService.checkoutTable(tableNumber, paymentMethod, paymentNote, customCreatedAt);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Masa tamamlana bilmədi" });
    }
    res.json({ success: true, order: result.order, state: db.getState(), version: db.getVersion().version });
  }

  public lock(req: Request, res: Response) {
    const { tableNumber, deviceId, deviceName, waiterName, ttlSeconds } = req.body;
    if (!tableNumber || !deviceId) {
      return res.status(400).json({ error: "Masa nömrəsi və cihaz identifikatoru tələb olunur" });
    }
    const result = tableService.lockTable({
      tableNumber,
      deviceId,
      deviceName,
      waiterName: waiterName || "Ofisiant",
      ttlSeconds
    });
    if (!result.success) {
      return res.status(409).json({ error: result.error, lockedBy: result.lockedBy });
    }
    res.json({ success: true, table: result.table, state: db.getState(), version: db.getVersion().version });
  }

  public unlock(req: Request, res: Response) {
    const { tableNumber, deviceId, forceAdmin } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ error: "Masa nömrəsi tələb olunur" });
    }
    const result = tableService.unlockTable({
      tableNumber,
      deviceId,
      forceAdmin: Boolean(forceAdmin)
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, table: result.table, state: db.getState(), version: db.getVersion().version });
  }

  public heartbeat(req: Request, res: Response) {
    const { tableNumber, deviceId, ttlSeconds } = req.body;
    if (!tableNumber || !deviceId) {
      return res.status(400).json({ error: "Məlumatlar tam deyil" });
    }
    const result = tableService.heartbeatLock({
      tableNumber,
      deviceId,
      ttlSeconds
    });
    res.json(result);
  }
}

export const tableController = new TableController();
