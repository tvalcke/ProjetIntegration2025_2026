Excellent 👌
Voici la **découpe du CDC en backlog complet façon GitHub Projects** — avec **User Stories (US)**, **tâches**, et **priorités (P1 à P3)** pour guider le développement de *Culture Thirst*.
Le backlog est organisé par **épopées (Epics)** correspondant aux grandes fonctionnalités du MVP.

---

# Backlog — *Culture Thirst*

---

## Epic 1 : Authentification & Profil utilisateur

### **US1 — En tant qu’étudiant, je veux créer un compte pour accéder à mes statistiques.**

* **Tâches :**

  * [P1] Implémenter inscription via email/password (Firebase Auth).
  * [P1] Gérer la connexion et déconnexion.
  * [P2] Ajouter connexion via Google (Firebase OAuth).
  * [P2] Ajouter vérification e-mail.
  * [P3] Ajout option “supprimer mon compte” (GDPR).

---

### **US2 — En tant qu’étudiant, je veux voir mon profil avec mes statistiques.**

* **Tâches :**

  * [P1] Créer écran “Profil” (nom, établissement, bouteilles, meilleur rang, rang actuel).
  * [P1] Récupérer et afficher données Firebase (`users/{userId}`).
  * [P2] Ajouter avatar (upload → Firebase Storage).
  * [P3] Ajouter historique (bouteilles / sessions / poèmes débloqués).

---

## Epic 2 : Scan QR & Consommation d’eau

### **US3 — En tant qu’étudiant, je veux scanner le QR de la fontaine pour enregistrer ma consommation.**

* **Tâches :**

  * [P1] Créer écran “Scan” avec caméra (`expo-camera` / `react-native-qrcode-scanner`).
  * [P1] Lire QR contenant `fountainID` + token temporaire.
  * [P1] Envoyer `startSession(userId, fountainId)` à Firebase Cloud Function.
  * [P1] Recevoir confirmation et affichage “session en cours”.
  * [P2] Gérer erreurs (QR invalide, fontaine hors ligne).
  * [P3] Historiser les scans.

---

### **US4 — En tant qu’étudiant, je veux que ma consommation soit enregistrée automatiquement.**

* **Tâches :**

  * [P1] Cloud Function pour recevoir événement `{fountainId, liters, userId}`.
  * [P1] Conversion automatique liters → bottles (`bottles = floor(liters)`).
  * [P1] Mise à jour atomique de `users.totalBottles` et leaderboard.
  * [P2] Validation anti-fraude : max X L/min par session.
  * [P3] Envoi push “Félicitations, +1 bouteille économisée !”.

---

## Epic 3 : Poèmes & Gamification

### **US5 — En tant qu’étudiant, je veux débloquer un poème à chaque bouteille économisée.**

* **Tâches :**

  * [P1] Créer collection `poems` dans Firebase (id, titre, auteur, texte).
  * [P1] Cloud Function : lorsqu’une bouteille est ajoutée → choisir poème aléatoire.
  * [P1] Stocker poèmes débloqués dans `users.poemsUnlocked`.
  * [P1] Créer modal “Poème débloqué”.
  * [P2] Afficher l’historique de poèmes sur le profil.
  * [P3] Bouton “Partager le poème” (réseaux sociaux).

---

### **US6 — En tant qu’étudiant, je veux gagner des badges pour mes progrès.**

* **Tâches :**

  * [P2] Créer logique de badges (`10`, `50`, `100` bouteilles...).
  * [P2] Afficher badges dans le profil.
  * [P3] Notifications push lors d’un badge débloqué.

---

## Epic 4 : Classements (Leaderboards)

### **US7 — En tant qu’étudiant, je veux voir mon classement parmi les autres étudiants de mon établissement.**

* **Tâches :**

  * [P1] Structure `leaderboards/studentsBySchool/{schoolId}`.
  * [P1] Cloud Function pour mise à jour en temps réel à chaque incrément.
  * [P1] Écran “Classement” (liste triée, avatar, position).
  * [P2] Filtres : jour / semaine / mois / total.
  * [P3] Animation de progression (+3 bouteilles, etc.).

---

### **US8 — En tant qu’administrateur, je veux voir le classement des établissements.**

* **Tâches :**

  * [P1] Structure `leaderboards/schools`.
  * [P1] Cloud Function agrégée (somme des `school.totalBottles`).
  * [P1] Écran “Classement Écoles” (vue globale).
  * [P2] Filtres : période.
  * [P3] Graphiques / statistiques.

---

## Epic 5 : Administration

### **US9 — En tant qu’admin, je veux gérer les fontaines installées.**

* **Tâches :**

  * [P1] Dashboard web React (Firebase Hosting).
  * [P1] CRUD fontaines (`fountainId`, `schoolId`, `token`, `status`).
  * [P2] Export CSV (consommations / écoles).
  * [P3] Historique complet de consommation.

---

### **US10 — En tant que technicien, je veux configurer une fontaine connectée.**

* **Tâches :**

  * [P1] Générer un token d’appairage dans le dashboard.
  * [P1] Firmware ESP32 : lecture débitmètre, envoi `liters` via HTTPS vers Firebase.
  * [P2] Gestion reconnexion Wi-Fi / cache local.
  * [P3] Calibration et test débit.

---

## Epic 6 : Sécurité & Anti-abus

### **US11 — En tant qu’administrateur, je veux éviter les fraudes.**

* **Tâches :**

  * [P1] Token QR à usage unique (expirant).
  * [P1] Vérification timestamps et rate limiting.
  * [P2] Détection de sessions anormales (machine learning simple ou seuils).
  * [P3] Logs d’audit (tentatives rejetées).

---

## Epic 7 : Exigences transversales & non fonctionnelles

### **US12 — En tant qu’utilisateur, je veux que l’app soit fluide et accessible.**

* **Tâches :**

  * [P1] Utiliser React Native optimisé (Expo).
  * [P1] Gestion offline basique (sync différée).
  * [P2] Respect des standards d’accessibilité (taille texte, contraste).
  * [P3] Traduction FR/EN (facultative).

---

## 🔥 Priorisation globale

| Priorité | Description                                                                       | Horizon    |
| -------- | --------------------------------------------------------------------------------- | ---------- |
| **P1**   | MVP essentiel (inscription, scan, crédit, leaderboard, poèmes, dashboard basique) | Sprint 1-2 |
| **P2**   | Améliorations UX, badges, filtres classements, OAuth, CSV export                  | Sprint 3   |
| **P3**   | Bonus culturels, partages, stats avancées, machine learning anti-abus             | Sprint 4+  |

---

Souhaites-tu que je te le transforme au **format GitHub Project JSON** (prêt à importer dans GitHub Issues/Projects), ou préfères-tu un **tableau Markdown lisible** que tu puisses copier directement dans Notion ou GitHub Wiki ?
