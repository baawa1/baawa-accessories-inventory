-- Update the signup trigger to also set user metadata
create or replace function public.assign_pending_role() 
returns trigger as $$
begin
  -- Insert role record
  insert into public.user_roles (user_id, role_id)
  values (new.id, (select id from public.roles where name = 'Pending'));
  
  -- Set role in user metadata for immediate access
  update auth.users 
  set raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'Pending')
  where id = new.id;
  
  return new;
end;
$$ language plpgsql security definer;
