# Teacher learning paths phase

This phase connects the existing classroom hub, guided tutorials, persistent STEMCoach lesson context, and account-synced tutorial progress.

## What ships

- Teachers can assign an ordered path of 1–12 verified tutorials to a class, with instructions and an optional due date.
- The database rejects tutorials that do not exist or do not match the class subject.
- Students see path progress in My Classes and can open the next unfinished tutorial directly.
- Opening a path lesson records activity using the existing tutorial continuity RPC.
- Completing all knowledge checks updates the existing account-owned tutorial progress. Teacher reports derive completion from that server-owned data; there is no client-writable learning-path completion flag.
- Teachers see per-learner completion counts and whole-path completion.
- Teacher Dashboard, My Classes, and the learning-path interface are translated in English, French, and German.
- Legacy quiz assignment policies now verify class ownership and membership.

## Deployment order

1. Apply `20260831000000_secure_classroom_hub.sql` if it is not already recorded in the target migration ledger.
2. Apply `20260831010000_tutorial_learning_continuity.sql` if it is not already recorded.
3. Apply `20260831020000_teacher_learning_paths.sql`.
4. Deploy the web app.
5. In staging, create one class per supported subject and confirm only matching tutorials appear.
6. Join as a learner, start a path, complete a tutorial, and confirm the teacher report changes only after the knowledge checks are mastered.
7. Verify a learner cannot read another class's paths and a teacher cannot create a path for another teacher's class.

Do not reorder steps 1–3: the learning-path migration depends on the classroom membership helpers and tutorial progress table created by the earlier phases.

## Honest boundary

The catalogue contains the 29 reviewed tutorial lessons currently shipped in the app. This phase does not claim that the separate 2,000,000-question generation and two-pass review campaign has finished. That remains a resumable production content operation with independent academic review before publication.
