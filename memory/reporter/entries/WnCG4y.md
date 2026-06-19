---
id: WnCG4y
type: memory
date: '2026-06-18T16:10:09+09:00'
category: task
tags:
  - inquiry-tracker
  - openapi
  - search
summary: inquiry-tracker 국정조사 검색 검증
---

# inquiry-tracker 국정조사 검색 검증

2026-06-18 inquiry-tracker exec 스킬로 국정조사 관련 검색 검증. TVBPMBILL11 search '국정조사'는 INFO-200 0건. '제9회 전국동시지방선거'는 특검법안 3건(2219146 유상범 등 110인, 2219127 백혜련 등 10인, 2219125 김은혜 등 11인) 반환. '투표용지'는 2219127 1건 반환. 계류의안 nwbqublzajtcqpdae + BILL_NAME=투표용지도 2219127 반환. 국정조사 요구서/계획서 자체는 현재 의안검색/계류/처리의안 키워드 검색으로 확인되지 않음. 실행 중 INFO-200 최상위 RESULT만 오는 무결과 응답에서 envelope가 parts.find 예외를 내는 버그를 수정했고, 무결과 출력에 서비스명 hint를 보존하도록 보정함.
