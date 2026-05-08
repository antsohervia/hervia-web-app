# 👥 Rôle Client — Épic C1 : Authentification et accès

> **Rôle concerné :** Client (client final du transitaire)  
> **Épic :** C1 — Authentification et gestion de l'accès à l'espace client

---

## Contexte métier

Le client final est un importateur ou exportateur qui a confié des marchandises à un transitaire. Il accède à la plateforme via le sous-domaine dédié de son transitaire (ex. `transit-express.trackapp.com`). Il ne sait pas — et n'a pas besoin de savoir — qu'il utilise une plateforme SaaS tierce.

L'expérience d'authentification doit être simple, rassurante, et porter la marque du transitaire. La sécurité est un prérequis : les données logistiques (descriptions de marchandises, volumes, valeurs estimées) sont sensibles commercialement.

**Enjeux :**
- Offrir une connexion simple et sans friction pour des clients qui ne sont pas nécessairement à l'aise avec le numérique
- Garantir la sécurité et l'isolation des données (un client ne peut jamais voir les colis d'un autre client)
- Permettre au client de récupérer l'accès en cas d'oubli de mot de passe, de manière autonome

---

## US-C1.1 — Se connecter à son espace client

**Priorité :** Must Have

### User story
> En tant que client, je veux me connecter à mon espace personnel via l'adresse de mon transitaire avec mon email et mon mot de passe, afin d'accéder de manière sécurisée à mes informations de suivi.

### Contexte
La page de connexion est le premier contact visuel du client avec la plateforme. Elle doit afficher le logo et les couleurs du transitaire pour rassurer le client qu'il est au bon endroit. La connexion se fait avec l'email et le mot de passe définis lors de la création de compte.

### Critères d'acceptation

- [ ] La page de connexion (`[sous-domaine].trackapp.com/login`) affiche : le logo du transitaire, un titre de bienvenue avec le nom du transitaire, un formulaire email + mot de passe
- [ ] La connexion est validée côté serveur — un token de session est émis en cas de succès
- [ ] En cas d'échec (mauvais identifiants) : un message d'erreur générique est affiché ("Email ou mot de passe incorrect") sans préciser lequel est faux
- [ ] Après 5 tentatives échouées consécutives sur le même compte, le compte est temporairement bloqué pendant 15 minutes
- [ ] Après connexion réussie, le client est redirigé vers son tableau de bord (liste de ses colis)
- [ ] Une case "Se souvenir de moi" permet de maintenir la session 30 jours (sans cette case : session expire après fermeture du navigateur)
- [ ] La page est responsive et utilisable sur mobile (écran 320px minimum)
- [ ] La connexion fonctionne sur les navigateurs modernes : Chrome, Firefox, Safari, Edge (2 dernières versions majeures)

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

- US-E3.2 (le compte client doit avoir été créé par le transitaire)
- US-E1.1 / US-E1.2 (la marque blanche doit être configurée pour l'affichage)

---

## US-C1.2 — Réinitialiser son mot de passe

**Priorité :** Must Have

### User story
> En tant que client, je veux pouvoir réinitialiser mon mot de passe de manière autonome depuis la page de connexion, afin de retrouver l'accès à mon espace sans avoir à contacter mon transitaire.

### Contexte
Les clients reçoivent un mot de passe temporaire lors de la création de leur compte. Beaucoup oublient de le changer ou l'oublient après une période d'inactivité. Un processus de réinitialisation autonome est indispensable pour ne pas surcharger le service client du transitaire.

### Critères d'acceptation

- [ ] Un lien "Mot de passe oublié ?" est disponible sur la page de connexion
- [ ] En cliquant, le client est invité à saisir son adresse email
- [ ] Si l'email existe dans le tenant, un email de réinitialisation est envoyé dans les 2 minutes
- [ ] Si l'email n'existe pas, la même confirmation est affichée (sécurité : ne pas révéler les emails existants)
- [ ] L'email de réinitialisation contient un lien unique valable 1 heure, avec le logo du transitaire
- [ ] Le lien mène vers un formulaire de saisie du nouveau mot de passe (2 champs : nouveau mdp + confirmation)
- [ ] Le nouveau mot de passe doit respecter : minimum 8 caractères, au moins 1 chiffre, au moins 1 lettre
- [ ] Après changement réussi, le client est automatiquement connecté et redirigé vers son tableau de bord
- [ ] L'ancien mot de passe est invalidé immédiatement après la réinitialisation

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
