import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  try {
    if (isConnected && mongoose.connection && mongoose.connection.readyState === 1) {
      console.log('👌 Using existing MongoDB connection');
      return mongoose.connection;
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Creating new MongoDB connection...');
    
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected!');
      isConnected = false;
    });
    
    return mongoose.connection;
    
  } catch (error) {
    console.error("❌ MongoDB Atlas connection failed:", error.message);
    isConnected = false;
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};
