const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_BOOK_DIR = path.join(ROOT, 'docs', 'source-book');
const MANIFEST_PATH = path.join(SOURCE_BOOK_DIR, 'book-manifest.json');
const CSS_PATH = path.join(SOURCE_BOOK_DIR, 'book.css');

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugifyFactory() {
  const seen = new Map();
  return (text) => {
    const base = String(text)
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || 'section';
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function stripLeadingH1(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let removed = false;
  return lines.filter((line) => {
    if (!removed && /^#\s+/.test(line)) {
      removed = true;
      return false;
    }
    return true;
  }).join('\n').replace(/^\n+/, '');
}

function demoteHeadings(markdown, levels = 1) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let inFence = false;
  return lines.map((line) => {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (!match) return line;
    const nextDepth = Math.min(6, match[1].length + levels);
    return `${'#'.repeat(nextDepth)} ${match[2]}`;
  }).join('\n');
}

function scanHeadings(markdown, maxDepth = 3) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const headings = [];
  const slugify = slugifyFactory();
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) continue;
    const depth = match[1].length;
    const text = match[2].trim();
    const slug = slugify(text);
    headings.push({ depth, text, slug });
  }
  return headings.filter(entry => entry.depth <= maxDepth);
}

function buildTocHtml(headings) {
  if (!headings.length) return '<p>No contents found.</p>';

  let html = '<ul class="toc-list">';
  let currentDepth = headings[0].depth;
  let first = true;

  for (const heading of headings) {
    while (!first && heading.depth > currentDepth) {
      html += '<ul>';
      currentDepth += 1;
    }
    while (!first && heading.depth < currentDepth) {
      html += '</li></ul>';
      currentDepth -= 1;
    }
    if (!first) {
      html += '</li>';
    }
    html += `<li class="toc-entry depth-${heading.depth}"><a href="#${heading.slug}">${escapeHtml(heading.text)}</a>`;
    first = false;
  }

  while (currentDepth > headings[0].depth) {
    html += '</li></ul>';
    currentDepth -= 1;
  }
  html += '</li></ul>';
  return html;
}

function buildTocMarkdown(headings) {
  return headings.map((heading) => {
    const indent = '  '.repeat(Math.max(0, heading.depth - 1));
    return `${indent}- [${heading.text}](#${heading.slug})`;
  }).join('\n');
}

function annotateRenderedHeadings(html, headings) {
  let index = 0;
  return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (match, depth, inner) => {
    const heading = headings[index];
    if (!heading) return match;
    index += 1;
    const className = Number(depth) === 1
      ? 'chapter-title'
      : Number(depth) === 2
        ? 'source-title'
        : `heading-depth-${depth}`;
    return `<h${depth} id="${heading.slug}" class="${className}">${inner}</h${depth}>`;
  });
}

function buildBookMarkdown(manifest) {
  const output = [];

  for (const [chapterIndex, chapter] of manifest.chapters.entries()) {
    output.push(`# Chapter ${chapterIndex + 1}. ${chapter.title}`);
    output.push('');
    if (chapter.intro) {
      output.push(chapter.intro);
      output.push('');
    }

    for (const source of chapter.sources) {
      const absPath = path.join(ROOT, source.path);
      const markdown = readUtf8(absPath);
      const title = source.title || extractTitle(markdown, path.basename(source.path, '.md'));
      const stripped = stripLeadingH1(markdown);
      const demoted = demoteHeadings(stripped, 1).trim();
      output.push(`## ${title}`);
      output.push('');
      output.push(`_Source: \`${source.path}\`_`);
      output.push('');
      if (demoted) {
        output.push(demoted);
        output.push('');
      }
    }
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

async function main() {
  const manifest = JSON.parse(readUtf8(MANIFEST_PATH));
  const css = readUtf8(CSS_PATH);
  const generatedAt = new Date();
  const generatedAtLabel = generatedAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  const markdownBody = buildBookMarkdown(manifest);
  const headings = scanHeadings(markdownBody, 3);
  const tocHtml = buildTocHtml(headings);
  const tocMarkdown = buildTocMarkdown(headings);

  const markdownOutput = [
    `# ${manifest.title}`,
    '',
    `_${manifest.subtitle}_`,
    '',
    `Generated: ${generatedAtLabel}`,
    '',
    'Refresh command: `node scripts/build-source-book.js`',
    '',
    '## Table of Contents',
    '',
    tocMarkdown,
    '',
    markdownBody.trim(),
    ''
  ].join('\n');

  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: false,
    mangle: false
  });

  const bodyHtml = annotateRenderedHeadings(marked.parse(markdownBody), headings);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(manifest.title)}</title>
  <style>${css}</style>
</head>
<body>
  <section class="cover">
    <div class="cover-kicker">Papilionem Reference</div>
    <h1>${escapeHtml(manifest.title)}</h1>
    <p class="subtitle">${escapeHtml(manifest.subtitle)}</p>
    <div class="cover-meta">
      <div><strong>Generated:</strong> ${escapeHtml(generatedAtLabel)}</div>
      <div><strong>Manifest:</strong> docs/source-book/book-manifest.json</div>
      <div><strong>Refresh Command:</strong> node scripts/build-source-book.js</div>
    </div>
    <div class="cover-note">
      This compiled book is the master reading copy for Papilionem. The durable maintenance workflow is:
      update the source docs, then rebuild this book so the Markdown, HTML, and PDF stay aligned.
    </div>
  </section>
  <section class="toc-page">
    <h1>Table of Contents</h1>
    ${tocHtml}
  </section>
  <main class="book-body">
    ${bodyHtml}
  </main>
</body>
</html>`;

  const markdownOutputPath = path.join(SOURCE_BOOK_DIR, `${manifest.outputBaseName}.md`);
  const htmlOutputPath = path.join(SOURCE_BOOK_DIR, `${manifest.outputBaseName}.html`);
  const pdfOutputPath = path.join(SOURCE_BOOK_DIR, `${manifest.outputBaseName}.pdf`);

  ensureDir(SOURCE_BOOK_DIR);
  fs.writeFileSync(markdownOutputPath, markdownOutput, 'utf8');
  fs.writeFileSync(htmlOutputPath, html, 'utf8');

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: pdfOutputPath,
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%; font-size:8px; color:#5e6a73; padding:0 0.4in; display:flex; justify-content:space-between; align-items:center;">
          <span>Papilionem Source Book</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
      margin: {
        top: '0.68in',
        right: '0.72in',
        bottom: '0.78in',
        left: '0.72in'
      }
    });
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({
    markdown: markdownOutputPath,
    html: htmlOutputPath,
    pdf: pdfOutputPath
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
