# 👥 Rôle Client — Épic C1 : Authentification et accès

> **Rôle concerné :** Client (client final du transitaire)  
> **Épic :** C1 — Authentification et gestion de l'accès à l'espace client

> **Légende statut** (mise à jour : 2026-06-21) :
> ✅ Fait · 🟡 Partiel · 🔴 À faire — `- [x]` critère couvert par le code, `- [ ]` non couvert, `⚠️ partiel` derrière une case = comportement principal présent mais incomplet.

---

## Contexte métier

Le client final est un importateur ou exportateur qui a confié des marchandises à un transitaire. Il accède à la plateforme via le sous-domaine dédié de son transitaire (ex. `transit-express.trackapp.com`). Il ne sait pas — et n'a pas besoin de savoir — qu'il utilise une plateforme SaaS tierce.

L'expérience d'authentification doit être simple, rassurante, et porter la marque du transitaire. La sécurité est un prérequis : les données logistiques (descriptions de marchandises, volumes, valeurs estimées) sont sensibles commercialement.

**Enjeux :**
- Offrir une connexion simple et sans friction pour des clients qui ne sont pas nécessairement à l'aise avec le numérique
- Permettre au client de créer son compte de manière autonome depuis le sous-domaine de son transitaire et d'accéder immédiatement à son espace après activation par email
- Garantir la sécurité et l'isolation des données (un client ne peut jamais voir les colis d'un autre client)
- Permettre au client de récupérer l'accès en cas d'oubli de mot de passe, de manière autonome

---

## US-C1.1 — Se connecter à son espace client

**Priorité :** Must Have  
**Statut :** 🟡 Partiel — connexion email/mdp + OAuth Google/Facebook opérationnels ; il manque le blocage anti-bruteforce applicatif.

### User story
> En tant que client, je veux me connecter à mon espace personnel via l'adresse de mon transitaire avec mon email et mon mot de passe, afin d'accéder de manière sécurisée à mes informations de suivi.

### Contexte
La page de connexion est le premier contact visuel du client avec la plateforme. Elle doit afficher le logo et les couleurs du transitaire pour rassurer le client qu'il est au bon endroit. La connexion se fait avec l'email et le mot de passe définis lors de l'auto-inscription (US-C1.3) ou reçus à la création du compte par le transitaire (US-E3.2).

### Critères d'acceptation

