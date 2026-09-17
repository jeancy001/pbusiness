import Link from "next/link"
import { ShieldCheck, ArrowLeft } from "lucide-react"

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-[#064E3B]/10 bg-[#064E3B] text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-emerald-100 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Retour à l'accueil
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck className="size-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-emerald-200">
                PB-pay
              </p>
              <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                Politique de confidentialité
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
            La présente Politique de confidentialité explique comment
            P Business Online (« PB-pay », « nous » ou « notre ») collecte,
            utilise, conserve et protège les informations lorsque vous
            utilisez notre site, nos applications et nos services.
          </p>

          <h2>1. Informations que nous collectons</h2>

          <p>
            Selon les services que vous utilisez, nous pouvons collecter
            notamment les informations que vous fournissez directement,
            telles que votre nom, votre adresse email, votre numéro de
            téléphone, les informations de votre compte et les informations
            nécessaires à l'utilisation de nos services.
          </p>

          <p>
            Nous pouvons également recevoir des informations techniques
            relatives à votre utilisation du site, notamment certaines
            informations sur l'appareil, le navigateur, les pages consultées
            et les données nécessaires au fonctionnement et à la sécurité du
            service.
          </p>

          <h2>2. Utilisation des informations</h2>

          <p>Nous pouvons utiliser les informations collectées afin de :</p>

          <ul>
            <li>créer et gérer votre compte ;</li>
            <li>fournir nos formations et services numériques ;</li>
            <li>traiter et suivre les transactions et demandes de service ;</li>
            <li>communiquer avec vous concernant votre compte ou vos demandes ;</li>
            <li>améliorer nos services et l'expérience utilisateur ;</li>
            <li>prévenir les abus, fraudes et utilisations non autorisées ;</li>
            <li>respecter les obligations légales applicables.</li>
          </ul>

          <h2>3. Paiements</h2>

          <p>
            Lorsque vous effectuez un paiement, certaines informations
            nécessaires au traitement de la transaction peuvent être
            transmises à nos prestataires de paiement. Les informations
            sensibles de paiement sont traitées conformément aux mécanismes
            de sécurité mis en place par les prestataires concernés.
          </p>

          <p>
            PB-pay ne demande pas votre mot de passe bancaire ou votre code
            PIN de paiement par message, email ou téléphone.
          </p>

          <h2>4. Partage des informations</h2>

          <p>
            Nous ne vendons pas vos informations personnelles. Certaines
            informations peuvent être communiquées à des prestataires
            techniques ou partenaires lorsque cela est nécessaire pour
            fournir nos services, traiter les paiements, assurer la sécurité
            ou respecter une obligation légale.
          </p>

          <h2>5. Conservation</h2>

          <p>
            Nous conservons les informations aussi longtemps que nécessaire
            pour fournir les services, maintenir nos dossiers, résoudre les
            litiges, prévenir les abus et respecter les obligations
            applicables.
          </p>

          <h2>6. Sécurité</h2>

          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles
            raisonnables destinées à protéger les informations contre les
            accès, modifications, divulgations ou destructions non autorisés.
          </p>

          <p>
            Aucun système informatique ou transmission sur Internet ne peut
            toutefois être garanti comme totalement sécurisé.
          </p>

          <h2>7. Vos droits</h2>

          <p>
            Selon votre situation et la législation applicable, vous pouvez
            disposer de droits concernant l'accès, la correction ou la
            suppression de certaines informations personnelles.
          </p>

          <p>
            Pour toute demande relative à vos données personnelles, contactez
            notre équipe à :
          </p>

          <p>
            <a
              href="mailto:pbpaysupport@gmail.com"
              className="font-medium text-[#064E3B] hover:underline dark:text-emerald-400"
            >
              pbpaysupport@gmail.com
            </a>
          </p>

          <h2>8. Modifications</h2>

          <p>
            Nous pouvons mettre à jour cette Politique de confidentialité
            lorsque nos services, pratiques ou obligations évoluent. La
            version publiée sur cette page constitue la version applicable
            à compter de sa date de mise à jour.
          </p>

          <h2>9. Contact</h2>

          <p>
            Pour toute question concernant cette politique, vous pouvez nous
            contacter par email ou WhatsApp.
          </p>

          <p>
            Email :{" "}
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