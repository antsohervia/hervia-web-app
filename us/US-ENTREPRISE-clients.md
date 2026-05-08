# 🏢 Rôle Entreprise — Épic E3 : Gestion des clients

> **Rôle concerné :** Entreprise (le transitaire)  
> **Épic :** E3 — Gestion du portefeuille clients

---

## Contexte métier

Les "clients" dans le contexte de cette plateforme sont les **importateurs ou exportateurs** qui confient leurs marchandises au transitaire. Ils ont besoin d'un accès pour suivre leurs expéditions, mais ils ne créent pas eux-mêmes leur compte — c'est le transitaire qui les enrôle.

Le transitaire gère son portefeuille client depuis son espace d'administration. Cette gestion est essentielle car chaque client doit avoir accès uniquement à ses propres colis et données — l'isolation des données entre clients est une contrainte forte de sécurité.

**Enjeux :**
- Permettre un onboarding client rapide (quelques minutes maximum)
- Garantir l'isolation des données entre clients d'un même transitaire
- Offrir au transitaire une vue claire sur l'activité de chaque client

---

## US-E3.1 — Consulter la liste de ses clients

**Priorité :** Must Have

### User story
> En tant que transitaire, je veux accéder à une liste paginée et filtrable de tous mes clients enregistrés, afin de gérer efficacement mon portefeuille et d'accéder rapidement aux informations d'un client spécifique.

### Contexte
Un transitaire peut gérer des dizaines à plusieurs centaines de clients. La liste doit être rapide à parcourir, avec des filtres et une recherche efficace. Elle sert aussi de point d'entrée pour accéder aux colis d'un client ou pour prendre contact avec lui.

### Critères d'acceptation

- [ ] La liste affiche pour chaque client : nom complet (ou raison sociale), email, téléphone, date de création du compte, nombre de colis actifs, nombre de colis total, statut du compte (actif/inactif)
- [ ] Une barre de recherche permet de filtrer par : nom, email, ou numéro de téléphone
- [ ] Des filtres sont disponibles : statut du compte (actif/inactif), date d'inscription (plage de dates)
- [ ] Un tri est possible sur chaque colonne (nom, date d'inscription, nb de colis)
- [ ] La liste est paginée (25 clients par page par défaut, configurable à 50 ou 100)
- [ ] En cliquant sur un client, l'opérateur accède à la fiche détail du client
- [ ] La fiche détail affiche : informations de contact, liste de ses colis (avec accès direct aux fiches colis), date de dernière connexion

### Règles métier

- Un client visible dans la liste appartient exclusivement à ce tenant — aucune donnée d'un autre transitaire n'est accessible
- Le numéro de téléphone est affiché au format international (ex. +261 34 00 000 00)
- La date de "dernière connexion" est mise à jour à chaque session client

### Cas limites

- Aucun client enregistré → écran vide avec message d'invitation à créer le premier client
- Recherche sans résultat → message "Aucun client trouvé" avec possibilité de créer un nouveau client directement
- Client avec plusieurs dizaines de colis → la liste des colis dans la fiche détail est aussi paginée

### Dépendances

- US-E3.2 (des clients doivent exister)

---

## US-E3.2 — Créer un compte client

**Priorité :** Must Have

### User story
> En tant que transitaire, je veux créer manuellement un compte client avec ses informations de contact, afin qu'il puisse se connecter à son espace de suivi et commencer à consulter ses colis.

### Contexte
L'enrôlement des clients est initié par le transitaire. Lorsqu'il commence à travailler avec un nouvel importateur/exportateur, il crée son compte en saisissant les informations de contact. Le client reçoit automatiquement ses identifiants de connexion par email.

### Critères d'acceptation

- [ ] Un formulaire de création client est accessible depuis la liste des clients et depuis la fiche d'un colis (lors de la création d'un colis sans client associé)
- [ ] Champs obligatoires : prénom + nom (ou raison sociale), adresse email, mot de passe temporaire généré automatiquement
- [ ] Champs optionnels : numéro de téléphone (international), adresse postale, notes internes (non visibles du client, max 500 caractères)
- [ ] L'email est vérifié pour l'unicité dans le tenant (un email ne peut pas être associé à deux clients du même transitaire)
- [ ] Un email de bienvenue est envoyé automatiquement avec : les identifiants de connexion (email + mot de passe temporaire), le lien vers l'espace client (`[sous-domaine].trackapp.com`), le logo du transitaire
- [ ] Le client est invité à changer son mot de passe lors de sa première connexion
- [ ] Le compte est immédiatement actif après création

### Règles métier

- Le mot de passe temporaire généré doit respecter : min 10 caractères, au moins 1 majuscule, 1 chiffre, 1 caractère spécial
- L'email de bienvenue utilise la personnalisation de marque du transitaire (logo, couleur)
- Un transitaire ne peut pas voir les mots de passe de ses clients (hachage côté serveur)
- Un même email peut être utilisé par un client chez différents transitaires (tenants différents = espaces distincts)

### Cas limites

- Email déjà utilisé dans le tenant → message d'erreur avec lien vers le client existant
- Email invalide (format incorrect) → validation en temps réel sur le champ
- Échec de l'envoi d'email → le compte est créé quand même, un avertissement invite le transitaire à transmettre les identifiants manuellement
- Création de masse (import CSV) → US dédiée à prévoir en V2

### Dépendances

- US-E1.1 (le logo doit être configuré pour les emails de bienvenue)
- Conditionne US-E2.3 (association colis-client)
- Conditionne toutes les US du rôle Client

---

## US-E3.3 — Désactiver ou supprimer un compte client

**Priorité :** Should Have

### User story
> En tant que transitaire, je veux pouvoir désactiver temporairement ou supprimer définitivement un compte client, afin de gérer les fins de relation commerciale ou les doublons.

### Contexte
Certains clients cessent d'avoir recours aux services du transitaire, ou un compte a été créé en doublon. Le transitaire doit pouvoir gérer le cycle de vie des comptes sans avoir à contacter l'équipe SaaS admin.

### Critères d'acceptation

**Désactivation :**
- [ ] Un bouton "Désactiver le compte" est disponible sur la fiche client
- [ ] Un motif optionnel peut être renseigné
- [ ] Le client désactivé ne peut plus se connecter (page d'erreur explicative)
- [ ] Les colis et l'historique du client sont conservés et toujours accessibles par le transitaire
- [ ] La réactivation est possible à tout moment depuis la fiche client

**Suppression définitive :**
- [ ] La suppression est disponible uniquement si le client n'a aucun colis actif (tous ses colis sont à un statut `final`)
- [ ] Une confirmation en deux étapes est requise
- [ ] Les données du client sont anonymisées (RGPD) : email, nom, téléphone remplacés par des valeurs anonymes
- [ ] L'historique des colis est conservé mais désassocié (client affiché comme "Client supprimé")

### Règles métier

- Un client avec des colis actifs ne peut pas être supprimé — seulement désactivé
- La suppression anonymise les données personnelles mais conserve les données logistiques (numéros de colis, statuts, dates) pour les besoins d'audit du transitaire
- Conformité RGPD : le client peut demander la suppression de ses données (fonctionnalité à implémenter côté client en V2)

### Cas limites

- Tentative de suppression avec colis actifs → bouton désactivé + message explicatif avec liste des colis actifs
- Réactivation d'un client désactivé → ses colis actifs redeviennent visibles immédiatement

### Dépendances

- US-E3.1 et US-E3.2 (le client doit exister)
