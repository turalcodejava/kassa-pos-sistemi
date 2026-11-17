import dotenv from "dotenv";
import { createBackendApp } from "./app.js";

dotenv.config();

const app = createBackendApp();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Köz Dönər POS Backend] Server running on http://0.0.0.0:${PORT}`);
});
