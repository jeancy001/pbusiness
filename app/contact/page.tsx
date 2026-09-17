"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Mail,
  MessageCircle,
  Send,
  CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function Contacts() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-[#064E3B]/10 bg-[#064E3B] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-200">
              PB-pay
            </p>

            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Contactez-nous
            </h1>

            <p className="mt-4 text-base leading-7 text-emerald-50 sm:text-lg">
              Une question, une demande d'assistance ou un projet ?
              Notre équipe est disponible pour vous accompagner.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                Parlons ensemble
              </h2>

              <div className="mt-2 h-1 w-14 rounded-full bg-[#064E3B]" />

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Utilisez l'un des moyens ci-dessous pour contacter
                l'équipe PB-pay.
              </p>
            </div>

            {/* WhatsApp */}
            <a
              href="https://wa.me/243980349916"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-[#064E3B]/15 bg-card p-5 shadow-sm transition-all duration-200 hover:border-[#064E3B]/40 hover:shadow-md dark:border-emerald-800/40 dark:hover:border-emerald-700"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#064E3B]/10 text-[#064E3B] transition-colors group-hover:bg-[#064E3B] group-hover:text-white dark:bg-emerald-950/50 dark:text-emerald-400 dark:group-hover:bg-[#064E3B] dark:group-hover:text-white">
                <MessageCircle className="size-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  WhatsApp
                </p>

                <p className="mt-1 font-semibold text-foreground">
                  +243 980 349 916
                </p>

                <p className="mt-1 text-xs text-[#064E3B] dark:text-emerald-400">
                  Démarrer une conversation
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:pbpaysupport@gmail.com"
              className="group flex items-center gap-4 rounded-2xl border border-[#064E3B]/15 bg-card p-5 shadow-sm transition-all duration-200 hover:border-[#064E3B]/40 hover:shadow-md dark:border-emerald-800/40 dark:hover:border-emerald-700"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#064E3B]/10 text-[#064E3B] transition-colors group-hover:bg-[#064E3B] group-hover:text-white dark:bg-emerald-950/50 dark:text-emerald-400 dark:group-hover:bg-[#064E3B] dark:group-hover:text-white">
                <Mail className="size-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>

                <p className="mt-1 break-all font-semibold text-foreground">
                  pbpaysupport@gmail.com
                </p>

                <p className="mt-1 text-xs text-[#064E3B] dark:text-emerald-400">
                  Envoyer un email
                </p>
              </div>
            </a>

            {/* Support Card */}
            <div className="rounded-2xl border border-[#064E3B]/15 bg-[#064E3B]/5 p-5 dark:border-emerald-800/50 dark:bg-emerald-950/30">
              <p className="font-semibold text-[#064E3B] dark:text-emerald-400">
                Assistance PB-pay
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pour toute question concernant votre compte, vos paiements,
                vos formations ou les services PB-pay, contactez-nous par
                WhatsApp ou par email.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border border-[#064E3B]/15 bg-card p-6 shadow-sm sm:p-8 dark:border-emerald-800/40">
            {submitted ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#064E3B]/10 text-[#064E3B] dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="size-8" />
                </div>

                <h2 className="mt-5 font-heading text-2xl font-bold">
                  Message envoyé
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Merci de nous avoir contactés. Notre équipe prendra
                  connaissance de votre demande.
                </p>

                <Button
                  type="button"
                  className="mt-6"
                  onClick={() => setSubmitted(false)}
                >
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <>
                <h2 className="font-heading text-2xl font-bold">
                  Envoyez-nous un message
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Remplissez le formulaire et expliquez-nous votre demande.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mt-6 flex flex-col gap-5"
                >
                  {/* Name */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nom complet
                    </Label>

                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="Votre nom"
                    />
                  </div>

                  {/* Email */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">
                      Adresse email
                    </Label>

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="vous@exemple.com"
                    />
                  </div>

                  {/* Phone */}
                  <div className="grid gap-2">
                    <Label htmlFor="phone">
                      Téléphone / WhatsApp
                    </Label>

                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+243 ..."
                    />
                  </div>

                  {/* Subject */}
                  <div className="grid gap-2">
                    <Label htmlFor="subject">
                      Sujet
                    </Label>

                    <Input
                      id="subject"
                      name="subject"
                      required
                      placeholder="Objet de votre demande"
                    />
                  </div>

                  {/* Message */}
                  <div className="grid gap-2">
                    <Label htmlFor="message">
                      Message
                    </Label>

                    <Textarea
                      id="message"
                      name="message"
                      required
                      placeholder="Décrivez votre demande..."
                      className="min-h-32"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="mt-1 w-full"
                  >
                    <Send className="mr-2 size-4" />
                    Envoyer le message
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-[#064E3B]/10 bg-[#064E3B]/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-6 py-10 text-center sm:flex-row sm:text-left lg:px-8">
          <div>
            <h2 className="font-heading text-xl font-bold">
              Besoin d'une réponse rapide ?
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Contactez directement notre équipe sur WhatsApp.
            </p>
          </div>

          <Button
            size="lg"
            render={
              <Link
                href="https://wa.me/243980349916"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageCircle className="mr-2 size-4" />
            WhatsApp
          </Button>
        </div>
      </section>
    </main>
  )
}