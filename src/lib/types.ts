// PRD v0.2 §7 데이터 모델

export type Body = 'nec' | 'supreme_court' | 'constitutional_court';

export type SelectionTrack =
  | 'president'
  | 'assembly_ruling'
  | 'assembly_opposition'
  | 'assembly_consensus'
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
  appointed_date: string;
  term_start?: string;
  term_end?: string;
  career_summary: string[];
  source_refs: SourceRef[];
}

// 가드레일 §6-1: 상태 라벨은 이 네 가지만 사용한다.
export type EventStatus = 'official' | 'investigating' | 'result_announced' | 'corrected';

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  official: '공식발표',
  investigating: '조사중',
  result_announced: '조사결과 발표',
  corrected: '정정됨',
};

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  body_oneline: string;
  status: EventStatus;
  source_grade: 'official' | 'press_multi';
  source_refs: SourceRef[];
  supersedes?: string;
  topics: string[];
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

export interface Inquiry {
  id: string;
  name: string;
  stage: InquiryStage;
  stages_done: { stage: InquiryStage; date: string; source: string | null }[];
  committee_members: { name: string; party: string; role?: string }[];
  hearings: { date: string; title: string; source_refs: SourceRef[] }[];
  witnesses: { name: string; note?: string }[];
  related_bills: { bill_no: string; title: string; proposer?: string }[];
  next_event: { date: string | null; title: string };
}
