import express from "express";
import apiRoutes from "./routes/apiRoutes.js";

export function createBackendApp() {
  const app = express();
  
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Mount all API routes under /api
  app.use("/api", apiRoutes);
  
  return app;
}
