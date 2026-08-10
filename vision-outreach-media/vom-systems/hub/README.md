# VOM Systems — the house hub

Landing page for every system product, **plus the canonical `products.json`** that every
product landing page fetches live (served here with `Access-Control-Allow-Origin: *`).

**To change any product's copy, pricing, or parts:** edit `_build/products.json`, run
`node _build/build.js`, then commit & push this hub repo — all product pages pick it up live.
