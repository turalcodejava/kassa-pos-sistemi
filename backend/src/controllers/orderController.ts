import { Request, Response } from "express";
import { orderService } from "../services/orderService.js";
import { db } from "../db/database.js";

export class OrderController {
  public getAll(req: Request, res: Response) {
    const orders = orderService.getAllOrders();
    res.json({ success: true, orders, state: db.getState() });
  }

  public createDirect(req: Request, res: Response) {
    const { orderType, items, paymentMethod, paymentNote, deliveryName, deliveryPhone, deliveryAddress, courierId, customCreatedAt } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Sifariş üçün məhsul seçilməyib" });
    }

    const order = orderService.createDirectOrder({
      orderType: orderType || "TAKEAWAY",
      items,
      paymentMethod,
      paymentNote,
      deliveryName,
      deliveryPhone,
      deliveryAddress,
      courierId,
      customCreatedAt
    });

    res.json({ success: true, order, state: db.getState() });
  }

  public completeDelivery(req: Request, res: Response) {
    const { orderId, paymentMethod, paymentNote } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "Sifariş ID tələb olunur" });
    }

    const result = orderService.completeDeliveryOrder(orderId, paymentMethod, paymentNote);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, order: result.order, state: db.getState() });
  }

  public cancel(req: Request, res: Response) {
    const { orderId, adminPin, reason } = req.body;
    if (!orderId || !adminPin) {
      return res.status(400).json({ error: "Sifariş ID və Admin PİN tələb olunur" });
    }

    const result = orderService.cancelOrder(orderId, adminPin, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, order: result.order, state: db.getState() });
  }

  public update(req: Request, res: Response) {
    const { orderId, adminPin, updatedFields } = req.body;
    if (!orderId || !adminPin || !updatedFields) {
      return res.status(400).json({ error: "Sifariş ID, Admin PİN və yenilənəcək məlumatlar tələb olunur" });
    }

    const result = orderService.updateOrder(orderId, adminPin, updatedFields);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, order: result.order, state: db.getState() });
  }

  public delete(req: Request, res: Response) {
    const { orderId, adminPin } = req.body;
    if (!orderId || !adminPin) {
      return res.status(400).json({ error: "Sifariş ID və Admin PİN tələb olunur" });
    }

    const result = orderService.deleteOrder(orderId, adminPin);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, state: db.getState() });
  }
}

export const orderController = new OrderController();
