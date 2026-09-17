import Link from "next/link"
import { RotateCcw, ArrowLeft } from "lucide-react"

export default function RefundPolicy() {
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
              <RotateCcw className="size-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-emerald-200">
                PB-pay
              </p>
              <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                Politique de remboursement
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
            Cette politique explique les conditions générales applicables aux
            demandes de remboursement pour les produits et services achetés
            auprès de P Business Online (« PB-pay »).
          </p>

          <h2>1. Principe général</h2>

          <p>
            Les demandes de remboursement sont examinées au cas par cas en
            fonction du produit ou service concerné, de son état d'utilisation
            et des conditions affichées au moment de l'achat.
          </p>

          <h2>2. Formations numériques</h2>

          <p>
            Pour les formations numériques, une demande de remboursement peut
            être examinée lorsque le contenu n'a pas été utilisé ou lorsque
            nous n'avons pas pu fournir le produit acheté.
          </p>

          <p>
            Lorsque l'accès à une formation, à un code source ou à un contenu
            numérique a déjà été utilisé ou téléchargé, les possibilités de
            remboursement peuvent être limitées en raison de la nature
            numérique du produit.
          </p>

          <h2>3. Services personnalisés</h2>

          <p>
            Pour les prestations personnalisées, projets, développements ou
            services réalisés spécifiquement pour un client, les conditions
            applicables peuvent dépendre de l'état d'avancement du projet et
            des accords conclus avec le client.
          </p>

          <h2>4. Paiements échoués</h2>

          <p>
            Lorsqu'un paiement a été débité mais que la commande n'a pas été
            correctement confirmée, nous pouvons vérifier la transaction avec
            le prestataire de paiement avant de procéder à une éventuelle
            régularisation.
          </p>

          <h2>5. Comment demander un remboursement</h2>

          <p>
            Pour demander un remboursement, contactez notre support en
            indiquant :
          </p>

          <ul>
            <li>votre nom ;</li>
            <li>l'adresse email utilisée lors de l'achat ;</li>
            <li>la référence de la transaction ou de la commande ;</li>
            <li>le produit ou service concerné ;</li>
            <li>la raison de votre demande.</li>
          </ul>

          <p>
            Envoyez votre demande à :
          </p>

          <p>
            <a
              href="mailto:pbpaysupport@gmail.com"
              className="font-medium text-[#064E3B] hover:underline dark:text-emerald-400"
            >
              pbpaysupport@gmail.com
            </a>
          </p>

          <h2>6. Examen de la demande</h2>

          <p>
            Nous pouvons demander des informations supplémentaires afin de
            vérifier la transaction et de comprendre la situation. Une fois
            l'examen terminé, nous vous informerons de la décision et, lorsque
            le remboursement est accepté, des modalités applicables.
          </p>

          <h2>7. Délai de traitement</h2>

          <p>
            Le délai de réception d'un remboursement peut également dépendre
            du moyen de paiement utilisé et du prestataire financier
            concerné.
          </p>

          <h2>8. Transactions non autorisées</h2>

          <p>
            Si vous constatez une transaction que vous ne reconnaissez pas,
            contactez-nous rapidement afin que nous puissions examiner la
            situation.
          </p>

          <h2>9. Modifications</h2>

          <p>
            Cette politique peut être mise à jour lorsque nos produits,
            services ou procédures évoluent. La version publiée sur cette page
            est la version applicable à compter de sa date de mise à jour.
          </p>

          <h2>10. Contact</h2>

          <p>
            Pour toute question concernant un remboursement :
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