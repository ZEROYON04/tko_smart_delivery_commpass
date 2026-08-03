truncate table public.route_optimizations,
public.delivery_events,
public.driver_locations,
public.route_legs,
public.route_stops,
public.deliveries,
public.recipient_accounts,
public.delivery_runs restart identity cascade;

insert into
  public.recipient_accounts (id, customer_code, display_name)
values
  (
    '00000000-0000-4000-8000-000000000401',
    'USER-A',
    '美術館受付'
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    'USER-B',
    '西条駅受付'
  ),
  (
    '00000000-0000-4000-8000-000000000403',
    'USER-C',
    '道の駅受付'
  ),
  (
    '00000000-0000-4000-8000-000000000404',
    'USER-D',
    '八本松駅受付'
  ),
  (
    '00000000-0000-4000-8000-000000000405',
    'USER-E',
    '大学内郵便局受付'
  ),
  (
    '00000000-0000-4000-8000-000000000406',
    'USER-F',
    '黒瀬支所受付'
  );

insert into
  public.delivery_runs (
    id,
    driver_name,
    delivery_date,
    status,
    current_stop_order,
    depot_latitude,
    depot_longitude,
    depot_name,
    depot_address,
    started_at
  )
values
  (
    '00000000-0000-4000-8000-000000000001',
    '山田ドライバー',
    current_date,
    'active',
    1,
    34.4263905,
    132.7433062,
    '東広島市役所 配送拠点',
    '広島県東広島市西条栄町8番29号',
    (current_date::timestamp + time '09:00') at time zone 'Asia/Tokyo'
  );

insert into
  public.deliveries (
    id,
    run_id,
    recipient_id,
    tracking_number,
    recipient_name,
    address,
    latitude,
    longitude,
    delivery_method,
    status,
    service_seconds,
    carrier,
    requested_window_code,
    window_start,
    window_end,
    delivery_time_slot
  )
values
  (
    '00000000-0000-4000-8000-000000000101',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000401',
    'YAMATO-0001',
    '美術館受付',
    '広島県東広島市西条栄町9番1号',
    34.4271780,
    132.7423851,
    'handoff',
    'out_for_delivery',
    300,
    'yamato',
    'morning',
    (current_date::timestamp + time '08:00') at time zone 'Asia/Tokyo',
    (current_date::timestamp + time '12:00') at time zone 'Asia/Tokyo',
    'morning'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000402',
    'SAGAWA-0002',
    '西条駅受付',
    '広島県東広島市西条本町12番3号',
    34.4306213,
    132.7433314,
    'handoff',
    'pending',
    300,
    'sagawa',
    'morning',
    (current_date::timestamp + time '08:00') at time zone 'Asia/Tokyo',
    (current_date::timestamp + time '12:00') at time zone 'Asia/Tokyo',
    'morning'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000403',
    'YAMATO-0003',
    '道の駅受付',
    '広島県東広島市西条町寺家10020番地43',
    34.4337928,
    132.7036052,
    'handoff',
    'pending',
    300,
    'yamato',
    '14-16',
    (current_date::timestamp + time '14:00') at time zone 'Asia/Tokyo',
    (current_date::timestamp + time '16:00') at time zone 'Asia/Tokyo',
    '14_16'
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000404',
    'POST-0004',
    '八本松駅受付',
    '広島県東広島市八本松町飯田1539番地3',
    34.4453355,
    132.6894352,
    'handoff',
    'pending',
    300,
    'japan_post',
    '14-16',
    (current_date::timestamp + time '14:00') at time zone 'Asia/Tokyo',
    (current_date::timestamp + time '16:00') at time zone 'Asia/Tokyo',
    '14_16'
  ),
  (
    '00000000-0000-4000-8000-000000000105',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000405',
    'SAGAWA-0005',
    '大学内郵便局受付',
    '広島県東広島市鏡山1丁目1番3号',
    34.4054033,
    132.7123605,
    'handoff',
    'pending',
    300,
    'sagawa',
    '16-18',
    (current_date::timestamp + time '16:00') at time zone 'Asia/Tokyo',
    (current_date::timestamp + time '18:00') at time zone 'Asia/Tokyo',
    '16_18'
  ),
  (
    '00000000-0000-4000-8000-000000000106',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000406',
    'POST-0006',
    '黒瀬支所受付',
    '広島県東広島市黒瀬町丸山1333番地',
    34.3250814,
    132.6753086,
    'handoff',
    'pending',
    300,
    'japan_post',
    '18-20',
    (current_date::timestamp + time '18:00') at time zone 'Asia/Tokyo',
    (current_date::timestamp + time '20:00') at time zone 'Asia/Tokyo',
    '18_20'
  );

