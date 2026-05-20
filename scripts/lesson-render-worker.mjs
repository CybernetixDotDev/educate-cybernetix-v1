import { createClient } from "@supabase/supabase-js";
import { setTimeout as sleep } from "node:timers/promises";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.LESSON_RENDERER_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const WORKER_SECRET = process.env.LESSON_RENDERER_SECRET;
const WORKER_ID = process.env.LESSON_RENDERER_WORKER_ID || `lesson-render-worker-${process.pid}`;
const POLL_MS = Number(process.env.LESSON_RENDERER_POLL_MS || 5000);
const JOB_TIMEOUT_MS = Number(process.env.LESSON_RENDERER_JOB_TIMEOUT_MS || 10 * 60 * 1000);
const BATCH_SIZE = Number(process.env.LESSON_RENDERER_BATCH_SIZE || 1);
const BACKOFF_BASE_SECONDS = Number(process.env.LESSON_RENDERER_BACKOFF_BASE_SECONDS || 30);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

if (!WORKER_SECRET) {
  console.error("LESSON_RENDERER_SECRET is required so the worker can call /api/lesson-renderer.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

let shuttingDown = false;
process.on("SIGINT", () => {
  shuttingDown = true;
});
process.on("SIGTERM", () => {
  shuttingDown = true;
});

function nowIso() {
  return new Date().toISOString();
}

function log(message, data = {}) {
  console.log(JSON.stringify({ timestamp: nowIso(), worker_id: WORKER_ID, message, ...data }));
}

function jobLog(event, message, extra = {}) {
  return { event, message, timestamp: nowIso(), worker_id: WORKER_ID, ...extra };
}

function nextRunAfter(attempts) {
  const seconds = BACKOFF_BASE_SECONDS * Math.max(1, attempts) ** 2;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function appendJobLog(job, entry) {
  const logs = Array.isArray(job.logs) ? job.logs : [];
  const { error } = await supabase
    .from("lesson_render_queue")
    .update({
      logs: [...logs, entry].slice(-50),
      updated_at: nowIso(),
    })
    .eq("id", job.id);

  if (error) log("failed_to_append_job_log", { job_id: job.id, error: error.message });
}

async function fetchPendingJobs() {
  const { data, error } = await supabase
    .from("lesson_render_queue")
    .select("*")
    .eq("status", "pending")
    .lte("run_after", nowIso())
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw new Error(error.message);
  return data || [];
}

async function claimJob(job) {
  const attempts = Number(job.attempts || 0) + 1;
  const { data, error } = await supabase
    .from("lesson_render_queue")
    .update({
      status: "processing",
      attempts,
      locked_at: nowIso(),
      locked_by: WORKER_ID,
      started_at: job.started_at || nowIso(),
      last_error: null,
      logs: [...(Array.isArray(job.logs) ? job.logs : []), jobLog("claimed", "Worker claimed render job.", { attempt: attempts })].slice(-50),
      updated_at: nowIso(),
    })
    .eq("id", job.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function callRenderer(renderId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JOB_TIMEOUT_MS);

  try {
    const response = await fetch(`${APP_URL.replace(/\/$/, "")}/api/lesson-renderer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WORKER_SECRET}`,
      },
      body: JSON.stringify({ render_id: renderId }),
      signal: controller.signal,
    });

    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text.slice(0, 700) };
    }

    if (!response.ok) {
      throw new Error(`Renderer returned ${response.status}: ${JSON.stringify(body).slice(0, 1000)}`);
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function completeJob(job, result) {
  const logs = Array.isArray(job.logs) ? job.logs : [];
  const { error } = await supabase
    .from("lesson_render_queue")
    .update({
      status: "completed",
      completed_at: nowIso(),
      locked_at: null,
      locked_by: null,
      logs: [...logs, jobLog("completed", "Render completed successfully.", { render_status: result?.render?.status })].slice(-50),
      updated_at: nowIso(),
    })
    .eq("id", job.id);

  if (error) throw new Error(error.message);
}

async function failOrRetryJob(job, error) {
  const attempts = Number(job.attempts || 1);
  const maxAttempts = Number(job.max_attempts || 3);
  const terminal = attempts >= maxAttempts;
  const message = error instanceof Error ? error.message : String(error);
  const logs = Array.isArray(job.logs) ? job.logs : [];

  const { error: updateError } = await supabase
    .from("lesson_render_queue")
    .update({
      status: terminal ? "failed" : "pending",
      run_after: terminal ? job.run_after : nextRunAfter(attempts),
      completed_at: terminal ? nowIso() : null,
      locked_at: null,
      locked_by: null,
      last_error: message,
      logs: [
        ...logs,
        jobLog(terminal ? "failed" : "retry_scheduled", message, {
          attempt: attempts,
          max_attempts: maxAttempts,
        }),
      ].slice(-50),
      updated_at: nowIso(),
    })
    .eq("id", job.id);

  if (updateError) throw new Error(updateError.message);

  if (terminal) {
    await supabase
      .from("lesson_renders")
      .update({
        status: "failed",
        error_message: message,
        updated_at: nowIso(),
      })
      .eq("id", job.render_id);
  }
}

async function processJob(job) {
  const claimed = await claimJob(job);
  if (!claimed) return;

  log("job_started", { job_id: claimed.id, render_id: claimed.render_id, attempt: claimed.attempts });

  try {
    const result = await callRenderer(claimed.render_id);
    await completeJob(claimed, result);
    log("job_completed", { job_id: claimed.id, render_id: claimed.render_id });
  } catch (error) {
    await appendJobLog(claimed, jobLog("renderer_error", error instanceof Error ? error.message : String(error)));
    await failOrRetryJob(claimed, error);
    log("job_failed_or_retried", {
      job_id: claimed.id,
      render_id: claimed.render_id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function main() {
  log("worker_started", { app_url: APP_URL, poll_ms: POLL_MS, batch_size: BATCH_SIZE });

  while (!shuttingDown) {
    try {
      const jobs = await fetchPendingJobs();

      if (jobs.length === 0) {
        await sleep(POLL_MS);
        continue;
      }

      for (const job of jobs) {
        if (shuttingDown) break;
        await processJob(job);
      }
    } catch (error) {
      log("worker_loop_error", { error: error instanceof Error ? error.message : String(error) });
      await sleep(POLL_MS);
    }
  }

  log("worker_stopped");
}

void main();
