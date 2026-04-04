alter table public.models
add column image_path text;

comment on column public.models.image_path is
'Primary model image path or URL for model selection cards and related catalogue display.';
