#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const VERSION = '0.4.0';
const USER_AGENT = process.env.PDF2MD_USER_AGENT || `crewx-pdf2md/${VERSION}`;
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;

function help() {
  console.log(`pdf2md ${VERSION}

Convert PDF files or PDF URLs to readable/searchable Markdown using pdftotext.

Usage:
  pdf2md <input.pdf-or-url> [--out FILE] [--title TITLE] [--force]
  pdf2md convert <input.pdf-or-url> [--out FILE] [--title TITLE] [--force]
  pdf2md assembly-minutes <minutes-id> [--out FILE] [--title TITLE] [--force]
  pdf2md snippets <input.pdf-or-url> <keyword> [--context N] [--limit N]
  pdf2md info <input.pdf-or-url>

Options:
  --out FILE       Output Markdown path. Defaults to input basename with .md.
  --title TITLE    Markdown H1/frontmatter title. Defaults to PDF basename.
  --force          Overwrite an existing output file.
  --layout         Preserve physical PDF layout. Useful for tables, bad for many Korean transcripts.
  --raw            Accepted for compatibility; raw text order is already the default.
  --fenced         Put each page in a fenced text block instead of readable paragraphs.
  --pages SPEC     Convert only selected pages, e.g. 1,3-5.
  --stdout         Print Markdown instead of writing a file.
  --context N      Snippet context characters. Default: 180.
  --limit N        Snippet limit. Default: 8.

Examples:
  npx crewx skill pdf2md docs/source.pdf --out docs/source.md
  npx crewx skill pdf2md convert 'https://example.com/source.pdf' --out docs/source.md
  npx crewx skill pdf2md assembly-minutes 56810 --out docs/minutes.md
  npx crewx skill pdf2md snippets docs/source.pdf 국정조사
  npx crewx skill pdf2md info docs/source.pdf
`);
}

