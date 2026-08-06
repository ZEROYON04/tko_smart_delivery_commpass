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
    available_from = case
      when current_delivery.is_reattempt then greatest(p_window_start, now())
      else current_delivery.available_from
    end,
    version = version + 1
  where id = p_delivery_id
  returning * into updated_delivery;

  insert into public.delivery_events (delivery_id, event_type, old_value, new_value)
  values (
    p_delivery_id,
    'delivery_window_changed',
    jsonb_build_object(
      'windowCode', current_delivery.requested_window_code,
      'windowStart', current_delivery.window_start,
      'windowEnd', current_delivery.window_end,
      'availableFrom', current_delivery.available_from
    ),
    jsonb_build_object(
      'windowCode', updated_delivery.requested_window_code,
      'windowStart', updated_delivery.window_start,
      'windowEnd', updated_delivery.window_end,
      'availableFrom', updated_delivery.available_from
    )
  );

  return jsonb_build_object(
    'deliveryId', updated_delivery.id,
    'runId', updated_delivery.run_id,
    'version', updated_delivery.version,
    'windowCode', updated_delivery.requested_window_code,
    'availableFrom', updated_delivery.available_from
  );
end;
$$;
