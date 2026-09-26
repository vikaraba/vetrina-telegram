# Ampliamento Van Cleef, Cartier e Messika

Richiesta aggiornata: aggiungere Van Cleef, Cartier e Messika al minisito.
Baseline frontend integrata: 2365ac67d887bd15263c586688eefd34d52e31c1.
CRM source dell'audit: 136ea8ed94edf9d9546d3579549b4952fd1d4fa2.

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
- Layout, sei card, colori, foto/zoom, navigazione, roller ON, prezzo e chat
  restano invariati. Nessun endpoint, dato, prezzo o post viene modificato da questa PR.

## Verifica locale del 26 settembre 2026

Node 24 `npm run verify`: 43/43 test, controllo sintassi e build dei sei asset
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

requested_by_tool: codex
requested_by_task: 01a0214c-98c9-7852-9e6d-fd1410b15e31
