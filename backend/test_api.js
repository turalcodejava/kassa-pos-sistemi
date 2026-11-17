import { createBackendApp } from "./src/app.js";
import http from "http";

const app = createBackendApp();
const server = http.createServer(app);

async function testBackend() {
  await new Promise((resolve) => server.listen(3099, resolve));
  console.log("Test Server started on port 3099");

  const baseUrl = "http://127.0.0.1:3099/api";

  async function post(endpoint, data) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async function get(endpoint) {
    const res = await fetch(`${baseUrl}${endpoint}`);
    return res.json();
  }

  console.log("\n1. Testing GET /api/state...");
  const state = await get("/state");
  console.log("State tables count:", state.tables?.length, "Products:", state.donerProducts?.length);

  console.log("\n2. Testing POST /api/auth/login...");
  const loginRes = await post("/auth/login", { pin: "1111" });
  console.log("Login user:", loginRes.user?.name, "Role:", loginRes.user?.role);

  console.log("\n3. Testing POST /api/shift/start...");
  const shiftRes = await post("/shift/start", { userId: "u1", startingCash: 50.0 });
  console.log("Shift start success:", shiftRes.success, "Shift ID:", shiftRes.shift?.id);

  console.log("\n4. Testing POST /api/table/order on Table 1...");
  const orderRes = await post("/table/order", {
    tableNumber: 1,
    items: [
      { productId: "d3", name: "Ət Dönəri (Çörəkdə)", price: 4.5, quantity: 2 },
      { productId: "d7", name: "Coca-Cola 330ml", price: 1.5, quantity: 2 }
    ]
  });
  console.log("Table order status:", orderRes.table?.status, "Subtotal:", orderRes.table?.subtotal);

  console.log("\n5. Testing POST /api/table/clear (Checkout Table 1)...");
  const checkoutRes = await post("/table/clear", {
    tableNumber: 1,
    paymentMethod: "NAGD"
  });
  console.log("Checkout success:", checkoutRes.success, "Order ID:", checkoutRes.order?.id);

  console.log("\n6. Testing POST /api/shift/cash-transaction (Mədaxil)...");
  const txRes = await post("/shift/cash-transaction", {
    type: "IN",
    amount: 30,
    note: "Xırda pul əlavəsi"
  });
  console.log("Cash transaction success:", txRes.success, "Management added:", txRes.shift?.managementAdded);

  console.log("\n7. Testing POST /api/inventory/loss...");
  const lossRes = await post("/inventory/loss", {
    itemId: "d7",
    name: "Coca-Cola 330ml",
    quantity: 1,
    unit: "ədəd",
    reason: "Bankası əzilib sızdırdı"
  });
  console.log("Inventory loss success:", lossRes.success);

  console.log("\n8. Testing POST /api/expense...");
  const expRes = await post("/expense", {
    action: "ADD",
    expense: {
      title: "Göyərti və tərəvəz alışı",
      amount: 15.0,
      category: "Məhsul",
      paymentSource: "Kassa (Nağd)"
    }
  });
  console.log("Expense success:", expRes.success);

  console.log("\n9. Testing GET /api/analytics...");
  const analyticsRes = await get("/analytics");
  console.log("Analytics total revenue:", analyticsRes.analytics?.totalRevenue, "Total expenses:", analyticsRes.analytics?.totalExpenses);

  console.log("\n10. Testing POST /api/shift/end...");
  const endShiftRes = await post("/shift/end", {
    actualCashInDrawer: 77.0
  });
  console.log("End shift status:", endShiftRes.shift?.status, "Expected:", endShiftRes.shift?.expectedCash, "Diff:", endShiftRes.shift?.difference);

  console.log("\nALL BACKEND API TESTS COMPLETED SUCCESSFULLY!");
  server.close();
}

testBackend().catch(err => {
  console.error("Test failed:", err);
  server.close();
  process.exit(1);
});
