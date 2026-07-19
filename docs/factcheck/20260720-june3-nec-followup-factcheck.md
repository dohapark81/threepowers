# 6·3 선관위·국정조사 후속 팩트체크 기록 — 2026-07-20

- 작성: `@reviewer` (편집 검수, 언론사 편집장 역할)
- 대상 커밋(reporter 자동 수집분·미푸시, 직전 팩트체크 `f6c19d7`(07-19, 시도위원 서울3사임·제주교체 승인) 이후분, `origin/main` 대비 앞선 2건):
  - `d2e2e19` "국정조사 추적기 일일점검 2026-07-20 — 전 항목 무변화 확인" (07-20 07:52) — `data/inquiry.json` **무변화 점검 로그**: `next_event.title`에 07-20 일일점검 요약(전 항목 무변화)만 append. `stage`/`stages_done`/`hearings`/`witnesses`/`related_bills`/`next_event.date` **실데이터 변동 없음.**
  - `4cb3da6` "6·3 선관위 기사 수집 2026-07-20 — 무변화 점검(events 95건 유지, 신규 수록 없음)" (07-20 08:17) — `data/events.json` **무변화**(95건, `origin/main`과 바이트 동일), `data/README.md` events 문단에 07-20 무변화 점검 문구 append만.
- 검수 범위: ① 두 커밋 델타의 성격(무변화 로그 vs 실데이터 변경) 확인, ② JSON 스키마·무결성·카운트 정합성, ③ 정치 편향(소스 진영 분포·프레임·상태라벨 분포), ④ 선반영 금지 준수(미수록 후보 심사), ⑤ **편집 방화벽**(crewx.yaml `nis`(국정원)·`docs/research/` 중국·북한 배후설) 커밋·푸시 유입 차단.

## 결론

- **두 커밋 전건 무수정 승인·푸시 적격.** 오늘은 **실데이터 변경 0건**이다. 국조 inquiry·선관위 events 양 추적기 모두 무변화이며, 각 커밋은 무변화 점검 로그 append(inquiry `next_event.title`)와 README 점검 문구 append뿐이다. 07-15(제1차 청문회 실개최 반영) 이후 국조 실데이터는 6일째 정지, events는 07-16(evt_20260714_02 2차 청문회 증인 채택) 이후 4일째 95건 정지 상태로, 사실관계상 신규 공식행위·개최 사건이 없어 정상이다.
- **데이터 무결성·카운트 정합 정상.**
  - `data/*.json` 6종 전부 JSON 유효.
  - `events.json` 95건·중복 id 0·미래(>2026-07-20) 날짜 0·`related`(객체형 id 참조) dangling 0·`origin/main` 대비 **바이트 동일**(미푸시 커밋·작업트리 모두 변경 없음).
  - `inquiry.json` — `next_event` 외 전 필드(`id`/`name`/`stage`(청문회)/`stages_done`(5)/`requests`(2)/`committee_members`(18)/`hearings`(5)/`witnesses`(4)/`related_bills`(4)) `origin/main`과 **완전 동일**, `next_event.date`(2026-07-22)도 불변. 델타는 `next_event.title` 로그 1줄 append뿐.
  - `appointments.json`(중앙선관위 9인+사무총장)·`provincial_commissioners.json`(현원 120)·`party_lineage.json`·`recruitment_events.json` **전부 미변경**(작업트리·미푸시 커밋 모두).
- **정치 편향: 편향 면 없음.**
  - **신규 콘텐츠 0건**이므로 events 편향 프로파일은 07-19 승인분과 동일하며 재인증한다.
  - **소스 진영 분포**(events.json `source_refs` 305건 전수 호스트 집계·53개 호스트): 통신·방송(연합43·MBC29·YTN36·SBS14 등)이 과반의 중립 backbone, 진보계(경향15·한겨레12 등 ~27)와 보수계(동아9·헤럴드경제10·한경 등 ~) 대등. 단일 진영 독점 없음 — 직전 점검 패턴과 동일.
  - **상태라벨 분포**: official 60·investigating 28·result_announced 6·corrected 1. 미입증 단정 라벨 없음. 전 이벤트 `press_multi`(76) 또는 `official`(19) — 단일 출처(press_single) 0건.
- **선반영 금지 준수.** events 미수록 4건은 각각 공식행위 부재·예정 미개최·미의결·일상 연속 사유로 배제됐고, 배제 기준이 **여야에 동일하게 적용**된다(야당 우선순위인 특검법과 국민의힘에 불리할 수 있는 재검표를 같은 "공식행위/의결 확정 후 수록" 잣대로 동시 보류). 국조 inquiry도 제6차/제2차 청문회 회의록 미등재로 stage 전진 없음(제2차 청문회 07-22는 출석요구만 의결된 예정 일정).
- **편집 방화벽 유지·차단 확인.** 미푸시 2개 커밋 델타(`data/*`) 음모성 키워드 grep(`배후|음모|중국|북한|china|간첩|부정선거 확정|조작 확정`) 결과 **유입 0건.** 작업트리의 `crewx.yaml`(신규 `nis`(국정원)·"중국/북한 배후 세력 조사" 프롬프트)·`docs/research/`(34개 `*-china-nk-background-check*.md`, 최신 07-19)·`skills/`·`memory/`는 규칙대로 **이번 커밋에서 제외**. 공개 홈페이지 파이프라인과 NIS/중국·북한 배후설 라인은 분리 유지된다.

## 검증 방법

