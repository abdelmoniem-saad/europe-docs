# Open-Source Europe

A semester in Copenhagen, documented like a codebase — built with MkDocs Material.

## What is this?

A personal documentation project that logs every trip, route, budget decision, and mishap from a semester abroad in Copenhagen. Structured like software docs, because that's more fun than a blog.

Have a look at the [live site](https://abdelmoniem-saad.github.io/europe-docs/) for the full experience.

## Stack

- [MkDocs](https://www.mkdocs.org/) with [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)
- [Leaflet.js](https://leafletjs.com/) for interactive maps
- GeoJSON for route and location data
- Hosted on GitHub Pages

## Local Development

```bash
pip install -r requirements.txt
mkdocs serve
```

Then open `http://127.0.0.1:8000` in your browser.
