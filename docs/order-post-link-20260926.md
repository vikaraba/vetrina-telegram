# Bozza Ordina: riferimento al post Telegram

Richiesta: aggiungere il link al post originale nel messaggio cliente preparato.
Baseline main: f12b4b7afa9db5346dde52f5883550f09ca31b3c.

Differenza unica: campo opzionale `telegramPostUrl` da API, validato e aggiunto
alla bozza russa sotto `Публикация в каталоге:`. Nessun cambio a layout, misure,
prezzi, destinatario `@buyer_rome`, analytics o invio (sempre manuale).

Backend richiesto: CRM migration
`20260926130444_add_storefront_order_post_link_v1`. L'Edge corrente propaga già
il campo senza deploy. Prima pubblicazione cliente valida in destinazione
registrata attiva; non URL fornitore né un post attribuito al clic preciso.
I link di lancio `product_ID` non distinguono pubblicazioni multiple.

Senza post/campo nuovo, il messaggio precedente resta identico. Validatore
ammette soltanto URL HTTPS t.me di messaggi e rifiuta query, inviti, profili,
host contraffatti e righe aggiuntive. Il cambio prodotto non eredita il link.

Node 24 `npm run verify`: 35/35 test, syntax e build PASS.
UAT browser iPhone 430x932 e Mac 1440x900: non attestato; CUA era indisponibile
all'ultimo controllo. Prima del merge verificare Ordina dal dettaglio, dock e
misura, con post/senza post/cambio modello. Nessun invio vero durante i test.

PR separata dalla preparazione gioielli #11; non dipende da quelle modifiche.
Merge Pages e migrazione produzione richiedono ciclo di rilascio approvato.

requested_by_tool: codex
requested_by_task: 01a0214c-98c9-7852-9e6d-fd1410b15e31
