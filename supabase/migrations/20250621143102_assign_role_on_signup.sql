create function public.assign_pending_role() 
returns trigger as $$
begin
  insert into public.user_roles (user_id, role_id)
  values (new.id, (select id from public.roles where name = 'Pending'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.assign_pending_role();