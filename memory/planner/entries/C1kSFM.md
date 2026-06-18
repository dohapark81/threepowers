---
id: C1kSFM
type: memory
date: '2026-06-18T15:03:38+09:00'
category: knowhow
tags:
  - openapi
  - assembly
  - inquiry
  - skill
summary: >-
  inquiry-tracker 스킬 신설 — 국정조사 추적기(data/inquiry.json) 갱신 레시피를 doc 스킬로
  institutionalize
---

# inquiry-tracker 스킬 신설 — 국정조사 추적기(data/inquiry.json) 갱신 레시피를 doc 스킬로 institutionalize

레지스트리(sowonlabs/crewx-templates)에 국회추적 스킬 없어 직접 생성: skills/inquiry-tracker/SKILL.md (doc, v0.1.0). 검증된 열린국회정보 OpenAPI 코드(base https://open.assembly.go.kr/portal/openapi/{SERVICE}?KEY=&Type=json): TVBPMBILL11=의안검색(프로브 400=실재,키필요), ALLBILL=의안정보통합, BILLINFODETAIL=상세, ncocpgfiaoituanbr=의안별표결현황(의결확정 핵심), BILLRCP/nwbqublzajtcqpdae/nzpltgfqabtcpsmai/nxjuyqnxadtotdrbw/BILLJUDGE. 미확정(P0 카탈로그서 확정): 의사일정/위원명단/회의록 코드. 함정: 의안번호≠BILL_ID, likms SPA스크랩불가→ALLBILL, 회의록 익일~3일 지연. 실제 INQUIRY_STAGES 7단계=요구서제출·본회의의결·특위구성·계획서·기관보고·청문회·결과보고서. SourceRef.type=official|press. 가드레일=data/README 수록원칙(official/press_multi만,단독금지,판정금지,선반영금지,supersedes,사람머지). 즉시작업=의안번호 확보(README '확인 중').
