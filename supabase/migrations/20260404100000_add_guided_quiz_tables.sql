create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  question_text text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  slug text not null,
  answer_text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint quiz_answers_question_slug_unique unique (question_id, slug)
);

create table public.quiz_answer_option_suggestions (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.quiz_answers(id) on delete cascade,
  option_id uuid not null references public.options(id) on delete cascade,
  priority integer not null default 1,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint quiz_answer_option_suggestions_unique unique (answer_id, option_id)
);

create table public.quiz_answer_model_scores (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references public.quiz_answers(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete cascade,
  score integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint quiz_answer_model_scores_unique unique (answer_id, model_id)
);

create index quiz_questions_active_sort_idx
on public.quiz_questions (is_active, sort_order);

create index quiz_answers_question_sort_idx
on public.quiz_answers (question_id, sort_order);

create index quiz_answer_option_suggestions_answer_idx
on public.quiz_answer_option_suggestions (answer_id);

create index quiz_answer_option_suggestions_option_idx
on public.quiz_answer_option_suggestions (option_id);

create index quiz_answer_model_scores_answer_idx
on public.quiz_answer_model_scores (answer_id);

create index quiz_answer_model_scores_model_idx
on public.quiz_answer_model_scores (model_id);

create trigger set_quiz_questions_updated_at
before update on public.quiz_questions
for each row execute function public.set_updated_at();

create trigger set_quiz_answers_updated_at
before update on public.quiz_answers
for each row execute function public.set_updated_at();

create trigger set_quiz_answer_option_suggestions_updated_at
before update on public.quiz_answer_option_suggestions
for each row execute function public.set_updated_at();

create trigger set_quiz_answer_model_scores_updated_at
before update on public.quiz_answer_model_scores
for each row execute function public.set_updated_at();

alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_answer_option_suggestions enable row level security;
alter table public.quiz_answer_model_scores enable row level security;

create policy "Public can read quiz questions"
on public.quiz_questions for select
using (true);

create policy "Public can read quiz answers"
on public.quiz_answers for select
using (true);

create policy "Public can read quiz answer option suggestions"
on public.quiz_answer_option_suggestions for select
using (true);

create policy "Public can read quiz answer model scores"
on public.quiz_answer_model_scores for select
using (true);
