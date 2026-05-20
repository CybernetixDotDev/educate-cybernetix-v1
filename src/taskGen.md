
 Dynamic Lesson Generation Studio
Build an AI Lesson Studio inside the admin panel of our self-paced online learning platform for ages 8-21. The system must dynamically generate lessons on demand in a consistent Starter School-style format, then render them into MP4 lectures, quizzes, project steps, and student-facing lesson pages.
Goal
Create a lesson-generation workflow where an admin enters a structured lesson brief, and the platform uses AI to generate:
•	A lesson script.
•	A short narrated MP4 lecture.
•	A storyboard with slides or scenes.
•	Quiz questions.
•	A project/task checklist.
•	Captions and transcript.
•	A publish-ready lesson page.
The output should always feel structured, consistent, practical, and project-based.
---
Core Product Requirements
1. Admin Lesson Brief
Build an admin form that lets the curriculum team define a lesson using structured fields:
•	Lesson title.
•	Age range.
•	Skill level.
•	Subject area.
•	Learning objectives.
•	Required project outcome.
•	Hands-On Task Requirements (5-7 Tasks). For each task:
  • Task Name.
  • Instruction (2-3 sentences).
  • Short Video Requirement (2-5 min).
  • Student Action.
  • Checkpoint Type: Screenshot, File upload, Link, or Text.
  • AI Verification Criteria.
  • AI Mentor Guidance.
  • Expected Output.
  • Difficulty Level.
•	Final Project Submission Requirements:
  • Required uploads.
  • Submission checklist.
  • Stretch goals.
  • Completion criteria.
  • Micro-survey questions.
  • AI mentor feedback rules.
•	Required tools/software.
•	Estimated duration.
•	Tone/style.
•	Number of quiz questions.
•	Difficulty of quiz.
•	Safety or compliance constraints.
•	Optional reference notes.
•	Optional example assets.
•	Optional branding/theme tags.
The admin should be able to save this as a reusable lesson blueprint.
---
2. AI Lesson Generation
When the admin clicks Generate Lesson, the system should use the lesson brief as the source of truth and create a complete lesson package.
The AI should generate:
•	A short hook.
•	A clear lesson objective.
•	A step-by-step teaching sequence.
•	A student task or project.
•	A short recap.
•	Quiz questions tied to the lesson.
•	A narration script for MP4 rendering.
The AI must stay within the lesson brief and should not change:
•	Age range.
•	Topic.
•	Project outcome.
•	Skill level.
•	Required tools.
•	Safety rules.
---
3. Lesson Format
Every generated lesson should follow the same format:
1.	Hook
•	1 short paragraph.
•	Explain why the lesson matters.
2.	Objective
•	1–3 bullet points.
•	State exactly what the student will learn.
3.	Teaching Steps
•	3–7 clear steps.
•	Short, simple, action-oriented.
•	Each step should lead the student forward.
4.	Build Task
•	The student applies what they learned.
•	Include step-by-step instructions.
•	Include checkpoints.
•	Every lesson includes 5-7 Co-Op Tasks.
•	Each Co-Op Task includes:
  • Instruction.
  • Short Video, 2-5 minutes.
  • Action.
  • Checkpoint Submission.
  • AI Verification.
  • AI Mentor Support.
•	Tasks are first-class lesson JSON objects:
  {
    "task_id": "w1l1-t1",
    "title": "Build the Request-Response Diagram",
    "instruction": "Draw the request-response cycle using arrows...",
    "video_url": "https://yourcdn.com/videos/w1l1-t1.mp4",
    "action": "Create your own diagram...",
    "checkpoint_type": "screenshot",
    "ai_verification_criteria": [
      "Diagram includes browser, DNS, server",
      "Arrows show direction of request and response"
    ]
  }
•	Every lesson ends with a Final Submission:
  • All 5-7 task checkpoints.
  • Final project upload.
  • 2-question micro-survey:
    • "Do you want to continue?" (Yes/No)
    • "What was the most interesting thing you learned?"
  • AI Mentor Final Review:
    • Reviews all submissions.
    • Gives feedback.
    • Awards completion.
    • Unlocks next co-op.
