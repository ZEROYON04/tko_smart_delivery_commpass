alter table public.delivery_runs
add column depot_name text not null default '東広島市役所 配送拠点',
add column depot_address text not null default '広島県東広島市西条栄町8番29号',
add column route_revision integer not null default 1,
add column route_provider text not null default 'mock',
add column optimized_at timestamptz,
add column optimization_note text;

alter table public.deliveries
add column carrier text not null default 'yamato' check (carrier in ('yamato', 'sagawa', 'japan_post')),
add column requested_window_code text,
add column window_start timestamptz,
add column window_end timestamptz,
add column available_from timestamptz,
add column is_reattempt boolean not null default false,
add column reattempt_count integer not null default 0 check (reattempt_count >= 0),
add column last_absent_at timestamptz,
add constraint valid_delivery_window check (
  window_start is null
  or window_end is null
  or window_end > window_start
);

create table public.route_optimizations (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.delivery_runs (id) on delete cascade,
  revision integer not null,
  reason text not null,
  provider text not null,
  previous_order jsonb not null,
  new_order jsonb not null,
  created_at timestamptz not null default now()
);

create index route_optimizations_run_created_idx on public.route_optimizations (run_id, created_at desc);

alter table public.route_optimizations enable row level security;

create policy "Allow demo read route optimizations" on public.route_optimizations for
select
  to anon,
  authenticated using (true);

grant
select
  on public.route_optimizations to anon,
  authenticated;

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

  cursor_time := greatest(
    now(),
    coalesce(
      run_record.started_at,
      (run_record.delivery_date::timestamp + time '09:00') at time zone 'Asia/Tokyo'
    )
  );

  for stop_record in
    select
      rs.id as stop_id,
      rs.estimated_arrival,
      d.status as delivery_status,
      d.service_seconds,
      d.available_from,
      d.window_start,
      rl.duration_seconds
    from public.route_stops rs
    join public.deliveries d on d.id = rs.delivery_id
    join public.route_legs rl
      on rl.run_id = rs.run_id and rl.leg_order = rs.stop_order
    where rs.run_id = p_run_id
    order by rs.stop_order
  loop
    if stop_record.delivery_status in ('delivered', 'cancelled') then
      continue;
    end if;

    next_eta := cursor_time + make_interval(secs => stop_record.duration_seconds);
    next_eta := greatest(
      next_eta,
      coalesce(stop_record.available_from, next_eta),
      coalesce(stop_record.window_start, next_eta)
    );

    update public.route_stops
    set estimated_arrival = next_eta
    where id = stop_record.stop_id;

    cursor_time := next_eta + make_interval(secs => stop_record.service_seconds);
  end loop;
end;
$$;

create or replace function public.schedule_delivery_reattempt (
  p_delivery_id uuid,
  p_expected_version integer,
  p_available_at timestamptz,
  p_window_code text,
  p_window_start timestamptz,
  p_window_end timestamptz
) returns jsonb language plpgsql security definer
set
  search_path = public as $$
declare
  current_delivery public.deliveries%rowtype;
  updated_delivery public.deliveries%rowtype;
begin
  if p_window_end <= p_window_start then
    raise exception 'INVALID_DELIVERY_WINDOW';
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
  set
    status = 'pending',
    requested_window_code = p_window_code,
    window_start = p_window_start,
    window_end = p_window_end,
    available_from = p_available_at,
    is_reattempt = true,
    reattempt_count = reattempt_count + 1,
    last_absent_at = now(),
    version = version + 1
  where id = p_delivery_id
  returning * into updated_delivery;

  insert into public.delivery_events (delivery_id, event_type, old_value, new_value)
  values (
    p_delivery_id,
    'delivery_reattempt_scheduled',
    jsonb_build_object(
      'status', current_delivery.status,
      'windowCode', current_delivery.requested_window_code
    ),
    jsonb_build_object(
      'status', updated_delivery.status,
      'availableFrom', updated_delivery.available_from,
      'windowCode', updated_delivery.requested_window_code,
      'windowStart', updated_delivery.window_start,
      'windowEnd', updated_delivery.window_end
    )
  );

  return jsonb_build_object(
    'deliveryId', updated_delivery.id,
    'runId', updated_delivery.run_id,
    'version', updated_delivery.version,
    'availableFrom', updated_delivery.available_from,
    'windowCode', updated_delivery.requested_window_code
  );
end;
$$;

create or replace function public.change_delivery_window (
  p_delivery_id uuid,
  p_expected_version integer,
  p_window_code text,
  p_window_start timestamptz,
  p_window_end timestamptz
) returns jsonb language plpgsql security definer
set
  search_path = public as $$
declare
  current_delivery public.deliveries%rowtype;
  updated_delivery public.deliveries%rowtype;
