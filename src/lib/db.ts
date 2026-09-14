import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "computer_lab_attendance";

if (!uri) {
  console.warn("MONGODB_URI is not configured. Attendance APIs will be unavailable until it is added to .env.local.");
}

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise = uri
  ? globalForMongo.mongoClientPromise ?? new MongoClient(uri).connect()
  : null;

if (uri && !globalForMongo.mongoClientPromise) {
  globalForMongo.mongoClientPromise = clientPromise!;
}

export async function getDb(): Promise<Db> {
  if (!clientPromise) {
    throw new Error("Database is not configured. Add MONGODB_URI to .env.local.");
  }

  const db = (await clientPromise).db(dbName);
  await db.collection("attendance").createIndex(
    { studentId: 1, timeOut: 1 },
    { unique: true, partialFilterExpression: { timeOut: null } },
  );
  await db.collection("attendance").createIndex({ createdAt: -1 });
  await db.collection("attendance").createIndex({ studentName: "text", studentId: "text" });
  return db;
}