5.	Quiz
•	3–10 questions.
•	Mix of multiple choice, true/false, fill-in-the-blank, or short answer.
•	Questions must test the lesson objective.
6.	Recap
•	Summarize the key concept in a simple way.
7.	Next Step
•	Suggest what the student should do after finishing.
---
4. MP4 Lecture Rendering
The platform must be able to turn the generated lesson into a narrated video.
The renderer should:
•	Turn the script into narration.
•	Create slides or scenes from the lesson outline.
•	Add captions.
•	Add basic motion and transitions.
•	Export an MP4 file.
•	Save a thumbnail.
•	Save a transcript.
Implementation status:
•	The Admin Lesson Studio can prepare render assets after storyboard generation.
•	The pipeline creates a TTS narration manifest from scene narration.
•	The pipeline creates a slide/scene manifest for rendering.
•	The pipeline generates VTT and SRT captions.
•	The pipeline generates a thumbnail SVG.
•	The pipeline uploads manifest, captions, transcript, and thumbnail to Supabase Storage.
•	If LESSON_RENDERER_WEBHOOK_URL is configured, the pipeline hands off MP4 export to the renderer service.
The lecture style should feel like a modern online university lesson:
•	Clean.
•	Fast-paced.
•	Clear.
•	Professional.
•	Visually polished.
•	Easy for students to follow.
---
5. Storyboard Generator
Create a storyboard builder that converts the lesson script into a scene plan.
Each scene should contain:
•	Scene title.
•	Scene duration.
•	On-screen text.
•	Visual type.
•	Animation style.
•	Narration text.
•	Asset references.
Scene types can include:
•	Title slide.
•	Concept slide.
•	Demo slide.
•	Checklist slide.
•	Quiz prompt slide.
•	Recap slide.
Implementation status:
•	Storyboard generation is available from the Admin Lesson Studio after generating a lesson package.
•	Storyboards are saved to lesson_storyboards and linked to generated_lessons when available.
•	The storyboard JSON includes title, total duration, style notes, scenes, caption notes, and render notes.
---
6. Quiz Generator
Create a quiz generator that uses the same lesson brief and generated lesson content.
The quiz engine should:
•	Generate questions from the lesson objective.
•	Match the student age group.
•	Match the difficulty level.
•	Provide correct answers.
•	Provide explanations.
•	Support retry logic.
•	Store quiz version history.
---
7. Project Builder
Each lesson should include a practical task or project.
The AI should generate:
•	Project instructions.
•	Required steps.
•	Expected outcome.
•	Submission checklist.
•	Optional stretch goals.
•	Completion criteria.
The project must be directly linked to the lesson objective.
---
8. Admin Review Flow
Before publishing, the lesson must pass through a review workflow.
Build these states:
•	Draft.
•	Generated.
•	In review.
•	Approved.
•	Published.
•	Archived.
Admins should be able to:
•	Edit the generated script.
•	Edit the quiz.
•	Edit the storyboard.
•	Regenerate only one section.
•	Compare versions.
•	Approve or reject the lesson.
•	Re-render the MP4 after edits.
Implementation status:
•	The Admin Lesson Studio now includes a Review + Publish panel.
•	Admins can save edits to lesson JSON, quiz JSON, and storyboard JSON.
•	Admins can move lessons through Generated, In Review, Approved, Published, and Archived review states.
•	Admins can approve, reject, archive, and publish reviewed lessons into the live curriculum tables.
•	Publishing creates lesson_versions and quiz_versions used by the student lesson system.
---
9. Versioning
Every generated lesson must be versioned.
Store:
•	Lesson brief version.
•	Script version.
•	Quiz version.
•	Storyboard version.
•	MP4 render version.
•	Approval history.
•	Timestamp of every change.
•	Who made the change.
---
10. Student View
Create a student-facing lesson page that displays:
•	Lesson title.
•	Video player.
•	Objectives.
•	Lesson notes.
•	Project checklist.
•	Quiz.
•	Progress tracking.
•	Completion button.
The student experience should feel simple and guided.
---
Data Model
Create database tables or collections for:
•	 lesson_blueprints 
•	 generated_lessons 
•	 lesson_scripts 
•	 lesson_storyboards 
•	 lesson_quizzes 
•	 lesson_projects 
•	 lesson_renders 
•	 lesson_versions 
•	 lesson_reviews 
•	 student_lesson_progress 
Each record should link back to the blueprint and final published lesson.
---
AI Behavior Rules
The AI must:
•	Follow the lesson brief exactly.
•	Use age-appropriate language.
•	Use clear and concise teaching language.
•	Avoid unnecessary filler.
•	Keep lessons practical and project-based.
•	Generate content in a consistent format.
•	Never modify the core learning objective.
•	Never generate unsafe, inappropriate, or off-topic content.
The AI should:
•	Improve clarity.
•	Simplify explanations.
•	Break tasks into smaller steps.
•	Make lessons engaging.
•	Keep the tone educational and encouraging.
---
Technical Requirements
Frontend
•	Use React or Next.js.
•	Build an admin lesson studio interface.
•	Include preview panels for script, storyboard, quiz, and MP4.
•	Include tabs for each lesson section.
•	Include a publish workflow.
Backend
•	Use Node.js, Python, or FastAPI.
•	Build APIs for lesson generation, rendering, review, and publishing.
•	Support background jobs for MP4 creation.
•	Support file storage for video and captions.
Media Pipeline
•	Use TTS for narration.
•	Use FFmpeg or a rendering service to create MP4 files.
•	Generate subtitles in SRT or VTT format.
•	Save thumbnails and lesson previews.
Storage
•	Store lesson content in PostgreSQL or a similar database.
•	Store generated media in S3 or equivalent object storage.
Analytics
Track:
•	Lesson generation time.
•	Admin edit rate.
•	Video completion rate.
•	Quiz pass rate.
•	Student engagement.
•	Lesson regeneration frequency.
---
UI Components Needed
Build these components in the admin panel:
•	Lesson blueprint editor.
•	Generate lesson button.
•	Script preview panel.
•	Quiz editor.
•	Storyboard preview panel.
•	Render status panel.
•	MP4 preview player.
•	Version comparison view.
•	Approval buttons.
•	Publish button.
---
Sample Lesson Flow
1.	Admin creates a lesson blueprint.
2.	Admin clicks Generate Lesson.
3.	AI produces script, quiz, project, and storyboard.
4.	Admin reviews and edits content.
5.	Admin clicks Render MP4.
6.	The platform creates the narrated video and captions.
7.	Admin approves and publishes the lesson.
8.	Students access the lesson page and complete the project and quiz.
---
Deliverables
Build:
•	Admin lesson studio.
•	Dynamic lesson generator.
•	Storyboard generator.
•	Quiz generator.
•	MP4 renderer.
•	Versioning system.
•	Review and approval workflow.
•	Student lesson page.
---
Style Guidelines
The lesson format should feel:
•	Starter School-style.
•	Task-driven.
•	Practical.
•	Structured.
•	Modern.
•	Easy to follow.
•	Focused on real outcomes.
The visual presentation should be:
•	Clean.
•	Professional.
•	High-trust.
•	Polished.
•	Consistent across all lessons.
---
Final Instruction
Generate all lesson assets dynamically from the admin lesson brief, but always preserve the lesson structure, age appropriateness, and project outcome so every lesson feels consistent across the platform.
