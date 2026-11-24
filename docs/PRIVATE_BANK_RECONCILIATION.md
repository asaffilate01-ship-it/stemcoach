# Private question-bank reconciliation
Use this local workflow before any approved staging/database import. The public
repository contains validation code and synthetic test fixtures, not answer banks.

1. Extract each private ZIP to a separate directory in controlled storage. Keep
   the original archives unchanged and order the directory arguments consistently.
2. Run `node scripts/reconcile-private-bank.mjs PACK_001 PACK_002 ...`.
3. Resolve structural, duplicate, scope, quiz/lesson reference and market-link
   failures before continuing. A valid report is a structural check only.
4. Optionally run `node scripts/reconcile-private-bank.mjs --index NEW_PRIVATE_FILE.json PACK_001 PACK_002 ...`.
   This writes a new local metadata-only review index outside the repository,
   with no stems, options or answers. Existing files are not overwritten. Pack
   numbers refer to the supplied argument order; preserve that order alongside
   the index. No database is contacted.
5. Retain archived Turkish items separately; they do not count towards the
   current UK, Germany and Pakistan launch scope. Welsh bilingual practice may
   contain English prompts. All visible study tracks must remain within the
   launch policy.

The command accepts at most 200 pack directories, 128 MiB per input JSON and
250,000 records per run. It is a bounded local reconciliation step, not the
million-record production ingestion service. For larger runs, use a durable
database-backed deduplication index in an approved private environment.

The report keeps original drafts, computational variants, quizzes, lessons and
candidate outcome metadata separate. Every new item is still a draft;
independent academic review, official versioned curriculum mappings, rights
review, native-language verification, semantic duplicate checks, server-side
entitlements and production RLS tests are required before release.

No generated bank, answer key, job window or private review index may be
committed to public GitHub or uploaded as a public CI artifact.
