-- Good Goods focused-v1 schema.
-- Safe to apply more than once in a Supabase SQL editor.

create extension if not exists pgcrypto;

do $$
begin
  create type public.order_status as enum (
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique,
  name text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  unit text not null,
  image_url text not null,
  rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  stock integer not null default 0 check (stock >= 0),
  delivery_minutes integer not null default 30 check (delivery_minutes > 0),
  tags text[] not null default '{}',
  badge text,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  currency varchar(3) not null default 'USD',
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  delivery_message text not null,
  minimum_order numeric(12, 2) not null default 0 check (minimum_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  note text,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_fee numeric(12, 2) not null check (delivery_fee >= 0),
  total numeric(12, 2) not null check (total = subtotal + delivery_fee),
  currency varchar(3) not null,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_active_featured_idx on public.products(active, featured desc);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read
on public.categories
for select
to anon, authenticated
using (active);

drop policy if exists products_public_read on public.products;
create policy products_public_read
on public.products
for select
to anon, authenticated
using (active);

drop policy if exists store_settings_public_read on public.store_settings;
create policy store_settings_public_read
on public.store_settings
for select
to anon, authenticated
using (true);

revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.store_settings from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;

grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.store_settings to anon, authenticated;

create or replace function public.create_order(
  p_customer_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_note text,
  p_items jsonb
)
returns table (
  id uuid,
  order_number text,
  subtotal numeric,
  delivery_fee numeric,
  total numeric,
  currency text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_product_id uuid;
  v_quantity integer;
  v_product public.products%rowtype;
  v_settings public.store_settings%rowtype;
  v_subtotal numeric(12, 2) := 0;
  v_delivery_fee numeric(12, 2);
  v_total numeric(12, 2);
begin
  if nullif(trim(p_customer_name), '') is null then
    raise exception 'Customer name is required.' using errcode = '22023';
  end if;
  if nullif(trim(p_phone), '') is null then
    raise exception 'Phone number is required.' using errcode = '22023';
  end if;
  if nullif(trim(p_address), '') is null then
    raise exception 'Delivery address is required.' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.' using errcode = '22023';
  end if;

  select settings.*
  into v_settings
  from public.store_settings as settings
  order by settings.id
  limit 1;

  if not found then
    raise exception 'Store settings are missing.' using errcode = 'P0001';
  end if;

  for v_product_id, v_quantity in
    select
      (entry.value ->> 'product_id')::uuid,
      sum((entry.value ->> 'quantity')::integer)::integer
    from jsonb_array_elements(p_items) as entry(value)
    group by (entry.value ->> 'product_id')::uuid
    order by (entry.value ->> 'product_id')::uuid
  loop
    if v_product_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception 'One or more products are unavailable.' using errcode = '22023';
    end if;

    select product.*
    into v_product
    from public.products as product
    where product.id = v_product_id and product.active
    for update;

    if not found or v_product.stock < v_quantity then
      raise exception 'One or more products are unavailable.' using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  if v_subtotal < v_settings.minimum_order then
    raise exception 'Order does not meet the store minimum.' using errcode = 'P0001';
  end if;

  v_order_number := 'GG-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  v_delivery_fee := v_settings.delivery_fee;
  v_total := v_subtotal + v_delivery_fee;

  insert into public.orders (
    id,
    order_number,
    customer_name,
    phone,
    email,
    address,
    note,
    subtotal,
    delivery_fee,
    total,
    currency
  )
  values (
    v_order_id,
    v_order_number,
    trim(p_customer_name),
    trim(p_phone),
    nullif(trim(p_email), ''),
    trim(p_address),
    nullif(trim(p_note), ''),
    v_subtotal,
    v_delivery_fee,
    v_total,
    v_settings.currency
  );

  for v_product_id, v_quantity in
    select
      (entry.value ->> 'product_id')::uuid,
      sum((entry.value ->> 'quantity')::integer)::integer
    from jsonb_array_elements(p_items) as entry(value)
    group by (entry.value ->> 'product_id')::uuid
    order by (entry.value ->> 'product_id')::uuid
  loop
    select product.*
    into v_product
    from public.products as product
    where product.id = v_product_id;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit,
      unit_price,
      quantity
    )
    values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.unit,
      v_product.price,
      v_quantity
    );

    update public.products
    set stock = stock - v_quantity
    where products.id = v_product_id;
  end loop;

  return query
  select
    placed.id,
    placed.order_number,
    placed.subtotal,
    placed.delivery_fee,
    placed.total,
    placed.currency::text
  from public.orders as placed
  where placed.id = v_order_id;
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, text, jsonb)
to anon, authenticated;

