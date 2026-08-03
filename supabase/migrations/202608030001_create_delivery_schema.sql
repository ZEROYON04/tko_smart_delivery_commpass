create extension if not exists pgcrypto;

create table public.delivery_runs (
  id uuid primary key default gen_random_uuid(),
  driver_name text not null,
  delivery_date date not null default current_date,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  current_stop_order integer not null default 0,
  depot_latitude double precision not null,
  depot_longitude double precision not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.delivery_runs (id) on delete cascade,
  tracking_number text not null unique,
  recipient_name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  delivery_method text not null default 'handoff' check (delivery_method in ('handoff', 'dropoff')),
  status text not null default 'pending' check (
    status in (
      'pending',
      'out_for_delivery',
      'delivered',
      'absent',
      'cancelled'
    )
  ),
  service_seconds integer not null default 300 check (service_seconds >= 0),
  line_user_id text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.route_stops (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.delivery_runs (id) on delete cascade,
  delivery_id uuid not null unique references public.deliveries (id) on delete cascade,
  stop_order integer not null,
  estimated_arrival timestamptz,
  arrived_at timestamptz,
  departed_at timestamptz,
  locked boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, stop_order)
);

create table public.route_legs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.delivery_runs (id) on delete cascade,
  leg_order integer not null,
  from_latitude double precision not null,
  from_longitude double precision not null,
  to_stop_id uuid not null references public.route_stops (id) on delete cascade,
  distance_meters integer not null check (distance_meters >= 0),
  duration_seconds integer not null check (duration_seconds >= 0),
  provider text not null default 'mock',
  route_geometry jsonb,
  calculated_at timestamptz not null default now(),
  unique (run_id, leg_order)
);

