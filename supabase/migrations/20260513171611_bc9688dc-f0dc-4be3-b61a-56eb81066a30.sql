-- Revoke all anon execute rights on SECURITY DEFINER functions.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE ALL ON FUNCTION public.consume_dms(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.confirm_payment_intent(text, text) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_admin_signup() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

-- Re-grant only what the authenticated client truly needs.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_dms(uuid, integer) TO authenticated;