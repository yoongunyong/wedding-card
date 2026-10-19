-- ========================================================
-- rsvp 테이블 RLS (Row Level Security) 정책 보강
-- 1. 하객 참석정보 재제출 시 덮어쓰기 (UPDATE) 허용
-- 2. 신랑/신부 관리자 페이지에서 참석정보 삭제 (DELETE) 허용
-- ========================================================

ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리 및 재등록
DROP POLICY IF EXISTS "Allow public read rsvp" ON rsvp;
CREATE POLICY "Allow public read rsvp" ON rsvp FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert rsvp" ON rsvp;
CREATE POLICY "Allow public insert rsvp" ON rsvp FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update rsvp" ON rsvp;
CREATE POLICY "Allow public update rsvp" ON rsvp FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete rsvp" ON rsvp;
CREATE POLICY "Allow public delete rsvp" ON rsvp FOR DELETE USING (true);
