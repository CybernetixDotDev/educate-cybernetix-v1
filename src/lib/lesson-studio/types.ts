export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type QuizDifficulty = "easy" | "medium" | "hard";

export type LessonBrief = {
  lesson_title: string;
  age_range: string;
  skill_level: SkillLevel;
  subject_area: string;
  learning_objectives: string[];
  required_project_outcome: string;
  hands_on_task_requirements: HandsOnTaskRequirement[];
  task_verification_criteria: string[];
  final_project_submission_requirements: FinalProjectSubmissionRequirements;
  required_tools: string[];
  estimated_duration: string;
  tone_style: string;
  quiz_question_count: number;
  quiz_difficulty: QuizDifficulty;
  safety_constraints: string[];
  reference_notes: string;
  example_assets: string[];
  branding_theme_tags: string[];
};

export type CheckpointType = "screenshot" | "file" | "link" | "text";

export type HandsOnTaskRequirement = {
  task_name: string;
  instruction: string;
  short_video_requirement: string;
  student_action: string;
  checkpoint_type: CheckpointType;
  ai_verification_criteria: string[];
  ai_mentor_guidance: string;
  expected_output: string;
  difficulty_level: QuizDifficulty;
};

export type FinalProjectSubmissionRequirements = {
  required_uploads: CheckpointType[];
  submission_checklist: string[];
  stretch_goals: string[];
  completion_criteria: string[];
  micro_survey_questions: string[];
  ai_mentor_feedback_rules: string[];
};

export type LessonBlock = {
  type:
    | "learning_goal"
    | "text"
    | "example"
    | "code"
    | "image"
    | "video"
    | "diagram"
    | "task"
    | "checkpoint"
    | "common_mistake"
    | "mentor_prompt"
    | "recap";
  title?: string;
  value?: string;
  url?: string;
  alt?: string;
  language?: string;
  provider?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  transcript?: string;
};

export type GeneratedQuizQuestion = {
  type: "mcq" | "true_false" | "short";
  question: string;
  options?: string[];
  answer: string | number | boolean;
  explanation?: string;
  difficulty?: QuizDifficulty;
  skill_tags?: string[];
};

export type CoOpTask = {
  title: string;
  instruction: string;
  short_video: {
    title?: string;
    script: string;
    duration_minutes: number;
    url?: string;
  };
  action: string;
  checkpoint_submission: {
    prompt: string;
    accepted_formats: CheckpointType[];
  };
  ai_verification: {
    criteria: string[];
  };
  ai_mentor_support: {
    prompt_starter: string;
    support_focus: string;
  };
};

export type LessonTask = {
  task_id: string;
  title: string;
  instruction: string;
  video_url: string;
  action: string;
  checkpoint_type: CheckpointType;
  ai_verification_criteria: string[];
};

export type LessonFinalSubmission = {
  required_task_checkpoints: string[];
  final_project_upload: {
    required: boolean;
    prompt: string;
    accepted_formats: CheckpointType[];
  };
  micro_survey: [
    {
      question_id: "continue";
      question: "Do you want to continue?";
      type: "yes_no";
    },
    {
      question_id: "most_interesting";
      question: "What was the most interesting thing you learned?";
      type: "text";
    },
  ];
  ai_mentor_final_review: {
    reviews_all_submissions: boolean;
    gives_feedback: boolean;
    awards_completion: boolean;
    unlocks_next_co_op: boolean;
    review_prompt: string;
  };
};

export type LessonGeneratorOutput = {
  generated_lesson_id?: string;
  hook: string;
  objective: string[];
  teaching_steps: string[];
  build_task: {
    title?: string;
    instructions?: string[];
    expected_outcome?: string;
    tools?: string[];
  };
  checkpoint: string[];
  recap: string;
  next_step: string;
  video_script: string;
  lesson_blocks: LessonBlock[];
  tasks: LessonTask[];
  final_submission: LessonFinalSubmission;
  co_op_tasks: CoOpTask[];
  quiz: {
    questions: GeneratedQuizQuestion[];
  };
  project_checklist: string[];
  transcript: string;
};

export type StoryboardScene = {
  scene_id: string;
  title: string;
  duration_seconds: number;
  on_screen_text: string;
  visual_type: "title_slide" | "concept_slide" | "demo_slide" | "checklist_slide" | "quiz_prompt_slide" | "recap_slide";
  animation_style: string;
  narration_text: string;
  asset_references: string[];
};

export type LessonStoryboard = {
  storyboard_id?: string;
  generated_lesson_id?: string | null;
  title: string;
  total_duration_seconds: number;
  style_notes: string;
  scenes: StoryboardScene[];
  caption_notes: string;
  render_notes: string;
};

export type LessonRender = {
  render_id: string;
  storyboard_id?: string | null;
  generated_lesson_id?: string | null;
  status: "queued" | "assets_ready" | "processing" | "completed" | "failed";
  mp4_url?: string | null;
  thumbnail_url?: string | null;
  captions_vtt_url?: string | null;
  captions_srt_url?: string | null;
  transcript_url?: string | null;
  manifest_url?: string | null;
  error_message?: string | null;
  render_json: {
    bucket: string;
    base_path: string;
    tts_narration: Array<{
      scene_id: string;
      text: string;
      duration_seconds: number;
    }>;
    slide_manifest: Array<{
      scene_id: string;
      title: string;
      visual_type: StoryboardScene["visual_type"];
      duration_seconds: number;
      on_screen_text: string;
      animation_style: string;
      asset_references: string[];
    }>;
    renderer_webhook_called: boolean;
    slide_asset_urls?: string[];
    tts_audio_urls?: string[];
    local_renderer_completed?: boolean;
    local_renderer_error?: string | null;
  };
};

export type LessonRenderQueueJob = {
  id: string;
  render_id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  attempts: number;
  max_attempts: number;
  run_after: string;
  locked_at?: string | null;
  locked_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  last_error?: string | null;
  logs: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
};

export type LessonReviewStatus = "draft" | "generated" | "in_review" | "approved" | "published" | "archived";

export type PublishTarget = {
  module_key: string;
  module_title: string;
  module_description: string;
  lesson_key: string;
  lesson_order_index: number;
};

export type PublishResult = {
  module_id: string;
  lesson_id: string;
  lesson_version_id: string;
  lesson_version_number: number;
  quiz_id: string;
  quiz_version_id: string;
  quiz_version_number: number;
  lesson_url: string;
};

export type TaskSubmissionEvidence = {
  screenshot_url?: string;
  uploaded_file_url?: string;
  link?: string;
  text_explanation?: string;
};

export type TaskVerificationInput = {
  lesson_title: string;
  task_title: string;
  task_instructions: string;
  task_verification_criteria: string[];
  submission: TaskSubmissionEvidence;
};

export type TaskVerificationResult = {
  status: "pass" | "needs_revision";
  reason: string;
  feedback: string;
  next_step: string;
  hint: string;
};

export type LessonBlueprintSummary = {
  id: string;
  title: string;
  status: string;
  updated_at: string | null;
  brief: LessonBrief;
};

export type LessonStudioActionResult<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};
