---
name: inquiry-tracker
description: 국정조사 추적기(data/inquiry.json) 갱신 레시피. 열린국회정보 OpenAPI(국회 공식)로 단계·표결·위원·일정을 길어와 official 출처로 채운다. 뉴스는 진실 출처가 아니라 "언제 확인할지" 알리는 트리거.
metadata:
  version: 0.3.0
  target: data/inquiry.json
  schema: src/lib/types.ts (Inquiry, INQUIRY_STAGES)
  rules: data/README.md (수록 원칙)
---

# inquiry-tracker — 국회 절차 추적 레시피 + API 래퍼

`data/inquiry.json`(국정조사 추적기)을 **국회 공식 자료 기준으로만** 갱신하기 위한 절차·출처·검증 레시피와 실행형 API 래퍼.
이 추적기는 events.json(데일리 뉴스)과 **원리가 다르다.** 뉴스 수집이 아니라 **국회 절차 추적**이다.

> 페이지 약속(`src/pages/inquiry.astro:20`): "모든 항목은 국회 공식 자료(의안정보·회의록) 기준으로만 갱신됩니다."
> 이 스킬은 그 약속을 어디서 어떻게 지키는지를 정의한다.

---

## 0. 한다 / 안 한다

- ✅ **한다**: inquiry.json을 공식 출처로 채우는 절차·호출·검증 기준 제공, 열린국회정보 API 조회 보조.
- 🔔 **트리거**: 뉴스/RSS는 "오늘 뭐가 잡혔다/처리됐다"는 **조기경보**일 뿐. 사실의 출처는 항상 API·회의록.
- 🚫 **안 한다**: inquiry.json 직접 머지(머지는 사람), 주장 판정, 의결 전 선반영, 단독 보도 수록.

## 0.1 실행형 사용법

반복 조회는 curl 대신 래퍼를 쓴다. 키는 환경변수나 gitignored `.env`의 `ASSEMBLY_API_KEY`에서 읽고, 키 값은 출력하지 않는다.

```bash
# 키 발급 안내
npx crewx skill inquiry-tracker key-guide

# 연결 검증
npx crewx skill inquiry-tracker check-key

# 의안 검색 / 처리경과 / 상세 / 표결
npx crewx skill inquiry-tracker search 투표용지 --size 5
npx crewx skill inquiry-tracker bill 2219127
npx crewx skill inquiry-tracker detail {BILL_ID}
npx crewx skill inquiry-tracker vote {BILL_ID}

# 본회의 회의록/보고사항/일정
npx crewx skill inquiry-tracker plenary-minutes --date 2026-06-11 --keyword 국정조사
npx crewx skill inquiry-tracker minutes-text 56810 국정조사
npx crewx skill pdf2md 'https://record.assembly.go.kr/assembly/viewer/minutes/download/pdf.do?id=56810' --out docs/sources/assembly/20260611-plenary-minutes-56810.md --title '제436회국회 국회본회의회의록 제2호'
npx crewx skill inquiry-tracker meeting-agenda N054280
npx crewx skill inquiry-tracker plenary-schedule --date 2026-06-18
npx crewx skill inquiry-tracker inquiry-minutes --size 5

# OpenAPI 카탈로그/필수 파라미터 확인
npx crewx skill inquiry-tracker catalog '본회의 회의록'
npx crewx skill inquiry-tracker catalog-meta OO1X9P001017YF13038 2

# 미확정 서비스 코드나 카탈로그 확인용 raw 호출
npx crewx skill inquiry-tracker service nxjuyqnxadtotdrbw AGE=22 pSize=5
```

원문 응답이 필요하면 각 명령에 `--json`을 붙인다. 래퍼는 기본 `curl/*` UA 차단을 피하려 항상 `crewx-inquiry-tracker` User-Agent를 보낸다.

---

## 1. 진실의 출처 — 3단 위계

