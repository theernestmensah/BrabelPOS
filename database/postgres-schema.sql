-- BrAbelPOS production database blueprint.
-- Use this as the canonical PostgreSQL schema before wiring a real repository.

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  city text,
  currency char(3) not null default 'GHS',
  tax_rate numeric(7, 6) not null default 0.125,
  created_at timestamptz not null default now()
);

create table if not exists terminals (
  id text primary key,
  branch_id uuid not null references branches(id),
  label text not null,
  last_seen_at timestamptz
);

create table if not exists staff_members (
  id text primary key,
  branch_id uuid not null references branches(id),
  full_name text not null,
  role text not null,
  pin_hash text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  organization_id uuid not null references organizations(id),
  sku text,
  barcode text,
  name text not null,
  category text not null,
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'GHS',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_org_sku_uidx
  on products(organization_id, sku)
  where sku is not null;

create unique index if not exists products_org_barcode_uidx
  on products(organization_id, barcode)
  where barcode is not null;

create table if not exists stock_movements (
  id text primary key,
  branch_id uuid not null references branches(id),
  product_id text not null references products(id),
  sale_id text,
  type text not null check (
    type in ('sale', 'return', 'purchase', 'adjustment', 'transfer', 'damage')
  ),
  quantity_delta integer not null,
  reason text not null,
  staff_id text not null references staff_members(id),
  terminal_id text not null references terminals(id),
  created_at timestamptz not null default now()
);

create table if not exists cash_shifts (
  id text primary key,
  branch_id uuid not null references branches(id),
  terminal_id text not null references terminals(id),
  cashier_id text not null references staff_members(id),
  opened_at timestamptz not null,
  closed_at timestamptz,
  opening_float_cents integer not null default 0,
  cash_sales_cents integer not null default 0,
  expected_cash_cents integer not null default 0,
  counted_cash_cents integer,
  variance_cents integer,
  status text not null check (status in ('open', 'closed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales (
  id text primary key,
  branch_id uuid not null references branches(id),
  terminal_id text not null references terminals(id),
  cashier_id text not null references staff_members(id),
  shift_id text references cash_shifts(id),
  payment_method text not null check (payment_method in ('cash', 'momo', 'card')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  tax_cents integer not null check (tax_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency char(3) not null default 'GHS',
  tax_rate numeric(7, 6) not null,
  client_timestamp timestamptz not null,
  server_received_at timestamptz not null default now(),
  voided_at timestamptz,
  unique (branch_id, terminal_id, id)
);

create table if not exists sale_items (
  id bigserial primary key,
  sale_id text not null references sales(id),
  product_id text not null references products(id),
  name_snapshot text not null,
  category_snapshot text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create table if not exists payments (
  id text primary key,
  sale_id text not null references sales(id),
  method text not null check (method in ('cash', 'momo', 'card')),
  amount_cents integer not null check (amount_cents >= 0),
  provider text,
  provider_reference text,
  status text not null check (status in ('pending', 'authorized', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create table if not exists sync_operations (
  operation_id text primary key,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  actor_id text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_idx
  on stock_movements(product_id, created_at);

create index if not exists sales_branch_time_idx
  on sales(branch_id, server_received_at desc);

create index if not exists audit_logs_entity_idx
  on audit_logs(entity_type, entity_id, created_at desc);
