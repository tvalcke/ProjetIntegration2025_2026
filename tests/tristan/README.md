# Tests Unitaires - Frontend JEMLO

## 📋 Description

Ce dossier contient les tests unitaires pour la partie **Frontend** du projet JEMLO, développés dans le cadre du projet d'intégration 2025-2026.

## 👨‍💻 Responsable

**Tristan** - Développeur Frontend & Interface Admin + fonctionnement du site d'administration

## 🎯 Objectif des tests

Les tests unitaires couvrent les fonctionnalités principales du frontend JEMLO :
- Validation des formulaires (login, contact)
- Gestion de l'authentification
- Navigation et routage
- Interactions utilisateur
- Affichage des données (fontaines, statistiques)

## 🛠️ Technologies utilisées

- **Jest** v29.7.0 : Framework de test JavaScript
- **jsdom** : Simulation d'environnement navigateur
- **Babel** : Transpilation du code moderne

## 📦 Installation

```bash
cd tests/tristan
npm install
```

## 🚀 Exécution des tests

```bash
# Exécuter tous les tests
npm test

# Mode watch (relance automatique à chaque modification)
npm run test:watch

# Générer un rapport de couverture de code
npm run test:coverage
```