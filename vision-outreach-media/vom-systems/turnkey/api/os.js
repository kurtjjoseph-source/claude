// GET /os  (rewritten here by vercel.json)
//
// The gate is the door, not a curtain: with no valid session this returns the unlock
// screen and the OS markup is never sent. Both screens are generated into
// `_lib/os-app.js` by `_build/build.js` from `_build/turnkey-os.html`, so the OS source
// of truth lives with the rest of the house copy and never sits in the public folder.

'use strict';

const { currentSession } = require('./_lib/gate');

let pages;
try {
  pages = require('./_lib/os-app');
} catch {
  pages = null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Referrer-Policy', 'same-origin');

  if (!pages) {
    res.status(500).send('<h1>OS not built</h1><p>Run <code>node _build/build.js</code> and redeploy.</p>');
    return;
  }

  const session = await currentSession(req);
  if (!session) {
    res.status(401).send(pages.gate);
    return;
  }
  res.status(200).send(pages.app);
};
