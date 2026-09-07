const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i7khh8v.mongodb.net/?appName=Cluster0`;

let cachedClient = null;
let cachedDb = null;

const connectDB = async () => {
  // Vercel Serverless-এ আগে কানেক্ট করা থাকলে সেটি পুনর্ব্যবহার করা হবে
  if (cachedDb) return cachedDb;

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db("attendanceDB");
  console.log("Connected to MongoDB Atlas!");
  return cachedDb;
};

const getDB = () => {
  if (!cachedDb) {
    throw new Error("Database not initialized!");
  }
  return cachedDb;
};

module.exports = { connectDB, getDB };