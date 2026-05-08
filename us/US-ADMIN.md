# 👤 Rôle Admin — Épic A1 : Gestion des tenants

> **Rôle concerné :** Admin (équipe interne SaaS)  
> **Épic :** A1 — Gestion des tenants (sous-domaines)

---

## Contexte métier

L'administrateur est un membre de l'équipe interne qui gère la plateforme SaaS dans sa globalité. Il n'est jamais visible des clients finaux ni des transitaires dans leur usage quotidien — son rôle est purement opérationnel et de supervision.

Chaque transitaire est représenté par un **tenant** : une instance isolée de la plateforme avec son propre sous-domaine, sa propre base de données logique, et sa propre configuration. L'admin crée, configure et peut suspendre ces tenants.

**Enjeux :**
- Garantir l'isolation des données entre tenants
- Permettre un onboarding rapide de nouveaux transitaires
- Avoir une visibilité globale sur l'usage de la plateforme

---

## US-A1.1 — Créer un nouveau tenant transitaire

**Priorité :** Must Have

### User story
> En tant qu'admin, je veux créer un nouvel espace entreprise avec un sous-domaine dédié, afin d'onboarder un nouveau transitaire sur la plateforme rapidement et de manière autonome.

### Contexte
Lorsqu'un nouveau transitaire souscrit à la plateforme, l'admin doit pouvoir lui créer un espace en quelques minutes. Cet espace devient immédiatement accessible via son sous-domaine, avec un état vierge prêt à être configuré par l'entreprise.

### Critères d'acceptation

