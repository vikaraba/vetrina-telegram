# Contatto prodotto: copertura verificata (issue CRM #718)

Questa tabella descrive il candidato Mini App #22 (head `4c330056`) e i touchpoint richiesti da #718. Non prova merge o rilascio. La regola approvata dall'utente è mostrare soltanto prodotti con almeno un post Telegram già pubblicato; i prodotti `READY` o mai pubblicati restano nascosti.

| Ingresso | Identità e comportamento | Messaggio a `@buyer_rome` | Stato e limite |
| --- | --- | --- | --- |
| Mini App aperta dal post con `publication_ID` firmato | ID pubblicazione validato dal backend e collegato al prodotto | Post esatto cliccato + scheda esatta | Candidato #22; UAT autenticata su Telegram/iPhone `NOT_TESTED`. Nessun vecchio post modificato. |
| Scheda prodotto aperta da `product_ID`, con un solo post Telegram pubblicato | ID prodotto e permalink pubblicato validato | Post unico + scheda esatta | Candidato #22. Non prova quale post sia stato cliccato senza `publication_ID`. |
| Scheda prodotto aperta da `product_ID`, con più post pubblicati | Non sceglie arbitrariamente il primo post | Solo scheda esatta del prodotto | Candidato #22; UAT multi-post `NOT_TESTED`. Per attribuire il clic serve l'ID della pubblicazione. |
| Prodotto già ammesso perché ha post pubblicati, ma il contesto non identifica un permalink esatto utilizzabile | Fallback `startapp=product_ID`; il prodotto deve essere già ammesso dal backend in base a pubblicazioni Telegram | Scheda esatta, senza inventare o scegliere un post | Vale, per esempio, se un prodotto pubblicato con più post è aperto da `product_ID`. Non rende visibile un prodotto mai pubblicato, compreso `READY`. |
| Nuovi post fornitore Denis (proposta precedente #710/#18) | La proposta prevedeva l'ID pubblicazione nel sender | Post esatto tramite link firmato, se implementazione e configurazione lo supportano | Stato attuale di #710/#18, HMAC, deploy, UAT e produzione `UNKNOWN` / `NOT_TESTED`. Non inferire copertura dal CRM #816. Nessun vecchio post modificato. |
| Post ON | Il sender candidato include il link firmato alla pubblicazione e il link Mini App ON | Post preciso + scheda ON | CRM #816 head `8ca3396`: review Claude SUCCESS status `56113404362` alle `2026-10-12T04:20:21Z`. Integrato nel candidato PR #794 con merge commit `543afd6c614fcd4cf652d2bf8fac1bec3b99c079` (non in `main`). CI run 1811 / run `38204973208` / job verify `114666336737`: SUCCESS, 1.767 test passati, 0 falliti, 328 file di test. Review sul nuovo SHA `543afd6c` pending; staging, UAT e produzione `NOT_TESTED`. |
| Nuovi post Gucci, Cartier, Louis Vuitton, Van Cleef e ON dai sender CRM | Il candidato sender aggiunge il link esatto e rifiuta l'invio se non può applicarlo | Link alla pubblicazione corretta | Il merge `543afd6c` integra il codice candidato #816 nel candidato #794, non in `main`. CI verde sul nuovo SHA; review `543afd6c` pending, staging/UAT/live `NOT_TESTED`. Nessuna prova di disponibilità ai clienti. |
| Post manuali o storici già importati | Resolver solo per pubblicazioni verificate; nessun inserimento retroattivo di CTA | Nessuna modifica automatica ai post esistenti | Inventario storico `no_edit` e piano read-only ancora da completare. Non sono stati modificati post. |

## Confini della prova

Il codice companion #19 è rappresentato nei candidati #20/#22, ma #19, #20 e #22 non risultano integrate o ospitate nelle evidenze raccolte. Il codice CRM #816 ha superato review Claude e CI prima dell'integrazione nel candidato #794 `543afd6c`; la review del nuovo SHA è pending. Staging/UAT e produzione restano `NOT_TESTED`. Non dichiarare la funzione disponibile ai clienti prima dei gate sullo SHA finale.

Misura selezionata, passaggio fra più pubblicazioni e navigazione effettiva in Telegram su iPhone sono `NOT_TESTED` in UAT reale. I test sintetici non sostituiscono queste prove.

La descrizione russa esposta è protetta da approvazione/audit. I campi strutturati `nome` e `colore` sono forniti dal server, ma la loro approvazione come testo cliente non è dimostrata: provenienza privacy `UNKNOWN`. Non è stato osservato alcun dato sensibile divulgato e non si afferma che esista una fuga.

La regola `no_edit` resta valida: nessun edit o invio massivo dei post storici. Non ricavare permalink da fonti fornitore, payload privati o URL non verificati; non includere costi fornitore, margini o note CRM nel testo cliente. Conservare la taglia scelta nel messaggio.
