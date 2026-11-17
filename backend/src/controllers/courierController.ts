import { Request, Response } from "express";
import { courierService } from "../services/courierService.js";
import { db } from "../db/database.js";

export class CourierController {
  public getAll(req: Request, res: Response) {
    const couriers = courierService.getAllCouriers();
    res.json({ success: true, couriers, state: db.getState() });
  }

  public handleCourierAction(req: Request, res: Response) {
    const { action, courier } = req.body;

    if (action === "ADD") {
      courierService.addCourier(courier);
    } else if (action === "DELETE") {
      courierService.deleteCourier(courier.id);
    } else {
      return res.status(400).json({ error: "Yanlış əməliyyat" });
    }

    res.json({ success: true, state: db.getState() });
  }
}

export const courierController = new CourierController();
