-- Migration to sync user roles to auth.users.raw_user_meta_data
-- This will allow us to fetch user + role in a single auth call

-- Function to update user metadata when role changes
create or replace function public.sync_role_to_metadata() 
returns trigger as $$
declare
  role_name text;
begin
  -- Get the role name
  select name into role_name 
  from public.roles 
  where id = new.role_id;
  
  -- Update the user's metadata
  update auth.users 
  set raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', role_name)
  where id = new.user_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to sync role changes to user metadata
create trigger on_user_role_changed
  after insert or update on public.user_roles
  for each row execute procedure public.sync_role_to_metadata();

-- Update existing user metadata with current roles
update auth.users 
set raw_user_meta_data = 
  coalesce(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', r.name)
from public.user_roles ur
join public.roles r on r.id = ur.role_id
where auth.users.id = ur.user_id;
