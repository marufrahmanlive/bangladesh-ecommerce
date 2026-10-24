import "server-only";
import { MongoClient, type Db } from "mongodb";

/**
 * Server-side MongoDB connection (replaces localStorage in production).
 * Credentials come from environment variables only — never expose this to
 * client code. Multi-document transactions require a replica set.
 */
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "banglajbazar";

let client: MongoClient | null = null;
let dbPromise: Promise<Db> | null = null;

export async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Configure server-side environment variables before using MongoDB persistence.",
    );
  }
  if (!dbPromise) {
    client = new MongoClient(uri);
    dbPromise = client.connect().then(() => client!.db(dbName));
  }
  return dbPromise;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbPromise = null;
  }
}
