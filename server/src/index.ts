import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { client, connectDatabase } from "./config/database";
import { swaggerSpec } from "./config/swagger";
import { createApp } from "./app";
import { logger } from "./config/logger";

dotenv.config();

// Validate required environment variables in production.
if (process.env.NODE_ENV === "production") {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const app = createApp();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

connectDatabase()
  .then(() => {
    const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(() => {
        client.close().finally(() => process.exit(0));
      });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err) => {
    logger.error("Failed to connect to database", err);
    process.exit(1);
  });

export default app;
