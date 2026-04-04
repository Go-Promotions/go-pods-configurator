insert into public.quiz_questions (slug, question_text, sort_order, is_active)
values
  ('who-is-staying', 'Who will be staying in your Go-Pod most of the time?', 1, true),
  ('trip-style', 'What kind of trips do you see yourself doing most?', 2, true),
  ('comfort-convenience', 'How important is comfort and convenience while you’re away?', 3, true),
  ('manoeuvring-setup', 'How would you like to handle manoeuvring and setting up your Go-Pod?', 4, true),
  ('what-matters-most', 'What matters more to you?', 5, true)
on conflict (slug) do update
set
  question_text = excluded.question_text,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.quiz_answers (question_id, slug, answer_text, sort_order)
values
  ((select id from public.quiz_questions where slug = 'who-is-staying'), 'just-me', 'Just me', 1),
  ((select id from public.quiz_questions where slug = 'who-is-staying'), 'two-adults', 'Two adults', 2),
  ((select id from public.quiz_questions where slug = 'who-is-staying'), 'two-adults-child', 'Two adults + child / occasional guest', 3),
  ((select id from public.quiz_questions where slug = 'who-is-staying'), 'more-than-two', 'More than two people regularly', 4),
  ((select id from public.quiz_questions where slug = 'trip-style'), 'short-weekends', 'Short weekends and quick stopovers', 1),
  ((select id from public.quiz_questions where slug = 'trip-style'), 'mixed-touring', 'A mix of weekends and longer touring trips', 2),
  ((select id from public.quiz_questions where slug = 'trip-style'), 'longer-stays', 'Longer stays on campsites', 3),
  ((select id from public.quiz_questions where slug = 'trip-style'), 'off-grid', 'Off-grid breaks / festivals / low-hookup touring', 4),
  ((select id from public.quiz_questions where slug = 'comfort-convenience'), 'essentials-only', 'Keep it simple, I just want the essentials', 1),
  ((select id from public.quiz_questions where slug = 'comfort-convenience'), 'bit-more-comfort', 'A bit more comfort would be nice', 2),
  ((select id from public.quiz_questions where slug = 'comfort-convenience'), 'very-convenient', 'I want it to feel as convenient as possible', 3),
  ((select id from public.quiz_questions where slug = 'comfort-convenience'), 'best-equipped', 'I want the best equipped setup I can get', 4),
  ((select id from public.quiz_questions where slug = 'manoeuvring-setup'), 'manual', 'I’m happy to keep things simple and do it manually', 1),
  ((select id from public.quiz_questions where slug = 'manoeuvring-setup'), 'bit-of-help', 'I’d like a bit of extra help when pitching up', 2),
  ((select id from public.quiz_questions where slug = 'manoeuvring-setup'), 'as-easy-as-possible', 'I want manoeuvring to be as easy as possible', 3),
  ((select id from public.quiz_questions where slug = 'manoeuvring-setup'), 'moving-alone', 'I’ll often be moving it on my own', 4),
  ((select id from public.quiz_questions where slug = 'what-matters-most'), 'keep-price-sensible', 'Keeping the price sensible', 1),
  ((select id from public.quiz_questions where slug = 'what-matters-most'), 'practical-upgrades', 'Practical upgrades that make a real difference', 2),
  ((select id from public.quiz_questions where slug = 'what-matters-most'), 'smarter-look', 'A smarter look and nicer finishing touches', 3),
  ((select id from public.quiz_questions where slug = 'what-matters-most'), 'bit-of-everything', 'A bit of everything', 4)
on conflict (question_id, slug) do update
set
  answer_text = excluded.answer_text,
  sort_order = excluded.sort_order;

