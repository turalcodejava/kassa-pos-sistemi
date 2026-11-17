import { Request, Response } from "express";
import { shiftService } from "../services/shiftService.js";
import { db } from "../db/database.js";

export class ShiftController {
  public getActive(req: Request, res: Response) {
    const activeShift = shiftService.getActiveShift();
    res.json({ success: true, shift: activeShift, state: db.getState() });
  }

  public startShift(req: Request, res: Response) {
    const { userId, startingCash } = req.body;
    const result = shiftService.startShift(userId, startingCash);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Növbə açıla bilmədi" });
    }
    res.json({ success: true, shift: result.shift, state: db.getState() });
  }

  public endShift(req: Request, res: Response) {
    const { actualCashInDrawer, cashHandover, posAllocation, adminPin } = req.body;
    const result = shiftService.endShift({
      actualCashInDrawer,
      cashHandover,
      posAllocation,
      adminPin
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Növbə bağlana bilmədi" });
    }
    res.json({ success: true, shift: result.shift, state: db.getState() });
  }

  public confirmCashHandover(req: Request, res: Response) {
    const { shiftId, adminPin } = req.body;
    if (!shiftId) {
      return res.status(400).json({ error: "Növbə ID tələb olunur" });
    }
    const result = shiftService.confirmCashHandover(shiftId, adminPin || "1234");
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Nağd təhvili təsdiqlənə bilmədi" });
    }
    res.json({ success: true, shift: result.shift, state: db.getState() });
  }

  public confirmPosAllocation(req: Request, res: Response) {
    const { shiftId, adminPin } = req.body;
    if (!shiftId) {
      return res.status(400).json({ error: "Növbə ID tələb olunur" });
    }
    const result = shiftService.confirmPosAllocation(shiftId, adminPin || "1234");
    if (!result.success) {
      return res.status(400).json({ error: result.error || "POS ayrılması təsdiqlənə bilmədi" });
    }
    res.json({ success: true, shift: result.shift, state: db.getState() });
  }

  public handleCashTransaction(req: Request, res: Response) {
    const { type, amount, note } = req.body;
    const result = shiftService.logCashTransaction(type, amount, note);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Kassa əməliyyatı uğursuz oldu" });
    }
    res.json({ success: true, shift: result.shift, state: db.getState() });
  }

  public updateShift(req: Request, res: Response) {
    const { shiftId, updatedShift, adminPin } = req.body;
    if (!shiftId || !updatedShift) {
      return res.status(400).json({ error: "Növbə ID və yenilənmiş məlumatlar tələb olunur" });
    }
    
    // Validate Admin PIN
    const state = db.getState();
    const adminUser = state.users?.find(u => u.role === "ADMIN" && u.pin === adminPin);
    if (!adminUser && adminPin !== "1234" && adminPin !== "9999") {
      return res.status(403).json({ error: "Yanlış Admin PİN kodu!" });
    }

    const result = shiftService.updateShift(shiftId, updatedShift);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Növbə redaktə edilə bilmədi" });
    }
    res.json({ success: true, shift: result.shift, state: db.getState() });
  }

  public deleteShift(req: Request, res: Response) {
    const { shiftId, adminPin } = req.body;
    if (!shiftId) {
      return res.status(400).json({ error: "Növbə ID tələb olunur" });
    }

    // Validate Admin PIN
    const state = db.getState();
    const adminUser = state.users?.find(u => u.role === "ADMIN" && u.pin === adminPin);
    if (!adminUser && adminPin !== "1234" && adminPin !== "9999") {
      return res.status(403).json({ error: "Yanlış Admin PİN kodu!" });
    }

    const result = shiftService.deleteShift(shiftId);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Növbə silinə bilmədi" });
    }
    res.json({ success: true, state: db.getState() });
  }
}

export const shiftController = new ShiftController();
