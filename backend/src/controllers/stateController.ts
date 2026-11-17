import { Request, Response } from "express";
import { db } from "../db/database.js";
import { reportService } from "../services/reportService.js";
import { userService } from "../services/userService.js";

export class StateController {
  public getState(req: Request, res: Response) {
    res.json(db.getState());
  }

  public getVersion(req: Request, res: Response) {
    res.json(db.getVersion());
  }

  public saveState(req: Request, res: Response) {
    const newState = req.body;
    db.setState(newState);
    res.json({ success: true, state: db.getState() });
  }

  public getAnalytics(req: Request, res: Response) {
    const analytics = reportService.getAnalytics();
    res.json({ success: true, analytics });
  }

  public login(req: Request, res: Response) {
    const { pin } = req.body;
    const user = userService.authenticate(pin);
    if (!user) {
      return res.status(401).json({ success: false, error: "Yanlış PIN kod!" });
    }
    res.json({ success: true, user });
  }
}

export const stateController = new StateController();
