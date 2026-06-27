# 🏢 Rôle Entreprise — Épic E1 : Marque blanche & Personnalisation de l'apparence

> **Rôle concerné :** Entreprise (le transitaire)  
> **Épic :** E1 — Personnalisation complète de l'interface marque blanche

> **Légende statut** (mise à jour : 2026-06-21) :
> ✅ Fait · 🟡 Partiel · 🔴 À faire — `- [x]` critère couvert par le code, `- [ ]` non couvert.

---

## Contexte métier

Le transitaire achète la plateforme SaaS comme un outil en marque blanche : ses clients finaux ne doivent jamais savoir qu'il utilise une solution tierce. L'identité visuelle du transitaire doit être présente partout où le client interagit avec la plateforme.

La personnalisation est gérée depuis un **studio de design intégré** accessible depuis l'espace d'administration (`[sous-domaine].trackapp.com/admin/apparence`). Toutes les modifications sont prévisualisées en temps réel sur un aperçu de l'espace client avant d'être publiées. Les changements publiés sont appliqués immédiatement pour tous les clients connectés.

**Enjeux :**
- Renforcer la crédibilité et la confiance du client final envers le transitaire
- Permettre une cohérence de marque totale sans intervention technique ni développeur
- Garantir que la plateforme SaaS reste invisible pour les clients finaux
- Offrir suffisamment de flexibilité pour satisfaire des chartes graphiques très différentes

---

## Vue d'ensemble des US de cet épic

| ID | Titre | Priorité |
|----|-------|----------|
| US-E1.1 | Uploader et modifier le logo | Must Have |
| US-E1.2 | Personnaliser les couleurs de l'interface | Should Have |
| US-E1.3 | Choisir et appliquer un thème d'apparence | Must Have |

---

## US-E1.1 — Uploader et modifier le logo de l'application

**Priorité :** Must Have  
**Statut :** 🟡 Partiel — upload/réinitialisation + aperçu clair-sombre fonctionnels ; validation des dimensions et logo dans les emails manquants.

### User story
> En tant que transitaire, je veux pouvoir uploader mon logo depuis mon espace d'administration, afin que mes clients voient uniquement ma marque lorsqu'ils utilisent la plateforme de suivi.

### Contexte
Dès l'activation de leur espace, les transitaires disposent d'un logo générique. La première action attendue lors de l'onboarding est de le remplacer par leur propre logo. Ce logo apparaît sur la page de connexion des clients, dans le header de l'espace client, dans les emails de notification, et dans les éventuelles impressions de récapitulatifs.

### Critères d'acceptation

