---
id: p4XvTC
type: memory
date: '2026-06-13T17:43:25+09:00'
category: general
tags:
  - visualization
  - party-heatmap
  - nec
summary: 중앙+시도 선관위원 히트맵을 통합 9열 격자로 변경
---

# 중앙+시도 선관위원 히트맵을 통합 9열 격자로 변경

PartyHeatmap을 중앙 전용 SVG + 시도 SVG 분리 구조에서 중앙 9석과 시도 17*9석을 같은 18행 x 9열 단일 SVG로 통합했다. 공식 페이지 미노출 시도 좌석 18칸은 점선 빈칸으로 표시하고, 중앙 사임 공석은 동일 격자 안에서 표시한다. 범례 필터와 상세 패널은 통합 격자 전체에 적용된다. npm run build 및 Puppeteer 검증: 18행, 162셀, 빈칸 18, 클릭 가능 144, SVG 1개.
