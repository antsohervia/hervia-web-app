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
| A1 | Admin | Gestion des tenants | 3 |
| E1 | Entreprise | Marque blanche | 2 |
| E2 | Entreprise | Gestion des statuts colis | 3 |
| E3 | Entreprise | Gestion des clients | 3 |
| C1 | Client | Authentification | 2 |
| C2 | Client | Suivi de colis | 3 |
| C3 | Client | Historique | 2 |
| C4 | Client | Notifications | 2 |
| **Total** | | | **20 US** |

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
