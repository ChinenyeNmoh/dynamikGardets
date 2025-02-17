import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { notFound, errorHandler } from "./src/middlewares/errorMiddleware.ts";
import connectDB from "./src/config/db.js";
import cookieParser from "cookie-parser";
import userRoute from "./src/routes/userRoute.ts";
import categoryRoute from "./src/routes/categoryRoute.ts";
import productRoute from "./src/routes/productRoute.ts";

dotenv.config();

const port = process.env.PORT || 5000;

const app = express();

connectDB();

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.header({ "Access-Control-Allow-Origin": "*" });
  next();
});


app.use(cors({
  
  credentials: true,
}));

// Define __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// path to our static folders
app.use(express.static(path.join(__dirname, "public")));

// Logging using morgan middleware only if we are in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/users", userRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/products", productRoute);

// Error handling middleware
app.use(notFound);
//app.use(errorHandler);

app.listen(port, () => {
  console.log(`app is running on port ${port}`);
});