- [ ] Un formulaire de création permet de saisir : nom de l'entreprise, sous-domaine souhaité, email de l'administrateur entreprise, pays, devise par défaut
- [ ] Le système vérifie que le sous-domaine est disponible et valide (lettres, chiffres, tirets uniquement — pas d'espaces ni caractères spéciaux)
- [ ] En cas de sous-domaine déjà pris, un message d'erreur clair est affiché avec des suggestions alternatives
- [ ] Un email d'activation est envoyé automatiquement à l'administrateur entreprise avec un lien valable 72h
- [ ] L'application du tenant est accessible via `[sous-domaine].trackapp.com` dès la création
- [ ] Le tenant est visible dans la liste des tenants de l'admin avec le statut "Actif"
- [ ] Un logo par défaut est attribué au tenant jusqu'à personnalisation

### Règles métier

- Le sous-domaine est **définitif** une fois créé (aucune modification possible sans intervention technique)
- Un tenant nouvellement créé est vide : aucun client, aucun colis, statuts par défaut pré-configurés
- L'email de l'administrateur entreprise devient le premier compte "Entreprise" du tenant
- Les sous-domaines réservés sont bloqués : `www`, `api`, `admin`, `app`, `mail`, `support`

### Cas limites

- Sous-domaine déjà utilisé → message d'erreur + suggestions
- Email administrateur déjà associé à un autre tenant → avertissement (autorisé mais signalé)
- Lien d'activation expiré → possibilité de renvoyer depuis l'interface admin

### Dépendances

- Nécessite la fonctionnalité d'envoi d'email (service SMTP / transactionnel)
- Conditionne toutes les US du rôle Entreprise

---

## US-A1.2 — Suspendre ou supprimer un tenant

**Priorité :** Must Have

### User story
> En tant qu'admin, je veux pouvoir suspendre ou supprimer définitivement un tenant, afin de gérer les fins d'abonnement, les impayés ou les fermetures de compte.

### Contexte
Un transitaire peut cesser son abonnement, être en défaut de paiement, ou demander la suppression de son espace. L'admin doit disposer de deux niveaux d'action : la suspension temporaire (réversible) et la suppression définitive (avec export préalable).

### Critères d'acceptation

**Suspension :**
- [ ] L'admin peut suspendre un tenant depuis sa fiche détail
- [ ] Un motif de suspension peut être renseigné (champ texte libre + liste prédéfinie : impayé, fraude, demande client, maintenance)
- [ ] Dès la suspension, les utilisateurs du tenant (entreprise et clients) voient une page de suspension avec un message explicatif
- [ ] Les données du tenant sont intégralement conservées
- [ ] L'admin peut réactiver le tenant à tout moment — le tenant retrouve son état exact d'avant suspension
- [ ] Un email de notification est envoyé à l'administrateur entreprise lors de la suspension

**Suppression définitive :**
- [ ] La suppression est disponible uniquement si le tenant est déjà suspendu (pas de suppression directe depuis l'état actif)
- [ ] Une confirmation en deux étapes est requise (saisie manuelle du sous-domaine pour confirmer)
- [ ] Un export ZIP des données (clients, colis, historique au format CSV/JSON) est proposé avant suppression
- [ ] La suppression est irréversible — le sous-domaine redevient disponible après 30 jours

### Règles métier

- Un tenant actif ne peut pas être supprimé directement — il doit être suspendu en premier
- La page de suspension affichée aux utilisateurs peut être personnalisée par l'admin (message, contact support)
- Les sous-domaines supprimés entrent en quarantaine 30 jours avant d'être libérés

### Cas limites

- Tentative de suppression sans suspension préalable → bouton désactivé avec tooltip explicatif
- Export de données échoue → l'admin est notifié, la suppression est bloquée jusqu'à succès de l'export

### Dépendances

- US-A1.1 (un tenant doit exister pour être suspendu/supprimé)

---

## US-A1.3 — Visualiser le tableau de bord global

**Priorité :** Should Have

### User story
> En tant qu'admin, je veux accéder à un tableau de bord centralisant l'état de tous les tenants, afin de surveiller la santé de la plateforme et détecter rapidement les anomalies.

### Contexte
Avec un nombre croissant de transitaires sur la plateforme, l'admin a besoin d'une vue synthétique pour monitorer l'activité sans avoir à naviguer dans chaque tenant individuellement.

### Critères d'acceptation

- [ ] Une liste paginée de tous les tenants est affichée avec : nom, sous-domaine, statut (actif/suspendu), date de création, nombre de clients, nombre de colis total
- [ ] Des filtres sont disponibles : par statut, par date de création (plage), par recherche textuelle (nom, sous-domaine)
- [ ] Un tri est possible sur chaque colonne
- [ ] En cliquant sur un tenant, l'admin accède à sa fiche détail (informations, statistiques, actions)
- [ ] Un bouton "Accéder à l'espace entreprise" permet à l'admin de se connecter en tant que ce tenant (mode impersonification, clairement signalé visuellement)
- [ ] Des indicateurs globaux sont affichés en haut : nb total de tenants actifs, nb total de clients, nb total de colis en cours

### Règles métier

- Le mode impersonification est tracé dans les logs (qui s'est connecté, quand, durée)
- L'admin en mode impersonification ne peut pas modifier les données — lecture seule

### Cas limites

- Plus de 100 tenants → pagination ou scroll infini avec performance maintenue
- Tenant sans aucune activité (0 clients, 0 colis) → affiché normalement, sans différenciation

### Dépendances

- US-A1.1 (au moins un tenant doit exister)
- US-A1.2 (le statut suspendu doit être géré)

---

## US-A1.4 — Modifier les informations d'un tenant

**Priorité :** Must Have

### User story
> En tant qu'admin, je veux pouvoir modifier les informations d'un tenant existant, afin de corriger une erreur de saisie ou refléter un changement de situation côté transitaire (changement de contact, de devise, etc.).

### Contexte
Les informations renseignées à la création peuvent évoluer : un transitaire change d'administrateur principal, ouvre une activité dans un nouveau pays, ou souhaite ajuster sa devise par défaut. L'admin doit pouvoir intervenir sans nécessiter de ticket technique.

### Critères d'acceptation

- [ ] Depuis la fiche détail d'un tenant, l'admin peut éditer : nom de l'entreprise, email administrateur entreprise, pays, devise par défaut, fuseau horaire, logo
- [ ] Le sous-domaine reste **non modifiable** depuis cette interface (cf. US-A1.1)
- [ ] Toute modification est horodatée et tracée dans le journal d'audit (cf. US-A1.7)
- [ ] Un changement d'email administrateur entreprise déclenche un email de notification à l'ancien et au nouveau contact
- [ ] La modification de devise par défaut n'affecte pas les colis/factures existants (verrouillés à leur devise d'origine)
- [ ] Un changement de fuseau horaire est appliqué immédiatement aux affichages de dates côté tenant

### Règles métier

- Le sous-domaine est immuable — toute demande de changement nécessite une procédure technique manuelle
- Les modifications de devise et fuseau horaire sont prospectives uniquement (pas de recalcul rétroactif)
- Le changement d'email administrateur entreprise ne supprime pas le compte précédent — il transfère uniquement le rôle d'administrateur principal

### Cas limites

- Email administrateur entreprise déjà utilisé sur un autre tenant → avertissement (autorisé mais signalé, comme à la création)
- Logo uploadé non conforme (format, taille) → message d'erreur, l'ancien logo est conservé
- Tentative de modification sur un tenant suspendu → autorisée, mais signalée visuellement

### Dépendances

- US-A1.1 (un tenant doit exister pour être modifié)
- US-A1.7 (journal d'audit pour la traçabilité)

---

## US-A1.5 — Gérer les plans, abonnements et quotas

**Priorité :** Must Have

### User story
> En tant qu'admin, je veux affecter un plan tarifaire à chaque tenant et suivre son abonnement, afin de facturer correctement et d'appliquer les limites prévues au contrat.

### Contexte
Chaque transitaire souscrit à un plan (Starter, Pro, Enterprise…) avec des quotas associés : nombre de clients, nombre de colis traités par mois, volume de stockage, nombre d'utilisateurs internes. Sans gestion de plan, impossible de monétiser la plateforme ni d'éviter les abus.

### Critères d'acceptation

- [ ] Une bibliothèque de plans est gérable par l'admin : nom, prix, périodicité (mensuel/annuel), quotas (clients, colis/mois, stockage, utilisateurs)
- [ ] Chaque tenant est associé à un plan (avec un plan par défaut à la création de tenant — cf. US-A1.1)
- [ ] L'admin peut changer le plan d'un tenant à tout moment (upgrade/downgrade)
- [ ] Un downgrade est bloqué si l'usage actuel dépasse les quotas du nouveau plan, avec un message explicite
- [ ] La consommation actuelle vs quota est affichée sur la fiche tenant (jauge par ressource)
- [ ] Un statut d'abonnement est suivi : actif, en période d'essai, en impayé, expiré
- [ ] Lors d'un impayé constaté, l'admin peut déclencher la suspension automatique après X jours de retard (paramétrable)
- [ ] Un export comptable mensuel des facturations est disponible (CSV)

### Règles métier

- Un tenant créé sans plan explicite reçoit le plan "Starter" (ou équivalent par défaut)
- Le dépassement de quota n'entraîne **pas** de blocage automatique — il est signalé à l'admin et au tenant, qui peuvent décider d'un upgrade
- Les périodes d'essai ont une date de fin fixe et basculent automatiquement en "expiré" si aucun plan payant n'est affecté
- Un changement de plan en cours de période est facturé au prorata

### Cas limites

- Suppression d'un plan utilisé par au moins un tenant → bloquée tant qu'il existe des tenants associés
- Tenant sans abonnement actif depuis plus de 30 jours → notification proactive à l'admin
- Conflit entre quota théorique et usage réel (par ex. import massif) → l'usage réel prévaut, alerte affichée

### Dépendances

- US-A1.1 (le tenant reçoit un plan à la création)
- US-A1.2 (la suspension automatique pour impayé s'appuie sur cette US)
- Intégration éventuelle avec un service de facturation externe (Stripe, etc.)

---

## US-A1.6 — Gérer les comptes administrateurs internes

**Priorité :** Must Have

### User story
> En tant qu'admin principal, je veux pouvoir créer et gérer d'autres comptes administrateurs internes avec différents niveaux de permissions, afin de répartir les responsabilités au sein de l'équipe SaaS sans donner un accès total à tous.

### Contexte
À mesure que l'équipe interne grandit, certains membres ont besoin d'accéder à la console admin pour des tâches spécifiques (support client, comptabilité, monitoring) sans nécessairement disposer des droits critiques (suppression de tenant, modification de plans). Une gestion granulaire des rôles évite un super-admin unique (SPOF) et limite la surface de risque.

### Critères d'acceptation

- [ ] Un admin principal peut créer, modifier, désactiver d'autres comptes administrateurs
- [ ] Trois rôles minimum sont disponibles : `Super Admin` (tous droits), `Admin Support` (lecture + impersonification, pas de suspension/suppression), `Admin Comptable` (lecture des facturations + exports)
- [ ] Chaque action sensible (suppression, modification de plan, impersonification) est restreinte selon le rôle
- [ ] L'authentification des admins exige un second facteur (2FA obligatoire)
- [ ] Un admin désactivé voit ses sessions actives invalidées immédiatement
- [ ] La liste des admins affiche : nom, email, rôle, dernière connexion, statut (actif/désactivé)
- [ ] Un admin ne peut pas modifier ou supprimer son propre compte (évite l'auto-lockout)

### Règles métier

- Au moins un compte `Super Admin` actif doit exister à tout moment — la désactivation du dernier est bloquée
- Les admins ne sont **jamais** rattachés à un tenant : ils opèrent au niveau plateforme
- Toutes les connexions admin sont tracées dans le journal d'audit (cf. US-A1.7)
- Le 2FA ne peut pas être désactivé par l'utilisateur lui-même — uniquement réinitialisé par un autre Super Admin

### Cas limites

- Tentative de désactivation du dernier Super Admin → action bloquée avec message explicite
- Admin oubli de son 2FA → procédure de récupération via un autre Super Admin (jamais auto-réinitialisable)
- Admin tente une action hors de son périmètre (ex : Support tente une suppression) → action bloquée + log de tentative

### Dépendances

- US-A1.7 (toutes les actions admin doivent être auditées)
- Service d'authentification avec support 2FA

---

## US-A1.7 — Consulter le journal d'audit

**Priorité :** Must Have

### User story
> En tant qu'admin, je veux consulter un journal exhaustif des actions effectuées sur la plateforme, afin de garantir la traçabilité, répondre aux exigences RGPD et investiguer en cas d'incident.

### Contexte
La traçabilité est une exigence légale (RGPD, devoir de conservation) et opérationnelle (post-mortem, fraude, support). Toute action sensible — création, modification, suppression, connexion, impersonification — doit être consultable et exportable.

### Critères d'acceptation

- [ ] Un journal centralise toutes les actions sensibles : création/modification/suppression de tenants, suspensions, changements de plan, modifications de comptes admin, impersonifications, exports de données
- [ ] Chaque entrée affiche : date/heure, acteur (admin), action, cible (tenant ou ressource), métadonnées (IP, user-agent, motif si renseigné)
- [ ] Des filtres sont disponibles : par acteur, par type d'action, par tenant cible, par plage de dates
- [ ] Une recherche textuelle libre est possible
- [ ] Un export CSV/JSON du journal filtré est proposé
- [ ] Les sessions d'impersonification affichent en plus : durée, ressources consultées (résumé)
- [ ] Le journal est en lecture seule — aucune modification/suppression d'entrée possible depuis l'interface

### Règles métier

- Les entrées du journal sont conservées **2 ans minimum** (durée légale RGPD pour les logs d'accès)
- Aucun admin, même Super Admin, ne peut altérer le journal depuis l'interface
- Une rotation/archivage automatique est prévu pour limiter la taille (archives froides après 6 mois)
- Les données personnelles dans le journal (email, IP) suivent les politiques de purge RGPD

### Cas limites

- Volume très important (>1M entrées) → pagination + filtres performants, recherche indexée
- Tenant supprimé → ses entrées de journal restent consultables (archivées avec ID figé)
- Demande RGPD de suppression d'un acteur → anonymisation (remplacement par identifiant opaque) plutôt que suppression

### Dépendances

- Toutes les US qui génèrent des événements (A1.1, A1.2, A1.3, A1.4, A1.5, A1.6, A1.8, A1.9)
- Infrastructure de logging persistant et requêtable

---

## US-A1.8 — Renvoyer ou régénérer un lien d'activation

**Priorité :** Should Have

### User story
> En tant qu'admin, je veux pouvoir renvoyer ou régénérer le lien d'activation d'un tenant, afin de débloquer un onboarding lorsque le lien initial a expiré, été perdu, ou si l'email n'a pas été reçu.

### Contexte
Le lien d'activation envoyé à la création d'un tenant (US-A1.1) a une validité de 72h. Il arrive régulièrement qu'un administrateur entreprise active son compte trop tard, perde l'email, ou ne le reçoive jamais (spam, faute de frappe). Sans une action simple côté admin, le tenant reste inutilisable jusqu'à intervention technique.

### Critères d'acceptation

- [ ] Depuis la fiche détail d'un tenant non encore activé, un bouton "Renvoyer le lien d'activation" est visible
- [ ] L'admin peut, en option, modifier l'email destinataire avant le renvoi (en cas de faute de frappe)
- [ ] Un nouveau lien valide 72h est généré, l'ancien est immédiatement invalidé
- [ ] Le renvoi est tracé dans le journal d'audit (cf. US-A1.7)
- [ ] Si le tenant est déjà activé, le bouton est remplacé par "Tenant activé le [date]" (action désactivée)
- [ ] Un compteur affiche le nombre de renvois effectués (visibilité anti-abus)

### Règles métier

- Un seul lien d'activation est valide à la fois — chaque renvoi invalide le précédent
- Le renvoi ne réinitialise pas l'activation du tenant : il prolonge uniquement la fenêtre d'activation
- Au-delà de 5 renvois pour un même tenant, une alerte est levée auprès des autres admins (potentiel problème de configuration)

### Cas limites

- Email de destination invalide → erreur d'envoi remontée à l'admin, lien tout de même généré (consultable manuellement)
- Tenant suspendu avant activation → le renvoi est bloqué (suspendre d'abord, réactiver, puis renvoyer)
- Renvoi sur un tenant supprimé → action indisponible

### Dépendances

- US-A1.1 (lien d'activation initial)
- US-A1.7 (traçabilité)
- Service d'envoi d'email transactionnel

---

## US-A1.9 — Communication globale aux tenants

**Priorité :** Could Have

### User story
> En tant qu'admin, je veux pouvoir diffuser des annonces aux administrateurs des tenants (maintenance planifiée, nouveautés, alertes), afin de communiquer efficacement sans dépendre d'un canal externe (email manuel, support).

### Contexte
La plateforme évolue (nouvelles fonctionnalités, maintenances, changements de conditions). L'admin a besoin d'un canal direct, traçable et ciblable pour informer ses tenants — soit globalement, soit par segment (par plan, par pays, par statut).

### Critères d'acceptation

- [ ] L'admin peut composer une annonce avec : titre, contenu (rich text), niveau (info, avertissement, critique), date de début et fin d'affichage
- [ ] L'annonce peut cibler : tous les tenants, un sous-ensemble par filtre (plan, pays, statut), ou des tenants spécifiquement sélectionnés
- [ ] L'annonce est diffusée selon deux canaux configurables : bandeau dans l'interface tenant, et/ou email aux administrateurs entreprise
- [ ] L'admin peut planifier une annonce future (publication différée)
- [ ] Une annonce active peut être éditée ou retirée avant sa date de fin
- [ ] L'historique des annonces est consultable, avec statistiques (nb destinataires, nb vues, nb clics si lien inclus)

### Règles métier

- Les annonces de niveau "critique" forcent l'affichage en pleine page tant qu'elles ne sont pas accusées de réception
- Une annonce ne peut pas dépasser 90 jours d'affichage continu (force le renouvellement / archivage)
- Les emails d'annonce respectent les préférences de notification du destinataire (sauf annonces "critiques" qui passent outre)
- Les annonces sont historisées dans le journal d'audit (cf. US-A1.7)

### Cas limites

- Annonce ciblée sur 0 tenant (filtres trop restrictifs) → confirmation explicite avant envoi
- Tenant suspendu dans la cible → exclu automatiquement
- Annonce critique simultanée à une autre annonce critique → la plus récente prend la priorité d'affichage

### Dépendances

- US-A1.3 (segmentation par plan/pays/statut nécessite les données du dashboard)
- US-A1.7 (traçabilité)
- Service d'envoi d'email transactionnel
