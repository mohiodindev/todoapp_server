import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { config } from "dotenv";
import cloudinary from "cloudinary";
config({
  path: "./config/config.env",
});

// Connect to cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Connect to database
connectDatabase();

app.get("/", (req, res) => {
  res.json({ message: "Welcom to TodoApp server" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`);
});
