---
name: pdf2md
description: Convert local PDF files, PDF URLs, or National Assembly minutes into searchable Markdown. Use when a PDF needs a readable text archive, snippets for inspection, or source metadata including SHA-256.
metadata:
  version: 0.4.0
---

# pdf2md

Use this skill to turn a PDF into a Markdown text archive. It wraps `pdftotext`, validates PDF input, records source metadata, and writes readable text sections.

For National Assembly minutes, prefer `assembly-minutes`. The official HTML minutes view is much cleaner than PDF text extraction for Korean transcripts; keep the PDF beside it as the source artifact.

## Requirement

`pdftotext` must be available.

```bash
brew install poppler
```

## Commands

```bash
# Convert a local PDF. The output defaults to the same basename with .md.
npx crewx skill pdf2md docs/source.pdf

# Convert with an explicit title and output path.
npx crewx skill pdf2md docs/source.pdf --out docs/source.md --title "Official Source"

# Convert a PDF URL.
npx crewx skill pdf2md 'https://example.com/source.pdf' --out docs/source.md

# Convert National Assembly minutes from the official HTML view.
npx crewx skill pdf2md assembly-minutes 56810 --out docs/sources/assembly/20260611-plenary-minutes-56810.md

# Inspect matches without writing a file.
npx crewx skill pdf2md snippets docs/source.pdf keyword

# Print metadata and SHA-256 only.
npx crewx skill pdf2md info docs/source.pdf
```

Useful options:

- `--force`: overwrite an existing Markdown file
- `--stdout`: print converted Markdown instead of writing a file
- `--pages 1,3-5`: include only selected pages in the Markdown
- `--layout`: preserve physical PDF layout in fenced text blocks; use this for tables, not Korean transcript reading
- `--fenced`: put extracted page text in fenced text blocks

## National Assembly Minutes

Use the minutes id from `record.assembly.go.kr`:

```bash
npx crewx skill pdf2md assembly-minutes 56810 --out docs/minutes.md
```

This fetches:

```text
https://record.assembly.go.kr/assembly/viewer/minutes/xml.do?id=56810&type=view
```

It extracts speaker names, agenda headings, report items, and body paragraphs from official HTML. This avoids the broken spacing often produced by PDF layout extraction.

## Output Contract

The Markdown contains YAML frontmatter with:

- `title`
- `source`
- `source_type`
- `pdf_sha256`
- `generated_at`
- `extractor`
- `pages`

The body contains one `## Page N` section per converted page. Default output favors readable Korean text over visual layout preservation. Keep the original PDF when exact layout or legal evidentiary fidelity matters; extracted text can change spacing and line breaks. For National Assembly minutes, store both the PDF and the HTML-derived Markdown.