| 계층 | 소스 | 무엇을 | 자동화 | 지연 | 역할 |
|---|---|---|---|---|---|
| **Tier 1 — API** | 열린국회정보 OpenAPI (`open.assembly.go.kr`) | 의안·처리경과·표결·위원명단·의사일정·결과보고서 | ✅ 완전 | 거의 실시간 | **추적기 뼈대** |
| **Tier 2 — 회의록** | 위원회 회의록 API + `record.assembly.go.kr` | 기관보고·증인채택·청문회 **내용물** | ◑ 반자동(메타 API, 본문 파싱) | 임시본 ~익일 / 최종본 ~3일 | hearings·witnesses |
| **Tier 3 — 뉴스/RSS** | 국회뉴스ON·보도자료 RSS | "오늘 뭐가 잡혔다" | ✅ | 실시간 | **트리거만** |

핵심: 국정조사의 **겉뼈대(요구서→의결→구성→계획서→…→결과보고서)는 Tier 1 API로 거의 100% 추적**된다.
**내용물(증인·기관보고)은 API에 없고 회의록(Tier 2)에만** 있다 → 우리 `hearings`/`witnesses`가 수작업 구간.

> `data.go.kr`(공공데이터포털)의 국회 데이터는 전부 열린국회정보를 가리키는 미러다. **원천은 `open.assembly.go.kr` 하나.**

---

## 2. 열린국회정보 OpenAPI — 레퍼런스 (검증됨)

```
GET https://open.assembly.go.kr/portal/openapi/{SERVICE}?KEY={KEY}&Type=json&pIndex=1&pSize=100&{params}
```

- **인증**: 무료 키 필요(환경변수 `ASSEMBLY_API_KEY`, gitignored `.env` — §3 참조).
- **⚠️ User-Agent 필수**: 기본 `curl/*` UA로 호출하면 **키가 정상이어도** `HTTP 400 "Bad Request."`(평문 12B) 반환 — 서버가 curl 기본 UA를 차단한다. **임의 커스텀 UA**(예: `-A "crewx-inquiry-tracker"`, 브라우저 UA도 가능)를 모든 호출에 지정하면 정상. 라이브 검증(2026-06-18): UA 지정 시 `INFO-000` + 실데이터 수신, 미지정 시 전부 400. (지난 "400=키 없음" 해석은 오류 — 실제 원인은 UA 차단이었음.)
- **포맷**: `Type=json`(권장) 또는 `xml`. 페이징 `pIndex`(쪽), `pSize`(쪽당 건수, 최대 1000).
- **응답 봉투**:
  ```json
  { "TVBPMBILL11": [
      { "head": [ {"list_total_count": 2},
                  {"RESULT": {"CODE":"INFO-000","MESSAGE":"정상 처리되었습니다."}} ] },
      { "row": [ { /* …필드… */ } ] }
  ] }
  ```
- **결과 코드**(첫 호출로 정확값 확정): `INFO-000` 정상(데이터 있음) · `INFO-200` 해당 데이터 없음 · `ERROR-290` 인증키 오류 · `ERROR-300` 필수값 누락.

### 2.1 서비스 코드 — ✅ 검증 / ⚠️ 카탈로그에서 확정

velog 개발 문서 교차확인 + 라이브 프로브로 확인한 코드:

