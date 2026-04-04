create table public.model_images (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  image_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index model_images_model_sort_idx
on public.model_images (model_id, sort_order);

create trigger set_model_images_updated_at
before update on public.model_images
for each row execute function public.set_updated_at();

alter table public.model_images enable row level security;

create policy "Public can read model images"
on public.model_images for select
using (true);
