# 👥 Rôle Client — Épics C2 & C3 : Suivi des colis et historique

> **Rôle concerné :** Client (client final du transitaire)  
> **Épics :** C2 — Suivi de colis en temps réel · C3 — Historique des expéditions

> **Légende statut** (mise à jour : 2026-06-21) :
> ✅ Fait · 🟡 Partiel · 🔴 À faire — `- [x]` critère couvert par le code, `- [ ]` non couvert.

---

## Contexte métier

Une fois connecté, l'espace client est centré sur une seule préoccupation : **où en sont mes marchandises ?** Le client veut savoir rapidement l'état de ses colis actifs, visualiser les étapes passées et à venir, et connaître le coût estimé de l'expédition.

Le client peut avoir plusieurs colis en simultané, à différentes étapes du processus. La clarté visuelle de l'interface est primordiale : un importateur qui gère plusieurs conteneurs a besoin d'un coup d'œil suffisant pour évaluer la situation.

**Profil type du client :**
- PME importatrice avec 2 à 10 colis actifs à tout moment
- Pas nécessairement expert en logistique — il fait confiance à son transitaire
- Consulte l'espace depuis un smartphone (environ 60% des connexions)
- Priorité : savoir si son colis est "dans les temps" ou s'il y a un problème

**Enjeux :**
- Interface claire et rapide même sur mobile avec connexion lente
- Progressivité de l'information : vue résumée puis détail sur demande
- Confiance renforcée par la transparence sur les étapes et les délais

---

## US-C2.1 — Enregistrer un numéro de colis depuis l'espace client

**Priorité :** Should Have  
**Statut :** 🟡 Partiel — ajout et association d'un numéro fonctionnels ; la notification au transitaire pour un numéro inconnu manque.

### User story
> En tant que client, je veux pouvoir ajouter moi-même un numéro de colis depuis mon espace personnel, afin de commencer à suivre une expédition dont je connais déjà le numéro de tracking.

### Contexte
Dans certains cas, le transitaire communique le numéro de tracking par téléphone ou email avant d'avoir créé la fiche dans la plateforme. Le client peut vouloir ajouter ce numéro lui-même pour ne pas avoir à attendre. L'ajout d'un numéro par le client crée une "demande d'association" — le transitaire doit valider ou la fiche existe déjà.

### Critères d'acceptation

- [x] Un champ "Ajouter un numéro de colis" est visible sur le tableau de bord client
- [x] Le client saisit le numéro de tracking et soumet
- [x] **Cas 1 — Le numéro existe dans le tenant et est déjà associé au client :** la fiche colis est affichée directement, pas de duplication
- [x] **Cas 2 — Le numéro existe dans le tenant mais n'est pas encore associé à ce client :** la fiche colis est affichée (le transitaire a créé le colis sans l'associer encore)
- [ ] **Cas 3 — Le numéro n'existe pas dans le tenant :** un message informe le client que ce numéro n'est pas reconnu et l'invite à contacter son transitaire ; une demande est envoyée en notification au transitaire _(⚠️ partiel : le message est affiché, mais aucune notification/log n'est remontée au transitaire)_
- [x] Le champ de saisie accepte les caractères alphanumériques, tirets et underscores

### Règles métier

- Un client ne peut pas voir les colis d'un autre client, même en saisissant un numéro de tracking qui lui appartient
- En cas 3, l'ajout de numéro inconnu est enregistré dans un log accessible au transitaire ("demandes de tracking non trouvées")
- Le client ne peut pas créer lui-même une fiche colis complète — seulement associer un numéro existant ou signaler un numéro inconnu

### Cas limites

