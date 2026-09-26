# Primo lotto ON, Van Cleef e Cartier

Richiesta: procedere con le prime tre priorità di ampliamento del minisito.
Baseline frontend: f12b4b7afa9db5346dde52f5883550f09ca31b3c.
CRM source: 02a8224a4e5d2d20530ca5526e1a808b3f489629.

## Differenze circoscritte

- Categorie importate Cartier/VCA normalizzate e tradotte in russo.
- Titolo gioiello: nome prodotto completo, non sola collezione o sottocategoria.
- Materiale gioiello: soltanto metalli espliciti nella fonte, nessuna purezza
  inferita e nessuna descrizione marketing usata come materiale.
- Ricerca russa dei nuovi titoli; filtri modello e SKU invariati.
- Layout, sei card, colori, foto/zoom, navigazione, roller ON, prezzo e chat
  restano invariati. Nessun endpoint, dato, prezzo o post viene modificato da questa PR.

## Gate

Node 24 `npm run verify` richiesto sul candidato.
UAT browser 430x932 e 1440x900: BLOCKED, collegamento CUA non disponibile.
Non fondere la PR né attivare i gioielli finché l'UAT non è completato.

Esercitare: brand Cartier/VCA, categoria anelli/pendenti, ricerca russa e SKU,
prezzo min/max, apertura prodotto/zoom, misura senza etichetta EU per anelli,
nessuna falsa conferma stock non-ON, chat simulata e ritorno allo stesso filtro.
Conservare la precedente scheda ON e LV aperta durante il rilascio per regressione.

requested_by_tool: codex
requested_by_task: 01a0214c-98c9-7852-9e6d-fd1410b15e31
