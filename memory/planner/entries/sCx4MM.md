---
id: sCx4MM
type: memory
date: '2026-06-18T15:37:40+09:00'
category: knowhow
tags:
  - api
  - user-agent
  - inquiry-tracker
  - env
summary: 열린국회정보 OpenAPI는 기본 curl UA를 400 차단 — 커스텀/브라우저 UA 필수
---

# 열린국회정보 OpenAPI는 기본 curl UA를 400 차단 — 커스텀/브라우저 UA 필수

기본 curl/* User-Agent 호출 시 키가 정상이어도 HTTP 400 평문 'Bad Request.'(12B). -A 로 임의 커스텀 UA(예: crewx-inquiry-tracker) 또는 브라우저 UA 지정 시 정상. 2026-06-18 라이브 검증: nwvrqwxyaytdsfvhu(국회의원) INFO-000+실데이터, TVBPMBILL11 INFO-200(정상 봉투·무결과). 키는 .env(ASSEMBLY_API_KEY, gitignored)에 보관, 값은 레포 밖. 지난 '400=키없음' 해석은 오류였고 skills/inquiry-tracker/SKILL.md §2·§3·§5에 정정 반영.
