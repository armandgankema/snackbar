# Snackmart

*Bijna weekend. Eerst een frikandel.*

Bestelwebsite voor de vrijdagse snackbarbestelling (Snackbar De Schalm). Collega's kiezen hun snacks, met per gerecht één saus en per blikje een soort frisdrank. Bij het bestellen kiezen ze **contant betalen** of **betaalverzoek ontvangen**. De verzamelaar ziet op `/beheer.html` per persoon wat hij moet ontvangen, en downloadt de bestellijst als pdf voor de snackbar.

## Wat je nodig hebt

1. **Netlify-account** (gratis), voor de hosting.
2. **GitHub-account** (gratis). Netlify bouwt de website vanuit GitHub.

## Installeren (eenmalig, circa 20 minuten)

1. **Code op GitHub zetten:** maak op github.com een nieuwe (private) repository aan, bijvoorbeeld `snackbar`. Kies "uploading an existing file" en sleep de inhoud van deze map erin, zonder `node_modules`.
2. **Site koppelen in Netlify:** kies in Netlify "Add new site", dan "Import an existing project", dan GitHub, en selecteer de repository. De instellingen worden automatisch uit `netlify.toml` gelezen. Klik op Deploy.
3. **Instellingen invullen:** ga in Netlify naar Site configuration, dan Environment variables, en voeg toe:

   | Naam | Waarde |
   |---|---|
   | `BEHEER_WACHTWOORD` | Wachtwoord voor de beheerpagina. Kies een sterk wachtwoord. |
   | `TOEGANGSCODE` | (Aanbevolen) Code die collega's invullen bij bestellen, zodat buitenstaanders niet kunnen bestellen. |

4. **Opnieuw publiceren:** kies Deploys, dan "Trigger deploy", zodat de instellingen actief worden.
5. **Testen:** doe een proefbestelling en controleer op `/beheer.html` dat hij in het overzicht staat. Verwijder hem daarna.
6. **Websitenaam (optioneel):** in Netlify kun je bij Domain management de naam aanpassen, bijvoorbeeld `snackbar-emmen.netlify.app`.

## Openingstijden

Bestellen is open van **maandag 07:00** tot **vrijdag 11:00**. Daarbuiten is de website gesloten. Beide tijden zijn aan te passen op de beheerpagina. Na sluiting download je op de beheerpagina de bestellijst als pdf en stuur je die naar de snackbar.

## Pagina's

| Adres | Voor wie | Wat |
|---|---|---|
| `/` | Iedereen | Menu en bestellen. Na het bestellen kiest de collega contant of betaalverzoek en ziet een bedankpagina met de bestelling. |
| `/overzicht.html` | Iedereen | Wie heeft deze week al besteld. Klik op een naam om de bestelling te zien. Bedragen staan hier niet. |
| `/beheer.html` | Verzamelaar | Wat er per persoon te ontvangen is (met vinkje "ontvangen"), bestellingen verwijderen, bestellijst als pdf, openingstijden, medewerkerslijst, eerdere weken. |

## Alleen echte namen

- Een naam moet bestaan uit een voor- en achternaam, alleen letters, en mag niet op een nepnaam lijken (zoals "test", "asdf" of "aaa").
- Wil je het strenger: vul op de beheerpagina bij **Medewerkers** de namen van alle collega's in, één per regel. Dan kunnen alleen die mensen bestellen.

## Prijzen of menu aanpassen

Alle producten en prijzen staan in `lib/menu.mjs`. Pas daar de bedragen aan (in centen, `250` is € 2,50) en upload het bestand opnieuw naar GitHub. Netlify zet de wijziging automatisch online.

## Kosten

Netlify is gratis binnen de normale limieten.

## Technisch

- `public/`: de webpagina's (bestellen, bedankt, overzicht, beheer).
- `netlify/functions/`: serverfuncties (menu, bestellen, bestelling, overzicht, beheer).
- `lib/`: menu en prijzen, tijd (Nederlandse tijdzone), opslag (Netlify Blobs), naamcontrole en pdf.
- Prijzen worden altijd op de server berekend. Wat de browser stuurt, wordt alleen als keuze gebruikt.
