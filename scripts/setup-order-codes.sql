-- ========================================================
-- 1. invitations 테이블에 활성화(is_active) 및 주문코드(order_code) 컬럼 추가
-- ========================================================
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS order_code TEXT;

-- 기존에 생성된 대표님 테스트용 청첩장이 있다면 활성화 처리
UPDATE invitations SET is_active = true WHERE is_active IS NULL;

-- ========================================================
-- 2. 1회용 주문/선물 인증코드 테이블 생성 (order_codes)
-- ========================================================
CREATE TABLE IF NOT EXISTS order_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'store', -- 'store' (스마트스토어) | 'gift' (지인 선물)
  note TEXT,                 -- 구매자 성함 또는 메모 (예: "네이버 홍길동", "친구 민수")
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  used_by_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- 3. RLS(Row Level Security) 정책 설정
-- ========================================================
ALTER TABLE order_codes ENABLE ROW LEVEL SECURITY;

-- 코드 조회 허용 (생성 폼에서 코드 유효성 검증용)
DROP POLICY IF EXISTS "Allow public read order_codes" ON order_codes;
CREATE POLICY "Allow public read order_codes" ON order_codes FOR SELECT USING (true);

-- 코드 생성 허용 (관리자 페이지에서 신규 코드 발행용)
DROP POLICY IF EXISTS "Allow public insert order_codes" ON order_codes;
CREATE POLICY "Allow public insert order_codes" ON order_codes FOR INSERT WITH CHECK (true);

-- 코드 사용 처리 허용 (청첩장 생성 시 is_used = true 업데이트용)
DROP POLICY IF EXISTS "Allow public update order_codes" ON order_codes;
CREATE POLICY "Allow public update order_codes" ON order_codes FOR UPDATE USING (true);

-- 코드 삭제 허용 (관리자 페이지에서 삭제용)
DROP POLICY IF EXISTS "Allow public delete order_codes" ON order_codes;
CREATE POLICY "Allow public delete order_codes" ON order_codes FOR DELETE USING (true);
