# Vetrina Telegram

La pagina della Mini App Telegram del catalogo, servita da GitHub Pages.

Contiene soltanto l'interfaccia: HTML, CSS e le chiamate all'API. Nessun dato del
CRM sta qui. I prodotti arrivano da una Edge Function che pretende `initData`
firmato da Telegram, quindi aprire questo indirizzo fuori da Telegram non mostra
nulla.

Il codice sorgente e le regole della vetrina stanno nel repository privato `CRM`.

I link prodotto pubblicati su Telegram usano `startapp=product_<id>`. La pagina
legge `Telegram.WebApp.initDataUnsafe.start_param` e, prima di chiedere il
catalogo, entra nella modalita prodotto singolo: carica soltanto quel modello,
le sue immagini e le sue taglie. L'API mantiene la verifica server-side di
`initData`; un normale ingresso senza deep link continua invece a mostrare il
catalogo.
