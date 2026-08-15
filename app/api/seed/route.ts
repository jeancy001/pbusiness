import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { isDbConfigured } from "@/lib/db/mongodb"
import { formations as formationsCol, users, enrollments, projects, payments } from "@/lib/db/models"
import { formations as seedFormations } from "@/lib/mock-data"

// One-shot seed. Idempotent: safe to call multiple times.
export async function POST() {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, error: "MONGODB_URI not set" }, { status: 400 })
  }

  try {
    const fCol = await formationsCol()
    // Upsert every formation by slug.
    for (const f of seedFormations) {
      await fCol.updateOne({ slug: f.slug }, { $set: f }, { upsert: true })
    }
    await fCol.createIndex({ slug: 1 }, { unique: true })

    const uCol = await users()
    await uCol.createIndex({ email: 1 }, { unique: true })

    const demoUsers = [
      { name: "Étudiant Démo", email: "etudiant@test.com", role: "student" as const },
      { name: "Client Démo", email: "client@test.com", role: "client" as const },
      { name: "Admin Démo", email: "admin@test.com", role: "admin" as const },
    ]
    const passwordHash = await bcrypt.hash("password123", 10)
    const createdIds: Record<string, string> = {}
    for (const u of demoUsers) {
      const res = await uCol.findOneAndUpdate(
        { email: u.email },
        { $setOnInsert: { ...u, passwordHash, createdAt: new Date() } },
        { upsert: true, returnDocument: "after" },
      )
      if (res?._id) createdIds[u.role] = String(res._id)
    }

    // Seed a couple of enrollments + a project for the demo student/client.
    if (createdIds.student) {
      const eCol = await enrollments()
      const first = seedFormations[0]
      const second = seedFormations[1]
      if (first) {
        await eCol.updateOne(
          { userId: createdIds.student, formationSlug: first.slug },
          {
            $setOnInsert: {
              userId: createdIds.student,
              formationSlug: first.slug,
              progress: 45,
              status: "active",
              createdAt: new Date(),
            },
          },
          { upsert: true },
        )
      }
      if (second) {
        await eCol.updateOne(
          { userId: createdIds.student, formationSlug: second.slug },
          {
            $setOnInsert: {
              userId: createdIds.student,
              formationSlug: second.slug,
              progress: 100,
              status: "completed",
              createdAt: new Date(),
            },
          },
          { upsert: true },
        )
      }
    }

    if (createdIds.client) {
      const pCol = await projects()
      await pCol.updateOne(
        { userId: createdIds.client, service: "web" },
        {
          $setOnInsert: {
            userId: createdIds.client,
            title: { fr: "Boutique en ligne", en: "Online store" },
            service: "web",
            status: "in_progress",
            progress: 60,
            budgetUsd: 1200,
            deadline: "2026-09-15",
            createdAt: new Date(),
          },
        },
        { upsert: true },
      )
    }

    await (await payments()).createIndex({ reference: 1 }, { unique: true })

    return NextResponse.json({
      ok: true,
      formations: seedFormations.length,
      users: demoUsers.length,
      note: "Demo users password: password123",
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
