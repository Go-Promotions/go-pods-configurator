create table public.option_model_inclusions (
  option_id uuid not null references public.options(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (option_id, model_id)
);

create index option_model_inclusions_model_idx
on public.option_model_inclusions (model_id);

comment on table public.option_model_inclusions is
'Explicit options that are included as standard with a specific Go-Pod model.';

alter table public.option_model_inclusions enable row level security;

create policy "Public can read option inclusions"
on public.option_model_inclusions for select
using (true);
