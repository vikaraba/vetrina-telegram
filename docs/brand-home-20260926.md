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
67 On products. The first visual preview used customer-facing catalog fields.
The final release UAT instead uses 117 synthetic customer DTOs with approved
public covers, long text, missing prices, unsupported currency, and simulated
size outcomes. These are visual/contract tests, not live stock/price checks or
an authenticated physical-iPhone test. The preview transport cannot send messages.

## Final staging UAT

There is no remote frontend staging environment: GitHub Pages serves production
only. A separate localhost server on port 43137 serves the frozen six-asset build
from frontend commit `50541dae09f2443dc2700cf2142be08f14c7f212`. Only the test
HTML injects the isolated SDK/transport. Production assets remain byte-identical.

44 browser assertions passed, with no console errors:

- Home and catalog at 320×568, 375×667, 430×932, 768×1024, 932×430 and 1440×900;
  square product images, expected 2/3/4 columns, no horizontal overflow.
- Brand selection, pagination, SKU and empty search, descending price sort,
  invalid price bounds and combined brand/gender/price filters.
- Gallery navigation, 150% zoom/reset, size cancellation and explicit selection;
  available, unavailable, unknown, failed and queued availability outcomes.
- Simulated order keeps the model, reference, selected EU size and original post
  URL. Returning restores the filters; Telegram Back returns to the brand home.
- Empty/error catalog, recovery on retry, unauthenticated access with no API
  requests, product error and explicit recovery to the brand homepage.
- Direct product launch makes exactly one product request with no catalog
  prefetch; explicit exploration, browser back/forward and light/dark switching.

The JSON assertion report, build manifest and screenshots are retained in the
local `vetrina-brand-home-evidence-20260926` folder. One assertion initially used
the wrong test selector (`.card`); correcting it to `.product-card` passed without
an application change. Physical iPhone/VoiceOver and live stock checks remain
outside this browser UAT.

## Release boundary

Frontend only; no migration, Edge deployment or Telegram post edit required.
The entrypoint, CSS and changed catalog module have new cache versions; previous
entry URLs remain valid. GitHub Pages publishes `main:/`, so merging is the public
release. The user authorized production after complete staging UAT on 26 September.
Recheck the exact final SHA and Pages build,
compare all six live assets, and record the release. Rollback is a reviewed revert.
