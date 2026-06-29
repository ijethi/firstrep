-- =============================================================================
-- FirstRep — seed.sql
-- Beginner Planet Fitness-style machine catalog. Image keys are PLACEHOLDERS
-- (decision D8): the `machine-images/...` paths do not exist yet — the app
-- resolver renders a placeholder until real art is dropped in. Re-runnable via
-- ON CONFLICT (slug) upsert.
-- =============================================================================

insert into public.exercises
  (name, slug, muscle_group, machine_type, works_plain,
   setup_steps, form_tips,
   default_sets, default_rep_min, default_rep_max, default_weight_lb, rest_seconds,
   beginner_friendly, image_path)
values
  ('Chest Press Machine', 'chest-press', 'chest', 'machine',
   'Works your chest, shoulders, and arms',
   '["Sit with your back flat against the pad.","Set the seat so the handles line up with your chest.","Grab the handles and push forward until arms are almost straight.","Slowly bring the handles back."]'::jsonb,
   '["Keep your back against the pad the whole time.","Don''t lock your elbows.","Breathe out as you push."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/chest-press.png'),

  ('Lat Pulldown', 'lat-pulldown', 'back', 'machine',
   'Works your back and arms',
   '["Sit down and tuck your knees under the pad.","Grab the wide bar with both hands.","Pull the bar down to your upper chest.","Slowly let it rise back up."]'::jsonb,
   '["Lead with your elbows, not your hands.","Squeeze your shoulder blades together.","Avoid leaning too far back."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/lat-pulldown.png'),

  ('Seated Row', 'seated-row', 'back', 'machine',
   'Works your back and arms',
   '["Sit with your chest against the pad.","Grab the handles with both hands.","Pull the handles toward you, squeezing your back.","Slowly return to the start."]'::jsonb,
   '["Keep your chest on the pad.","Pull your elbows straight back.","Don''t shrug your shoulders up."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/seated-row.png'),

  ('Shoulder Press Machine', 'shoulder-press', 'shoulders', 'machine',
   'Works your shoulders and arms',
   '["Sit with your back flat against the pad.","Set the seat so handles start near your shoulders.","Press the handles straight up.","Lower them back down slowly."]'::jsonb,
   '["Keep your core tight.","Don''t arch your lower back.","Stop just before locking your elbows."]'::jsonb,
   3, 10, 12, 20, 60, true, 'machine-images/shoulder-press.png'),

  ('Leg Press', 'leg-press', 'legs', 'machine',
   'Works your thighs and glutes',
   '["Sit back into the seat.","Place your feet flat, shoulder-width on the platform.","Push the platform away until legs are almost straight.","Slowly bend your knees to return."]'::jsonb,
   '["Don''t lock your knees at the top.","Keep your knees in line with your toes.","Push through your heels."]'::jsonb,
   3, 10, 12, 90, 75, true, 'machine-images/leg-press.png'),

  ('Leg Extension', 'leg-extension', 'legs', 'machine',
   'Works the front of your thighs',
   '["Sit back with knees bent over the seat edge.","Set the pad to rest on your lower shins.","Straighten your legs to lift the pad.","Slowly lower back down."]'::jsonb,
   '["Move slowly and with control.","Squeeze your thighs at the top.","Don''t swing the weight."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/leg-extension.png'),

  ('Seated Leg Curl', 'seated-leg-curl', 'legs', 'machine',
   'Works the back of your thighs',
   '["Sit with the pad resting on top of your lower legs.","Adjust the thigh pad so it holds you in place.","Bend your knees to pull the pad down.","Slowly return to the start."]'::jsonb,
   '["Keep your back against the seat.","Control the weight on the way back.","Don''t rush the reps."]'::jsonb,
   3, 10, 12, 30, 60, true, 'machine-images/seated-leg-curl.png'),

  ('Hip Abductor', 'hip-abductor', 'glutes', 'machine',
   'Works your outer hips and glutes',
   '["Sit with your back against the pad.","Place your outer thighs against the pads.","Push your knees outward as far as comfortable.","Slowly bring them back together."]'::jsonb,
   '["Move in a slow, controlled way.","Keep your back against the seat.","Don''t use momentum."]'::jsonb,
   3, 12, 15, 50, 45, true, 'machine-images/hip-abductor.png'),

  ('Hip Adductor', 'hip-adductor', 'legs', 'machine',
   'Works your inner thighs',
   '["Sit with your back against the pad.","Place your inner thighs against the pads, knees apart.","Squeeze your knees together.","Slowly let them open back out."]'::jsonb,
   '["Control the weight in both directions.","Keep your back against the seat.","Don''t let the pads slam open."]'::jsonb,
   3, 12, 15, 50, 45, true, 'machine-images/hip-adductor.png'),

  ('Treadmill Incline Walk', 'treadmill-incline-walk', 'cardio', 'cardio',
   'Cardio — burns extra calories',
   '["Step on and clip the safety key to your shirt.","Start at a slow walk (about 2.5 mph).","Set the incline to 3-5%.","Walk at a pace where you can still talk."]'::jsonb,
   '["Don''t hold the handrails the whole time.","Stand tall, look ahead.","Start slow and build up your minutes."]'::jsonb,
   null, null, null, null, 0, true, 'machine-images/treadmill-incline-walk.png'),

  ('Elliptical', 'elliptical', 'cardio', 'cardio',
   'Cardio — easy on the joints',
   '["Step onto the pedals and hold the moving handles.","Start pedaling at a steady, easy pace.","Set resistance to a low level to begin.","Keep a rhythm you can sustain."]'::jsonb,
   '["Keep your posture upright.","Push and pull with both arms and legs.","Aim for a talk-friendly pace."]'::jsonb,
   null, null, null, null, 0, true, 'machine-images/elliptical.png'),

  ('Stair Climber', 'stair-climber', 'cardio', 'cardio',
   'Cardio — strong calorie burn',
   '["Step on and hold the rails to steady yourself.","Start at the lowest speed.","Take full, steady steps.","Increase speed only when it feels easy."]'::jsonb,
   '["Don''t lean heavily on the rails.","Keep your steps full, not tiny.","Start with short sessions and build up."]'::jsonb,
   null, null, null, null, 0, true, 'machine-images/stair-climber.png')

on conflict (slug) do update set
  name              = excluded.name,
  muscle_group      = excluded.muscle_group,
  machine_type      = excluded.machine_type,
  works_plain       = excluded.works_plain,
  setup_steps       = excluded.setup_steps,
  form_tips         = excluded.form_tips,
  default_sets      = excluded.default_sets,
  default_rep_min   = excluded.default_rep_min,
  default_rep_max   = excluded.default_rep_max,
  default_weight_lb = excluded.default_weight_lb,
  rest_seconds      = excluded.rest_seconds,
  beginner_friendly = excluded.beginner_friendly,
  image_path        = excluded.image_path;

-- Safer-alternative links (TRAINER_LOGIC R3). Resolved by slug after insert.
update public.exercises e set alt_exercise_id = alt.id
from public.exercises alt
where (e.slug, alt.slug) in (
  ('leg-extension',   'leg-press'),         -- knee-friendlier swap target / partner
  ('leg-press',       'leg-extension'),
  ('lat-pulldown',    'seated-row'),
  ('seated-row',      'lat-pulldown'),
  ('chest-press',     'shoulder-press'),
  ('shoulder-press',  'chest-press'),
  ('seated-leg-curl', 'hip-adductor'),
  ('stair-climber',   'elliptical'),        -- lower-impact cardio alternative
  ('treadmill-incline-walk', 'elliptical')
);
