begin;

truncate table public.configuration_items cascade;
truncate table public.enquiries cascade;
truncate table public.configurations cascade;
truncate table public.option_images cascade;
truncate table public.model_images cascade;
truncate table public.option_package_inclusions cascade;
truncate table public.option_model_inclusions cascade;
truncate table public.option_model_compatibility cascade;
truncate table public.options cascade;
truncate table public.option_categories cascade;
truncate table public.model_specs cascade;
truncate table public.models cascade;

with inserted_models as (
  insert into public.models (
    slug,
    name,
    short_description,
    image_path,
    base_price,
    base_miro,
    active,
    sort_order
  )
  values
    (
      'classic',
      'Classic',
      'Placeholder demo model for the initial Go-Pods configurator scaffold.',
      '/globe.svg',
      18995,
      615,
      true,
      1
    ),
    (
      'pioneer',
      'Pioneer',
      'Placeholder demo model for showcasing a second catalogue path.',
      '/window.svg',
      21995,
      690,
      true,
      2
    )
  returning id, slug
),
inserted_categories as (
  insert into public.option_categories (
    slug,
    name,
    description,
    scope,
    active,
    sort_order
  )
  values
    (
      'touring-essentials',
      'Touring Essentials',
      'Placeholder practical accessories used to prove the schema.',
      'accessory',
      true,
      1
    ),
    (
      'comfort',
      'Comfort',
      'Placeholder interior comfort upgrades.',
      'accessory',
      true,
      2
    ),
    (
      'styling',
      'Styling',
      'Placeholder external styling upgrades for the MVP scaffold.',
      'styling',
      true,
      3
    )
  returning id, slug
),
inserted_options as (
  insert into public.options (
    category_id,
    slug,
    title,
    short_description,
    full_description,
    primary_image_url,
    scope,
    price,
    weight,
    applies_to_all_models,
    active,
    sort_order
  )
  values
    (
      (select id from inserted_categories where slug = 'touring-essentials'),
      'awning-rail-kit',
      'Awning rail kit',
      'Placeholder touring accessory.',
      'Placeholder descriptive copy for a practical touring upgrade.',
      '/globe.svg',
      'accessory',
      295,
      6,
      true,
      true,
      1
    ),
    (
      (select id from inserted_categories where slug = 'touring-essentials'),
      'battery-upgrade-pack',
      'Battery upgrade pack',
      'Placeholder power upgrade.',
      'Placeholder descriptive copy for an off-grid support option.',
      '/file.svg',
      'accessory',
      595,
      14,
      false,
      true,
      2
    ),
    (
      (select id from inserted_categories where slug = 'comfort'),
      'comfort-starter-pack',
      'Comfort starter pack',
      'Placeholder comfort package.',
      E'Placeholder package copy for bundled comfort upgrades.\n\n- Premium mattress topper',
      '/file.svg',
      'accessory',
      395,
      4,
      true,
      true,
      0
    ),
    (
      (select id from inserted_categories where slug = 'comfort'),
      'premium-mattress-topper',
      'Premium mattress topper',
      'Placeholder comfort option.',
      'Placeholder descriptive copy for an upgraded sleeping package.',
      '/file.svg',
      'accessory',
      225,
      4,
      true,
      true,
      1
    ),
    (
      (select id from inserted_categories where slug = 'styling'),
      'signature-graphics-pack',
      'Signature graphics pack',
      'Placeholder styling package.',
      'Placeholder descriptive copy for a branding and finish upgrade.',
      '/window.svg',
      'styling',
      375,
      0,
      true,
      true,
      1
    )
  returning id, slug
)
insert into public.model_specs (
  model_id,
  section_label,
  item_label,
  item_value,
  icon_path,
  sort_order
)
values
  (
    (select id from inserted_models where slug = 'classic'),
    'Sleeping',
    'Berths',
    '2 berth',
    '/globe.svg',
    1
  ),
  (
    (select id from inserted_models where slug = 'classic'),
    'Dimensions',
    'Overall length',
    'Placeholder 4.0m',
    '/window.svg',
    2
  ),
  (
    (select id from inserted_models where slug = 'classic'),
    'Kitchen',
    'Cooking provision',
    'Placeholder standard kitchenette',
    '/file.svg',
    3
  ),
  (
    (select id from inserted_models where slug = 'pioneer'),
    'Sleeping',
    'Berths',
    '2 berth',
    '/globe.svg',
    1
  ),
  (
    (select id from inserted_models where slug = 'pioneer'),
    'Dimensions',
    'Internal headroom',
    'Placeholder upgraded headroom',
    '/window.svg',
    2
  ),
  (
    (select id from inserted_models where slug = 'pioneer'),
    'Comfort',
    'Heating',
    'Placeholder premium heating option included',
    '/file.svg',
    3
  );

insert into public.model_images (
  model_id,
  image_path,
  alt_text,
  sort_order
)
values
  (
    (select id from public.models where slug = 'classic'),
    '/window.svg',
    'Classic model gallery placeholder',
    1
  ),
  (
    (select id from public.models where slug = 'pioneer'),
    '/globe.svg',
    'Pioneer model gallery placeholder',
    1
  );

insert into public.option_model_compatibility (option_id, model_id)
values
  (
    (select id from public.options where slug = 'battery-upgrade-pack'),
    (select id from public.models where slug = 'pioneer')
  );

insert into public.option_model_inclusions (option_id, model_id)
values
  (
    (select id from public.options where slug = 'premium-mattress-topper'),
    (select id from public.models where slug = 'pioneer')
  );

insert into public.option_package_inclusions (package_option_id, included_option_id)
values
  (
    (select id from public.options where slug = 'comfort-starter-pack'),
    (select id from public.options where slug = 'premium-mattress-topper')
  );

insert into public.option_images (
  option_id,
  image_path,
  alt_text,
  is_primary,
  sort_order
)
values
  (
    (select id from public.options where slug = 'awning-rail-kit'),
    '/globe.svg',
    'Placeholder image for awning rail kit',
    true,
    1
  ),
  (
    (select id from public.options where slug = 'signature-graphics-pack'),
    '/window.svg',
    'Placeholder image for graphics pack',
    true,
    1
  );

commit;
