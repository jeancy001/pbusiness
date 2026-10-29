// Creates an admin account, or promotes/resets an existing one.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' ADMIN_NAME='Your Name' \
//     node --env-file=.env scripts/create-admin.mjs
//
// Credentials come from the environment so they never land in a file.

import bcrypt from "bcryptjs"
import { MongoClient } from "mongodb"

const { MONGODB_URI, MONGODB_DB = "pbusiness", ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "Administrateur" } = process.env
if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD.")
  process.exit(1)
}
if (ADMIN_PASSWORD.length < 8) {
  console.error("Password must be at least 8 characters.")
  process.exit(1)
}

const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
try {
  await client.connect()
  const users = client.db(MONGODB_DB).collection("users")
  const email = ADMIN_EMAIL.trim().toLowerCase()
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const res = await users.updateOne(
    { email },
    { $set: { role: "admin", passwordHash }, $setOnInsert: { email, name: ADMIN_NAME, createdAt: new Date() } },
    { upsert: true },
  )
  console.log(res.upsertedCount ? `Admin created: ${email}` : `Existing account promoted to admin, password reset: ${email}`)
} catch (error) {
  console.error("Failed:", error.name, "-", String(error.message).slice(0, 200))
  process.exitCode = 1
} finally {
  await client.close()
}
