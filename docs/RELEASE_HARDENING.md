# STEMCoach release hardening

This phase establishes a secure, auditable baseline. It does not claim that the
two-million-question target has been reached. Learner-facing counts include only
questions that match the active curriculum filters and have two independent
reviews.

## Before deployment

1. Back up the production database and inspect duplicate Stripe session IDs:

   ```sql
   select stripe_session_id, count(*)
   from public.purchases
   where stripe_session_id is not null
   group by stripe_session_id
   having count(*) > 1;
   ```

   The hardening migration stops if any duplicates exist. Reconcile them before
   continuing; do not delete paid entitlements without an account-level audit.

2. Preview content quarantine impact:

   ```sql
   select subject, count(*) as questions_to_review
   from public.questions
   where review_status = 'published'
     and (
       reviewed_by is null or reviewed_at is null
       or academic_verified_by is null or academic_verified_at is null
       or reviewed_by = academic_verified_by
       or length(trim(coalesce(specification_version, ''))) < 5
       or coalesce(source_url, '') !~ '^https://[^[:space:]]+$'
     )
   group by subject
   order by subject;
   ```

   Migration `20260830235900_release_hardening.sql` keeps these rows but moves
   them to `needs_review`. This can substantially reduce visible inventory and is
   intentional: a legacy `published` default is not proof of academic review.

3. Confirm the 24 live Stripe price IDs in
   `supabase/functions/_shared/productCatalog.ts`. Unsupported prices receive no
   quota. Confirm each ID and regional price in the Stripe dashboard before
   deploying.

4. Set Edge Function secrets:

   ```sh
   supabase secrets set APP_ORIGIN=https://stemcoach.lovable.app
   supabase secrets set STRIPE_SECRET_KEY=sk_live_REPLACE_ME
   ```

   Do not place service-role or Stripe secret keys in browser `VITE_` variables.

## Deployment order

1. Apply database migrations with `supabase db push`.
2. Deploy `create-checkout`, `verify-purchase`, and `daily-mascot-notify`.
3. Deploy the web application.
4. Complete one live-mode purchase with a dedicated test account, verify exactly
   one purchase row and one quota increment, then issue/refund it according to
   the team's Stripe test procedure.
5. Repeat the verification request and confirm the quota is unchanged. This
   exercises idempotency.
6. Check country, level, board, and difficulty selections against the displayed
   subject counts.

## Content expansion gate

Generate/import content in bounded review batches rather than inserting millions
of learner-visible rows at once. A question is release-ready only when it has:

- a supported curriculum, subject, topic, question type, and difficulty;
- an official HTTPS source and a specific syllabus/specification version;
- a complete answer, explanation, worked solution, and relevant mark scheme;
- a first academic verification and a second independent publication review;
- no unresolved quality flags.

Use `get_content_release_readiness()` from an authorised reviewer account to
track the queue. Native-language reviewers must approve translated educational
content; UI translation completeness does not certify academic correctness.

## Automated release check

Run:

```sh
npm ci
npx playwright install --with-deps chromium
npm audit --audit-level=high
npm run release:preflight
```

CI runs the same type, lint, unit, production-build, browser, and dependency
checks on pushes and pull requests.
