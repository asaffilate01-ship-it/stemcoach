# Learning continuity phase

This phase connects guided tutorials, learner progress, and the persistent
STEM Team coaching experience.

## What changed

- Tutorial completion and the most recently opened unfinished lesson are saved
  to the signed-in learner's account and can continue on another device.
- Existing device-only completions are migrated to the learner account on the
  next signed-in tutorial visit. Guest progress remains device-only.
- Tutorial cards now link to a subject coach with a validated tutorial ID. The
  Edge Function resolves that ID against the server-side tutorial catalogue;
  it never trusts a browser-supplied lesson title.
- The coach displays the active lesson and offers a translated prompt to work
  through it step by step.
- Coach request limits are stored in PostgreSQL, so parallel Edge Function
  instances share the same 20-requests-per-minute threshold.
- STEM Team counts are derived from the identity catalogue. Copy now makes it
  explicit that Lexi covers both IELTS and CELTA and that the total includes
  STEMCoach.
- New continuity and squad interface copy is complete in English, French, and
  German. Tutorial bodies and mascot biographies remain in their authored
  language, with a visible notice when the interface language is not English.

## Deployment order

1. Apply `20260831010000_tutorial_learning_continuity.sql` on staging.
2. Deploy the updated `ai-chat` Edge Function. The migration must be present
   first because the function fails closed if the distributed limiter is
   unavailable.
3. Deploy the web application.
4. Complete one tutorial as a guest, sign in, and confirm it appears on a
   second device after refresh.
5. Open a tutorial, choose **Ask coach**, and confirm the matching lesson and
   subject appear in the coach screen.
6. Send more than 20 coach requests within one minute from parallel clients and
   confirm subsequent requests return HTTP 429.
7. Confirm direct INSERT/UPDATE/DELETE access to `user_tutorial_progress` is
   denied for authenticated browser clients.

## Honest product boundary

Tutorial completion is learner-attested progress based on client knowledge
checks; it is not a formal qualification or independently proctored result.
The two-million-question campaign remains a generation and two-pass review
operation, not a claim that two million reviewed questions are already live.
