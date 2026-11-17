import { db } from "../db/database.js";
import { Courier } from "../types.js";

export class CourierService {
  public getAllCouriers(): Courier[] {
    return db.getState().couriers || [];
  }

  public addCourier(courier: Partial<Courier>): Courier {
    const newCourier: Courier = {
      id: "c_" + Date.now(),
      name: courier.name?.trim() || "Kuryer",
      phone: courier.phone?.trim() || ""
    };

    db.mutate(state => {
      if (!state.couriers) state.couriers = [];
      state.couriers.push(newCourier);
    });

    return newCourier;
  }

  public deleteCourier(id: string): boolean {
    let deleted = false;
    db.mutate(state => {
      const initLen = state.couriers?.length || 0;
      state.couriers = state.couriers?.filter(c => c.id !== id) || [];
      deleted = (state.couriers.length < initLen);
    });
    return deleted;
  }
}

export const courierService = new CourierService();
