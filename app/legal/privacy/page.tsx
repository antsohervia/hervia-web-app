import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "../_components/legal-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — HERVIA",
  description:
    "Comment HERVIA collecte, utilise et protège vos données personnelles (RGPD).",
  robots: { index: false, follow: true },
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Politique de confidentialité"
      lastUpdated="16 mai 2026"
      intro={
        <p>
          La présente politique décrit la manière dont HERVIA collecte, utilise et
          protège vos données personnelles dans le cadre de la fourniture du
          Service, conformément au Règlement Général sur la Protection des Données
          (RGPD) et à la loi Informatique et Libertés.
        </p>
      }
    >
      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données personnelles est&nbsp;:
          [RAISON SOCIALE], [ADRESSE SIÈGE], immatriculée sous le numéro [SIRET].
        </p>
        <p>
          Contact&nbsp;: <a href="mailto:contact@hervia.co">contact@hervia.co</a>.
        </p>
      </section>

      <section>
        <h2>2. Données que nous collectons</h2>
        <h3>2.1 Données fournies par vous</h3>
        <ul>
          <li>
            Données de compte&nbsp;: nom, prénom, adresse email, mot de passe (haché),
            numéro de téléphone, fonction, entreprise.
          </li>
          <li>
            Données métier&nbsp;: expéditions, colis, destinataires, statuts,
            communications avec vos clients, fichiers téléversés.
          </li>
          <li>Données de facturation&nbsp;: nom de la société, adresse, TVA.</li>
        </ul>

        <h3>2.2 Données reçues d&apos;un fournisseur d&apos;identité tiers (OAuth)</h3>
        <p>
          Lorsque vous choisissez de vous connecter via Google, Facebook ou un autre
          fournisseur OAuth, nous recevons de ce fournisseur les données suivantes,
          dans la limite des autorisations que vous nous accordez&nbsp;:
        </p>
        <ul>
          <li>identifiant unique du compte chez le fournisseur,</li>
          <li>adresse email,</li>
          <li>nom et prénom,</li>
          <li>photo de profil (avatar) le cas échéant.</li>
        </ul>
        <p>
          Ces données sont utilisées exclusivement pour créer et identifier votre
          compte HERVIA. Nous ne publions rien sur votre compte tiers, nous ne lisons
          aucune autre information (contacts, messages, publications), et nous ne
          partageons pas ces données avec d&apos;autres services.
        </p>

        <h3>2.3 Données collectées automatiquement</h3>
        <ul>
          <li>
            Données de connexion&nbsp;: adresse IP, type de navigateur, système
            d&apos;exploitation, horodatages.
          </li>
          <li>
            Données d&apos;usage&nbsp;: pages visitées, actions effectuées dans le
            Service (à des fins d&apos;amélioration et de sécurité).
          </li>
          <li>
            Cookies techniques nécessaires au fonctionnement (session, préférences
            de langue).
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Finalités et bases légales</h2>
        <ul>
          <li>
            <strong>Exécution du contrat</strong>&nbsp;: fournir le Service, gérer
            votre compte, traiter les expéditions, facturer.
          </li>
          <li>
            <strong>Intérêt légitime</strong>&nbsp;: sécuriser le Service, prévenir
            la fraude, améliorer la qualité, analyser l&apos;usage de manière agrégée.
          </li>
          <li>
            <strong>Obligation légale</strong>&nbsp;: conservation des factures
            (10&nbsp;ans), réponses aux réquisitions des autorités compétentes.
          </li>
          <li>
            <strong>Consentement</strong>&nbsp;: lorsqu&apos;il est requis (envoi
            d&apos;informations commerciales, cookies non essentiels).
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Durée de conservation</h2>
        <ul>
          <li>
            Données de compte&nbsp;: pendant toute la durée de la relation
            contractuelle, puis supprimées dans un délai de 30 jours après
            résiliation (hors obligations légales).
          </li>
          <li>
            Données de facturation&nbsp;: 10 ans (obligations comptables et
            fiscales).
          </li>
          <li>
            Logs techniques&nbsp;: 12 mois maximum.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Destinataires et sous-traitants</h2>
        <p>
          Vos données sont accessibles aux équipes habilitées de HERVIA et aux
          sous-traitants suivants, agissant strictement sur nos instructions&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> (base de données, authentification,
            hébergement) — données hébergées en Union Européenne.
          </li>
          <li>
            <strong>[HÉBERGEUR APPLICATIF]</strong> (hébergement de l&apos;application
            web) — Union Européenne.
          </li>
          <li>
            <strong>[FOURNISSEUR EMAIL TRANSACTIONNEL]</strong> (envoi
            d&apos;emails) — Union Européenne.
          </li>
        </ul>
        <p>
          Aucune donnée n&apos;est revendue. Aucun transfert hors Union Européenne
          n&apos;est effectué sans garanties appropriées (clauses contractuelles types
          de la Commission Européenne).
        </p>
      </section>

      <section>
        <h2>6. Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez des droits suivants&nbsp;:
        </p>
        <ul>
          <li>droit d&apos;accès à vos données,</li>
          <li>droit de rectification,</li>
          <li>
            droit à l&apos;effacement (voir la page{" "}
            <Link href="/legal/data-deletion">Suppression des données</Link>),
          </li>
          <li>droit à la limitation du traitement,</li>
          <li>droit à la portabilité,</li>
          <li>droit d&apos;opposition,</li>
          <li>
            droit de définir des directives relatives au sort de vos données après
            votre décès.
          </li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à{" "}
          <a href="mailto:contact@hervia.co">contact@hervia.co</a>. Vous disposez
          également du droit d&apos;introduire une réclamation auprès de la CNIL
          (<a href="https://www.cnil.fr">www.cnil.fr</a>).
        </p>
      </section>

      <section>
        <h2>7. Sécurité</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles
          appropriées pour protéger vos données&nbsp;: chiffrement en transit (TLS),
          chiffrement au repos, contrôle d&apos;accès strict, journalisation, sauvegardes
          régulières et tests de restauration.
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          HERVIA utilise uniquement des cookies strictement nécessaires au
          fonctionnement du Service (session d&apos;authentification, préférence de
          langue). Aucun cookie publicitaire ou de pistage tiers n&apos;est déposé.
        </p>
      </section>

      <section>
        <h2>9. Modification de la politique</h2>
        <p>
          Cette politique peut être mise à jour. La date de dernière mise à jour
          figure en haut de la page. Les modifications substantielles vous seront
          notifiées par email ou via le Service.
        </p>
      </section>
    </LegalShell>
  );
}
