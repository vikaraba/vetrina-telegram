# Ampliamento Van Cleef, Cartier e Messika

Richiesta aggiornata: aggiungere Van Cleef, Cartier, Messika e gli orologi al minisito.
Baseline frontend integrata: 9c16b49146be07be453ffedfa3886566d6149ca6.
CRM source dell'audit aggiornato: 3934dfc2ac3a36f666962007d42d2bfd46de48dd.

## Differenze circoscritte

- Categorie importate Cartier/VCA/Messika normalizzate e tradotte in russo.
- Titolo gioiello: nome prodotto completo, non sola collezione o sottocategoria.
- Materiale gioiello: soltanto metalli espliciti nella fonte, nessuna purezza
  inferita e nessuna descrizione marketing usata come materiale.
- Ricerca russa dei nuovi titoli; filtri modello e SKU invariati.
- Messika usa lo stesso contratto gioielli: nessun prezzo, materiale o stock
  inventato. Le schede senza prezzo RUB valido non diventano pubblicabili.
- Entry point, modulo ordini e modulo catalogo hanno una versione cache coerente.
- Preview locale con porta configurabile, per non interrompere altre anteprime.
- Homepage brand e griglia proporzionale della PR #13, colori, foto/zoom,
  navigazione, roller ON, prezzo e chat
  restano invariati. Nessun endpoint, dato, prezzo o post viene modificato da questa PR.

## Verifica locale del 26 settembre 2026

Node 24 `npm run verify`: 47/47 test, controllo sintassi e build dei sei asset
pubblici superati. Il precedente blocco del browser è risolto.

UAT tramite browser con fixture customer DTO reali in sola lettura: 2 Cartier,
7 VCA, 1 ON e 1 LV. Trasporto API simulato e messaggi intercettati localmente;
nessuna scrittura DB, analytics o Telegram.

- Viewport 430x932: nessun overflow orizzontale, input ricerca 16px; VCA ricerca
  SKU esatta, filtro brand, galleria 5 foto, cambio foto e zoom 150%; ordine
  simulato con riferimento corretto verso buyer_rome, senza notazione EU.
- Cartier: brand + tetto 80000 RUB restituisce il solo pendente; 5 foto,
  ordine col riferimento corretto e ritorno con filtri conservati.
- Viewport 1440x900: griglia a sei colonne, immagini caricate, nessun overflow.
- Regressione ON: 7 foto, roller con le 13 misure della fixture, selezione EU 38,
  esito disponibile **simulato**, ordine con modello/misura corretti.
- Regressione LV: Neverfull MM, 9 foto, prezzo RUB, nessun selettore scarpe.
- Messika: copertura unitaria soltanto; nessuna fixture pubblicabile reale.

Non equivale a UAT su iPhone fisico, sessione Telegram firmata, verifica stock
live o prova di consegna messaggi. Non sono stati raccolti i campioni di latenza
baseline/candidato a cache fredda/calda: la velocità non è dichiarata PASS.

## Stato dati e blocchi di attivazione

- VCA: 170 schede tecnicamente eleggibili. Primo gruppo di 7 con prezzi manuali
  esistenti preservati: fonti ufficiali ricontrollate il 26/09, prezzo fonte
  invariato, gallerie complete, disponibilità osservata (non garanzia stock).
- Cartier: 107 schede tecnicamente eleggibili, ma snapshot prezzo prodotto e
  prezzo calcolato fonte discordanti. Richiesta riconciliazione canonica prima
  dell'attivazione; questa PR non aggiorna né arrotonda prezzi salvati.
- Messika: 115 schede, zero prezzi cliente RUB; 87 URL ufficiali individuati.
  Le poche immagini approvate esistenti provengono da import Telegram privati:
  non renderle pubbliche. Servono regola commerciale, import fonte ufficiale e
  media pubblici approvati, usando il CRM come unica fonte.

**Draft, non ancora rilasciata.** Restano raccolta prestazioni, verifica Telegram
reale, coordinamento con il proprietario del rilascio CRM e attivazione per
manifest esatto tramite RPC canonica. Nessun nuovo post Telegram autorizzato o
eseguito in questo ampliamento. Non confondere eleggibilità tecnica e readiness.

## Estensione orologi: referenza prima delle immagini

- Alias `Orologi`, `Watches`, `Steel Watches`, `jewelry_watches` e `часы`
  condividono il filtro russo `Часы`. Non classificare dal solo marchio o da
  un diametro in millimetri: una categoria importata non prova l'identità.
- Il titolo mantiene il nome completo della variante, non soltanto `Tank` o
  `Serpenti`; la ricerca e l'ordine mantengono la referenza esatta.
- Fonti ufficiali: 15 Cartier verificati con SKU JSON-LD, reference data layer
  e URL canonico coincidenti; 128 immagini rilevate, 50 assenti dalle gallerie CRM.
- Chopard: 16 schede storiche corrispondono a 15 referenze. Verifica con
  `data-pid`, `productReference`, categoria `watches` del prodotto principale e
  file galleria della stessa referenza. Raccomandazioni e varianti vicine escluse.
  La referenza `278559-3001` compare due volte: nessun merge automatico di schede.
- Bvlgari: 3 link ufficiali individuati, acquisizione automatica fermata per
  challenge di sicurezza. Le pagine indicizzate non provano una verifica live.
- Formex/Swatch/Tissot e due Longines non hanno una referenza utilizzabile nei
  campi esaminati. Cinque Gucci classificati `orologi` descrivono anelli/orecchini;
  altri record sono annunci generici. Nessuna attivazione per sola categoria.
- Archivio immagini locale separato dai sei asset pubblici: bytes ufficiali
  conservati, hash SHA256, deduplica e JPEG web max 1600px senza ingrandimento.
  Nessun caricamento Storage, collegamento immagini CRM o attivazione eseguito.
  Il download per fonte si ferma su accesso negato/rate limit; niente bypass.

UAT locale aggiuntiva: due orologi reali, 430x932 (ricerca WSTA0136 → singola
scheda product275 → bozza con WSTA0136 → ritorno con ricerca conservata) e
1440x900 (categoria Часы → 2 schede → reset). Nessun overflow e nessun invio.
Il test usa le gallerie CRM preesistenti; non attesta l'import delle nuove foto.
Prezzi Cartier da riconciliare e prezzi cliente Chopard assenti restano bloccanti.

requested_by_tool: codex
requested_by_task: 01a0214c-98c9-7852-9e6d-fd1410b15e31

## Lotto non-ON del 27 settembre

L'utente ha dato priorità alle tipologie diverse da ON. Nessuna attivazione,
rettifica prezzo o pubblicazione Telegram ON è inclusa. La PR è riallineata
alla homepage brand già pubblicata, senza cambiare layout o flussi approvati.
Gate Node 24: 49 test passati, sintassi e build dei sei asset PASS.

Primo manifest VCA: 433, 435, 492, 493, 494, 495, 496. Prezzi cliente manuali
RUB invariati; 31 immagini ufficiali già presenti nel CRM. Nuova verifica fonte
alle 22:07 UTC del 26/09 (00:07 Italia del 27/09): 7/7 referenze, prezzi fonte,
gallerie complete e disponibilità osservata PASS. Attivazione ancora subordinata
a UAT della revisione integrata, confronto reattività e deployment verificato.

Il collaudo locale non sostituisce la firma Telegram né prova stock garantito.
Cartier resta separato: 107 discrepanze prodotto/prezzo fonte; Messika e Chopard
non hanno ancora un prezzo cliente RUB approvato. Nessuna formula viene inventata.
