import { Request, Response } from "express";
import { productService } from "../services/productService.js";
import { db } from "../db/database.js";

export class ProductController {
  public getAll(req: Request, res: Response) {
    const products = productService.getAllProducts();
    res.json({ success: true, products, state: db.getState() });
  }

  public handleProductAction(req: Request, res: Response) {
    const { action, product } = req.body;

    if (action === "ADD") {
      productService.addProduct(product);
    } else if (action === "EDIT") {
      productService.updateProduct(product);
    } else if (action === "DELETE") {
      productService.deleteProduct(product.id);
    } else {
      return res.status(400).json({ error: "Yanlış əməliyyat" });
    }

    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }

  public adjustStock(req: Request, res: Response) {
    const { productId, quantityToAdd } = req.body;
    const qty = Number(quantityToAdd);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, error: "Yanlış miqdar" });
    }

    const success = productService.adjustStock(productId, qty);
    if (success) {
      res.json({ success: true, state: db.getState(), version: db.getVersion().version });
    } else {
      res.status(404).json({ success: false, error: "Məhsul tapılmadı" });
    }
  }
}

export const productController = new ProductController();
