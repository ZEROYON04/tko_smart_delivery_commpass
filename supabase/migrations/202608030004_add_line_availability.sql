alter table public.deliveries
add column unavailable_until timestamptz;

create index deliveries_line_user_idx on public.deliveries (line_user_id)
where
  line_user_id is not null;

comment on column public.deliveries.line_user_id is 'Messaging API webhookから取得したLINEユーザーID';

comment on column public.deliveries.unavailable_until is '再配達扱いにせず、短時間不在として配送順調整に利用する期限';
