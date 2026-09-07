const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i7khh8v.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let db;

const connectDB = async () => {
  if (db) return db;
  await client.connect();
  db = client.db("attendanceDB");
  console.log("Connected to MongoDB Atlas!");
  return db;
};

const getDB = () => {
  if (!db) throw new Error("Database not initialized!");
  return db;
};

module.exports = { connectDB, getDB };