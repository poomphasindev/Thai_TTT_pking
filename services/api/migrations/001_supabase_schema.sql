create table if not exists reports (
  id text primary key,
  category text not null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  image_url text,
  status text not null default 'submitted',
  reporter_name text,
  contact text,
  transport_mode text,
  vehicle_id text,
  incident_time text,
  location_label text,
  severity text,
  ai_category text,
  ai_confidence double precision,
  ai_summary text,
  created_at text not null,
  updated_at text not null
);

create index if not exists idx_reports_created_at on reports(created_at desc);
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_reports_category on reports(category);

create table if not exists users (
  id text primary key,
  email text unique not null,
  display_name text not null,
  role text not null default 'tourist',
  balance_thb integer not null default 200,
  created_at text not null,
  updated_at text not null
);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id),
  token_hash text unique not null,
  expires_at text not null,
  created_at text not null
);

create table if not exists tickets (
  id text primary key,
  user_id text references users(id),
  holder_name text not null,
  pass_type text not null,
  origin text not null,
  destination text not null,
  qr_token_hash text unique not null,
  qr_payload text not null,
  status text not null default 'active',
  fare_cap_thb integer not null default 45,
  accumulated_fare_thb integer not null default 0,
  rides_count integer not null default 0,
  valid_until text not null,
  created_at text not null,
  updated_at text not null
);

create table if not exists ticket_taps (
  id text primary key,
  ticket_id text not null references tickets(id),
  mode text not null,
  station_name text not null,
  fare_thb integer not null,
  charged_thb integer not null,
  tapped_at text not null
);

create index if not exists idx_tickets_created_at on tickets(created_at desc);
create index if not exists idx_tickets_status on tickets(status);
create index if not exists idx_ticket_taps_ticket_id on ticket_taps(ticket_id);

create table if not exists trip_sessions (
  id text primary key,
  user_id text not null references users(id),
  ticket_id text references tickets(id),
  origin text not null,
  destination text not null,
  planned_modes text not null,
  status text not null default 'in_progress',
  fare_cap_thb integer not null default 45,
  estimated_fare_thb integer not null default 45,
  total_charged_thb integer not null default 0,
  anomaly_flags integer not null default 0,
  started_at text not null,
  ended_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists trip_scans (
  id text primary key,
  trip_id text not null references trip_sessions(id),
  sequence_no integer not null,
  mode text not null,
  operator_label text not null,
  vehicle_id text,
  stop_label text not null,
  raw_fare_thb integer not null,
  charged_thb integer not null,
  is_expected integer not null default 1,
  anomaly_reason text,
  scanned_at text not null
);

create index if not exists idx_trip_sessions_user_status on trip_sessions(user_id, status);
create index if not exists idx_trip_scans_trip_id on trip_scans(trip_id, sequence_no);
