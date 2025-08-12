import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

const url = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@smsdb.bwmu5qv.mongodb.net/${process.env.db_name}?retryWrites=true&w=majority&appName=smsdb/sms`

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
