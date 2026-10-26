-- ========================================================
-- guest_photos 테이블 생성 및 RLS 정책 설정
-- 하객 현장 스냅 사진 (신랑·신부 전용 비공개 보관함)
-- ========================================================

CREATE TABLE IF NOT EXISTS guest_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender_name TEXT NOT NULL,
  message TEXT,
  photo_url TEXT NOT NULL,
  file_size BIGINT
);

-- 인덱스 생성 (청첩장별 조회 속도 최적화)
CREATE INDEX IF NOT EXISTS idx_guest_photos_invitation_id ON guest_photos(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guest_photos_created_at ON guest_photos(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE guest_photos ENABLE ROW LEVEL SECURITY;

-- 1. 하객 사진 업로드 (INSERT) 허용
DROP POLICY IF EXISTS "Allow public insert guest_photos" ON guest_photos;
CREATE POLICY "Allow public insert guest_photos" ON guest_photos 
  FOR INSERT WITH CHECK (true);

-- 2. 신랑·신부 관리자 페이지에서 조회 (SELECT) 허용
DROP POLICY IF EXISTS "Allow public select guest_photos" ON guest_photos;
CREATE POLICY "Allow public select guest_photos" ON guest_photos 
  FOR SELECT USING (true);

-- 3. 신랑·신부 관리자 페이지에서 사진 개별 삭제 (DELETE) 허용
DROP POLICY IF EXISTS "Allow public delete guest_photos" ON guest_photos;
CREATE POLICY "Allow public delete guest_photos" ON guest_photos 
  FOR DELETE USING (true);
