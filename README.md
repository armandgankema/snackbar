# Snackbar Vrijdagbestelling

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
   | `SMTP_USER` | Het mailadres dat de mail verstuurt, bijvoorbeeld een Gmail-adres. |
   | `SMTP_PASS` | Het wachtwoord daarvan. Bij Gmail is dat een app-wachtwoord (zie hieronder), niet je gewone wachtwoord. |
   | `MAIL_AAN` | Waar de mail naartoe moet. Meerdere adressen scheid je met een komma. |
   | `SMTP_HOST` / `SMTP_PORT` | Alleen nodig als je geen Gmail gebruikt (standaard `smtp.gmail.com` / `465`). Outlook/Microsoft 365: `smtp.office365.com` / `587`. |

4. **Opnieuw publiceren:** kies Deploys, dan "Trigger deploy", zodat de instellingen actief worden.
5. **Testen:** doe een proefbestelling en controleer op `/beheer.html` dat hij in het overzicht staat. Verwijder hem daarna.
6. **Websitenaam (optioneel):** in Netlify kun je bij Domain management de naam aanpassen, bijvoorbeeld `snackbar-emmen.netlify.app`.

## Openingstijden en mail

- Bestellen is open van **maandag 07:00** tot **vrijdag 11:00**. Daarbuiten is de website gesloten. Beide tijden zijn aan te passen op de beheerpagina.
- Op vrijdag om 11:00 gaat automatisch een mail naar `MAIL_AAN` met alle bestellingen: de bestellijst, wat er per persoon te ontvangen is, en de bestellijst als pdf in de bijlage. Dit gebeurt één keer per week.
- Met **Mail nu versturen** op de beheerpagina kun je de mail tussendoor (opnieuw) versturen, bijvoorbeeld om te testen.

**Gmail app-wachtwoord:** ga naar myaccount.google.com, dan Beveiliging. Zet verificatie in 2 stappen aan als dat nog niet zo is. Zoek daarna op "App-wachtwoorden", maak er een aan (naam bijvoorbeeld "Snackbar") en gebruik de code van 16 tekens als `SMTP_PASS`.

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
- `netlify/functions/`: serverfuncties (menu, bestellen, bestelling, overzicht, beheer, mail op vrijdag).
- `lib/`: menu en prijzen, tijd (Nederlandse tijdzone), opslag (Netlify Blobs), naamcontrole, pdf en mail.
- Prijzen worden altijd op de server berekend. Wat de browser stuurt, wordt alleen als keuze gebruikt.
