export type OnboardingData = {
  display_name: string;
  grade_level: string;
  learning_goals: string[];
  parent_email: string;
  project_preference: string;
};

export type OnboardingResult = {
  ok: boolean;
  message: string;
  dashboard_path?: string;
};

