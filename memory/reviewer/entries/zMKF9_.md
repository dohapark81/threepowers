---
id: zMKF9_
type: memory
date: '2026-06-18T10:43:01+09:00'
category: general
tags:
  - factcheck
  - 6·3
  - 편향점검
summary: >-
  6-18 reporter 커밋 922e8f9(6-17 신규 4건 evt_20260617_01~04) 팩트체크: 전건 수록 승인, 정정
  1건(evt_04 철수시간 약20분→20분이 채 안 돼), 편향 없음. 커밋 1c5a109(factcheck 문서+정정
  events.json)
---

# 6-18 reporter 커밋 922e8f9(6-17 신규 4건 evt_20260617_01~04) 팩트체크: 전건 수록 승인, 정정 1건(evt_04 철수시간 약20분→20분이 채 안 돼), 편향 없음. 커밋 1c5a109(factcheck 문서+정정 events.json)

대상: data/events.json evt_20260617_01~04.
검증(직접조회): 뉴시스(evt01 4사실 축자: 50%지침 미보고·오후10시연장 미보고·언론보도 인지·비상체계 미작동), 서울신문(evt02 12명=공식 진상규명위 조현욱), MBC(evt02 39명=정희용 의원실·17/3/1 세부), 경향·SBS(evt03 지역7+4·민주당 비판), YTN오전/저녁(evt04 13일째·업무방해 수사·철수 20분도 안돼).
정정 1건: evt04 '약 20분 만에'→'20분이 채 안 돼'(YTN '20분도 안 돼', newspim 10분·파이낸셜 15분 — 상한 과대). evt06 잠실 군중수치 정정 선례 동일 기준.
귀속 분리 합격: evt02 12명(공식 진상규명위) vs 39명(국힘 의원실) 분리, grade press_multi로 당파수치 official 미승격.
부정선거의혹 토픽(evt03)은 TOPICS 통제어휘(types.ts:177) 내 공식행위(선거소청) 앵커 — 의혹 수입 아님. 외세개입설·통계의혹 0건.
스키마: JSON유효 39건·중복0·dangling0·status2종·grade2종·topics통제어휘.
거버넌스: nis docs/research/·crewx.yaml·skills/·memory/ 미커밋. 정정 동반회차라 데이터+문서 동시커밋(e169610 선례).
env차단 신규: tvchosun.com·yonhapnewstv.co.kr(+기존 yna·hani).
