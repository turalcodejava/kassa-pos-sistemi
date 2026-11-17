import { db } from "../db/database.js";
import { DonerOrder, PaymentMethod } from "../types.js";

export class ReportService {
  public getAnalytics() {
    const state = db.getState();
    const orders = state.donerOrders || [];
    const expenses = state.expenses || [];
    const batches = state.inventoryBatches || [];

    const confirmedExpenses = expenses.filter(e => e.isConfirmed !== false);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalExpenses = confirmedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const pendingExpenses = expenses.filter(e => e.isConfirmed === false).reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Payment methods breakdown
    const paymentBreakdown: Record<string, number> = {};
    orders.forEach(o => {
      const m = o.paymentMethod || PaymentMethod.Cash;
      paymentBreakdown[m] = (paymentBreakdown[m] || 0) + (o.subtotal || 0);
    });

    // Orders by type (TABLE, TAKEAWAY, DELIVERY)
    const orderTypes: Record<string, { count: number; revenue: number }> = {
      TABLE: { count: 0, revenue: 0 },
      TAKEAWAY: { count: 0, revenue: 0 },
      DELIVERY: { count: 0, revenue: 0 }
    };
    orders.forEach(o => {
      const type = o.orderType || "TABLE";
      if (!orderTypes[type]) orderTypes[type] = { count: 0, revenue: 0 };
      orderTypes[type].count += 1;
      orderTypes[type].revenue += (o.subtotal || 0);
    });

    // Top selling items
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach(o => {
      o.items?.forEach(i => {
        if (!itemSales[i.productId]) {
          itemSales[i.productId] = { name: i.name, quantity: 0, revenue: 0 };
        }
        itemSales[i.productId].quantity += i.quantity;
        itemSales[i.productId].revenue += (i.price * i.quantity);
      });
    });

    const topItems = Object.values(itemSales).sort((a, b) => b.quantity - a.quantity);

    // Meat roll efficiency
    const activeBatch = batches.find(b => b.status === "ACTIVE");
    const finishedBatches = batches.filter(b => b.status === "FINISHED");

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      totalOrdersCount: orders.length,
      paymentBreakdown,
      orderTypes,
      topItems,
      activeBatch,
      finishedBatches
    };
  }
}

export const reportService = new ReportService();
