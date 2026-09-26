# Brand homepage and larger product photos

Baseline: `2365ac67d887bd15263c586688eefd34d52e31c1`.

Generic Telegram launches now open the brand homepage. Cards derive from the
authenticated catalog list, with the existing product covers, categories and
counts. Selecting a brand resets unrelated filters and opens its products;
“Все товары” opens the complete catalog. Product launches still go directly to
the requested product, and only explicit catalog navigation enables exploration.
Home and catalog reuse one list request sequence; no product details are prefetched.

The old product image height depended on viewport height and squeezed six cards
onto the screen. Short phones even switched to three columns. Product cards now
use square contain-fit images with two columns on phones, three on tablets and
four on desktop. Original photos and the full-image gallery are unchanged.

## Verification

- Node 24 `npm run verify`: 38 tests, syntax checks and six-asset build passed.
- Local browser UAT: 430×932, 375×667, 320×568 and 1440×900. No horizontal overflow.
- 430 px phone: image content box increases from 191×149 to 191×191 CSS pixels.
- 375 px phone: two columns, 164 px image height; 320 px: two columns, 136 px.
- Desktop: four columns with 313 px image height. Input font remains 16 px.
- Brand entry, all-products entry, home return, browser back/forward, search,
  filters and detail return passed. Search text and selected brand survived return.
- Search with no matches shows the existing reset action. Light/dark home checked.
- Direct `product_343` launch opened Cloudnova X without rendering the homepage;
  “Другие модели” loaded the On catalog. Browser console errors: none observed.
- Unit coverage includes future brand/category grouping and an empty catalog.

The read-only live catalog query on 26 September returned 50 Louis Vuitton and
67 On products. Local UAT uses only customer-facing fields: current list IDs and
covers combined with an existing customer DTO fixture for details. Missing data
stays unconfirmed. These are visual/contract tests, not live stock/price checks or
an authenticated physical-iPhone test. The preview transport cannot send messages.

## Release boundary

Frontend only; no migration, Edge deployment or Telegram post edit required.
The entrypoint, CSS and changed catalog module have new cache versions; previous
entry URLs remain valid. GitHub Pages publishes `main:/`, so merging is the public
release. Obtain release approval, recheck the exact final SHA and Pages build,
compare all six live assets, and record the release. Rollback is a reviewed revert.
