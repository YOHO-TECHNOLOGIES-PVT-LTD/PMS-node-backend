import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

export const url=`mongodb+srv://${process.env.database_username}:${process.env.database_password}@lms-yoho.57koacr.mongodb.net/${process.env.db}`

const conenctionOptions = {
  // serverSelectionTimeoutMS: 5000,
};

mongoose
  .connect(url, conenctionOptions)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error: ", err);
  });

export default mongoose.connection;
