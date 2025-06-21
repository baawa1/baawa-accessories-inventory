-- Utility function to manually refresh a user's role metadata
-- Call this if role metadata gets out of sync
create or replace function public.refresh_user_role_metadata(user_id_param uuid)
returns void as $$
declare
  role_name text;
begin
  -- Get the current role name
  select r.name into role_name 
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = user_id_param;
  
  -- Update the user's metadata
  update auth.users 
  set raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', coalesce(role_name, 'Pending'))
  where id = user_id_param;
end;
$$ language plpgsql security definer;
