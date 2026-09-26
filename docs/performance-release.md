# Checklist prestazionale Mini App

Decisione del proprietario, 26 settembre 2026. Il contratto condiviso è
[`vikaraba/CRM — RELEASE-PERFORMANCE.md`](https://github.com/vikaraba/CRM/blob/main/docs/RELEASE-PERFORMANCE.md).
La prima adozione viene proposta sul branch CRM
`codex/release-performance-contract-20260926`; prima del merge della policy
consultare quel branch, non considerare un link ancora assente come un PASS.

La velocità è parte del design e dei criteri di rilascio, non un controllo
facoltativo. I test unitari e il build esistenti non misurano automaticamente
la velocità; questa checklist è per ora obbligatoria per chi conduce la UAT.

## Inventario da esercitare

- [ ] Apertura da Telegram e deeplink: solo il modello selezionato, senza
      scaricare l'intero catalogo in anticipo.
- [ ] Catalogo e ulteriori pagine, ricerca, filtri brand/modello/genere/colore/
      prezzo, combinazioni e reset; stato vuoto e ritorno ai risultati.
- [ ] Dettaglio, prima foto, galleria, miniature, zoom e chiusura; originali
      pesanti non scaricati indiscriminatamente per le card.
- [ ] Apertura roller, selezione/conferma misura, richiesta e polling;
      disponibile, non disponibile, da chiarire, errore e timeout; selezione
      cambiata durante l'attesa e risultati tardivi.
- [ ] Altri modelli e ritorno al catalogo con filtri e posizione preservati.
- [ ] Ordina: bozza verso `@buyer_rome` con il post originale quando presente,
      senza invio reale e senza attendere analytics.
- [ ] Sessione scaduta, rete degradata, analytics lento e asset aggiornati
      mentre una scheda della versione precedente è ancora aperta.

Nuove funzioni aggiornano questo inventario nella stessa PR.

## Evidenza richiesta prima del merge

Annotare SHA frontend/backend e baseline, dispositivo/OS/browser, rete e
dataset. Su iPhone Pro Max 430×932 e Mac 1440×900 misurare almeno 5 campioni
per flusso a cache fredda e 5 a cache calda. Separare feedback al gesto e
completamento reale, registrando mediana, massimo, errori, timeout, richieste
e byte. Confrontare condizioni equivalenti; gli stub non provano il backend.
Il collaudo Telegram su iPhone fisico rimane distinto dall'emulazione.

Budget iniziali condivisi: feedback ≤ 200 ms, contenuto utile iniziale ≤ 2,5 s,
risultato ordinario ≤ 3 s. Verifiche esterne/lavori lunghi hanno budget finale
esplicito e stato di attesa navigabile. Bloccare regressioni della mediana
> 20% e > 100 ms sul feedback, o > 250 ms sul risultato, oltre a qualsiasi
superamento del budget assoluto. Non chiamare questi campioni INP di utenti
reali; applicare definizioni, dettagli e vincoli del contratto CRM.

Allegare evidenza redatta per ogni riga, non screenshot senza tempi.
`NOT MEASURED`, `BLOCKED` e `FAIL` non autorizzano un PASS. Non trasmettere
initData, cookie, identità o messaggi dei clienti negli artefatti.

Dopo il deploy: verificare hash asset e smoke prestazionale live in sola
lettura, senza ordini o messaggi di prova. Riportare separatamente ciò che è
misurato e ciò che resta da ottimizzare. Nessuna nuova telemetria o spesa viene
attivata da questa policy.
