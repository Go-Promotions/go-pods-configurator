create type public.model_availability as enum (
  'available',
  'low_stock',
  'sold_out',
  'discontinued'
);

alter table public.models
  add column availability public.model_availability not null default 'available',
  add column selectable boolean not null default true,
  add column recommendation_eligible boolean not null default true;

update public.models
set
  availability = 'sold_out',
  selectable = false,
  recommendation_eligible = false
where slug = 'pioneer';

create index models_availability_sort_idx
on public.models (active, availability, selectable, sort_order);

create or replace function public.validate_submitted_configuration_model_availability()
returns trigger
language plpgsql
as $$
declare
  selected_model public.models%rowtype;
begin
  if new.status <> 'submitted' then
    return new;
  end if;

  select *
  into selected_model
  from public.models
  where id = new.model_id
  for share;

  if
    not found
    or not selected_model.active
    or not selected_model.selectable
    or selected_model.availability not in ('available', 'low_stock')
  then
    raise exception using
      errcode = '23514',
      message = 'This Go-Pod model is no longer available.';
  end if;

  return new;
end;
$$;

create trigger validate_submitted_configuration_model_availability
before insert or update of model_id, status on public.configurations
for each row execute function public.validate_submitted_configuration_model_availability();