insert into
  public.route_stops (id, run_id, delivery_id, stop_order, locked)
values
  (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000101',
    1,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000102',
    2,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000103',
    3,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000204',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000104',
    4,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000205',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000105',
    5,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000206',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000106',
    6,
    true
  );

insert into
  public.route_legs (
    id,
    run_id,
    leg_order,
    from_latitude,
    from_longitude,
    to_stop_id,
    distance_meters,
    duration_seconds,
    provider,
    route_geometry
  )
values
  (
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000001',
    1,
    34.4263905,
    132.7433062,
    '00000000-0000-4000-8000-000000000201',
    150,
    60,
    'seed-fallback',
    '[{"latitude":34.4263905,"longitude":132.7433062},{"latitude":34.4271780,"longitude":132.7423851}]'
  ),
  (
    '00000000-0000-4000-8000-000000000302',
    '00000000-0000-4000-8000-000000000001',
    2,
    34.4271780,
    132.7423851,
    '00000000-0000-4000-8000-000000000202',
    500,
    120,
    'seed-fallback',
    '[{"latitude":34.4271780,"longitude":132.7423851},{"latitude":34.4306213,"longitude":132.7433314}]'
  ),
  (
    '00000000-0000-4000-8000-000000000303',
    '00000000-0000-4000-8000-000000000001',
    3,
    34.4306213,
    132.7433314,
    '00000000-0000-4000-8000-000000000203',
    4200,
    600,
    'seed-fallback',
    '[{"latitude":34.4306213,"longitude":132.7433314},{"latitude":34.4337928,"longitude":132.7036052}]'
  ),
  (
    '00000000-0000-4000-8000-000000000304',
    '00000000-0000-4000-8000-000000000001',
    4,
    34.4337928,
    132.7036052,
    '00000000-0000-4000-8000-000000000204',
    2200,
    360,
    'seed-fallback',
    '[{"latitude":34.4337928,"longitude":132.7036052},{"latitude":34.4453355,"longitude":132.6894352}]'
  ),
  (
    '00000000-0000-4000-8000-000000000305',
    '00000000-0000-4000-8000-000000000001',
    5,
    34.4453355,
    132.6894352,
    '00000000-0000-4000-8000-000000000205',
    6500,
    900,
    'seed-fallback',
    '[{"latitude":34.4453355,"longitude":132.6894352},{"latitude":34.4054033,"longitude":132.7123605}]'
  ),
  (
    '00000000-0000-4000-8000-000000000306',
    '00000000-0000-4000-8000-000000000001',
    6,
    34.4054033,
    132.7123605,
    '00000000-0000-4000-8000-000000000206',
    11000,
    1500,
    'seed-fallback',
    '[{"latitude":34.4054033,"longitude":132.7123605},{"latitude":34.3250814,"longitude":132.6753086}]'
  );

insert into
  public.driver_locations (run_id, latitude, longitude)
values
  (
    '00000000-0000-4000-8000-000000000001',
    34.4263905,
    132.7433062
  );

select
  public.recalculate_run_eta ('00000000-0000-4000-8000-000000000001');
