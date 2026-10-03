# Contatto prodotto: copertura verificata (issue CRM #718)

Questo incremento cambia solo il testo generato dalla Mini App. Nessun post
Telegram, coda, database o ambiente viene modificato.

| Ingresso | Identità disponibile oggi | Link nel messaggio ad Anastasia | Limite aperto |
| --- | --- | --- | --- |
| Scheda della Mini App, con post | ID prodotto e `telegramPostUrl` validato dal read model | Post restituito dall'API + scheda Mini App esatta | Il read model sceglie il primo post pubblicato, non conosce il post cliccato dal cliente. |
| Scheda della Mini App, senza post | ID prodotto positivo e sicuro | Scheda Mini App `startapp=product_ID` | La scheda richiede una sessione Telegram valida e che il prodotto resti visibile. |
| Nuovi post fornitore Denis | ID pubblicazione nel sender CRM | Link firmato al post esatto dopo attivazione separata di #710/#18 | Non attivo finché la credenziale HMAC non è configurata; i vecchi post non vengono modificati. |
| Post ON | Referenza nella CTA `buyer_rome?text=ON…` | Referenza, non identità del post cliccato | Serve adattare il sender con l'ID pubblicazione dopo l'invio. |
| Altri publisher CRM (Gucci, Cartier, LV, VCA, manuali) | Dipende dal sender e dalla destinazione | Non certificato da questo incremento | Censire CTA e post pubblicato per ogni fonte prima di dichiarare copertura totale. |

Regola proposta per la prossima fase: trasportare la **pubblicazione di
destinazione** firmata, non solo l'ID prodotto o il post sorgente. Quando il
post non esiste, usare solo la scheda Mini App con ID prodotto validato. Non
ricavare mai un link dal sito del fornitore, da un payload privato o da un URL
arbitrario. Conservare la taglia nel testo, ma non costi, margini o note CRM.

La conferma reale del deep link su iPhone/Telegram e la prova multi-post
richiedono UAT autenticata prima di un rilascio pubblico di questo incremento.