| 용도 | 서비스 코드 | 상태 | 비고 |
|---|---|---|---|
| 의안 검색/목록 | `TVBPMBILL11` | ✅ | 의안명·대수(AGE)·발의자로 검색. 프로브 400(실재) |
| 의안정보 통합 | `ALLBILL` | ✅ | 의안번호(`BILL_NO`)로 처리경과 등 통합 조회. `BILL_ID`만 넣으면 `ERROR-300` |
| 의안 상세정보 | `BILLINFODETAIL` | ✅ | BILL_ID 필요 |
| **의안별 표결현황** | `ncocpgfiaoituanbr` | ✅ | 본회의 의결 찬/반/기권 수치 ← 의결 확정의 핵심 |
| 접수목록 | `BILLRCP` | ✅ | |
| 계류의안 | `nwbqublzajtcqpdae` | ✅ | |
| 처리의안 | `nzpltgfqabtcpsmai` | ✅ | 대수 필요 |
| 최근 본회의 처리의안 | `nxjuyqnxadtotdrbw` | ✅ | |
| 심사정보 | `BILLJUDGE` | ✅ | |
| **본회의 회의록** | `nzbyfwhwaoanttzje` | ✅ | `DAE_NUM`, `CONF_DATE` 필수. 보고사항/회의번호(CONFER_NUM) 확인 |
| **회의별 안건목록** | `VCONFBLLLIST` | ✅ | `CONF_ID` 필수. 정식 안건 목록 확인 |
| **본회의 의사일정** | `nekcaiymatialqlxr` | ✅ | `UNIT_CD=100022`(22대). `next_event`용 |
| **국정조사 회의록** | `VCONFPIPCONFLIST` | ✅ | `ERACO=제22대`. 특위 회의록/PDF 확인 |
| **위원회 위원 명단** | ⚠️ 미확정 | ⚠️ | `committee_members`용. P0에서 확정 |
| 국정조사 결과보고서 | ⚠️ 미확정 | ⚠️ | `결과보고서` 단계 도달 시 확정 |

