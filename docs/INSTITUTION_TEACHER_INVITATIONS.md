# Institution teacher invitation phase

## Delivered

1. Only approved institution administrators can issue one-time teacher invitation links.
2. The link is valid for seven days, is bound to an exact email address, and is revocable until accepted.
3. Only a signed-in user with a confirmed, matching email may redeem the link.
4. Tokens are 64 hexadecimal characters generated from two random UUIDs; only a SHA-256 token hash is stored in PostgreSQL.
5. The institution membership and global teacher permission are granted atomically by a SECURITY DEFINER RPC.
6. Self-selecting "teacher" during registration no longer grants a teacher role. Parent onboarding metadata retains its current behaviour.
7. Links are copied and delivered by the institution administrator; this phase does not claim an email sending integration.
8. Administrators can see issued links' email/status/expiry and revoke pending invites without recovering the original token.

## Before deployment

- Back up Supabase and inspect role grants and existing teacher memberships.
- Apply \`supabase/migrations/20261008205000_institution_teacher_invites.sql\` after \`20261008190000_institution_onboarding_security.sql\`.
- Deploy the frontend with the migration; the new RPCs fail closed before the migration is applied.
- Existing teachers retain their roles; nothing in this migration revokes them.
- Verify the email template and activation link on your Supabase Auth provider.

## Staging acceptance matrix

- Anonymous caller cannot issue/list/revoke/accept an invite.
- Student and approved institution teacher cannot issue an invite.
- Admin A cannot issue/revoke/list teacher invites for tenant B.
- New account selecting teacher during signup receives student access until an invitation is accepted.
- An unverified email cannot accept a teacher invitation.
- A verified account with another email cannot accept it.
- A correct invite promotes that exact user to approved tenant teacher plus global teacher role.
- A second redemption fails; revoked/expired codes fail; a newer invite invalidates an older code for the same email.
- Two concurrent redemptions of the same token cannot create duplicate role/membership rows.
- Teacher can create classes after acceptance, but cannot approve tenant members or manage branding.
- Direct browser table INSERT/UPDATE/DELETE against \`institution_teacher_invites\` is rejected.

## Still to build

Teacher offboarding and permission revocation, enterprise SSO, automatic email delivery, institution
billing/seat upgrades, and tenant-scoped classroom progress reporting need additional phases.
