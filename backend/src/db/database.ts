import fs from "fs";
import path from "path";
import { BackendState } from "../types.js";
import { initialBackendState } from "../config/defaults.js";

class Database {
  private dbFilePath: string;
  private state: BackendState;
  private version: number = 1;
  private lastModified: number = Date.now();
  private isPersisting: boolean = false;
  private pendingPersist: boolean = false;

  constructor(filePath?: string) {
    if (filePath) {
      this.dbFilePath = filePath;
    } else {
      let resolvedPath = path.join(process.cwd(), "data.json");
      if (process.env.DATA_PATH) {
        resolvedPath = process.env.DATA_PATH;
      } else if (process.env.APPDATA && (process.env.NODE_ENV === "production" || (process.versions && process.versions.electron))) {
        const appDataDir = path.join(process.env.APPDATA, "KozDonerPOS");
        if (!fs.existsSync(appDataDir)) {
          try { fs.mkdirSync(appDataDir, { recursive: true }); } catch (e) {}
        }
        resolvedPath = path.join(appDataDir, "data.json");
        // If local data.json exists and appdata doesn't, copy over
        const localFile = path.join(process.cwd(), "data.json");
        if (!fs.existsSync(resolvedPath) && fs.existsSync(localFile)) {
          try { fs.copyFileSync(localFile, resolvedPath); } catch (e) {}
        }
      }
      this.dbFilePath = resolvedPath;
    }
    this.state = this.loadState();
  }

  private loadState(): BackendState {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, "utf-8");
        const parsed = JSON.parse(raw);

        return {
          ...initialBackendState,
          ...parsed,
          donerProducts: parsed.donerProducts && parsed.donerProducts.length > 0 
            ? parsed.donerProducts 
            : initialBackendState.donerProducts,
          tables: parsed.tables && parsed.tables.length > 0 
            ? parsed.tables 
            : initialBackendState.tables,
          inventoryItems: parsed.inventoryItems && parsed.inventoryItems.length > 0 
            ? parsed.inventoryItems 
            : initialBackendState.inventoryItems,
          inventoryBatches: parsed.inventoryBatches && parsed.inventoryBatches.length > 0 
            ? parsed.inventoryBatches 
            : initialBackendState.inventoryBatches,
          users: parsed.users && parsed.users.length > 0 
            ? parsed.users 
            : initialBackendState.users,
          couriers: parsed.couriers && parsed.couriers.length > 0 
            ? parsed.couriers 
            : initialBackendState.couriers,
          suppliers: parsed.suppliers && parsed.suppliers.length > 0
            ? parsed.suppliers
            : (initialBackendState.suppliers || []),
          supplierTransactions: parsed.supplierTransactions || [],
          expenses: parsed.expenses || [],
          donerOrders: parsed.donerOrders || [],
          shifts: parsed.shifts || [],
          inventoryLosses: parsed.inventoryLosses || [],
          inventoryUsages: parsed.inventoryUsages || [],
          tableCount: parsed.tableCount || 12,
          flowerProducts: parsed.flowerProducts || [],
          flowerOrders: parsed.flowerOrders || []
        };
      }
    } catch (err) {
      console.error("Failed to read database file, initializing defaults:", err);
    }

    const fresh = { ...initialBackendState };
    this.persist(fresh);
    return fresh;
  }

  private persistTimeout: NodeJS.Timeout | null = null;

  public getState(): BackendState {
    return this.state;
  }

  public getVersion(): { version: number; lastModified: number } {
    return {
      version: this.version,
      lastModified: this.lastModified
    };
  }

  public setState(newState: Partial<BackendState>): BackendState {
    this.state = {
      ...this.state,
      ...newState
    };
    this.version++;
    this.lastModified = Date.now();
    this.schedulePersist();
    return this.state;
  }

  private listeners: ((version: number) => void)[] = [];

  public onVersionChange(listener: (version: number) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const l of this.listeners) {
      try { l(this.version); } catch (e) {}
    }
  }

  public mutate(mutator: (state: BackendState) => void): BackendState {
    mutator(this.state);
    this.version++;
    this.lastModified = Date.now();
    this.schedulePersist();
    this.notifyListeners();
    return this.state;
  }

  private schedulePersist(): void {
    if (this.persistTimeout) {
      clearTimeout(this.persistTimeout);
    }
    this.persistTimeout = setTimeout(() => {
      this.persistTimeout = null;
      this.persist(this.state).catch(err => {
        console.error("Scheduled persist error:", err);
      });
    }, 150);
  }

  private async persist(state: BackendState): Promise<void> {
    if (this.isPersisting) {
      this.pendingPersist = true;
      return;
    }

    this.isPersisting = true;
    try {
      const dataString = JSON.stringify(state);
      await fs.promises.writeFile(this.dbFilePath, dataString, "utf-8");
    } catch (err) {
      console.error("Failed to persist database state asynchronously:", err);
      // Synchronous fallback
      try {
        fs.writeFileSync(this.dbFilePath, JSON.stringify(state), "utf-8");
      } catch (writeErr) {
        console.error("Direct fallback persistence failed:", writeErr);
      }
    } finally {
      this.isPersisting = false;
      if (this.pendingPersist) {
        this.pendingPersist = false;
        this.schedulePersist();
      }
    }
  }

  public resetToDefaults(): BackendState {
    this.state = JSON.parse(JSON.stringify(initialBackendState));
    this.version++;
    this.lastModified = Date.now();
    this.schedulePersist();
    return this.state;
  }
}

export const db = new Database();
