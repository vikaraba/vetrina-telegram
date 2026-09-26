# Vetrina Telegram

Interfaccia cliente canonica della Mini App `buyer_rome_crm`, servita da
[GitHub Pages](https://vikaraba.github.io/vetrina-telegram/) e aperta da
[Telegram](https://t.me/aerofeevaBot/katalog).

## Confini

- Questo repository contiene il frontend, non una copia dei dati CRM.
- Le API e regole business restano nel repository privato `vikaraba/CRM`.
- `telegram-storefront` valida sul server ogni `initData` firmato. Nessuna chiave
  Supabase o Telegram viene inclusa nel frontend.
- Fuori da Telegram si mostra l'ingresso sicuro: non si espone uno snapshot.
- Nessun ordine o messaggio viene inviato automaticamente dal pulsante ordine:
  viene aperta la chat `@buyer_rome` con una bozza professionale da confermare.
- Questa UI non crea/modifica post Telegram e non gestisce pubblicazioni.

## Contratti preservati

Deeplink `startapp=product_ID`: prima richiesta soltanto al prodotto specifico,
mai al catalogo completo. Il catalogo viene caricato solo dopo navigazione
esplicita. `explore=1` segue tutte le successive richieste prodotto/taglia;
la verifica della firma server resta invariata.

Ogni richiesta invia `x-telegram-init-data` e contesto client versionato
`telegram-webapp-client-v1`. Il secondo è `client_reported`, non identità.
Nessuna persistenza applicativa di questi dati in localStorage/cookie.

Prezzo cliente soltanto RUB positivo, altrimenti “Цена уточняется”.
La scelta della misura non dichiara stock: conferma esplicita nel roller,
`size-interest`, polling `size-status`, poi disponibile/non disponibile/
da chiarire/errore. Timeout e risultati tardivi non possono confermare una
misura diversa. Retry ambiguo riusa l'event ID/check ID, senza nuova richiesta.

Il contatto non attende analytics. Foto/zoom, ricerca e filtri riusano i nomi
evento ammessi. Aperture prodotto e interesse misura restano registrati dal
backend; nessun prefetch di dettagli genera aperture artificiali.

## Layout

Catalogo minimale multibrand, sei card complete sui viewport mobile collaudati,
prezzi RUB, ricerca SKU/LV/лв, brand, modello, genere, categoria, colore e budget.
Le pagine API vengono raccolte fino al totale, non solo i primi100 elementi.
Le foto complete sono richieste soltanto aprendo il prodotto. La griglia carica
solo cover; dettaglio con miniature differite e zoom; barra superiore persistente
con “В каталог” e “Другие модели”.

Il filtro globale per misura **non è attivato**: l'API lista corrente espone
soltanto `sizeCount`, non i valori. Le misure reali sono selezionabili nel dettaglio.
Non si scaricano tutti i dettagli per simulare quel filtro, inquinando le aperture.

## Verifica e rilascio

Le prestazioni sono un requisito dal design: applicare sempre
[la checklist prestazionale](docs/performance-release.md), con prove di tutte
le funzioni su iPhone e Mac e confronto alla versione precedente. Il gate di
codice non sostituisce queste misure end-to-end.

Node24, nessuna dipendenza da installare:

```sh
npm run verify
```

Il build locale produce in `dist/` solo sei asset pubblici e il manifest SHA256.
Il workflow PR esegue un gate unico, annulla le revisioni obsolete e ignora draft.
Pages usa la configurazione esistente `main:/`; `_config.yml` esclude script,
test e documenti. Il merge è quindi il confine di rilascio pubblico.

Collaudo locale isolato, con un file di fixture customer-only:

```sh
MINIAPP_UAT_FIXTURE=/absolute/path/to/customer-products.json npm run preview
```

Porta43135, bind127.0.0.1; CSP blocca API esterne. Il trasporto/SDK di test è
iniettato solo da quel server, escluso da Pages. Non equivale a una verifica
autenticata in Telegram o su iPhone fisico.

Prima del merge: gate e UAT della revisione finale, main ancora sulla base attesa.
Dopo: una sola build Pages sull'esatto SHA, confronto hash dei sei asset live,
controlli di accesso, release record GitHub con rollback al precedente SHA.
Non rilanciare deploy verdi sullo stesso SHA.

Per backend compatibile, evidenze e limiti vedere [release](docs/release-20260926.md).
