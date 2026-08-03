alter table public.deliveries
  add column dropoff_location text
    check (
      dropoff_location is null
      or dropoff_location in (
        'front_door',
        'delivery_box',
        'gas_meter_box',
        'bicycle_basket',
        'building_reception',
        'other'
      )
    );

create or replace function public.change_delivery_method_details(
  p_delivery_id uuid,
  p_method text,
  p_dropoff_location text,
  p_expected_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_delivery public.deliveries%rowtype;
  updated_delivery public.deliveries%rowtype;
  next_service_seconds integer;
  next_dropoff_location text;
begin
  if p_method not in ('handoff', 'dropoff') then
    raise exception 'INVALID_DELIVERY_METHOD';
  end if;

  if p_dropoff_location is not null and p_dropoff_location not in (
    'front_door',
    'delivery_box',
    'gas_meter_box',
    'bicycle_basket',
    'building_reception',
    'other'
  ) then
    raise exception 'INVALID_DROPOFF_LOCATION';
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
  next_dropoff_location := case
    when p_method = 'handoff' then null
    when p_dropoff_location is not null then p_dropoff_location
    else current_delivery.dropoff_location
  end;

  update public.deliveries
  set
    delivery_method = p_method,
    dropoff_location = next_dropoff_location,
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
      'dropoffLocation', current_delivery.dropoff_location,
      'serviceSeconds', current_delivery.service_seconds
    ),
    jsonb_build_object(
      'deliveryMethod', updated_delivery.delivery_method,
      'dropoffLocation', updated_delivery.dropoff_location,
      'serviceSeconds', updated_delivery.service_seconds
    )
  );

  perform public.recalculate_run_eta(updated_delivery.run_id);

  return jsonb_build_object(
    'deliveryId', updated_delivery.id,
    'deliveryMethod', updated_delivery.delivery_method,
    'dropoffLocation', updated_delivery.dropoff_location,
    'serviceSeconds', updated_delivery.service_seconds,
    'version', updated_delivery.version
  );
end;
$$;

create or replace function public.change_run_delivery_date(
  p_run_id uuid,
  p_delivery_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_run public.delivery_runs%rowtype;
  day_offset integer;
  date_offset interval;
begin
  select * into current_run
  from public.delivery_runs
  where id = p_run_id
  for update;

  if not found then
    raise exception 'RUN_NOT_FOUND';
  end if;

  if current_run.status = 'completed' then
    raise exception 'RUN_COMPLETED';
  end if;

  if p_delivery_date < (now() at time zone 'Asia/Tokyo')::date then
    raise exception 'DELIVERY_DATE_IN_PAST';
  end if;

  day_offset := p_delivery_date - current_run.delivery_date;
  date_offset := make_interval(days => day_offset);

  update public.delivery_runs
  set
    delivery_date = p_delivery_date,
    started_at = case
      when started_at is null then null
      else started_at + date_offset
    end,
    completed_at = case
      when completed_at is null then null
      else completed_at + date_offset
    end,
    optimization_note = 'delivery-date-changing'
  where id = p_run_id;

  update public.deliveries
  set
    window_start = case
      when window_start is null then null
      else window_start + date_offset
    end,
    window_end = case
      when window_end is null then null
      else window_end + date_offset
    end,
    available_from = case
      when available_from is null then null
      else available_from + date_offset
    end,
    version = version + 1
  where run_id = p_run_id;

  update public.route_stops
  set estimated_arrival = case
    when estimated_arrival is null then null
    else estimated_arrival + date_offset
  end
  where run_id = p_run_id;

  return jsonb_build_object(
    'runId', p_run_id,
    'deliveryDate', p_delivery_date,
    'dayOffset', day_offset
  );
end;
$$;

revoke execute on function public.change_delivery_method_details(uuid, text, text, integer)
  from public, anon, authenticated;
revoke execute on function public.change_run_delivery_date(uuid, date)
  from public, anon, authenticated;

grant execute on function public.change_delivery_method_details(uuid, text, text, integer)
  to service_role;
grant execute on function public.change_run_delivery_date(uuid, date)
  to service_role;
