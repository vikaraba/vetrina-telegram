# ON size grid — candidate, NOT released

Approved change: centered size verification below price; persistent order button
at bottom on phone/Mac; ON multi-size OR filter; grid and revocable restock opt-in.
Baseline frontend6af666f. Backend PR https://github.com/vikaraba/CRM/pull/595.
No production backend migration or Pages merge has happened for this candidate.

## Evidence 27 September2026

- npm verify:59/59 PASS; eight public assets, no fixture or prototype transport.
- Real local candidate, browser responsive emulation:430x932 and1440x900 screenshot
  review PASS. Product gallery retains original proportions/white background;
  size action is below RUB price, order action at bottom; separate hierarchy.
  Size grid distinguishes solid positive/dashed bell/unknown?, readable in light
  and dark; dialog hides order dock, back/close returns focus. No horizontal page
  overflow at320x568,390x844,430x932,440x956,932x430,1440x900; action height52px
  except76px wrapped text at320px. This is not physical iPhone certification.
- Exercised product344: open grid, choose38, stock result, order draft keeps
  exactreference3WE30414807, EU38 and post/c/3920029691/8354/9602; no message sent.
- Soldout36: explicit subscribe and cancel against isolated local transport;
  no real subscription. Two API commands retain exact model+size.
- Catalog selections38+38.5 OR return5 exact fixture products; open/return
  preserves both chips and5results. No product-detail prefetch for filters.
- Network error remains unknown, not soldout; choose-for-clarification remains
  usable and final order draft still goes to buyer_rome.
- Comparative navigation-to-heading-visible samples (ms, includes automation
  transport; local API fixture, images may be cached, NOT full cold real network):
  phone baseline149/137/133; candidate136/131/128;
  Mac baseline130/131/135; candidate140/142/134. No material local regression.
- Backend cloud staging:13 official sizes fetched/validated in338ms; authless
  availability and worker requests401. This is backend latency, not Telegram UAT.

## Blocking remaining evidence

CRM main4fec832 adopted mandatory RELEASE-UI-QUALITY/UATv2 during this work.
Physical Safari/PWA iPhone, VoiceOver, complete final-SHA control matrix,
private persisted screenshots+hashes, full cold/warm network measurements and
previous-open-tab continuity must be completed. The existing general CRM UAT
also reports preexisting Catalogo/Analytics failures; no CRM Sites deploy is
included here. Do not mark missing cases PASS or merge Pages to bypass the gate.

Production order after passing gates: backend reviewed/main+CI, exact migration,
Edge versions, warm real inventory, then frontend Pages main once. Compare live
asset hashes with build and test old tab. Roll back frontend to6af666f if needed;
do not erase restock consent, CRM rows, images, or Telegram history.

Catalog discovery agent cadence proposed6hours, awaiting owner confirmation.
No heartbeat has been activated. Existing cloud inventory worker is a different
component: it refreshes previously approved ON models, not new brand discovery.

## Cartier pilot presentation check (27 September)

The separate CRM category work (PR598) prepared three unpublished Cartier
records with24official images. Its new prices/translated descriptions are
local fixture proposals, not applied runtime data: the old import RPC failed
its source-neutral FX constraints and rolled back. Do not activate these
products from a successful preview alone.

At430x932 the actual frontend, isolated preview transport, exercised gallery
1/9→9/9, zoom150%, close/focus return, explore Cartier and a simulated order
to buyer_rome. This exposed the untranslated phrase `on chain`; the customer
title, Russian search and order now render `на цепочке`, with source name,
reference, layout and pricing untouched. A regression covers all three uses.
The full verification has60tests and8public assets; this does not supersede
the blocking final-SHA, physical-device and performance evidence above.
