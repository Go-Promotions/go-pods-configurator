create extension if not exists pgcrypto;

create type public.option_scope as enum ('accessory', 'styling');
create type public.configuration_status as enum ('draft', 'submitted');
create type public.enquiry_type as enum (
  'general_enquiry',
  'request_quote',
  'proceed_to_order'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.models (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null,
  base_price numeric(10,2) not null check (base_price >= 0),
  base_miro numeric(10,2) not null check (base_miro >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.model_specs (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  section_label text not null,
  item_label text not null,
  item_value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.option_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  scope public.option_scope not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.options (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.option_categories(id) on delete restrict,
  slug text not null unique,
  title text not null,
  short_description text not null,
  full_description text not null default '',
  scope public.option_scope not null,
  price numeric(10,2) not null check (price >= 0),
  weight numeric(10,2) not null default 0 check (weight >= 0),
  applies_to_all_models boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.option_model_compatibility (
  option_id uuid not null references public.options(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (option_id, model_id)
);

create table public.option_images (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.options(id) on delete cascade,
  image_path text not null,
  alt_text text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.configurations (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  model_id uuid not null references public.models(id) on delete restrict,
  status public.configuration_status not null default 'draft',
  currency_code char(3) not null default 'GBP',
  base_price_snapshot numeric(10,2) not null check (base_price_snapshot >= 0),
  options_total_snapshot numeric(10,2) not null default 0 check (options_total_snapshot >= 0),
  total_price_snapshot numeric(10,2) not null check (total_price_snapshot >= 0),
  base_miro_snapshot numeric(10,2) not null check (base_miro_snapshot >= 0),
  option_weight_total_snapshot numeric(10,2) not null default 0 check (option_weight_total_snapshot >= 0),
  total_miro_snapshot numeric(10,2) not null check (total_miro_snapshot >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.configuration_items (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid not null references public.configurations(id) on delete cascade,
  option_id uuid references public.options(id) on delete set null,
  option_title_snapshot text not null,
  option_slug_snapshot text not null,
  category_name_snapshot text,
  quantity integer not null default 1 check (quantity > 0),
  price_snapshot numeric(10,2) not null check (price_snapshot >= 0),
  weight_snapshot numeric(10,2) not null default 0 check (weight_snapshot >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  configuration_id uuid references public.configurations(id) on delete set null,
  enquiry_type public.enquiry_type not null,
  name text not null,
  email text not null,
  phone text not null,
  postcode text,
  notes text,
  marketing_consent boolean not null default false,
  source_name text,
  source_medium text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  created_at timestamptz not null default timezone('utc', now())
);

create index models_active_sort_idx on public.models (active, sort_order);
create index model_specs_model_sort_idx on public.model_specs (model_id, sort_order);
create index option_categories_scope_sort_idx on public.option_categories (scope, sort_order);
create index options_category_sort_idx on public.options (category_id, sort_order);
create index options_scope_active_sort_idx on public.options (scope, active, sort_order);
create index option_images_option_sort_idx on public.option_images (option_id, sort_order);
create index option_model_compatibility_model_idx on public.option_model_compatibility (model_id);
create index configurations_model_status_idx on public.configurations (model_id, status);
create index configuration_items_configuration_idx on public.configuration_items (configuration_id, sort_order);
create index enquiries_configuration_idx on public.enquiries (configuration_id);
create index enquiries_email_idx on public.enquiries (email);

create trigger set_models_updated_at
before update on public.models
for each row execute function public.set_updated_at();

create trigger set_model_specs_updated_at
before update on public.model_specs
for each row execute function public.set_updated_at();

create trigger set_option_categories_updated_at
before update on public.option_categories
for each row execute function public.set_updated_at();

create trigger set_options_updated_at
before update on public.options
for each row execute function public.set_updated_at();

create trigger set_option_images_updated_at
before update on public.option_images
for each row execute function public.set_updated_at();

create trigger set_configurations_updated_at
before update on public.configurations
for each row execute function public.set_updated_at();

create trigger set_configuration_items_updated_at
before update on public.configuration_items
for each row execute function public.set_updated_at();

alter table public.models enable row level security;
alter table public.model_specs enable row level security;
alter table public.option_categories enable row level security;
alter table public.options enable row level security;
alter table public.option_images enable row level security;
alter table public.option_model_compatibility enable row level security;
alter table public.configurations enable row level security;
alter table public.configuration_items enable row level security;
alter table public.enquiries enable row level security;

create policy "Public can read models"
on public.models for select
using (true);

create policy "Public can read model specs"
on public.model_specs for select
using (true);

create policy "Public can read option categories"
on public.option_categories for select
using (true);

create policy "Public can read options"
on public.options for select
using (true);

create policy "Public can read option images"
on public.option_images for select
using (true);

create policy "Public can read option compatibility"
on public.option_model_compatibility for select
using (true);
