# Checklist prestazionale Mini App

Decisione del proprietario, 26 settembre 2026. Il contratto condiviso è
[`vikaraba/CRM — RELEASE-PERFORMANCE.md`](https://github.com/vikaraba/CRM/blob/main/docs/RELEASE-PERFORMANCE.md).
L'adozione viene proposta nella [PR CRM #581](https://github.com/vikaraba/CRM/pull/581),
branch `codex/release-performance-contract-20260926`, con questa companion #14.
Prima del merge della policy consultare quel branch, non considerare un link
ancora assente su main come un PASS. La checklist locale specifica soltanto
i percorsi della Mini App: non è un contratto o un workflow concorrente al CRM.

La velocità è parte del design e dei criteri di rilascio, non un controllo
facoltativo. I test unitari e il build esistenti non misurano automaticamente
la velocità; questa checklist è per ora obbligatoria per chi conduce la UAT.

Integrare anche [qualità UI/UAT v2](https://github.com/vikaraba/CRM/blob/main/docs/RELEASE-UI-QUALITY.md)
e [fedeltà al prototipo](https://github.com/vikaraba/CRM/blob/main/docs/UI-PROTOTYPE-FIDELITY-PROTOCOL.md):
inventario completo, fotografie reali del candidato aperte e revisionate,
hash e rapporto privato, temi/zoom/focus/ritorni e prove fisiche. Nessun budget
prestazionale riduce questi obblighi. Revisione/CI di istruzioni documentali
non è un benchmark, non libera il freeze del rilascio e non autorizza Pages.

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
dataset. Applicare i sei profili canonici: 320×568, 390×844, 430×932,
440×956, 932×430 e Mac 1440×900; 430×932 resta il riferimento iPhone Pro Max.
Misurare almeno 5 campioni per flusso e profilo a cache fredda e 5 a cache calda,
sia sulla baseline sia sul candidato. Separare feedback al gesto e
completamento reale, registrando mediana, massimo, errori, timeout, richieste
e byte. Confrontare condizioni equivalenti; gli stub non provano il backend.
Safari/PWA e Telegram su iPhone fisico rimangono obbligatori e distinti
dall'emulazione; riportare dispositivo, OS/browser e viewport effettivi.

Budget iniziali condivisi: feedback ≤ 200 ms, contenuto utile iniziale ≤ 2,5 s,
risultato ordinario ≤ 3 s. Verifiche esterne/lavori lunghi hanno budget finale
esplicito e stato di attesa navigabile. Bloccare regressioni della mediana
> 20% e > 100 ms sul feedback, o > 250 ms sul risultato, oltre a qualsiasi
superamento del budget assoluto. Non chiamare questi campioni INP di utenti
reali; applicare definizioni, dettagli e vincoli del contratto CRM.

Allegare evidenza redatta per ogni riga, non screenshot senza tempi. Collegarla
al rapporto della UAT canonica (`ui_quality.report_url` nel CRM), mantenendo
identità dei controlli, SHA frontend/backend e condizioni confrontabili.
`NOT MEASURED`, `BLOCKED` e `FAIL` non autorizzano un PASS. Non trasmettere
initData, cookie, identità o messaggi dei clienti negli artefatti.

Dopo il deploy: verificare hash asset e smoke prestazionale live in sola
lettura, senza ordini o messaggi di prova. Riportare separatamente ciò che è
misurato e ciò che resta da ottimizzare. Nessuna nuova telemetria o spesa viene
attivata da questa policy.

## Stato dell'adozione e residui

Il riallineamento documentale del 27/09 usa main Mini App
`6af666fad98cfa3786a4ee7ed771137a02884822` e contratto CRM su base
`f0ae806f5e98ae2d7a69b51d3cc5a2f0263859ff`. I gate storici 36/862 non validano
i candidati aggiornati: il gate completo locale precede il passaggio a
review-ready; la CI prevista viene poi verificata sullo stesso SHA finale.
Le prove sono registrate nelle PR #14/#581 prima della consegna. Nessun asset
runtime modificato; ciò non costituisce misura di reattività.

La raccolta e la validazione automatiche dei tempi restano da implementare
nel gate canonico esistente, con budget versionati e prove redatte. Il
validatore UAT v2 controlla le prove dichiarate, non esegue il browser e non
autentica screenshot o trace. Nessun nuovo job, servizio o costo è introdotto.
Conservare autorizzazioni, prova fisica e blocchi di piattaforma; nessun merge
o deploy è incluso nella preparazione di questa PR.
