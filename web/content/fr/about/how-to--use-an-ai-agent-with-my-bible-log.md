---
dateModified: "2026-11-20"
seo:
  title: "Utiliser un agent IA avec My Bible Log : guide de l'API"
  description: "Connectez un agent IA ou votre propre script à l'API ouverte de My Bible Log pour enregistrer votre lecture de la Bible, prendre des notes et organiser vos étiquettes, avec des références comme JHN.3.16."
og:
  title: "Utiliser un agent IA avec My Bible Log : guide de l'API"
  description: "Connectez un agent IA ou votre propre script à l'API ouverte de My Bible Log pour enregistrer votre lecture de la Bible, prendre des notes et organiser vos étiquettes, avec des références comme JHN.3.16."
---

# Utiliser un agent IA avec My Bible Log

Tout ce que vous pouvez faire dans My Bible Log est disponible via son API ouverte. Un agent IA, ou un script qu'un agent vous aide à écrire, peut donc enregistrer votre lecture, prendre des notes et gérer vos étiquettes à votre place.

Cette page rassemble les quelques informations dont un agent a besoin pour commencer. Donnez-lui cette page et la référence de l'API ci-dessous.

## Référence de l'API

* **Spécification OpenAPI (JSON) :** [mybiblelog.com/api/openapi.json](https://www.mybiblelog.com/api/openapi.json)
* **URL de base :** `https://www.mybiblelog.com/api`

La plupart des agents peuvent lire la spécification OpenAPI directement et y découvrir chaque endpoint.

## Des références bibliques familières

Les passages s'écrivent sous forme de références courtes, au format utilisé par YouVersion et Bible.com. Un agent n'a donc jamais à manipuler les numéros de verset internes de My Bible Log :

| Passage | Référence |
| --- | --- |
| Genèse | `GEN` |
| Psaume 23 | `PSA.23` |
| Genèse 1-3 | `GEN.1-3` |
| Jean 3.16-18 | `JHN.3.16-18` |
| Genèse 1.1 - 2.3 | `GEN.1.1-2.3` |

Un passage reste dans un seul livre. Les numéros de chapitre et de verset suivent les Bibles anglaises comme la NASB : Malachie compte donc 4 chapitres.

Les réponses incluent la même référence dans un champ `passage`, à côté des numéros de verset internes.

## Connexion

Chaque requête a besoin d'un jeton de connexion, envoyé dans un en-tête :

```
Authorization: Bearer <token>
```

Obtenez un jeton en vous connectant avec votre e-mail et votre mot de passe :

```bash
curl -X POST https://www.mybiblelog.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "your-password"}'
```

Le jeton se trouve dans `data.token` dans la réponse et reste valable 30 jours.

* **Inscrit avec Google ?** Créez d'abord un mot de passe dans **Paramètres → Changer Email**.
* **Gardez votre mot de passe pour vous.** Connectez-vous vous-même et ne donnez à l'agent que le jeton.
* **Traitez le jeton comme un mot de passe.** Il donne un accès complet à votre compte, y compris sa suppression.
* **Pour révoquer un jeton,** utilisez **Déconnecter toutes les sessions** dans les Paramètres, ou changez votre mot de passe.

## Tâches courantes

| Tâche | Requête | Corps |
| --- | --- | --- |
| Enregistrer une lecture | `POST /log-entries` | `{"date": "2026-11-11", "passage": "JHN.3"}` |
| Lister vos lectures | `GET /log-entries` | |
| Créer une note | `POST /passage-notes` | `{"content": "…", "passages": ["JHN.3.16-18"], "tags": ["<tag id>"]}` |
| Trouver les notes d'un passage | `GET /passage-notes?filterPassage=JHN.3` | |
| Créer une étiquette | `POST /passage-note-tags` | `{"label": "Prière", "color": "#3a7bd5"}` |
| Lister vos étiquettes | `GET /passage-note-tags` | |
| Lire vos paramètres | `GET /settings` | |

Les dates s'écrivent au format `YYYY-MM-DD`, dans votre propre fuseau horaire. Par exemple, pour enregistrer Jean 3 comme lu aujourd'hui :

```bash
curl -X POST https://www.mybiblelog.com/api/log-entries \
  -H "Authorization: Bearer $MBL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-11-11", "passage": "JHN.3"}'
```

## Conseils pour les agents

* **Les erreurs de validation sont précises.** Une réponse `400` indique chaque champ en erreur et pourquoi, pour qu'un agent puisse corriger sa requête et réessayer.
* **Faites une sauvegarde avant les modifications en masse.** Téléchargez vos données dans **Paramètres → Exporter** avant de laisser un agent modifier ou supprimer beaucoup d'éléments à la fois.
* **La connexion est limitée en fréquence.** Réutilisez un seul jeton plutôt que de vous connecter à chaque requête.
