CREATE OR REPLACE VIEW public.reconciliations_with_users AS
 SELECT r.id,
    r.reconciliation_date,
    r.status,
    r.notes,
    r.created_at,
    r.user_id,
    u.email AS user_email
   FROM (stock_reconciliations r
     LEFT JOIN auth.users u ON ((r.user_id = u.id)));