function parse(argv) {
  const args = [...argv];
  let command = 'convert';
  if (['convert', 'assembly-minutes', 'snippets', 'info', 'help'].includes(args[0])) {
    command = args.shift();
  }

  const positionals = [];
  const options = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }

    const eq = arg.indexOf('=');
    const rawKey = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    const key = rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const inlineValue = eq === -1 ? undefined : arg.slice(eq + 1);

    if (['force', 'layout', 'raw', 'stdout', 'fenced'].includes(key)) {
      options[key] = inlineValue === undefined ? true : !['0', 'false', 'no'].includes(inlineValue);
      continue;
    }

    const value = inlineValue === undefined ? args[++i] : inlineValue;
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for --${rawKey}`);
    }
    options[key] = value;
  }

  return { command, positionals, options };
}

function isUrl(value) {
  return /^https?:\/\//i.test(value);
}

function basenameFromUrl(value) {
  const url = new URL(value);
  const base = path.basename(url.pathname);
  return base && base !== '/' ? base : 'source.pdf';
}

function defaultTitle(input, sourceName) {
  return sourceName.replace(/\.pdf$/i, '') || (isUrl(input) ? 'source' : path.basename(input));
}

function defaultOut(input, sourceName) {
  const base = isUrl(input) ? sourceName : input;
  return path.resolve(process.cwd(), base.replace(/\.pdf$/i, '') + '.md');
}

function fetchBuffer(url, redirects = 0) {
  if (redirects > 5) throw new Error(`Too many redirects: ${url}`);

  return new Promise((resolve, reject) => {
    const client = url.startsWith('http://') ? http : https;
    const request = client.get(url, { headers: { 'User-Agent': USER_AGENT } }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        response.resume();
        const next = new URL(response.headers.location, url).toString();
        fetchBuffer(next, redirects + 1).then(resolve, reject);
        return;
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        reject(new Error(`HTTP ${response.statusCode} while downloading ${url}`));
        return;
      }

      const chunks = [];
      let total = 0;
      response.on('data', (chunk) => {
        total += chunk.length;
        if (total > MAX_DOWNLOAD_BYTES) {
          request.destroy(new Error(`Download exceeds ${MAX_DOWNLOAD_BYTES} bytes`));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });
    request.on('error', reject);
  });
}

async function fetchText(url) {
  const buffer = await fetchBuffer(url);
  return buffer.toString('utf8');
}

async function readInput(input) {
  if (!input) throw new Error('Missing input PDF or URL.');

  if (isUrl(input)) {
    const buffer = await fetchBuffer(input);
    return { buffer, source: input, sourceType: 'url', sourceName: basenameFromUrl(input) };
  }

  const file = path.resolve(process.cwd(), input);
  if (!fs.existsSync(file)) throw new Error(`PDF not found: ${file}`);
  const stat = fs.statSync(file);
  if (!stat.isFile()) throw new Error(`Not a file: ${file}`);
  return { buffer: fs.readFileSync(file), source: file, sourceType: 'file', sourceName: path.basename(file) };
}

function assertPdf(buffer, source) {
  const magic = buffer.subarray(0, 5).toString('ascii');
  if (magic !== '%PDF-') {
    throw new Error(`Input does not look like a PDF: ${source}`);
  }
}

function requirePdftotext() {
  const result = spawnSync('pdftotext', ['-v'], { encoding: 'utf8' });
  if (result.error && result.error.code === 'ENOENT') {
    throw new Error('pdftotext is required. Install poppler first, e.g. `brew install poppler`.');
  }
}

function parsePages(spec) {
  if (!spec) return null;
  const pages = new Set();
  for (const part of String(spec).split(',')) {
    if (!part.trim()) continue;
    const match = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`Invalid --pages spec: ${spec}`);
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start) throw new Error(`Invalid --pages range: ${part}`);
    for (let page = start; page <= end; page += 1) pages.add(page);
  }
  return pages;
}

function pdftotextArgs(options) {
  const args = [];
  if (options.layout) {
    args.push('-layout');
  } else {
    args.push('-raw');
  }
  args.push('-enc', 'UTF-8', '-eol', 'unix');
  return args;
}

function extractText(buffer, options = {}) {
  requirePdftotext();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf2md-'));
  const pdf = path.join(tmp, 'input.pdf');
  fs.writeFileSync(pdf, buffer);
  try {
    return execFileSync('pdftotext', [...pdftotextArgs(options), pdf, '-'], {
      encoding: 'utf8',
      maxBuffer: 120 * 1024 * 1024,
    });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function htmlDecode(value) {
  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripTags(html) {
  return htmlDecode(
    String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function markdownEscape(text) {
  return String(text).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitPages(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd();
  if (!normalized) return [''];
  return normalized.split('\f');
}

function isStructuralLine(line) {
  return (
    /^#{1,6}\s/.test(line) ||
    /^◯/.test(line) ||
    /^o\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^\([^)]+\)$/.test(line) ||
    /^【[^】]+】$/.test(line) ||
    /^- /.test(line)
  );
}

function isPageHeader(line) {
  return (
    /^제\d+회-제\d+차\([^)]+\)\s*\d*$/.test(line) ||
    /^\d+\s+제\d+회-제\d+차\([^)]+\)$/.test(line) ||
    /^\d+$/.test(line)
  );
}

function endsParagraph(line) {
  return /[.?!。！？다요죠까음임함됨됨\)”’』」]$/.test(line) || /^\([^)]+\)$/.test(line);
}

function joinSeparator(previous, next) {
  if (!previous || !next) return '';
  if (/[-/·]$/.test(previous) || /^[-/·]/.test(next)) return '';
  return ' ';
}

function repairKoreanLineBreaks(text) {
  return text
    .replace(/([가-힣]+(?:습|합|입|됩|였습|었습|았습|겠습)) 니다/g, '$1니다')
    .replace(/([가-힣]+(?:습|합|입|됩|였습|었습|았습|겠습)) 니까/g, '$1니까')
    .replace(/([가-힣]+니) 다/g, '$1다')
    .replace(/([가-힣]+(?:했|되었|있었|없었|왔|갔|났|졌|켰|쳤)) 습니다/g, '$1습니다')
    .replace(/으로부 터/g, '으로부터')
    .replace(/국 정조사/g, '국정조사')
    .replace(/부 의/g, '부의')
    .replace(/있 도록/g, '있도록')
    .replace(/바랍니 다/g, '바랍니다')
    .replace(/특별위 원회/g, '특별위원회')
    .replace(/선거 행정/g, '선거행정')
    .replace(/법률 안/g, '법률안')
    .replace(/(\d+) 월/g, '$1월');
}

function joinWrappedLines(lines) {
  const paragraphs = [];
  let current = '';

  function flush() {
    const text = repairKoreanLineBreaks(current.trim());
    if (text) paragraphs.push(text);
    current = '';
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/[ \t]+/g, ' ').trim();
    if (!line) {
      flush();
      continue;
    }
    if (isPageHeader(line)) continue;

    if (!current) {
      current = line;
      if (isStructuralLine(line)) flush();
      continue;
    }

    if (isStructuralLine(line) || endsParagraph(current)) {
      flush();
      current = line;
      if (isStructuralLine(line)) flush();
      continue;
    }

    current += joinSeparator(current, line) + line;
  }

  flush();
  return paragraphs;
}

function renderPage(pageText, options = {}) {
  const lines = pageText.replace(/\u00a0/g, ' ').split('\n');
  if (options.fenced || options.layout) {
    const cleaned = lines
      .map((line) => line.replace(/[ \t]+$/g, ''))
      .join('\n')
      .trim();
    return cleaned ? ['```text', cleaned, '```'].join('\n') : '(blank page)';
  }

  const paragraphs = joinWrappedLines(lines);
  return paragraphs.length ? paragraphs.join('\n\n') : '(blank page)';
}

function markdown({ title, source, sourceType, sha256, text, options }) {
  const selectedPages = parsePages(options.pages);
  const pages = splitPages(text);
  const command = `pdftotext ${pdftotextArgs(options).join(' ')}`.trim();
  const generatedAt = new Date().toISOString();

  const sections = pages
    .map((page, index) => ({ number: index + 1, text: page }))
    .filter((page) => !selectedPages || selectedPages.has(page.number))
    .map((page) => [`## Page ${page.number}`, '', renderPage(page.text, options)].join('\n'))
    .join('\n\n');

  return [
    '---',
    `title: ${yamlString(title)}`,
    `source: ${yamlString(source)}`,
    `source_type: ${yamlString(sourceType)}`,
    `pdf_sha256: ${yamlString(sha256)}`,
    `generated_at: ${yamlString(generatedAt)}`,
    `extractor: ${yamlString(command)}`,
    `pages: ${selectedPages ? yamlString(options.pages) : yamlString('all')}`,
    '---',
    '',
    `# ${title}`,
    '',
    `- Source: ${source}`,
    `- PDF SHA-256: \`${sha256}\``,
    `- Extractor: \`${command}\``,
    '- Note: This is a readability-oriented text extraction. Keep the source PDF for exact layout.',
    '',
    sections,
    '',
  ].join('\n');
}

