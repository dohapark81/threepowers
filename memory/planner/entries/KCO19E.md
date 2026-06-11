---
id: KCO19E
type: memory
date: '2026-06-11T18:44:51+09:00'
category: general
tags:
  - timeline
  - sort
  - wi-04
  - unify
summary: 키흐름 타임라인 정렬을 최신순(내림차순)으로 통일 — WI-04
---

# 키흐름 타임라인 정렬을 최신순(내림차순)으로 통일 — WI-04

결정: 두 타임라인 방향 통일(최신순). TimelineList는 이미 내림차순이라 KeyEvents만 오름차순→내림차순으로 뒤집음(비교자 a/b 스왑+주석). 커밋 b6bd76d 'Sort key events newest first', 1파일(src/components/KeyEvents.astro), build PASS. 검증: 핵심흐름 6·11→12·10 내림차순, 전체기록도 6·11 최신 위로 방향 일치, 앵커 6/6, 상태색 불변(6·11 b-progress). feat/keyflow-chips ahead 1, 미푸시(PR#2 미갱신). crewx.yaml·docs/wi·memory 미커밋 보존.
