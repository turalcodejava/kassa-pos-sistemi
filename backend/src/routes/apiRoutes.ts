import { Router, Request, Response } from "express";
import os from "os";
import { db } from "../db/database.js";
import { stateController } from "../controllers/stateController.js";
import { productController } from "../controllers/productController.js";
import { tableController } from "../controllers/tableController.js";
import { orderController } from "../controllers/orderController.js";
import { shiftController } from "../controllers/shiftController.js";
import { inventoryController } from "../controllers/inventoryController.js";
import { expenseController } from "../controllers/expenseController.js";
import { courierController } from "../controllers/courierController.js";
import { userController } from "../controllers/userController.js";
import { supplierController } from "../controllers/supplierController.js";
import { tunnelController } from "../controllers/tunnelController.js";

const router = Router();

// Server-Sent Events (SSE) for instant real-time live sync between POS and phones
const sseClients = new Set<Response>();

router.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  if (typeof (res as any).flushHeaders === "function") {
    (res as any).flushHeaders();
  }

  // Send initial connected event with current state version
  res.write(`event: connected\ndata: ${JSON.stringify({ version: db.getVersion().version })}\n\n`);

  sseClients.add(res);

  // Heartbeat comment every 15 seconds to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Broadcast version changes to all connected POS monitors & waiter phones
