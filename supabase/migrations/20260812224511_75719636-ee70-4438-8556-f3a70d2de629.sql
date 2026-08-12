
-- Prevent users from editing their own purchased balances
REVOKE UPDATE ON public.user_quotas FROM authenticated;
GRANT UPDATE (subjects, levels, updated_at) ON public.user_quotas TO authenticated;

-- Internal helpers should not be callable anonymously
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_tenant_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_tenant_teacher(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_teacher(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_parent_on_exam() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_study_group_member_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_dev_quota(uuid) FROM PUBLIC, anon, authenticated;
