// 데이터 모델 — 모든 항목은 원문 출처(source_refs)를 가진다

export type Body = 'nec' | 'supreme_court' | 'constitutional_court';

export type SelectionTrack =
  | 'president'
  | 'assembly_ruling'
  | 'assembly_opposition'
  | 'assembly_consensus'
  | 'assembly' // 국회 선출이나 추천 교섭단체 확인 중
  | 'chief_justice'
  | 'internal';

export interface SourceRef {
  type?: 'official' | 'press';
  title: string;
  url: string | null; // null = 원문 공개 대기 (사이트에 "원문 확인 중" 표시)
}

export interface Appointment {
  body: Body;
  person: string;
  position: string;
  selection_track: SelectionTrack;
  recommended_by?: string;
  appointed_date: string | null; // null = 확인 중

  term_start?: string;
  term_end?: string;
  career_summary: string[];
  source_refs: SourceRef[];
  /** 사임 = 공석, 사의 표명 = 재직 중이나 사의 제출 */
  status?: 'active' | 'resigned' | 'resignation_offered';
  /** 예: "위원장 직무대행 (선관위법 제5조)" */
  acting_role?: string;
  note?: string;
  /** 임명·지명 행위자. 예: "이재명 대통령", "김명수 대법원장" */
  appointed_by?: string;
  /** 복수 매체 또는 공개 절차(청문회 등)에서 확인된 논란만. 제기 주체를 명시한 사실 서술로 기록 */
  controversies?: { summary: string; refs: SourceRef[] }[];
}

// ── 정당 계통 히트맵 (party_lineage.json) ──────────────────
// 색은 위원 개인의 당적이 아니라 '임명 경로의 정파적 계통'을 나타낸다.
export type PartyKey = 'ppp' | 'dpk';

export interface PartyInfo {
  /** 범례·상세 표기용. 예: "국민의힘 계열" */
  label: string;
  /** 칸 안 짧은 표기. 예: "국힘" */
  short: string;
}

export interface PresidentRef {
  name: string;
  party: PartyKey;
  party_name: string;
  term_start: string;
  term_end: string | null;
  source: SourceRef;
}

export interface ChiefJusticeRef {
  name: string;
  /** 該 대법원장을 임명한 대통령 */
  appointed_by: string;
  party: PartyKey;
  appointed_date: string;
  source: SourceRef;
}

export interface PartyLineage {
  parties: Record<PartyKey, PartyInfo>;
  presidents: PresidentRef[];
  chief_justices: ChiefJusticeRef[];
}

/** 색을 만든 근거. direct=정당 직접 추천 / president·chief_justice=임명 계통 추론 / none=정당 미특정 */
export type LineageBasis = 'direct' | 'president' | 'chief_justice' | 'none';

// ── 시·도선거관리위원회 위원 히트맵 (provincial_commissioners.json) ──
export type ProvincialRegionCode =
  | 'su'
  | 'bs'
  | 'dg'
  | 'ic'
  | 'gj'
  | 'dj'
  | 'us'
  | 'sj'
  | 'gg'
  | 'gw'
  | 'cb'
  | 'cn'
  | 'jb'
  | 'jn'
  | 'gb'
  | 'gn'
  | 'jj';

export type ProvincialSelectionRoute =
  | 'party'
  | 'party_unspecified'
  | 'court'
  | 'nec_designated'
  | 'self_selected'
  | 'elected_chair'
  | 'unknown';

export interface ProvincialCommissioner {
  id: string;
  region_code: ProvincialRegionCode;
  region: string;
  committee: string;
  display_order: number;
  person: string;
  position: string;
  appointed_date: string | null;
  /** 선관위 공식 페이지의 원문 표기. 예: "국민의힘 추천", "지방법원장추천" */
  selection_method: string | null;
  /** 히트맵 분류용 파생값. 원문에 정당명이 없으면 party_unspecified로 둔다. */
  selection_route: ProvincialSelectionRoute;
  party_key: PartyKey | null;
  party_name: string | null;
  career_summary: string[];
  source_refs: SourceRef[];
}

export interface ProvincialCommissionersData {
  _note: string;
  snapshot_date: string;
  scope: 'province_committees';
  expected_regions: number;
  observed_members: number;
  counts: {
    by_region: Record<string, number>;
    by_route: Record<ProvincialSelectionRoute, number>;
    by_party: {
      ppp: number;
      dpk: number;
      unspecified_party: number;
    };
  };
  source_pages: {
    region_code: ProvincialRegionCode;
    region: string;
    title: string;
    url: string;
    retrieved_at: string;
  }[];
  commissioners: ProvincialCommissioner[];
}

