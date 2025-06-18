-- Supabase Inventory POS: Core Schema
-- Custom Types
CREATE TYPE public.product_status AS ENUM ('active', 'archived', 'draft');
CREATE TYPE public.order_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank_transfer', 'pos_machine', 'wallet_credit');
CREATE TYPE public.adjustment_type AS ENUM ('manual_count', 'damage', 'theft', 'other', 'po_received');
CREATE TYPE public.po_status AS ENUM ('pending', 'ordered', 'partially_received', 'received', 'cancelled');

-- Tables
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.brands (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  slug TEXT UNIQUE,
  cost_price NUMERIC(10, 2),
  selling_price NUMERIC(10, 2) NOT NULL,
  regular_price NUMERIC(10, 2) NOT NULL,
  quantity_on_hand INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES public.categories(id),
  brand_id INTEGER REFERENCES public.brands(id),
  model_name TEXT NOT NULL,
  supplier_id INTEGER REFERENCES public.suppliers(id),
  status public.product_status DEFAULT 'draft',
  tags TEXT[],
  reorder_level INTEGER DEFAULT 0,
  stock_status TEXT,
  featured BOOLEAN DEFAULT false,
  catalog_visibility BOOLEAN DEFAULT true,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_variants (
  id SERIAL PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  sku_variant TEXT UNIQUE,
  color TEXT,
  size TEXT,
  price_variant NUMERIC(10, 2),
  quantity_variant INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_images (
  id SERIAL PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES public.product_variants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT product_or_variant_image CHECK (product_id IS NOT NULL OR variant_id IS NOT NULL)
);

CREATE TABLE public.customers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone_number TEXT UNIQUE,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES public.customers(id),
  user_id UUID REFERENCES auth.users(id),
  status public.order_status DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  final_amount NUMERIC(10, 2) NOT NULL,
  payment_method public.payment_method,
  transaction_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id INTEGER REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  price_per_item NUMERIC(10, 2) NOT NULL,
  discount_per_item NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.stock_adjustments (
  id SERIAL PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  variant_id INTEGER REFERENCES public.product_variants(id),
  user_id UUID REFERENCES auth.users(id),
  adjustment_type public.adjustment_type NOT NULL,
  quantity_changed INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.purchase_orders (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES public.suppliers(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status public.po_status DEFAULT 'pending',
  expected_delivery_date DATE,
  total_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  variant_id INTEGER REFERENCES public.product_variants(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  cost_per_item NUMERIC(10,2),
  total_cost NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- List of all tables and types:
-- Types: product_status, order_status, payment_method, adjustment_type, po_status
-- Tables: user_profiles, roles, user_roles, categories, suppliers, products, product_variants, product_images, customers, orders, order_items, stock_adjustments, purchase_orders, purchase_order_items