insert into public.categories (id, name, sort_order, active)
values
  ('10000000-0000-4000-8000-000000000001', 'Fresh', 1, true),
  ('10000000-0000-4000-8000-000000000002', 'Pantry', 2, true),
  ('10000000-0000-4000-8000-000000000003', 'Bakery', 3, true),
  ('10000000-0000-4000-8000-000000000004', 'Home', 4, true)
on conflict (id) do nothing;

insert into public.store_settings (
  id,
  currency,
  delivery_fee,
  delivery_message,
  minimum_order
)
values (1, 'USD', 2.50, 'Today, before dinner', 0)
on conflict (id) do nothing;

insert into public.products (
  id,
  category_id,
  slug,
  name,
  description,
  price,
  unit,
  image_url,
  rating,
  stock,
  delivery_minutes,
  tags,
  badge,
  featured,
  active
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'weekend-market-basket',
    'Weekend Market Basket',
    'Greens, tomatoes, sourdough, and pantry staples packed as one easy restock.',
    36.00,
    'bundle',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85',
    4.9,
    12,
    28,
    array['bundle', 'produce', 'weekend', 'market'],
    'Best seller',
    true,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'organic-tomatoes',
    'Organic Tomatoes',
    'Bright, firm tomatoes selected for salads, sandwiches, and sauces.',
    4.50,
    'lb',
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=900&q=85',
    4.8,
    28,
    22,
    array['vegetable', 'salad', 'organic'],
    'Fresh today',
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'cold-pressed-juice',
    'Cold Pressed Juice',
    'Small-batch citrus, carrot, and ginger juice with no added sugar.',
    6.75,
    'bottle',
    'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=85',
    4.7,
    18,
    24,
    array['drink', 'citrus', 'ginger'],
    null,
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    'extra-virgin-olive-oil',
    'Extra Virgin Olive Oil',
    'Smooth everyday olive oil for cooking, dressings, and finishing.',
    18.00,
    '500 ml',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=85',
    4.6,
    9,
    30,
    array['cooking', 'oil', 'dressing'],
    'Small batch',
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    'bronze-cut-pasta',
    'Bronze Cut Pasta',
    'Slow-dried rigatoni with a textured surface that holds sauce well.',
    5.80,
    'pack',
    'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=900&q=85',
    4.5,
    21,
    30,
    array['pasta', 'dinner', 'italian'],
    null,
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000003',
    'country-sourdough',
    'Country Sourdough',
    'A naturally leavened loaf with a crisp crust and tender crumb.',
    7.25,
    'loaf',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
    4.9,
    14,
    26,
    array['bread', 'breakfast', 'baked'],
    'Baked today',
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000004',
    'linen-kitchen-towels',
    'Linen Kitchen Towels',
    'Absorbent, quick-drying linen towels made for everyday kitchen work.',
    14.00,
    'set of 2',
    'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=900&q=85',
    4.4,
    15,
    34,
    array['linen', 'kitchen', 'towels'],
    null,
    false,
    true
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000004',
    'beeswax-food-wraps',
    'Beeswax Food Wraps',
    'Reusable cotton wraps for bread, produce, bowls, and packed lunches.',
    12.00,
    'set of 3',
    'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=900&q=85',
    4.5,
    17,
    34,
    array['reusable', 'storage', 'kitchen'],
    'Low waste',
    false,
    true
  )
on conflict (id) do nothing;