- **커밋 델타 확인:** `git show d2e2e19 -- data/inquiry.json` = `next_event.title`에 "2026-07-20 일일점검 결과 전 항목 무변화" 요약만 append(타 필드 변동 0). `git show 4cb3da6` = `events.json` 변경 없음, `README.md` events 문단 07-20 무변화 문구 append.
- **inquiry 구조 대조:** `origin/main:data/inquiry.json`과 현재본을 `next_event` 제외 전 필드 비교 → **완전 동일**(`stage`=청문회, `hearings`=5, `witnesses`=4, `related_bills`=4, `next_event.date`=2026-07-22 불변).
- **events 바이트 동일성:** `git diff origin/main..HEAD -- data/events.json` 및 `git diff HEAD -- data/events.json` 모두 무결과 → 미푸시·작업트리 변경 0.
- **무결성:** `python3 json.load` 6파일 통과 · events 95건·중복 id 0·`related` dangling 0 · appointments/provincial/party_lineage/recruitment 미변경.
- **소스 진영 분포(bias signal):** events.json `source_refs` 305건 전수 호스트 집계(53개 호스트) = 통신/방송 과반·진보~진보 대등. 단일 진영 독점 없음.
- **미푸시 델타 음모 유입 검사:** `git diff origin/main..HEAD | grep -iE '배후|음모|중국|북한|china|간첩|…'` → **추가행 유입 0건.** `git diff --name-only origin/main..HEAD | grep -iE 'research|china|nk|crewx|memory|skills|nis'` → **0건**(델타는 `data/README.md`·`data/inquiry.json` 2파일뿐).

## 정정 처리 요약

| 항목 | 처리 |
|---|---|
| `d2e2e19` inquiry 무변화 로그 | **무수정 승인.** API 무변화 주장 근거 정합, `next_event` 외 실데이터 변동 없음. |
| `4cb3da6` events 무변화 + README 문구 | **무수정 승인.** events 95건 `origin/main` 바이트 동일·미수록 4건 사유 타당. |

## 미수록(제외) 후보 심사 (events)

| 후보 | 성격 | reporter 사유 | 편집장 판정 |
|---|---|---|---|
| 선관위 특검법 추천권(제3자 vs 야당) 협상·국민의힘 상임위 참석 거부 | 협상 국면 | 법사위 의결·본회의 통과 없음 → 공식행위 부재. 07-20 본회의 처리 예정분(내란·김건희·채해병 종합특검 연장)은 6·3 스코프 밖 별개 | **미수록 타당·중립.** 표결·합의 확정 시 여야 병렬 수록. 별개 특검 6·3 미편입 판단 정확. |
| 07-22 제2차 청문회 (`evt_20260714_02` 채택분) | 예정 일정 | 미개최 → 선반영 금지 | **미수록 타당.** 개최·제6차 회의록 확정 후 수록. inquiry `next_event.date` 2026-07-22와 정합. |
| 잠실 247만장 재검표 | 국민의힘 내부 찬반·미의결(파이낸셜뉴스 07-19 "안갯속") | 미의결(선반영 금지) | **미수록 타당.** 특위 의결 시 여야 병렬 중립 수록. |
| 합수본 선관위 관계자 소환·압수수색 | 수사 동향 | `evt_20260710_01` 이후 일상 수사 연속·새 사실(윗선 구속영장 등) 없음 | **미수록 타당.** 기존 소환 라인 연속. |

## 편집 방화벽 처리

| 작업트리 항목 | 성격 | 처리 |
|---|---|---|
| `crewx.yaml`(수정) | reporter/developer provider 교체 + **신규 `nis`(국정원) 에이전트·"중국/북한 배후 세력 조사" 프롬프트** | **커밋 제외.** 공개 데이터 파이프라인과 분리, 편집 독립성·정치 중립성 사유로 상위 보고 대상. |
| `docs/research/`(미추적, 34건) | 중국·북한 배후설 산출물(`*-china-nk-background-check*.md`, 최신 07-19) | **커밋 제외.** 홈페이지 미반영. |
| `skills/`·`memory/`(미추적) | 도구/메모 런타임 노이즈(memory는 .gitignore 대상) | **커밋 제외**(팩트체크 리포트 1건만 커밋). |

## 잔여 권고 (후속 과제)

1. **07-22 제2차 청문회 개최 반영 대기** — 예정 단계(선반영 금지). 개최·제6차 회의록 확정 시 이벤트 등록 및 `inquiry.json` stage/hearings/witnesses 보강. next_event.date 정합 확인 완료.
2. **선관위 특검법 추천권 협상 추적** — 법사위 계류·국민의힘 참석 거부. 위원회 상정·본회의 표결 등 공식행위 확인 시 여야 병렬 수록. 07-20 본회의의 종합특검(내란·김건희·채해병) 연장분은 6·3 스코프 밖으로 분리 유지.
3. **잠실 247만장 재검표 추적** — 미의결. 특위 의결 시 여야 입장 병렬 중립 수록.
4. **서울 선관위 위원 공석 2자리 충원 추적** — 현원 5명(2석 공석·위원장 공석). 후속 위촉 시 추천경로·정당 균형 재확인(provincial 데이터).
5. **편집 방화벽 상시 유지** — `crewx.yaml` `nis`(국정원)·`docs/research/` 중국·북한 배후설 라인은 공개 데이터·홈페이지 빌드와 **분리 유지 필수.** 매 점검 시 미푸시 델타·공개 데이터 음모성 키워드 grep 재확인. **편집 독립성·정치 중립성 사유로 상위 보고 대상 계속 명기.**
