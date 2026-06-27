# 🏢 Rôle Entreprise — Épic E2 : Gestion des statuts de colis

> **Rôle concerné :** Entreprise (le transitaire)  
> **Épic :** E2 — Gestion des statuts et du cycle de vie des colis

> **Légende statut** (mise à jour : 2026-06-21) :
> ✅ Fait · 🟡 Partiel · 🔴 À faire — `- [x]` critère couvert par le code, `- [ ]` non couvert.

---

## Contexte métier

Le cœur métier de la plateforme réside dans le suivi de l'évolution d'un colis de son point de départ à sa livraison. Chaque transitaire a son propre **workflow logistique** : les étapes qu'un colis traverse varient selon le type d'expédition (maritime, aérien, routier), la destination, et les procédures internes de chaque entreprise.

La plateforme ne dicte pas de statuts fixes — elle laisse chaque transitaire définir son propre référentiel de statuts, qu'il applique ensuite aux colis de ses clients. Cette flexibilité est un différenciateur clé de la solution.

**Exemple de workflow typique d'un transitaire maritime :**
1. Commande enregistrée
2. Colis réceptionné à l'entrepôt
3. En attente d'embarquement
4. Embarqué (avec date estimée d'arrivée)
5. En transit maritime
6. Arrivé au port de destination
7. En dédouanement
8. Dédouanement accordé
9. En livraison locale
10. Livré

**Enjeux :**
- Permettre au transitaire de refléter exactement son processus métier
- Déclencher automatiquement les notifications clients à chaque changement
- Tracer l'historique complet des changements pour audit et litiges

---

## US-E2.1 — Créer et configurer les statuts personnalisés

**Priorité :** Must Have  
**Statut :** 🟡 Partiel — création/édition/suppression + réordonnancement (boutons) en place ; les icônes, l'avertissement de statut utilisé et le drag & drop manquent.

### User story
> En tant que transitaire, je veux définir, organiser et modifier ma propre liste de statuts de colis, afin que le suivi proposé à mes clients reflète exactement mon processus logistique interne.

### Contexte
Dès l'activation de son espace, le transitaire dispose d'une liste de statuts par défaut (génériques). Il doit pouvoir les modifier, en ajouter, en supprimer, et les ordonner selon son workflow réel.

### Critères d'acceptation

**Création d'un statut :**
- [x] Un bouton "Ajouter un statut" permet de créer un nouveau statut
- [x] Champs obligatoires : libellé du statut (max 60 caractères), couleur associée (color picker)
- [ ] Champs optionnels : icône (sélection depuis une bibliothèque prédéfinie de 30+ icônes), description interne (non visible par le client, max 200 caractères) _(⚠️ partiel : description gérée, sélecteur d'icône absent)_
- [ ] Un aperçu du rendu du statut (couleur + icône + libellé) est affiché avant confirmation _(⚠️ partiel : aperçu couleur + libellé sans icône)_

**Modification d'un statut existant :**
- [x] Tous les champs d'un statut sont modifiables à tout moment
- [ ] Si le statut est actuellement utilisé sur des colis actifs, un avertissement est affiché : "Ce statut est utilisé sur X colis en cours. La modification s'appliquera immédiatement." _(❌ pas d'avertissement en modification)_

**Suppression d'un statut :**
- [x] Un statut peut être supprimé uniquement s'il n'est plus utilisé sur aucun colis actif
- [x] Si le statut est encore utilisé, la suppression est bloquée avec un message indiquant les colis concernés
- [x] Il faut conserver un minimum de 2 statuts actifs dans la liste

**Organisation :**
- [ ] Les statuts sont réordonnables par glisser-déposer (drag & drop) pour définir l'ordre chronologique _(⚠️ partiel : réordonnancement via boutons haut/bas, pas de drag & drop)_
- [x] L'ordre des statuts est utilisé pour afficher la timeline de progression dans l'espace client

### Règles métier

- Un statut a un **type** parmi : `initial` (premier statut d'un colis), `intermédiaire`, `final` (colis considéré comme livré/clôturé)
- Il ne peut y avoir qu'un seul statut de type `initial` et un ou plusieurs statuts de type `final`
- Les statuts de type `final` ne peuvent pas être suivis d'autres statuts dans le workflow
- Les libellés de statuts sont visibles des clients finaux — ils doivent être en langage client (pas de jargon interne)

### Cas limites

- Tentative de suppression d'un statut utilisé → blocage + liste des colis concernés avec liens
- Moins de 2 statuts actifs → bouton "Supprimer" désactivé sur tous les statuts
- Libellé trop long (> 60 caractères) → message d'erreur immédiat
- Deux statuts avec le même libellé → avertissement (autorisé mais déconseillé)

### Dépendances

- US-A1.1 (le tenant doit exister)
- Conditionne US-E2.2 et US-E2.3

---

## US-E2.2 — Mettre à jour le statut d'un colis

**Priorité :** Must Have  
**Statut :** 🟡 Partiel — changement de statut + commentaire + historique + notification automatique opérationnels ; la liste déroulante n'affiche pas couleur/icône.

### User story
> En tant que transitaire (opérateur), je veux changer le statut d'un colis depuis mon espace d'administration, afin de tenir le client informé de l'évolution de son expédition en temps réel.

### Contexte
Les opérateurs du transitaire (équipe logistique, customer service) utilisent cette fonctionnalité quotidiennement, potentiellement sur des dizaines de colis par jour. L'interface doit être rapide, claire, et ne pas nécessiter trop d'étapes.

### Critères d'acceptation

- [x] Depuis la liste des colis ou la fiche d'un colis, un bouton "Changer le statut" est accessible
- [ ] Une liste déroulante affiche les statuts disponibles (définis en US-E2.1), avec la couleur et l'icône associées _(⚠️ partiel : la liste affiche le libellé seul)_
- [x] Un champ texte optionnel "Commentaire" permet d'ajouter un message visible du client (ex. "Votre colis est en attente de dédouanement suite à un contrôle douanier.", max 500 caractères)
- [x] Un champ de date/heure optionnel permet de dater précisément le changement (par défaut : date et heure actuelles)
- [x] Une confirmation est demandée avant application (modale de confirmation avec résumé)
- [x] Après confirmation, le statut est mis à jour immédiatement sur la fiche colis et dans l'espace client
- [x] Une notification est automatiquement déclenchée vers le client concerné (voir Épic C4)
- [x] Le changement est inscrit dans l'historique de la fiche colis avec : nouveau statut, commentaire, date/heure, nom de l'opérateur qui a effectué le changement

### Règles métier

- Un statut de type `final` ne peut pas être suivi d'un autre statut (le colis est clôturé)
- Exception : un admin ou un opérateur avec droits élevés peut "rouvrir" un colis clôturé (action tracée)
- Le commentaire est affiché dans l'espace client sur la timeline du colis
- Il est possible de mettre à jour plusieurs colis en même temps (action groupée) — sans commentaire individualisé dans ce cas

### Cas limites

- Tentative de changer le statut d'un colis déjà au statut `final` → message d'avertissement + confirmation supplémentaire requise
- Opérateur sans droits suffisants → bouton désactivé ou masqué
- Changement de statut groupé sur 50+ colis → traitement asynchrone avec barre de progression

### Dépendances

- US-E2.1 (les statuts doivent être configurés)
- US-C4.1 (déclenche les notifications client)

---

## US-E2.3 — Créer et enregistrer un nouveau colis

**Priorité :** Must Have  
**Statut :** 🟡 Partiel — création complète + unicité + visibilité temps réel côté client ; la notification "nouveau colis" reste à brancher.

### User story
> En tant que transitaire, je veux pouvoir créer une fiche colis et l'associer à un client, afin de démarrer le suivi d'une nouvelle expédition.

### Contexte
Un colis est créé par le transitaire (pas par le client seul). Le transitaire saisit les informations de l'expédition et l'associe à un compte client existant. Le client peut également enregistrer son propre numéro de tracking depuis son espace (voir US-C2.1), mais la fiche complète avec toutes les informations est créée du côté entreprise.

### Critères d'acceptation

- [x] Un formulaire de création de colis est accessible depuis l'espace entreprise
- [x] Champs obligatoires : numéro de tracking (unique, max 50 caractères), client associé (sélection depuis la liste des clients), statut initial, date de création de l'expédition
- [x] Champs optionnels : description de la marchandise (max 200 caractères), poids (kg), volume (m³), estimation de prix (montant + devise), pays d'origine, pays de destination, date de livraison estimée
- [x] Le numéro de tracking est vérifié pour l'unicité dans le tenant
- [x] Le colis est immédiatement visible dans l'espace client du client associé
- [ ] Une notification est envoyée au client pour l'informer qu'un nouveau colis a été enregistré à son nom _(❌ notification déclenchée seulement au changement de statut, pas à la création)_

### Règles métier

- Le numéro de tracking peut être alphanumérique (lettres, chiffres, tirets, underscores)
- L'estimation de prix est indicative et non contractuelle — une mention légale est affichée dans l'espace client
- Un colis ne peut être associé qu'à un seul client (pas de partage entre clients)
- Un transitaire peut avoir des colis sans client associé (ex. en attente d'affectation) — le champ client est alors optionnel

### Cas limites

- Numéro de tracking déjà existant dans le tenant → message d'erreur + lien vers le colis existant
- Client sélectionné inactif/suspendu → avertissement mais création autorisée
- Estimation de prix négative ou égale à zéro → message d'erreur

### Dépendances

- US-E2.1 (les statuts doivent être configurés pour choisir le statut initial)
- US-E3.1 / US-E3.2 (le client doit exister)
- US-C2.1 (le client peut aussi ajouter son numéro depuis son espace)
