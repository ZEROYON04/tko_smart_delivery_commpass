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
  absent_record record;
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
    select (plan.value->>'deliveryId')::uuid
    from jsonb_array_elements(p_plan) as plan(value)
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

  for absent_record in
    select
      rs.delivery_id,
      row_number() over (order by -rs.stop_order) as ordinality
    from public.route_stops rs
    join public.deliveries d on d.id = rs.delivery_id
    where rs.run_id = p_run_id
      and d.status = 'absent'
  loop
    update public.route_stops
    set
      stop_order = prefix_count + jsonb_array_length(p_plan) + absent_record.ordinality::integer,
      estimated_arrival = null,
      locked = false
    where run_id = p_run_id
      and delivery_id = absent_record.delivery_id;
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
