---
id: vaPsv2
type: memory
date: '2026-06-18T15:50:13+09:00'
category: knowhow
tags:
  - assembly-api
  - inquiry-tracker
summary: inquiry-tracker OpenAPI 실행 검증
---

# inquiry-tracker OpenAPI 실행 검증

2026-06-18 실행 검증: .env의 ASSEMBLY_API_KEY로 열린국회정보 OpenAPI 호출 성공. 기본 curl UA는 400이므로 -A crewx-inquiry-tracker 필요. TVBPMBILL11 AGE=22 pSize=1은 INFO-000 및 목록 반환. BILL_NAME=국정조사/중앙선거관리/국정조사계획서는 INFO-200, BILL_NAME=투표용지는 2219127 특검법안 반환. BILLINFODETAIL은 BILL_ID로 정상. ALLBILL은 BILL_ID 단독이면 ERROR-300, BILL_NO=2219127이면 INFO-000. 표결 API ncocpgfiaoituanbr은 처리의안 2214183 BILL_ID로 INFO-000 및 찬반 수치 반환.
