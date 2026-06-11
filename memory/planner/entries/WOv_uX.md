---
id: WOv_uX
type: memory
date: '2026-06-11T17:09:08+09:00'
category: decision
tags:
  - seo
  - sitemap
  - robots
  - jsonld
  - og
  - github-pages
summary: >-
  SEO 기반 정비 WI 작성(WI-20260611-01, approved): sitemap·robots·JSON-LD·OG 4개 태스크
  분해. 발견한 핵심 함정 = GitHub Pages 프로젝트 페이지에서 /threepowers/robots.txt는 비권위(호스트 루트만
  인정) → sitemap 효력은 Search Console 직접 제출로 확보. crew에 coder 에이전트 없음 → 실행 주체 미정.
---

# SEO 기반 정비 WI 작성(WI-20260611-01, approved): sitemap·robots·JSON-LD·OG 4개 태스크 분해. 발견한 핵심 함정 = GitHub Pages 프로젝트 페이지에서 /threepowers/robots.txt는 비권위(호스트 루트만 인정) → sitemap 효력은 Search Console 직접 제출로 확보. crew에 coder 에이전트 없음 → 실행 주체 미정.

레이아웃 Base.astro에 head 메타 양호(title/desc/canonical/og기본/lang). 누락: sitemap(@astrojs/sitemap 미설치)·robots(public/ 없음)·JSON-LD·og:image+twitter. base=/threepowers라 모든 절대URL은 Astro.site+base로 생성해야 함. 배포=main push→withastro/action@v3 자동. feature 브랜치(feat/seo-baseline)→PR→reviewer→main 권장. 커스텀도메인 D7은 별도.
