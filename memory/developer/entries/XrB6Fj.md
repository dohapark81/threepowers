---
id: XrB6Fj
type: memory
date: '2026-06-18T16:49:59+09:00'
category: knowhow
tags:
  - assembly
  - openapi
  - minutes
  - skill
summary: Improved inquiry-tracker for plenary minutes path
---

# Improved inquiry-tracker for plenary minutes path

Why reporter struggled: v0.2 was bill-search first, but National Assembly inquiry requests can be recorded as plenary report items/PDF body rather than TVBPMBILL11 bill-title rows. Added v0.3 commands: plenary-minutes (nzbyfwhwaoanttzje, DAE_NUM+CONF_DATE), meeting-agenda (VCONFBLLLIST, CONF_ID), plenary-schedule (nekcaiymatialqlxr, UNIT_CD=100022), inquiry-minutes (VCONFPIPCONFLIST, ERACO=제22대), minutes-text (downloads record PDF and uses pdftotext), catalog/catalog-meta (OpenAPI AJAX metadata). Verified 2026-06-11 with CONFER_NUM=56810, CONF_ID=N054280; minutes-text 56810 국정조사 extracts the two 2026-06-08 request submissions.
