# Contatto prodotto: copertura verificata (issue CRM #718)

Questo incremento client aggiunge anche il lancio `startapp=publication_ID`,
che richiede il read model CRM v3 della issue #718. Non modifica post Telegram,
coda o ambienti. La migrazione CRM e il client devono superare lo stesso gate
prima di essere attivati insieme.

| Ingresso | Identità disponibile oggi | Link nel messaggio ad Anastasia | Limite aperto |
| --- | --- | --- | --- |
| Lancio Mini App da un post con `publication_ID` firmato | ID pubblicazione verificato dal server e read model CRM v3 | Post cliccato esatto + scheda prodotto | Serve che il publisher emetta il nuovo deep link; nessun vecchio post viene modificato. |
| Scheda della Mini App aperta dal solo prodotto, con un unico post | ID prodotto e `telegramPostUrl` validato dal read model v3 | Unico post pubblicato + scheda Mini App esatta | Non equivale a una prova del post cliccato. |
| Scheda della Mini App aperta dal solo prodotto, con più post | Solo ID prodotto | Scheda Mini App esatta, nessun post arbitrario | Non attribuire il primo post al clic senza `publication_ID`. |
| Scheda della Mini App, senza post | ID prodotto positivo e sicuro | Scheda Mini App `startapp=product_ID` | La scheda richiede una sessione Telegram valida e che il prodotto resti visibile. |
| Nuovi post fornitore Denis | ID pubblicazione nel sender CRM | Link firmato al post esatto dopo attivazione separata di #710/#18 | Non attivo finché la credenziale HMAC non è configurata; i vecchi post non vengono modificati. |
| Post ON | Referenza nella CTA `buyer_rome?text=ON…` | Referenza, non identità del post cliccato | Serve adattare il sender con l'ID pubblicazione dopo l'invio. |
| Nuovi post Gucci, Cartier, Louis Vuitton, Van Cleef e ON dai sender CRM | ID pubblicazione nel sender | Template comune con link firmato al post esatto, se configurato e se entra nella didascalia | Richiede migrazione CRM v3, deploy dei sender e UAT; il vecchio post non viene modificato. |
| Post manuali già importati | ID pubblicazione e URL Telegram nel CRM | Resolver firmato disponibile per un link nuovo verso la pubblicazione | I vecchi post non vengono modificati in massa; non hanno automaticamente una nuova CTA. |

Il template comune CRM prepara il link firmato per i cinque sender di marca.
La prossima fase deve validare i post futuri realmente emessi e individuare le
CTA dei flussi legacy/manuali che non usano quei sender. Quando il post non
esiste, usare solo la scheda Mini
App con ID prodotto validato. Non ricavare link dal sito del fornitore, da
payload privati o da URL arbitrari. Conservare la taglia nel testo, non costi,
margini o note CRM.

La conferma reale del deep link su iPhone/Telegram e la prova multi-post
richiedono UAT autenticata prima di un rilascio pubblico di questo incremento.
