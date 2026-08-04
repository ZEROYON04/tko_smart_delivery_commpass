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
      d.status as delivery_status,
      d.service_seconds,
      d.available_from,
      d.unavailable_until,
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
      coalesce(stop_record.unavailable_until, next_eta),
      coalesce(stop_record.window_start, next_eta)
    );

    update public.route_stops
    set estimated_arrival = next_eta
    where id = stop_record.stop_id;

    cursor_time := next_eta + make_interval(secs => stop_record.service_seconds);
  end loop;
end;
$$;
