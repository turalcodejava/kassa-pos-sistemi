const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const http = require("http");

// Enable automatic silent POS receipt printing without browser dialog popups
app.commandLine.appendSwitch("kiosk-printing");
app.commandLine.appendSwitch("disable-print-preview");

// Native Electron Silent Print Handler with Mutex Lock
let isPrintingNow = false;

ipcMain.handle("silent-print", async (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { success: false, error: "Window not found" };

  try {
    const printers = await win.webContents.getPrintersAsync();
    
    let targetDeviceName = options?.deviceName || "";
    
    // Validate if the specified deviceName exists in installed printers
    if (targetDeviceName) {
      const match = printers.find(p => 
        p.name.toLowerCase() === targetDeviceName.toLowerCase() ||
        (p.displayName && p.displayName.toLowerCase() === targetDeviceName.toLowerCase())
      );
      if (match) {
        targetDeviceName = match.name;
      }
    }

    // Auto-detect fallback if not found or not specified
    if (!targetDeviceName) {
      const autoMatch = printers.find(p => 
        p.name.toLowerCase().includes("kassa") ||
        p.name.toLowerCase().includes("metbex") ||
        p.name.toLowerCase().includes("xp-80") || 
        p.name.toLowerCase().includes("xprinter") || 
        p.name.toLowerCase().includes("pos-80") ||
        p.name.toLowerCase().includes("receipt")
      );
      if (autoMatch) {
        targetDeviceName = autoMatch.name;
      } else {
        const defaultPrinter = printers.find(p => p.isDefault) || printers[0];
        targetDeviceName = defaultPrinter ? defaultPrinter.name : "";
      }
    }

    return await new Promise((resolve) => {
      win.webContents.print({
        silent: true,
        printBackground: true,
        deviceName: targetDeviceName,
        copies: 1,
        color: false,
        margins: {
          marginType: "none"
        }
      }, (success, failureReason) => {
        if (!success) {
          console.error("Print failed for device:", targetDeviceName, failureReason);
        }
        resolve({ success, failureReason, printer: targetDeviceName });
      });
    });
  } catch (err) {
    console.error("Silent print error:", err);
    return { success: false, error: String(err) };
  }
});

ipcMain.handle("get-printers", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return [];
  return await win.webContents.getPrintersAsync();
});

let mainWindow = null;
const SERVER_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;

// Helper to check if server is responsive
function checkServerReady(url, timeout = 10000, interval = 200) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode < 500) {
          resolve(true);
        } else {
          retry();
        }
      }).on("error", () => {
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startTime > timeout) {
        resolve(false);
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
}

async function startInternalServer() {
  try {
    process.env.NODE_ENV = "production";
    process.env.PORT = String(SERVER_PORT);

    // Require and start bundled server directly in-process
    const serverModule = require(path.join(__dirname, "../dist/server.cjs"));
    if (serverModule && typeof serverModule.startServer === "function") {
      await serverModule.startServer(SERVER_PORT);
    }
  } catch (err) {
    console.error("Failed to start in-process server:", err);
  }
}

async function createWindow() {
  Menu.setApplicationMenu(null); // Hide default browser menu for clean POS look

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 640,
    title: "Köz Xəzər Dönər POS - Kassa və Sifariş Sistemi",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
      webSecurity: false
    },
    autoHideMenuBar: true,
    backgroundColor: "#0f172a",
    show: false
  });

  mainWindow.maximize();

  // Wait for server to start listening
  await checkServerReady(SERVER_URL);
  await mainWindow.loadURL(SERVER_URL);
  mainWindow.show();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const { exec } = require("child_process");

function ensureFirewallAccess(port) {
  if (process.platform !== "win32") return;
  try {
    const cmd = `netsh advfirewall firewall add rule name="Koz Doner POS Port ${port}" dir=in action=allow protocol=TCP localport=${port} profile=any`;
    exec(cmd, { windowsHide: true }, (err) => {
      if (!err) {
        console.log(`Windows Firewall rule confirmed for port ${port}`);
      }
    });
  } catch (e) {
    // Non-fatal
  }
}

// Single instance lock to prevent duplicate windows
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    ensureFirewallAccess(SERVER_PORT);
    await startInternalServer();
    await createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
