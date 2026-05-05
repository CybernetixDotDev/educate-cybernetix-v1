FULL PLATFORM QA CHECKLIST — Educate‑Cybernetix v1
1. 🔐 Authentication & RBAC
Google OAuth login works

Email/password login works

Logout works

Session persists across refresh

Session invalidates correctly on logout

user_roles table correctly assigns:

student

parent

admin

Admin routes reject non‑admins

Parent routes reject non‑parents

Student routes reject non‑students

Onboarding redirect works:

onboarding_complete = false → /onboarding

onboarding_complete = true → /dashboard

2. 🛡️ Supabase RLS Policies
Verify RLS for each table:

Students can:
read/write their own:

profiles

lesson_progress

quiz_results

student_projects

project_tasks

certificates

growth timelines

coaching plans

debug sessions

code review sessions

Parents can:
read ONLY linked student data

cannot write student data

cannot access other students

Admins can:
read/write everything

bypass RLS safely

Test RLS manually:
Try reading another student’s data

Try writing to another student’s data

Try accessing admin tables as student

Try accessing parent tables as student

Everything should fail except allowed paths.

3. 🎓 Student Experience QA
Dashboard
Loads without errors

Shows next lesson

Shows quick tools

Shows project snapshot

Shows AI mentor insight

Shows engagement summary

Shows recommended actions

Learning Flow
Module list loads

Lesson loads

Content renders correctly:

text

images

code blocks

tips

examples

Progress updates on lesson completion

Quizzes
Quiz loads

Options selectable

Score saved

Explanation shown

Results stored in quiz_results

AI Tools
Mentor responds

Project mentor responds

Debugger works end‑to‑end

Code review works end‑to‑end

Presentation coach generates:

outline

script

demo

Q&A

Certificates load

Growth timeline loads

4. 👨‍👩‍👦 Parent Experience QA
Dashboard
Parent sees linked students

Student selector works

Weekly summary loads

Engagement analytics load

Skill snapshot loads

Project progress loads

AI insights load

Recommended guidance loads

Monthly Reports
Report loads

All sections render

Parent cannot edit

Access Control
Parent cannot access student tools

Parent cannot access admin tools

5. 🛠️ Admin Experience QA
Dashboard
Overview metrics load

Quick actions work

Student overview loads

Parent overview loads

Role snapshot loads

AI system status loads

Recent activity loads

System health loads

Role Management
Assign role works

Remove role works

Link parent → student works

Unlink works

Curriculum Pipeline
Upload lesson JSON works

Validation works

Preview works

Publish version works

Rollback works

Quiz versioning works

AI Systems
Test each generator:

Lesson generator

Quiz generator

Weekly summary

Parent report

Certificate generator

Growth timeline

Presentation coach

Debugging engine

Code review engine

Coaching engine

6. 📚 Curriculum QA
Lessons
All 12 weeks load

All lessons load

All content blocks render

No broken images

No missing fields

Quizzes
All quizzes load

All questions valid

All answers correct

No malformed JSON

Versioning
Version history loads

Rollback works

Current version updates

7. 🧭 Navigation QA
Student Nav
All links work

Active state correct

Mobile menu works

Parent Nav
All links work

Student selector works

Admin Nav
All links work

Protected routes enforced

8. ⚙️ Performance QA
npm run build passes

No hydration errors

No server/client boundary errors

No Suspense boundary errors

Lighthouse score:

Performance > 80

Accessibility > 90

Best Practices > 90

SEO > 90

9. 🧪 End‑to‑End Scenarios
Scenario A — New Student
Signup

Onboarding

Dashboard

Learning

Quiz

Project mentor

Debugger

Code review

Presentation coach

Certificate

Growth timeline

Scenario B — Parent
Signup

Linked to student

Dashboard

Monthly report

Scenario C — Admin
Login

Manage roles

Manage curriculum

Generate reports

View analytics

10. 🚀 Production Readiness
Environment variables set

Supabase project locked down

RLS verified

Admin accounts verified

Error logging enabled

AI provider unified

No console errors

No unhandled promise rejections

No missing Suspense boundaries

No missing loading states