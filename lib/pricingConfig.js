import { supabase } from '@/lib/supabase';

export const DEFAULT_PRICING = {
  regular_price: 59000,
  discount_price: 39000,
  discount_rate: 34,
  badge_text: '런칭 기념 34% 특별 할인가',
  period_text: '런칭 한정 특가 (종료 시 59,000원 환원)',
  naver_store_url: 'https://smartstore.naver.com',
  is_event_active: true,
};

export const SITE_SETTINGS_SQL = `-- Supabase SQL Editor에 복사하여 실행하시면 실시간 가격 변경이 즉시 영구 저장됩니다.
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 누구나 읽기 가능
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow admin write site_settings" ON public.site_settings;
CREATE POLICY "Allow admin write site_settings"
  ON public.site_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- 초기 기본 가격 데이터 삽입
INSERT INTO public.site_settings (key, value)
VALUES (
  'pricing',
  '{
    "regular_price": 59000,
    "discount_price": 39000,
    "discount_rate": 34,
    "badge_text": "런칭 기념 34% 특별 할인가",
    "period_text": "런칭 한정 특가 (종료 시 59,000원 환원)",
    "naver_store_url": "https://smartstore.naver.com",
    "is_event_active": true
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
`;

/**
 * 최신 가격 및 프로모션 설정 불러오기
 */
export async function getPricingConfig() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'pricing')
      .maybeSingle();

    if (!error && data?.value) {
      return { ...DEFAULT_PRICING, ...data.value };
    }
  } catch (err) {
    console.warn('site_settings fetch error, fallback to default:', err);
  }

  // 브라우저 로컬스토리지 백업 확인
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('wedding_card_pricing_config');
      if (local) {
        return { ...DEFAULT_PRICING, ...JSON.parse(local) };
      }
    } catch (_) {}
  }

  return DEFAULT_PRICING;
}

/**
 * 가격 및 프로모션 설정 저장하기
 */
export async function savePricingConfig(newConfig) {
  const merged = { ...DEFAULT_PRICING, ...newConfig };

  // 1. 브라우저 로컬 즉각 백업
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('wedding_card_pricing_config', JSON.stringify(merged));
    } catch (_) {}
  }

  // 2. Supabase DB 저장
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'pricing',
        value: merged,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      return { success: false, error: error.message, fallbackSaved: true, config: merged };
    }

    return { success: true, config: merged };
  } catch (err) {
    return { success: false, error: err.message, fallbackSaved: true, config: merged };
  }
}
