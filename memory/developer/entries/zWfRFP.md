---
id: zWfRFP
type: memory
date: '2026-06-13T17:29:08+09:00'
category: task
tags:
  - data
  - heatmap
  - provincial
summary: 17개 시도선관위 위원 현원 데이터셋 추가
---

# 17개 시도선관위 위원 현원 데이터셋 추가

2026-06-13: 17개 시·도선거관리위원회 공식 위원장 및 위원소개 페이지(B0000273/menuNo=200013)를 수집해 data/provincial_commissioners.json 추가. 공식 공개 현원은 135명(16개 시도 8명, 전남 7명). 정당 직접 명시: 국민의힘 15, 더불어민주당 14, 정당명 미표기 정당추천 4. selection_method 원문 보존, selection_route/party_key 파생. src/lib/types.ts에 ProvincialCommissionersData 타입 추가, data/README.md 등록. npm run build 통과.
