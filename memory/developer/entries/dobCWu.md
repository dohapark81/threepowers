---
id: dobCWu
type: memory
date: '2026-06-18T16:03:54+09:00'
category: general
tags:
  - crewx
  - skill
  - assembly-api
summary: Converted inquiry-tracker skill to exec wrapper
---

# Converted inquiry-tracker skill to exec wrapper

Added skills/inquiry-tracker/inquiry-tracker.js and package.json so CrewX recognizes inquiry-tracker as exec v0.2.0. Commands: key-guide, check-key, search, bill, detail, vote, service. Wrapper loads ASSEMBLY_API_KEY from env or .env, never prints it, and sends custom User-Agent to avoid open.assembly.go.kr curl UA 400. Verified check-key, search 투표용지, ALLBILL bill 2219127, detail, raw service, and vote for PRC_D2F5A0Y9H2Z4W1T8N0S6C5P7R8Y4J5.
