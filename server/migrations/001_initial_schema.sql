CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (menu_id, name)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'preparing', 'completed')),
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE RESTRICT,
  menu_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  line_total INTEGER NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE IF NOT EXISTS order_item_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  option_id UUID NOT NULL REFERENCES options(id) ON DELETE RESTRICT,
  option_name VARCHAR(100) NOT NULL,
  option_price INTEGER NOT NULL CHECK (option_price >= 0),
  UNIQUE (order_item_id, option_id)
);

CREATE INDEX IF NOT EXISTS orders_ordered_at_idx ON orders (ordered_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

INSERT INTO menus (id, name, description, price, image_url, stock_quantity)
VALUES
  ('10000000-0000-4000-8000-000000000001', '아메리카노 (ICE)', '산뜻한 산미와 깔끔한 여운의 아이스 커피', 4000, NULL, 10),
  ('10000000-0000-4000-8000-000000000002', '아메리카노 (HOT)', '깊은 향을 따뜻하게 즐기는 클래식 커피', 4000, NULL, 10),
  ('10000000-0000-4000-8000-000000000003', '카페라떼', '부드러운 우유와 에스프레소의 조화', 5000, NULL, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO options (id, menu_id, name, price)
VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '샷 추가', 500),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '시럽 추가', 0),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '샷 추가', 500),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', '시럽 추가', 0),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', '샷 추가', 500),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', '시럽 추가', 0)
ON CONFLICT (id) DO NOTHING;
