import type { LessonCheckpointType } from "@/lib/lessons/getLesson";

export type CoOpSubmissionEvidence = {
  screenshot_url?: string;
  uploaded_file_url?: string;
  link?: string;
  text_explanation?: string;
};

export type CoOpTaskSubmission = {
  id: string;
  student_id: string;
  module_key: string;
  lesson_key: string;
  task_id: string;
  checkpoint_type: LessonCheckpointType;
  submission_json: CoOpSubmissionEvidence;
  verification_json: {
    status?: "pass" | "needs_revision";
    reason?: string;
    feedback?: string;
    next_step?: string;
    hint?: string;
  };
  status: "submitted" | "pass" | "needs_revision";
  created_at: string;
  updated_at: string;
};

export type CoOpFinalSubmission = {
  id: string;
  student_id: string;
  module_key: string;
  lesson_key: string;
  task_checkpoint_ids: string[];
  project_submission_json: CoOpSubmissionEvidence;
  micro_survey_json: Record<string, string>;
  mentor_review_json: {
    status?: "pass" | "needs_revision";
    feedback?: string;
    next_step?: string;
    completion_awarded?: boolean;
    unlock_next?: boolean;
  };
  status: "submitted" | "pass" | "needs_revision";
  created_at: string;
  updated_at: string;
};

export type CoOpProgress = {
  taskSubmissions: CoOpTaskSubmission[];
  finalSubmission: CoOpFinalSubmission | null;
};

export type CoOpActionResult<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};
