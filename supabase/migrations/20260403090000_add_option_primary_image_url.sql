alter table public.options
add column primary_image_url text;

comment on column public.options.primary_image_url is
'Primary catalogue image path or URL for option cards and general catalogue display.';

comment on table public.option_images is
'Supporting and gallery images for option detail views and modal galleries.';

comment on column public.option_images.image_path is
'Supporting gallery image path or URL for the option detail modal.';

comment on column public.option_images.is_primary is
'Marks the lead image within the supporting gallery set, separate from options.primary_image_url.';
