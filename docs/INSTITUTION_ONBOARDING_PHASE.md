# Secure institution onboarding phase

## Scope

- Self-service institution registration is a single authenticated, atomic PostgreSQL RPC.
- Only the registering user is made an approved institution admin; callers cannot supply privileged role or plan values.
- Incoming student requests must start pending with no approval metadata.
- Institution admins can approve/reject pending students with the tenant's licensed student capacity enforced transactionally.
- Direct browser UPDATE/DELETE privileges on member status and direct tenant configuration writes are revoked.
- Institution branding is editable only through an admin-gated RPC with HTTPS logo and colour validation.
- Institution invitation links prefill the institution identifier; the existing student join workflow still requires admin approval.

## Deployment prerequisites

1. Back up the database and review existing RLS grants on `public.tenants` and `public.tenant_members`.
2. Apply `supabase/migrations/20261008190000_institution_onboarding_security.sql` in staging after the August 2026 migrations.
3. Deploy the React frontend. No new Edge Function secret is needed.
4. Verify the new functions are callable by authenticated users only.
5. Do not consider the project live until a real staging Supabase project passes the tests below.

## Staging acceptance

- A new account can register an institution, and the owner receives one approved admin membership.
- Invalid/duplicate slugs fail; no orphaned tenant remains after a failed RPC.
- A client cannot insert an approved or admin/teacher membership using the REST API.
- A client cannot update `plan`, `max_students`, `custom_domain` or member roles via REST.
- A pending student appears in the correct institution's approval queue.
- An approved admin can approve/reject a pending student; a teacher and unrelated student cannot.
- 50 approved students on a free plan prevent a 51st approval, including simultaneous requests.
- An admin cannot review a member of another tenant.
- Branding edits are reflected on other authenticated tabs and cannot change subscription limits.
- An invitation link pre-fills the correct institution slug, and a student can request to join.

## Remaining commercial work

Enterprise invoicing, institution billing and seat upgrades, staff invitations and role promotion,
tenant switcher, SSO, institution-specific reporting, and operational monitoring still require
separate implementations. These have not been represented as completed.
