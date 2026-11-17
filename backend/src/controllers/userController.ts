import { Request, Response } from "express";
import { userService } from "../services/userService.js";
import { db } from "../db/database.js";

export class UserController {
  public getAll(req: Request, res: Response) {
    const users = userService.getAllUsers();
    res.json({ success: true, users, state: db.getState() });
  }

  public handleUserAction(req: Request, res: Response) {
    const { action, user } = req.body;

    if (action === "ADD") {
      const result = userService.addUser(user);
      if (!result.success) {
        return res.status(400).json({ error: result.error || "İstifadəçi əlavə edilə bilmədi" });
      }
    } else if (action === "EDIT") {
      const result = userService.updateUser(user);
      if (!result.success) {
        return res.status(400).json({ error: result.error || "İstifadəçi yenilənə bilmədi" });
      }
    } else if (action === "DELETE") {
      const result = userService.deleteUser(user.id);
      if (!result.success) {
        return res.status(400).json({ error: result.error || "İstifadəçi silinə bilmədi" });
      }
    } else {
      return res.status(400).json({ error: "Yanlış əməliyyat" });
    }

    res.json({ success: true, state: db.getState() });
  }
}

export const userController = new UserController();
