// core/api/feedback/feedback-test.interface.ts

export interface CompletedTestResponse {
  ok: boolean;
  message: string;
  data: CompletedTestData;
}

export interface CompletedTestData {
  test_view_id:       number;
  test_id:            number;
  chapter_id:         number;
  completed_at:       string;         // ISO-8601
  total_questions:    number;
  attempts_completed: number;
  limit:              number | null;  // null si ilimitado
  can_retry:          boolean;
  chapter_completed:  boolean;
  certificate_issued: boolean;
  score:              number | null;  // null si test.score == false
}
