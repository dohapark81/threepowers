---
id: CnX6on
type: memory
date: '2026-06-13T17:35:51+09:00'
category: general
tags:
  - threepowers
  - nec
  - heatmap
  - d3
summary: 중앙+시도 선관위원 정당 계통 히트맵 구현
---

# 중앙+시도 선관위원 정당 계통 히트맵 구현

PartyHeatmap을 중앙 9석 + 시도선관위 17곳 공식 공개 현원 135명 행렬로 확장했다. 범례는 전체 144명 기준으로 국힘/민주/정당명 미표기/법원장 추천/중앙선관위 지명/자체선정/호선을 필터링한다. 시도 데이터는 data/provincial_commissioners.json에서 읽고, 칸 클릭 시 공식 위원소개 출처와 선정방법 상세를 표시한다. npm run build 및 Puppeteer 검증 통과: 144셀, 17 시도 행, 국힘 필터 17개 highlight/127개 dim, 상세 패널 공식 원문 링크 정상.
