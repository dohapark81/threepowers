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
