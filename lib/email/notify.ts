import "server-only"
import { after } from "next/server"

import { enrollments, users, type PaymentDoc, type UserDoc } from "@/lib/db/models"
import { byUserId, toObjectId, type CertificateDoc, type LiveRequestDoc, type PayoutDoc } from "@/lib/db/lms"
import { getFormationBySlug } from "@/lib/data/catalog"
import { localize, type LocalizedText } from "@/lib/mock-data"
import { sendMail } from "@/lib/email/mailer"
import { TEACHER_SHARE_PERCENT } from "@/lib/payments/fees"
import { appUrl, emailLocale, render, type EmailContent, type EmailLocale } from "@/lib/email/template"

// Every user-facing activity sends an email. Sending happens after the
// response (next/server `after`), so SMTP latency or failures never slow
// down or break the action that triggered it.

type Recipient = Pick<UserDoc, "email" | "name"> & { locale?: string }
type Build = (l: EmailLocale) => Omit<EmailContent, "locale">

function later(task: () => Promise<unknown>) {
  after(async () => {
    try {
      await task()
    } catch (error) {
      console.error(`Notification failed: ${String((error as Error)?.message ?? error).slice(0, 300)}`)
    }
  })
}

async function deliver(to: Recipient, build: Build) {
  const locale = emailLocale(to.locale)
  await sendMail({ to: to.email, ...render({ ...build(locale), locale }) })
}

async function userById(id?: string) {
  if (!id || !toObjectId(id)) return null
  return (await users()).findOne(byUserId(id), { projection: { email: 1, name: 1, locale: 1 } })
}

async function admins() {
  return (await users()).find({ role: "admin" }, { projection: { email: 1, name: 1, locale: 1 } }).toArray()
}

async function enrolledStudents(slug: string) {
  const rows = await (await enrollments()).find({ formationSlug: slug }, { projection: { userId: 1 } }).toArray()
  const ids = rows.map((r) => toObjectId(r.userId)).filter(Boolean)
  if (!ids.length) return []
  return (await users()).find({ _id: { $in: ids } } as never, { projection: { email: 1, name: 1, locale: 1 } }).toArray()
}

const usd = (n: number) => `$${n.toFixed(2)}`
const fr = (l: EmailLocale) => l === "fr"
const t = (text: LocalizedText, l: EmailLocale) => localize(text, l)

// ============================================================
// ACCOUNTS
// ============================================================

export function notifyWelcome(user: Recipient & { role: string }) {
  later(() =>
    deliver(user, (l) => ({
      subject: fr(l) ? "Bienvenue sur Linko Academy" : "Welcome to Linko Academy",
      heading: fr(l) ? `Bienvenue, ${user.name} !` : `Welcome, ${user.name}!`,
      paragraphs: [
        fr(l)
          ? "Votre compte est prêt. Découvrez nos formations certifiantes, nos cours en direct et notre tuteur."
          : "Your account is ready. Explore our certified courses, live classes and tutor.",
      ],
      cta: { label: fr(l) ? "Accéder à mon espace" : "Go to my dashboard", href: appUrl(`/dashboard/${user.role}`) },
    })),
  )
}

/** Account created by an admin, with the temporary password to sign in. */
export function notifyAccountCreated(user: Recipient & { role: "teacher" | "student" | "staff" }, tempPassword: string) {
  later(() =>
    deliver(user, (l) => ({
      subject: fr(l) ? "Votre compte Linko Academy a été créé" : "Your Linko Academy account has been created",
      heading: fr(l) ? `Bonjour ${user.name},` : `Hello ${user.name},`,
      paragraphs: [
        fr(l)
          ? `Un administrateur vous a créé un compte ${{ teacher: "formateur", student: "étudiant", staff: "administrateur adjoint" }[user.role]}. Connectez-vous avec les identifiants ci-dessous, puis changez votre mot de passe.`
          : `An administrator created ${user.role === "staff" ? "an assistant admin" : `a ${user.role}`} account for you. Sign in with the details below, then change your password.`,
      ],
      details: [
        ["E-mail", user.email],
        [fr(l) ? "Mot de passe temporaire" : "Temporary password", tempPassword],
      ],
      cta: { label: fr(l) ? "Se connecter" : "Sign in", href: appUrl("/login") },
    })),
  )
}

