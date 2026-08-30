# Adaptive mastery rollout

## Delivered in this phase

- Persistent mastery, confidence, evidence count, streak and next-review date for each learner, curriculum, subject and topic.
- Secure diagnostic, focus and mixed practice selection from published questions only.
- Difficulty selection that follows the learner's current topic score and avoids questions seen in the previous six hours where alternatives exist.
- Spaced review intervals from four hours after an incorrect response up to thirty days for secure repeated performance.
- A translated learner Mastery Map driven by the persistent STEM Coach/STEM Team character system, including François and Hans.
- Existing attempt history is converted into a confidence-weighted starting score during migration.

## Security boundary

The browser cannot write `attempts` or `learner_topic_mastery` directly. Both objective answers and AI-graded extended responses are recorded by authenticated Edge Functions using the service role. Only those server-verified results can call `update_learner_topic_mastery`.

Adaptive question selection returns the same safe fields as `questions_safe`. Correct answers, model answers, explanations, worked solutions and marking schemes are not returned before submission. The answer checker continues to enforce publication state, plan subjects, quotas and rate limits.

The migration also removes legacy learner SELECT policies on the base `questions` table. Administrator, teacher and assigned-reviewer policies remain available for their governed workflows; learner access is confined to safe projections and server-checked answers.

## Deployment

1. Back up production and apply `20260830233000_adaptive_mastery_engine.sql` to staging.
2. Confirm the history backfill completes and compare mastery attempt totals with `attempts`.
3. Deploy `check-answer` and `ai-tutor` after the migration; both call the service-only mastery update function.
4. Deploy the web app and test diagnostic, focus and mixed sessions in English, French and German.
5. Verify that an authenticated browser cannot insert an `attempts` row or call `update_learner_topic_mastery` directly.
6. Verify correct and incorrect answers update score, confidence and next-review timing, including essay grading.

## Calibration before broad release

The scoring deltas and spaced intervals are safe defaults, not claims of psychometric validation. Run a staged learner cohort, compare predicted mastery with independently marked assessments, and calibrate the thresholds by subject and qualification level before using the score for high-stakes decisions.
