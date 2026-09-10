import mongoose from "mongoose";

const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined.");
    }

    const connection = await mongoose.connect(mongoUri);
    const connectionDetails = `${connection.connection.host}:${connection.connection.port}/${connection.connection.name}`;

    console.log(`MongoDB connected: ${connectionDetails}`);
  } catch (error) {
    console.error(`Database connection error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectToDatabase;