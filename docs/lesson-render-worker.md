# Lesson Render Worker

The Admin Lesson Studio queues MP4 render jobs in `lesson_render_queue`.

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
LESSON_RENDERER_SECRET=change-me
LESSON_RENDERER_APP_URL=http://localhost:3000
LESSON_RENDERER_MODE=queue
FFMPEG_PATH=ffmpeg
OPENAI_API_KEY=...
LESSON_TTS_MODEL=gpt-4o-mini-tts
LESSON_TTS_VOICE=alloy
LESSON_RENDERER_POLL_MS=5000
LESSON_RENDERER_JOB_TIMEOUT_MS=600000
LESSON_RENDERER_BATCH_SIZE=1
```

## Run

```bash
npm run worker:lesson-render
```

The worker:

- polls `lesson_render_queue`
- claims pending jobs
- calls `/api/lesson-renderer`
- generates slide SVGs, TTS audio, and MP4 with FFmpeg
- uploads outputs to `lesson-renders`
- updates `lesson_renders`
- retries failed jobs with backoff
- marks terminal failures after `max_attempts`
