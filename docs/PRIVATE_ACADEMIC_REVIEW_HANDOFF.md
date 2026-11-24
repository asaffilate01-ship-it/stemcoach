# Private academic review handoff
This is a local, metadata-only workflow before secure backend review. It requires
Node 22 with type stripping and the extracted private content packs. Never commit
the worklist, attestations, source packs or review evidence to public Git.

1. Run `node --experimental-strip-types scripts/review-private-bank.mjs worklist NEW_PRIVATE_FILE.json PACK_DIR...`.
   Only reconciled, in-scope original drafts appear. Variants and archived language
   material do not enter this worklist. Each row has a SHA-256 digest of the full
   question record (including answer and explanation), pack order and row number.
2. Provide the underlying private question to qualified reviewers using an
   authorised workflow, alongside an actual official qualification specification.
   The digest is a revision identifier, not a signature or access credential.
3. Assemble a separate JSON object with schemaVersion 1, scope
   "stemcoach-private-review-v1" and items. Each item has questionId,
   questionDigest, mapping and attestations. Mapping has market, jurisdiction,
   authority, qualification, stage, specificationVersion, outcomeCode, sourceUrl.
   Each attestation has reviewerRef (opaque internal identifier), questionDigest,
   mappingDigest (digestRecord(mapping)), decision (pass, revise, reject), checks.
   Checks are explicit booleans for answer, distractors, explanation, curriculum,
   language, originality and rights. All must be true for a pass.
4. Run `node --experimental-strip-types scripts/review-private-bank.mjs check PRIVATE_ATTESTATIONS.json PACK_DIR...`.
   The report rejects inconsistent mappings, duplicate reviewers, missing IDs,
   invalid source URL syntax and stale question or mapping digests. It never
   prints the answer bank. A revision to content or mapping requires fresh review.

One matching pair of distinct pass attestations is only a candidate for server
verification, never an academically approved or released question. The tool does
not authenticate reviewers, verify source authenticity, detect all semantic
duplicates or certify independence. Those checks and authorisation must happen
on the secure backend. No Supabase writes, published content, student access,
or live generation are performed by this tool.
