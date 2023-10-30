# Le Trèfle 2.0 - Solar

Application web pour l'association [Le Trèfle 2.0](https://letrefle.org/) permettant la prise en charge des écoutes de maniere optimisée et securisée, sans les contraintes techniques et pratiques de la prise en charge directement via Discord.

## Spécifications :

| **Version**              | Beta 1.0              |
|:------------------------:|:---------------------:|
| **Date de publication**  | Lundi 20 octobre 2023 |
| **Utilisation destinée** | Test interne          |


## Bugs connus :

[**La validation des codes d'authentification a deux facteurs ne fonctionne pas**](https://github.com/Le-Trefle-2-0/Solar/issues/19)
*Contournement : ne pas activer l'A2F sur les comptes*

[**Les messages transmis au bot ne sont pas convertis en format UTF-8 avant envoi**](https://github.com/Le-Trefle-2-0/Solar/issues/1), causant la réception de certains caracteres illisibles.
*Courtournement : Aucun*

## Bugs corrigés :

Premiere version, aucune correction de bugs signalés.

## Objectifs :

Test a moyenne/grande échelle du systeme d'écoute, de planning ainsi que de lien avec le bot. Grace aux fonctionnalités déja implémentées.
Fonctionnalités présentes :

- Ouverture des écoutes par les utilisateurs via le bot.
- Planification et inscription aux permanences via le planning.
- Chat de permanence disponible pendant les permanences.
- Assignation des écoutes aux BE par le RBE.
- Réinitialisation du mot de passe par l'envoi d'un courriel.

## Informations supplémentaires :

- Le chat de permanence se ferme automatiquement immédiatement a la fin de l'événement au quel il est lié, ce sera changé a l'avenir.