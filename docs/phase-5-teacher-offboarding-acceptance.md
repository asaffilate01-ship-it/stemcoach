# Phase 5: teacher offboarding — staging acceptance

This migration adds `offboard_institution_teacher(tenant_id, teacher_user_id)` for approved institution administrators. It does **not** send email, revoke an active Supabase JWT, delete authored content, or implement seat billing.

## Release prerequisites

1. Apply the Phase 3 and Phase 4 institution migrations first.
2. Apply `20261008220000_institution_teacher_offboarding.sql` in an isolated staging Supabase project.
3. Run the following cases using **real authenticated JWTs** in separate sessions. Never use service-role keys for authorization tests.
4. Review any teacher-authorized RLS policies, Edge Functions, classroom writes and teacher dashboards: a valid JWT may retain claims until refresh, so protected resources must consult current database authorization.
5. Only deploy to production after database/RLS, UI, and regressions pass.

## Test matrix

| Scenario | Expected result |
| --- | --- |
| Approved admin offboards own tenant's approved teacher | `true`, membership becomes rejected, approved metadata cleared |
| Same admin repeats request | `false`, no additional change |
| Student calls RPC | permission denied |
| Teacher calls RPC | permission denied |
| Admin in Tenant A attempts offboard Tenant B teacher | permission denied |
| Admin attempts to offboard self | invalid selection |
| Target is student or admin rather than teacher | `false`, roles unchanged |
| Teacher belongs to two institutions, A and B | Offboard A removes only A membership; global teacher role remains |
| Teacher last institution offboarded | Global teacher role is removed; teacher-only operations fail after role recheck |
| Concurrent offboarding requests for same user | No lingering teacher role without an approved institution |
| Existing assignments and learner attempts | Historical data retained, no unauthorized cross-tenant access |

## Known boundary

The existing `create_institution_teacher_invite` and acceptance flow must be audited together with offboarding in staging, including simultaneous accept/offboard actions. Do not treat the new RPC as proof that all teacher RLS policies are safe. Build a teacher-removal UI only with a confirmation prompt and refetch of authoritative membership state.
