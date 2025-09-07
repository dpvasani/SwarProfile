import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
// Data From URLEncoded
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// Static Public Assets
app.use(express.static("public"));

app.use(cookieParser());

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // If it's an ApiError, send the structured response
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      data: null
    });
  }
  
  // For other errors, send a generic response
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    errors: [],
    data: null
  });
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`⚙️  Server is running on port ${process.env.PORT || 4000}`);
});

// Routes Import
//routes import
import userRouter from "./routes/user.routes.js";
import artistRouter from "./routes/artist.routes.js";

//routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/artists", artistRouter);

export default app;
