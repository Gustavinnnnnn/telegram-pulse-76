
REVOKE EXECUTE ON FUNCTION public.purchase_dm_package(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.consume_dms(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_dm_package(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_dms(uuid, integer) TO authenticated;
