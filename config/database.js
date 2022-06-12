import mongoose from "mongoose";

export const connectDatabase = async () => {
  try {
    const { connection } = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost/todoapp"
    );
    console.log(`MongoDB is connected: ${connection.host}`);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