- Numéro de tracking trop long (> 50 caractères) → message d'erreur de validation
- Numéro appartenant à un autre client du même transitaire → traité comme le Cas 3 (pas de révélation d'information)
- Client soumettant le même numéro plusieurs fois → dédupliqué silencieusement

### Dépendances

- US-C1.1 (le client doit être connecté)
- US-E2.3 (le transitaire peut avoir créé la fiche en amont)

---

## US-C2.2 — Voir l'évolution du statut d'un colis

**Priorité :** Must Have  
**Statut :** ✅ Fait — cartes résumé + timeline détaillée avec étape courante mise en avant et étapes futures grisées.

### User story
> En tant que client, je veux visualiser la progression de mon colis sur une timeline claire, avec les dates et les commentaires associés à chaque étape, afin de savoir exactement où en est mon expédition.

### Contexte
C'est la fonctionnalité centrale de la plateforme. La timeline de suivi doit être compréhensible immédiatement, même par un utilisateur non familier avec la logistique. Elle doit distinguer visuellement les étapes passées, l'étape actuelle et les étapes à venir.

### Critères d'acceptation

**Vue tableau de bord (résumé) :**
- [x] Chaque colis actif est présenté sous forme de carte avec : numéro de tracking, statut actuel (couleur + libellé), date du dernier changement de statut, barre de progression visuelle (étapes passées / étape actuelle / étapes restantes)

**Vue détail du colis :**
- [x] Une timeline verticale affiche toutes les étapes dans l'ordre chronologique défini par le transitaire
- [x] Chaque étape passée affiche : l'icône et la couleur du statut, le libellé, la date et l'heure du changement, le commentaire du transitaire (si renseigné)
- [x] L'étape actuelle est mise en évidence visuellement (taille, couleur, animation subtile)
- [x] Les étapes futures (non encore atteintes) sont affichées en grisé pour montrer la progression à venir
- [x] Si une date de livraison estimée a été renseignée, elle est affichée de manière prominente en haut de la fiche

### Règles métier

- Les étapes futures affichées au client sont les statuts définis par le transitaire dans son workflow (US-E2.1), dans l'ordre qu'il a configuré
- Le commentaire du transitaire est affiché verbatim — le client ne peut pas le modifier ni y répondre (en V1)
- Si un colis passe d'un statut avancé à un statut antérieur (ex. retour en douane), la timeline affiche la chronologie réelle (pas l'ordre théorique du workflow)

### Cas limites

- Colis avec un seul statut (initial) → la timeline montre l'étape unique + toutes les étapes futures en grisé
- Colis avec un statut `final` → les étapes futures ne sont pas affichées, un message "Expédition terminée" est affiché
- Timeline avec plus de 10 étapes → scroll interne dans la section timeline, les 3 dernières étapes sont visibles par défaut

### Dépendances

- US-C1.1 (connexion)
- US-E2.1 (statuts configurés)
- US-E2.2 (statut mis à jour par le transitaire)
- US-E2.3 (fiche colis créée)

---

## US-C2.3 — Consulter l'estimation du prix de l'expédition

**Priorité :** Should Have  
**Statut :** 🔴 À faire — le montant/devise est stocké et chargé en base mais n'est pas affiché sur la fiche colis client.

### User story
> En tant que client, je veux voir l'estimation du coût de mon expédition sur la fiche de mon colis, afin d'anticiper mes dépenses et de préparer les paiements à venir.

### Contexte
L'estimation de prix est renseignée par le transitaire lors de la création ou de la mise à jour du colis. Elle est indicative — le prix final peut varier en fonction des frais de dédouanement, des taxes, etc. La présentation doit être claire sur ce caractère non contractuel.

### Critères d'acceptation

- [ ] Si une estimation de prix a été renseignée par le transitaire, elle est visible sur la fiche colis dans une section dédiée _(❌ donnée chargée mais non rendue sur `parcels/[id]`)_
- [ ] L'estimation affiche : le montant, la devise, et la mention "Estimation indicative — le montant final peut varier"
- [ ] Si aucune estimation n'a été renseignée, la section n'est pas affichée (pas de "0" ou de champ vide visible)
- [ ] Si l'estimation a été mise à jour par le transitaire, la nouvelle valeur est affichée avec la date de mise à jour

### Règles métier

- L'estimation est fournie par le transitaire — le client ne peut pas la modifier
- Le client ne peut pas voir l'historique des estimations précédentes (seule la dernière valeur est visible)
- La devise est celle configurée dans le tenant par l'admin lors de la création

### Cas limites

