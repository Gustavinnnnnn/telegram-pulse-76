
REVOKE EXECUTE ON FUNCTION public.purchase_dm_package(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.confirm_payment_intent(text, text) FROM anon, authenticated, public;
