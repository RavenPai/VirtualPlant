-- Store login email so n8n can send the daily mission digest.

alter table public.profiles
  add column if not exists email text;

alter table public.profiles
  add column if not exists notify_missions boolean not null default true;

create index if not exists profiles_notify_email_idx
  on public.profiles (notify_missions)
  where notify_missions = true and email is not null;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and coalesce(p.email, '') = ''
  and u.email is not null;