begin
  if p_window_end <= p_window_start then
    raise exception 'INVALID_DELIVERY_WINDOW';
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
  set
    requested_window_code = p_window_code,
    window_start = p_window_start,
    window_end = p_window_end,
    version = version + 1
  where id = p_delivery_id
  returning * into updated_delivery;

  insert into public.delivery_events (delivery_id, event_type, old_value, new_value)
  values (
    p_delivery_id,
    'delivery_window_changed',
    jsonb_build_object('windowCode', current_delivery.requested_window_code),
    jsonb_build_object(
      'windowCode', updated_delivery.requested_window_code,
      'windowStart', updated_delivery.window_start,
      'windowEnd', updated_delivery.window_end
    )
  );

  return jsonb_build_object(
    'deliveryId', updated_delivery.id,
    'runId', updated_delivery.run_id,
    'version', updated_delivery.version,
    'windowCode', updated_delivery.requested_window_code
  );
end;
$$;

create or replace function public.apply_active_route_plan (
  p_run_id uuid,
  p_plan jsonb,
  p_provider text,
  p_reason text
) returns jsonb language plpgsql security definer
set
  search_path = public as $$
declare
  prefix_count integer;
  next_revision integer;
  plan_record record;
  target_stop_id uuid;
  target_order integer;
  first_delivery_id uuid;
  previous_order jsonb;
begin
  if jsonb_typeof(p_plan) <> 'array' or jsonb_array_length(p_plan) = 0 then
    raise exception 'EMPTY_ROUTE_PLAN';
  end if;

  if not exists (select 1 from public.delivery_runs where id = p_run_id) then
    raise exception 'RUN_NOT_FOUND';
  end if;

  select count(*) into prefix_count
  from public.route_stops rs
  join public.deliveries d on d.id = rs.delivery_id
  where rs.run_id = p_run_id
    and d.status in ('delivered', 'cancelled');

  select coalesce(
    jsonb_agg(
      jsonb_build_object('deliveryId', rs.delivery_id, 'stopOrder', rs.stop_order)
      order by rs.stop_order
    ),
    '[]'::jsonb
  ) into previous_order
  from public.route_stops rs
  where rs.run_id = p_run_id;

  update public.route_stops rs
  set stop_order = -1000 - rs.stop_order
  from public.deliveries d
  where rs.run_id = p_run_id
    and d.id = rs.delivery_id
    and d.status not in ('delivered', 'cancelled');

  delete from public.route_legs
  where run_id = p_run_id and leg_order > prefix_count;

  update public.deliveries
  set status = 'pending'
  where id in (
    select rs.delivery_id
    from public.route_stops rs
    where rs.run_id = p_run_id and rs.stop_order < 0
  );

  for plan_record in
    select value, ordinality
    from jsonb_array_elements(p_plan) with ordinality
  loop
    target_order := prefix_count + plan_record.ordinality;

    update public.route_stops
    set stop_order = target_order, locked = true
    where run_id = p_run_id
      and delivery_id = (plan_record.value->>'deliveryId')::uuid
    returning id into target_stop_id;

    if target_stop_id is null then
      raise exception 'DELIVERY_NOT_IN_RUN';
    end if;

    if plan_record.ordinality = 1 then
      first_delivery_id := (plan_record.value->>'deliveryId')::uuid;
    end if;

    insert into public.route_legs (
      run_id,
      leg_order,
      from_latitude,
      from_longitude,
      to_stop_id,
      distance_meters,
      duration_seconds,
      provider,
      route_geometry
    ) values (
      p_run_id,
      target_order,
      (plan_record.value->>'fromLatitude')::double precision,
      (plan_record.value->>'fromLongitude')::double precision,
      target_stop_id,
      (plan_record.value->>'distanceMeters')::integer,
      (plan_record.value->>'durationSeconds')::integer,
      p_provider,
      plan_record.value->'geometry'
    );
  end loop;

  update public.deliveries
  set status = 'out_for_delivery'
  where id = first_delivery_id;

  update public.delivery_runs
  set
    status = 'active',
    current_stop_order = prefix_count + 1,
    route_revision = route_revision + 1,
    route_provider = p_provider,
    optimized_at = now(),
    optimization_note = p_reason,
    completed_at = null
  where id = p_run_id
  returning route_revision into next_revision;

  insert into public.route_optimizations (
    run_id,
    revision,
    reason,
    provider,
    previous_order,
    new_order
  ) values (
    p_run_id,
    next_revision,
    p_reason,
    p_provider,
    previous_order,
    p_plan
  );

  perform public.recalculate_run_eta(p_run_id);

  return jsonb_build_object(
    'runId', p_run_id,
    'revision', next_revision,
    'currentStopOrder', prefix_count + 1
  );
end;
$$;

revoke
execute on function public.schedule_delivery_reattempt (
  uuid,
  integer,
  timestamptz,
  text,
  timestamptz,
  timestamptz
)
from
  public,
  anon,
  authenticated;

revoke
execute on function public.change_delivery_window (uuid, integer, text, timestamptz, timestamptz)
from
  public,
  anon,
  authenticated;

revoke
execute on function public.apply_active_route_plan (uuid, jsonb, text, text)
from
  public,
  anon,
  authenticated;

grant
execute on function public.schedule_delivery_reattempt (
  uuid,
  integer,
  timestamptz,
  text,
  timestamptz,
  timestamptz
) to service_role;

grant
execute on function public.change_delivery_window (uuid, integer, text, timestamptz, timestamptz) to service_role;

grant
execute on function public.apply_active_route_plan (uuid, jsonb, text, text) to service_role;
