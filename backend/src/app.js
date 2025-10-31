import express from "express";
import path from "path";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./middleware/logger.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(authMiddleware);

// Mount API routes base: /api
app.use("/api", routes);

// Serve static uploads (e.g., http://localhost:4000/uploads/...)
app.use("/uploads", express.static(path.resolve(process.cwd(), "public/uploads")));

// Error handler should be last
app.use(errorHandler);

export default app;
