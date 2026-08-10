=== Standalone HTML Importer ===
Contributors: kurtjoseph
Tags: html, import, landing page, static page
Requires at least: 5.8
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.1.1
License: GPLv2 or later

Import standalone HTML files (AI-generated pages, reports, landing pages) as real pages on your WordPress site.

== Description ==

Got a self-contained HTML file — a Claude/AI-generated landing page, a report, a one-off microsite page — and want it on your WordPress site with its own URL?

Upload it (or paste the HTML) under **HTML Pages → Import HTML** and it becomes a published page at `/html/your-slug/`.

Two display modes:

* **Standalone** — the file is served exactly as-is, pixel-perfect, with an optional slim navigation bar at the top (site name + your primary menu) so visitors can get back to the rest of the site.
* **Themed** — the page's `<body>` content plus its styles/scripts are embedded inside your theme, so it gets your normal header, menu, and footer automatically.

Imported pages behave like normal WordPress content: they show up in the menu editor (Appearance → Menus), in site search, and can be edited later (HTML source, mode, and nav bar are all editable on the page's edit screen).

Notes:

* Works best with self-contained HTML (inline CSS/JS, remote or data-URI images). Files that reference local asset folders (`./assets/style.css`) need those assets hosted separately.
* Only administrators can import. Users without the `unfiltered_html` capability get their HTML sanitized.

== Installation ==

1. Upload the `standalone-html-importer` folder to `/wp-content/plugins/`, or upload the zip via Plugins → Add New → Upload Plugin.
2. Activate the plugin.
3. Go to **HTML Pages → Import HTML**.

== Changelog ==

= 1.1.1 =
* Fix: backslashes in imported HTML (e.g. \n or escaped quotes inside inline <script>) were stripped on save, corrupting JavaScript. HTML is now stored with wp_slash(). Re-import affected pages with "replace existing" checked to repair them.

= 1.1.0 =
* Bulk import: select multiple .html files at once — each becomes its own page (title from <title> tag, slug from filename).

= 1.0.0 =
* Initial release: import via upload or paste, standalone + themed display modes, injectable site navigation bar, menu/search integration.
