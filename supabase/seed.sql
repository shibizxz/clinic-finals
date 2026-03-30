begin;

insert into public.doctors (
  id,
  slug,
  name,
  title,
  specialty,
  bio,
  focus_areas,
  languages,
  years_experience,
  duration_minutes,
  room_label,
  accent_color,
  active
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'dr-isha-menon',
    'Dr. Isha Menon',
    'MD Cardiology',
    'Heart',
    'Specialises in preventive cardiology, long-term heart care, and fast follow-up planning for recurring patients.',
    array['Chest pain', 'BP review', 'Heart health plans'],
    array['English', 'Tamil', 'Hindi'],
    14,
    30,
    'Cardiac Suite',
    '#fb7185',
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'dr-rahul-sen',
    'Dr. Rahul Sen',
    'MS Orthopaedics',
    'Ortho',
    'Handles knee, back, and sports-injury consultations with clear rehab-oriented treatment plans.',
    array['Back pain', 'Sports injuries', 'Joint stiffness'],
    array['English', 'Hindi'],
    11,
    20,
    'Mobility Room',
    '#f59e0b',
    true
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'dr-neha-pillai',
    'Dr. Neha Pillai',
    'MBBS, Family Medicine',
    'General',
    'Primary care physician for fever, recurring health concerns, family consultations, and routine check-ins.',
    array['General fever', 'Family medicine', 'Routine review'],
    array['English', 'Malayalam', 'Tamil'],
    9,
    15,
    'Consult Room 2',
    '#10b981',
    true
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'dr-karthik-nair',
    'Dr. Karthik Nair',
    'MD Internal Medicine',
    'Diabetes',
    'Focused on diabetes reviews, thyroid follow-ups, medication planning, and lifestyle counselling.',
    array['Sugar review', 'Thyroid care', 'Metabolic health'],
    array['English', 'Tamil'],
    13,
    20,
    'Wellness Bay',
    '#0ea5e9',
    true
  )
on conflict (id) do update
set slug = excluded.slug,
    name = excluded.name,
    title = excluded.title,
    specialty = excluded.specialty,
    bio = excluded.bio,
    focus_areas = excluded.focus_areas,
    languages = excluded.languages,
    years_experience = excluded.years_experience,
    duration_minutes = excluded.duration_minutes,
    room_label = excluded.room_label,
    accent_color = excluded.accent_color,
    active = excluded.active;

insert into public.doctor_schedule_rules (
  doctor_id,
  weekday,
  start_time,
  end_time,
  slot_duration_minutes,
  daily_token_limit
)
values
  ('10000000-0000-0000-0000-000000000001', 1, '09:00', '13:00', 30, 8),
  ('10000000-0000-0000-0000-000000000001', 2, '09:00', '13:00', 30, 8),
  ('10000000-0000-0000-0000-000000000001', 3, '09:00', '13:00', 30, 8),
  ('10000000-0000-0000-0000-000000000001', 4, '09:00', '13:00', 30, 8),
  ('10000000-0000-0000-0000-000000000001', 5, '09:00', '13:00', 30, 8),
  ('10000000-0000-0000-0000-000000000002', 1, '14:00', '18:00', 20, 10),
  ('10000000-0000-0000-0000-000000000002', 2, '14:00', '18:00', 20, 10),
  ('10000000-0000-0000-0000-000000000002', 3, '14:00', '18:00', 20, 10),
  ('10000000-0000-0000-0000-000000000002', 4, '14:00', '18:00', 20, 10),
  ('10000000-0000-0000-0000-000000000002', 5, '14:00', '18:00', 20, 10),
  ('10000000-0000-0000-0000-000000000003', 1, '10:00', '16:00', 15, 14),
  ('10000000-0000-0000-0000-000000000003', 2, '10:00', '16:00', 15, 14),
  ('10000000-0000-0000-0000-000000000003', 3, '10:00', '16:00', 15, 14),
  ('10000000-0000-0000-0000-000000000003', 4, '10:00', '16:00', 15, 14),
  ('10000000-0000-0000-0000-000000000003', 5, '10:00', '16:00', 15, 14),
  ('10000000-0000-0000-0000-000000000004', 2, '09:30', '14:30', 20, 9),
  ('10000000-0000-0000-0000-000000000004', 4, '09:30', '14:30', 20, 9),
  ('10000000-0000-0000-0000-000000000004', 6, '09:30', '14:30', 20, 9)
on conflict (doctor_id, weekday) do update
set start_time = excluded.start_time,
    end_time = excluded.end_time,
    slot_duration_minutes = excluded.slot_duration_minutes,
    daily_token_limit = excluded.daily_token_limit;

insert into public.doctor_schedule_overrides (
  doctor_id,
  date,
  closed,
  start_time,
  end_time,
  slot_duration_minutes,
  daily_token_limit,
  note
)
values (
  '10000000-0000-0000-0000-000000000003',
  current_date + 3,
  false,
  '12:00',
  '18:00',
  15,
  16,
  'Extended evening camp'
)
on conflict (doctor_id, date) do update
set closed = excluded.closed,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    slot_duration_minutes = excluded.slot_duration_minutes,
    daily_token_limit = excluded.daily_token_limit,
    note = excluded.note;

commit;