with answer_option_mappings (question_slug, answer_slug, option_slug, priority, note) as (
  values
    ('who-is-staying', 'two-adults-child', 'camptech-awning', 1, null),
    ('who-is-staying', 'two-adults-child', 'rail-skirt', 1, null),
    ('who-is-staying', 'more-than-two', 'camptech-awning', 1, null),
    ('who-is-staying', 'more-than-two', 'rail-skirt', 1, null),
    ('who-is-staying', 'more-than-two', 'kampa-gale', 1, null),
    ('trip-style', 'short-weekends', 'go-tarp', 1, null),
    ('trip-style', 'mixed-touring', 'camptech-awning', 1, null),
    ('trip-style', 'longer-stays', 'camptech-awning', 1, null),
    ('trip-style', 'longer-stays', 'ext-240v-socket', 1, null),
    ('trip-style', 'longer-stays', 'rail-skirt', 1, null),
    ('trip-style', 'off-grid', '100w-solar', 2, null),
    ('trip-style', 'off-grid', '110ah-battery', 2, null),
    ('trip-style', 'off-grid', 'usb-upgrade', 1, null),
    ('comfort-convenience', 'bit-more-comfort', 'space-heater', 2, null),
    ('comfort-convenience', 'bit-more-comfort', 'grab-handle', 1, null),
    ('comfort-convenience', 'very-convenient', 'space-heater', 2, null),
    ('comfort-convenience', 'very-convenient', 'microwave', 2, null),
    ('comfort-convenience', 'very-convenient', 'usb-upgrade', 1, null),
    ('comfort-convenience', 'very-convenient', 'extra-sockets', 1, null),
    ('comfort-convenience', 'best-equipped', 'space-heater', 2, null),
    ('comfort-convenience', 'best-equipped', 'microwave', 2, null),
    ('comfort-convenience', 'best-equipped', 'tv-package', 2, null),
    ('comfort-convenience', 'best-equipped', 'usb-upgrade', 1, null),
    ('comfort-convenience', 'best-equipped', 'extra-sockets', 1, null),
    ('comfort-convenience', 'best-equipped', 'gas-oven-grill', 2, null),
    ('manoeuvring-setup', 'bit-of-help', 'inflatable-jockey', 1, null),
    ('manoeuvring-setup', 'as-easy-as-possible', 'motor-mover', 2, null),
    ('manoeuvring-setup', 'as-easy-as-possible', 'inflatable-jockey', 1, null),
    ('manoeuvring-setup', 'moving-alone', 'motor-mover', 2, null),
    ('manoeuvring-setup', 'moving-alone', 'inflatable-jockey', 1, null),
    ('what-matters-most', 'practical-upgrades', 'space-heater', 2, null),
    ('what-matters-most', 'practical-upgrades', '100w-solar', 2, null),
    ('what-matters-most', 'practical-upgrades', 'usb-upgrade', 1, null),
    ('what-matters-most', 'practical-upgrades', 'grab-handle', 1, null),
    ('what-matters-most', 'smarter-look', 'alloy-wheels', 2, null),
    ('what-matters-most', 'smarter-look', 'custom-decals', 1, null),
    ('what-matters-most', 'smarter-look', 'block-side-panels', 1, null),
    ('what-matters-most', 'bit-of-everything', 'alloy-wheels', 1, null),
    ('what-matters-most', 'bit-of-everything', 'space-heater', 2, null),
    ('what-matters-most', 'bit-of-everything', '100w-solar', 2, null),
    ('what-matters-most', 'bit-of-everything', 'usb-upgrade', 1, null)
)
insert into public.quiz_answer_option_suggestions (answer_id, option_id, priority, note)
select
  answers.id,
  options.id,
  mappings.priority,
  mappings.note
from answer_option_mappings mappings
join public.quiz_questions questions
  on questions.slug = mappings.question_slug
join public.quiz_answers answers
  on answers.question_id = questions.id
 and answers.slug = mappings.answer_slug
join public.options options
  on options.slug = mappings.option_slug
on conflict (answer_id, option_id) do update
set
  priority = excluded.priority,
  note = excluded.note;

with answer_model_mappings (question_slug, answer_slug, model_slug, score) as (
  values
    ('trip-style', 'longer-stays', 'pioneer', 1),
    ('comfort-convenience', 'very-convenient', 'pioneer', 1),
    ('comfort-convenience', 'best-equipped', 'pioneer', 2),
    ('what-matters-most', 'bit-of-everything', 'pioneer', 1),
    ('comfort-convenience', 'essentials-only', 'classic', 1),
    ('what-matters-most', 'keep-price-sensible', 'classic', 1)
)
insert into public.quiz_answer_model_scores (answer_id, model_id, score)
select
  answers.id,
  models.id,
  mappings.score
from answer_model_mappings mappings
join public.quiz_questions questions
  on questions.slug = mappings.question_slug
join public.quiz_answers answers
  on answers.question_id = questions.id
 and answers.slug = mappings.answer_slug
join public.models models
  on models.slug = mappings.model_slug
on conflict (answer_id, model_id) do update
set
  score = excluded.score;