- Devise non standard → affichage du code ISO 4217 (ex. "MGA" pour Ariary malgache)
- Montant très élevé (> 100 000) → affichage avec séparateur de milliers pour la lisibilité

### Dépendances

- US-E2.3 (l'estimation est renseignée dans la fiche colis)

---

## US-C3.1 — Consulter l'historique de tous ses colis

**Priorité :** Must Have  
**Statut :** ✅ Fait — section "Mes expéditions" avec recherche, filtres statut/période et pagination.

### User story
> En tant que client, je veux accéder à la liste complète de toutes mes expéditions passées et en cours, filtrables et triables, afin de retrouver facilement un colis spécifique et d'avoir une vue d'ensemble de mon activité.

### Contexte
Un client actif peut avoir cumulé plusieurs dizaines de colis sur une année. L'historique complet doit être accessible, recherchable et exportable. Il peut servir à la comptabilité du client (rapprochement des factures) ou à la gestion des litiges.

### Critères d'acceptation

- [x] Une section "Mes expéditions" liste tous les colis du client (actifs + terminés/archivés)
- [x] Par défaut, les colis actifs apparaissent en premier, triés par date de dernier changement de statut (le plus récent en tête)
- [x] Chaque ligne de la liste affiche : numéro de tracking, statut actuel (couleur + libellé), date de création, date de livraison (ou date estimée si pas encore livré)
- [x] Des filtres sont disponibles : statut (tous / actifs / terminés), période de création (ce mois, 3 derniers mois, cette année, personnalisé)
- [x] Une barre de recherche permet de rechercher par numéro de tracking ou par description de marchandise
- [x] La liste est paginée (10 colis par page sur mobile, 20 sur desktop)
- [x] Un clic sur une ligne ouvre la fiche détail du colis (US-C2.2)

### Règles métier

- Un colis est considéré "terminé" lorsqu'il est à un statut de type `final`
- L'historique est illimité dans le temps — tous les colis depuis la création du compte sont accessibles
- Le client ne voit que ses propres colis — jamais ceux des autres clients du même transitaire

### Cas limites

- Client sans aucun colis → page vide avec message d'invitation à contacter le transitaire pour enregistrer une expédition
- Recherche par numéro de tracking partiel → la recherche est de type "contient" (pas seulement "commence par")
- Plus de 100 colis en historique → pagination maintenue, pas de dégradation de performance

### Dépendances

- US-C1.1 (connexion)
- US-C2.2 (fiche colis doit être accessible depuis la liste)

---

## US-C3.2 — Exporter l'historique de ses colis

**Priorité :** Could Have  
**Statut :** 🔴 À faire — aucun bouton ni route d'export CSV côté client.

### User story
> En tant que client, je veux pouvoir exporter la liste de mes colis au format CSV, afin de la réutiliser dans mes outils comptables ou de gestion.

### Contexte
Certains clients, notamment des PME avec un volume d'importation régulier, ont besoin d'exporter leurs données logistiques pour les intégrer dans leurs outils internes (ERP, comptabilité, Excel).

### Critères d'acceptation

- [ ] Un bouton "Exporter en CSV" est disponible dans la section "Mes expéditions"
- [ ] L'export respecte les filtres actifs (ex. exporter uniquement les colis de cette année)
- [ ] Le fichier CSV contient : numéro de tracking, description de marchandise, date de création, date de livraison (ou vide), tous les statuts traversés avec dates, estimation de prix (si renseignée)
- [ ] L'encodage du fichier est UTF-8 avec BOM pour compatibilité Excel
- [ ] Le nom du fichier suit le format : `colis_[nom-client]_[date-export].csv`
- [ ] L'export se télécharge directement (pas d'email)

### Règles métier

- L'export est limité à 500 colis par téléchargement (au-delà, l'utilisateur doit filtrer)
- L'export n'inclut pas les commentaires internes du transitaire (si la notion d'interne/externe est distinguée en V2)

### Cas limites

- Plus de 500 colis dans la sélection → message d'avertissement invitant à appliquer des filtres pour réduire la sélection
- Caractères spéciaux dans les descriptions → correctement encodés en UTF-8

### Dépendances

- US-C3.1 (la liste doit exister)