/** Tells the main admins a certified student applied to teach. */
export function notifyTeacherApplication(studentName: string) {
  later(async () => {
    for (const admin of await admins()) {
      await deliver(admin, (l) => ({
        subject: fr(l) ? "Nouvelle candidature de formateur" : "New teacher application",
        heading: fr(l) ? "Une candidature attend votre décision" : "An application is waiting for you",
        paragraphs: [
          fr(l)
            ? `${studentName}, étudiant certifié, demande à devenir formateur.`
            : `${studentName}, a certified student, applied to become a teacher.`,
        ],
        cta: { label: fr(l) ? "Examiner la candidature" : "Review the application", href: appUrl("/dashboard/admin/team") },
      }))
    }
  })
}

export function notifyTeacherApplicationResult(userId: string, approved: boolean, note?: string) {
  later(async () => {
    const user = await userById(userId)
    if (!user) return
    await deliver(user, (l) => ({
      subject: approved
        ? fr(l) ? "Vous êtes maintenant formateur !" : "You are now a teacher!"
        : fr(l) ? "Votre candidature de formateur" : "Your teacher application",
      heading: fr(l) ? `Bonjour ${user.name},` : `Hello ${user.name},`,
      paragraphs: [
        approved
          ? fr(l)
            ? "Votre candidature a été acceptée. Votre espace formateur est prêt : créez vos cours et enseignez en direct."
            : "Your application was accepted. Your teacher space is ready: create your courses and teach live."
          : fr(l)
            ? "Votre candidature n'a pas été retenue pour le moment. Vous pourrez postuler à nouveau plus tard."
            : "Your application wasn't accepted this time. You can apply again later.",
        ...(note ? [note] : []),
      ],
      cta: approved ? { label: fr(l) ? "Ouvrir mon espace formateur" : "Open my teacher space", href: appUrl("/dashboard/teacher") } : undefined,
    }))
  })
}

// ============================================================
// COURSES
// ============================================================

export function notifyCourseAssigned(teacherId: string, slug: string) {
  later(async () => {
    const [teacher, course] = await Promise.all([userById(teacherId), getFormationBySlug(slug)])
    if (!teacher || !course) return
    await deliver(teacher, (l) => ({
      subject: fr(l) ? `Nouveau cours assigné : ${t(course.title, l)}` : `New course assigned: ${t(course.title, l)}`,
      heading: fr(l) ? "Un cours vous a été assigné" : "A course has been assigned to you",
      paragraphs: [
        fr(l)
          ? `Vous êtes désormais formateur du cours « ${t(course.title, l)} ». Ajoutez des leçons, programmez des cours en direct et suivez vos étudiants.`
          : `You are now the teacher of “${t(course.title, l)}”. Add lessons, schedule live classes and follow your students.`,
      ],
      cta: { label: fr(l) ? "Gérer le cours" : "Manage the course", href: appUrl(`/dashboard/teacher/courses/${slug}`) },
    }))
  })
}

export function notifyLessonPublished(slug: string, lessonTitle: string) {
  later(async () => {
    const [course, students] = await Promise.all([getFormationBySlug(slug), enrolledStudents(slug)])
    if (!course) return
    for (const s of students) {
      await deliver(s, (l) => ({
        subject: fr(l) ? `Nouvelle leçon : ${lessonTitle}` : `New lesson: ${lessonTitle}`,
        heading: fr(l) ? "Une nouvelle leçon est disponible" : "A new lesson is available",
        paragraphs: [
          fr(l)
            ? `« ${lessonTitle} » vient d'être publiée dans « ${t(course.title, l)} ».`
            : `“${lessonTitle}” was just published in “${t(course.title, l)}”.`,
        ],
        cta: { label: fr(l) ? "Voir la leçon" : "Open the lesson", href: appUrl(`/learn/${slug}`) },
      }))
    }
  })
}