create table public.driver_locations (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.delivery_runs (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  recorded_at timestamptz not null default now()
);

create index driver_locations_run_recorded_idx on public.driver_locations (run_id, recorded_at desc);

create table public.delivery_events (
  id bigint generated always as identity primary key,
  delivery_id uuid not null references public.deliveries (id) on delete cascade,
  event_type text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at () returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger delivery_runs_set_updated_at
before update on public.delivery_runs for each row
execute function public.set_updated_at ();

create trigger deliveries_set_updated_at
before update on public.deliveries for each row
execute function public.set_updated_at ();

create trigger route_stops_set_updated_at
before update on public.route_stops for each row
execute function public.set_updated_at ();

create or replace function public.recalculate_run_eta (p_run_id uuid) returns void language plpgsql security definer
set
  search_path = public as $$
declare
  run_record public.delivery_runs%rowtype;
  stop_record record;
  cursor_time timestamptz;
  next_eta timestamptz;
begin
  select * into run_record
  from public.delivery_runs
  where id = p_run_id;

  if not found then
    raise exception 'RUN_NOT_FOUND';
  end if;

  cursor_time := coalesce(
    run_record.started_at,
    (run_record.delivery_date::timestamp + time '09:00') at time zone 'Asia/Tokyo'
  );

  for stop_record in
    select
      rs.id as stop_id,
      d.status as delivery_status,
      d.service_seconds,
      rl.duration_seconds
    from public.route_stops rs
    join public.deliveries d on d.id = rs.delivery_id
    join public.route_legs rl
      on rl.run_id = rs.run_id and rl.leg_order = rs.stop_order
    where rs.run_id = p_run_id
    order by rs.stop_order
  loop
    next_eta := cursor_time + make_interval(secs => stop_record.duration_seconds);

    -- 完了済み地点の実績に近いETAは保持し、現在地以降だけを更新する。
    if stop_record.delivery_status <> 'delivered' then
      update public.route_stops
      set estimated_arrival = next_eta
      where id = stop_record.stop_id;
    end if;

    cursor_time := next_eta + make_interval(secs => stop_record.service_seconds);
  end loop;
end;
$$;

create or replace function public.change_delivery_method (
  p_delivery_id uuid,
  p_method text,
  p_expected_version integer
) returns jsonb language plpgsql security definer
set
  search_path = public as $$
declare
  current_delivery public.deliveries%rowtype;
  updated_delivery public.deliveries%rowtype;
  next_service_seconds integer;
begin
  if p_method not in ('handoff', 'dropoff') then
    raise exception 'INVALID_DELIVERY_METHOD';
  end if;

  select * into current_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if not found then
    raise exception 'DELIVERY_NOT_FOUND';
  end if;

  if current_delivery.version <> p_expected_version then
    raise exception 'VERSION_CONFLICT';
  end if;

  next_service_seconds := case when p_method = 'handoff' then 300 else 10 end;

  update public.deliveries
  set
    delivery_method = p_method,
    service_seconds = next_service_seconds,
    version = version + 1
  where id = p_delivery_id
  returning * into updated_delivery;

  insert into public.delivery_events (delivery_id, event_type, old_value, new_value)
  values (
    p_delivery_id,
    'delivery_method_changed',
    jsonb_build_object(
      'deliveryMethod', current_delivery.delivery_method,
      'serviceSeconds', current_delivery.service_seconds
    ),
    jsonb_build_object(
      'deliveryMethod', updated_delivery.delivery_method,
      'serviceSeconds', updated_delivery.service_seconds
    )
  );

  perform public.recalculate_run_eta(updated_delivery.run_id);

  return jsonb_build_object(
    'deliveryId', updated_delivery.id,
    'deliveryMethod', updated_delivery.delivery_method,
    'serviceSeconds', updated_delivery.service_seconds,
    'version', updated_delivery.version
  );
end;
$$;

create or replace function public.change_delivery_status (
  p_delivery_id uuid,
  p_status text,
  p_expected_version integer
) returns jsonb language plpgsql security definer
set
  search_path = public as $$
declare
  current_delivery public.deliveries%rowtype;
  updated_delivery public.deliveries%rowtype;
  next_stop_order integer;
  next_delivery_id uuid;
begin
  if p_status not in ('pending', 'out_for_delivery', 'delivered', 'absent', 'cancelled') then
    raise exception 'INVALID_DELIVERY_STATUS';
  end if;

  select * into current_delivery
  from public.deliveries
  where id = p_delivery_id
  for update;

  if not found then
    raise exception 'DELIVERY_NOT_FOUND';
  end if;

  if current_delivery.version <> p_expected_version then
    raise exception 'VERSION_CONFLICT';
  end if;

  update public.deliveries
  set status = p_status, version = version + 1
  where id = p_delivery_id
  returning * into updated_delivery;

  insert into public.delivery_events (delivery_id, event_type, old_value, new_value)
  values (
    p_delivery_id,
    'delivery_status_changed',
    jsonb_build_object('status', current_delivery.status),
    jsonb_build_object('status', updated_delivery.status)
  );

  if p_status in ('delivered', 'absent', 'cancelled') then
    select rs.stop_order, rs.delivery_id
    into next_stop_order, next_delivery_id
    from public.route_stops rs
    join public.deliveries d on d.id = rs.delivery_id
    where rs.run_id = updated_delivery.run_id
      and d.status in ('pending', 'out_for_delivery')
    order by rs.stop_order
    limit 1;

    if next_stop_order is null then
      update public.delivery_runs
      set status = 'completed', completed_at = now()
      where id = updated_delivery.run_id;
    else
      update public.delivery_runs
      set current_stop_order = next_stop_order
      where id = updated_delivery.run_id;

      update public.deliveries
      set status = 'out_for_delivery'
      where id = next_delivery_id and status = 'pending';
    end if;
  end if;

  return jsonb_build_object(
    'deliveryId', updated_delivery.id,
    'status', updated_delivery.status,
    'version', updated_delivery.version
  );
end;
$$;

alter table public.delivery_runs enable row level security;

alter table public.deliveries enable row level security;

alter table public.route_stops enable row level security;

alter table public.route_legs enable row level security;

alter table public.driver_locations enable row level security;

alter table public.delivery_events enable row level security;

create policy "Allow demo read delivery runs" on public.delivery_runs for
select
  to anon,
  authenticated using (true);

create policy "Allow demo read deliveries" on public.deliveries for
select
  to anon,
  authenticated using (true);

create policy "Allow demo read route stops" on public.route_stops for
select
  to anon,
  authenticated using (true);

create policy "Allow demo read route legs" on public.route_legs for
select
  to anon,
  authenticated using (true);

create policy "Allow demo read driver locations" on public.driver_locations for
select
  to anon,
  authenticated using (true);

grant usage on schema public to anon,
authenticated;

grant
select
  on public.delivery_runs,
  public.deliveries,
  public.route_stops,
  public.route_legs,
  public.driver_locations to anon,
  authenticated;

revoke
execute on function public.recalculate_run_eta (uuid)
from
  public,
  anon,
  authenticated;

revoke
execute on function public.change_delivery_method (uuid, text, integer)
from
  public,
  anon,
  authenticated;

revoke
execute on function public.change_delivery_status (uuid, text, integer)
from
  public,
  anon,
  authenticated;

grant
execute on function public.recalculate_run_eta (uuid) to service_role;

grant
execute on function public.change_delivery_method (uuid, text, integer) to service_role;

grant
execute on function public.change_delivery_status (uuid, text, integer) to service_role;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deliveries'
  ) then
    alter publication supabase_realtime add table public.deliveries;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'route_stops'
  ) then
    alter publication supabase_realtime add table public.route_stops;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'delivery_runs'
  ) then
    alter publication supabase_realtime add table public.delivery_runs;
  end if;
end;
$$;
