import Link from "next/link"
import { FileText, ArrowLeft } from "lucide-react"

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-[#064E3B]/10 bg-[#064E3B] text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-emerald-100 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Retour à l'accueil
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
              <FileText className="size-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-emerald-200">
                PB-pay
              </p>
              <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                Conditions d'utilisation
              </h1>
            </div>
          </div>

          <p className="mt-5 text-sm text-emerald-100">
            Dernière mise à jour : 17 septembre 2026
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          <p className="text-lg leading-8 text-muted-foreground">
            Les présentes Conditions d'utilisation définissent les règles
            applicables à l'utilisation du site, des applications et des
            services proposés par P Business Online (« PB-pay »).
          </p>

          <h2>1. Acceptation</h2>

          <p>
            En créant un compte ou en utilisant nos services, vous reconnaissez
            avoir pris connaissance des présentes conditions et acceptez de
            les respecter.
          </p>

          <h2>2. Compte utilisateur</h2>

          <p>
            Vous êtes responsable de l'exactitude des informations fournies
            lors de votre inscription et de la confidentialité de vos
            identifiants.
          </p>

          <p>
            Vous devez nous informer dès que possible si vous pensez que votre
            compte a été compromis ou utilisé sans autorisation.
          </p>

          <h2>3. Formations et contenus numériques</h2>

          <p>
            Les formations, certificats, codes sources, documents et autres
            contenus numériques disponibles sur PB-pay sont destinés à un
            usage conforme à leur description et aux conditions applicables
            à chaque produit.
          </p>

          <p>
            Sauf autorisation expresse, vous ne pouvez pas revendre, distribuer,
            publier ou partager publiquement les contenus protégés mis à votre
            disposition.
          </p>

          <h2>4. Paiements</h2>

          <p>
            Les prix applicables sont ceux affichés au moment de la commande.
            Les paiements peuvent être traités par des prestataires de
            paiement tiers disponibles sur la plateforme.
          </p>

          <p>
            Une transaction peut être soumise aux contrôles et conditions du
            prestataire de paiement utilisé.
          </p>

          <h2>5. Utilisation acceptable</h2>

          <p>Vous vous engagez à ne pas :</p>

          <ul>
            <li>utiliser le service à des fins illégales ;</li>
            <li>tenter d'accéder à des comptes ou systèmes sans autorisation ;</li>
            <li>contourner les mécanismes de sécurité ;</li>
            <li>perturber le fonctionnement de la plateforme ;</li>
            <li>utiliser le service pour transmettre des contenus frauduleux.</li>
          </ul>

          <h2>6. Disponibilité du service</h2>

          <p>
            Nous cherchons à maintenir nos services disponibles et
            fonctionnels. Toutefois, certaines interruptions peuvent être
            nécessaires pour la maintenance, les mises à jour, la sécurité
            ou en raison de circonstances indépendantes de notre volonté.
          </p>

          <h2>7. Propriété intellectuelle</h2>

          <p>
            Les éléments du site, notamment la marque, le design, les textes,
            interfaces, logos et contenus appartenant à PB-pay, restent
            protégés par les droits applicables.
          </p>

          <h2>8. Suspension ou résiliation</h2>

          <p>
            Nous pouvons suspendre ou limiter un compte lorsque cela est
            nécessaire pour protéger la plateforme, ses utilisateurs ou
            respecter nos obligations, notamment en cas de violation des
            présentes conditions.
          </p>

          <h2>9. Modifications</h2>

          <p>
            Ces conditions peuvent être mises à jour lorsque nos services ou
            obligations évoluent. Les nouvelles conditions prennent effet
            lorsqu'elles sont publiées sur cette page.
          </p>

          <h2>10. Contact</h2>

          <p>
            Pour toute question concernant ces conditions :
          </p>

          <p>
            <a
              href="mailto:pbpaysupport@gmail.com"
              className="font-medium text-[#064E3B] hover:underline dark:text-emerald-400"
            >
              pbpaysupport@gmail.com
            </a>
            <br />
            WhatsApp :{" "}
            <a
              href="https://wa.me/243980349916"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#064E3B] hover:underline dark:text-emerald-400"
            >
              +243 980 349 916
            </a>
          </p>
        </div>
      </article>
    </main>
  )
}