export function notifyLiveScheduled(slug: string, live: { id: string; topic: string; startAt: Date; durationMin: number }) {
  later(async () => {
    const [course, students] = await Promise.all([getFormationBySlug(slug), enrolledStudents(slug)])
    if (!course) return
    for (const s of students) {
      await deliver(s, (l) => ({
        subject: fr(l) ? `Cours en direct : ${live.topic}` : `Live class: ${live.topic}`,
        heading: fr(l) ? "Un cours en direct est programmé" : "A live class is scheduled",
        paragraphs: [
          fr(l)
            ? `Votre formateur organise un cours en direct pour « ${t(course.title, l)} ». Rejoignez-le depuis votre navigateur avec votre webcam.`
            : `Your teacher scheduled a live class for “${t(course.title, l)}”. Join from your browser with your webcam.`,
        ],
        details: [
          [fr(l) ? "Sujet" : "Topic", live.topic],
          [fr(l) ? "Début (UTC)" : "Starts (UTC)", live.startAt.toISOString().slice(0, 16).replace("T", " ")],
          [fr(l) ? "Durée" : "Duration", `${live.durationMin} min`],
        ],
        cta: { label: fr(l) ? "Rejoindre le cours" : "Join the class", href: appUrl(`/live/${live.id}`) },
      }))
    }
  })
}

/** One-to-one live requests: tells the other person what happened. */
export function notifyLiveRequest(req: LiveRequestDoc & { _id: unknown }, event: "requested" | "accepted" | "declined" | "cancelled") {
  later(async () => {
    const fromStudent = req.requestedBy === "student"
    // A new or cancelled request goes to the invitee; a reply goes back to the requester.
    const toStudent = event === "requested" || event === "cancelled" ? !fromStudent : fromStudent
    const [to, course] = await Promise.all([userById(toStudent ? req.studentId : req.teacherId), getFormationBySlug(req.formationSlug)])
    if (!to) return
    const other = toStudent ? req.teacherName : req.studentName
    const when = req.proposedAt.toISOString().slice(0, 16).replace("T", " ")
    await deliver(to, (l) => {
      const copy = {
        requested: [fr(l) ? `Demande de session en direct : ${req.topic}` : `Live session request: ${req.topic}`, fr(l) ? `${other} vous propose une session en direct en tête-à-tête.` : `${other} would like a one-to-one live session with you.`],
        accepted: [fr(l) ? `Session en direct confirmée : ${req.topic}` : `Live session confirmed: ${req.topic}`, fr(l) ? `${other} a accepté votre demande. Rejoignez la salle depuis votre navigateur à l'heure prévue.` : `${other} accepted your request. Join the room from your browser at the scheduled time.`],
        declined: [fr(l) ? `Session en direct refusée : ${req.topic}` : `Live session declined: ${req.topic}`, fr(l) ? `${other} n'est pas disponible pour cette session. Vous pouvez proposer un autre horaire.` : `${other} isn't available for this session. You can propose another time.`],
        cancelled: [fr(l) ? `Demande annulée : ${req.topic}` : `Request cancelled: ${req.topic}`, fr(l) ? `${other} a annulé sa demande de session en direct.` : `${other} cancelled their live session request.`],
      }[event]
      return {
        subject: copy[0],
        heading: copy[0],
        paragraphs: [copy[1], ...(event === "requested" && req.message ? [`“${req.message}”`] : [])],
        details: [
          [fr(l) ? "Cours" : "Course", course ? t(course.title, l) : req.formationSlug],
          [fr(l) ? "Date (UTC)" : "When (UTC)", when],
          [fr(l) ? "Durée" : "Duration", `${req.durationMin} min`],
        ],
        cta:
          event === "accepted" && req.liveSessionId
            ? { label: fr(l) ? "Rejoindre la session" : "Join the session", href: appUrl(`/live/${req.liveSessionId}`) }
            : { label: fr(l) ? "Voir les demandes" : "View requests", href: appUrl(toStudent ? "/dashboard/student#live-requests" : "/dashboard/teacher#live-requests") },
      }
    })
  })
}

