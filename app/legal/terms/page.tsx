import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "../_components/legal-shell";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — HERVIA",
  description:
    "Conditions générales d'utilisation de la plateforme HERVIA pour transitaires.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Conditions Générales d'Utilisation"
      lastUpdated="16 mai 2026"
      intro={
        <p>
          Les présentes Conditions Générales d&apos;Utilisation (ci-après «&nbsp;CGU&nbsp;»)
          régissent l&apos;accès et l&apos;utilisation de la plateforme HERVIA, éditée par
          [RAISON SOCIALE], et accessible à l&apos;adresse{" "}
          <a href="https://hervia.co">hervia.co</a> ainsi que sur les sous-domaines
          clients (ci-après «&nbsp;le Service&nbsp;»). En créant un compte ou en utilisant
          le Service, vous acceptez sans réserve les présentes CGU.
        </p>
      }
    >
      <section>
        <h2>1. Objet du Service</h2>
        <p>
          HERVIA est une plateforme SaaS (Software-as-a-Service) destinée aux
          transitaires, commissionnaires de transport et acteurs de la logistique
          internationale. Elle permet notamment&nbsp;:
        </p>
        <ul>
          <li>la gestion et le suivi des expéditions et colis,</li>
          <li>la mise à disposition d&apos;un espace client en marque blanche,</li>
          <li>l&apos;automatisation des statuts et notifications,</li>
          <li>la collaboration entre opérateurs internes au transitaire.</li>
        </ul>
      </section>

      <section>
        <h2>2. Comptes utilisateurs</h2>
        <p>
          L&apos;accès au Service nécessite la création d&apos;un compte. L&apos;utilisateur
          peut s&apos;inscrire par email/mot de passe ou via un fournisseur d&apos;identité
          tiers (Google, Facebook, etc.) lorsque cette option est disponible.
        </p>
        <p>
          L&apos;utilisateur s&apos;engage à fournir des informations exactes, à maintenir
          la confidentialité de ses identifiants et à informer HERVIA sans délai de
          tout usage non autorisé de son compte.
        </p>
      </section>

      <section>
        <h2>3. Abonnement et facturation</h2>
        <p>
          Le Service est proposé sous forme d&apos;abonnement payant et, le cas
          échéant, d&apos;une période d&apos;essai gratuite. Les conditions tarifaires,
          modalités de paiement et durée d&apos;engagement sont précisées au moment de
          la souscription. Toute somme versée reste acquise à HERVIA sauf disposition
          légale impérative contraire.
        </p>
      </section>

      <section>
        <h2>4. Obligations de l&apos;utilisateur</h2>
        <p>L&apos;utilisateur s&apos;engage à&nbsp;:</p>
        <ul>
          <li>
            utiliser le Service conformément aux lois et règlements applicables et
            aux présentes CGU,
          </li>
          <li>
            ne pas détourner le Service à des fins frauduleuses, illégales ou
            portant atteinte aux droits de tiers,
          </li>
          <li>
            ne pas tenter d&apos;accéder de manière non autorisée aux systèmes
            d&apos;information de HERVIA ou de ses utilisateurs.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments du Service (code, interface, marques, logos,
          contenus éditoriaux) est protégé par le droit de la propriété
          intellectuelle et reste la propriété exclusive de HERVIA ou de ses
          concédants. L&apos;utilisateur bénéficie d&apos;un droit d&apos;usage personnel,
          non exclusif et non transférable, limité à la durée de son abonnement.
        </p>
        <p>
          L&apos;utilisateur conserve la propriété de ses propres données et contenus
          téléversés sur le Service. Il concède à HERVIA une licence d&apos;hébergement
          et de traitement strictement nécessaire à la fourniture du Service.
        </p>
      </section>

      <section>
        <h2>6. Responsabilité</h2>
        <p>
          HERVIA s&apos;engage à fournir le Service avec diligence dans le cadre d&apos;une
          obligation de moyens. La disponibilité visée est de 99,9&nbsp;% hors
          maintenances planifiées et cas de force majeure.
        </p>
        <p>
          HERVIA ne saurait être tenue responsable des dommages indirects (perte
          d&apos;exploitation, perte de chance, perte de données imputable à
          l&apos;utilisateur) résultant de l&apos;utilisation ou de l&apos;impossibilité
          d&apos;utiliser le Service. La responsabilité totale de HERVIA est plafonnée,
          tous préjudices confondus, aux sommes effectivement versées par
          l&apos;utilisateur au titre des douze derniers mois.
        </p>
      </section>

      <section>
        <h2>7. Données personnelles</h2>
        <p>
          Le traitement des données personnelles est décrit dans la{" "}
          <Link href="/legal/privacy">Politique de confidentialité</Link>, qui fait
          partie intégrante des présentes CGU.
        </p>
      </section>

      <section>
        <h2>8. Résiliation</h2>
        <p>
          L&apos;utilisateur peut résilier son compte à tout moment depuis son espace
          personnel ou en écrivant à{" "}
          <a href="mailto:contact@hervia.co">contact@hervia.co</a>. La suppression
          des données s&apos;effectue selon les modalités décrites dans la page{" "}
          <Link href="/legal/data-deletion">Suppression des données</Link>.
        </p>
        <p>
          HERVIA se réserve le droit de suspendre ou résilier l&apos;accès au Service
          en cas de manquement grave aux présentes CGU, après notification restée
          sans effet pendant un délai raisonnable.
        </p>
      </section>

      <section>
        <h2>9. Modification des CGU</h2>
        <p>
          HERVIA peut modifier les présentes CGU à tout moment. Les utilisateurs
          seront informés par email ou par notification dans le Service au moins
          trente (30) jours avant l&apos;entrée en vigueur des modifications
          substantielles.
        </p>
      </section>

      <section>
        <h2>10. Droit applicable et juridiction</h2>
        <p>
          Les présentes CGU sont régies par le droit français. À défaut de
          résolution amiable, tout litige relatif à leur interprétation ou à leur
          exécution relèvera de la compétence exclusive des tribunaux du ressort de
          [SIÈGE SOCIAL], sous réserve des règles impératives de protection des
          consommateurs lorsqu&apos;elles s&apos;appliquent.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          Pour toute question relative aux présentes CGU, contactez-nous à{" "}
          <a href="mailto:contact@hervia.co">contact@hervia.co</a>.
        </p>
      </section>
    </LegalShell>
  );
}
