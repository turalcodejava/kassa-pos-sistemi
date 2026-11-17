import express from "express";
import path from "path";
import fs from "fs";
import apiRoutes from "./backend/src/routes/apiRoutes.js";

export const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Mount the modular Köz Dönər POS Backend API
app.use("/api", apiRoutes);

// Express server mounting Vite in dev OR static files in prod
export async function startServer(port = process.env.PORT ? parseInt(process.env.PORT) : 3000) {
  if (process.env.NODE_ENV !== "production") {
    try {
      const viteModule = await import("vite");
      const createViteServer = viteModule.createServer;
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Vite middleware error:", err);
    }
  } else {
    // Robust search for dist directory in all environments
    const candidates = [
      path.join(__dirname, "../dist"),
      path.join(__dirname, "dist"),
      path.join(__dirname),
      path.join(process.cwd(), "dist")
    ];

    let distPath = candidates[0];
    for (const c of candidates) {
      if (fs.existsSync(path.join(c, "index.html"))) {
        distPath = c;
        break;
      }
    }

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return new Promise((resolve, reject) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`[Köz Dönər POS] System running on http://0.0.0.0:${port}`);
      resolve(server);
    });
    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} in use, trying port ${port + 1}...`);
        startServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

if (!process.versions || !process.versions.electron) {
  startServer();
}
