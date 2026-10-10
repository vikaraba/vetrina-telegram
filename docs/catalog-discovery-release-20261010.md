# Catalogo russo multibrand — candidato, non produzione

requested_by_tool: codex
requested_by_task: 01a0214c-98c9-7852-9e6d-fd1410b15e31

## Autorizzazione e composizione

Richiesta diretta: completare la catena di rilascio del minisito avanzato,
ispirato al prototipo Lamoda approvato, accessibile ai clienti da Telegram.
Questo ramo include il candidato Mini App #20 (0ea5b63), già comprensivo
di #17/#19, su main Pages 51f98eb. Non fare due merge/deploy successivi:
il coordinatore C sceglie un unico candidato completo dopo i prerequisiti.
La main Pages è pubblicata automaticamente da main:/; un merge è un deploy.

La richiesta è registrata nella coda canonica, handle
20261010T181047Z-a03b1a. Il coordinatore mantiene il solo ruolo di merge/deploy.
Nessun DDL, import, repricing, scrittura commerciale o messaggio Telegram
è incluso in questa modifica frontend.

## Implementazione

- Catalogo iniziale direttamente ricercabile; categorie, brand multipli,
  uomo/donna, tipo, modello/collezione, colore, materiale quando fornito,
  budget, ordinamento, selezioni removibili e conteggi dinamici.
- Due colonne mobili; sei su Mac >=1280px. Sei schede complete a430x932.
  Sfondo bianco, testo scuro, foto proporzionate senza crop.
- Preferiti di sessione (non identità persistente), suggerimenti, ricerca
  cirillica e per referenza, caricamento progressivo12+12.
- API firmata esistente, paginazione completa e nessun prefetch di dettagli
  per simulare filtri. Conservati deep link prodotto/pubblicazione,
  galleria completa, zoom, roller, verifica misura, analytics e bozza
  @buyer_rome con il post esatto. Ritorno conserva filtri, scroll e focus.
- Cartier/Chopard senza prezzo cliente RUB restano esclusi; Messika ammette
  soltanto l'eccezione esplicita on_request.
- Nessuna fixture o simulazione nel build pubblico. Il server locale
  sostituisce SDK/trasporto solo per UAT senza effetti esterni.

## Contratto dati avanzato: requisiti ancora da integrare

Il normalizzatore accetta soltanto campi customer-safe espliciti:

| Funzione | Dati necessari | Comportamento se mancanti |
|---|---|---|
| Recenti7/30/90giorni | publishedAt valido, non futuro | nessuna data inferita da ID/import |
| Sconti | discountVerified=true, previousPriceAmount e previousPriceCurrency=RUB | nessuno sconto fonte EUR spacciato per cliente |
| Multimisura disponibile | availableSizes + availabilityCheckedAt + availabilityValidUntil | nessuna misura dedotta dalla griglia taglie |
| Materiale | fatti espliciti tradotti nel DTO lista | nessun dettaglio pre-caricato per riempire filtri |

I campi opzionali sono un requisito per il backend, NON prova che il backend
li produca. Le selezioni non disponibili sono spiegate in russo. Non chiamare
queste funzioni operative prima di UAT con contratto live completo.
La scadenza della disponibilità è decisa dal server, non da un TTL inventato
nel frontend. Al clic della taglia resta necessaria la verifica reale.

## Verifiche locali

Node24.19.0, npm run verify:79/79, sintassi e build allowlist10asset.
Coperti999/1000/1001 prodotti, identità e conteggi, OR entro faccetta/AND
fra faccette, no falsi sconti/date/stock, scadenze, prezzi RUB e Messika.

Chrome profilo CRM Agenti, fixture18prodotti con foto pubbliche approvate:
320x568,390x844,430x932,768x1024,1440x1000 senza overflow orizzontale.
Le prove sono responsive su Mac, NON iPhone fisico/Telegram WebView.
Catalogo mobile430x932: sesta scheda termina a891.6px,12foto caricate.
Mac1440x1000: sei colonne, sesta scheda termina a652.2px.
Provati ON+donna=5, budget20mila=6, ricerca ванклиф=6, invalidazione
min>max, preferiti, ritorno stessa selezione, galleria7foto/zoom150%,
misura38 e bozza con post9600 del prodotto343 (trasporto simulato).

Prestazioni locali: primo catalogo osservato177–576ms (fixture/rete locale);
ricerca+8faccette su1001righe Node:13.0–22.9ms per giro; asset iniziali
circa42KB gzip esclusi foto. NON è un benchmark di rete mobile o API reale.
Una prima UAT ha fallito per allowlist asset del server locale incompleta:
corretta senza modificare i confini di isolamento. Un overflow era limitato
all'output diagnostico QA e corretto con overflow-wrap.

## Blocchi nativi riscontrati prima della promozione

1. CRM #778 e Mini App #20 risultano ancora aperte alla verifica10/10.
   Nessun commit status claude/review sui due head verificati.
2. Edge telegram-storefront produzione v12, letta tramite connettore:
   GET product richiede id e non risolve publication_id. La migration SQL
   #778 da sola non aggiorna il consumer Edge. Non rilasciare #20/questo
   ramo prima del runtime compatibile #719 selezionato dal coordinatore.
3. Il contratto lista di discovery avanzata non è ancora dimostrato live.
   Mancano staging/UAT autenticata e prova iPhone/Telegram del candidato.
4. Tutti i prodotti significa tutti gli eleggibili restituiti dal CRM:
   il frontend non può forzare hidden, disponibilità, approvazione prezzo
   o completezza foto. L'espansione dati richiede il lotto canonico verificato.

## Catena da chiudere, senza bypass

Review finale -> backend minimo compatibile staging -> UAT API/Telegram
e perf sul candidato congelato -> backend produzione secondo registro ->
un solo merge Pages -> confronto asset live per SHA -> verifica cliente
autenticata -> record immutabile/rollback. Verificare nuovamente lo stato
live prima di ogni promozione. Rollback frontend: main precedente51f98eb,
compatibilità backend da mantenere; non cancellare dati o post.
