# 📦 SaaS Suivi de Colis — Documentation User Stories

> Plateforme multi-tenant en marque blanche pour transitaires  
> Version : 1.0 — Mai 2026

---

## Contexte général

Cette plateforme SaaS permet à des **transitaires** (entreprises de transport et de logistique internationale) de proposer à leurs clients un espace de suivi de colis personnalisé sous leur propre marque.

Chaque transitaire dispose d'un **sous-domaine dédié** (ex. `monentreprise.trackapp.com`) avec son logo, ses statuts métier personnalisés et ses propres clients. La plateforme est entièrement invisible pour les clients finaux — c'est la marque du transitaire qui est mise en avant.

---

## Architecture des rôles

| Rôle | Qui ? | Périmètre |
|------|-------|-----------|
| **Admin** | L'équipe interne SaaS | Gestion globale de tous les tenants |
| **Entreprise** | Le transitaire (son équipe opérationnelle) | Gestion de son espace, clients, colis |
| **Client** | Le client final du transitaire | Suivi de ses propres colis |

---

## Structure de la documentation

```
user-stories/
├── README.md                          ← Ce fichier (index et contexte)
├── US-ADMIN.md                        ← Épics et US du rôle Admin
├── US-ENTREPRISE-marqueblanche.md     ← Épic E1 : Personnalisation
├── US-ENTREPRISE-colis.md             ← Épic E2 : Gestion des statuts
├── US-ENTREPRISE-clients.md           ← Épic E3 : Gestion des clients
├── US-CLIENT-auth.md                  ← Épic C1 : Authentification
├── US-CLIENT-suivi.md                 ← Épic C2 & C3 : Suivi et historique
└── US-CLIENT-notifications.md         ← Épic C4 : Notifications
```

---

## Résumé des épics

| ID | Rôle | Épic | Nb US |
|----|------|------|-------|
| A1 | Admin | Gestion des tenants | 9 |
| E1 | Entreprise | Marque blanche | 3 |
| E2 | Entreprise | Gestion des statuts colis | 3 |
| E3 | Entreprise | Gestion des clients | 3 |
| C1 | Client | Authentification | 3 |
| C2 | Client | Suivi de colis | 3 |
| C3 | Client | Historique | 2 |
| C4 | Client | Notifications | 2 |
| **Total** | | | **28 US** |

---

## 📊 État d'avancement (mis à jour : 2026-06-21)

> Synthèse issue d'un audit code ↔ critères d'acceptation. ✅ Fait · 🟡 Partiel · 🔴 À faire.
> **4 ✅ · 16 🟡 · 8 🔴** sur 28 US.

| US | Titre | Priorité | Statut |
|----|-------|----------|--------|
| A1.1 | Créer un tenant | Must | 🟡 Email 72h OK, logo par défaut manquant |
| A1.2 | Suspendre / supprimer un tenant | Must | 🟡 OK sauf email de notification de suspension |
| A1.3 | Tableau de bord global | Should | ✅ |
| A1.4 | Modifier un tenant | Must | 🟡 Logo non éditable, notif email changement manquante |
| A1.5 | Plans / abonnements / quotas | Must | 🔴 Non démarré |
| A1.6 | Comptes admins internes | Must | 🟡 3ᵉ rôle + 2FA manquants |
| A1.7 | Journal d'audit | Must | 🟡 OK sauf IP/UA et détail impersonification |
| A1.8 | Renvoyer le lien d'activation | Should | 🔴 Non démarré |
| A1.9 | Communication globale aux tenants | Could | 🔴 Non démarré |
| E1.1 | Logo | Must | 🟡 Validation dimensions + logo emails manquants |
| E1.2 | Couleurs | Should | 🟡 Contraste WCAG + palette manquants |
| E1.3 | Thèmes | Must | 🟡 Historique/retour arrière non exposés en UI |
| E2.1 | Statuts personnalisés | Must | 🟡 Icônes, warning, drag&drop manquants |
| E2.2 | Mettre à jour le statut | Must | 🟡 OK (notif incluse), dropdown sans couleur/icône |
| E2.3 | Créer un colis | Must | 🟡 OK sauf notification "nouveau colis" |
| E3.1 | Liste des clients | Must | 🔴 Non démarré |
| E3.2 | Créer un compte client | Must | 🔴 Non démarré (clients via auto-inscription seulement) |
| E3.3 | Désactiver / supprimer un client | Should | 🔴 Logique bas niveau partielle, pas d'UI |
| C1.1 | Connexion client | Must | 🟡 OAuth en bonus, rate-limiting manquant |
| C1.2 | Réinitialiser le mot de passe | Must | ✅ |
| C1.3 | Inscription + activation | Must | 🟡 OK sauf notification transitaire |
| C2.1 | Ajouter un n° de colis | Should | 🟡 OK sauf notif transitaire (n° inconnu) |
| C2.2 | Timeline de suivi | Must | ✅ |
| C2.3 | Estimation de prix | Should | 🔴 Donnée non affichée côté client |
| C3.1 | Historique des colis | Must | ✅ |
| C3.2 | Export CSV | Could | 🔴 Non démarré |
| C4.1 | Email changement de statut | Must | 🟡 OK sauf réactivation depuis réglages |
| C4.2 | Notifications in-app | Should | 🟡 OK sauf rétention 90j + colis supprimé |

> **Fonctionnalités hors périmètre US initial déjà livrées** : OAuth Google/Facebook (admin + client), PWA (manifeste dynamique par tenant, installateur), pages légales publiques (CGU, confidentialité, suppression de données), gestion des membres internes du tenant (invitations), modes de transport, traductions i18n (EN/FR/ZH) + auto-traduction, landing marketing Hervia, scan de colis, refresh temps réel (Supabase Realtime) sur les listes admin et client.

---

## Glossaire

| Terme | Définition |
|-------|------------|
| **Tenant** | Instance isolée de la plateforme attribuée à un transitaire |
| **Sous-domaine** | URL dédiée du transitaire (ex. `transit-express.trackapp.com`) |
| **Transitaire** | Entreprise gérant le transport et la logistique internationale de marchandises |
| **Colis** | Expédition suivie identifiée par un numéro de tracking unique |
| **Statut** | Étape dans le cycle de vie d'un colis (ex. "En transit", "En dédouanement") |
| **Marque blanche** | Personnalisation de l'interface pour afficher la marque du transitaire |
| **Estimation de prix** | Montant indicatif (non contractuel) communiqué par le transitaire au client |

---

## Conventions de rédaction

Les user stories suivent le format :

> **En tant que** [rôle], **je veux** [action], **afin de** [bénéfice métier].

Chaque US comprend :
- Un **identifiant unique** (ex. `US-A1.1`)
- Une **priorité** (Must Have / Should Have / Could Have / Won't Have — MoSCoW)
- Des **critères d'acceptation** testables
- Des **règles métier** spécifiques
- Des **cas limites** à gérer
- Des **dépendances** avec d'autres US
