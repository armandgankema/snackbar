# Snackbar Vrijdagbestelling

Bestelwebsite voor de vrijdagse snackbarbestelling (Snackbar De Schalm). Collega's kiezen hun snacks, met per gerecht één saus en per blikje een soort frisdrank, en betalen direct via Mollie (iDEAL). De verzamelaar ziet op `/beheer.html` de bestellijst voor de snackbar en wie er betaald heeft.

## Wat je nodig hebt

1. **Mollie-account.** Mollie werkt alleen voor bedrijven met een KvK-inschrijving. Het geld komt op de bankrekening die aan dat Mollie-account gekoppeld is.
2. **Netlify-account** (gratis), voor de hosting.
3. **GitHub-account** (gratis). Netlify bouwt de website vanuit GitHub; alleen zo werken de betaalfuncties.

## Installeren (eenmalig, circa 20 minuten)

1. **Code op GitHub zetten:** maak op github.com een nieuwe (private) repository aan, bijvoorbeeld `snackbar`. Kies "uploading an existing file" en sleep de inhoud van deze map erin, zonder `node_modules`.
2. **Site koppelen in Netlify:** kies in Netlify "Add new site", dan "Import an existing project", dan GitHub, en selecteer de repository. De instellingen worden automatisch uit `netlify.toml` gelezen. Klik op Deploy.
3. **Instellingen invullen:** ga in Netlify naar Site configuration, dan Environment variables, en voeg toe:

   | Naam | Waarde |
   |---|---|
   | `MOLLIE_API_KEY` | De API-key uit het Mollie-dashboard (Ontwikkelaars, API-keys). Begin met de `test_`-key. |
   | `BEHEER_WACHTWOORD` | Wachtwoord voor de beheerpagina. Kies een sterk wachtwoord. |
   | `TOEGANGSCODE` | (Aanbevolen) Code die collega's invullen bij bestellen, zodat buitenstaanders niet kunnen bestellen. |

4. **Opnieuw publiceren:** kies Deploys, dan "Trigger deploy", zodat de instellingen actief worden.
5. **Testen:** doe een testbestelling met de `test_`-key. Mollie toont dan een testpagina waar je de uitkomst kiest (betaald, mislukt, enzovoort). Controleer op `/beheer.html` dat de bestelling als betaald op de lijst staat.
6. **Live gaan:** vervang `MOLLIE_API_KEY` door de `live_`-key en publiceer opnieuw. Zet in Mollie iDEAL aan als betaalmethode.
7. **Websitenaam (optioneel):** in Netlify kun je bij Domain management de naam aanpassen, bijvoorbeeld `snackbar-emmen.netlify.app`.

## Gebruik

- **Collega's** openen de website, kiezen hun bestelling en betalen. Alleen betaalde bestellingen komen op de lijst.
- **Verzamelaar** opent `/beheer.html` en logt in met het wachtwoord. Daar staan:
  - de bestellijst om te kopiëren voor het bellen naar de snackbar;
  - een overzicht per persoon;
  - de sluittijd (standaard vrijdag 11:00) en een knop om bestellen direct te sluiten;
  - eerdere weken, via Vorige en Volgende.
- **Terugbetalen** doe je in het Mollie-dashboard.

## Prijzen of menu aanpassen

Alle producten en prijzen staan in `lib/menu.mjs`. Pas daar de bedragen aan (in centen, `250` is € 2,50) en upload het bestand opnieuw naar GitHub. Netlify zet de wijziging automatisch online.

## Kosten

- Netlify: gratis binnen de normale limieten.
- Mollie: kosten per betaling volgens het actuele Mollie-tarief, zie mollie.com/nl/pricing.

## Technisch

- `public/`: de webpagina's (bestellen, bedankt, beheer).
- `netlify/functions/`: serverfuncties (menu, bestellen, Mollie-webhook, status, beheer).
- `lib/`: menu en prijzen, tijd (Nederlandse tijdzone), opslag (Netlify Blobs) en de Mollie-koppeling.
- Prijzen worden altijd op de server berekend. Wat de browser stuurt, wordt alleen als keuze gebruikt.
