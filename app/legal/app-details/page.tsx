import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "../_components/legal-shell";

export const metadata: Metadata = {
  title: "À propos de l'application — HERVIA",
  description:
    "Présentation de HERVIA, des permissions OAuth demandées et de l'éditeur de l'application.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/legal/app-details" },
};

export default function AppDetailsPage() {
  return (
    <LegalShell
      title="À propos de l'application HERVIA"
      lastUpdated="16 mai 2026"
      intro={
        <p>
          Cette page décrit l&apos;application HERVIA, son fonctionnement et les
          informations que nous demandons aux fournisseurs d&apos;identité tiers
          (Google, Facebook, etc.) lorsque vous choisissez de vous connecter avec
          eux. Elle fait également office de mentions légales de l&apos;éditeur.
        </p>
      }
    >
      <section>
        <h2>1. Présentation</h2>
        <p>
          HERVIA est un logiciel en mode SaaS (Software-as-a-Service) destiné aux
          transitaires, commissionnaires de transport et acteurs de la logistique
          internationale. Il centralise les expéditions, automatise le suivi des
          colis et offre aux clients finaux un espace de tracking en marque
          blanche.
        </p>
        <p>
          L&apos;application est exclusivement professionnelle (B2B). Elle ne publie
          aucun contenu sur les réseaux sociaux et ne sollicite pas vos contacts.
        </p>
      </section>

      <section>
        <h2>2. À qui s&apos;adresse HERVIA</h2>
        <ul>
          <li>Transitaires et commissionnaires de transport,</li>
          <li>opérateurs logistiques multi-modaux (maritime, aérien, routier),</li>
          <li>équipes opérationnelles, commerciales et clients finaux.</li>
        </ul>
      </section>

      <section>
        <h2>3. Connexion via un fournisseur tiers (OAuth)</h2>
        <p>
          Pour faciliter la création de compte, HERVIA propose la connexion via
          des fournisseurs d&apos;identité tiers (Google, Facebook, etc.). Cette
          fonctionnalité est facultative&nbsp;: vous pouvez toujours créer un
          compte avec un email et un mot de passe classique.
        </p>

        <h3>3.1 Permissions demandées</h3>
        <p>
          Lorsque vous vous connectez via un fournisseur tiers, nous demandons
          uniquement les permissions strictement nécessaires à l&apos;identification
          de votre compte&nbsp;:
        </p>
        <ul>
          <li>
            <strong>email</strong> — pour identifier votre compte de manière unique
            et vous envoyer les communications liées au Service (confirmation
            d&apos;inscription, alertes, factures).
          </li>
          <li>
            <strong>public_profile / profile</strong> — pour récupérer votre nom et
            votre photo de profil, qui seront affichés dans votre espace HERVIA et
            visibles par vos collègues au sein de votre organisation.
          </li>
        </ul>

        <h3>3.2 Ce que nous ne faisons PAS</h3>
        <ul>
          <li>nous ne publions rien en votre nom sur le fournisseur tiers,</li>
          <li>
            nous ne lisons pas vos publications, messages, contacts ou autres
            données stockées chez le fournisseur,
          </li>
          <li>
            nous ne partageons pas les données reçues du fournisseur avec d&apos;autres
            services tiers,
          </li>
          <li>
            nous n&apos;utilisons pas ces données à des fins publicitaires.
          </li>
        </ul>

        <h3>3.3 Suppression et révocation</h3>
        <p>
          Vous pouvez à tout moment révoquer l&apos;accès accordé à HERVIA depuis les
          paramètres de votre compte chez le fournisseur tiers. Pour supprimer
          également les données stockées chez HERVIA, suivez la procédure décrite
          sur la page <Link href="/legal/data-deletion">Suppression des données</Link>.
        </p>
      </section>

      <section>
        <h2>4. Sécurité et hébergement</h2>
        <ul>
          <li>Chiffrement en transit (TLS 1.2+) sur l&apos;ensemble des échanges.</li>
          <li>Chiffrement au repos des bases de données.</li>
          <li>
            Hébergement et stockage des données dans l&apos;Union Européenne, chez
            un prestataire cloud certifié.
          </li>
          <li>
            Authentification conforme aux standards OAuth&nbsp;2.0 / OpenID
            Connect.
          </li>
          <li>
            Contrôle d&apos;accès strict, journalisation des actions sensibles,
            sauvegardes régulières et tests de restauration.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Éditeur — Mentions légales</h2>
        <ul>
          <li>
            <strong>Raison sociale</strong>&nbsp;: [RAISON SOCIALE]
          </li>
          <li>
            <strong>Forme juridique</strong>&nbsp;: [SAS / SARL / …]
          </li>
          <li>
            <strong>Siège social</strong>&nbsp;: [ADRESSE COMPLÈTE]
          </li>
          <li>
            <strong>Numéro d&apos;immatriculation</strong>&nbsp;: [SIRET / RCS]
          </li>
          <li>
            <strong>Numéro de TVA intracommunautaire</strong>&nbsp;: [TVA]
          </li>
          <li>
            <strong>Directeur de la publication</strong>&nbsp;: [NOM PRÉNOM]
          </li>
          <li>
            <strong>Contact</strong>&nbsp;:{" "}
            <a href="mailto:contact@hervia.co">contact@hervia.co</a>
          </li>
        </ul>
        <p className="text-sm text-foreground/60">
          Hébergeur du site&nbsp;: [HÉBERGEUR — Raison sociale, adresse, téléphone].
        </p>
      </section>

      <section>
        <h2>6. Ressources liées</h2>
        <ul>
          <li>
            <Link href="/legal/terms">Conditions Générales d&apos;Utilisation</Link>
          </li>
          <li>
            <Link href="/legal/privacy">Politique de confidentialité</Link>
          </li>
          <li>
            <Link href="/legal/data-deletion">Suppression de vos données</Link>
          </li>
        </ul>
      </section>
    </LegalShell>
  );
}
