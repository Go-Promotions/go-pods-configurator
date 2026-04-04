create table public.option_package_inclusions (
  package_option_id uuid not null references public.options(id) on delete cascade,
  included_option_id uuid not null references public.options(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (package_option_id, included_option_id),
  constraint option_package_inclusions_not_self
    check (package_option_id <> included_option_id)
);

create index option_package_inclusions_included_idx
on public.option_package_inclusions (included_option_id);

comment on table public.option_package_inclusions is
'Explicit option-to-option relationships where a package option includes one or more individual options.';

alter table public.option_package_inclusions enable row level security;

create policy "Public can read option package inclusions"
on public.option_package_inclusions for select
using (true);
