---
id: tKVMbf
type: memory
date: '2026-06-11T18:32:18+09:00'
category: general
tags:
  - keyflow
  - timeline
  - ui
  - developer
summary: '핵심 흐름: 가로 칩 → 세로 뉴스형 타임라인 표현 교체 완료·전수검증'
---

# 핵심 흐름: 가로 칩 → 세로 뉴스형 타임라인 표현 교체 완료·전수검증

WI-20260611-03. developer(codex) 위임 구현, commit 71a370b on feat/keyflow-chips → PR #2(draft) 갱신(머지 안 함). 순수 표현 교체라 2파일만: KeyEvents.astro(마크업) + global.css(칩 블록→세로 레일 CSS). events.json/types.ts/timeline.astro diff 0(pivot 데이터·앵커 배관 WI-02 재사용). 설계: 세로 레일+노드(날짜 YYYY.MM.DD·상태배지·굵은 라벨·title 설명줄), 노드 전체 앵커 링크. 점=상태색만(공식 채운점/조사중 빈링, 체크표시 금지=중립원칙). 6건만 6·3 본문. 직접검증: 노드6·앵커 6/6 .ev id 일치·날짜 오름차순·6·11만 b-progress 조사중·체크표시 없음·.stages-scroll 보존·build pass. 로컬 crewx.yaml(M)·docs/wi·memory 보존. 다음: reviewer PR#2 검토 또는 사용자 머지(=프로덕션 배포).
