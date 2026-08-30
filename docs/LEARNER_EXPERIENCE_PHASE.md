# Learner experience phase

This phase connects three previously separate or incomplete areas: exam practice,
classroom interaction, and guided tutorials.

## What changed

- `/past-papers` is now an exam-practice library backed by the same
  `mockExamTemplates` catalogue used by the secure mock-exam flow. It no longer
  displays invented historical paper records or routes to a non-existent
  `past-paper` subject.
- Every library card deep-links to `/mock-exam?template=...`, opening the exact
  server-graded exam setup.
- `/live-classroom` now lists only classes visible through Supabase RLS and
  provides persistent real-time class chat. It does not claim to provide video
  calls or a collaborative whiteboard.
- Classroom messages are posted through `send_classroom_message`, which derives
  the sender name from their profile, validates class participation, limits
  messages to 1,000 characters, and permits at most 12 messages per minute.
- Class join codes are checked through `join_class_by_code`; direct learner
  membership inserts are removed and failed code attempts are rate-limited.
- Guided tutorials now cover all 14 learner-facing subjects, with at least one
  tutorial per subject and answer-checked knowledge checks.
- New interface copy is available in English, French, and German. Academic
  blueprint descriptions and tutorial lesson bodies remain in their authored
  language and the UI states this explicitly.

## Deployment

1. Apply `20260831000000_secure_classroom_hub.sql` on staging first.
2. Audit pre-existing classroom messages, then validate the new constraint:
   `ALTER TABLE public.classroom_messages VALIDATE CONSTRAINT
   classroom_messages_message_length_check;`. The migration marks the
   constraint `NOT VALID` so legacy data cannot block deployment; all new rows
   are still checked immediately.
3. Test class visibility with two unrelated teachers and two learners. A learner
   must not read or post in a class they have not joined.
4. Test a valid join code, an invalid code, repeat joining, and the limit of ten
   code attempts per minute.
5. Test the 1,000-character and 12-messages-per-minute limits.
6. Open several exam-library cards and confirm the matching template appears in
   exam setup.
7. Confirm each of the 14 subjects appears in the tutorial filter.
8. Run the full release checks before production deployment.

## Content boundary

Exam-board names describe curriculum alignment; the simulations are original
STEMCoach practice and are not reproduced official past papers. New tutorial
content must still receive subject-editor review before it is marketed as
academically verified or syllabus-specific.