async function convert(input, options) {
  const loaded = await readInput(input);
  assertPdf(loaded.buffer, loaded.source);
  const text = extractText(loaded.buffer, options);
  const sha256 = crypto.createHash('sha256').update(loaded.buffer).digest('hex');
  const title = options.title || defaultTitle(input, loaded.sourceName);
  const output = markdown({ ...loaded, title, sha256, text, options });

  if (options.stdout) {
    process.stdout.write(output);
    return;
  }

  const outPath = path.resolve(process.cwd(), options.out || defaultOut(input, loaded.sourceName));
  if (fs.existsSync(outPath) && !options.force) {
    throw new Error(`Output already exists: ${outPath}. Use --force to overwrite.`);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`written: ${outPath}`);
  console.log(`source: ${loaded.source}`);
  console.log(`pdf_sha256: ${sha256}`);
}

function extractAssemblyMinutes(html, minutesId) {
  const titleMatch = html.match(/<div class="tit">\s*<h1>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : `국회회의록 ${minutesId}`;
  const subtitleMatch = html.match(/<div id="header"[\s\S]*?<h2><strong>([\s\S]*?)<\/strong><span class="date">([\s\S]*?)<\/span><\/h2>/i);
  const subtitle = subtitleMatch ? `${stripTags(subtitleMatch[1])} ${stripTags(subtitleMatch[2])}` : '';
  const source = `https://record.assembly.go.kr/assembly/viewer/minutes/xml.do?id=${minutesId}&type=view`;
  const generatedAt = new Date().toISOString();

  const bodyMatch =
    html.match(/<div class="minutes_body">([\s\S]*?)<button type="button" class="btn_play"/i) ||
    html.match(/<div class="minutes_body">([\s\S]*?)<div class="minutes_footer">/i);
  if (!bodyMatch) {
    throw new Error(`Could not find minutes body in National Assembly HTML for id ${minutesId}`);
  }

  const body = bodyMatch[1];
  const proceedings = body.split(/<p class="tit"><span class="num"><\/span><strong>【전자투표/)[0];
  const tokens = [];
  const tokenPattern = /<p class="tit_sm(?:\s+angun)?[^"]*"[\s\S]*?<\/p>|<p class="tit"[\s\S]*?<\/p>|<div id="spk_\d+"[\s\S]*?data-name="([^"]*)"[\s\S]*?data-pos="([^"]*)"[\s\S]*?<div class="talk"><div class="txt">([\s\S]*?)<\/div><\/div><\/div>/gi;
  let match;
  while ((match = tokenPattern.exec(proceedings)) !== null) {
    const raw = match[0];
    if (raw.startsWith('<div id="spk_')) {
      const name = htmlDecode(match[1]).trim();
      const position = htmlDecode(match[2]).trim();
      const spans = [...match[3].matchAll(/<span class="spk_sub"[^>]*>([\s\S]*?)<\/span>/gi)]
        .map((span) => stripTags(span[1]))
        .map((text) => text.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      if (spans.length) {
        tokens.push(`### ${markdownEscape(`${position} ${name}`)}\n\n${spans.join('\n\n')}`);
      }
      continue;
    }

    const section = stripTags(raw).replace(/\s+/g, ' ').trim();
    if (!section || section === '상정된 안건') continue;
    const cleanedSection = section.replace(/\s+상정된 안건$/, '').trim();
    if (/^\(\d+시\d+분/.test(cleanedSection) || /^\([^)]+\)$/.test(cleanedSection)) {
      tokens.push(cleanedSection);
    } else {
      tokens.push(`## ${cleanedSection}`);
    }
  }

  const reportMatch = body.match(/<p class="tit"><span class="num"><\/span><strong>◯요구서 제출<\/strong><\/p>([\s\S]*)$/i);
  if (reportMatch) {
    const report = [...reportMatch[1].matchAll(/<div class="con"><p class="tit_sm"><strong>([\s\S]*?)<\/strong><\/p><div class="pl10"><\/div><\/div>\s*<div class="con"><p class="tit_sm"><\/p><div class="pl10">([\s\S]*?)<\/div><\/div>/gi)]
      .map((item) => {
        const titleText = stripTags(item[1]).replace(/\s+/g, ' ').trim();
        const detailText = stripTags(item[2]).replace(/\s+/g, ' ').trim();
        return detailText ? `- ${titleText}\n  - ${detailText}` : `- ${titleText}`;
      })
      .filter(Boolean);
    if (report.length) tokens.push(`## ◯요구서 제출\n\n${report.join('\n')}`);
  }

  const content = tokens.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  return [
    '---',
    `title: ${yamlString(optionsTitle(title, subtitle))}`,
    `source: ${yamlString(source)}`,
    `source_type: "national_assembly_minutes_html"`,
    `minutes_id: ${yamlString(minutesId)}`,
    `generated_at: ${yamlString(generatedAt)}`,
    `extractor: "record.assembly.go.kr type=view html"`,
    '---',
    '',
    `# ${optionsTitle(title, subtitle)}`,
    '',
    `- Source: ${source}`,
    '- Note: Generated from the National Assembly minutes HTML view for readability. Keep the official PDF for source fidelity.',
    '',
    content,
    '',
  ].join('\n');
}

function optionsTitle(title, subtitle) {
  return subtitle ? `${subtitle} - ${title}` : title;
}

async function assemblyMinutes(minutesId, options) {
  if (!minutesId || !/^\d+$/.test(String(minutesId))) {
    throw new Error('assembly-minutes requires a numeric minutes id, e.g. 56810.');
  }
  const source = `https://record.assembly.go.kr/assembly/viewer/minutes/xml.do?id=${minutesId}&type=view`;
  const html = await fetchText(source);
  const generated = extractAssemblyMinutes(html, minutesId);
  const output = options.title
    ? generated.replace(/^title: .+$/m, `title: ${yamlString(options.title)}`).replace(/^# .+$/m, `# ${options.title}`)
    : generated;

  if (options.stdout) {
    process.stdout.write(output);
    return;
  }

  const outPath = path.resolve(process.cwd(), options.out || `assembly-minutes-${minutesId}.md`);
  if (fs.existsSync(outPath) && !options.force) {
    throw new Error(`Output already exists: ${outPath}. Use --force to overwrite.`);
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`written: ${outPath}`);
  console.log(`source: ${source}`);
}

function compactText(text) {
  return repairKoreanLineBreaks(text.replace(/\s+/g, ' ').trim());
}

function findSnippets(text, keyword, context, limit) {
  const compact = compactText(text);
  if (!keyword) return compact ? [compact.slice(0, context * 2)] : [];

  const hits = [];
  const haystack = compact.toLocaleLowerCase();
  const needle = keyword.toLocaleLowerCase();
  let offset = 0;
  while (hits.length < limit) {
    const index = haystack.indexOf(needle, offset);
    if (index === -1) break;
    hits.push(compact.slice(Math.max(0, index - context), Math.min(compact.length, index + keyword.length + context)));
    offset = index + Math.max(needle.length, 1);
  }
  return hits;
}

async function snippets(input, keyword, options) {
  const loaded = await readInput(input);
  assertPdf(loaded.buffer, loaded.source);
  const text = extractText(loaded.buffer, options);
  const context = Number(options.context || 180);
  const limit = Number(options.limit || 8);
  const hits = findSnippets(text, keyword, context, limit);

  console.log(`source: ${loaded.source}`);
  console.log(`keyword: ${keyword || '(start)'}`);
  console.log(`snippets: ${hits.length}`);
  hits.forEach((hit, index) => console.log(`\n#${index + 1}\n${hit}`));
  if (keyword && hits.length === 0) process.exitCode = 1;
}

async function info(input) {
  const loaded = await readInput(input);
  assertPdf(loaded.buffer, loaded.source);
  requirePdftotext();
  const sha256 = crypto.createHash('sha256').update(loaded.buffer).digest('hex');
  console.log(`source: ${loaded.source}`);
  console.log(`type: ${loaded.sourceType}`);
  console.log(`bytes: ${loaded.buffer.length}`);
  console.log(`pdf_sha256: ${sha256}`);
}

async function main() {
  const rawArgv = process.argv.slice(2);
  if (!rawArgv.length || rawArgv[0] === '--help' || rawArgv[0] === '-h') {
    help();
    return;
  }

  const { command, positionals, options } = parse(rawArgv);

  if (command === 'help') {
    help();
    return;
  }

  if (command === 'convert') {
    await convert(positionals[0], options);
    return;
  }

  if (command === 'assembly-minutes') {
    await assemblyMinutes(positionals[0], options);
    return;
  }

  if (command === 'snippets') {
    const keyword = positionals.slice(1).join(' ').trim();
    await snippets(positionals[0], keyword, options);
    return;
  }

  if (command === 'info') {
    await info(positionals[0]);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
