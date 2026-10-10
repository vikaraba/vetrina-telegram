# Mini App: staging da telefono (non produzione)

Questa procedura riguarda il candidato del catalogo russo. Il frontend
operativo di GitHub Pages e il link BotFather `@aerofeevaBot/katalog` restano
invariati fino al rilascio coordinato. Non usare il link BotFather operativo
come prova dello staging: apre il frontend di produzione.

## Build isolata

Con Node 24, `MINIAPP_TARGET=staging node scripts/build.mjs` produce
`dist-staging/` e sostituisce **solo** l'URL della Edge Function con il progetto
staging `zwhdxuiuhtxugvhzopjo`. Il build normale continua a produrre `dist/`
con l'URL produzione `dbgcpgteuwkxqjgvppfp`, byte per byte identico al
sorgente. Nessun token è incluso nei file pubblici. Il test
`build-target.test.mjs` rifiuta mix dei due endpoint e target sconosciuti.

La build staging non è di per sé un ambiente sicuro da pubblicare. Prima di
ospitarla occorre verificare il backend e bloccare esplicitamente gli effetti
esterni: analytics/size-interest scrivono dati, e il pulsante ordine apre la
chat reale `@buyer_rome`. Una semplice sostituzione dell'URL API non simula
queste azioni e non dimostra che i sender dello staging siano disattivati.

## Gate per un link di prova reale

1. C, unico owner del rilascio, coordina le PR backend compatibili, il ledger
   e il deploy della Edge Function nello staging. Prova risposta e schema
   con una sessione Telegram firmata, senza dati o messaggi cliente reali.
2. Verificare che l'assortimento di staging sia sintetico/anonimizzato e
   sufficientemente completo per brand, categorie, prezzi, gallerie e stati.
   La lettura del 10 ottobre 2026 contava solo 79 righe `catalog.products`:
   non è prova di copertura dell'intero catalogo. Non copiare produzione
   implicitamente e non trattare errori/foto mancanti come esaurito.
3. Certificare in staging che webhooks, job di verifica taglia e sender non
   contattino clienti o Anastasia. Se questo controllo manca, testare solo
   letture e navigazione; ordine e verifica taglia restano simulati nel
   preview locale, non nel backend remoto.
4. Ospitare `dist-staging/` su HTTPS separato. Prima di renderlo pubblico,
   verificare che l'API rifiuti richieste senza `initData` valida e che
   nessun dato privato sia nel bundle o nelle risposte anonime.
5. Aprire il frontend tramite un WebApp button di test autorizzato, non
   cambiando BotFather per il bot dei clienti. La firma deve essere
   verificata con il token del bot che ha aperto la pagina. Il secondo bot
   `@BuyerErofeevaBot` non è automaticamente configurato per la Mini App.

## Matrice UAT iPhone e Mac

- iPhone fisico dentro Telegram e Mac: apertura generica e deeplink al
  prodotto/post esatto, ricerca cirillica e SKU, filtri brand/genere/tipo/
  modello/prezzo, recenti e sconti solo se metadati approvati presenti.
- ON, Louis Vuitton, Van Cleef, Messika e le categorie con prezzo RUB valido:
  conteggio esatto, nessun duplicato o scheda nascosta rivelata, foto cover,
  galleria/zoom, ritorno a filtri e posizione; Cartier/Chopard senza prezzo
  cliente RUB non appaiono, Messika mostra `Цена по запросу`.
- Misura: selezione, attesa, disponibile/non disponibile/incerto/errore,
  retry idempotente e nessun esito della misura precedente applicato a una
  nuova. Contatto: bozza con referenza e post originale, **senza invio**.
- Responsività 320, 390, 430 e Mac; leggibilità russa, VoiceOver/focus,
  nessun overflow. Rilevare apertura fredda/calda, risposta filtri, prima
  foto, galleria, errori e traffico su rete mobile. Registrare SHA esatto,
  dispositivo e ambiente; un test desktop ristretto non vale come iPhone.
- Provare 999/1000/1001 righe sintetiche e almeno un campione di ciascun
  catalogo reale eleggibile. I test unitari di paginazione non sostituiscono
  un backend staging che serva effettivamente il volume.

Solo dopo gate e UAT riusciti C può promuovere backend e una sola revisione
frontend in produzione, confrontando asset e SHA live e conservando rollback.
