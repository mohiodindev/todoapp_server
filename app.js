import express from "express";
import User from "./routes/user.js";
import logger from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
export const app = express();

// json
app.use(express.json());
// urlencoded
app.use(express.urlencoded({ extended: true }));

//cookie parser
app.use(cookieParser());

app.use(logger("dev"));
app.use(cors());
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
  })
);

// routes
app.use("/api/v1/", User);
