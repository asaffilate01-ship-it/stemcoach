# Three-market draft planning
This planner is an offline/local planning step, not an active generation campaign.
The public repository contains code and synthetic test fixtures only. Put curriculum
manifests and job exports in approved private storage, never in public Git or Actions logs.

## Manifest
Prepare an object with schemaVersion 1, scope "stemcoach-three-market-v1" and an
outcomes array. Each row requires market (PK, GB or DE), jurisdiction (exact name
from marketProgramme), authority, qualification, stage, track, language (en, de,
ar, ur or cy), specificationVersion, outcomeCode, sourceUrl (HTTPS), reviewReference
(an opaque internal review reference, not a personal name) and targetQuestions
(an integer 1–500). Source metadata must be supplied by the curriculum review team;
the validator cannot authenticate a source or an academic decision.

The allocation is 400,000 Pakistan, 350,000 UK and 250,000 Germany. Explicitly map
each shared international outcome once rather than duplicate the same allocation
in multiple markets. The planner rejects repeated versioned source/outcome/track
metadata; semantic overlap and question duplication still need independent review.
Partial manifests are supported, but only exact market allocations are complete.
The 500-slot per-outcome ceiling is an operational planning safeguard, not evidence
that 500 distinct academically useful questions can be written for an outcome.

## Run
- Admin Question Generator: open a private mapping JSON; inspect allocation and
  export the next local window of at most 1,000 job specifications. Reopening
  the manifest resets the UI cursor to zero.
- Node 22 CLI: node --experimental-strip-types scripts/plan-launch-bank.mjs PRIVATE_MANIFEST.json
- To export a specific window, add --jobs CURSOR, redirect output to approved private
  storage and use nextCursor for the next window. Never change the manifest during
  a resumed sequence. Store its checksum in the private work record.

The stable job keys and bounded job windows split each outcome's allocation into
batches of at most 20 draft questions. They do not modify existing generation
campaigns. The legacy all-market bulk seed button remains disabled until a
versioned backend import, persisted scope, idempotent queue and production tests
are available. Do not import the draft jobs into the legacy queue directly: the
legacy worker cannot yet enforce versioned outcome metadata or this market scope.

## Before publication
Use the exact official subject specification, rights review, independent academic
answer checks, native-language review when required, duplicate screening and two
independent reviewer decisions. Do not count a planned slot, a generated draft or
a practice variation as an approved item. Preserve hidden countries and language
records without advertising them to new learners. Enforce access in the server
and database for verified institutional students, not in browser visibility alone.
