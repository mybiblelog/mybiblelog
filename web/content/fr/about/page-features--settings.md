---
seo:
  title: Page des paramètres
  description: Documentation pour les paramètres de lecture, de reporting et de compte de My Bible Log
og:
  title: Page des paramètres
  description: Documentation pour les paramètres de lecture, de reporting et de compte de My Bible Log
---

![](/share.jpg)

# Page des paramètres

La page des paramètres est organisée en plusieurs panneaux :

* Compte
* Lecture
* E-mails de rappel quotidien
* Exporter
* Importer

## Compte

Lorsque la page des paramètres est ouverte pour la première fois, le panneau du Compte s'affiche.

À partir d'ici, vous pouvez :

* changer votre adresse e-mail
* supprimer votre compte

## Lecture

Le panneau Lecture vous permet d'ajuster les paramètres liés à la lecture de la Bible. Cela inclut votre **Objectif quotidien de versets** et **Date de retour en arrière**.

### Objectif quotidien de versets

Votre objectif quotidien de versets est le nombre de versets de la Bible que vous souhaitez lire chaque jour. Ce paramètre affecte le comportement des barres de progression sur la page Aujourd'hui et la page du Calendrier.

Pour vous aider à décider de quel devrait être votre objectif quotidien de versets, cette section vous montre en combien de jours vous pourriez lire la Bible si vous atteignez votre objectif de versets tous les jours. Par défaut, cette valeur est de 86, ce qui vous permettra de lire l'intégralité de la Bible en moins de 365 jours.

### Date de retour en arrière

Votre date de retour en arrière détermine jusqu'où My Bible Log regardera dans votre journal de lecture pour évaluer votre progression. Votre date de retour en arrière commence à la date à laquelle vous avez commencé à utiliser My Bible Log.

Les entrées du journal antérieures à cette date seront ignorées. Par exemple, la page des Livres de la Bible ne montrera pas la lecture que vous avez faite avant votre date de retour en arrière.

Si vous avez lu toute la Bible et que vous souhaitez recommencer à lire chaque partie de la Bible, en définissant votre date de retour en arrière à la date actuelle, vous effacerez votre progression sur la page des Livres de la Bible et permettrez à vos entrées dans le journal d'être considérées comme des versets « nouveaux » à nouveau sur la page Aujourd'hui et la page du Calendrier.

Changer votre date de retour en arrière ne supprimera aucune donnée de My Bible Log. Toutes vos entrées de journal existent toujours et peuvent être consultées à tout moment depuis la page du Calendrier.

### Version de la Bible préférée

Vous pouvez choisir une traduction que vous préférez utiliser pour la lecture. Les liens de lecture externes ouvriront cette traduction de la Bible dans votre application de lecture préférée.

Si une traduction que vous souhaitez utiliser ne figure pas dans la liste, veuillez la demander avec [ce formulaire](/fr/feedback).

### Application de la Bible préférée

Vous pouvez choisir l'application ou le site web qui sera ouvert lorsque vous cliquerez sur un lien de lecture.

Ce paramètre est enregistré sur l'appareil plutôt que sur votre compte, ce qui vous permet d'utiliser différentes applications ou sites web sur différents appareils.

Si un site web ou une application que vous souhaitez utiliser ne figure pas dans la liste, veuillez le demander avec [ce formulaire](/fr/feedback).

## E-mails de rappel quotidien

Vous pouvez choisir de recevoir un e-mail de rappel quotidien de la part de My Bible Log. L'e-mail arrivera à l'heure de votre choix.

### Opt-in

Vous devez confirmer que vous souhaitez recevoir un e-mail de rappel quotidien. My Bible Log n'envoie pas d'e-mails non sollicités.

Vous pouvez désactiver les e-mails de rappel depuis vos paramètres à tout moment. Chaque e-mail contient également un lien de désinscription instantané.

### Heure du rappel

Vous devez choisir une heure pour recevoir votre e-mail de rappel quotidien. Cela permet aux rappels d'être une partie utile et intentionnelle de votre routine quotidienne.

## Exporter

### Journal de lecture (CSV)

Votre journal de lecture peut être exporté sous forme de feuille de calcul (au format CSV). Cela vous permet de travailler avec vos données de la manière qui vous convient.

Si vous avez des compétences en programmation ou si vous connaissez quelqu'un qui en a, vous pourriez utiliser ces données pour créer de nouveaux graphiques. Vous pourriez même combiner les données d'exportation de My Bible Log de plusieurs personnes.

Voici un exemple de ce à quoi ressemble une feuille de calcul d'exportation de My Bible Log. Les en-têtes "Date" et "Passage" n'apparaîtront pas dans le fichier.

|Date|Passage|
|---|---|
|2020-07-21|Matthieu 1-3|
|2020-07-22|Matthieu 4-9|
|2020-07-22|Matthieu 10-11|
|2020-07-23|Matthieu 12-13|
|2020-07-23|Matthieu 14-17|
|2020-07-24|Matthieu 18-21|
|2020-07-24|Matthieu 22-28|

Voici à quoi ressemble le fichier CSV dans un éditeur de texte. Remarquez comment une virgule apparaît entre la date et le passage, car il s'agit d'un fichier de valeurs séparées par des virgules (CSV).

```csv
2020-07-21,Matthieu 1-3
2020-07-22,Matthieu 4-9
2020-07-22,Matthieu 10-11
2020-07-23,Matthieu 12-13
2020-07-23,Matthieu 14-17
2020-07-24,Matthieu 18-21
2020-07-24,Matthieu 22-28
```

### Notes et Tags (Fichier texte)

Vous pouvez exporter vos notes et tags dans un fichier texte.

Alors que l'exportation du journal de lecture (fichier CSV) peut être automatiquement réimportée dans My Bible Log, l'exportation des notes ne peut pas être automatiquement importée.
Cependant, vous pouvez toujours recréer manuellement vos notes et tags à partir de votre fichier d'exportation si vous avez besoin de récupérer vos données.

## Importer

Vous pouvez importer une feuille de calcul de journal de lecture (au format CSV) dans My Bible Log. Vous pouvez importer une feuille de calcul que vous avez créée vous-même, ou une feuille de calcul que vous avez précédemment exportée depuis My Bible Log.

La fonction d'importation du journal de lecture utilise le même format de fichier que la fonction d'exportation du journal de lecture.

Lorsque vous importez une feuille de calcul, la progression de l'importation sera affichée sur la page. My Bible Log ne recréera pas les entrées de journal qui existent déjà. Si vous avez lu Genèse 1 le 1er janvier et que vous l'avez suivi dans My Bible Log, puis importé une feuille de calcul incluant une entrée de journal pour le même passage et la même date, My Bible Log l'ignorerait.

<div class="mbl-button-group">
  <a class="mbl-button mbl-button--light" href="/fr/settings">Aller à la page des paramètres</a>
</div>
