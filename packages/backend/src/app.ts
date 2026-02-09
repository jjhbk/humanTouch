import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import listingsRoutes from "./modules/listings/listings.routes.js";
import quotesRoutes from "./modules/quotes/quotes.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";
import reviewsRoutes from "./modules/reviews/reviews.routes.js";
import providerRoutes from "./modules/provider/provider.routes.js";
import messagesRoutes from "./modules/messages/messages.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import disputesRoutes from "./modules/disputes/disputes.routes.js";
import activityRoutes from "./modules/activity/activity.routes.js";
import { errorHandler } from "./lib/middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/listings", listingsRoutes);
app.use("/api/v1/quotes", quotesRoutes);
app.use("/api/v1/orders", ordersRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/reviews", reviewsRoutes);
app.use("/api/v1/provider", providerRoutes);
app.use("/api/v1/messages", messagesRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/disputes", disputesRoutes);
app.use("/api/v1/activity", activityRoutes);

app.use(errorHandler);

export default app;
