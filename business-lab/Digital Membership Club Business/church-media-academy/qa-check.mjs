#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CHECKS = [];
let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  const status = condition ? 'PASS' : 'FAIL';
  if (condition) {
    passed++;
  } else {
    failed++;
  }
  CHECKS.push({ name, status, details });
  console.log(`${status} | ${name}${details ? ' — ' + details : ''}`);
}

// Read index.html from the same directory as this script
let htmlPath = './index.html';

// If run from a different directory, try to find it relative to this module
if (!fs.existsSync(htmlPath)) {
  htmlPath = path.join(path.dirname(process.argv[1]), 'index.html');
}

// Fallback: look in current working directory
if (!fs.existsSync(htmlPath)) {
  htmlPath = 'index.html';
}

let html;
try {
  html = fs.readFileSync(htmlPath, 'utf-8');
} catch (err) {
  console.error(`FATAL: Cannot read ${htmlPath}`);
  process.exit(1);
}

const htmlLower = html.toLowerCase();

console.log('\n=== Church Media Academy QA Checks ===\n');

// 1. Contains <title>, <style>, <script> tags
check('Contains <title> tag', html.includes('<title>'));
check('Contains <style> tag', html.includes('<style>'));
check('Contains <script> tag', html.includes('<script>'));

// 2. Does NOT contain <!DOCTYPE, <html, <head, <body tags (check for tag openings only)
check(
  'No <!DOCTYPE tag',
  !html.match(/<!DOCTYPE/i)
);
check(
  'No <html tag',
  !html.match(/<html[>\s]/i)
);
check(
  'No <head tag',
  !html.match(/<head[>\s]/i)
);
check(
  'No <body tag',
  !html.match(/<body[>\s]/i)
);

// 3. No external requests (no http:// or https://)
const externalRegex = /(src=|href=|url\(|fetch\(|import\()\s*["']?(https?:\/\/|www\.)/gi;
check(
  'No external requests (http:// or https://)',
  !externalRegex.test(html),
  html.match(externalRegex) ? `Found: ${html.match(externalRegex).slice(0, 3).join('; ')}` : ''
);

// 4. Literal string "Simulate payment — demo mode" present
check(
  'Contains "Simulate payment — demo mode" text',
  html.includes('Simulate payment — demo mode')
);

// 5. No payment credential fields (check input/form field attributes)
const paymentFieldsRegex = /<input[^>]*(autocomplete=["']cc-|name=["'].*(?:card|cvv|cvc|expiry)|id=["'].*(?:card|cvv|cvc|expiry)|placeholder=["'].*(?:card number|cvv|cvc|expiry))/gi;
check(
  'No payment credential fields (card, CVV, expiry)',
  !paymentFieldsRegex.test(html)
);

// 6. localStorage key "cma-member-v1" referenced
check(
  'References localStorage key "cma-member-v1"',
  html.includes("'cma-member-v1'") || html.includes('"cma-member-v1"')
);

// 7. All 5 manual titles present
const manuals = [
  'The Sunday Livestream Playbook',
  'YouTube Growth for Churches',
  'Reading Your Engagement Benchmark',
  'The Volunteer Media Team Handbook',
  'Social Posts from One Sunday Sermon'
];

manuals.forEach(manual => {
  check(
    `Contains manual: "${manual}"`,
    html.includes(manual)
  );
});

// 8. All 7 report channels present
const channels = [
  'Website',
  'Google Business',
  'Facebook',
  'Instagram',
  'YouTube',
  'LinkedIn',
  'X'
];

channels.forEach(channel => {
  check(
    `Contains channel: "${channel}"`,
    html.includes(channel)
  );
});

// 9. Theming: prefers-color-scheme, data-theme="dark", data-theme="light"
check(
  'Contains CSS media query prefers-color-scheme',
  htmlLower.includes('prefers-color-scheme')
);

check(
  'Contains CSS selector for data-theme="dark"',
  html.includes('data-theme="dark"') || html.includes('[data-theme="dark"]')
);

check(
  'Contains CSS selector for data-theme="light"',
  html.includes('data-theme="light"') || html.includes('[data-theme="light"]')
);

// 10. Accessibility: prefers-reduced-motion, aria-label, :focus-visible
check(
  'Contains CSS media query prefers-reduced-motion',
  htmlLower.includes('prefers-reduced-motion')
);

check(
  'Contains at least one aria-label',
  html.includes('aria-label=')
);

check(
  'Contains :focus-visible or :focus styles',
  html.includes(':focus-visible') || html.includes('focus-visible')
);

// 11. "of 10 founding spots" counter text present
check(
  'Contains "of 10" founding spots counter',
  html.includes('of 10')
);

// 12. "Sample" tag text present
check(
  'Contains "Sample" tag text',
  html.includes('Sample')
);

// Summary
console.log(`\n=== Summary ===`);
console.log(`QA: ${passed}/${passed + failed} passed`);

if (failed === 0) {
  console.log('✓ All checks passed');
  process.exit(0);
} else {
  console.log(`✗ ${failed} check(s) failed`);
  process.exit(1);
}
