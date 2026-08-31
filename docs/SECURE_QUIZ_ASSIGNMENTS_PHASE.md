# Secure quiz assignments phase

This phase completes the previously partial class quiz workflow. A teacher assignment now points to a fixed ordered set of independently reviewed questions; learners resume the same quiz; the answer-checking service records authoritative results; and teachers see verified progress.

## What ships

- Atomic teacher RPC for quiz creation, including title, instructions, optional topics, question count, difficulty range and due date.
- Fixed assignment question sets drawn only from published questions for the class subject and curriculum.
- Automatic backfill for legacy assignments, preferring their requested topics.
- Dedicated, account-protected assignment route with multiple choice, multi-select, ordering and text/numerical answer interactions.
- Resume from the first unanswered question on another device.
- Server-side duplicate-answer protection and automatic completion after the final question.
- Assigned classwork does not consume or depend on a learner's personal practice quota.
- Verified teacher reporting for started, answered, completed, score and class average.
- STEMCoach/STEM Team explanations after an answer has been graded.
- English, French and German interfaces.
- Database-coordinated answer rate limiting across Edge Function instances.

## Deployment order

1. Confirm `20260831000000_secure_classroom_hub.sql` is recorded.
2. Confirm `20260831010000_tutorial_learning_continuity.sql` is recorded.
3. Confirm `20260831020000_teacher_learning_paths.sql` is recorded.
4. Apply `20260831030000_secure_quiz_assignments.sql`.
5. Deploy the updated `check-answer` Edge Function. The migration must come first because the function fails closed if the distributed limiter is unavailable.
6. Deploy the web application.
7. In staging, create a quiz as a teacher, complete part on one learner device, resume on another, finish it, and confirm the teacher score.
8. Verify a learner cannot open another class's assignment, answer a question outside the fixed assignment, or submit the same question twice.
9. Verify assigned work remains available to an enrolled learner with no personal practice credits.

## Content boundary

Assignments use only questions whose `review_status` is `published`. This phase does not mark the separate two-million-question campaign complete; generated drafts still require the configured two-pass academic review before they become eligible for assignments.
