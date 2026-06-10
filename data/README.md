# data/

사이트의 모든 콘텐츠는 이 디렉토리의 JSON에서 나온다. 스키마는 [src/lib/types.ts](../src/lib/types.ts), 배경은 [docs/PRD.md](../docs/PRD.md) §7 참고.

| 파일 | 내용 | 갱신 주체 |
|---|---|---|
| `appointments.json` | 선관위·대법원·헌재 임명 정보 (`Appointment[]`) | 수작업 구축 후 변경분만 에이전트 PR |
| `events.json` | 6·3 사태 기록 타임라인 (`TimelineEvent[]`) | registrar 에이전트 PR → 사람 머지 |
| `inquiry.json` | 국정조사 절차 현황 (`Inquiry`) | inquiry-tracker 에이전트 PR → 사람 머지 |

## 수록 원칙 (PRD §6 가드레일)

- **원문 링크 100%.** `url: null`은 "원문 공개 대기" 상태로만 일시 허용되며, 사이트에 "원문 확인 중"으로 노출된다. 공개 전까지 모든 null을 해소하는 것이 목표.
- 출처 등급은 `official`(선관위·국회·관보) 또는 `press_multi`(복수 매체 교차 확인)만. 단독 보도는 수록하지 않는다.
- 상태 라벨은 4종만: `official | investigating | result_announced | corrected`.
- 정정은 삭제가 아니라 새 항목 + `supersedes`로 표현한다.
- 이 디렉토리의 변경은 에이전트가 PR까지만 만들고, 머지는 반드시 사람이 한다.

## 현재 상태 (D2 — 잠정 데이터)

공개 출처(선관위 위원 소개 페이지, 복수 매체 보도)를 2026-06-10 조사해 채운 **잠정** 값.
사이트에 "관보 대조 후 확정 표기 예정" 고지가 떠 있으며, 아래가 끝나야 고지를 제거한다:

- `appointments.json` — 선관위 9인 + 사무총장 수록. **임명별 관보 호수 대조 필요.** 남래진 위원 추천 교섭단체, 허철훈 사무총장 임명일 확인 중.
- `events.json` — 6건 수록(보도 링크 포함). **선관위·국회 원문(보도자료·의안정보) 링크로 교체 필요.**
- `inquiry.json` — 본회의 의결 대기 단계. 국정조사요구서 의안번호 확인 중.