// 가드레일 §6-1: 상태 라벨은 이 네 가지만 사용한다.
export type EventStatus = 'official' | 'investigating' | 'result_announced' | 'corrected';

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  official: '공식발표',
  investigating: '조사중',
  result_announced: '조사결과 발표',
  corrected: '정정됨',
};

// 가드레일: topics는 아래 통제 어휘만 사용한다 (자유 입력 금지 — 표기 드리프트 방지).
// 새 토픽이 필요하면 이 배열에 먼저 추가하고 합의한 뒤 데이터에 쓴다.
export const TOPICS = [
  '선관위',
  '6·3지방선거',
  '채용비리',
  '인쇄지침', // 투표용지 인쇄 매수·하한선 결정
  '잠실7동',
  '장외시위', // 개표소·투표함 봉쇄 등 장외 행동과 공권력 대응
  '수사',
  '국정조사',
  '진상규명위',
  '부정선거의혹', // 선거 결과·관리의 부정 주장 일반
  '외세개입설', // 중국·북한 등 외부 개입 주장
  '통계의혹', // 동일 득표 등 개표 수치 관련 의혹
] as const;
export type Topic = (typeof TOPICS)[number];

/**
 * 사건 간 일반 연결. 정정(supersedes)과 구분되는 참조다.
 * 예: 원인→결과(인쇄지침→부족사태), 주장→공식대응(의혹→법원·기관 대응).
 * 주장 자체를 항목으로 싣지 않고, 공식 대응 항목에서 맥락으로만 연결한다.
 */
export interface EventRef {
  id: string;
  /** 연결의 성격 한 줄. 예: "이 지침이 부족 사태의 직접 원인" */
  note?: string;
}

/**
 * 핵심 흐름 칩(전환점 요약)에 노출할 항목 표시.
 * 선정·라벨 규칙은 data/README.md 참조.
 * 라벨은 제목에서 뽑은 사실 조각만 - 판정·인과·형용 금지.
 */
export interface PivotMark {
  /** 칩에 표시할 짧은 사실 라벨. 예: "투표 중단·재개" */
  label: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  body_oneline: string;
  status: EventStatus;
  source_grade: 'official' | 'press_multi';
  source_refs: SourceRef[];
  supersedes?: string;
  /** 정정이 아닌 일반 연결. 렌더 시 "관련 기록" 앵커 링크로 노출 */
  related?: EventRef[];
  /** 핵심 흐름 칩 노출 표시 (선택). data/README.md 의 선정 규칙을 따른다 */
  pivot?: PivotMark;
  topics: Topic[];
}

export type InquiryStage =
  | '요구서제출'
  | '본회의의결'
  | '특위구성'
  | '계획서'
  | '기관보고'
  | '청문회'
  | '결과보고서';

export const INQUIRY_STAGES: InquiryStage[] = [
  '요구서제출',
  '본회의의결',
  '특위구성',
  '계획서',
  '기관보고',
  '청문회',
  '결과보고서',
];

/**
 * 국정조사 요구서. 여야가 범위가 다른 요구서를 각각 제출하는 단계가 실제로 존재하므로
 * 단일 Inquiry 아래 복수 요구서를 병렬로 담는다 (추후 단일 특위로 병합되면 그대로 보존).
 */
export interface InquiryRequest {
  party: string;
  /** 대표 발의·제출자 (보도에서 확인된 실명만) */
  proposers?: string;
  date: string;
  title: string;
  /** 요구서가 명시한 조사 범위 — 요구서마다 다르므로 그대로 기록 */
  scope?: string[];
  /** 구성 요구 등 부가 메모. 예: "여야 동수·야당 위원장 요구" */
  note?: string;
  source: SourceRef;
}

export interface Inquiry {
  id: string;
  name: string;
  stage: InquiryStage;
  stages_done: { stage: InquiryStage; date: string; source: string | null }[];
  /** 제출된 국정조사 요구서들 (여야 경쟁 제출 단계). 특위 구성 전까지 병렬 표시 */
  requests?: InquiryRequest[];
  committee_members: { name: string; party: string; role?: string }[];
  hearings: { date: string; title: string; source_refs: SourceRef[] }[];
  witnesses: { name: string; note?: string }[];
  related_bills: { bill_no: string; title: string; proposer?: string }[];
  next_event: { date: string | null; title: string };
}
