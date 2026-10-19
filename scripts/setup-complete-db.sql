-- ========================================================
-- ATELIER DE MUKIRU : 운영 DB(Prod) 100% 복제용 개발 DB 생성 스크립트
-- 운영 DB의 information_schema 스펙을 1:1로 정밀 반영한 완벽한 DDL입니다.
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 1. invitations (청첩장 메인 테이블)
-- ========================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  slug TEXT NOT NULL UNIQUE,
  groom_name TEXT NOT NULL,
  bride_name TEXT NOT NULL,
  groom_father TEXT,
  groom_mother TEXT,
  bride_father TEXT,
  bride_mother TEXT,
  wedding_date TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  venue_detail TEXT,
  message TEXT,
  accounts JSONB DEFAULT '[]'::jsonb,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  bgm_url TEXT,
  bgm_mode TEXT DEFAULT 'preset'::text,
  template_type TEXT DEFAULT 'modern'::text,
  manage_token UUID DEFAULT gen_random_uuid(),
  groom_name_en TEXT,
  bride_name_en TEXT,
  groom_phone TEXT,
  groom_father_phone TEXT,
  groom_mother_phone TEXT,
  bride_phone TEXT,
  bride_father_phone TEXT,
  bride_mother_phone TEXT,
  images JSONB DEFAULT '{}'::jsonb,
  transportation JSONB DEFAULT '[]'::jsonb,
  info_notices JSONB DEFAULT '[]'::jsonb,
  template_config JSONB DEFAULT '{}'::jsonb,
  quote_content TEXT,
  quote_source TEXT,
  groom_first_name_en TEXT,
  groom_last_name_en TEXT,
  bride_first_name_en TEXT,
  bride_last_name_en TEXT,
  main_names_en TEXT,
  groom_relation TEXT DEFAULT '장남'::text,
  groom_father_deceased BOOLEAN DEFAULT false,
  groom_mother_deceased BOOLEAN DEFAULT false,
  bride_relation TEXT DEFAULT '장녀'::text,
  bride_father_deceased BOOLEAN DEFAULT false,
  bride_mother_deceased BOOLEAN DEFAULT false,
  venue_hall TEXT,
  is_active BOOLEAN DEFAULT false,
  order_code TEXT,
  service_expired_at TIMESTAMPTZ,
  interviews JSONB DEFAULT '[]'::jsonb
);

-- ========================================================
-- 2. rsvp (참석 여부 전달 테이블)
-- ========================================================
CREATE TABLE IF NOT EXISTS rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  side TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  attend BOOLEAN NOT NULL,
  companion_count INTEGER DEFAULT 0,
  meal TEXT,
  memo TEXT,
  bus TEXT
);

-- ========================================================
-- 3. guestbook (방명록 테이블)
-- ========================================================
CREATE TABLE IF NOT EXISTS guestbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  password TEXT NOT NULL,
  content TEXT NOT NULL
);

-- ========================================================
-- 4. order_codes (1회용 인증코드 테이블)
-- ========================================================
CREATE TABLE IF NOT EXISTS order_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'store'::text,
  note TEXT,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  used_by_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- 5. RLS (Row Level Security) 정책 설정
-- ========================================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read invitations" ON invitations;
CREATE POLICY "Allow public read invitations" ON invitations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert invitations" ON invitations;
CREATE POLICY "Allow public insert invitations" ON invitations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update invitations" ON invitations;
CREATE POLICY "Allow public update invitations" ON invitations FOR UPDATE USING (true);

ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read rsvp" ON rsvp;
CREATE POLICY "Allow public read rsvp" ON rsvp FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert rsvp" ON rsvp;
CREATE POLICY "Allow public insert rsvp" ON rsvp FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update rsvp" ON rsvp;
CREATE POLICY "Allow public update rsvp" ON rsvp FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete rsvp" ON rsvp;
CREATE POLICY "Allow public delete rsvp" ON rsvp FOR DELETE USING (true);

ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read guestbook" ON guestbook;
CREATE POLICY "Allow public read guestbook" ON guestbook FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert guestbook" ON guestbook;
CREATE POLICY "Allow public insert guestbook" ON guestbook FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete guestbook" ON guestbook;
CREATE POLICY "Allow public delete guestbook" ON guestbook FOR DELETE USING (true);

ALTER TABLE order_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read order_codes" ON order_codes;
CREATE POLICY "Allow public read order_codes" ON order_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert order_codes" ON order_codes;
CREATE POLICY "Allow public insert order_codes" ON order_codes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update order_codes" ON order_codes;
CREATE POLICY "Allow public update order_codes" ON order_codes FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete order_codes" ON order_codes;
CREATE POLICY "Allow public delete order_codes" ON order_codes FOR DELETE USING (true);

-- ========================================================
-- 6. Storage (스토리지 버킷 및 권한 설정)
-- ========================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wedding-images', 'wedding-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('bgm', 'bgm', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access wedding-images" ON storage.objects;
CREATE POLICY "Public Access wedding-images" ON storage.objects FOR ALL USING (bucket_id = 'wedding-images') WITH CHECK (bucket_id = 'wedding-images');

DROP POLICY IF EXISTS "Public Access bgm" ON storage.objects;
CREATE POLICY "Public Access bgm" ON storage.objects FOR ALL USING (bucket_id = 'bgm') WITH CHECK (bucket_id = 'bgm');