// ============================================================
// PAYMENTS & CERTIFICATES
// ============================================================

export function notifyPayment(payment: PaymentDoc) {
  later(async () => {
    const payer = await userById(payment.userId)
    if (payer) {
      const ok = payment.status === "success"
      await deliver(payer, (l) => ({
        subject: ok
          ? fr(l) ? `Paiement confirmé : ${t(payment.label, l)}` : `Payment confirmed: ${t(payment.label, l)}`
          : fr(l) ? "Votre paiement n'a pas abouti" : "Your payment did not go through",
        heading: ok ? (fr(l) ? "Merci, votre paiement est confirmé" : "Thank you, your payment is confirmed") : fr(l) ? "Paiement échoué" : "Payment failed",
        paragraphs: [
          ok
            ? fr(l) ? "Votre accès est débloqué. Voici votre reçu." : "Your access is unlocked. Here is your receipt."
            : fr(l) ? "Aucun montant n'a été débité. Vous pouvez réessayer à tout moment." : "No money was taken. You can try again at any time.",
        ],
        details: [
          [fr(l) ? "Article" : "Item", t(payment.label, l)],
          [fr(l) ? "Montant" : "Amount", `${payment.amount.toLocaleString(l === "fr" ? "fr-FR" : "en-GB")} ${payment.currency} (${usd(payment.amountUsd)})`],
          ["Mobile Money", `${payment.network ?? ""} ${payment.phone ?? ""}`.trim()],
          [fr(l) ? "Référence" : "Reference", payment.reference],
        ],
        cta: { label: fr(l) ? "Mon tableau de bord" : "My dashboard", href: appUrl("/dashboard/student") },
      }))
    }

    // The teacher hears about each new student and what they earned.
    if (payment.status === "success" && payment.kind === "formation" && payment.teacherId) {
      const teacher = await userById(payment.teacherId)
      if (teacher)
        await deliver(teacher, (l) => ({
          subject: fr(l) ? `Nouvel étudiant : ${t(payment.label, l)}` : `New student: ${t(payment.label, l)}`,
          heading: fr(l) ? "Un étudiant a rejoint votre cours" : "A student joined your course",
          paragraphs: [
            fr(l)
              ? `${payer?.name ?? "Un étudiant"} s'est inscrit à « ${t(payment.label, l)} ».`
              : `${payer?.name ?? "A student"} enrolled in “${t(payment.label, l)}”.`,
          ],
          details: [[fr(l) ? `Vos revenus (${TEACHER_SHARE_PERCENT} %)` : `Your earnings (${TEACHER_SHARE_PERCENT}%)`, usd(payment.teacherShareUsd ?? 0)]],
          cta: { label: fr(l) ? "Voir mes revenus" : "View my earnings", href: appUrl("/dashboard/teacher/payouts") },
        }))
    }
  })
}

export function notifyCertificate(cert: CertificateDoc) {
  later(async () => {
    const student = await userById(cert.userId)
    if (!student) return
    await deliver(student, (l) => ({
      subject: fr(l) ? "Votre certificat Linko Academy est disponible" : "Your Linko Academy certificate is ready",
      heading: fr(l) ? "Félicitations !" : "Congratulations!",
      paragraphs: [
        fr(l)
          ? `Vous avez obtenu la certification « ${t(cert.formationTitle, l)} », délivrée avec notre partenaire LinkoPayroll.`
          : `You earned the “${t(cert.formationTitle, l)}” certification, issued with our partner LinkoPayroll.`,
      ],
      details: [
        ["Score", `${cert.score}%`],
        [fr(l) ? "N° de certificat" : "Certificate ID", cert.code],
      ],
      cta: { label: fr(l) ? "Télécharger le certificat" : "Download the certificate", href: appUrl(`/api/certificates/${cert.code}/pdf`) },
    }))
  })
}