> ⚠️ 코드 확정처(카탈로그): [Open API 목록](https://open.assembly.go.kr/portal/openapi/openApiNaListPage.do) ·
> [메인](https://open.assembly.go.kr/portal/openapi/main.do) · [data.go.kr 전체현황](https://www.data.go.kr/data/15125891/openapi.do).
> 상세 페이지의 **"요청주소"** 칸에 실제 서비스 코드가 박혀 있다. SPA라 정적 스크랩 불가 → 페이지에서 직접 확인하거나 명세서(PDF) 다운로드.

### 2.2 함정 (선반영·혼동 금지)

- ⚠️ **의안번호(예 `2207147`) ≠ BILL_ID(내부 `PRC_…`).** `ALLBILL` 처리경과는 의안번호(`BILL_NO`)가 필수이고, `BILLINFODETAIL`·표결 API는 `BILL_ID`를 쓴다.
- ⚠️ **likms 처리경과 페이지는 SPA(JS 렌더)** → 정적 스크랩 불가. 반드시 `ALLBILL` API로 대체.
- ⚠️ **회의록은 당일 안 나온다.** 임시본 ~익일, 최종본 ~3일. 당일은 "의결됨"만 확인, 정확 수치·증인명단은 회의록 확정 후 교차검증.
- ⚠️ **호출 한도 미공개.** 폴링 설계 시 backoff 필수("월 1만 건"은 비공식 수치, 신뢰 금지).
- ⚠️ **증인채택·기관보고는 API에 영영 안 들어온다.** 회의록 파싱이 본질.

---

## 3. P0 부트스트랩 (1회·자기교정)

이 단계가 ⚠️ 미확정 코드를 스스로 메운다. 키와 코드만 한 번 확정하면 추적기 밀림이 구조적으로 사라진다.

1. **키 발급**(무료, 심의 없음, 정상 상태 키 최대 10개): 회원가입 → 로그인 → **마이페이지 → 인증키 발급**.
   - 발급 페이지: `https://open.assembly.go.kr/portal/openapi/openApiActKeyIssPage.do` (미로그인 시 `…/portal/user/loginPage.do`로 리다이렉트 — 정상).
   - 발급 이력: `https://open.assembly.go.kr/portal/openapi/openApiActKeyPage.do` · 포털 메인: `…/portal/openapi/main.do`.
   - 비밀값이므로 **레포에 커밋 금지.** 환경변수 `ASSEMBLY_API_KEY`로 보관(또는 gitignored 파일).
   - 안내만 다시 볼 때: `npx crewx skill inquiry-tracker key-guide`.
   - 가입은 조금 번거롭지만 어렵지는 않다. 위 URL로 바로 들어가면 메뉴 탐색을 줄일 수 있다.
2. **연결 검증**(의안 검색 1건):
   ```bash
   npx crewx skill inquiry-tracker check-key
   ```
   curl로 직접 확인해야 할 때만 아래처럼 UA를 붙인다.
   ```bash
   curl -s -A "crewx-inquiry-tracker" "https://open.assembly.go.kr/portal/openapi/TVBPMBILL11?KEY=$ASSEMBLY_API_KEY&Type=json&pIndex=1&pSize=1&AGE=22" | head -c 800
   ```
   - *통과 기준*: 봉투 `RESULT.CODE == INFO-000`(또는 데이터 없으면 `INFO-200`). `ERROR-290`이면 키 문제. **평문 `Bad Request.`(12B)면 키가 아니라 `-A`(UA) 누락.**
3. **남은 미확정 코드 확정**: §2.1 카탈로그에서 **위원명단·결과보고서** 서비스 코드를 찾아 이 문서 §2.1 표의 ⚠️ 칸을 ✅로 갱신(스킬 self-update). 각 코드는 키 호출로 `INFO-000` 확인 후 등재. 카탈로그는 `catalog`/`catalog-meta` 명령을 우선 사용한다.

---

## 4. 국정조사 7단계 → API 매핑

실제 단계는 `src/lib/types.ts`의 `INQUIRY_STAGES` 7종이다(대화체 약식 단계와 다름):

```
요구서제출 → 본회의의결 → 특위구성 → 계획서 → 기관보고 → 청문회 → 결과보고서
```

| # | 단계 | 어디서 잡나 | 자동화 |
|---|---|---|---|
| 1 | `요구서제출` | 본회의 회의록(`plenary-minutes` → `minutes-text`)의 보고사항 우선. 의안번호가 잡히면 `TVBPMBILL11`/`ALLBILL` 보강 | ◑ |
| 2 | `본회의의결` | `ALLBILL` 처리경과 + `ncocpgfiaoituanbr` 표결 + 본회의 회의록 | ✅ |
| 3 | `특위구성` | 구성결의 의안(`TVBPMBILL11`) + 위원명단 API ⚠️ (의결·등록 후) | ◑ 시차 |
| 4 | `계획서` | 계획서 의안 처리경과(`ALLBILL`) + 표결 | ✅ |
| 5 | `기관보고` | 위원회 회의록 API ⚠️ (본문 파싱) | ◑ |
| 6 | `청문회` | 위원회 회의록 API ⚠️ (증인 → witnesses) | ◑ |
| 7 | `결과보고서` | 결과보고서 API ⚠️ + 본회의 회의록 | ✅(도달 시) |

> 현재(`data/inquiry.json`) `stage == "본회의의결"` 대기. 오늘 본회의에서 의결되면 §5 레시피로 즉시 전진.

---

## 5. inquiry.json 필드별 레시피 (스키마 정확)

스키마: `src/lib/types.ts`의 `Inquiry`. `SourceRef = { type?: 'official'|'press'; title; url|null }`.
**API는 발견·검증 엔진**이고, inquiry.json에 적는 `url`은 **사람이 보는 원문**(likms 의안상세/회의록)이다 — 둘 다 official.

likms 원문 URL 패턴(인용용): `https://likms.assembly.go.kr/bill/billDetail.do?billId={BILL_ID}`

| 필드 (타입) | 소스/호출 | 인용 url | 검증 게이트 |
|---|---|---|---|
| `stage` / `stages_done[]` `{stage,date,source:string\|null}` | `ALLBILL` 처리경과 + 표결 | likms 의안상세(string) | 새 단계에 official url 존재, 스테퍼 한 칸 전진 |
| `requests[].source` (`SourceRef`) | 본회의 회의록/PDF 보고사항 우선, 의안번호 확인 시 `TVBPMBILL11`→`ALLBILL` 보강 | 회의록 또는 likms 의안상세 | `type:"official"`로 승급, 단독 press 0건 |
| `committee_members[]` `{name,party,role?}` | 위원명단 API ⚠️ | (출처 official) | **의결·등록 확정분만**, 전원 party 표기, 위원장 role 명시 |
| `hearings[]` `{date,title,source_refs[]}` | 국정조사 회의록(`inquiry-minutes`) → 본문 파싱 | 회의록 원문 | 단계 도달 후, source_refs official |
| `witnesses[]` `{name,note?}` | 국정조사 회의록(증인채택) | — | 채택 의결분만, 추정 금지 |
| `related_bills[]` `{bill_no,title,proposer?,url?}` | `TVBPMBILL11` 검색 → `ALLBILL` | `ALLBILL.LINK_URL` | bill_no는 의안번호(≠BILL_ID), url은 국회 의안정보 보기 링크 |
| `next_event` `{date:string\|null,title}` | 본회의 의사일정(`plenary-schedule`) | — | 항상 "다음 한 칸"만. 미정이면 `date:null` |

**핵심 호출 예시**

```bash
# (a) 요구서 제출 확인 — 국정조사 요구서는 정식 안건 행이 아니라 본회의 보고사항/PDF 본문에 먼저 잡힐 수 있다
npx crewx skill inquiry-tracker plenary-minutes --date 2026-06-11 --keyword 국정조사
npx crewx skill inquiry-tracker minutes-text 56810 국정조사
npx crewx skill pdf2md 'https://record.assembly.go.kr/assembly/viewer/minutes/download/pdf.do?id=56810' --out docs/sources/assembly/20260611-plenary-minutes-56810.md --title '제436회국회 국회본회의회의록 제2호'

# (b) 의안 검색 — 계획서/관련 법안 BILL_ID·의안번호 확보
npx crewx skill inquiry-tracker search 국정조사 --size 20

# (c) 처리경과 — 의결 여부·일자 확정
npx crewx skill inquiry-tracker bill {BILL_NO}

# (d) 표결현황 — 본회의 찬/반/기권 수치
npx crewx skill inquiry-tracker vote {BILL_ID}
```
> 파라미터명(`BILL_NAME`/`BILL_ID`/`BILL_NO`/`AGE` 등)은 첫 호출 응답의 필드로 확정한다. AGE=22(제22대). 라이브 검증(2026-06-18): `ALLBILL`은 `BILL_NO` 필수, `BILL_ID` 단독은 `ERROR-300`. `BILL_NAME=국정조사` 단독으론 `INFO-200`(무결과) 가능 — 요구서 제출은 본회의 회의록/PDF 보고사항 경로를 먼저 확인한다.

---

## 6. 수록 가드레일 (data/README.md 동기화)

inquiry.json은 `data/README.md`의 수록 원칙을 **그대로** 따른다:

- **원문 링크 100%.** `url:null`은 "원문 공개 대기"(사이트 "원문 확인 중")로만 일시 허용. 공개 시 즉시 해소.
- **출처 등급 official(선관위·국회·관보) 또는 press_multi(복수매체 교차)만. 단독 보도 금지.** 우리 국회 사실은 `type:"official"`(의안정보·회의록)이 1순위. 단독 press는 의안 원문으로 **승급**.
- **2차 분석·논평·오피니언 출처 금지.** 사실 주장은 1차 출처로 역추적, 안 되면 미등록.
- **주장 판정 금지·공식 대응만 기록.** 어느 요구서가 타당한지 판정하지 않고 여야 범위를 병렬 보존. 시점 임의 이동 금지.
- **선반영 금지.** "내정/예정"은 **의결 전까지 확정으로 적지 않는다.** 위원장·위원도 구성결의 **의결·등록 후에만** `committee_members`에. 빈 칸은 추정 금지, 확정분만.
- **정정 = 삭제 아님.** 새 항목 + `supersedes`. 일반 연결은 `related`.
- **변경은 PR까지만, 머지는 사람.**

---

## 7. 운영 주기 / 트리거 (밀림 재발 방지)

- 데일리 아님 → **이벤트 구동.** 의사일정 API에 본회의·특위 일정이 뜨면 그날 **D+0 점검 1회**.
- 국회뉴스ON·보도자료 **RSS = 트리거**(조기경보). 뉴스가 "처리됐다" 하면 → API로 확정.
- events.json에 `국정조사` 관련 이벤트가 추가되는 PR에서는 inquiry.json 동기화 여부를 같은 PR에서 확인.

---

## 8. 역할 흐름

```
reporter (공식 출처 수집 + 팩트체크)
   → inquiry.json 변경안 (이 스킬 §5 레시피)
   → developer PR
   → reviewer 검토 (가드레일 §6 체크)
   → 사람 머지
```
planner는 분해·가드레일만 잡고 데이터는 건드리지 않는다.
이 스킬을 쓰는 에이전트에 연결하려면 `crewx.yaml`의 해당 에이전트 `skills.include`에 `inquiry-tracker` 추가(예: reporter/developer). 연결 없이도 `npx crewx skill inquiry-tracker`로 호출 가능.

---

## 9. PR 전 검증 체크리스트

- [ ] 모든 새 `source.url`이 official(의안정보·회의록·관보) 또는 press_multi. **단독 press 0건.**
- [ ] `stage` 전진 시 `stages_done`에 official url + 정확한 date.
- [ ] `committee_members`는 **의결·등록 확정분만**, 전원 party, 위원장 role.
- [ ] 추정·선반영 0건(의결 전 항목 없음).
- [ ] `next_event`는 "다음 한 칸"만, 미정은 `date:null`.
- [ ] `related_bills.bill_no`는 의안번호(≠ BILL_ID).
- [ ] 정정은 `supersedes`로 표현.
- [ ] 변경은 PR까지만(사람 머지).

---

## 부록 A. 즉시 적용 — 의안번호 확보 (현재 "확인 중")

`data/README.md`가 "국정조사요구서 의안번호 확인 중"이라 적고 있다. 첫 실행 작업:

1. `plenary-minutes --date 2026-06-11`로 본회의 회의번호와 `CONF_ID`를 잡고, `minutes-text {CONFER_NUM} 국정조사`로 6월 8일 요구서 제출 보고사항을 확인한다. 2026-06-18 검증값: `CONFER_NUM=56810`, `CONF_ID=N054280`.
2. `TVBPMBILL11`로 `BILL_NAME=국정조사` & `AGE=22` 검색부터 시도하되, `INFO-200`이면 의안명 키워드(`투표용지`, `선거관리`, 계획서 공식명)와 본회의 회의록/의사일정 원문을 병행 확인한다. 여야 요구서 2건과 계획서 의안의 **의안번호·BILL_ID**를 식별한다.
3. `requests[].source`를 단독 press → `type:"official"`(회의록/likms 의안상세)로 승급.
4. `related_bills`에 요구서·계획서 의안 등록(`bill_no`,`title`,`proposer`,`url`). `url`은 `npx crewx skill inquiry-tracker bill {BILL_NO}`의 `LINK_URL`을 쓴다.
5. 오늘 본회의 의결 시: `ALLBILL`+표결로 `본회의의결` 단계를 official로 확정, `stage` 전진, `next_event`를 특위구성 일정으로 교체.

## 부록 B. 실행형 래퍼

이 스킬은 `inquiry-tracker.js`를 포함한 **exec 스킬**이다. 래퍼는 조회와 요약만 수행한다. **데이터 자동 머지는 금지**(변경안만 생성, 머지는 사람).