- [x] Un bouton "Modifier le logo" est accessible depuis les paramètres de l'espace entreprise
- [x] Les formats acceptés sont : PNG, JPG, SVG — taille maximale 2 Mo
- [x] Un aperçu en temps réel est affiché avant confirmation, montrant le rendu sur fond clair ET fond sombre
- [ ] Le logo est validé : largeur minimale 100px, hauteur minimale 40px recommandée _(❌ seule la taille fichier 2 Mo est validée, pas les dimensions en pixels)_
- [x] Après upload et confirmation, le logo est immédiatement visible sur l'espace client
- [ ] Le logo apparaît dans les emails de notification envoyés aux clients _(⚠️ partiel : le logo n'est pas injecté dans le payload des notifications)_
- [x] Un bouton "Réinitialiser" permet de revenir au logo par défaut
- [x] L'aperçu du logo est affiché dans le contexte du thème actif (voir US-E1.3)

### Règles métier

- Le logo ne peut pas dépasser 2 Mo pour garantir des temps de chargement acceptables
- Si le logo uploadé a un fond transparent (PNG/SVG), il est utilisé tel quel
- Si le logo uploadé a un fond blanc ou coloré (JPG), il est affiché avec son fond
- Le logo est redimensionné automatiquement pour l'affichage dans le header (max 180px de largeur, hauteur proportionnelle)

### Cas limites

- Fichier trop lourd (> 2 Mo) → message d'erreur explicite avec la taille actuelle du fichier
- Format non supporté (ex. GIF, PDF) → message d'erreur listant les formats acceptés
- Image trop petite (< 100px) → avertissement avec possibilité de continuer quand même
- Perte de connexion pendant l'upload → message d'erreur, possibilité de réessayer

### Dépendances

- US-A1.1 (le tenant doit exister)
- US-E1.3 (le rendu du logo dépend du thème actif)
- Affecte l'affichage de US-C1.1 (page de connexion client) et toutes les US client

---

## US-E1.2 — Personnaliser les couleurs de l'interface

**Priorité :** Should Have  
**Statut :** 🟡 Partiel — sélecteurs couleur + HEX + aperçu live + application immédiate ; contrôle de contraste WCAG et palette prédéfinie manquants.

### User story
> En tant que transitaire, je veux pouvoir définir ma couleur de marque principale et une couleur secondaire, afin que l'ensemble de l'interface reflète exactement ma charte graphique.

### Contexte
Au-delà du logo et du thème structurel, chaque transitaire a une couleur de marque spécifique. Cette couleur est appliquée sur tous les éléments interactifs de l'espace client : boutons, liens, badges de statut actif, barre de progression. Elle complète le thème choisi en US-E1.3 sans l'écraser — le thème définit la structure, la couleur de marque teinte les éléments d'action.

### Critères d'acceptation

- [x] Deux sélecteurs de couleur sont disponibles : couleur principale (obligatoire) et couleur secondaire (optionnelle)
- [x] Chaque sélecteur propose un color picker visuel ET un champ de saisie HEX
- [x] Un aperçu en temps réel montre l'application des couleurs sur les composants principaux : bouton CTA, badge de statut, barre de progression, lien, header de navigation
- [ ] Le système vérifie le contraste minimum WCAG AA (ratio 4.5:1) entre la couleur choisie et le texte superposé (blanc ou noir selon la luminosité) _(❌ seul un calcul de luminance binaire existe, pas de ratio WCAG)_
- [ ] Si le contraste est insuffisant, un avertissement est affiché avec la valeur de contraste calculée et une suggestion de couleur corrigée
- [x] Les couleurs sont appliquées sur l'espace client immédiatement après sauvegarde
- [ ] Une palette de couleurs prédéfinies est proposée en raccourci (12 couleurs courantes)
- [x] Une couleur par défaut est utilisée si aucune personnalisation n'est faite (bleu #1A56DB)

### Règles métier

- La couleur principale est appliquée sur : boutons primaires, liens, indicateur de statut actif, barre de progression, bordures d'accent
- La couleur secondaire (si définie) est appliquée sur : badges secondaires, hover des éléments, fond du header selon le thème
- Les couleurs de personnalisation s'appliquent par-dessus le thème actif (US-E1.3)
- Les emails de notification utilisent la couleur principale

### Cas limites

- Couleur principale et secondaire identiques → avertissement visuel (déconseillé mais autorisé)
- Contraste insuffisant → avertissement mais le transitaire peut forcer le choix
- Saisie HEX invalide → champ en erreur avec indication du format attendu (#RRGGBB)
- Couleur très proche du blanc ou du noir → avertissement sur la lisibilité globale

### Dépendances

- US-E1.3 (les couleurs s'appliquent dans le contexte du thème actif)
- US-E1.1 (l'aperçu du logo tient compte des couleurs choisies)

---

## US-E1.3 — Choisir et appliquer un thème d'apparence

**Priorité :** Must Have

### User story
**Statut :** 🟡 Partiel — sélection/aperçu/publication des 3 thèmes opérationnels ; l'historique des publications et le retour arrière ne sont pas exposés dans l'UI.

> En tant que transitaire, je veux choisir parmi trois thèmes visuels prédéfinis pour mon application client — Clair, Sombre, ou Professionnel — afin de donner à mon espace une identité visuelle cohérente avec l'image de mon entreprise, sans avoir besoin de compétences techniques.

### Contexte

La personnalisation du thème est la fonctionnalité structurante de la marque blanche. Un transitaire dont la communication est sobre et corporate préférera un thème neutre et épuré. Un transitaire moderne et digital optera pour un thème sombre plus contemporain. Un transitaire classique ou institutionnel choisira le thème Professionnel, sérieux et élégant.

Les trois thèmes couvrent les grandes familles d'identités visuelles rencontrées dans le secteur du transit et de la logistique. Ils sont conçus pour être **immédiatement présentables** sans aucune personnalisation supplémentaire, tout en servant de base pour les couleurs de marque définies en US-E1.2.

---

### Description des trois thèmes

#### 🌕 Thème 1 — Clair (`light`)
> Interface lumineuse, fond blanc, typographie sombre. Approche classique et universelle, idéale pour des clients peu habitués aux interfaces numériques. Lisibilité maximale, ton rassurant et familier.

| Élément | Apparence |
|---------|-----------|
| Fond principal | Blanc `#FFFFFF` |
| Fond des cartes/sections | Gris très clair `#F8F9FA` |
| Texte principal | Gris anthracite `#1A1A2E` |
| Texte secondaire | Gris moyen `#6B7280` |
| Bordures | Gris clair `#E5E7EB` |
| Header | Blanc avec ombre légère portée |
| Boutons primaires | Couleur de marque sur fond blanc |
| Cas d'usage typique | Transitaires traditionnels, clientèle PME locale, première mise en ligne |

#### 🌑 Thème 2 — Sombre (`dark`)
> Interface moderne sur fond sombre, contrastes forts, accents lumineux. Idéal pour les transitaires positionnés sur une clientèle tech-savvy ou souhaitant une image contemporaine et haut de gamme. Réduit la fatigue visuelle lors d'une utilisation prolongée.

| Élément | Apparence |
|---------|-----------|
| Fond principal | Gris très foncé `#0F1117` |
| Fond des cartes/sections | Gris foncé `#1E2130` |
| Texte principal | Blanc cassé `#F1F3F5` |
| Texte secondaire | Gris clair `#9CA3AF` |
| Bordures | Gris sombre `#374151` |
| Header | Fond sombre avec bordure subtile `#374151` |
| Boutons primaires | Couleur de marque avec luminosité renforcée |
| Cas d'usage typique | Transitaires internationaux, clientèle grandes entreprises, positionnement premium |

#### 🏛️ Thème 3 — Professionnel (`corporate`)
> Interface structurée sur fond bleu marine profond, typographie soignée, accents acier ou dorés selon la couleur de marque. Conçu pour les transitaires à positionnement corporate, institutionnel ou à forte dimension internationale. Inspire confiance, sérieux et stabilité.

| Élément | Apparence |
|---------|-----------|
| Fond principal | Bleu marine `#0D1B2A` |
| Fond des cartes/sections | Bleu-gris foncé `#1B2A3B` |
| Texte principal | Blanc pur `#FFFFFF` |
| Texte secondaire | Bleu pâle `#A8B8C8` |
| Bordures | Bleu-gris `#2E4057` |
| Header | Bleu marine profond avec accent couleur de marque |
| Boutons primaires | Couleur de marque sur fond sombre structuré |
| Cas d'usage typique | Commissionnaires en douane, groupes logistiques, transitaires à clientèle institutionnelle |

---

### Critères d'acceptation

**Sélection et aperçu du thème :**
- [x] La page "Apparence" de l'espace admin présente les 3 thèmes sous forme de cartes visuelles côte à côte avec : miniature d'aperçu (screenshot simulé), nom du thème, description courte d'une ligne, badge "Actif" sur le thème en production
- [x] Un clic sur une carte de thème l'applique **dans la zone d'aperçu** (panneau droit) sans publier sur l'espace client en production
- [ ] La zone d'aperçu simule l'espace client avec le logo uploadé et les couleurs de marque actuelles, sur trois vues navigables : page de connexion, tableau de bord (liste de colis fictifs), fiche détail d'un colis fictif avec timeline _(⚠️ partiel : 2 vues présentes — login + dashboard — la fiche colis fictive manque)_
- [x] Un toggle "Desktop / Mobile" permet de visualiser le rendu sur les deux formats dans la zone d'aperçu
- [x] L'aperçu est mis à jour instantanément (< 300ms) lors du changement de thème, sans rechargement de page

**Publication du thème :**
- [x] Un bouton "Publier ce thème" est visible uniquement si le thème prévisualisé est différent du thème actuellement en production
- [x] Avant publication, une modale de confirmation est affichée : "Ce changement sera visible immédiatement par tous vos clients. Confirmer la publication ?"
- [x] Après confirmation, le thème est appliqué en production en moins de 5 secondes
- [ ] Un message de succès confirme la publication avec la date et l'heure _(⚠️ partiel : toast "Thème publié" sans date/heure)_

**Historique et retour arrière :**
- [ ] Un journal des 5 dernières publications de thème est accessible (thème publié, date, heure, auteur de l'action) _(⚠️ partiel : table `tenant_theme_history` alimentée mais aucune UI de consultation)_
- [ ] Un bouton "Rétablir ce thème" permet de republier un thème précédent en un clic, avec la même modale de confirmation _(⚠️ partiel : action `restoreThemeAction` existe mais non exposée dans l'UI)_
- [ ] Le thème par défaut (Clair) peut être rétabli à tout moment depuis l'historique

### Règles métier

- Le thème **Clair** est le thème par défaut appliqué à tout nouveau tenant à la création
- Le thème s'applique à l'intégralité de l'espace client : page de connexion, tableau de bord, fiche colis, centre de notifications, page paramètres du client
- Le thème **ne s'applique pas** à l'espace d'administration du transitaire — celui-ci conserve un thème neutre et fixe pour garantir la lisibilité des outils de gestion
- Les couleurs de marque (US-E1.2) se superposent au thème choisi : par exemple, thème Sombre + couleur de marque orange = boutons orange sur fond sombre
- Les emails de notification n'héritent pas du fond du thème (fond sombre ou marine non appliqué aux emails pour des raisons de compatibilité clients mail) — seules la couleur de marque et le logo y sont utilisés
- Seul un utilisateur avec le rôle "Administrateur" du tenant peut publier un thème (pas un opérateur simple)

### Cas limites

- Changement de thème alors qu'un client est en cours de session → le nouveau thème s'applique au prochain rechargement de page, pas en cours de navigation (évite une rupture visuelle brutale)
- Zone d'aperçu non disponible (erreur réseau) → message d'erreur dans le panneau d'aperçu + possibilité de publier quand même après avertissement "Aperçu indisponible — vous publiez sans visualisation préalable"
- Retour arrière vers un thème précédent → même processus de confirmation que la publication initiale
- Plusieurs opérateurs admin modifient l'apparence simultanément → last write wins avec notification toast "L'apparence a été modifiée par un autre administrateur" pour l'autre session

### Dépendances

- US-E1.1 (le logo est intégré dans l'aperçu du thème)
- US-E1.2 (les couleurs de marque se superposent au thème choisi)
- US-C1.1 (la page de connexion client reflète le thème publié)
- US-C2.2 (la fiche colis et la timeline utilisent les styles du thème actif)