db.onVersionChange((version) => {
  const payload = JSON.stringify({ version, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`event: stateChange\ndata: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
});

// Public Online Tunnel (Cloudflare Tunnel for 4G/5G mobile access)
router.get("/tunnel/status", (req, res) => tunnelController.getStatus(req, res));
router.post("/tunnel/start", (req, res) => tunnelController.start(req, res));
router.post("/tunnel/stop", (req, res) => tunnelController.stop(req, res));

// Network & System info for QR code menu & Mobile Waiter
router.get("/network-info", (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    interface NetworkAddressItem {
      name: string;
      ip: string;
      isWifi: boolean;
      isEthernet: boolean;
      label: string;
      score: number;
    }
    const addresses: NetworkAddressItem[] = [];

    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === "IPv4" && !net.internal) {
          const ip = net.address;
          // Discard invalid / link-local APIPA addresses
          if (ip.startsWith("169.254.") || ip.startsWith("127.") || ip === "0.0.0.0") {
            continue;
          }

          const isVirtual = /virtual|vethernet|vmware|vbox|docker|tailscale|zerotier|loopback|npcap|hyper-v|wsl/i.test(name);
          const isBluetooth = /bluetooth/i.test(name);
          const isWifi = /wi-?fi|wlan|wireless|802\.11/i.test(name);
          const isEthernet = /ethernet|yerli|local area|lan|kabel|eth/i.test(name);

          // Calculate priority score
          let score = 0;

          // IP subnet priority
          if (ip.startsWith("192.168.")) {
            score += 100;
          } else if (ip.startsWith("10.")) {
            score += 80;
          } else if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) {
            score += 60;
          } else {
            score += 20;
          }

          // Physical vs Virtual priority
          if (isVirtual) {
            score -= 100;
          }
          if (isBluetooth) {
            score -= 80;
          }
          if (isWifi) {
            score += 25; // Wi-Fi is great for phone discovery
          }
          if (isEthernet) {
            score += 20; // Ethernet cable on POS is very reliable
          }

          let typeLabel = "Şəbəkə";
          if (isWifi) typeLabel = "Wi-Fi";
          else if (isEthernet) typeLabel = "Kabel (Ethernet)";
          else if (isBluetooth) typeLabel = "Bluetooth";
          else if (isVirtual) typeLabel = "Virtual";

          addresses.push({
            name,
            ip,
            isWifi,
            isEthernet,
            label: `${typeLabel} (${ip})`,
            score
          });
        }
      }
    }

    // Sort descending by score
    addresses.sort((a, b) => b.score - a.score);

    // If no external IP found, provide loopback fallback
    if (addresses.length === 0) {
      addresses.push({
        name: "Localhost",
        ip: "127.0.0.1",
        isWifi: false,
        isEthernet: false,
        label: "Lokal (127.0.0.1)",
        score: 0
      });
    }

    const defaultIp = addresses[0]?.ip || "127.0.0.1";
    const port = (req.socket.localPort) || (process.env.PORT ? parseInt(process.env.PORT) : 3000);
    const tunnelUrl = tunnelController.getActiveUrl();

    res.json({
      success: true,
      addresses,
      defaultIp,
      port,
      tunnelUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// State & Auth
router.get("/state", (req, res) => stateController.getState(req, res));
router.get("/state/version", (req, res) => stateController.getVersion(req, res));
router.post("/state/save", (req, res) => stateController.saveState(req, res));
router.post("/auth/login", (req, res) => stateController.login(req, res));
router.get("/analytics", (req, res) => stateController.getAnalytics(req, res));

// Users & Cashiers Management
router.get("/users", (req, res) => userController.getAll(req, res));
router.post("/users", (req, res) => userController.handleUserAction(req, res));

// Products (Köz Dönər & Zərif Güllər)
router.get("/doner/products", (req, res) => productController.getAll(req, res));
router.post("/doner/products", (req, res) => productController.handleProductAction(req, res));
router.get("/flower/products", (req, res) => productController.getAll(req, res));
router.post("/flower/products", (req, res) => productController.handleProductAction(req, res));
router.post("/product/stock", (req, res) => productController.adjustStock(req, res));

// Tables & Floor Layout
router.post("/table/count", (req, res) => tableController.updateCount(req, res));
router.post("/table/order", (req, res) => tableController.updateOrder(req, res));
router.post("/tables/layout", (req, res) => tableController.updateLayout(req, res));
router.post("/table/update", (req, res) => tableController.updateProperties(req, res));
router.post("/customer/order", (req, res) => tableController.handleCustomerQR(req, res));
router.post("/table/clear", (req, res) => tableController.clearTable(req, res));
router.post("/table/lock", (req, res) => tableController.lock(req, res));
router.post("/table/unlock", (req, res) => tableController.unlock(req, res));
router.post("/table/heartbeat", (req, res) => tableController.heartbeat(req, res));

// Orders
router.get("/doner/orders", (req, res) => orderController.getAll(req, res));
router.post("/doner/order/direct", (req, res) => orderController.createDirect(req, res));
router.post("/doner/order/complete-delivery", (req, res) => orderController.completeDelivery(req, res));
router.post("/doner/order/cancel", (req, res) => orderController.cancel(req, res));
router.post("/doner/order/update", (req, res) => orderController.update(req, res));
router.post("/doner/order/delete", (req, res) => orderController.delete(req, res));

// Shift & Cash Register
router.get("/shift/active", (req, res) => shiftController.getActive(req, res));
router.post("/shift/start", (req, res) => shiftController.startShift(req, res));
router.post("/shift/end", (req, res) => shiftController.endShift(req, res));
router.post("/shift/confirm-handover", (req, res) => shiftController.confirmCashHandover(req, res));
router.post("/shift/confirm-pos-allocation", (req, res) => shiftController.confirmPosAllocation(req, res));
router.post("/shift/cash-transaction", (req, res) => shiftController.handleCashTransaction(req, res));
router.post("/shift/update", (req, res) => shiftController.updateShift(req, res));
router.post("/shift/delete", (req, res) => shiftController.deleteShift(req, res));

// Inventory & Meat Batches & Usages
router.post("/inventory/items", (req, res) => inventoryController.handleItemAction(req, res));
router.post("/inventory/batches", (req, res) => inventoryController.handleBatchAction(req, res));
router.post("/inventory/loss", (req, res) => inventoryController.handleLoss(req, res));
router.post("/inventory/usage", (req, res) => inventoryController.handleUsage(req, res));
router.post("/inventory/usage/delete", (req, res) => inventoryController.handleDeleteUsage(req, res));
router.get("/inventory/usages", (req, res) => inventoryController.getUsages(req, res));

// Expenses
router.get("/expenses", (req, res) => expenseController.getAll(req, res));
router.post("/expense", (req, res) => expenseController.handleExpenseAction(req, res));

// Couriers
router.get("/couriers", (req, res) => courierController.getAll(req, res));
router.post("/couriers", (req, res) => courierController.handleCourierAction(req, res));

// Suppliers & Debt Balance
router.get("/suppliers", (req, res) => supplierController.getAll(req, res));
router.post("/suppliers/add", (req, res) => supplierController.add(req, res));
router.post("/suppliers/update", (req, res) => supplierController.update(req, res));
router.post("/suppliers/delete", (req, res) => supplierController.delete(req, res));
router.post("/suppliers/purchase", (req, res) => supplierController.recordPurchase(req, res));
router.post("/suppliers/pay-debt", (req, res) => supplierController.recordPayment(req, res));
router.get("/suppliers/transactions", (req, res) => supplierController.getTransactions(req, res));
router.post("/suppliers/transactions/update", (req, res) => supplierController.updateTransaction(req, res));
router.post("/suppliers/transactions/delete", (req, res) => supplierController.deleteTransaction(req, res));

export default router;
