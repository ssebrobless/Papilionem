# Papilionem Source Book

```text
╔════════════════════ Book Pipeline ════════════════════╗
║ source docs      │ existing docs/*.md + appendices    ║
║ manifest         │ docs/source-book/book-manifest.json║
║ builder          │ scripts/build-source-book.js       ║
║ outputs          │ .md + .html + .pdf in this folder  ║
╚════════════════════════════════════════════════════════╝
```

## Refresh

Run:

```text
node scripts/build-source-book.js
```

## Maintenance Rule

Update the underlying source docs first, then rebuild the book.

This book is the project's primary master reading copy.

This keeps:

- the chaptered Markdown book
- the HTML reading copy
- the PDF export

all aligned with the actual project documentation.
