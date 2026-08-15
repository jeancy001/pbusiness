import { MongoClient, type Db } from "mongodb"

// Singleton MongoDB connection, cached across hot reloads in dev.
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB || "pbusiness"

let clientPromise: Promise<MongoClient> | null = null

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

export function isDbConfigured() {
  return Boolean(uri)
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it in Project Settings → Vars to enable the backend.")
  }
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect()
    }
    return global._mongoClientPromise
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect()
  }
  return clientPromise
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise()
  return client.db(dbName)
}
