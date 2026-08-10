# 6·3 선관위·국정조사 10시 수집분 팩트체크 — 2026-08-11

- 작성: `@reviewer` (편집 검수, 언론사 편집장 역할)
- 대상: 직전 팩트체크 `fd9095d` 이후 `origin/main`에 아직 반영되지 않은 수집 커밋 2건.
  - `c0ca507` — `data/inquiry.json`, 제3차 청문회 회의록 반영.
  - `d1d2d85` — `data/events.json`, `evt_20260810_01` 1건 추가 및 진행 로그 갱신.
- 결론: **전건 무수정 승인. 푸시 적격.**

## 사실 대조

### 국정조사 회의록 (`c0ca507`)

- 국회 공식 회의록(제438회 제8차, 회의번호 57110)은 제3차 청문회와 증인 출석요구의 건을 실제 의사일정으로 기록한다. 출석요구서는 7일 전 송달이 어려워 당일 증인이 임의출석 형식으로 출석했다는 설명도 원문에 있다. 저장본의 [의사일정 및 임의출석 설명](../sources/assembly/20260810-inquiry-special-committee-minutes-57110.md#L54) 및 [증인 명단 25인](../sources/assembly/20260810-inquiry-special-committee-minutes-57110.md#L4406)과 `data/inquiry.json`의 `hearings`·`witnesses` 추가 내용이 일치한다.
- 현장 검증 실시의 건은 사전에 의사일정에 올라 있었지만, 최종적으로 위원장이 여야 합의 불성립을 이유로 "상정하지 않도록" 하겠다고 선언했다. 따라서 `data/inquiry.json`의 “미상정” 기록은 결과 서술로 정확하다. [회의 말미](../sources/assembly/20260810-inquiry-special-committee-minutes-57110.md#L4392)
- 회의록은 위원들 사이의 재검표·특검 연계 주장을 각 발언자의 주장으로 남긴다. 데이터는 이를 어느 정당의 사실 주장으로 채택하지 않고 절차 결과만 기록했다. 중립성 문제 없음.

### 신규 기사 `evt_20260810_01` (`d1d2d85`)

- 강동완 중앙선관위 사무총장 직무대리는 공식 회의록에서 시간대별 투표자 수의 일부 오입력·보고 누락을 설명했고, 투표자 수 입력과 개표 결과는 별개의 절차라고 말했다. [공식 진술](../sources/assembly/20260810-inquiry-special-committee-minutes-57110.md#L1388) 및 [고의성은 현 단계에서 알 수 없다는 답변](../sources/assembly/20260810-inquiry-special-committee-minutes-57110.md#L1508)을 확인했다.
- `body_oneline`은 “중앙선관위는 … 입장을 밝혔다”라고 귀속해 썼다. 따라서 최종 수사·사법 판단이 나지 않은 사항을 확정 사실로 바꾸지 않았다. `status: "official"`은 선관위의 공식 청문회 대응을 뜻하며, 의혹의 진위를 확정했다는 표시는 아니다.
- 수록된 4개 기사 모두 핵심 사실을 확인했다.
  - [SBS](https://news.sbs.co.kr/news/endPage.do?news_id=N1008699177): 오입력 인정·사과, 시간대별 수치의 잠정성, 개표 결과와의 구별.
  - [KBS](https://news.kbs.co.kr/news/pc/view/view.do?ncd=8633521): 청문회 개최·재검표를 둘러싼 대립, 오입력 사과와 최종 개표 결과와의 무관성.
  - [디지털타임스](https://www.dt.co.kr/article/12077543): 사람에 의한 부실 관리 인정, 아날로그 집계의 한계, 다음 선거 전 시스템 개선 방침.
  - [프레시안](https://www.pressian.com/pages/articles/2026081019291161597): 선관위의 설명과 국민의힘 위원들의 의도적 조작 주장·비판을 함께 보도.
- 제목·본문은 정당명을 쓰지 않고, “부정선거” 판단도 채택하지 않는다. 공영방송 2곳과 성향이 다른 민영 매체 2곳을 함께 인용했고, 상반된 정치권 주장은 인용 기사에만 남아 있다. 특정 정치 성향으로 기울었다고 볼 근거 없음.

## 무결성·배포 범위

- `data/events.json`: 114건, 이벤트 ID 중복 0건, 신규 항목의 `related` 3건 모두 실재, `source_refs` 4개 URL HTTP 200 확인.
- `data/inquiry.json` 및 `data/events.json` JSON 파싱 정상. 현재 날짜 이후 이벤트 0건, 수집 커밋의 원문 데이터 변경 외 무관 변경 없음.
- `git diff --check`, `npm run build` 통과 확인.
- 이 검수 커밋에는 본 파일만 넣는다. 미추적 `docs/research/`·`memory/`·`skills/` 및 수정된 `crewx.yaml`은 기사 검수 범위 밖이므로 포함하지 않는다.

## 처리

- 기사·국정조사 데이터 정정: 없음.
- 현재 `main`에서 본 팩트체크 기록을 커밋한 뒤, 대상 수집 커밋 2건과 함께 `origin/main`으로 푸시한다.
