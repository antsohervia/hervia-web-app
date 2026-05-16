import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "../_components/legal-shell";

export const metadata: Metadata = {
  title: "Suppression de vos données — HERVIA",
  description:
    "Procédure pour demander la suppression de votre compte et de vos données personnelles HERVIA.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/legal/data-deletion" },
};

export default function DataDeletionPage() {
  return (
    <LegalShell
      title="Suppression de vos données"
      lastUpdated="16 mai 2026"
      intro={
        <p>
          Cette page décrit la procédure pour demander la suppression de votre
          compte HERVIA et des données personnelles associées, y compris lorsque
          votre compte a été créé via un fournisseur d&apos;identité tiers (Google,
          Facebook, etc.).
        </p>
      }
    >
      <section>
        <h2>1. Comment demander la suppression</h2>
        <p>Vous avez deux possibilités&nbsp;:</p>
        <ul>
          <li>
            <strong>Depuis votre espace HERVIA</strong>&nbsp;: rendez-vous dans
            «&nbsp;Réglages → Mon compte&nbsp;» et cliquez sur «&nbsp;Supprimer mon
            compte&nbsp;».
          </li>
          <li>
            <strong>Par email</strong>&nbsp;: envoyez un message à{" "}
            <a href="mailto:contact@hervia.co?subject=Demande%20de%20suppression%20de%20compte">
              contact@hervia.co
            </a>{" "}
            depuis l&apos;adresse email associée à votre compte, avec pour objet
            «&nbsp;Demande de suppression de compte&nbsp;».
          </li>
        </ul>
        <p>
          Si votre compte a été créé via Facebook, Google ou un autre fournisseur
          OAuth, indiquez-le dans votre message&nbsp;: la suppression couvre
          également les données reçues de ce fournisseur (identifiant, email, nom,
          avatar).
        </p>
      </section>

      <section>
        <h2>2. Délai de traitement</h2>
        <p>
          Votre demande est traitée sous <strong>30 jours</strong> à compter de sa
          réception. Vous recevrez une confirmation par email une fois la
          suppression effectuée.
        </p>
      </section>

      <section>
        <h2>3. Ce qui est supprimé</h2>
        <ul>
          <li>votre compte utilisateur et vos identifiants,</li>
          <li>
            les données reçues du fournisseur OAuth utilisé lors de votre
            inscription (Facebook, Google, etc.)&nbsp;: identifiant unique, email,
            nom, avatar,
          </li>
          <li>vos préférences et paramètres personnels,</li>
          <li>
            vos données métier (colis, expéditions, contacts) lorsqu&apos;elles ne
            sont pas partagées avec d&apos;autres utilisateurs de votre organisation.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Ce qui peut être conservé</h2>
        <p>
          Certaines données sont conservées au-delà de la suppression, pour les
          durées et motifs suivants&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Factures et pièces comptables</strong>&nbsp;: 10 ans
            (obligation légale, articles L.&nbsp;123-22 du Code de commerce et
            169 du Livre des procédures fiscales).
          </li>
          <li>
            <strong>Logs techniques anonymisés</strong>&nbsp;: jusqu&apos;à
            12&nbsp;mois pour des raisons de sécurité.
          </li>
          <li>
            <strong>Données partagées au sein de votre organisation</strong>&nbsp;:
            si vous appartenez à une organisation transitaire utilisant HERVIA, les
            colis et expéditions que vous avez créés restent visibles par vos
            collègues (ils relèvent des données de l&apos;organisation, pas des
            vôtres).
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Vos autres droits</h2>
        <p>
          Avant ou en complément de la suppression, vous pouvez exercer vos autres
          droits RGPD (accès, rectification, portabilité, limitation, opposition)
          en nous contactant à{" "}
          <a href="mailto:contact@hervia.co">contact@hervia.co</a>. Voir la{" "}
          <Link href="/legal/privacy">Politique de confidentialité</Link> pour plus de
          détails.
        </p>
      </section>

      <section>
        <h2>6. Contact</h2>
        <p>
          Pour toute question relative à la suppression de vos données, écrivez à{" "}
          <a href="mailto:contact@hervia.co">contact@hervia.co</a>. En cas de
          désaccord, vous pouvez saisir la CNIL (
          <a href="https://www.cnil.fr">www.cnil.fr</a>).
        </p>
      </section>
    </LegalShell>
  );
}
