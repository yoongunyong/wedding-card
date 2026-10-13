-- ========================================================
-- invitations 테이블에 서비스 만료일시(service_expired_at) 컬럼 추가
-- ========================================================
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS service_expired_at TIMESTAMPTZ;

-- 기존에 생성된 청첩장들에 대해 예식일 기준 1년 뒤로 기본 만료일 세팅
-- (wedding_date가 있는 경우 예식일 + 1년, 없는 경우 생성일 + 1년)
UPDATE invitations
SET service_expired_at = (wedding_date::timestamp + INTERVAL '1 year')
WHERE service_expired_at IS NULL AND wedding_date IS NOT NULL;

UPDATE invitations
SET service_expired_at = (created_at + INTERVAL '1 year')
WHERE service_expired_at IS NULL;
