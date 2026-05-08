# 👥 Rôle Client — Épic C4 : Notifications

> **Rôle concerné :** Client (client final du transitaire)  
> **Épic :** C4 — Notifications et alertes de changement de statut

---

## Contexte métier

Les clients ne consultent pas leur espace de suivi de manière proactive tous les jours. Ils ont besoin d'être **alertés** lorsqu'un événement important se produit sur leurs colis, sans avoir à se connecter régulièrement pour vérifier.

Les notifications sont un canal de communication directe entre le transitaire et le client — elles portent la marque du transitaire et doivent véhiculer un message clair et actionnable. Elles doivent également respecter les préférences du client (certains ne veulent pas d'emails intempestifs).

**Types d'événements déclencheurs :**
- Changement de statut d'un colis (principal)
- Enregistrement d'un nouveau colis sur son compte
- Rappel si un colis est sans statut depuis X jours (futur)

**Enjeux :**
- Informer sans saturer (éviter le spam perçu)
- Permettre au client de réagir rapidement en cas de problème (ex. dédouanement bloqué nécessitant des documents)
- Maintenir la confiance dans le transitaire via une communication proactive

---

## US-C4.1 — Recevoir une notification email à chaque changement de statut

**Priorité :** Must Have

### User story
> En tant que client, je veux recevoir un email automatique dès qu'un de mes colis change de statut, afin d'être informé de l'évolution de mon expédition sans avoir à me connecter régulièrement.

### Contexte
L'email est le canal de notification principal en V1. Il est déclenché automatiquement lorsque le transitaire met à jour le statut d'un colis (US-E2.2). L'email porte la marque blanche du transitaire et contient un lien direct vers la fiche du colis concerné.

### Critères d'acceptation

**Déclenchement :**
- [ ] Un email est envoyé automatiquement dans les 2 minutes suivant un changement de statut par le transitaire
- [ ] Si plusieurs statuts sont changés simultanément sur le même colis (edge case d'import), un seul email est envoyé (le dernier statut)
- [ ] En cas de changement de statut groupé (multiple colis), un email séparé est envoyé par colis (pas d'email récapitulatif groupé en V1)

**Contenu de l'email :**
- [ ] Le logo du transitaire est affiché en haut de l'email
- [ ] L'objet de l'email suit le format : `[Nom du transitaire] — Mise à jour de votre colis [numéro de tracking]`
- [ ] Le corps contient : le numéro de tracking, le nouveau statut (avec sa couleur sous forme d'un badge coloré), la date et l'heure du changement, le commentaire du transitaire (si renseigné), un bouton CTA "Voir le détail de mon colis" (lien direct vers la fiche)
- [ ] Une barre de progression visuelle (étapes passées / actuelle / à venir) est incluse dans l'email
- [ ] Le bas de l'email contient : les coordonnées du transitaire, un lien de désinscription des notifications email

**Gestion des préférences :**
- [ ] En cliquant sur le lien de désinscription, le client est redirigé vers une page de confirmation lui permettant de désactiver les notifications email (sans avoir à se connecter)
- [ ] La désinscription est effective immédiatement
- [ ] Le client peut réactiver les notifications depuis son espace personnel (paramètres)

### Règles métier

- L'email est envoyé à l'adresse email avec laquelle le client s'est connecté (adresse de son compte)
- Un client désinscrit continue de recevoir les emails "critiques" (ex. nouveau compte créé, réinitialisation de mot de passe) — seules les notifications de suivi sont désactivées
- Les emails de notification sont distincts des emails transactionnels (connexion, réinitialisation mdp) qui, eux, ne peuvent pas être désactivés
- L'email est envoyé depuis une adresse de type `noreply@trackapp.com` avec un `Reply-To` configuré sur l'email de contact du transitaire (si renseigné)

### Cas limites

- Email du client inexistant ou invalide (edge case de données corrompues) → l'erreur est loguée côté transitaire, pas de notification silencieuse
- Service d'envoi d'emails indisponible → les emails en échec sont mis en file d'attente et renvoyés jusqu'à 3 fois (intervalles : 5 min, 30 min, 2h)
- Email classé en spam → hors du périmètre de la plateforme, mais les emails doivent respecter les bonnes pratiques anti-spam (SPF, DKIM, DMARC)
- Client avec boîte pleine → le rebond est loggé, le transitaire peut voir les adresses en erreur depuis son espace

### Dépendances

- US-E2.2 (déclenché par le changement de statut)
- US-E1.1 (logo du transitaire pour la personnalisation de l'email)
- US-E1.2 (couleur principale pour le badge de statut dans l'email)

---

## US-C4.2 — Consulter les notifications in-app

**Priorité :** Should Have

### User story
> En tant que client, je veux voir un centre de notifications dans mon espace, avec l'historique de toutes les alertes reçues, afin de retrouver facilement les informations même si j'ai raté un email.

### Contexte
Certains clients peuvent manquer les emails (spam, boîte pleine) ou préfèrent consulter les notifications directement dans la plateforme. Un centre de notifications in-app offre un historique permanent des événements, complémentaire aux emails.

### Critères d'acceptation

- [ ] Une icône de cloche est visible dans le header de l'espace client, avec un compteur des notifications non lues
- [ ] En cliquant sur la cloche, un panneau latéral (ou dropdown) s'ouvre avec la liste des notifications
- [ ] Chaque notification affiche : le numéro de colis concerné, le nouveau statut, la date et l'heure, un indicateur visuel "lu/non lu"
- [ ] Un clic sur une notification marque celle-ci comme lue et redirige vers la fiche colis concernée
- [ ] Un bouton "Tout marquer comme lu" permet de vider le compteur
- [ ] Les notifications sont conservées pendant 90 jours
- [ ] La liste est paginée (20 notifications par chargement, scroll infini)

### Règles métier

- Les notifications in-app sont générées par les mêmes événements que les emails (synchronisées)
- Un client qui a désactivé les notifications email continue de recevoir les notifications in-app (les deux canaux sont indépendants)
- Le compteur de notifications non lues est mis à jour en temps quasi-réel (polling toutes les 30 secondes ou WebSocket selon l'implémentation technique)

### Cas limites

- Plus de 200 notifications non lues → le compteur affiche "99+" pour ne pas surcharger visuellement
- Notification pointant vers un colis supprimé → la notification reste affichée mais le lien est désactivé avec un message "Ce colis n'est plus disponible"

### Dépendances

- US-C4.1 (les mêmes événements déclencheurs s'appliquent)
- US-C1.1 (le client doit être connecté pour accéder aux notifications in-app)
