# Regole per agenti — Mini App

- Questo è il frontend cliente canonico. Prima del lavoro leggere `README.md`;
  API, dati e regole business restano in `vikaraba/CRM`.
- Branch dedicato e PR, mai modificare direttamente `main`. Pages pubblica
  `main:/`: il merge è un rilascio pubblico e richiede approvazione esplicita.
- Nessun token, initData, cookie, fixture privata o dato cliente nel repository.
  I test non inviano messaggi né creano ordini reali.
- Prima della consegna eseguire `npm run verify` con Node 24.

## Velocità obbligatoria dal design

Per decisione del proprietario del 26 settembre 2026, ogni funzione e rilascio
deve rispettare il contratto condiviso
[`RELEASE-PERFORMANCE.md`](https://github.com/vikaraba/CRM/blob/main/docs/RELEASE-PERFORMANCE.md)
del repository CRM. Leggerlo prima di progettare o rilasciare. Se non è ancora
su main, usare la PR di adozione collegata nel documento locale, senza fingere
che la policy sia già distribuita.

- Definire budget di caricamento, risposta al tap e payload prima del codice.
- Misurare tutti i flussi descritti in `docs/performance-release.md` su iPhone
  e Mac, cache fredda/calda, candidato e versione precedente comparabili.
- Associare le prove agli SHA esatti frontend/backend. Misure assenti,
  regressioni oltre budget, timeout o blocchi vietano di dichiarare la release
  pronta. Una CI verde non prova la velocità percepita.
- Eseguire il collaudo prima del merge: Pages non offre un intervallo sicuro
  tra merge e produzione. Documentare separatamente emulazione e Telegram su
  iPhone fisico; un browser fuori Telegram non prova il flusso autenticato.
- Conservare originali delle foto separati da cover e varianti pubbliche
  ottimizzate. Non bloccare contatto o lettura per analytics non essenziale;
  non saltare mai firma, verifiche reali o audit obbligatorio per guadagnare tempo.
- Non attivare telemetria, trasformazioni a consumo o altri costi implicitamente.
