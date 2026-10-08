# Institution class reporting and enrolment phase

## What ships
- Teachers may explicitly associate classes they own with one of their approved tuition centres or schools.
- The binding uses a SECURITY DEFINER RPC and an RLS-closed association table; no client can impersonate a teacher or link a third-party class.
- A class belongs to at most one institution for reporting purposes. Personal/unlinked classes remain private to the owning teacher and enrolled students.
- Institutional admins receive aggregate class enrolments, assigned quizzes, completed submissions and average scored percentages.
- Only approved institutional students in the class count towards institution reports; other students and personal practice attempts are excluded.
- Average scores require at least three completed submissions to reduce small-cohort exposure. No individual names or attempt answers are returned by the report RPC.

## Deployment
1. Verify and apply earlier institution onboarding and teacher invitation migrations in a staging Supabase project.
2. Apply \`20261008212000_institution_class_reporting.sql\`.
3. Deploy the web client. No new secrets are required.
4. Check teacher membership RLS and verify association table's INSERT/UPDATE/DELETE are denied to browser users.
5. Validate end-to-end with a teacher and admin from two separate institutions.

## Acceptance matrix
- A non-member cannot link, list or report institution classes.
- A teacher cannot link a class belonging to another teacher, even with the UUID.
- A teacher cannot link a class to an unrelated institution.
- A linked class cannot be linked to another institution.
- A teacher who is no longer approved cannot see its link through the teacher RPC; its class is excluded from institution reporting until membership is restored.
- An institution admin cannot view another institution's class report.
- Non-institution students enrolled in the class never contribute attempts or submissions.
- At one or two completed submissions the average score is NULL; at three or more it is a number.
- Existing personal classes and students continue to work without an institution association.

## Next work
Per-student reports with consent and strict institution-scoped row-level authorization,
exportable report scheduling, plan/seat billing, teacher offboarding, enterprise SSO,
and native remote video tuition still require additional production work.
