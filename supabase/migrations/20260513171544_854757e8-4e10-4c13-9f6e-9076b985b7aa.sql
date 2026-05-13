-- Remove the free-credit exploit: any authenticated user could call purchase_dm_package
-- and receive DMs without payment. All purchases must go through the PIX webhook flow.
DROP FUNCTION IF EXISTS public.purchase_dm_package(uuid);

-- Lock down RPC surface: revoke direct execute on credit-mutation function from clients.
REVOKE ALL ON FUNCTION public.admin_adjust_balance(uuid, integer) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_banned(uuid, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_adjust_balance(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_banned(uuid, boolean) TO authenticated;
-- (admin functions still internally check has_role(auth.uid(), 'admin'))