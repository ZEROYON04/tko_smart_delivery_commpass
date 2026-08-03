alter table public.deliveries
add column delivery_time_slot text not null default '14_16' check (
  delivery_time_slot in (
    'morning',
    '12_14',
    '14_16',
    '16_18',
    '18_20',
    '19_21'
  )
),
add column morning_notification_sent_at timestamptz,
add column approaching_notification_sent_at timestamptz,
add column reschedule_requested_at timestamptz;

comment on column public.deliveries.morning_notification_sent_at is '当日朝のLINE通知を二重送信しないための送信日時';

comment on column public.deliveries.approaching_notification_sent_at is '到着前のLINE通知を二重送信しないための送信日時';

comment on column public.deliveries.reschedule_requested_at is '初回配達前に受取人が本日受取不可を回答した日時';
