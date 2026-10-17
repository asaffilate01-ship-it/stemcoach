# STEMCoach education connections — phase 1 (17 October 2026)

## Shipped in source, NOT a live cross-app SSO connection

- Authenticated learner hub at /education-connections, linked on the learner dashboard.
- STEMCoach remains the source of truth for exercises, mastery, membership and approved content.
- A STEMCoach institution remains the authority for approving a learner's pending membership. A partner deep-link cannot elevate a role or consume a licensed seat.
- A deterministic, bounded mastery-based priority list links back to focus practice.
- User-initiated, locally downloaded v1 JSON progress digest includes only curriculum, subject, number of topics, mastery average, due-topic count and attempts. No learner ID, tenant ID, names, answers, grades, chat, medical or safeguarding data is exported.
- SchoolDash and UniPathway can display links only after their own server-authorised, operator-verified association of the source school or centre to a STEMCoach institution slug.

## Explicitly NOT enabled by this phase

- No shared Supabase Auth session or automatic STEMCoach account creation.
- No automatic enrolment, subscription granting, billing or SSO assertions.
- No automated upload/transfer of learner progress or raw attempts to SchoolDash, UniPathway or Omniqora.
- No inference about curriculum or learner eligibility based on URL query parameters.
- No new client API key or remote secrets.
- No production migration or deployment.

## Next secure increments

1. Both partner products must verify the source learner's active school/centre enrolment in a server-authenticated RPC, returning ONLY an operator-approved STEMCoach slug; any missing row fails closed.
2. Platform operators verify the corresponding institution administrator and organisation ownership out of band before activating mappings.
3. For automatic entitlements later: implement and test short-lived, one-time server-signed handoffs, audience/issuer checks, replay protection, entitlement revocation and seat enforcement. The source must establish real learner enrolment; STEMCoach must bind to the authenticated account.
4. For progress exchange later: authenticated learner consent and guardian/institution relationship where applicable, versioned minimal event, verified source-destination binding, server outbox, idempotent receipts and tenant-isolation tests. Never send raw answers, student chats or teacher-only materials.
5. Evaluate legal bases, child safeguarding and school data agreements before production rollout.

## Manual staging acceptance

- Unauthenticated visitors cannot open the hub.
- A learner sees only their own institution memberships and their own mastery records.
- School and centre links cannot approve membership, and no URL contains a student identifier or token.
- Missing deployed mastery RPC is handled as an error, not a fake success.
- The JSON export is generated in the browser without a network request.
- Existing STEMCoach practice and direct subscribers remain unaffected.
