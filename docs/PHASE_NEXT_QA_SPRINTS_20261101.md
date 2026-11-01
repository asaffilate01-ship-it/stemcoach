# StemCoach — phase-next question bank and revision sprints

## What was built

This phase extends the existing client-authored *formative* lesson catalogue from **113 lessons / 440 Q&A self-checks** to **127 lessons / 524 Q&A self-checks**. Exactly 14 new guided lessons and 84 unique checks were drafted, one lesson and six checks per subject:

| Subject | New lesson | Checks |
| --- | --- | ---: |
| Mathematics | Arithmetic Sequences: Calculating Terms | 6 |
| Physics | Wave Speed, Frequency and Period | 6 |
| Chemistry | Molar Concentration: Volume and Dilution Calculations | 6 |
| Biology | Photosynthesis Rate: Limiting-Factor Analysis | 6 |
| Computer Science | Binary and Hexadecimal Data Representation | 6 |
| Economics | Production Frontiers: Capacity and Opportunity Cost | 6 |
| English Literature | Unseen Poetry: Voice, Imagery and Tone | 6 |
| Psychology | Memory: Encoding, Storage and Retrieval | 6 |
| Geography | Plate Boundaries and Hazard Risk | 6 |
| Business Studies | Cash Flow Forecasts and Liquidity | 6 |
| IELTS | IELTS Reading: Skimming, Scanning and Inference | 6 |
| CELTA | Teaching Pronunciation: Word Stress and Minimal Pairs | 6 |
| French | Imparfait et passé composé: Context and Events | 6 |
| German | German Modal Verbs and Word Order | 6 |
| **Total** | **14 guided lessons** | **84** |

The lessons include objectives, explanations, worked examples, exam tips, common misconceptions, hints and deterministic answer keys. They use existing MCQ, true/false, numeric, multiple-select, ordering, matching, short-answer and fill-blank components; no extra dependencies or third-party copyrighted content were introduced.

## The new student experience

The existing Q&A Clinic now offers a **Revision sprint length** control for **5, 10 or 20 questions**. Mixed and adaptive sprints respect that choice and the currently selected subject/topic, answer type, level and review focus. It never repeats a question in one sprint or claims more questions than the filtered inventory actually contains.

Timed sprints have an appropriate wall-clock allowance: 5 questions / 3 minutes, 10 questions / 5 minutes, or 20 questions / 10 minutes. A resumed browser tab uses the existing absolute-deadline timer so it does not award extra time. UI controls and the dynamic timed button are localised in English, German and French.

Topic URLs remain supported, e.g. `/qa-clinic?topic=arithmetic-sequences-nth-term`, with lesson navigation through `/tutorials?tutorial=arithmetic-sequences-nth-term`. Newly authored questions use the existing report-inaccuracy workflow.

## Content and security boundaries

- These are **original authored formative drafts**. They are **not** independently examined, certified or aligned to a specified awarding body's current specification. Avoid public marketing claims of officially verified or copyrighted past-paper questions.
- The learning copy itself is written in English. A translated navigation control is not a certified translation of educational content.
- The client self-checks use deterministic local marking and consume **no AI coaching credits**. AI tutor sessions remain behind existing authorization, quotas and safety checks.
- The server lesson context allowlist is updated in Git source, but no live Supabase function is deployed and no Omniqora ingestion is started. A deployment and knowledge re-index require correct StemCoach credentials, source classification and staging verification.
- No database migration, role change, paywall modification, personal-data export, Lovable build or paid agent activation is part of this release.

## Quality assurance and editorial sign-off

- `npm ci`, production dependency audit, TypeScript, lint, unit tests, production build, Playwright desktop/mobile and advisory Impeccable source check must pass before merging.
- The new tests check all 84 keys with both correct and incorrect attempts, question structure, explanation/hint presence, duplicate identifiers, title alignment with the server allowlist, default and filtered 5/10/20 sprint behaviour, and timed limits.
- Human reviewers must still check calculations, scientific nuance, literature and language interpretations, potentially ambiguous choices, accepted synonyms, marking fairness, child-friendly content, accessible math notation and board/version mapping.
- For each reviewed question, capture relevant authority/source, specification version, board/tier, reviewer identities and review dates before publishing into a paid *verified* bank.
- Physical iOS/Android testing, exact production deployment state, database security and cross-tenant isolation are **not** confirmed by a passing frontend CI run.

## Follow-on phase

Before converting this formative content into regulated or teacher-assigned graded exams, resolve staged assessment changes in [PR #20](https://github.com/asaffilate01-ship-it/stemcoach/pull/20) and the server-input hardening in [PR #28](https://github.com/asaffilate01-ship-it/stemcoach/pull/28), including atomic grading/quota idempotency in [Issue #29](https://github.com/asaffilate01-ship-it/stemcoach/issues/29). Do not directly apply unverified migrations to production.
