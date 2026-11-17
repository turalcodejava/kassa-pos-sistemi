import { Request, Response } from "express";
import { inventoryService } from "../services/inventoryService.js";
import { db } from "../db/database.js";

export class InventoryController {
  public handleItemAction(req: Request, res: Response) {
    const { action, item } = req.body;

    if (action === "ADD") {
      inventoryService.addItem(item);
    } else if (action === "EDIT" || action === "UPDATE") {
      inventoryService.updateItem(item.id, item);
    } else if (action === "ADJUST") {
      inventoryService.adjustItemStock(item.id, item.quantityToAdd, item.newStock);
    } else if (action === "DELETE") {
      inventoryService.deleteItem(item.id);
    } else {
      return res.status(400).json({ error: "Yanlış əməliyyat" });
    }

    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }

  public handleUsage(req: Request, res: Response) {
    const { itemId, quantity, reason, date, createdByName, note } = req.body;
    const result = inventoryService.recordUsage({ itemId, quantity, reason, date, createdByName, note });
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Məxaric / İstifadə qeydə alına bilmədi" });
    }
    res.json({
      success: true,
      usage: result.usage,
      item: result.item,
      state: db.getState(),
      version: db.getVersion().version
    });
  }

  public handleDeleteUsage(req: Request, res: Response) {
    const { id, restoreStock } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Qeyd ID-si tələb olunur" });
    }
    inventoryService.deleteUsage(id, restoreStock !== false);
    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }

  public getUsages(req: Request, res: Response) {
    const { itemId } = req.query;
    const usages = inventoryService.getUsages(itemId as string | undefined);
    res.json({ success: true, usages, state: db.getState(), version: db.getVersion().version });
  }

  public handleBatchAction(req: Request, res: Response) {
    const { action, batch } = req.body;

    if (action === "ADD") {
      inventoryService.addBatch(batch);
    } else if (action === "FINISH") {
      inventoryService.finishBatch(batch.id, batch.donerCount);
    } else if (action === "DELETE") {
      inventoryService.deleteBatch(batch.id);
    } else {
      return res.status(400).json({ error: "Yanlış əməliyyat" });
    }

    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }

  public handleLoss(req: Request, res: Response) {
    const { itemId, name, quantity, unit, reason } = req.body;
    const result = inventoryService.recordLoss({ itemId, name, quantity, unit, reason });
    if (!result.success) {
      return res.status(400).json({ error: result.error || "İtki qeydə alına bilmədi" });
    }
    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }
}

export const inventoryController = new InventoryController();
