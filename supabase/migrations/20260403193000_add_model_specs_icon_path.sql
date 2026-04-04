alter table public.model_specs
add column icon_path text;

comment on column public.model_specs.icon_path is
'Optional asset path or URL for the standard specification feature-card icon.';