- [x] La page de connexion (`[sous-domaine].trackapp.com/login`) affiche : le logo du transitaire, un titre de bienvenue avec le nom du transitaire, un formulaire email + mot de passe, un lien "Créer un compte" (vers le formulaire d'auto-inscription — US-C1.3) et un lien "Mot de passe oublié ?"
- [x] La connexion est validée côté serveur — un token de session est émis en cas de succès
- [x] En cas d'échec (mauvais identifiants) : un message d'erreur générique est affiché ("Email ou mot de passe incorrect") sans préciser lequel est faux
- [ ] Après 5 tentatives échouées consécutives sur le même compte, le compte est temporairement bloqué pendant 15 minutes _(❌ pas de rate-limiting applicatif ; repose uniquement sur les limites natives Supabase)_
- [x] Après connexion réussie, le client est redirigé vers son tableau de bord (liste de ses colis)
- [x] Une case "Se souvenir de moi" permet de maintenir la session 30 jours (sans cette case : session expire après fermeture du navigateur)
- [x] La page est responsive et utilisable sur mobile (écran 320px minimum)
- [x] La connexion fonctionne sur les navigateurs modernes : Chrome, Firefox, Safari, Edge (2 dernières versions majeures)
- [x] _(bonus, hors critères initiaux)_ Connexion via OAuth Google et Facebook avec auto-inscription du client

### Règles métier

- Le message d'erreur est volontairement générique pour ne pas aider un attaquant à distinguer un email existant d'un mot de passe incorrect
- Le blocage temporaire (15 min) est basé sur le compte ciblé, pas sur l'IP (pour gérer les IP partagées)
- La session est liée au tenant : un token émis pour `transit-express.trackapp.com` n'est pas valide sur `autre-transitaire.trackapp.com`
- Si le client tente d'accéder directement à une URL protégée sans être connecté, il est redirigé vers la page de connexion puis vers l'URL initiale après connexion

### Cas limites

- Compte désactivé par le transitaire → message spécifique : "Votre compte est temporairement désactivé. Contactez [nom du transitaire] pour plus d'informations."
- Client accédant au mauvais sous-domaine (ex. il est client de Transit A mais accède au sous-domaine de Transit B) → la connexion échoue normalement (son email n'existe pas dans ce tenant)
- Navigateur avec cookies désactivés → message d'avertissement invitant à activer les cookies

### Dépendances

- Le compte client doit exister, soit via auto-inscription (US-C1.3), soit via création par le transitaire (US-E3.2)
- US-E1.1 / US-E1.2 (la marque blanche doit être configurée pour l'affichage)

---

## US-C1.2 — Réinitialiser son mot de passe

**Priorité :** Must Have  
**Statut :** ✅ Fait — flux complet (demande générique, lien à durée limitée, nouveau mot de passe, auto-connexion).

### User story
> En tant que client, je veux pouvoir réinitialiser mon mot de passe de manière autonome depuis la page de connexion, afin de retrouver l'accès à mon espace sans avoir à contacter mon transitaire.

### Contexte
Que le client ait choisi son mot de passe lors de l'auto-inscription (US-C1.3) ou reçu un mot de passe temporaire à la création de son compte par le transitaire (US-E3.2), il peut l'oublier après une période d'inactivité. Un processus de réinitialisation autonome est indispensable pour ne pas surcharger le service client du transitaire.

### Critères d'acceptation

- [x] Un lien "Mot de passe oublié ?" est disponible sur la page de connexion
- [x] En cliquant, le client est invité à saisir son adresse email
- [x] Si l'email existe dans le tenant, un email de réinitialisation est envoyé dans les 2 minutes
- [x] Si l'email n'existe pas, la même confirmation est affichée (sécurité : ne pas révéler les emails existants)
- [x] L'email de réinitialisation contient un lien unique valable 1 heure, avec le logo du transitaire
- [x] Le lien mène vers un formulaire de saisie du nouveau mot de passe (2 champs : nouveau mdp + confirmation)
- [x] Le nouveau mot de passe doit respecter : minimum 8 caractères, au moins 1 chiffre, au moins 1 lettre
- [x] Après changement réussi, le client est automatiquement connecté et redirigé vers son tableau de bord
- [x] L'ancien mot de passe est invalidé immédiatement après la réinitialisation

### Règles métier

- Un lien de réinitialisation ne peut être utilisé qu'une seule fois (même avant expiration)
- Si plusieurs demandes de réinitialisation sont faites, seul le dernier lien envoyé est valide
- L'email de réinitialisation porte la marque blanche du transitaire (logo, couleur)
- Le transitaire peut également réinitialiser le mot de passe d'un client depuis son espace d'administration (génère un nouveau mot de passe temporaire et envoie un email au client)

### Cas limites

- Lien de réinitialisation expiré (> 1h) → page d'erreur claire avec lien pour en demander un nouveau
- Lien déjà utilisé → page d'erreur claire avec lien pour en demander un nouveau
- Nouveau mot de passe identique à l'ancien → accepté (pas de contrainte d'historique en V1)
- Email de réinitialisation non reçu → inviter à vérifier les spams ; le transitaire peut aussi réinitialiser depuis son côté

### Dépendances

- US-C1.1 (fait partie du même flux d'authentification)
- US-E1.1 (le logo du transitaire doit être configuré pour les emails)

---

## US-C1.3 — S'inscrire et activer son compte

**Priorité :** Must Have  
**Statut :** 🟡 Partiel — auto-inscription + activation email + auto-connexion en place ; la notification du transitaire à l'activation reste à faire.

### User story
> En tant qu'importateur ou exportateur, je veux pouvoir créer moi-même mon compte client depuis le sous-domaine de mon transitaire et y accéder immédiatement après activation par email, afin de ne pas dépendre du transitaire pour démarrer le suivi de mes marchandises.

### Contexte
Pour fluidifier l'enrôlement, le client peut s'inscrire de manière autonome depuis la page de connexion du sous-domaine de son transitaire. Une fois le formulaire soumis, un email d'activation lui est envoyé. Dès qu'il clique sur le lien d'activation, son compte est actif et il accède directement à son espace client (auto-connexion). Cela évite la friction d'un appel ou email au transitaire pour obtenir un accès, tout en préservant la sécurité par la vérification de l'adresse email.

### Critères d'acceptation

- [x] Un lien "Créer un compte" est disponible depuis la page de connexion (`[sous-domaine].trackapp.com/login`) et redirige vers `[sous-domaine].trackapp.com/signup`
- [x] La page d'inscription affiche le logo, les couleurs et le nom du transitaire (marque blanche)
- [x] Le formulaire demande : prénom + nom (ou raison sociale), adresse email, mot de passe + confirmation, rôle (importateur / exportateur), case "j'accepte les CGU"
- [x] Champs optionnels : numéro de téléphone (international), nom de la société
- [x] Le mot de passe choisi doit respecter : minimum 8 caractères, au moins 1 chiffre, au moins 1 lettre (mêmes règles que US-C1.2)
- [x] L'email est vérifié pour l'unicité dans le tenant (un email ne peut pas déjà être associé à un client du même transitaire)
- [x] À la soumission du formulaire, le compte est créé en statut `pending_activation` (non connectable)
- [x] Un email d'activation est envoyé dans les 2 minutes, avec le logo et le nom du transitaire, et un lien d'activation unique valable 24 heures
- [x] Au clic sur le lien d'activation, le compte passe en statut `active`, le client est automatiquement connecté et redirigé vers son tableau de bord (espace client)
- [ ] Une notification (in-app + email récapitulatif) est envoyée au transitaire pour qu'il puisse rapprocher le compte de ses dossiers _(❌ pas encore déclenchée à l'activation)_
- [x] La page d'inscription est responsive et utilisable sur mobile (écran 320px minimum)

### Règles métier

- L'inscription se fait toujours dans le contexte d'un tenant : un compte est lié à un transitaire ; un client qui veut accéder à plusieurs transitaires doit créer un compte sur chaque sous-domaine
- Un compte non activé après 24 heures peut être recréé avec le même email — le compte précédent (`pending_activation`) est invalidé et remplacé
- Le compte créé par auto-inscription est marqué comme tel dans la fiche client côté transitaire (badge "Auto-inscrit") pour le distinguer des comptes créés manuellement (US-E3.2)
- Aucun changement de mot de passe n'est forcé après activation : le client a déjà choisi son mot de passe à l'inscription
- L'email d'activation porte la marque blanche du transitaire (logo, couleur, nom)
- L'auto-inscription pourra être désactivée par le transitaire depuis son espace d'administration en V2 — par défaut, elle est activée pour tous les tenants

### Cas limites

- Email déjà utilisé dans le tenant (compte existant, actif ou non) → la confirmation à l'écran reste générique ("Si cette adresse n'est pas déjà inscrite, vous recevrez un email d'activation"), et un email d'information est envoyé à l'adresse pour signaler la tentative (sécurité : ne pas révéler l'existence du compte)
- Lien d'activation expiré (> 24h) → page d'erreur claire avec un bouton "Renvoyer un email d'activation"
- Lien d'activation déjà utilisé → page d'erreur claire qui invite à se connecter directement
- Tentative d'inscription avec un email déjà utilisé chez un autre tenant → autorisée (les tenants sont isolés)
- Échec de l'envoi de l'email d'activation → message d'erreur invitant à réessayer ; le compte `pending_activation` est purgé si aucun email n'a pu partir
- CGU non cochées → soumission bloquée avec message d'erreur sur la case
- Mot de passe trop faible → validation en temps réel sur le champ avec indication des règles non respectées

### Dépendances

- US-E1.1 / US-E1.2 (la marque blanche doit être configurée pour la page d'inscription et l'email d'activation)
- Conditionne US-C1.1 (un compte auto-inscrit peut ensuite se reconnecter normalement)
