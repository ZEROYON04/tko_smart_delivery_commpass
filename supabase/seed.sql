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
    '高橋 直人（デモ）'
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    'USER-B',
    '田中 美咲（デモ）'
  ),
  (
    '00000000-0000-4000-8000-000000000403',
    'USER-C',
    '佐藤 健太（デモ主役）'
  ),
  (
    '00000000-0000-4000-8000-000000000404',
    'USER-D',
    '鈴木 陽子（デモ）'
  ),
  (
    '00000000-0000-4000-8000-000000000405',
    'USER-E',
    '伊藤 大輔（デモ）'
  ),
  (
    '00000000-0000-4000-8000-000000000406',
    'USER-F',
    '山本 葵（デモ）'
  );

insert into public.recipient_accounts (id, customer_code, display_name)
select
  ('00000000-0000-4000-8000-' || lpad((500 + number)::text, 12, '0'))::uuid,
  'MOCK-' || lpad(number::text, 3, '0'),
  'デモ受取人 ' || lpad(number::text, 3, '0')
from generate_series(1, 114) as number;

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
    '山田 一郎',
    current_date,
    'active',
    41,
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
    '高橋 直人',
    '広島県東広島市西条町寺家10020番地43',
    34.4337928,
    132.7036052,
    'handoff',
    'delivered',
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
    '田中 美咲',
    '広島県東広島市西条本町12番3号',
    34.4306213,
    132.7433314,
    'handoff',
    'delivered',
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
    '佐藤 健太',
    '広島県東広島市西条栄町9番1号',
    34.4292000,
    132.7433000,
    'handoff',
    'out_for_delivery',
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
    '鈴木 陽子',
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
    '伊藤 大輔',
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
    '山本 葵',
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

with mock_deliveries as (
  select
    number,
    case
      when number <= 18 then 'morning'
      when number <= 38 then '12-14'
      when number <= 56 then '14-16'
      when number <= 75 then '16-18'
      when number <= 94 then '18-20'
      else '19-21'
    end as window_code,
    case
      when number <= 18 then 'morning'
      when number <= 38 then '12_14'
      when number <= 56 then '14_16'
      when number <= 75 then '16_18'
      when number <= 94 then '18_20'
      else '19_21'
    end as time_slot,
    case
      when number <= 18 then time '08:00'
      when number <= 38 then time '12:00'
      when number <= 56 then time '14:00'
      when number <= 75 then time '16:00'
      when number <= 94 then time '18:00'
      else time '19:00'
    end as window_start_time,
    case
      when number <= 18 then time '12:00'
      when number <= 38 then time '14:00'
      when number <= 56 then time '16:00'
      when number <= 75 then time '18:00'
      when number <= 94 then time '20:00'
      else time '21:00'
    end as window_end_time
  from generate_series(1, 114) as number
)
insert into public.deliveries (
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
select
  ('00000000-0000-4000-8000-' || lpad((1000 + number)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  ('00000000-0000-4000-8000-' || lpad((500 + number)::text, 12, '0'))::uuid,
  'MOCK-' || lpad(number::text, 4, '0'),
  case number
    when 39 then '中村 結衣'
    when 40 then '小林 翔'
    when 41 then '加藤 美咲'
    when 42 then '山田 陽菜'
    when 43 then '松本 蓮'
    else 'デモ受取人 ' || lpad(number::text, 3, '0')
  end,
  case number
    when 39 then '広島県東広島市西条中央 デモ地点A'
    when 40 then '広島県東広島市西条中央 デモ地点B'
    when 41 then '広島県東広島市西条中央 デモ地点C'
    when 42 then '広島県東広島市西条中央 デモ地点D'
    when 43 then '広島県東広島市西条中央 デモ地点E'
    else '広島県東広島市西条町デモ ' || number || '番地'
  end,
  case
    when number = 39 then 34.4280000
    when number = 40 then 34.4247000
    when number = 41 then 34.4229000
    when number = 42 then 34.4242000
    when number = 43 then 34.4276000
    when number between 44 and 56 then
      34.4380000 + (((number - 44) % 5) * 0.0010)
    else 34.4263905 + ((((number - 1) % 12) - 5.5) * 0.0012)
      + ((floor((number - 1) / 12)::integer % 3) * 0.00025)
  end,
  case
    when number = 39 then 132.7472000
    when number = 40 then 132.7470000
    when number = 41 then 132.7434000
    when number = 42 then 132.7394000
    when number = 43 then 132.7389000
    when number between 44 and 56 then
      132.7520000 + ((floor((number - 44) / 5)::integer) * 0.0012)
    else 132.7433062 + (((floor((number - 1) / 12)::integer % 10) - 4.5) * 0.0015)
  end,
  'handoff',
  case when number <= 38 then 'delivered' else 'pending' end,
  90,
  'sagawa',
  window_code,
  (current_date + window_start_time) at time zone 'Asia/Tokyo',
  (current_date + window_end_time) at time zone 'Asia/Tokyo',
  time_slot
from mock_deliveries;

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
    41,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000204',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000104',
    42,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000205',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000105',
    61,
    true
  ),
  (
    '00000000-0000-4000-8000-000000000206',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000106',
    81,
    true
  );

insert into public.route_stops (id, run_id, delivery_id, stop_order, locked)
select
  ('00000000-0000-4000-8000-' || lpad((2000 + number)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  ('00000000-0000-4000-8000-' || lpad((1000 + number)::text, 12, '0'))::uuid,
  case
    when number <= 38 then number + 2
    when number <= 56 then number + 4
    when number <= 75 then number + 5
    else number + 6
  end,
  true
from generate_series(1, 114) as number;

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
    '00000000-0000-4000-8000-000000000203',
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
    '00000000-0000-4000-8000-000000000201',
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
