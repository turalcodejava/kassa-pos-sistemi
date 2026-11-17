import { db } from "../db/database.js";
import { Product, BusinessType } from "../types.js";

export class ProductService {
  public getAllProducts(): Product[] {
    return db.getState().donerProducts;
  }

  public getProductById(id: string): Product | undefined {
    return db.getState().donerProducts.find(p => p.id === id);
  }

  public addProduct(productData: Partial<Product>): Product {
    const isFlower = productData.business === BusinessType.Flower;
    const newProduct: Product = {
      id: (isFlower ? "f_" : "d_") + Date.now(),
      name: productData.name?.trim() || "Adsız Məhsul",
      price: Number(productData.price) || 0,
      category: productData.category || (isFlower ? "Güllər" : "Dönər"),
      business: isFlower ? BusinessType.Flower : BusinessType.Doner,
      ingredients: productData.ingredients || [],
      stock: productData.stock !== undefined ? Number(productData.stock) : undefined,
      totalReceived: productData.totalReceived !== undefined ? Number(productData.totalReceived) : (productData.stock ? Number(productData.stock) : undefined),
      totalSold: 0,
      image: productData.image || ""
    };

    db.mutate(state => {
      if (isFlower) {
        if (!state.flowerProducts) state.flowerProducts = [];
        state.flowerProducts.push(newProduct);
      } else {
        if (!state.donerProducts) state.donerProducts = [];
        state.donerProducts.push(newProduct);
      }
    });

    return newProduct;
  }

  public updateProduct(productData: Partial<Product> & { id: string }): Product | null {
    let updated: Product | null = null;
    db.mutate(state => {
      // Check in donerProducts
      if (state.donerProducts) {
        const dIdx = state.donerProducts.findIndex(p => p.id === productData.id);
        if (dIdx !== -1) {
          state.donerProducts[dIdx] = {
            ...state.donerProducts[dIdx],
            ...productData,
            price: productData.price !== undefined ? Number(productData.price) : state.donerProducts[dIdx].price,
            stock: productData.stock !== undefined ? Number(productData.stock) : state.donerProducts[dIdx].stock
          };
          updated = state.donerProducts[dIdx];
          return;
        }
      }

      // Check in flowerProducts
      if (state.flowerProducts) {
        const fIdx = state.flowerProducts.findIndex(p => p.id === productData.id);
        if (fIdx !== -1) {
          state.flowerProducts[fIdx] = {
            ...state.flowerProducts[fIdx],
            ...productData,
            price: productData.price !== undefined ? Number(productData.price) : state.flowerProducts[fIdx].price,
            stock: productData.stock !== undefined ? Number(productData.stock) : state.flowerProducts[fIdx].stock
          };
          updated = state.flowerProducts[fIdx];
          return;
        }
      }
    });
    return updated;
  }

  public deleteProduct(id: string): boolean {
    let deleted = false;
    db.mutate(state => {
      if (state.donerProducts) {
        const initialLen = state.donerProducts.length;
        state.donerProducts = state.donerProducts.filter(p => p.id !== id);
        if (state.donerProducts.length < initialLen) deleted = true;
      }
      if (state.flowerProducts) {
        const initialFlowerLen = state.flowerProducts.length;
        state.flowerProducts = state.flowerProducts.filter(p => p.id !== id);
        if (state.flowerProducts.length < initialFlowerLen) deleted = true;
      }
    });
    return deleted;
  }

  public adjustStock(productId: string, quantityToAdd: number): boolean {
    let success = false;
    db.mutate(state => {
      const prod = state.donerProducts.find(p => p.id === productId);
      if (prod) {
        prod.stock = (prod.stock || 0) + quantityToAdd;
        prod.totalReceived = (prod.totalReceived || 0) + quantityToAdd;
        if (prod.totalSold === undefined) prod.totalSold = 0;
        success = true;
      }
    });
    return success;
  }
}

export const productService = new ProductService();