export function notifyAiModuleUnlocked(userId: string, moduleTitle: string, moduleSlug: string) {
  later(async () => {
    const u = await userById(userId)
    if (!u) return
    await deliver(u, (l) => ({
      subject: fr(l) ? `Cours débloqué : ${moduleTitle}` : `Course unlocked: ${moduleTitle}`,
      heading: fr(l) ? "Votre tuteur vous attend" : "Your tutor is ready",
      paragraphs: [
        fr(l)
          ? `Le cours « ${moduleTitle} » est maintenant accessible : tous ses modules sont débloqués.`
          : `The course “${moduleTitle}” is now available: all its modules are unlocked.`,
      ],
      cta: { label: fr(l) ? "Commencer" : "Start learning", href: appUrl(`/academy/${moduleSlug}`) },
    }))
  })
}

// ============================================================
// PAYOUTS
// ============================================================

export function notifyPayoutRequested(payout: Pick<PayoutDoc, "teacherName" | "amountUsd" | "netUsd" | "method" | "country">) {
  later(async () => {
    for (const a of await admins()) {
      await deliver(a, (l) => ({
        subject: fr(l) ? `Demande de retrait : ${payout.teacherName}` : `Payout request: ${payout.teacherName}`,
        heading: fr(l) ? "Nouvelle demande de retrait" : "New payout request",
        paragraphs: [fr(l) ? `${payout.teacherName} demande un retrait.` : `${payout.teacherName} requested a payout.`],
        details: [
          [fr(l) ? "Montant" : "Amount", usd(payout.amountUsd)],
          [fr(l) ? "À envoyer" : "To send", usd(payout.netUsd)],
          ["Mobile Money", `${payout.method} · ${payout.country}`],
        ],
        cta: { label: fr(l) ? "Traiter la demande" : "Review the request", href: appUrl("/dashboard/admin/payments") },
      }))
    }
  })
}

export function notifyPayoutStatus(payout: PayoutDoc) {
  later(async () => {
    const recipient = await userById(payout.teacherId)
    if (!recipient) return
    const paid = payout.status === "paid"
    const platform = payout.kind === "platform"
    await deliver(recipient, (l) => ({
      subject: paid
        ? fr(l) ? `Retrait envoyé : ${usd(payout.netUsd)}` : `Payout sent: ${usd(payout.netUsd)}`
        : fr(l) ? "Votre retrait n'a pas abouti" : "Your payout did not go through",
      heading: paid ? (fr(l) ? "Votre argent est en route" : "Your money is on its way") : fr(l) ? "Retrait non effectué" : "Payout not completed",
      paragraphs: [
        paid
          ? fr(l) ? "Le montant a été envoyé sur votre Mobile Money." : "The amount was sent to your Mobile Money."
          : platform
            ? fr(l) ? "Le retrait a échoué ; le montant reste disponible." : "The withdrawal failed; the amount is still available."
            : fr(l) ? `Le montant a été recrédité sur votre solde.${payout.note ? ` Motif : ${payout.note}` : ""}` : `The amount was credited back to your balance.${payout.note ? ` Reason: ${payout.note}` : ""}`,
      ],
      details: [
        [fr(l) ? "Montant net" : "Net amount", payout.amountLocal && payout.currency ? `${payout.amountLocal} ${payout.currency} (${usd(payout.netUsd)})` : usd(payout.netUsd)],
        ["Mobile Money", `${payout.method} ${payout.mobile}`],
        ...(payout.providerReference ? ([[fr(l) ? "Référence" : "Reference", payout.providerReference]] as [string, string][]) : []),
      ],
      cta: { label: fr(l) ? "Voir mes retraits" : "View my payouts", href: appUrl(platform ? "/dashboard/admin/payments" : "/dashboard/teacher/payouts") },
    }))
  })
}
