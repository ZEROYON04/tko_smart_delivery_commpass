create table public.recipient_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique,
  display_name text not null,
  line_user_id text,
  line_linked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger recipient_accounts_set_updated_at
before update on public.recipient_accounts for each row
execute function public.set_updated_at ();

alter table public.deliveries
add column recipient_id uuid references public.recipient_accounts (id);

-- 既存のデモデータを受取人アカウントへ移行する。
insert into
  public.recipient_accounts (
    customer_code,
    display_name,
    line_user_id,
    line_linked_at
  )
select
  'USER-' || chr(
    (
      64 + row_number() over (
        order by
          tracking_number
      )
    )::integer
  ) as customer_code,
  recipient_name,
  line_user_id,
  case
    when line_user_id is not null then now()
    else null
  end
from
  public.deliveries;

update public.deliveries as delivery
set
  recipient_id = account.id
from
  public.recipient_accounts as account
where
  account.display_name = delivery.recipient_name;

alter table public.deliveries
alter column recipient_id
set not null;

alter table public.deliveries
drop column line_user_id;

create index deliveries_recipient_idx on public.deliveries (recipient_id);

alter table public.recipient_accounts enable row level security;

create policy "Allow demo read recipient accounts" on public.recipient_accounts for
select
  to anon,
  authenticated using (true);

alter publication supabase_realtime
add table public.recipient_accounts;
